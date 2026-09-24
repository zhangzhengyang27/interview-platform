"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { DifficultyBadge } from "@/components/ui/Badge";

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  joinedAt: string;
  stats: {
    practiceCount: number;
    solutionCount: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean | null;
  isSelf: boolean;
}

interface UserSolution {
  id: string;
  language: string | null;
  upvotes: number;
  isFeatured: boolean;
  createdAt: string;
  question: { id: string; title: string; difficulty: string };
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [solutions, setSolutions] = useState<UserSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/users/${userId}/profile`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return;
        }
        setProfile(await r.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    fetch(`/api/solutions/user/${userId}?take=10`)
      .then(async (r) => (r.ok ? (await r.json()).solutions : []))
      .then(setSolutions)
      .catch(() => setSolutions([]));
  }, [userId]);

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/users/${userId}`)}`);
      return;
    }
    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await fetch(`/api/follow?followingId=${profile.id}`, { method: "DELETE" });
        setProfile({
          ...profile,
          isFollowing: false,
          stats: { ...profile.stats, followers: profile.stats.followers - 1 },
        });
      } else {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: profile.id }),
        });
        if (res.ok) {
          setProfile({
            ...profile,
            isFollowing: true,
            stats: { ...profile.stats, followers: profile.stats.followers + 1 },
          });
        }
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        加载中...
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
        <p className="text-lg mb-2">用户不存在</p>
        <Link href="/leaderboard" className="text-sm text-primary hover:underline">
          去排行榜看看
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "练习次数", value: profile.stats.practiceCount },
    { label: "题解", value: profile.stats.solutionCount },
    { label: "粉丝", value: profile.stats.followers },
    { label: "关注", value: profile.stats.following },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* 资料头部 */}
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-surface-container flex items-center justify-center text-2xl font-medium text-on-surface-variant">
          {profile.image ? (
             
            <img src={profile.image} alt={profile.name ?? "用户头像"} className="w-full h-full object-cover" />
          ) : (
            (profile.name?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-on-surface">{profile.name ?? "未命名用户"}</h1>
            {profile.isSelf ? (
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded text-sm border border-outline-variant text-on-surface-variant hover:text-primary"
              >
                编辑资料
              </Link>
            ) : (
              <Button
                variant={profile.isFollowing ? "secondary" : "primary"}
                onClick={toggleFollow}
                disabled={followLoading}
              >
                {profile.isFollowing ? "已关注" : "关注"}
              </Button>
            )}
          </div>
          {profile.bio && <p className="mt-2 text-sm text-on-surface-variant whitespace-pre-wrap">{profile.bio}</p>}
          <p className="mt-2 text-xs text-on-surface-variant">
            加入于 {new Date(profile.joinedAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--surface-container)" }}>
            <div className="text-xl font-semibold text-on-surface">{s.value}</div>
            <div className="text-xs text-on-surface-variant mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 题解列表 */}
      <div>
        <h2 className="text-lg font-medium text-on-surface mb-3">TA 的题解</h2>
        {solutions.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">还没有发布过题解</p>
        ) : (
          <div className="space-y-2">
            {solutions.map((s) => (
              <Link
                key={s.id}
                href={`/questions/${s.question.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border border-outline-variant hover:border-primary transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface truncate">{s.question.title}</span>
                    {s.isFeatured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">精选</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {new Date(s.createdAt).toLocaleDateString("zh-CN")}
                    {s.language ? ` · ${s.language}` : ""}
                  </p>
                </div>
                <DifficultyBadge difficulty={s.question.difficulty as "easy" | "medium" | "hard"} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
