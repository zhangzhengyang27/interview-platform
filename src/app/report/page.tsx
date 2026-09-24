"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AbilityRadar } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";

interface ReportData {
  overview: {
    totalPractices: number;
    completedCount: number;
    masteredCount: number;
    accuracyRate: number;
    currentStreak: number;
  };
  difficultyDistribution: { name: string; value: number }[];
  suggestions: string[];
}

interface AbilityData {
  subject: string;
  score: number;
  fullMark: number;
}

interface ProgressData {
  date: string;
  count: number;
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="animate-pulse">
        <div className="h-8 bg-surface-high rounded w-24 mb-2" />
        <div className="h-4 bg-surface-high rounded w-16" />
      </div>
    </Card>
  );
}

function StatCard({ value, label, loading }: { value: number | string; label: string; loading?: boolean }) {
  if (loading) {
    return <SkeletonCard />;
  }
  return (
    <Card className="p-4 text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-sm text-on-surface-variant mt-1">{label}</div>
    </Card>
  );
}

export default function ReportPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [abilityData, setAbilityData] = useState<AbilityData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportRes, abilityRes, extendedRes] = await Promise.all([
          fetch("/api/stats/report"),
          fetch("/api/stats/ability"),
          fetch("/api/stats/extended"),
        ]);

        if (reportRes.ok) {
          const report = await reportRes.json();
          setReportData(report);
        }

        if (abilityRes.ok) {
          const ability = await abilityRes.json();
          setAbilityData(ability.abilities || []);
        }

        if (extendedRes.ok) {
          const extended = await extendedRes.json();
          setProgressData(extended.dailyStats || []);
        }
      } catch (error) {
        console.error("Failed to fetch report data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalDifficulty =
    (reportData?.difficultyDistribution.reduce((sum, d) => sum + d.value, 0) || 1);

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">学习报告</h1>

        {/* Row 1: 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            value={reportData?.overview.totalPractices ?? "--"}
            label="总刷题数"
            loading={loading}
          />
          <StatCard
            value={String(reportData?.overview.accuracyRate ?? "--") + "%"}
            label="正确率"
            loading={loading}
          />
          <StatCard
            value={reportData?.overview.masteredCount ?? "--"}
            label="已掌握"
            loading={loading}
          />
          <StatCard
            value={`${reportData?.overview.currentStreak ?? "--"} 天`}
            label="连续打卡"
            loading={loading}
          />
        </div>

        {/* Row 2: 图表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">能力分布</h2>
            <AbilityRadar data={abilityData} loading={loading} />
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">练习趋势</h2>
            <ProgressLineChart data={progressData} loading={loading} />
          </Card>
        </div>

        {/* Row 3: 难度分布 */}
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">难度分布</h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-surface-high rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {reportData?.difficultyDistribution.map((item) => {
                const percentage = totalDifficulty > 0 ? (item.value / totalDifficulty) * 100 : 0;
                const colorMap: Record<string, string> = {
                  "简单": "var(--success)",
                  "中等": "var(--warning)",
                  "困难": "var(--error)",
                };
                const bgColor = colorMap[item.name] || "var(--on-surface-variant)";
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-sm text-on-surface-variant w-12 shrink-0">
                      {item.name}
                    </span>
                    <div className="flex-1 h-6 bg-surface-high rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: bgColor,
                        }}
                      />
                    </div>
                    <span className="text-sm text-on-surface-variant w-10 text-right">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Row 4: 学习建议 + 分享 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">学习建议</h2>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-surface-high rounded" />
                ))}
              </div>
            ) : reportData?.suggestions && reportData.suggestions.length > 0 ? (
              <ul className="space-y-2">
                {reportData.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">暂无建议，继续加油！</p>
            )}
          </Card>

          <Card className="p-4 flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-3 self-start">分享报告</h2>
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-on-surface-variant text-center">
                将你的学习成果分享给朋友
              </p>
              <Button variant="primary" size="md">
                生成分享图片
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
