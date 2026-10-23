// Builds a real Excel file (.xlsx) from a list of bookings.
// Sheet 1: every booking. Sheet 2: totals per month (by check-in month).
import { STATUS_LABELS } from './context'

const HEADER = { fontWeight: 'bold', backgroundColor: '#EDE8D5', borderColor: '#B3A35A', bottomBorderStyle: 'thin' }
const TOTAL = { fontWeight: 'bold', backgroundColor: '#F5F3EC', topBorderStyle: 'thin', borderColor: '#B3A35A' }
const MONEY = '#,##0'

// 'YYYY-MM-DD' -> Date at midnight UTC, so Excel shows exactly that day
const day = (s) => (s ? new Date(`${s.slice(0, 10)}T00:00:00Z`) : null)
const dateTime = (s) => (s ? new Date(`${s.replace(' ', 'T')}Z`) : null)
const text = (v) => ({ value: v == null ? '' : String(v), type: String })
const num = (v, format) => ({ value: Number(v) || 0, type: Number, ...(format ? { format } : {}) })
const date = (v, format = 'd mmm yyyy') => (v ? { value: v, type: Date, format } : null)

const COLUMNS = [
  ['Ref', 12, (b) => text(b.ref)],
  ['Status', 12, (b) => text(STATUS_LABELS[b.status] || b.status)],
  ['Room', 26, (b, rooms) => text(rooms[b.roomId] || `Room ${b.roomId}`)],
  ['Check-in', 13, (b) => date(day(b.checkIn))],
  ['Check-out', 13, (b) => date(day(b.checkOut))],
  ['Nights', 8, (b) => num(b.nights)],
  ['Adults', 8, (b) => num(b.adults)],
  ['Children', 9, (b) => num(b.children)],
  ['Extra beds', 10, (b) => num(b.extraBeds)],
  ['Guest name', 24, (b) => text(b.name)],
  ['Email', 28, (b) => text(b.email)],
  ['Phone', 18, (b) => ({ ...text(b.phone), format: '@' })],
  ['Country', 14, (b) => text(b.country)],
  ['Arrival time', 14, (b) => text(b.arrivalTime)],
  ['Total', 13, (b) => num(b.total, MONEY)],
  ['Currency', 9, (b) => text(b.currency)],
  ['Booked via', 12, (b) => text(b.source === 'admin' ? 'Admin' : 'Website')],
  ['Created', 17, (b) => date(dateTime(b.createdAt), 'd mmm yyyy hh:mm')],
  ['Guest message', 40, (b) => ({ ...text(b.notes), wrap: true })],
  ['Private note', 40, (b) => ({ ...text(b.adminNote), wrap: true })],
]

function bookingsSheet(bookings, rooms) {
  const header = COLUMNS.map(([title]) => ({ value: title, ...HEADER }))
  const rows = bookings.map((b) => COLUMNS.map(([, , cell]) => cell(b, rooms)))
  const live = bookings.filter((b) => b.status !== 'cancelled')
  const totals = COLUMNS.map(([title]) => {
    if (title === 'Ref') return { value: 'Total (not cancelled)', ...TOTAL }
    if (title === 'Nights') return { ...num(live.reduce((s, b) => s + b.nights, 0)), ...TOTAL }
    if (title === 'Total') return { ...num(live.reduce((s, b) => s + b.total, 0), MONEY), ...TOTAL }
    return { value: '', type: String, ...TOTAL }
  })
  return {
    sheet: 'Bookings',
    data: [header, ...rows, ...(rows.length ? [totals] : [])],
    columns: COLUMNS.map(([, width]) => ({ width })),
    stickyRowsCount: 1,
  }
}

function monthlySheet(bookings) {
  const months = {}
  for (const b of bookings) {
    const key = b.checkIn.slice(0, 7)
    const m = (months[key] ||= { bookings: 0, cancelled: 0, nights: 0, guests: 0, income: 0 })
    if (b.status === 'cancelled') {
      m.cancelled++
      continue
    }
    m.bookings++
    m.nights += b.nights
    m.guests += b.adults + b.children
    m.income += b.total
  }
  const keys = Object.keys(months).sort()
  const header = ['Month', 'Bookings', 'Cancelled', 'Nights', 'Guests', 'Income'].map((t) => ({ value: t, ...HEADER }))
  const rows = keys.map((k) => {
    const m = months[k]
    return [date(day(`${k}-01`), 'mmmm yyyy'), num(m.bookings), num(m.cancelled), num(m.nights), num(m.guests), num(m.income, MONEY)]
  })
  const sum = (f) => keys.reduce((s, k) => s + months[k][f], 0)
  const totals = [
    { value: 'Total', ...TOTAL },
    { ...num(sum('bookings')), ...TOTAL },
    { ...num(sum('cancelled')), ...TOTAL },
    { ...num(sum('nights')), ...TOTAL },
    { ...num(sum('guests')), ...TOTAL },
    { ...num(sum('income'), MONEY), ...TOTAL },
  ]
  return {
    sheet: 'By month',
    data: [header, ...rows, ...(rows.length ? [totals] : [])],
    columns: [{ width: 18 }, { width: 11 }, { width: 11 }, { width: 10 }, { width: 10 }, { width: 15 }],
    stickyRowsCount: 1,
  }
}

export async function downloadBookingsExcel(bookings, roomList, fileName) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const rooms = Object.fromEntries((roomList || []).map((r) => [r.id, r.name]))
  await writeExcelFile([bookingsSheet(bookings, rooms), monthlySheet(bookings)], { fontFamily: 'Calibri', fontSize: 11 }).toFile(fileName)
}
