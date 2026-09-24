"use client";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ProgressDataItem {
  date: string;
  count: number;
}

interface ProgressLineChartProps {
  data: ProgressDataItem[];
  loading?: boolean;
}

export function ProgressLineChart({ data, loading }: ProgressLineChartProps) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-on-surface-variant">
        进度数据加载中...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }}
          tickFormatter={(value: string) => value.slice(5)} // 显示 MM-DD
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface-bright)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "8px",
            color: "var(--on-surface)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "var(--on-surface)", fontWeight: 600 }}
          formatter={(value) => [`${value} 题`, "刷题数"]}
          labelFormatter={(label) => `日期: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ fill: "var(--primary)", r: 3 }}
          activeDot={{ r: 5, stroke: "var(--primary)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
