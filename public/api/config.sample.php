<?php
// Copy this file to ONE FOLDER ABOVE public_html and name it helsy-config.php
// (e.g. /home/u123456789/domains/thehelsybentota.com/helsy-config.php).
// Keeping it outside public_html means re-uploading the website never
// overwrites it and visitors can never download it.
// Only include the settings you want to change.

return [
    // A long random phrase. You'll be asked for it once, to create the first
    // admin account at /admin. You can remove it afterwards.
    'setup_key' => 'change-me-to-a-long-random-phrase',

    // Database. SQLite needs no setup: a file is created automatically in
    // <data_dir>/helsy.sqlite. To use a Hostinger MySQL database instead:
    // 'db' => [
    //     'driver' => 'mysql',
    //     'host' => 'localhost',
    //     'name' => 'u123456789_helsy',
    //     'user' => 'u123456789_helsy',
    //     'pass' => 'database-password',
    // ],

    // Email. With a Hostinger email account (recommended) or Gmail with an
    // app password. Without SMTP, PHP's mail() is used.
    'mail' => [
        'from_email' => 'bookings@thehelsybentota.com',
        'from_name' => 'The Helsy Bentota',
        'smtp' => [
            'host' => 'smtp.hostinger.com',   // Gmail: smtp.gmail.com
            'port' => 465,
            'secure' => 'ssl',
            'user' => 'bookings@thehelsybentota.com',
            'pass' => 'email-account-password',
        ],
    ],

    // Card payments through PayHere (optional). Leave out to offer bank
    // transfer only. Sandbox keys come from sandbox.payhere.lk; for real
    // payments use the live account's keys and set 'sandbox' => false.
    // The Merchant Secret is per domain: PayHere → Integrations → add
    // www.thehelsybentota.com and copy the secret it shows for it.
    // 'payhere' => [
    //     'merchant_id' => '1234567',
    //     'merchant_secret' => 'secret-for-www.thehelsybentota.com',
    //     'sandbox' => true,
    // ],
];
