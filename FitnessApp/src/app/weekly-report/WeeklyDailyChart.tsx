"use client";

import { useEffect, useMemo, useState } from "react";

export default function WeeklyDailyChart({
  weekStart,
  dailyCounts,
}: {
  weekStart: string;
  dailyCounts: number[]; // length 7
}) {
  const storageKey = `wr_labels_${weekStart}`;
  const [labels, setLabels] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) setLabels(parsed as string[]);
      }
    } catch {}
  }, [storageKey]);

  const max = Math.max(1, ...dailyCounts);

  function updateLabel(idx: number, value: string) {
    const next = labels.slice();
    next[idx] = value;
    setLabels(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }

  const chartPoints = dailyCounts.map((count, i) => {
    const x = ((i + 0.5) / 7) * 100; // Center of each column
    const normalizedHeight = max > 0 ? count / max : 0;
    const barHeightPct = Math.max(6, normalizedHeight * 96);
    const y = 100 - barHeightPct; // Align with bar top
    return { x, y, count };
  });

  // Area fill path: from bottom, through all points, back to bottom
  const areaPath = chartPoints.length > 0 
    ? `M ${chartPoints[0].x} 100 ${chartPoints.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${chartPoints[chartPoints.length - 1].x} 100 Z`
    : '';

  // Extended line path: extend both ends for longer appearance
  const firstX = chartPoints[0]?.x || 0;
  const lastX = chartPoints[chartPoints.length - 1]?.x || 100;
  const lineExtension = 3; 
  const extendedLinePath = chartPoints.length > 0
    ? `M ${Math.max(0, firstX - lineExtension)} ${chartPoints[0].y} ${chartPoints.map((p, i) => `L ${p.x} ${p.y}`).join(' ')} L ${Math.min(100, lastX + lineExtension)} ${chartPoints[chartPoints.length - 1].y}`
    : '';

  return (
    <div className="relative h-48">
      <div className="absolute inset-0 grid grid-cols-7 gap-3 items-end">
        {dailyCounts.map((count, i) => {
          const heightPct = Math.round((count / max) * 100);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-xs font-medium text-gray-700">{count}</div>
              <div className="w-9 bg-gradient-to-b from-purple-500 to-pink-500 rounded-t" style={{ height: `${Math.max(6, (heightPct / 100) * 96)}%` }} />
              <input
                value={labels[i]}
                onChange={(e) => updateLabel(i, e.target.value)}
                className="w-14 text-center text-xs text-gray-700 border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white/80"
              />
            </div>
          );
        })}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Filled area under line */}
        <path 
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Line connecting all points */}
        <path
          d={extendedLinePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="0.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {chartPoints.map((p, i) => (
          <circle 
            key={i}
            cx={p.x} 
            cy={p.y} 
            r="1" 
            fill="#ec4899"
          />
        ))}
      </svg>
    </div>
  );
}


