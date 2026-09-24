"use client";

import { useState, useMemo, memo } from "react";

// ─── Heatmap Helpers ─────────────────────────────────────────────────────────

const DAY_LABELS = ["", "一", "", "三", "", "五", ""];
const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function getHeatmapColor(count: number): string {
  if (count === 0) return "var(--surface-highest)";
  if (count <= 2) return "var(--heatmap-low)";
  if (count <= 5) return "var(--heatmap-mid)";
  return "var(--primary)";
}

interface HeatmapGridData {
  grid: (null | { date: string; count: number })[][];
  monthLabels: { label: string; col: number }[];
}

function buildHeatmapGrid(
  data: { date: string; count: number }[]
): HeatmapGridData {
  if (data.length === 0) {
    return { grid: [], monthLabels: [] };
  }

  const startDate = new Date(data[0].date + "T00:00:00");
  const startDay = startDate.getDay(); // 0=Sun

  // Pad beginning with null cells so first date aligns to correct weekday row
  const padded: (null | { date: string; count: number })[] = [];
  for (let i = 0; i < startDay; i++) padded.push(null);
  for (const entry of data) padded.push(entry);

  // Build columns (weeks), each with 7 rows (Sun-Sat)
  const grid: (null | { date: string; count: number })[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const col = padded.slice(i, i + 7);
    while (col.length < 7) col.push(null);
    grid.push(col);
  }

  // Detect month boundaries for top labels
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < 7; row++) {
      const cell = grid[col][row];
      if (cell) {
        const month = new Date(cell.date + "T00:00:00").getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTH_NAMES[month], col });
          lastMonth = month;
        }
        break;
      }
    }
  }

  return { grid, monthLabels };
}

// ─── CalendarHeatmap Component ───────────────────────────────────────────────

export const CalendarHeatmap = memo(function CalendarHeatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { grid, monthLabels } = useMemo(() => buildHeatmapGrid(data), [data]);

  if (grid.length === 0) {
    return (
      <div className="text-sm py-8 text-center" style={{ color: "var(--on-surface-variant)" }}>
        No heatmap data available
      </div>
    );
  }

  const cellSize = 14;
  const cellGap = 3;
  const labelWidth = 36;
  const headerHeight = 24;

  return (
    <div className="relative overflow-x-auto pb-2">
      {/* Month labels */}
      <div
        className="flex ml-[40px]"
        style={{ height: headerHeight + "px" }}
      >
        {monthLabels.map((m, idx) => {
          const nextCol =
            idx < monthLabels.length - 1
              ? monthLabels[idx + 1].col
              : grid.length;
          const spanCols = nextCol - m.col;
          const width = spanCols * (cellSize + cellGap);
          return (
            <div
              key={`${m.label}-${m.col}`}
              className="shrink-0"
              style={{
                width: width + "px",
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--on-surface-variant)",
                paddingLeft: "2px",
                lineHeight: headerHeight + "px",
              }}
            >
              {width > 24 ? m.label : ""}
            </div>
          );
        })}
      </div>

      <div className="flex">
        {/* Day-of-week labels */}
        <div
          className="shrink-0 flex flex-col"
          style={{
            width: labelWidth + "px",
            gap: cellGap + "px",
            paddingRight: "4px",
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{
                height: cellSize + "px",
                fontSize: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--on-surface-variant)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="flex" style={{ gap: cellGap + "px" }}>
          {grid.map((col, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col"
              style={{ gap: cellGap + "px" }}
            >
              {col.map((cell, rowIdx) => (
                <div
                  key={rowIdx}
                  style={{
                    width: cellSize + "px",
                    height: cellSize + "px",
                    backgroundColor: cell
                      ? getHeatmapColor(cell.count)
                      : "transparent",
                    borderRadius: "2px",
                    cursor: cell ? "pointer" : "default",
                    transition: "outline-color 0.15s",
                  }}
                  className={
                    cell
                      ? "hover:outline hover:outline-1 hover:outline-[var(--primary)]"
                      : ""
                  }
                  onMouseEnter={(e) => {
                    if (!cell) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      date: cell.date,
                      count: cell.count,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-md text-xs whitespace-nowrap"
          style={{
            left: tooltip.x + "px",
            top: tooltip.y - 10 + "px",
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--surface-bright)",
            border: "1px solid var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          <span className="font-semibold">
            {tooltip.count} 题
          </span>
          <span
            className="ml-1.5"
            style={{ color: "var(--on-surface-variant)" }}
          >
            on {tooltip.date}
          </span>
        </div>
      )}
    </div>
  );
});

// Export helper for use in parent component
export { getHeatmapColor };
