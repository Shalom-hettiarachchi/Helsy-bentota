<?php
// Reading and writing rooms, seasons, menu and bookings. Rows are turned
// into the same camelCase shape the website uses (see defaults.json).
defined('HELSY_API') || exit;

const PUBLIC_SETTINGS = [
    'currency', 'bookingPhone', 'bookingContactName', 'publicEmails', 'breakfastNotice',
    'minNights', 'checkIn', 'checkOut', 'bookingNote',
];

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
// Bookings with these statuses hold their dates
const HOLDING_STATUSES = ['pending', 'confirmed'];

function json_list($v): array
{
    $d = is_string($v) ? json_decode($v, true) : $v;
    return is_array($d) ? array_values($d) : [];
}

/* ------------------------------------------------------------------
   Rooms
------------------------------------------------------------------- */
function room_out(array $r): array
{
    return [
        'id' => (int)$r['id'],
        'slug' => $r['slug'],
        'name' => $r['name'],
        'summary' => $r['summary'],
        'description' => $r['description'],
        'features' => json_list($r['features']),
        'capacityNote' => $r['capacity_note'],
        'maxGuests' => (int)$r['max_guests'],
        'maxExtraBeds' => (int)$r['max_extra_beds'],
        'extraBedPrice' => (int)$r['extra_bed_price'],
        'offRate' => (int)$r['off_rate'],
        'peakRate' => (int)$r['peak_rate'],
        'images' => json_list($r['images']),
        'active' => (bool)$r['active'],
        'position' => (int)$r['position'],
    ];
}

function list_rooms(bool $activeOnly = true): array
{
    $sql = 'SELECT * FROM rooms' . ($activeOnly ? ' WHERE active = 1' : '') . ' ORDER BY position, id';
    return array_map('room_out', db()->query($sql)->fetchAll());
}

function find_room(int $id): ?array
{
    $q = db()->prepare('SELECT * FROM rooms WHERE id = ?');
    $q->execute([$id]);
    $r = $q->fetch();
    return $r ? room_out($r) : null;
}

// Insert or update a room from the camelCase shape. Returns its id.
function save_room(array $r, ?PDO $pdo = null): int
{
    $pdo = $pdo ?: db();
    $images = [];
    foreach (json_list($r['images'] ?? []) as $img) {
        if (!is_array($img) || !is_string($img['src'] ?? null)) continue;
        $src = trim($img['src']);
        if (!preg_match('#^/(images/|api/file\.php\?f=)[\w./=?-]+$#', $src)) continue;
        $images[] = ['src' => $src, 'alt' => mb_substr(trim((string)($img['alt'] ?? '')), 0, 160)];
    }
    $features = array_values(array_filter(array_map(
        fn($f) => mb_substr(trim((string)$f), 0, 80),
        json_list($r['features'] ?? [])
    ), fn($f) => $f !== ''));

    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', (string)($r['slug'] ?? $r['name'] ?? 'room')), '-')) ?: 'room';
    // Each room gets its own slug (the Stay page links to #slug): standard-room, standard-room-2 …
    $taken = $pdo->prepare('SELECT COUNT(*) FROM rooms WHERE slug = ? AND id <> ?');
    for ($base = $slug, $n = 2; $taken->execute([$slug, (int)($r['id'] ?? 0)]) && $taken->fetchColumn() > 0; $n++) {
        $slug = "$base-$n";
    }
    $vals = [
        $slug,
        (string)$r['name'],
        (string)($r['summary'] ?? ''),
        (string)($r['description'] ?? ''),
        json_encode($features, JSON_UNESCAPED_UNICODE),
        (string)($r['capacityNote'] ?? ''),
        (int)($r['maxGuests'] ?? 2),
        (int)($r['maxExtraBeds'] ?? 0),
        (int)($r['extraBedPrice'] ?? 0),
        (int)($r['offRate'] ?? 0),
        (int)($r['peakRate'] ?? 0),
        json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        !empty($r['active']) ? 1 : 0,
        (int)($r['position'] ?? 0),
    ];
    $cols = 'slug, name, summary, description, features, capacity_note, max_guests, max_extra_beds,
        extra_bed_price, off_rate, peak_rate, images, active, position';

    if (!empty($r['id'])) {
        $set = implode(', ', array_map(fn($c) => trim($c) . ' = ?', explode(',', $cols)));
        $pdo->prepare("UPDATE rooms SET $set WHERE id = ?")->execute([...$vals, (int)$r['id']]);
        return (int)$r['id'];
    }
    $pdo->prepare("INSERT INTO rooms ($cols) VALUES (" . rtrim(str_repeat('?, ', 14), ', ') . ')')->execute($vals);
    return (int)$pdo->lastInsertId();
}

/* ------------------------------------------------------------------
   Seasons (peak periods, repeat every year; month-day, both inclusive)
------------------------------------------------------------------- */
function list_seasons(): array
{
    $rows = db()->query('SELECT * FROM seasons ORDER BY position, id')->fetchAll();
    return array_map(fn($s) => [
        'id' => (int)$s['id'],
        'name' => $s['name'],
        'start' => $s['start_md'],
        'end' => $s['end_md'],
    ], $rows);
}

function replace_seasons(array $seasons, ?PDO $pdo = null): void
{
    $pdo = $pdo ?: db();
    $pdo->exec('DELETE FROM seasons');
    $ins = $pdo->prepare('INSERT INTO seasons (name, start_md, end_md, position) VALUES (?, ?, ?, ?)');
    foreach (array_values($seasons) as $i => $s) {
        $ins->execute([mb_substr((string)$s['name'], 0, 120), $s['start'], $s['end'], $i]);
    }
}

/* ------------------------------------------------------------------
   Menu
------------------------------------------------------------------- */
function list_menu(bool $visibleOnly = true): array
{
    $pdo = db();
    $cats = $pdo->query('SELECT * FROM menu_categories' . ($visibleOnly ? ' WHERE visible = 1' : '') . ' ORDER BY position, id')->fetchAll();
    $items = $pdo->query('SELECT * FROM menu_items' . ($visibleOnly ? ' WHERE visible = 1' : '') . ' ORDER BY position, id')->fetchAll();
    $byCat = [];
    foreach ($items as $it) {
        $byCat[(int)$it['category_id']][] = [
            'id' => (int)$it['id'],
            'name' => $it['name'],
            'description' => $it['description'],
            'price' => $it['price'],
            'visible' => (bool)$it['visible'],
        ];
    }
    return array_map(fn($c) => [
        'id' => (int)$c['id'],
        'name' => $c['name'],
        'note' => $c['note'],
        'visible' => (bool)$c['visible'],
        'items' => $byCat[(int)$c['id']] ?? [],
    ], $cats);
}

function replace_menu(array $categories, ?PDO $pdo = null): void
{
    $pdo = $pdo ?: db();
    $pdo->exec('DELETE FROM menu_items');
    $pdo->exec('DELETE FROM menu_categories');
    $insCat = $pdo->prepare('INSERT INTO menu_categories (name, note, visible, position) VALUES (?, ?, ?, ?)');
    $insItem = $pdo->prepare('INSERT INTO menu_items (category_id, name, description, price, visible, position) VALUES (?, ?, ?, ?, ?, ?)');
    foreach (array_values($categories) as $ci => $c) {
        $insCat->execute([
            mb_substr(trim((string)$c['name']), 0, 120),
            mb_substr(trim((string)($c['note'] ?? '')), 0, 255),
            ($c['visible'] ?? true) ? 1 : 0,
            $ci,
        ]);
        $catId = (int)$pdo->lastInsertId();
        foreach (array_values(json_list($c['items'] ?? [])) as $ii => $it) {
            if (trim((string)($it['name'] ?? '')) === '') continue;
            $insItem->execute([
                $catId,
                mb_substr(trim((string)$it['name']), 0, 200),
                mb_substr(trim((string)($it['description'] ?? '')), 0, 500),
                mb_substr(trim((string)($it['price'] ?? '')), 0, 40),
                ($it['visible'] ?? true) ? 1 : 0,
                $ii,
            ]);
        }
    }
}

/* ------------------------------------------------------------------
   Everything the public website needs, in one response
------------------------------------------------------------------- */
function public_site_data(): array
{
    $all = get_settings();
    $settings = [];
    foreach (PUBLIC_SETTINGS as $k) {
        if (array_key_exists($k, $all)) $settings[$k] = $all[$k];
    }
    $rooms = array_map(function ($r) {
        unset($r['active'], $r['position']);
        return $r;
    }, list_rooms(true));
    $menu = array_map(function ($c) {
        unset($c['visible']);
        $c['items'] = array_map(function ($i) {
            unset($i['visible']);
            return $i;
        }, $c['items']);
        return $c;
    }, list_menu(true));

    return [
        'settings' => $settings,
        'rooms' => $rooms,
        'seasons' => array_map(fn($s) => ['name' => $s['name'], 'start' => $s['start'], 'end' => $s['end']], list_seasons()),
        'menu' => $menu,
    ];
}

/* ------------------------------------------------------------------
   Bookings and availability
------------------------------------------------------------------- */
function booking_out(array $b): array
{
    return [
        'id' => (int)$b['id'],
        'ref' => $b['ref'],
        'roomId' => (int)$b['room_id'],
        'checkIn' => $b['check_in'],
        'checkOut' => $b['check_out'],
        'nights' => nights_between($b['check_in'], $b['check_out']),
        'adults' => (int)$b['adults'],
        'children' => (int)$b['children'],
        'extraBeds' => (int)$b['extra_beds'],
        'name' => $b['guest_name'],
        'email' => $b['email'],
        'phone' => $b['phone'],
        'country' => $b['country'],
        'arrivalTime' => $b['arrival_time'],
        'notes' => $b['notes'],
        'breakdown' => json_decode($b['breakdown'], true) ?: null,
        'total' => (int)$b['total'],
        'currency' => $b['currency'],
        'status' => $b['status'],
        'adminNote' => $b['admin_note'],
        'source' => $b['source'],
        'createdAt' => $b['created_at'],
        'updatedAt' => $b['updated_at'],
    ];
}

function find_booking(int $id): ?array
{
    $q = db()->prepare('SELECT * FROM bookings WHERE id = ?');
    $q->execute([$id]);
    $b = $q->fetch();
    return $b ? booking_out($b) : null;
}

// Bookings and blocked dates that overlap the nights from $from up to (not
// including) $to. $exceptBooking lets an edited booking ignore itself.
function conflicts(int $roomId, string $from, string $to, int $exceptBooking = 0): array
{
    $marks = implode(',', array_fill(0, count(HOLDING_STATUSES), '?'));
    $q = db()->prepare("SELECT id, ref, check_in, check_out, guest_name, status FROM bookings
        WHERE room_id = ? AND id <> ? AND status IN ($marks) AND check_in < ? AND check_out > ?");
    $q->execute([$roomId, $exceptBooking, ...HOLDING_STATUSES, $to, $from]);
    $bookings = $q->fetchAll();

    $q = db()->prepare('SELECT id, start_date, end_date, reason FROM blocks WHERE room_id = ? AND start_date < ? AND end_date > ?');
    $q->execute([$roomId, $to, $from]);
    $blocks = $q->fetchAll();

    return ['bookings' => $bookings, 'blocks' => $blocks];
}

// Every night between $from and $to that can't be booked
function unavailable_nights(int $roomId, string $from, string $to): array
{
    $c = conflicts($roomId, $from, $to);
    $nights = [];
    $ranges = array_merge(
        array_map(fn($b) => [$b['check_in'], $b['check_out']], $c['bookings']),
        array_map(fn($b) => [$b['start_date'], $b['end_date']], $c['blocks'])
    );
    foreach ($ranges as [$s, $e]) {
        $d = max($s, $from);
        $stop = min($e, $to);
        while ($d < $stop) {
            $nights[$d] = true;
            $d = add_days($d, 1);
        }
    }
    $list = array_keys($nights);
    sort($list);
    return $list;
}

function new_booking_ref(): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $q = db()->prepare('SELECT COUNT(*) FROM bookings WHERE ref = ?');
    do {
        $ref = 'HB-';
        for ($i = 0; $i < 6; $i++) $ref .= $chars[random_int(0, strlen($chars) - 1)];
        $q->execute([$ref]);
    } while ((int)$q->fetchColumn() > 0);
    return $ref;
}
