<?php
// POST /api/message.php – contact, care enquiry, table reservation and
// Pete's Meats order forms. Saved to the admin inbox and emailed.
require __DIR__ . '/lib/bootstrap.php';

require_method('POST');
$in = input();
$type = (string)($in['type'] ?? '');
if (!in_array($type, ['contact', 'care', 'table', 'order'], true)) fail('Unknown form.');

// Spam trap
if (!empty($in['website'])) json_out([]);
throttle_or_fail('msg:' . client_ip(), 10, 3600);

$rows = [];
$autoReply = null;

switch ($type) {
    case 'contact':
    case 'care':
        $name = v_str($in, 'fname', 'your name', 160);
        $email = v_email($in);
        $phone = v_str($in, 'phone', 'your phone number', 60, false);
        $subject = v_str($in, 'subject', 'a subject', 200);
        $body = v_str($in, 'message', 'your message', 5000);
        $rows = ['Name' => $name, 'Email' => $email, 'Phone' => $phone, 'Subject' => $subject, 'Message' => $body];
        $title = $type === 'care' ? 'New care enquiry' : 'New message from the website';
        break;

    case 'table':
        $name = v_str($in, 'name', 'your name', 160);
        $phone = v_str($in, 'phone', 'your phone number', 60);
        $email = v_email($in);
        $people = v_int($in, 'people', 'the number of people', 1, 60);
        $date = v_date($in, 'date', 'a date');
        $time = v_str($in, 'time', 'a time', 10);
        if ($date < date('Y-m-d')) fail('That date is in the past.', 422, ['field' => 'date']);
        $subject = "Table for $people – " . nice_date($date) . " at $time";
        $body = "Table reservation for $people on " . nice_date($date) . " at $time.";
        $rows = ['Name' => $name, 'Phone' => $phone, 'Email' => $email, 'People' => (string)$people, 'Date' => nice_date($date), 'Time' => $time];
        $title = 'New table reservation';
        $autoReply = ["We've received your table reservation", 'Thank you, ' . $name,
            'We\'ve received your request for a table. We\'ll confirm it by phone or email shortly.'];
        break;

    case 'order':
        $first = v_str($in, 'firstName', 'your first name', 80);
        $last = v_str($in, 'lastName', 'your last name', 80);
        $name = "$first $last";
        $email = v_email($in);
        $phone = v_str($in, 'phone', 'your phone number', 60);
        $product = v_str($in, 'productName', 'a product', 200, false) ?: v_str($in, 'product', 'a product', 200);
        $qty = v_str($in, 'quantity', 'the quantity', 100);
        $address = v_str($in, 'address', 'your street address', 300);
        $city = v_str($in, 'city', 'your city', 100);
        $postal = v_str($in, 'postalCode', 'postal code', 20, false);
        $cod = v_bool($in, 'cashOnDelivery') ? 'Yes' : 'No';
        $subject = "Order: $product × $qty";
        $body = "$product – $qty\n$address, $city $postal";
        $rows = ['Name' => $name, 'Phone' => $phone, 'Email' => $email, 'Product' => $product, 'Quantity' => $qty,
            'Address' => "$address\n$city $postal", 'Cash on delivery' => $cod];
        $title = "New Pete's Meats order";
        $autoReply = ["We've received your Pete's Meats order", 'Thank you, ' . $first,
            'We\'ve received your order and will call you to confirm it and arrange delivery.'];
        break;
}

db()->prepare('INSERT INTO messages (type, name, email, phone, subject, body, data, status, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$type, $name, $email, $phone, $subject, $body, json_encode($rows, JSON_UNESCAPED_UNICODE), 'new', client_ip(), now()]);

send_mail(notify_emails(), "$title: $subject", email_html($title, 'Sent from the website form.', $rows), $email, $name);

if ($autoReply) {
    send_mail($email, $autoReply[0], email_html($autoReply[1], e($autoReply[2]), $rows), notify_emails()[0] ?? null, 'The Helsy Bentota');
}

json_out([]);
