"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarDataItem {
  subject: string;
  score: number;
  fullMark: number;
}

interface AbilityRadarProps {
  data: RadarDataItem[];
  loading?: boolean;
}

export function AbilityRadar({ data, loading }: AbilityRadarProps) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-on-surface-variant">
        能力数据加载中...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--outline-variant)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "var(--on-surface-variant)", fontSize: 10 }}
        />
        <Radar
          name="能力值"
          dataKey="score"
          stroke="var(--primary)"
          fill="color-mix(in srgb, var(--primary) 20%, transparent)"
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
