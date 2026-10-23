<?php
// POST /api/book.php – a guest's booking request from the website.
// Checks the dates are free, works out the price on the server, saves the
// booking as "pending" and emails the owners and the guest.
require __DIR__ . '/lib/bootstrap.php';

require_method('POST');
$in = input();

// Spam trap: real visitors never fill the hidden "website" field
if (!empty($in['website'])) json_out(['ref' => 'HB-THANKS', 'quote' => null, 'emailSent' => false]);

throttle_or_fail('book:' . client_ip(), 6, 3600);

$room = find_room(v_int($in, 'roomId', 'the room', 1, PHP_INT_MAX));
if (!$room || !$room['active']) fail('Sorry, this room is not available to book online.');

$settings = get_settings();
$today = date('Y-m-d');
$checkIn = v_date($in, 'checkIn', 'your check-in date');
$checkOut = v_date($in, 'checkOut', 'your check-out date');
if ($checkIn < $today) fail('Your check-in date is in the past.', 422, ['field' => 'checkIn']);
if ($checkOut <= $checkIn) fail('Check-out must be after check-in.', 422, ['field' => 'checkOut']);
if ($checkIn > add_days($today, 548)) fail('We take bookings up to 18 months ahead. Please contact us for later dates.');

$nights = nights_between($checkIn, $checkOut);
$minNights = max(1, (int)($settings['minNights'] ?? 1));
if ($nights < $minNights) fail("The minimum stay is $minNights nights.", 422);
if ($nights > 90) fail('For stays longer than 90 nights, please contact us directly.', 422);

$adults = v_int($in, 'adults', 'the number of adults', 1, 20);
$children = v_int($in, 'children', 'the number of children', 0, 20, 0);
$extraBeds = v_int($in, 'extraBeds', 'the number of extra beds', 0, $room['maxExtraBeds'], 0);
$capacity = $room['maxGuests'] + $extraBeds;
if ($adults + $children > $capacity) {
    $hint = $extraBeds < $room['maxExtraBeds'] ? ' Add an extra bed, or contact us for larger groups.' : ' Please contact us for larger groups.';
    fail("That's more guests than the room sleeps ($capacity)." . $hint, 422, ['field' => 'adults']);
}

$name = v_str($in, 'name', 'your full name', 160);
$email = v_email($in);
$phone = v_str($in, 'phone', 'your phone number', 60);
$country = v_str($in, 'country', 'country', 80, false);
$arrival = v_str($in, 'arrivalTime', 'arrival time', 40, false);
$notes = v_str($in, 'notes', 'your message', 2000, false);

$quote = quote_stay($room, list_seasons(), $checkIn, $checkOut, $extraBeds);
$currency = (string)($settings['currency'] ?? 'LKR');

db_begin();
try {
    if (is_mysql()) db()->prepare('SELECT id FROM rooms WHERE id = ? FOR UPDATE')->execute([$room['id']]);
    $c = conflicts($room['id'], $checkIn, $checkOut);
    if ($c['bookings'] || $c['blocks']) {
        db_rollback();
        fail('Sorry, some of those nights were just booked. Please choose other dates.', 409, ['code' => 'unavailable']);
    }
    $ref = new_booking_ref();
    $ts = now();
    db()->prepare('INSERT INTO bookings (ref, room_id, check_in, check_out, adults, children, extra_beds, guest_name,
        email, phone, country, arrival_time, notes, breakdown, total, currency, status, admin_note, source, ip, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([
            $ref, $room['id'], $checkIn, $checkOut, $adults, $children, $extraBeds, $name,
            $email, $phone, $country, $arrival, $notes, json_encode($quote), $quote['total'], $currency,
            'pending', '', 'website', client_ip(), $ts, $ts,
        ]);
    db_commit();
} catch (ApiError $ex) {
    throw $ex;
} catch (Throwable $ex) {
    db_rollback();
    throw $ex;
}

// Emails (a failed email never cancels the booking)
$guests = $adults . ' adult' . ($adults === 1 ? '' : 's') . ($children ? ", $children child" . ($children === 1 ? '' : 'ren') : '');
$priceRows = [];
foreach ($quote['lines'] as $l) {
    $priceRows[$l['label']] = $l['nights'] . ' night' . ($l['nights'] === 1 ? '' : 's') . ' × ' . money($l['rate'], $currency) . ' = ' . money($l['subtotal'], $currency);
}
if ($extraBeds) {
    $priceRows['Extra beds'] = $extraBeds . ($quote['extraTotal'] ? ' – ' . money($quote['extraTotal'], $currency) : ' (no charge)');
}
$stayRows = [
    'Reference' => $ref,
    'Room' => $room['name'],
    'Check-in' => nice_date($checkIn) . ' (from ' . ($settings['checkIn'] ?? '2:00 pm') . ')',
    'Check-out' => nice_date($checkOut) . ' (by ' . ($settings['checkOut'] ?? '11:00 am') . ')',
    'Nights' => (string)$nights,
    'Guests' => $guests,
] + $priceRows + ['Estimated total' => money($quote['total'], $currency) . ' – breakfast included'];

$adminUrl = (isset($_SERVER['HTTP_HOST']) ? ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] : '') . '/admin/';
send_mail(
    notify_emails(),
    "New booking request $ref – " . nice_date($checkIn) . " ($nights night" . ($nights === 1 ? '' : 's') . ')',
    email_html(
        'New booking request',
        'A guest has asked to book the <b>' . e($room['name']) . '</b>. Please confirm or decline it in the admin panel.',
        $stayRows + ['Name' => $name, 'Email' => $email, 'Phone' => $phone, 'Country' => $country, 'Arrival time' => $arrival, 'Message' => $notes],
        '<a href="' . e($adminUrl) . '" style="color:#92853d">Open the admin panel →</a>'
    ),
    $email,
    $name
);

$contactLine = trim(($settings['bookingContactName'] ? $settings['bookingContactName'] . ' on ' : '') . ($settings['bookingPhone'] ?? ''));
$emailSent = send_mail(
    $email,
    "We've received your booking request ($ref)",
    email_html(
        'Thank you, ' . $name,
        'We\'ve received your booking request for the <b>' . e($room['name']) . '</b>. This is not yet a confirmed booking – we\'ll check availability and get back to you by email or phone, usually within 24 hours.',
        $stayRows,
        'Questions? Reply to this email' . ($contactLine ? ' or call ' . e($contactLine) : '') . '.'
    ),
    notify_emails()[0] ?? null,
    'The Helsy Bentota'
);

json_out(['ref' => $ref, 'quote' => $quote, 'emailSent' => $emailSent]);
