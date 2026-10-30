<?php
// Paying for a confirmed booking: by card through PayHere (when its keys are
// in the config) or by bank transfer (details set in Admin → Settings).
// Guests reach their payment page through a private link in the
// "confirmed" email: /pay/?ref=HB-XXXXXX&t=<token>.
defined('HELSY_API') || exit;

/* ------------------------------------------------------------------
   PayHere (https://support.payhere.lk/api-&-mobile-sdk/checkout-api)
------------------------------------------------------------------- */
function payhere_config(): array
{
    return helsy_config()['payhere'];
}

function payhere_enabled(): bool
{
    $c = payhere_config();
    return trim((string)$c['merchant_id']) !== '' && trim((string)$c['merchant_secret']) !== '';
}

function payhere_checkout_url(): string
{
    return payhere_config()['sandbox'] ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout';
}

// Amounts are sent and signed with 2 decimals and no thousands separator
function payhere_amount(int $amount): string
{
    return number_format($amount, 2, '.', '');
}

function payhere_secret_md5(): string
{
    return strtoupper(md5((string)payhere_config()['merchant_secret']));
}

function payhere_hash(string $orderId, string $amount, string $currency): string
{
    return strtoupper(md5(payhere_config()['merchant_id'] . $orderId . $amount . $currency . payhere_secret_md5()));
}

// Signature PayHere puts on a payment notification (uses the amount exactly as sent)
function payhere_notify_sig(string $orderId, string $amount, string $currency, string $statusCode): string
{
    return strtoupper(md5(payhere_config()['merchant_id'] . $orderId . $amount . $currency . $statusCode . payhere_secret_md5()));
}

const PAYHERE_STATUS = ['2' => 'success', '0' => 'pending', '-1' => 'cancelled', '-2' => 'failed', '-3' => 'chargeback'];

/* ------------------------------------------------------------------
   Payment details for a booking
------------------------------------------------------------------- */
function payment_settings(): array
{
    $s = get_settings();
    return [
        'bankDetails' => trim((string)($s['bankDetails'] ?? '')),
        'dueDays' => max(0, (int)($s['paymentDueDays'] ?? 14)),
    ];
}

// Payment is due a set number of days before arrival. For short-notice
// bookings that leaves too little time, so they get 2 days (never later
// than the arrival day).
function payment_due_for(string $checkIn): string
{
    $today = date('Y-m-d');
    $due = add_days($checkIn, -payment_settings()['dueDays']);
    $soonest = min(add_days($today, 2), max($today, $checkIn));
    return max($due, $soonest);
}

function is_paid(array $b): bool
{
    return $b['paidAmount'] > 0 && $b['paidAmount'] >= $b['total'];
}

// The private token in a booking's payment link, created the first time it's needed
function ensure_pay_token(int $bookingId): string
{
    $q = db()->prepare('SELECT pay_token FROM bookings WHERE id = ?');
    $q->execute([$bookingId]);
    $token = (string)$q->fetchColumn();
    if ($token === '') {
        $token = bin2hex(random_bytes(16));
        db()->prepare('UPDATE bookings SET pay_token = ? WHERE id = ?')->execute([$token, $bookingId]);
    }
    return $token;
}

// https://www.thehelsybentota.com (from the current request)
function site_origin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = preg_replace('/[^a-z0-9.:\-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'www.thehelsybentota.com'));
    return ($https ? 'https://' : 'http://') . $host;
}

function pay_url(array $b): string
{
    return site_origin() . '/pay/?ref=' . rawurlencode($b['ref']) . '&t=' . ensure_pay_token($b['id']);
}

// The booking a payment link points to, or null when the link is wrong
function booking_for_pay_link(string $ref, string $token): ?array
{
    if (!preg_match('/^HB-[A-Z0-9]{6}$/', $ref) || !preg_match('/^[a-f0-9]{32}$/', $token)) return null;
    $q = db()->prepare('SELECT * FROM bookings WHERE ref = ?');
    $q->execute([$ref]);
    $row = $q->fetch();
    if (!$row || $row['pay_token'] === '' || !hash_equals($row['pay_token'], $token)) return null;
    return booking_out($row);
}

// "How to pay" part of the "confirmed" email
function payment_email_html(array $b): string
{
    if ($b['total'] <= 0 || is_paid($b)) return '';
    $p = payment_settings();
    $card = payhere_enabled();
    if (!$card && $p['bankDetails'] === '') return '';

    $due = $b['paymentDue'] ?: payment_due_for($b['checkIn']);
    $html = '<div style="margin:22px 0 0;padding:16px 18px;background:#f7f5ef;border-radius:6px">'
        . '<div style="font-size:16px;color:#222;margin-bottom:6px"><b>How to pay</b></div>'
        . '<p style="margin:0 0 12px">Please pay <b>' . e(money($b['total'], $b['currency'])) . '</b> by <b>' . e(nice_date($due)) . '</b>.</p>';
    if ($card) {
        $html .= '<p style="margin:0 0 14px"><a href="' . e(pay_url($b)) . '" style="display:inline-block;background:#0f1010;color:#f4f2ee;'
            . 'padding:11px 20px;border-radius:4px;text-decoration:none;font-weight:bold">Pay online by card</a></p>';
    }
    if ($p['bankDetails'] !== '') {
        $html .= '<p style="margin:0 0 4px">' . ($card ? 'Or pay by bank transfer:' : 'Please pay by bank transfer:') . '</p>'
            . '<p style="margin:0 0 10px;padding:10px 12px;background:#fff;border:1px solid #e6e2d6;border-radius:4px;font-family:Consolas,monospace;font-size:13px">'
            . nl2br(e($p['bankDetails'])) . '</p>'
            . '<p style="margin:0 0 10px">Use <b>' . e($b['ref']) . '</b> as the payment reference.</p>';
    }
    return $html . '<p style="margin:0;font-size:13px;color:#777">Our bank details will never change by email. '
        . 'If you receive a message saying otherwise, please call us before paying.</p></div>';
}

/* ------------------------------------------------------------------
   Recording a payment
------------------------------------------------------------------- */
// Marks a booking paid and emails the owners and the guest. Returns false
// when it was already paid (so a repeated notification sends nothing).
function mark_booking_paid(int $bookingId, int $amount, string $method, string $ref): bool
{
    // Only one request can move a booking from unpaid to paid
    $up = db()->prepare('UPDATE bookings SET paid_amount = ?, paid_at = ?, payment_method = ?, payment_ref = ?, updated_at = ?
        WHERE id = ? AND (paid_amount = 0 OR paid_amount < total)');
    $up->execute([$amount, now(), $method, $ref, now(), $bookingId]);
    if ($up->rowCount() === 0) return false;
    $b = find_booking($bookingId);
    $room = find_room($b['roomId']);
    $how = $method === 'card' ? 'by card (PayHere)' : 'by bank transfer';
    $rows = [
        'Reference' => $b['ref'],
        'Room' => $room['name'] ?? '',
        'Check-in' => nice_date($b['checkIn']),
        'Check-out' => nice_date($b['checkOut']),
        'Amount paid' => money($amount, $b['currency']) . ' ' . $how,
    ];
    if ($ref !== '') $rows['Payment ID'] = $ref;

    send_mail(
        notify_emails(),
        "Payment received – {$b['ref']} (" . money($amount, $b['currency']) . ')',
        email_html('Payment received', e($b['name']) . ' has paid for their booking ' . $how . '.', $rows + ['Guest' => $b['name']]),
        $b['email'] ?: null,
        $b['name']
    );
    if ($method === 'card' && $b['email']) {
        send_mail(
            $b['email'],
            "Payment received – thank you ({$b['ref']})",
            email_html('Thank you, ' . $b['name'], 'We\'ve received your payment – your stay at The Helsy Bentota is all set. We look forward to welcoming you.', $rows),
            notify_emails()[0] ?? null,
            'The Helsy Bentota'
        );
    }
    return true;
}
