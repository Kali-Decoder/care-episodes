'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ParameterTrend, TrendPoint } from '../lib/reportTrends'
import { formatTrendDate, shortTrendDate } from '../lib/reportTrends'
import { CARE_EPISODE } from '../routes'
import type { ResultTrend } from '../types'
import { MUTED, NAVY, TEAL, cardStyle, monoFont, sansFont } from '../ui'

const TREND_LABEL: Record<ResultTrend, string> = {
  rising: '↑ Rising',
  falling: '↓ Falling',
  stable: '→ Stable',
  first_reading: 'First reading',
}

function flagColor(flag: ParameterTrend['latest_flag']): string {
  if (flag === 'low' || flag === 'high') return '#C45C5C'
  return TEAL
}

type ParameterTrendChartProps = {
  trend: ParameterTrend
  index?: number
}

type TooltipState = {
  point: TrendPoint
  index: number
  xPct: number
  yPct: number
}

export default function ParameterTrendChart({ trend, index = 0 }: ParameterTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { points, ref_low, ref_high, display_name, unit, latest_value, latest_flag, latest_trend } =
    trend

  const chartW = 560
  const chartH = 160
  const padL = 44
  const padR = 16
  const padT = 16
  const padB = 36
  const innerW = chartW - padL - padR
  const innerH = chartH - padT - padB

  const values = points.map((p) => p.value)
  const dataMin = Math.min(...values, ref_low)
  const dataMax = Math.max(...values, ref_high)
  const yPad = (dataMax - dataMin) * 0.12 || 1
  const yMin = dataMin - yPad
  const yMax = dataMax + yPad
  const yRange = yMax - yMin || 1

  const toX = (i: number) => padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const toY = (v: number) => padT + innerH - ((v - yMin) / yRange) * innerH

  const linePts = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ')
  const refTop = toY(ref_high)
  const refBottom = toY(ref_low)
  const refH = Math.max(0, refBottom - refTop)

  const lineColor =
    latest_trend === 'falling' ? '#C45C5C' : latest_trend === 'rising' ? '#D4924A' : TEAL

  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yRange * i) / yTicks)

  const showTooltip = (point: TrendPoint, i: number) => {
    const x = toX(i)
    const y = toY(point.value)
    setTooltip({
      point,
      index: i,
      xPct: (x / chartW) * 100,
      yPct: (y / chartH) * 100,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ ...cardStyle, borderRadius: 12, padding: '18px 20px 16px', overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: NAVY, margin: '0 0 4px' }}>
            {display_name}
          </h3>
          <p style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, margin: 0, letterSpacing: '0.08em' }}>
            {trend.test_code} · Ref {ref_low}–{ref_high} {unit}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: monoFont, fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>
            {latest_value}
            <span style={{ fontSize: 12, fontWeight: 400, color: MUTED, marginLeft: 4 }}>{unit}</span>
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: flagColor(latest_flag),
                fontWeight: 700,
              }}
            >
              {latest_flag}
            </span>
            <span style={{ fontFamily: monoFont, fontSize: 9, color: MUTED }}>{TREND_LABEL[latest_trend]}</span>
          </div>
        </div>
      </div>

      <div ref={chartRef} style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          width="100%"
          style={{ display: 'block', maxHeight: 180 }}
          role="img"
          aria-label={`${display_name} trend from ${formatTrendDate(points[0].date)} to ${formatTrendDate(points[points.length - 1].date)}`}
          onMouseLeave={() => setTooltip(null)}
        >
          <rect
            x={padL}
            y={refTop}
            width={innerW}
            height={refH}
            fill="rgba(123,174,142,0.12)"
            stroke="rgba(123,174,142,0.35)"
            strokeWidth={1}
            rx={4}
          />
          <text x={padL + 6} y={refTop + 12} fill={TEAL} fontSize={9} fontFamily={monoFont}>
            normal range
          </text>

          {yTickValues.map((v, i) => {
            const y = toY(v)
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#eef0f8" strokeWidth={1} />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill={MUTED}
                  fontSize={9}
                  fontFamily={monoFont}
                >
                  {v.toFixed(v >= 10 ? 0 : 1)}
                </text>
              </g>
            )
          })}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke={lineColor}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={linePts}
            />
          )}

          {points.map((p, i) => {
            const x = toX(i)
            const y = toY(p.value)
            const isLatest = i === points.length - 1
            const isHovered = tooltip?.index === i
            const outOfRange = p.value < ref_low || p.value > ref_high
            return (
              <g key={`${p.date}-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => showTooltip(p, i)}
                  onFocus={() => showTooltip(p, i)}
                  onBlur={() => setTooltip(null)}
                />
                {isHovered && (
                  <circle cx={x} cy={y} r={12} fill={`${lineColor}18`} pointerEvents="none" />
                )}
                {isLatest && !isHovered && (
                  <circle cx={x} cy={y} r={10} fill={`${lineColor}22`} pointerEvents="none" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isLatest || isHovered ? 5.5 : 4}
                  fill={outOfRange ? '#C45C5C' : isLatest || isHovered ? lineColor : '#fff'}
                  stroke={outOfRange ? '#C45C5C' : lineColor}
                  strokeWidth={2}
                  pointerEvents="none"
                />
                <text
                  x={x}
                  y={chartH - 8}
                  textAnchor="middle"
                  fill={isLatest || isHovered ? NAVY : MUTED}
                  fontSize={9}
                  fontWeight={isLatest || isHovered ? 700 : 400}
                  fontFamily={monoFont}
                  pointerEvents="none"
                >
                  {shortTrendDate(p.date)}
                </text>
              </g>
            )
          })}
        </svg>

        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.xPct}%`,
              top: `${tooltip.yPct}%`,
              transform: 'translate(-50%, calc(-100% - 12px))',
              zIndex: 10,
              minWidth: 200,
              maxWidth: 260,
              background: NAVY,
              color: '#fff',
              borderRadius: 10,
              padding: '12px 14px',
              boxShadow: '0 12px 32px rgba(10, 10, 92, 0.28)',
              pointerEvents: 'auto',
              fontFamily: sansFont,
            }}
          >
            <p
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                margin: '0 0 6px',
              }}
            >
              {formatTrendDate(tooltip.point.date)}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: monoFont }}>
              {tooltip.point.value} {unit}
            </p>
            {tooltip.point.episode_label && (
              <p style={{ fontSize: 13, margin: '0 0 10px', lineHeight: 1.45, color: 'rgba(255,255,255,0.88)' }}>
                Episode: {tooltip.point.episode_label}
              </p>
            )}
            {tooltip.point.episode_id && (
              <Link
                href={CARE_EPISODE(tooltip.point.episode_id)}
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Open episode →
              </Link>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 14px',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #F0EBE3',
        }}
      >
        {points.map((p, i) => (
          <button
            key={`${p.date}-legend-${i}`}
            type="button"
            onMouseEnter={() => showTooltip(p, i)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => showTooltip(p, i)}
            onBlur={() => setTooltip(null)}
            style={{
              fontFamily: sansFont,
              fontSize: 12,
              color: tooltip?.index === i ? NAVY : '#6B6560',
              fontWeight: tooltip?.index === i || i === points.length - 1 ? 600 : 400,
              background: tooltip?.index === i ? '#f0f0fd' : 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: monoFont, fontSize: 10, color: MUTED, marginRight: 6 }}>
              {formatTrendDate(p.date)}
            </span>
            {p.value} {unit}
            {p.episode_label ? (
              <span style={{ color: MUTED, marginLeft: 6 }}>· {p.episode_label}</span>
            ) : null}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
