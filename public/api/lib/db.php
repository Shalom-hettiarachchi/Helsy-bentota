<?php
// Database connection and tables. Works with SQLite (default, no setup) or
// MySQL (set 'db' => ['driver' => 'mysql', ...] in the config).
defined('HELSY_API') || exit;

const SCHEMA_VERSION = 2;

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;

    $c = helsy_config()['db'];
    $opts = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if ($c['driver'] === 'mysql') {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], (int)$c['port'], $c['name']);
        $pdo = new PDO($dsn, $c['user'], $c['pass'], $opts);
        $pdo->exec("SET time_zone = '+05:30'");
    } else {
        $path = $c['path'] ?: data_dir() . '/helsy.sqlite';
        $pdo = new PDO('sqlite:' . $path, null, null, $opts);
        $pdo->exec('PRAGMA busy_timeout = 5000');
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    db_migrate($pdo);
    return $pdo;
}

function is_mysql(): bool
{
    return helsy_config()['db']['driver'] === 'mysql';
}

// Start a write transaction. SQLite takes the write lock straight away so two
// bookings for the same dates can't both pass the availability check.
function db_begin(): void
{
    if (is_mysql()) db()->beginTransaction();
    else db()->exec('BEGIN IMMEDIATE');
}

function db_commit(): void
{
    if (is_mysql()) db()->commit();
    else db()->exec('COMMIT');
}

function db_rollback(): void
{
    try {
        if (is_mysql()) {
            if (db()->inTransaction()) db()->rollBack();
        } else {
            db()->exec('ROLLBACK');
        }
    } catch (Throwable $e) {
        // nothing to roll back
    }
}

function db_migrate(PDO $pdo): void
{
    try {
        $v = (int)json_decode((string)$pdo->query("SELECT v FROM settings WHERE k = 'schema_version'")->fetchColumn());
    } catch (PDOException $e) {
        $v = 0;
    }
    if ($v >= SCHEMA_VERSION) return;

    $mysql = is_mysql();
    $id = $mysql ? 'id INT AUTO_INCREMENT PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT';
    $end = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';

    $tables = [
        "settings (k VARCHAR(64) PRIMARY KEY, v TEXT NOT NULL)",
        "admins ($id, email VARCHAR(190) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL, password_hash VARCHAR(255) NOT NULL,
            created_at VARCHAR(19) NOT NULL, last_login VARCHAR(19) NULL)",
        "rooms ($id, slug VARCHAR(80) NOT NULL, name VARCHAR(160) NOT NULL, summary TEXT NOT NULL, description TEXT NOT NULL,
            features TEXT NOT NULL, capacity_note TEXT NOT NULL, max_guests INT NOT NULL, max_extra_beds INT NOT NULL,
            extra_bed_price INT NOT NULL, off_rate INT NOT NULL, peak_rate INT NOT NULL, images TEXT NOT NULL,
            active INT NOT NULL, position INT NOT NULL)",
        "seasons ($id, name VARCHAR(120) NOT NULL, start_md VARCHAR(5) NOT NULL, end_md VARCHAR(5) NOT NULL, position INT NOT NULL)",
        "bookings ($id, ref VARCHAR(16) NOT NULL UNIQUE, room_id INT NOT NULL, check_in VARCHAR(10) NOT NULL,
            check_out VARCHAR(10) NOT NULL, adults INT NOT NULL, children INT NOT NULL, extra_beds INT NOT NULL,
            guest_name VARCHAR(160) NOT NULL, email VARCHAR(190) NOT NULL, phone VARCHAR(60) NOT NULL,
            country VARCHAR(80) NOT NULL, arrival_time VARCHAR(40) NOT NULL, notes TEXT NOT NULL, breakdown TEXT NOT NULL,
            total INT NOT NULL, currency VARCHAR(8) NOT NULL, status VARCHAR(20) NOT NULL, admin_note TEXT NOT NULL,
            source VARCHAR(20) NOT NULL, ip VARCHAR(45) NOT NULL, created_at VARCHAR(19) NOT NULL, updated_at VARCHAR(19) NOT NULL)",
        "blocks ($id, room_id INT NOT NULL, start_date VARCHAR(10) NOT NULL, end_date VARCHAR(10) NOT NULL,
            reason VARCHAR(200) NOT NULL, created_at VARCHAR(19) NOT NULL)",
        "menu_categories ($id, name VARCHAR(120) NOT NULL, note VARCHAR(255) NOT NULL, visible INT NOT NULL, position INT NOT NULL)",
        "menu_items ($id, category_id INT NOT NULL, name VARCHAR(200) NOT NULL, description VARCHAR(500) NOT NULL,
            price VARCHAR(40) NOT NULL, visible INT NOT NULL, position INT NOT NULL)",
        "messages ($id, type VARCHAR(20) NOT NULL, name VARCHAR(160) NOT NULL, email VARCHAR(190) NOT NULL,
            phone VARCHAR(60) NOT NULL, subject VARCHAR(200) NOT NULL, body TEXT NOT NULL, data TEXT NOT NULL,
            status VARCHAR(20) NOT NULL, ip VARCHAR(45) NOT NULL, created_at VARCHAR(19) NOT NULL)",
        "throttle ($id, k VARCHAR(120) NOT NULL, at INT NOT NULL)",
        // Every payment notification PayHere sends, kept as a record
        "payments ($id, booking_id INT NOT NULL, provider VARCHAR(20) NOT NULL, provider_ref VARCHAR(80) NOT NULL,
            order_id VARCHAR(40) NOT NULL, amount INT NOT NULL, currency VARCHAR(8) NOT NULL, status VARCHAR(20) NOT NULL,
            method VARCHAR(20) NOT NULL, message VARCHAR(255) NOT NULL, created_at VARCHAR(19) NOT NULL)",
    ];
    foreach ($tables as $t) {
        $pdo->exec('CREATE TABLE IF NOT EXISTS ' . $t . $end);
    }

    // Columns added after the first version (schema 2: payments)
    $bookingCols = [
        'pay_token' => "VARCHAR(40) NOT NULL DEFAULT ''",
        'payment_due' => "VARCHAR(10) NOT NULL DEFAULT ''",
        'paid_amount' => 'INT NOT NULL DEFAULT 0',
        'paid_at' => "VARCHAR(19) NOT NULL DEFAULT ''",
        'payment_method' => "VARCHAR(20) NOT NULL DEFAULT ''",
        'payment_ref' => "VARCHAR(80) NOT NULL DEFAULT ''",
    ];
    $have = $mysql
        ? array_column($pdo->query('SHOW COLUMNS FROM bookings')->fetchAll(), 'Field')
        : array_column($pdo->query('PRAGMA table_info(bookings)')->fetchAll(), 'name');
    foreach ($bookingCols as $col => $def) {
        if (!in_array($col, $have, true)) $pdo->exec("ALTER TABLE bookings ADD COLUMN $col $def");
    }

    $indexes = [
        'idx_bookings_dates ON bookings (room_id, check_in, check_out)',
        'idx_bookings_status ON bookings (status)',
        'idx_blocks_dates ON blocks (room_id, start_date, end_date)',
        'idx_messages_status ON messages (status, created_at)',
        'idx_throttle_k ON throttle (k, at)',
        'idx_payments_booking ON payments (booking_id)',
    ];
    foreach ($indexes as $ix) {
        try {
            $pdo->exec(($mysql ? 'CREATE INDEX ' : 'CREATE INDEX IF NOT EXISTS ') . $ix);
        } catch (PDOException $e) {
            // already exists
        }
    }

    if ($v === 0) db_seed($pdo);
    set_setting('schema_version', SCHEMA_VERSION, $pdo);
}

// First run: fill in the suite, seasons, menu and contact details.
function db_seed(PDO $pdo): void
{
    $d = json_decode((string)file_get_contents(__DIR__ . '/defaults.json'), true);

    if (!(int)$pdo->query('SELECT COUNT(*) FROM settings')->fetchColumn()) {
        foreach ($d['settings'] + $d['privateSettings'] as $k => $val) set_setting($k, $val, $pdo);
    }
    if (!(int)$pdo->query('SELECT COUNT(*) FROM rooms')->fetchColumn()) {
        foreach ($d['rooms'] as $i => $r) {
            save_room(['position' => $i, 'active' => true] + $r, $pdo);
        }
    }
    if (!(int)$pdo->query('SELECT COUNT(*) FROM seasons')->fetchColumn()) {
        replace_seasons($d['seasons'], $pdo);
    }
    if (!(int)$pdo->query('SELECT COUNT(*) FROM menu_categories')->fetchColumn()) {
        replace_menu($d['menu'], $pdo);
    }
}

/* ------------------------------------------------------------------
   Settings (key → JSON value)
------------------------------------------------------------------- */
function get_settings(): array
{
    $out = [];
    foreach (db()->query('SELECT k, v FROM settings') as $row) {
        $out[$row['k']] = json_decode($row['v'], true);
    }
    return $out;
}

function set_setting(string $key, $value, ?PDO $pdo = null): void
{
    $pdo = $pdo ?: db();
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $up = $pdo->prepare('UPDATE settings SET v = ? WHERE k = ?');
    $up->execute([$json, $key]);
    $exists = $pdo->prepare('SELECT COUNT(*) FROM settings WHERE k = ?');
    $exists->execute([$key]);
    if (!(int)$exists->fetchColumn()) {
        $pdo->prepare('INSERT INTO settings (k, v) VALUES (?, ?)')->execute([$key, $json]);
    }
}
