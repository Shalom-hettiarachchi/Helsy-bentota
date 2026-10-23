'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from './chart'
import { STATUS_LABELS } from './context'
import styles from './admin.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthShort = (ym) => MONTHS[Number(ym.slice(5, 7)) - 1]
const monthLong = (ym) => `${monthShort(ym)} ${ym.slice(0, 4)}`
const compact = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n))
const number = (n) => Number(n || 0).toLocaleString('en-US')

const STATUS_COLORS = {
  confirmed: '#b3a35a',
  completed: '#7f9c86',
  pending: '#d8d2c0',
  cancelled: '#a35d57',
}
const COUNTRY_COLORS = ['#b3a35a', '#c9bc80', '#7f9c86', '#8aa4b8', '#b48a74', '#9b8fb0', '#6b6b6b']

export default function DashboardCharts({ charts, currency = 'LKR' }) {
  if (!charts) return null
  const { months, currentMonth } = charts
  const money = (v) => `${currency} ${number(v)}`

  const pastYear = months.filter((m) => m.month <= currentMonth)
  const income12 = pastYear.reduce((s, m) => s + m.income, 0)
  const nights12 = pastYear.reduce((s, m) => s + m.nights, 0)

  const statusData = Object.entries(charts.status)
    .filter(([, n]) => n > 0)
    .map(([status, count]) => ({ status, count, fill: STATUS_COLORS[status] }))
  const statusTotal = statusData.reduce((s, d) => s + d.count, 0)
  const statusConfig = Object.fromEntries(Object.keys(STATUS_COLORS).map((s) => [s, { label: STATUS_LABELS[s] || s, color: STATUS_COLORS[s] }]))

  const countryData = charts.countries.map((c, i) => ({ ...c, fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }))

  return (
    <div className={styles.chartGrid}>
      <section className={`${styles.card} ${styles.chartWide}`}>
        <div className={styles.chartHead}>
          <div>
            <h2 className={styles.cardTitle}>Income per month</h2>
            <p className={styles.muted}>Confirmed and completed stays, split by the nights in each month. Includes the next 3 months.</p>
          </div>
          <div className={styles.chartFigure}>
            <strong>{money(income12)}</strong>
            <span>last 12 months</span>
          </div>
        </div>
        <ChartContainer config={{ income: { label: 'Income', color: 'var(--gold)' } }}>
          <BarChart data={months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={monthShort} />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compact} />
            <ChartTooltip cursor content={<ChartTooltipContent labelFormatter={monthLong} valueFormatter={money} />} />
            <Bar dataKey="income" radius={[4, 4, 0, 0]}>
              {months.map((m) => (
                <Cell key={m.month} fill="var(--color-income)" fillOpacity={m.month > currentMonth ? 0.4 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </section>

      <section className={`${styles.card} ${styles.chartWide}`}>
        <div className={styles.chartHead}>
          <div>
            <h2 className={styles.cardTitle}>Occupancy</h2>
            <p className={styles.muted}>Share of nights booked each month (confirmed and completed).</p>
          </div>
          <div className={styles.chartFigure}>
            <strong>{number(nights12)}</strong>
            <span>nights booked, last 12 months</span>
          </div>
        </div>
        <ChartContainer config={{ occupancy: { label: 'Occupancy', color: 'var(--gold)' }, nights: { label: 'Nights' } }}>
          <AreaChart data={months} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="fillOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-occupancy)" stopOpacity={0.55} />
                <stop offset="95%" stopColor="var(--color-occupancy)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={monthShort} />
            <YAxis tickLine={false} axisLine={false} width={44} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={monthLong}
                  valueFormatter={(v, key) => (key === 'occupancy' ? `${v}%` : number(v))}
                />
              }
            />
            <Area dataKey="occupancy" type="monotone" stroke="var(--color-occupancy)" strokeWidth={2} fill="url(#fillOccupancy)" />
            <Area dataKey="nights" type="monotone" stroke="none" fill="none" activeDot={false} />
          </AreaChart>
        </ChartContainer>
      </section>

      <section className={styles.card}>
        <div>
          <h2 className={`${styles.cardTitle} ${styles.chartTitle}`}>Bookings by status</h2>
          <p className={styles.muted}>Stays in the last 12 months and the next 3.</p>
        </div>
        {statusTotal === 0 ? (
          <p className={styles.empty}>No bookings yet.</p>
        ) : (
          <ChartContainer config={statusConfig} className={styles.chartSquare}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" valueFormatter={number} />} />
              <Pie data={statusData} dataKey="count" nameKey="status" innerRadius="58%" outerRadius="85%" paddingAngle={2} strokeWidth={2}>
                <Label
                  content={({ viewBox }) =>
                    viewBox?.cx != null && (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy - 4} className={styles.donutValue}>
                          {statusTotal}
                        </tspan>
                        <tspan x={viewBox.cx} y={viewBox.cy + 18} className={styles.donutLabel}>
                          bookings
                        </tspan>
                      </text>
                    )
                  }
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </section>

      <section className={styles.card}>
        <div>
          <h2 className={`${styles.cardTitle} ${styles.chartTitle}`}>Where guests come from</h2>
          <p className={styles.muted}>Bookings by country (not counting cancelled).</p>
        </div>
        {countryData.length === 0 ? (
          <p className={styles.empty}>No bookings yet.</p>
        ) : (
          <ChartContainer config={{ count: { label: 'Bookings' } }} className={styles.chartSquare}>
            <BarChart data={countryData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={96} />
              <ChartTooltip cursor content={<ChartTooltipContent hideLabel nameKey="name" valueFormatter={number} />} />
              <Bar dataKey="count" radius={4} barSize={22}>
                {countryData.map((c) => (
                  <Cell key={c.name} fill={c.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </section>
    </div>
  )
}
