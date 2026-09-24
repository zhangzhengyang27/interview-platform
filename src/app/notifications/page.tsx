"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  notifications: NotificationItem[];
  pagination: { page: number; totalPages: number };
  unreadCount: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TYPE_META: Record<string, { label: string; icon: string }> = {
  follow: { label: "关注", icon: "👤" },
  comment_reply: { label: "评论回复", icon: "💬" },
  mention: { label: "提及", icon: "@" },
  reminder: { label: "提醒", icon: "⏰" },
  system: { label: "系统", icon: "📢" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`;
  if (diff < day) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < day * 7) return `${Math.floor(diff / day)} 天前`;
  return d.toLocaleDateString("zh-CN");
}

function NotificationsContent() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR<NotificationResponse>(
    `/api/notifications?page=${page}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    mutate();
  };

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    mutate();
  };

  const removeOne = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        加载中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-error">
        加载失败，请稍后重试
      </div>
    );
  }

  if (data.notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
        <Bell className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm">暂无通知</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <CheckCheck className="h-4 w-4" />
          {data.unreadCount > 0
            ? `您有 ${data.unreadCount} 条未读通知`
            : "全部通知已读"}
        </div>
        {data.unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm px-3 py-1.5 rounded transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
          >
            全部已读
          </button>
        )}
      </div>
      {data.notifications.map((n) => {
        const meta = TYPE_META[n.type] ?? { label: "通知", icon: "🔔" };
        const content = (
          <div
            className={cn(
              "flex gap-3 p-4 rounded-lg border border-outline-variant bg-surface-bright transition-colors",
              n.read ? "opacity-70" : "border-primary/40 bg-primary/5"
            )}
          >
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{meta.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface-highest text-on-surface-variant">
                  {meta.label}
                </span>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-label="未读" />
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-on-surface break-words">{n.title}</p>
              {n.body && (
                <p className="mt-0.5 text-sm text-on-surface-variant break-words">{n.body}</p>
              )}
              <p className="mt-1.5 text-xs text-on-surface-variant">{formatTime(n.createdAt)}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {!n.read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    markOneRead(n.id);
                  }}
                  className="text-xs text-on-surface-variant hover:text-primary"
                  title="标记已读"
                >
                  已读
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeOne(n.id);
                }}
                className="text-xs text-on-surface-variant hover:text-error"
                title="删除通知"
              >
                删除
              </button>
            </div>
          </div>
        );
        const wrapped = n.link ? (
          <Link key={n.id} href={n.link} className="block" onClick={() => !n.read && markOneRead(n.id)}>
            {content}
          </Link>
        ) : (
          <div key={n.id}>{content}</div>
        );
        return wrapped;
      })}

      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm rounded border border-outline-variant disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-on-surface-variant">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded border border-outline-variant disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-semibold text-on-surface mb-4">通知</h1>
        <NotificationsContent />
      </div>
    </AuthGuard>
  );
}
