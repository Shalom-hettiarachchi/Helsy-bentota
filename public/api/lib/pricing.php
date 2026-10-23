<?php
// Seasonal pricing. A night is "peak" when its month-day falls inside one of
// the peak periods (which repeat every year and may wrap over New Year);
// every other night is off-season. Mirrors src/lib/pricing.js.
defined('HELSY_API') || exit;

function add_days(string $date, int $days): string
{
    return (new DateTimeImmutable($date . ' 00:00:00', new DateTimeZone('UTC')))
        ->modify(($days >= 0 ? '+' : '') . $days . ' days')
        ->format('Y-m-d');
}

function nights_between(string $in, string $out): int
{
    $a = new DateTimeImmutable($in . ' 00:00:00', new DateTimeZone('UTC'));
    $b = new DateTimeImmutable($out . ' 00:00:00', new DateTimeZone('UTC'));
    return (int)round(($b->getTimestamp() - $a->getTimestamp()) / 86400);
}

function in_period(string $md, string $start, string $end): bool
{
    return $start <= $end ? ($md >= $start && $md <= $end) : ($md >= $start || $md <= $end);
}

// The peak period a night falls in, or null for off-season
function peak_season_for(string $date, array $seasons): ?array
{
    $md = substr($date, 5);
    foreach ($seasons as $s) {
        if (in_period($md, $s['start'], $s['end'])) return $s;
    }
    return null;
}

// Price for a stay: one line per season/rate, plus extra beds.
function quote_stay(array $room, array $seasons, string $checkIn, string $checkOut, int $extraBeds = 0): array
{
    $lines = [];
    $nights = 0;
    for ($d = $checkIn; $d < $checkOut; $d = add_days($d, 1)) {
        $nights++;
        $peak = peak_season_for($d, $seasons) !== null;
        $key = $peak ? 'peak' : 'off';
        $rate = $peak ? $room['peakRate'] : $room['offRate'];
        if (!isset($lines[$key])) {
            $lines[$key] = ['kind' => $key, 'label' => $peak ? 'Peak season' : 'Off-season', 'nights' => 0, 'rate' => $rate, 'subtotal' => 0];
        }
        $lines[$key]['nights']++;
        $lines[$key]['subtotal'] += $rate;
    }
    $extraTotal = $extraBeds * $room['extraBedPrice'] * $nights;
    $roomTotal = array_sum(array_column($lines, 'subtotal'));
    return [
        'nights' => $nights,
        'lines' => array_values($lines),
        'extraBeds' => $extraBeds,
        'extraBedPrice' => $room['extraBedPrice'],
        'extraTotal' => $extraTotal,
        'total' => $roomTotal + $extraTotal,
    ];
}

function money(int $amount, string $currency = 'LKR'): string
{
    return $currency . ' ' . number_format($amount);
}

function nice_date(string $date): string
{
    return (new DateTimeImmutable($date))->format('D j M Y');
}
