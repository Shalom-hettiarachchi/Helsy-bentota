<?php
// /api/admin.php?action=… – everything the admin panel does.
// All actions except me/setup/login need a signed-in admin; every POST also
// needs the X-CSRF-Token header from "me".
require __DIR__ . '/lib/bootstrap.php';

$method = require_method('GET', 'POST');
$action = (string)($_GET['action'] ?? '');
admin_session();

$public = ['me', 'setup', 'login'];
if ($method === 'POST') require_csrf();
$admin = in_array($action, $public, true) ? current_admin() : require_admin();
$in = $method === 'POST' && $action !== 'upload' ? input() : [];

$handlers = [
    'GET' => ['me', 'dashboard', 'bookings', 'calendar', 'rooms', 'seasons', 'menu', 'messages', 'settings', 'admins'],
    'POST' => ['setup', 'login', 'logout', 'booking_save', 'booking_payment', 'booking_pay_link', 'booking_delete', 'block_save', 'block_delete', 'room_save',
        'seasons_save', 'menu_save', 'message_update', 'message_delete', 'settings_save', 'password_change',
        'admin_add', 'admin_delete', 'upload'],
];
if (!in_array($action, $handlers[$method], true)) fail('Unknown action.', 404);

$fn = 'action_' . $action;
json_out($fn($in, $admin));

/* ------------------------------------------------------------------
   Sign in
------------------------------------------------------------------- */
function setup_allowed(): array
{
    $hasAdmin = (int)db()->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0;
    $key = (string)helsy_config()['setup_key'];
    $local = in_array(client_ip(), ['127.0.0.1', '::1'], true);
    return ['needed' => !$hasAdmin, 'needsKey' => !$local];
}

function action_me(array $in, ?array $admin): array
{
    $s = setup_allowed();
    return [
        'admin' => $admin,
        'csrf' => $_SESSION['csrf'],
        'setupNeeded' => $s['needed'],
        'setupNeedsKey' => $s['needed'] && $s['needsKey'],
        'setupKeyConfigured' => (string)helsy_config()['setup_key'] !== '',
    ];
}

function action_setup(array $in, ?array $admin): array
{
    $s = setup_allowed();
    if (!$s['needed']) fail('The admin account already exists. Please sign in.', 403);
    throttle_or_fail('setup:' . client_ip(), 10, 900);
    if ($s['needsKey']) {
        $key = (string)helsy_config()['setup_key'];
        if ($key === '') fail('Set a setup_key in helsy-config.php on the server first (see the deploy guide).', 403);
        if (!hash_equals($key, (string)($in['setupKey'] ?? ''))) fail('The setup key is not correct.', 403);
    }
    $id = create_admin($in);
    login_as($id);
    return ['admin' => current_admin(), 'csrf' => $_SESSION['csrf']];
}

function create_admin(array $in): int
{
    $name = v_str($in, 'name', 'a name', 120);
    $email = strtolower(v_email($in));
    $pass = (string)($in['password'] ?? '');
    if (mb_strlen($pass) < 10) fail('Use a password with at least 10 characters.', 422, ['field' => 'password']);
    $q = db()->prepare('SELECT COUNT(*) FROM admins WHERE email = ?');
    $q->execute([$email]);
    if ((int)$q->fetchColumn()) fail('There is already an admin with that email.', 422);
    db()->prepare('INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
        ->execute([$email, $name, password_hash($pass, PASSWORD_DEFAULT), now()]);
    return (int)db()->lastInsertId();
}

function login_as(int $id): void
{
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $id;
    $_SESSION['seen'] = time();
    db()->prepare('UPDATE admins SET last_login = ? WHERE id = ?')->execute([now(), $id]);
}

function action_login(array $in, ?array $admin): array
{
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $pass = (string)($in['password'] ?? '');
    if (!throttle('login:' . client_ip(), 8, 900)) fail('Too many sign-in attempts. Please wait 15 minutes.', 429);
    $q = db()->prepare('SELECT id, password_hash FROM admins WHERE email = ?');
    $q->execute([$email]);
    $row = $q->fetch();
    if (!$row || !password_verify($pass, $row['password_hash'])) fail('Wrong email or password.', 401);
    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $row['id']]);
    }
    login_as((int)$row['id']);
    return ['admin' => current_admin(), 'csrf' => $_SESSION['csrf']];
}

function action_logout(array $in, array $admin): array
{
    $_SESSION = [];
    session_regenerate_id(true);
    return [];
}

/* ------------------------------------------------------------------
   Dashboard
------------------------------------------------------------------- */
function action_dashboard(array $in, array $admin): array
{
    $pdo = db();
    $today = date('Y-m-d');
    $count = function (string $sql, array $args = []) use ($pdo): int {
        $q = $pdo->prepare($sql);
        $q->execute($args);
        return (int)$q->fetchColumn();
    };
    $list = function (string $sql, array $args = []) use ($pdo): array {
        $q = $pdo->prepare($sql);
        $q->execute($args);
        return array_map('booking_out', $q->fetchAll());
    };

    // Booked nights this month (pending + confirmed), across active rooms
    $monthStart = date('Y-m-01');
    $monthEnd = date('Y-m-d', strtotime($monthStart . ' +1 month'));
    $rooms = list_rooms(true);
    $booked = 0;
    foreach ($rooms as $r) $booked += count(unavailable_nights($r['id'], $monthStart, $monthEnd));
    $capacity = max(1, count($rooms) * nights_between($monthStart, $monthEnd));

    return [
        'counts' => [
            'pending' => $count("SELECT COUNT(*) FROM bookings WHERE status = 'pending'"),
            'upcoming' => $count("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_in >= ?", [$today]),
            'inHouse' => $count("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_in <= ? AND check_out > ?", [$today, $today]),
            'newMessages' => $count("SELECT COUNT(*) FROM messages WHERE status = 'new'"),
            'occupancy' => (int)round($booked / $capacity * 100),
        ],
        'pending' => $list("SELECT * FROM bookings WHERE status = 'pending' ORDER BY check_in LIMIT 8"),
        'arrivals' => $list("SELECT * FROM bookings WHERE status = 'confirmed' AND check_out > ? ORDER BY check_in LIMIT 8", [$today]),
        'rooms' => array_map(fn($r) => ['id' => $r['id'], 'name' => $r['name']], $rooms),
        'charts' => dashboard_charts($rooms),
    ];
}

// Figures for the dashboard graphs: the last 12 months plus the next 3.
// Nights and income are split across months night by night, so a stay over
// the end of a month counts in both months.
function dashboard_charts(array $rooms): array
{
    $first = date('Y-m-01', strtotime(date('Y-m-01') . ' -11 months'));
    $end = date('Y-m-01', strtotime(date('Y-m-01') . ' +3 months'));

    $months = [];
    for ($m = $first; $m < $end; $m = date('Y-m-01', strtotime($m . ' +1 month'))) {
        $key = substr($m, 0, 7);
        $days = (int)date('t', strtotime($m));
        $months[$key] = ['month' => $key, 'nights' => 0, 'income' => 0, 'bookings' => 0, 'capacity' => max(1, count($rooms)) * $days];
    }

    $q = db()->prepare("SELECT check_in, check_out, total, status, country, source FROM bookings
        WHERE check_out > ? AND check_in < ?");
    $q->execute([$first, $end]);
    $status = ['confirmed' => 0, 'completed' => 0, 'pending' => 0, 'cancelled' => 0];
    $countries = [];
    $sources = [];
    foreach ($q->fetchAll() as $b) {
        if (isset($status[$b['status']])) $status[$b['status']]++;
        if ($b['status'] === 'cancelled') continue;
        $startKey = substr($b['check_in'], 0, 7);
        if (isset($months[$startKey])) $months[$startKey]['bookings']++;
        $country = trim((string)$b['country']) ?: 'Not given';
        $countries[$country] = ($countries[$country] ?? 0) + 1;
        $source = $b['source'] === 'admin' ? 'Added by admin' : 'Website';
        $sources[$source] = ($sources[$source] ?? 0) + 1;
        if ($b['status'] === 'pending') continue; // only confirmed stays count as income/nights
        $nights = max(1, nights_between($b['check_in'], $b['check_out']));
        $perNight = (int)$b['total'] / $nights;
        for ($d = $b['check_in']; $d < $b['check_out']; $d = add_days($d, 1)) {
            $key = substr($d, 0, 7);
            if (!isset($months[$key])) continue;
            $months[$key]['nights']++;
            $months[$key]['income'] += $perNight;
        }
    }
    arsort($countries);
    $top = array_slice($countries, 0, 6, true);
    if (count($countries) > 6) $top['Other'] = array_sum(array_slice($countries, 6));

    return [
        'months' => array_values(array_map(fn($m) => [
            'month' => $m['month'],
            'nights' => $m['nights'],
            'income' => (int)round($m['income']),
            'bookings' => $m['bookings'],
            'occupancy' => (int)round(min(1, $m['nights'] / $m['capacity']) * 100),
        ], $months)),
        'currentMonth' => date('Y-m'),
        'status' => $status,
        'countries' => array_map(fn($k, $v) => ['name' => (string)$k, 'count' => $v], array_keys($top), $top),
        'sources' => array_map(fn($k, $v) => ['name' => (string)$k, 'count' => $v], array_keys($sources), $sources),
    ];
}

/* ------------------------------------------------------------------
   Bookings
------------------------------------------------------------------- */
function action_bookings(array $in, array $admin): array
{
    $where = [];
    $args = [];
    $status = (string)($_GET['status'] ?? 'all');
    $order = 'check_in DESC';
    if ($status === 'upcoming') {
        $where[] = "status IN ('pending', 'confirmed') AND check_out >= ?";
        $args[] = date('Y-m-d');
        $order = 'check_in ASC';
    } elseif (in_array($status, BOOKING_STATUSES, true)) {
        $where[] = 'status = ?';
        $args[] = $status;
    }
    // Optional check-in date range (used by the Excel export)
    foreach (['from' => 'check_in >= ?', 'to' => 'check_in <= ?'] as $key => $cond) {
        $val = (string)($_GET[$key] ?? '');
        if ($val === '') continue;
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) fail('Please use a valid date.', 422);
        $where[] = $cond;
        $args[] = $val;
    }
    $search = trim((string)($_GET['q'] ?? ''));
    if ($search !== '') {
        $where[] = '(ref LIKE ? OR guest_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $search) . '%';
        array_push($args, $like, $like, $like, $like);
    }
    $sql = 'SELECT * FROM bookings' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . " ORDER BY $order, id DESC LIMIT " . (!empty($_GET['export']) ? 50000 : 500);
    $q = db()->prepare($sql);
    $q->execute($args);
    return ['bookings' => array_map('booking_out', $q->fetchAll())];
}

function action_booking_save(array $in, array $admin): array
{
    $id = (int)($in['id'] ?? 0);
    $old = $id ? find_booking($id) : null;
    if ($id && !$old) fail('Booking not found.', 404);

    $room = find_room(v_int($in, 'roomId', 'the room', 1, PHP_INT_MAX));
    if (!$room) fail('Room not found.');
    $checkIn = v_date($in, 'checkIn', 'the check-in date');
    $checkOut = v_date($in, 'checkOut', 'the check-out date');
    if ($checkOut <= $checkIn) fail('Check-out must be after check-in.', 422);
    if (nights_between($checkIn, $checkOut) > 400) fail('That stay is too long.', 422);

    $status = (string)($in['status'] ?? 'confirmed');
    if (!in_array($status, BOOKING_STATUSES, true)) fail('Unknown status.');
    $adults = v_int($in, 'adults', 'adults', 1, 50);
    $children = v_int($in, 'children', 'children', 0, 50, 0);
    $extraBeds = v_int($in, 'extraBeds', 'extra beds', 0, 20, 0);
    $name = v_str($in, 'name', 'the guest name', 160);
    $email = v_email($in, 'email', false);
    $phone = v_str($in, 'phone', 'phone', 60, false);
    $country = v_str($in, 'country', 'country', 80, false);
    $arrival = v_str($in, 'arrivalTime', 'arrival time', 40, false);
    $notes = v_str($in, 'notes', 'guest notes', 2000, false);
    $adminNote = v_str($in, 'adminNote', 'admin note', 2000, false);

    db_begin();
    try {
        if (in_array($status, HOLDING_STATUSES, true) && !v_bool($in, 'force')) {
            $c = conflicts($room['id'], $checkIn, $checkOut, $id);
            if ($c['bookings'] || $c['blocks']) {
                db_rollback();
                $what = array_merge(
                    array_map(fn($b) => $b['ref'] . ' – ' . $b['guest_name'] . ' (' . $b['check_in'] . ' → ' . $b['check_out'] . ')', $c['bookings']),
                    array_map(fn($b) => 'Blocked ' . $b['start_date'] . ' → ' . $b['end_date'] . ($b['reason'] ? ' (' . $b['reason'] . ')' : ''), $c['blocks'])
                );
                fail('These dates overlap: ' . implode('; ', $what), 409, ['code' => 'conflict', 'conflicts' => $what]);
            }
        }

        $datesChanged = !$old || $old['checkIn'] !== $checkIn || $old['checkOut'] !== $checkOut
            || $old['extraBeds'] !== $extraBeds || $old['roomId'] !== $room['id'];
        $quote = $datesChanged ? quote_stay($room, list_seasons(), $checkIn, $checkOut, $extraBeds) : $old['breakdown'];
        $total = isset($in['total']) && is_numeric($in['total']) && (int)$in['total'] >= 0
            ? (int)$in['total']
            : (int)($quote['total'] ?? 0);
        $currency = (string)(get_settings()['currency'] ?? 'LKR');
        $ts = now();

        $vals = [$room['id'], $checkIn, $checkOut, $adults, $children, $extraBeds, $name, $email, $phone, $country,
            $arrival, $notes, json_encode($quote), $total, $status, $adminNote, $ts];
        if ($old) {
            db()->prepare('UPDATE bookings SET room_id = ?, check_in = ?, check_out = ?, adults = ?, children = ?, extra_beds = ?,
                guest_name = ?, email = ?, phone = ?, country = ?, arrival_time = ?, notes = ?, breakdown = ?, total = ?,
                status = ?, admin_note = ?, updated_at = ? WHERE id = ?')->execute([...$vals, $id]);
        } else {
            db()->prepare('INSERT INTO bookings (room_id, check_in, check_out, adults, children, extra_beds, guest_name, email,
                phone, country, arrival_time, notes, breakdown, total, status, admin_note, updated_at, ref, currency, source, ip, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([...$vals, new_booking_ref(), $currency, 'admin', client_ip(), $ts]);
            $id = (int)db()->lastInsertId();
        }
        db_commit();
    } catch (ApiError $ex) {
        throw $ex;
    } catch (Throwable $ex) {
        db_rollback();
        throw $ex;
    }

    // A confirmed booking gets its payment due date (again, if the dates moved)
    if ($status === 'confirmed' && (!$old || $old['paymentDue'] === '' || $datesChanged)) {
        db()->prepare('UPDATE bookings SET payment_due = ? WHERE id = ?')->execute([payment_due_for($checkIn), $id]);
    }

    $booking = find_booking($id);
    $emailed = false;
    $statusChanged = !$old || $old['status'] !== $status;
    if (v_bool($in, 'notifyGuest') && $email && $statusChanged && in_array($status, ['confirmed', 'cancelled'], true)) {
        $emailed = email_guest_status($booking, $room);
    }
    return ['booking' => $booking, 'emailed' => $emailed];
}

function email_guest_status(array $b, array $room): bool
{
    $s = get_settings();
    $rows = [
        'Reference' => $b['ref'],
        'Room' => $room['name'],
        'Check-in' => nice_date($b['checkIn']) . ' (from ' . ($s['checkIn'] ?? '2:00 pm') . ')',
        'Check-out' => nice_date($b['checkOut']) . ' (by ' . ($s['checkOut'] ?? '11:00 am') . ')',
        'Nights' => (string)$b['nights'],
        'Total' => money($b['total'], $b['currency']) . ' – breakfast included',
    ];
    $contact = trim(($s['bookingContactName'] ? $s['bookingContactName'] . ' on ' : '') . ($s['bookingPhone'] ?? ''));
    if ($b['status'] === 'confirmed') {
        $subject = 'Your booking is confirmed (' . $b['ref'] . ')';
        $html = email_html('Your stay is confirmed', 'Good news, ' . e($b['name']) . ' – your booking at The Helsy Bentota is confirmed. We look forward to welcoming you.', $rows,
            'Need anything before you arrive? Reply to this email' . ($contact ? ' or call ' . e($contact) : '') . '.',
            payment_email_html($b));
    } else {
        $subject = 'About your booking request (' . $b['ref'] . ')';
        $html = email_html('Booking update', 'Dear ' . e($b['name']) . ', unfortunately we are unable to confirm your booking for these dates, and it has been cancelled. We\'re sorry for any inconvenience.', $rows,
            'Please reply to this email' . ($contact ? ' or call ' . e($contact) : '') . ' – we\'d be happy to suggest other dates.');
    }
    return send_mail($b['email'], $subject, $html, notify_emails()[0] ?? null, 'The Helsy Bentota');
}

// Mark a booking paid by bank transfer (or undo it)
function action_booking_payment(array $in, array $admin): array
{
    $b = find_booking((int)($in['id'] ?? 0));
    if (!$b) fail('Booking not found.', 404);
    if (v_bool($in, 'paid')) {
        if (!is_paid($b)) {
            db()->prepare("UPDATE bookings SET paid_amount = ?, paid_at = ?, payment_method = 'bank', payment_ref = ?, updated_at = ? WHERE id = ?")
                ->execute([max(1, $b['total']), now(), v_str($in, 'paymentRef', 'the payment reference', 80, false), now(), $b['id']]);
        }
    } else {
        db()->prepare("UPDATE bookings SET paid_amount = 0, paid_at = '', payment_method = '', payment_ref = '', updated_at = ? WHERE id = ?")
            ->execute([now(), $b['id']]);
    }
    return ['booking' => find_booking($b['id'])];
}

// The guest's private payment link, to send by WhatsApp or email
function action_booking_pay_link(array $in, array $admin): array
{
    $b = find_booking((int)($in['id'] ?? 0));
    if (!$b) fail('Booking not found.', 404);
    return ['url' => pay_url($b)];
}

function action_booking_delete(array $in, array $admin): array
{
    db()->prepare('DELETE FROM bookings WHERE id = ?')->execute([(int)($in['id'] ?? 0)]);
    return [];
}

/* ------------------------------------------------------------------
   Calendar and blocked dates
------------------------------------------------------------------- */
function action_calendar(array $in, array $admin): array
{
    $roomId = v_int($_GET, 'room', 'the room', 1, PHP_INT_MAX);
    $from = v_date($_GET, 'from', 'a start date');
    $to = v_date($_GET, 'to', 'an end date');
    $q = db()->prepare("SELECT * FROM bookings WHERE room_id = ? AND status <> 'cancelled' AND check_in < ? AND check_out > ? ORDER BY check_in");
    $q->execute([$roomId, $to, $from]);
    $bookings = array_map('booking_out', $q->fetchAll());
    $q = db()->prepare('SELECT * FROM blocks WHERE room_id = ? AND start_date < ? AND end_date > ? ORDER BY start_date');
    $q->execute([$roomId, $to, $from]);
    $blocks = array_map(fn($b) => [
        'id' => (int)$b['id'], 'roomId' => (int)$b['room_id'], 'start' => $b['start_date'], 'end' => $b['end_date'], 'reason' => $b['reason'],
    ], $q->fetchAll());
    return ['bookings' => $bookings, 'blocks' => $blocks];
}

function action_block_save(array $in, array $admin): array
{
    $room = find_room(v_int($in, 'roomId', 'the room', 1, PHP_INT_MAX));
    if (!$room) fail('Room not found.');
    $start = v_date($in, 'start', 'the first blocked night');
    $end = v_date($in, 'end', 'the date it is free again');
    if ($end <= $start) fail('"Free again on" must be after the first blocked night.', 422);
    $reason = v_str($in, 'reason', 'reason', 200, false);
    db()->prepare('INSERT INTO blocks (room_id, start_date, end_date, reason, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$room['id'], $start, $end, $reason, now()]);
    return ['id' => (int)db()->lastInsertId()];
}

function action_block_delete(array $in, array $admin): array
{
    db()->prepare('DELETE FROM blocks WHERE id = ?')->execute([(int)($in['id'] ?? 0)]);
    return [];
}

/* ------------------------------------------------------------------
   Rooms, rates and seasons
------------------------------------------------------------------- */
function action_rooms(array $in, array $admin): array
{
    return ['rooms' => list_rooms(false)];
}

function action_room_save(array $in, array $admin): array
{
    $r = $in['room'] ?? null;
    if (!is_array($r)) fail('Missing room.');
    $r['name'] = v_str($r, 'name', 'the room name', 160);
    foreach (['summary' => 400, 'description' => 4000, 'capacityNote' => 400] as $k => $max) {
        $r[$k] = v_str($r, $k, $k, $max, false);
    }
    $r['maxGuests'] = v_int($r, 'maxGuests', 'max guests', 1, 50);
    $r['maxExtraBeds'] = v_int($r, 'maxExtraBeds', 'extra beds', 0, 20, 0);
    $r['extraBedPrice'] = v_int($r, 'extraBedPrice', 'the extra bed price', 0, 100000000, 0);
    $r['offRate'] = v_int($r, 'offRate', 'the off-season rate', 0, 100000000);
    $r['peakRate'] = v_int($r, 'peakRate', 'the peak season rate', 0, 100000000);
    if (!empty($r['id']) && !find_room((int)$r['id'])) fail('Room not found.', 404);
    $id = save_room($r);
    return ['room' => find_room($id)];
}

function action_seasons(array $in, array $admin): array
{
    return ['seasons' => list_seasons()];
}

function action_seasons_save(array $in, array $admin): array
{
    $list = $in['seasons'] ?? null;
    if (!is_array($list) || count($list) > 20) fail('Invalid seasons.');
    $clean = [];
    foreach (array_values($list) as $i => $s) {
        if (!is_array($s)) fail('Invalid season.');
        $clean[] = [
            'name' => v_str($s, 'name', 'a season name', 120),
            'start' => v_md((string)($s['start'] ?? ''), 'Start'),
            'end' => v_md((string)($s['end'] ?? ''), 'End'),
        ];
    }
    replace_seasons($clean);
    return ['seasons' => list_seasons()];
}

/* ------------------------------------------------------------------
   Menu
------------------------------------------------------------------- */
function action_menu(array $in, array $admin): array
{
    return ['menu' => list_menu(false)];
}

function action_menu_save(array $in, array $admin): array
{
    $cats = $in['menu'] ?? null;
    if (!is_array($cats) || count($cats) > 60) fail('Invalid menu.');
    foreach ($cats as $c) {
        if (!is_array($c) || trim((string)($c['name'] ?? '')) === '') fail('Every menu section needs a name.', 422);
        if (count(json_list($c['items'] ?? [])) > 300) fail('Too many items in one section.', 422);
    }
    db_begin();
    try {
        replace_menu($cats);
        db_commit();
    } catch (Throwable $ex) {
        db_rollback();
        throw $ex;
    }
    return ['menu' => list_menu(false)];
}

/* ------------------------------------------------------------------
   Messages inbox
------------------------------------------------------------------- */
function action_messages(array $in, array $admin): array
{
    $where = [];
    $args = [];
    $type = (string)($_GET['type'] ?? '');
    if (in_array($type, ['contact', 'care', 'table', 'order'], true)) {
        $where[] = 'type = ?';
        $args[] = $type;
    }
    $status = (string)($_GET['status'] ?? 'inbox');
    if ($status === 'inbox') $where[] = "status <> 'archived'";
    elseif (in_array($status, ['new', 'read', 'archived'], true)) {
        $where[] = 'status = ?';
        $args[] = $status;
    }
    $q = db()->prepare('SELECT * FROM messages' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 500');
    $q->execute($args);
    return ['messages' => array_map(fn($m) => [
        'id' => (int)$m['id'],
        'type' => $m['type'],
        'name' => $m['name'],
        'email' => $m['email'],
        'phone' => $m['phone'],
        'subject' => $m['subject'],
        'body' => $m['body'],
        'data' => json_decode($m['data'], true) ?: [],
        'status' => $m['status'],
        'createdAt' => $m['created_at'],
    ], $q->fetchAll())];
}

function action_message_update(array $in, array $admin): array
{
    $status = (string)($in['status'] ?? '');
    if (!in_array($status, ['new', 'read', 'archived'], true)) fail('Unknown status.');
    db()->prepare('UPDATE messages SET status = ? WHERE id = ?')->execute([$status, (int)($in['id'] ?? 0)]);
    return [];
}

function action_message_delete(array $in, array $admin): array
{
    db()->prepare('DELETE FROM messages WHERE id = ?')->execute([(int)($in['id'] ?? 0)]);
    return [];
}

/* ------------------------------------------------------------------
   Settings and admin accounts
------------------------------------------------------------------- */
function action_settings(array $in, array $admin): array
{
    $s = get_settings() + ['bankDetails' => '', 'paymentDueDays' => 14];
    unset($s['schema_version']);
    // Read-only: whether card payments are switched on in helsy-config.php
    $s['cardPayments'] = payhere_enabled() ? (payhere_config()['sandbox'] ? 'sandbox' : 'live') : 'off';
    return ['settings' => $s];
}

function clean_emails($list, string $label): array
{
    $out = [];
    foreach (json_list($list) as $e) {
        $e = trim((string)$e);
        if ($e === '') continue;
        if (!filter_var($e, FILTER_VALIDATE_EMAIL)) fail("\"$e\" in $label is not a valid email address.", 422);
        $out[] = $e;
    }
    return array_values(array_unique($out));
}

function action_settings_save(array $in, array $admin): array
{
    $s = $in['settings'] ?? null;
    if (!is_array($s)) fail('Missing settings.');
    $notify = clean_emails($s['notifyEmails'] ?? [], 'notification emails');
    if (!$notify) fail('Add at least one email address for booking notifications.', 422);
    $clean = [
        'bookingPhone' => v_str($s, 'bookingPhone', 'the booking phone number', 60),
        'bookingContactName' => v_str($s, 'bookingContactName', 'the contact person', 120, false),
        'publicEmails' => clean_emails($s['publicEmails'] ?? [], 'website emails'),
        'notifyEmails' => $notify,
        'breakfastNotice' => v_str($s, 'breakfastNotice', 'the breakfast notice', 200, false),
        'minNights' => v_int($s, 'minNights', 'minimum nights', 1, 60),
        'checkIn' => v_str($s, 'checkIn', 'check-in time', 40),
        'checkOut' => v_str($s, 'checkOut', 'check-out time', 40),
        'bookingNote' => v_str($s, 'bookingNote', 'the booking note', 600, false),
        'currency' => strtoupper(v_str($s, 'currency', 'the currency', 5)),
        'bankDetails' => v_str($s, 'bankDetails', 'the bank details', 1000, false),
        'paymentDueDays' => v_int($s, 'paymentDueDays', 'days before arrival', 0, 90, 14),
    ];
    foreach ($clean as $k => $v) set_setting($k, $v);
    return action_settings([], $admin);
}

function action_password_change(array $in, array $admin): array
{
    $q = db()->prepare('SELECT password_hash FROM admins WHERE id = ?');
    $q->execute([$admin['id']]);
    if (!password_verify((string)($in['current'] ?? ''), (string)$q->fetchColumn())) fail('Your current password is not correct.', 422);
    $new = (string)($in['password'] ?? '');
    if (mb_strlen($new) < 10) fail('Use a new password with at least 10 characters.', 422);
    db()->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $admin['id']]);
    return [];
}

function action_admins(array $in, array $admin): array
{
    $rows = db()->query('SELECT id, name, email, created_at, last_login FROM admins ORDER BY id')->fetchAll();
    return ['admins' => array_map(fn($a) => [
        'id' => (int)$a['id'], 'name' => $a['name'], 'email' => $a['email'],
        'createdAt' => $a['created_at'], 'lastLogin' => $a['last_login'], 'isYou' => (int)$a['id'] === (int)$admin['id'],
    ], $rows)];
}

function action_admin_add(array $in, array $admin): array
{
    create_admin($in);
    return action_admins([], $admin);
}

function action_admin_delete(array $in, array $admin): array
{
    $id = (int)($in['id'] ?? 0);
    if ($id === (int)$admin['id']) fail("You can't remove your own account.", 422);
    db()->prepare('DELETE FROM admins WHERE id = ?')->execute([$id]);
    return action_admins([], $admin);
}

/* ------------------------------------------------------------------
   Photo upload (JPG, PNG or WebP, up to 8 MB)
------------------------------------------------------------------- */
function action_upload(array $in, array $admin): array
{
    $f = $_FILES['file'] ?? null;
    if (!$f || !is_array($f) || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) {
        $code = is_array($f) ? (int)$f['error'] : -1;
        fail(in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 'That photo is too large.' : 'The upload failed. Please try again.');
    }
    if ($f['size'] > 8 * 1024 * 1024) fail('That photo is too large (max 8 MB).');
    $info = @getimagesize($f['tmp_name']);
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
    if (!$info || !isset($types[$info[2]])) fail('Please upload a JPG, PNG or WebP photo.');
    $dir = data_dir() . '/uploads';
    if (!ensure_dir($dir)) fail('The uploads folder is not writable.', 500);
    $name = bin2hex(random_bytes(12)) . '.' . $types[$info[2]];
    if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) fail('Could not save the photo.', 500);
    return ['url' => '/api/file.php?f=' . $name, 'width' => $info[0], 'height' => $info[1]];
}
