// Dates are plain 'YYYY-MM-DD' strings everywhere (no time zones to trip over).

const pad = (n) => String(n).padStart(2, '0')

export function toISO(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(s, n) {
  const d = parseISO(s)
  d.setUTCDate(d.getUTCDate() + n)
  return toISO(d)
}

export function addMonths(s, n) {
  const d = parseISO(s)
  return toISO(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)))
}

export function nightsBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000)
}

// Today in Sri Lanka, regardless of where the visitor is
export function todayISO() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts
}

export function isValidISO(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return toISO(parseISO(s)) === s
}

const fmt = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts })
const short = fmt({ weekday: 'short', day: 'numeric', month: 'short' })
const long = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const monthYear = fmt({ month: 'long', year: 'numeric' })
const dayMonth = fmt({ day: 'numeric', month: 'long' })

export const formatShort = (s) => short.format(parseISO(s))
export const formatLong = (s) => long.format(parseISO(s))
export const formatMonth = (s) => monthYear.format(parseISO(s))

// '12-25' -> '25 December'
export const formatMonthDay = (md) => dayMonth.format(parseISO(`2024-${md}`))

export function formatMoney(amount, currency = 'LKR') {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US')}`
}
