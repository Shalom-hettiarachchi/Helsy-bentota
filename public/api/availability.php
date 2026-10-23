<?php
// GET /api/availability.php?room=1&from=2026-11-01&to=2027-01-31
// Nights that can't be booked (already booked or blocked) in that window.
require __DIR__ . '/lib/bootstrap.php';

require_method('GET');
$roomId = v_int($_GET, 'room', 'the room', 1, PHP_INT_MAX);
$from = v_date($_GET, 'from', 'a start date');
$to = v_date($_GET, 'to', 'an end date');
if ($to <= $from) fail('The end date must be after the start date.');
if (nights_between($from, $to) > 550) fail('Please ask for a shorter period.');

$room = find_room($roomId);
if (!$room || !$room['active']) fail('Room not found.', 404);

json_out(['unavailable' => unavailable_nights($roomId, $from, $to)]);
