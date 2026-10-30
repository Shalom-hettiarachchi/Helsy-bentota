<?php
// POST /api/payhere-notify.php – PayHere tells us a payment's result here
// (server to server; the guest's browser never opens it). The signature is
// checked before anything is recorded, and the booking is only marked paid
// for a successful payment of the full amount.
require __DIR__ . '/lib/bootstrap.php';

require_method('POST');
$p = $_POST;
$orderId = (string)($p['order_id'] ?? '');
$amount = (string)($p['payhere_amount'] ?? '');
$currency = (string)($p['payhere_currency'] ?? '');
$code = (string)($p['status_code'] ?? '');

if (!payhere_enabled()) fail('Payments are not set up.', 503);
$validSig = hash_equals(payhere_notify_sig($orderId, $amount, $currency, $code), strtoupper((string)($p['md5sig'] ?? '')));
if (!$validSig || !hash_equals((string)payhere_config()['merchant_id'], (string)($p['merchant_id'] ?? ''))) {
    log_error('PayHere notify with a bad signature for order ' . substr($orderId, 0, 40) . ' from ' . client_ip());
    fail('Bad signature.', 403);
}

// HB-XXXXXX-ab12 → HB-XXXXXX
$ref = preg_replace('/-[a-f0-9]{4}$/', '', $orderId);
$q = db()->prepare('SELECT * FROM bookings WHERE ref = ?');
$q->execute([$ref]);
$row = $q->fetch();
if (!$row) {
    log_error("PayHere notify for unknown order $orderId");
    fail('Unknown order.', 404);
}
$b = booking_out($row);
$paid = (int)round((float)$amount);
$status = PAYHERE_STATUS[$code] ?? 'unknown';
$paymentId = substr((string)($p['payment_id'] ?? ''), 0, 80);

db()->prepare('INSERT INTO payments (booking_id, provider, provider_ref, order_id, amount, currency, status, method, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([
    $b['id'], 'payhere', $paymentId, substr($orderId, 0, 40), $paid, substr($currency, 0, 8), $status,
    substr((string)($p['method'] ?? ''), 0, 20), substr((string)($p['status_message'] ?? ''), 0, 255), now(),
]);

if ($status === 'success') {
    if ($currency === $b['currency'] && $paid >= $b['total']) {
        mark_booking_paid($b['id'], $paid, 'card', $paymentId);
    } else {
        log_error("PayHere payment $paymentId for {$b['ref']} was $amount $currency, expected {$b['total']} {$b['currency']} – not marked paid");
        send_mail(notify_emails(), "Check payment for {$b['ref']}",
            email_html('Payment needs checking', 'PayHere reported a payment that doesn\'t match the booking total, so it was not marked as paid.', [
                'Reference' => $b['ref'], 'Paid' => "$amount $currency", 'Booking total' => money($b['total'], $b['currency']), 'Payment ID' => $paymentId,
            ]));
    }
} elseif ($status === 'chargeback') {
    send_mail(notify_emails(), "Chargeback on {$b['ref']}",
        email_html('Card payment reversed', 'The guest\'s bank has reversed (charged back) a card payment for this booking. Please check it in your PayHere account.', [
            'Reference' => $b['ref'], 'Guest' => $b['name'], 'Amount' => "$amount $currency", 'Payment ID' => $paymentId,
        ]));
}

json_out(['received' => true]);
