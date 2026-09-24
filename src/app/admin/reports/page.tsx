"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Check, X, ShieldAlert } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { formatDateTime } from "@/lib/utils";

interface ReportItem {
  id: string;
  target_type: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string | null; email: string };
}

const REASON_LABELS: Record<string, string> = {
  spam: "垃圾广告",
  inappropriate: "不当内容",
  copyright: "版权问题",
  outdated: "错误/过时",
  other: "其他",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  question: "题目",
  comment: "评论",
  note: "笔记",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  resolved: "已处理",
  dismissed: "已忽略",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [contentModal, setContentModal] = useState(false);
  const [contentData, setContentData] = useState<Record<string, unknown> | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 筛选 + 分页
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const { alert, dialog } = useConfirmDialog();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        skip: String((page - 1) * pageSize),
        take: String(pageSize),
      });
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, page, pageSize]);

  // 切换状态重置到第一页并清空已选（避免跨状态误批量操作）
  const changeStatus = (s: string) => {
    setSelected([]);
    setStatus(s);
    setPage(1);
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSelected((prev) => prev.filter((s) => s !== id));
        fetchReports();
      } else {
        alert({ title: "操作失败", message: "操作失败，请稍后重试。" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchResolve = async () => {
    if (selected.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/reports/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status: "resolved" }),
      });
      if (res.ok) {
        setSelected([]);
        fetchReports();
      } else {
        alert({ title: "批量处理失败", message: "批量处理失败，请稍后重试。" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewContent = async (record: ReportItem) => {
    setContentModal(true);
    setContentLoading(true);
    setContentData(null);
    try {
      let url = "";
      if (record.target_type === "question") url = `/api/questions/${record.targetId}`;
      else if (record.target_type === "comment") url = `/api/comments/${record.targetId}`;
      else if (record.target_type === "note") url = `/api/notes/${record.targetId}`;
      if (url) {
        const res = await fetch(url);
        if (res.ok) setContentData({ ...(await res.json()), targetType: record.target_type });
      }
    } finally {
      setContentLoading(false);
    }
  };

  const columns: ColumnDef<ReportItem>[] = [
    {
      key: "target_type",
      title: "类型",
      width: 90,
      render: (r) => (
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: "var(--info-container, #e0f2fe)", color: "var(--info-text, #0369a1)" }}
        >
          {TARGET_TYPE_LABELS[r.target_type] || r.target_type}
        </span>
      ),
    },
    {
      key: "reason",
      title: "原因",
      width: 110,
      render: (r) => (
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: "var(--warning-container, #fef3c7)", color: "var(--warning-text, #b45309)" }}
        >
          {REASON_LABELS[r.reason] || r.reason}
        </span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: 90,
      render: (r) => STATUS_LABELS[r.status] || r.status,
    },
    {
      key: "description",
      title: "描述",
      render: (r) => (
        <span className="text-sm line-clamp-1" style={{ color: "var(--on-surface-variant)" }}>
          {r.description || "—"}
        </span>
      ),
    },
    {
      key: "reporter",
      title: "举报人",
      width: 130,
      render: (r) => r.reporter?.name || r.reporter?.email || "匿名",
    },
    {
      key: "createdAt",
      title: "举报时间",
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
            onClick={() => handleViewContent(r)}
            className="inline-flex items-center gap-1 text-sm hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <Eye className="h-3.5 w-3.5" /> 查看
          </button>
          {r.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => handleAction(r.id, "resolved")}
                className="inline-flex items-center gap-1 text-sm hover:opacity-70"
                style={{ color: "var(--success-text)" }}
              >
                <Check className="h-3.5 w-3.5" /> 处理
              </button>
              <button
                type="button"
                onClick={() => handleAction(r.id, "dismissed")}
                className="inline-flex items-center gap-1 text-sm hover:opacity-70"
                style={{ color: "var(--on-surface-variant)" }}
              >
                <X className="h-3.5 w-3.5" /> 忽略
              </button>
            </>
          ) : (
            <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              已处理
            </span>
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
        title="举报管理"
        description={`共 ${total} 条举报（${STATUS_LABELS[status]}）`}
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <>
            <Select value={status} onChange={(e) => changeStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            {selected.length > 0 && (
              <Button onClick={handleBatchResolve} loading={actionLoading}>
                批量处理 ({selected.length})
              </Button>
            )}
          </>
        }
      />

      <div className="rounded-xl border" style={cardClass}>
        <Table<ReportItem>
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText="暂无待处理举报"
          rowClassName={(r) => (selected.includes(r.id) ? "bg-primary-container/20" : "")}
          summary={
            <tr>
              <td colSpan={columns.length} className="px-4 py-2">
                <label
                  className="inline-flex items-center gap-2 text-sm cursor-pointer"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  <input
                    type="checkbox"
                    checked={selected.length > 0 && selected.length === reports.filter((r) => r.status === "pending").length}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(reports.filter((r) => r.status === "pending").map((r) => r.id));
                      else setSelected([]);
                    }}
                  />
                  本页全选（{selected.length} 已选）
                </label>
              </td>
            </tr>
          }
        />
      </div>

      {total > 0 && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={(next, size) => {
              setPageSize(size);
              setPage(next);
            }}
          />
        </div>
      )}

      {/* 内容详情 */}
      <Modal open={contentModal} onClose={() => setContentModal(false)} title="被举报内容详情" width={700}>
        {contentLoading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            加载中…
          </div>
        ) : contentData ? (
          <div className="space-y-3 text-sm">
            {contentData.targetType === "question" && (
              <>
                <div>
                  <span className="text-on-surface-variant">题目：</span>
                  <span style={{ color: "var(--on-surface)" }}>{String(contentData.title ?? "—")}</span>
                </div>
                <div className="text-on-surface-variant">难度：{String(contentData.difficulty ?? "—")}</div>
                <div className="text-on-surface-variant">类型：{String(contentData.questionType ?? "—")}</div>
                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--outline-variant)", maxHeight: 300, overflow: "auto", whiteSpace: "pre-wrap", color: "var(--on-surface)" }}
                >
                  {String(contentData.content ?? "暂无内容")}
                </div>
              </>
            )}
            {contentData.targetType === "comment" && (
              <>
                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--outline-variant)", whiteSpace: "pre-wrap", color: "var(--on-surface)" }}
                >
                  {String(contentData.content ?? "暂无内容")}
                </div>
                <div className="text-on-surface-variant">题目ID：{String(contentData.questionId ?? "—")}</div>
                <div className="text-on-surface-variant">用户ID：{String(contentData.userId ?? "—")}</div>
              </>
            )}
            {contentData.targetType === "note" && (
              <>
                <div>
                  <span className="text-on-surface-variant">标题：</span>
                  <span style={{ color: "var(--on-surface)" }}>{String(contentData.title ?? "—")}</span>
                </div>
                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--outline-variant)", maxHeight: 300, overflow: "auto", whiteSpace: "pre-wrap", color: "var(--on-surface)" }}
                >
                  {String(contentData.content ?? "暂无内容")}
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
      {dialog}
    </div>
  );
}
