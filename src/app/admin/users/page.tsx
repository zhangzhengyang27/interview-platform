"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { formatDateTime } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role: string;
  createdAt: string;
  _count?: { practiceHistory?: number; comments?: number };
}

interface PracticeRecord {
  id: string;
  status: string;
  durationSeconds: number;
  createdAt: string;
  question?: { title: string; difficulty: string };
}

interface CommentRecord {
  id: string;
  content: string;
  createdAt: string;
  question?: { title: string };
}

interface UserDetail extends UserItem {
  practiceHistory: PracticeRecord[];
  comments: CommentRecord[];
  _count: { practiceHistory: number; comments: number };
}

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  user: "用户",
  editor: "编辑",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { confirm, alert, dialog } = useConfirmDialog();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        take: String(pageSize),
        skip: String((page - 1) * pageSize),
      });
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.users ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 输入防抖：停止输入 400ms 后自动搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleChange = async (userId: string, role: string) => {
    const target = data.find((u) => u.id === userId);
    const action = role === "admin" ? "设为管理员" : "降为普通用户";
    const confirmed = await confirm({
      title: "权限变更",
      message: `确定将用户「${target?.name || target?.email || userId}」${action}吗？`,
      confirmText: action,
      danger: action === "降为普通用户",
    });
    if (!confirmed) return;
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      fetchList();
    } else {
      alert({ title: "操作失败", message: "操作失败，请稍后重试。" });
    }
  };

  const handleViewDetail = async (userId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const roleTag = (role: string) => {
    const colors: Record<string, { color: string; bg: string }> = {
      admin: { color: "var(--error)", bg: "var(--error-container)" },
      editor: { color: "var(--warning-text)", bg: "var(--warning-container)" },
      user: { color: "var(--info-text)", bg: "var(--info-container)" },
    };
    const c = colors[role] ?? { color: "var(--on-surface-variant)", bg: "var(--surface-high)" };
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: c.color, backgroundColor: c.bg }}>
        {ROLE_LABELS[role] || role}
      </span>
    );
  };

  const columns: ColumnDef<UserItem>[] = [
    {
      key: "user",
      title: "用户",
      width: 260,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.image ? (
            <img src={r.image} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}
            >
              {(r.name || r.email || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm truncate" style={{ color: "var(--on-surface)" }}>
              {r.name || "未设置昵称"}
            </div>
            <div className="text-xs truncate" style={{ color: "var(--on-surface-variant)" }}>
              {r.email}
            </div>
          </div>
        </div>
      ),
    },
    { key: "role", title: "角色", width: 100, render: (r) => roleTag(r.role) },
    {
      key: "practice",
      title: "练习次数",
      width: 100,
      align: "right",
      render: (r) => r._count?.practiceHistory ?? 0,
    },
    {
      key: "comments",
      title: "评论数",
      width: 100,
      align: "right",
      render: (r) => r._count?.comments ?? 0,
    },
    {
      key: "createdAt",
      title: "注册时间",
      width: 160,
      render: (r) => formatDateTime(r.createdAt),
    },
    {
      key: "actions",
      title: "操作",
      width: 200,
      render: (r) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleViewDetail(r.id)}
            className="inline-flex items-center gap-1 text-sm hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <Eye className="h-3.5 w-3.5" /> 详情
          </button>
          {r.role === "admin" ? (
            <button
              type="button"
              onClick={() => handleRoleChange(r.id, "user")}
              className="inline-flex items-center text-sm hover:opacity-70"
              style={{ color: "var(--error)" }}
            >
              降为普通用户
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleRoleChange(r.id, "admin")}
              className="inline-flex items-center text-sm hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
            >
              设为管理员
            </button>
          )}
        </div>
      ),
    },
  ];

  const cardClass = {
    backgroundColor: "var(--surface-bright)",
    borderColor: "var(--outline-variant)",
  } as const;

  return (
    <div className="space-y-4">
      <PageHeader
        title="用户管理"
        description={`共 ${total} 位用户`}
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="w-full sm:w-72">
          <Input
            placeholder="搜索用户名或邮箱"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setKeyword(searchInput);
                setPage(1);
              }
            }}
          />
        </div>
        }
      />

      <div className="rounded-xl border" style={cardClass}>
        <Table<UserItem>
          aria-label="用户管理列表"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText="暂无用户"
        />
      </div>
      <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />

      {/* 用户详情 */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="用户详情" width={760}>
        {detailLoading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            加载中…
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {detail.image ? (
                <img src={detail.image} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium"
                  style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}
                >
                  {(detail.name || detail.email || "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <div className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                  {detail.name || "未设置昵称"}
                </div>
                <div className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  {detail.email}
                </div>
                <div className="mt-1">{roleTag(detail.role)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleRoleChange(detail.id, detail.role === "admin" ? "user" : "admin")}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90"
                style={{
                  color: detail.role === "admin" ? "var(--error)" : "var(--on-primary)",
                  backgroundColor: detail.role === "admin" ? "var(--error-container)" : "var(--primary)",
                }}
              >
                {detail.role === "admin" ? "降为普通用户" : "设为管理员"}
              </button>
            </div>
            <div className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              注册时间：{formatDateTime(detail.createdAt)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 刷题统计 */}
              <div className="rounded-lg border p-4" style={cardClass}>
                <div className="text-sm font-semibold mb-3" style={{ color: "var(--on-surface)" }}>
                  刷题统计
                </div>
                <div className="text-2xl font-semibold mb-3" style={{ color: "var(--on-surface)" }}>
                  {detail._count?.practiceHistory ?? 0} 次
                </div>
                {detail.practiceHistory?.length > 0 ? (
                  <div className="space-y-2">
                    {detail.practiceHistory.slice(0, 5).map((p) => (
                      <div key={p.id} className="rounded-md p-2 text-xs" style={{ backgroundColor: "var(--surface-high)" }}>
                        <div className="font-medium" style={{ color: "var(--on-surface)" }}>
                          {p.question?.title || "未知题目"}
                        </div>
                        <div className="mt-1" style={{ color: "var(--on-surface-variant)" }}>
                          状态：
                          <span style={{ color: p.status === "completed" ? "var(--success-text)" : "var(--error)" }}>
                            {p.status === "completed" ? "完成" : "失败"}
                          </span>
                          · 耗时 {Math.floor(p.durationSeconds / 60)} 分 {p.durationSeconds % 60} 秒
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    暂无练习记录
                  </div>
                )}
              </div>

              {/* 评论记录 */}
              <div className="rounded-lg border p-4" style={cardClass}>
                <div className="text-sm font-semibold mb-3" style={{ color: "var(--on-surface)" }}>
                  评论记录
                </div>
                <div className="text-2xl font-semibold mb-3" style={{ color: "var(--on-surface)" }}>
                  {detail._count?.comments ?? 0} 条
                </div>
                {detail.comments?.length > 0 ? (
                  <div className="space-y-2">
                    {detail.comments.slice(0, 5).map((c) => (
                      <div key={c.id} className="rounded-md p-2 text-xs" style={{ backgroundColor: "var(--surface-high)" }}>
                        <div className="font-medium" style={{ color: "var(--on-surface)" }}>
                          {c.question?.title || "未知题目"}
                        </div>
                        <div className="mt-1 line-clamp-2" style={{ color: "var(--on-surface-variant)" }}>
                          {c.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    暂无评论
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      {dialog}
    </div>
  );
}
