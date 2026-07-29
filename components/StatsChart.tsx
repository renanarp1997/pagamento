"use client";

import type { PeriodData } from "@/types/payment";

type StatsChartProps = {
  data: PeriodData;
};

const colors = {
  V: "#10b981",
  M: "#f59e0b",
  O: "#cbd5e1"
};

export function StatsChart({ data }: StatsChartProps) {
  const entries = Object.entries(data).sort(([a], [b]) => Number(a) - Number(b));
  const width = Math.max(entries.length * 22, 320);
  const height = 112;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label="Monthly day status chart">
        <line x1="8" x2={width - 8} y1="88" y2="88" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="2" />
        {entries.map(([day, status], index) => {
          const barHeight = status === "V" ? 64 : status === "M" ? 42 : 18;
          const x = 14 + index * 22;
          const y = 88 - barHeight;

          return (
            <g key={day}>
              <rect x={x} y={y} width="12" height={barHeight} rx="6" fill={colors[status]} />
              <text x={x + 6} y="106" textAnchor="middle" className="fill-slate-500 text-[9px] font-semibold dark:fill-slate-400">
                {day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
