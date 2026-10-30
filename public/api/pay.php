<?php
// /api/pay.php – the guest's payment page (/pay/?ref=…&t=…).
//   GET  ?ref=&t=                  booking summary, payment status and how to pay
//   POST {ref, t} (action=checkout) the signed PayHere form for a card payment
// The ref + private token from the "confirmed" email is the only way in.
require __DIR__ . '/lib/bootstrap.php';

$method = require_method('GET', 'POST');
$in = $method === 'POST' ? input() : $_GET;
throttle_or_fail('pay:' . client_ip(), 60, 600);

$b = booking_for_pay_link((string)($in['ref'] ?? ''), (string)($in['t'] ?? ''));
if (!$b) fail('This payment link is not valid. Please use the link in your confirmation email, or contact us.', 404);
$room = find_room($b['roomId']);
$settings = get_settings();
$payments = payment_settings();
$canPay = $b['status'] === 'confirmed' && $b['total'] > 0 && !is_paid($b);

if ($method === 'GET') {
    $due = $b['paymentDue'] ?: payment_due_for($b['checkIn']);
    json_out([
        'booking' => [
            'ref' => $b['ref'],
            'room' => $room['name'] ?? '',
            'checkIn' => $b['checkIn'],
            'checkOut' => $b['checkOut'],
            'nights' => $b['nights'],
            'adults' => $b['adults'],
            'children' => $b['children'],
            'name' => $b['name'],
            'total' => $b['total'],
            'currency' => $b['currency'],
            'status' => $b['status'],
            'paid' => is_paid($b),
            'paidAt' => $b['paidAt'],
            'paymentMethod' => $b['paymentMethod'],
            'due' => $due,
        ],
        'card' => $canPay && payhere_enabled(),
        'sandbox' => payhere_enabled() && (bool)payhere_config()['sandbox'],
        // Bank details only go to guests whose booking is confirmed
        'bankDetails' => $canPay ? $payments['bankDetails'] : '',
        'phone' => (string)($settings['bookingPhone'] ?? ''),
    ]);
}

// POST: start a card payment
if (($_GET['action'] ?? '') !== 'checkout') fail('Unknown action.', 404);
throttle_or_fail('checkout:' . client_ip(), 15, 900);
if (!payhere_enabled()) fail('Card payments are not available yet. Please pay by bank transfer.', 409);
if (is_paid($b)) fail('This booking is already paid – thank you!', 409);
if (!$canPay) fail('This booking can\'t be paid online. Please contact us.', 409);

// A new order id for every attempt (HB-XXXXXX-ab12), so a cancelled try can be retried
$orderId = $b['ref'] . '-' . bin2hex(random_bytes(2));
$amount = payhere_amount($b['total']);
$currency = $b['currency'];
$parts = preg_split('/\s+/', trim($b['name']), 2);
$back = site_origin() . '/pay/?ref=' . rawurlencode($b['ref']) . '&t=' . rawurlencode((string)$in['t']);

json_out([
    'action' => payhere_checkout_url(),
    'fields' => [
        'merchant_id' => (string)payhere_config()['merchant_id'],
        'return_url' => $back . '&done=1',
        'cancel_url' => $back . '&cancelled=1',
        'notify_url' => site_origin() . '/api/payhere-notify.php',
        'order_id' => $orderId,
        'items' => 'Stay at The Helsy Bentota – ' . ($room['name'] ?? 'room') . ' (' . $b['ref'] . ')',
        'currency' => $currency,
        'amount' => $amount,
        'first_name' => $parts[0] ?? $b['name'],
        'last_name' => $parts[1] ?? ($parts[0] ?? ''),
        'email' => $b['email'],
        'phone' => $b['phone'] ?: (string)($settings['bookingPhone'] ?? ''),
        'address' => 'Not provided',
        'city' => 'Not provided',
        'country' => $b['country'] ?: 'Sri Lanka',
        'custom_1' => $b['ref'],
        'hash' => payhere_hash($orderId, $amount, $currency),
    ],
]);
