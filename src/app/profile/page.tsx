"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  Pencil,
  BookOpen,
  Clock,
  ListTodo,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface RecentPractice {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  createdAt: string;
  status: string;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
  stats: {
    practiceCount: number;
    noteCount: number;
    planCount: number;
  };
}

interface FollowStats {
  followingCount: number;
  followersCount: number;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return formatDate(iso);
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "var(--success-container)", text: "var(--success)" },
  medium: { bg: "var(--warning-container)", text: "var(--warning-text)" },
  hard: { bg: "var(--error-container)", text: "var(--error)" },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentPractices, setRecentPractices] = useState<RecentPractice[]>([]);
  const [followStats, setFollowStats] = useState<FollowStats>({ followingCount: 0, followersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, statsRes, followRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/stats"),
          fetch("/api/follow"),
        ]);
        if (!userRes.ok) throw new Error("加载个人资料失败");
        const userData = await userRes.json();
        setProfile({ ...userData.user, stats: userData.stats });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setRecentPractices(statsData.recentPractices ?? []);
        }

        if (followRes.ok) {
          const followData = await followRes.json();
          setFollowStats({
            followingCount: followData.followingCount ?? 0,
            followersCount: followData.followersCount ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--outline-variant)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      </AuthGuard>
    );
  }

  if (error || !profile) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <p className="text-lg mb-4" style={{ color: "var(--on-surface)" }}>
            {error || "加载失败"}
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </AuthGuard>
    );
  }

  const memberDays = daysSince(profile.createdAt);

  return (
    <AuthGuard>
      <div className="max-w-[1080px] mx-auto w-full px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 pt-8">
          {/* ── Left: Profile Card (sticky) ── */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-0 overflow-hidden">
              {/* Cover */}
              <div
                className="h-28"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-container) 0%, var(--tertiary-container) 100%)",
                }}
              />

              <div className="px-5 pb-5 -mt-12">
                <Avatar
                  src={profile.image}
                  name={profile.name || profile.email}
                  size={80}
                  className="ring-4 ring-surface"
                />

                <div className="mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1
                      className="text-lg font-semibold tracking-tight"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {profile.name || "用户"}
                    </h1>
                    {profile.role === "admin" && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: "var(--primary-container)",
                          color: "var(--on-primary-container)",
                        }}
                      >
                        管理员
                      </span>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p
                    className="text-sm mt-3 leading-relaxed"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {profile.bio}
                  </p>
                )}

                <div
                  className="mt-4 pt-4 space-y-2.5 border-t"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <MetaRow icon={<Mail className="w-3.5 h-3.5" />} text={profile.email} />
                  <MetaRow
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    text={`加入于 ${formatDate(profile.createdAt)}`}
                  />
                  <MetaRow
                    icon={<Clock className="w-3.5 h-3.5" />}
                    text={`已加入 ${memberDays} 天`}
                  />
                </div>

                {/* 关注/粉丝统计 */}
                <div
                  className="mt-4 pt-4 grid grid-cols-2 gap-2 border-t"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <div className="text-center">
                    <div
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {followStats.followingCount}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      关注
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {followStats.followersCount}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      粉丝
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link href="/settings">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Pencil className="w-4 h-4" />
                      编辑资料
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Quick actions card */}
            <Card className="p-0 overflow-hidden mt-4">
              <div
                className="px-5 py-3 border-b"
                style={{ borderColor: "var(--outline-variant)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  快捷入口
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                <SidebarLink href="/bookmarks" label="我的收藏" desc="收藏的题目" />
                <SidebarLink href="/study-plans" label="学习计划" desc="规划复习路线" />
                <SidebarLink href="/questions" label="题库" desc="浏览全部题目" />
              </div>
            </Card>
          </aside>

          {/* ── Right: Main ── */}
          <div className="min-w-0 space-y-8">
            {/* Stats */}
            <section>
              <SectionHeader title="数据概览" />
              <div
                className="grid grid-cols-3 rounded-xl border overflow-hidden"
                style={{
                  borderColor: "var(--outline-variant)",
                  backgroundColor: "var(--surface-low)",
                }}
              >
                <StatCell value={profile.stats.practiceCount} label="练习记录" />
                <div className="border-x" style={{ borderColor: "var(--outline-variant)" }}>
                  <StatCell value={profile.stats.noteCount} label="我的笔记" />
                </div>
                <Link href="/study-plans" className="block transition-colors hover:bg-surface-high">
                  <StatCell value={profile.stats.planCount} label="学习计划" />
                </Link>
              </div>
            </section>

            {/* Recent Practices */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <SectionTitle>最近练习</SectionTitle>
                <Link
                  href="/study-plans"
                  className="inline-flex items-center gap-0.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <Card className="p-0 overflow-hidden">
                {recentPractices.length === 0 ? (
                  <div className="text-center py-14">
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--surface-high)",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      还没有练习记录
                    </p>
                    <Link href="/questions" className="inline-block mt-4">
                      <Button variant="primary" size="sm">
                        去刷题
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
                    {recentPractices.map((practice) => (
                      <li
                        key={practice.id}
                        className="flex items-center gap-3 px-5 py-3.5"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: "var(--surface-high)",
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--on-surface)" }}
                          >
                            {practice.title}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--on-surface-variant)" }}
                          >
                            {practice.category} · {formatRelative(practice.createdAt)}
                          </p>
                        </div>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                          style={{
                            backgroundColor:
                              DIFFICULTY_COLORS[practice.difficulty]?.bg ??
                              "var(--surface-high)",
                            color:
                              DIFFICULTY_COLORS[practice.difficulty]?.text ??
                              "var(--on-surface-variant)",
                          }}
                        >
                          {practice.difficulty}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function MetaRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: "var(--on-surface-variant)" }}
    >
      <span style={{ color: "var(--on-surface-variant)" }}>{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function SidebarLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block px-5 py-3 transition-colors hover:bg-surface-high group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {desc}
          </p>
        </div>
        <ChevronRight
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--on-surface-variant)" }}
        />
      </div>
    </Link>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 px-1">
      <SectionTitle>{title}</SectionTitle>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-sm font-semibold uppercase tracking-wide"
      style={{ color: "var(--on-surface-variant)" }}
    >
      {children}
    </h2>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center py-5 px-4">
      <div
        className="text-2xl font-semibold leading-none tabular-nums"
        style={{ color: "var(--on-surface)" }}
      >
        {value}
      </div>
      <div className="text-xs mt-1.5" style={{ color: "var(--on-surface-variant)" }}>
        {label}
      </div>
    </div>
  );
}
