'use client'

import { formatDate } from '@/lib/utils'

interface TrendPoint {
  date: Date | string
  code: string
  runningPct: number
}

export default function AttendanceTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return null

  const maxPct = 100
  const minPct = 0
  const height = 120
  const width = 300
  const padding = { top: 10, right: 10, bottom: 30, left: 30 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.runningPct - minPct) / (maxPct - minPct)) * chartHeight,
    pct: d.runningPct,
    date: d.date,
    code: d.code,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Area fill
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
    ` L ${points[0].x} ${padding.top + chartHeight} Z`

  // Y-axis labels
  const yTicks = [0, 25, 50, 75, 100]

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: '280px' }}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / 100) * chartHeight
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
              <text
                x={padding.left - 4}
                y={y + 4}
                textAnchor="end"
                fontSize="8"
                fill="#9ca3af"
              >
                {tick}%
              </text>
            </g>
          )
        })}

        {/* Area */}
        <path d={areaD} fill="#006837" fillOpacity="0.1" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#006837" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#006837" />
            <title>{formatDate(p.date)}: {p.pct.toFixed(1)}% ({p.code})</title>
          </g>
        ))}

        {/* X-axis first and last dates */}
        <text
          x={points[0].x}
          y={height - 4}
          textAnchor="start"
          fontSize="7"
          fill="#9ca3af"
        >
          {formatDate(points[0].date)}
        </text>
        <text
          x={points[points.length - 1].x}
          y={height - 4}
          textAnchor="end"
          fontSize="7"
          fill="#9ca3af"
        >
          {formatDate(points[points.length - 1].date)}
        </text>
      </svg>
    </div>
  )
}
