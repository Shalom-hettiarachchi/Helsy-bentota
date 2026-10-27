'use client'

// A small port of shadcn/ui's chart component (ui/chart.tsx) for this project.
// Like shadcn, it wraps Recharts: a config maps each data key to a label and
// colour, exposed as CSS variables (--color-<key>) for the chart to use.
import { createContext, useContext, useId } from 'react'
import { Legend, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './chart.module.css'

const ChartContext = createContext({ config: {} })
const useChart = () => useContext(ChartContext)

export function ChartContainer({ config, className = '', children, ...props }) {
  const id = `chart-${useId().replace(/:/g, '')}`
  const vars = Object.fromEntries(
    Object.entries(config)
      .filter(([, c]) => c.color)
      .map(([key, c]) => [`--color-${key}`, c.color]),
  )
  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={id} className={`${styles.container} ${className}`} style={vars} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = Tooltip
export const ChartLegend = Legend

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (v) => v,
  hideLabel = false,
  indicator = 'dot',
  nameKey,
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  const title = labelFormatter ? labelFormatter(label, payload) : label

  return (
    <div className={styles.tooltip}>
      {!hideLabel && title != null && <div className={styles.tooltipLabel}>{title}</div>}
      <div className={styles.tooltipItems}>
        {payload.map((item) => {
          const key = nameKey ? item.payload?.[nameKey] : item.dataKey || item.name
          const c = config[key] || {}
          const color = item.payload?.fill || item.color || c.color
          return (
            <div key={`${key}-${item.dataKey}`} className={styles.tooltipItem}>
              <span className={indicator === 'line' ? styles.indicatorLine : styles.indicatorDot} style={{ background: color }} />
              <span className={styles.tooltipName}>{c.label || item.name}</span>
              <span className={styles.tooltipValue}>{valueFormatter(item.value, key)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartLegendContent({ payload, nameKey }) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div className={styles.legend}>
      {payload.map((item) => {
        const key = nameKey ? item.payload?.[nameKey] : item.dataKey || item.value
        const c = config[key] || {}
        return (
          <div key={key} className={styles.legendItem}>
            <span className={styles.indicatorDot} style={{ background: item.color }} />
            {c.label || item.value}
          </div>
        )
      })}
    </div>
  )
}
