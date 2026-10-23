// Seasonal pricing, the same rules as public/api/lib/pricing.php (the server
// always recalculates the final price). A night is "peak" when its month-day
// falls in a peak period; those repeat every year and may wrap over New Year.
import { addDays } from './dates'

export function inPeriod(md, start, end) {
  return start <= end ? md >= start && md <= end : md >= start || md <= end
}

export function peakSeasonFor(date, seasons) {
  const md = date.slice(5)
  return seasons.find((s) => inPeriod(md, s.start, s.end)) || null
}

export function quoteStay(room, seasons, checkIn, checkOut, extraBeds = 0) {
  const lines = {}
  let nights = 0
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    nights++
    const peak = !!peakSeasonFor(d, seasons)
    const key = peak ? 'peak' : 'off'
    const rate = peak ? room.peakRate : room.offRate
    lines[key] ??= { kind: key, label: peak ? 'Peak season' : 'Off-season', nights: 0, rate, subtotal: 0 }
    lines[key].nights++
    lines[key].subtotal += rate
  }
  const list = Object.values(lines)
  const extraTotal = extraBeds * (room.extraBedPrice || 0) * nights
  return {
    nights,
    lines: list,
    extraBeds,
    extraBedPrice: room.extraBedPrice || 0,
    extraTotal,
    total: list.reduce((sum, l) => sum + l.subtotal, 0) + extraTotal,
  }
}
