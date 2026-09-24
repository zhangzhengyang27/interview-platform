"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PieDataItem {
  name: string;
  count: number;
  color?: string;
}

interface CategoryPieChartProps {
  data: PieDataItem[];
  loading?: boolean;
}

const DEFAULT_COLORS = [
  "var(--primary)",
  "#f54e00",
  "#ff8a65",
  "#ffb74d",
  "#81c784",
  "#64b5f6",
  "#ba68c8",
];

export function CategoryPieChart({ data, loading }: CategoryPieChartProps) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-on-surface-variant">
        分类数据加载中...
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={true}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-bright)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "8px",
            color: "var(--on-surface)",
            fontSize: "12px",
          }}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : Number(value) || 0;
            return [
              `${num} 题 (${total > 0 ? ((num / total) * 100).toFixed(1) : 0}%)`,
              name,
            ];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
