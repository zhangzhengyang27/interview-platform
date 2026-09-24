"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Route as RouteIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

interface PathItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  difficultyLevel: string;
  durationDays: number;
  isPreset: boolean;
  totalItems?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  backend: "后端",
  frontend: "前端",
  algorithm: "算法",
  database: "数据库",
  fullstack: "全栈",
  "system-design": "系统设计",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "入门",
  intermediate: "中级",
  advanced: "高级",
};

const DIFFICULTY_META: Record<string, { color: string; bg: string }> = {
  beginner: { color: "var(--success-text)", bg: "var(--success-container)" },
  intermediate: { color: "var(--warning-text)", bg: "var(--warning-container)" },
  advanced: { color: "var(--error)", bg: "var(--error-container)" },
};

export default function AdminLearningPathsPage() {
  const [data, setData] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PathItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("backend");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [durationDays, setDurationDays] = useState("30");
  const { confirm, alert, dialog } = useConfirmDialog();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learning-paths");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCategory("backend");
    setDifficultyLevel("beginner");
    setDurationDays("30");
    setModalOpen(true);
  };

  const openEdit = (p: PathItem) => {
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description ?? "");
    setCategory(p.category);
    setDifficultyLevel(p.difficultyLevel);
    setDurationDays(String(p.durationDays));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert({ title: "请完善信息", message: "请输入路线名称。" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description: description || null,
        category,
        difficultyLevel,
        durationDays: parseInt(durationDays || "0", 10) || 1,
      };
      const res = editing
        ? await fetch(`/api/learning-paths/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/learning-paths", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        setModalOpen(false);
        fetchList();
      } else {
        alert({ title: "保存失败", message: "保存失败，请稍后重试。" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "删除学习路径", message: "确定删除这条学习路径吗？此操作不可恢复。", confirmText: "删除", danger: true }))) return;
    const res = await fetch(`/api/learning-paths/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchList();
    } else {
      alert({ title: "删除失败", message: "删除失败，请稍后重试。" });
    }
  };

  const columns: ColumnDef<PathItem>[] = [
    {
      key: "title",
      title: "路线名称",
      width: 260,
      render: (r) => (
        <div>
          <div className="line-clamp-1" title={r.title}>
            {r.title}
          </div>
          {r.isPreset && (
            <span className="text-xs" style={{ color: "var(--primary)" }}>
              预设路线
            </span>
          )}
        </div>
      ),
    },
    { key: "category", title: "方向", width: 100, render: (r) => CATEGORY_LABELS[r.category] || r.category },
    {
      key: "difficultyLevel",
      title: "难度",
      width: 100,
      render: (r) => {
        const m = DIFFICULTY_META[r.difficultyLevel] ?? { color: "#999", bg: "var(--surface-high)" };
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: m.color, backgroundColor: m.bg }}>
            {DIFFICULTY_LABELS[r.difficultyLevel] || r.difficultyLevel}
          </span>
        );
      },
    },
    { key: "durationDays", title: "天数", width: 80, align: "right", dataIndex: "durationDays" },
    { key: "totalItems", title: "题目数", width: 80, align: "right", render: (r) => r.totalItems ?? 0 },
    {
      key: "actions",
      title: "操作",
      width: 170,
      render: (r) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button type="button" onClick={() => openEdit(r)} className="inline-flex items-center gap-1 text-sm hover:opacity-70" style={{ color: "var(--on-surface-variant)" }}>
            <Pencil className="h-3.5 w-3.5" /> 编辑
          </button>
          <button type="button" onClick={() => handleDelete(r.id)} className="inline-flex items-center gap-1 text-sm hover:opacity-70" style={{ color: "var(--error)" }}>
            <Trash2 className="h-3.5 w-3.5" /> 删除
          </button>
        </div>
      ),
    },
  ];

  const cardClass = {
    backgroundColor: "var(--surface-bright)",
    borderColor: "var(--outline-variant)",
  } as const;
  const labelClass = "block text-sm font-medium mb-1";
  const inputWrap = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary";
  const fieldStyle = { borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-bright)", color: "var(--on-surface)" } as const;

  return (
    <div className="space-y-4">
      <PageHeader
        title="学习路径"
        description={`共 ${data.length} 条学习路径`}
        icon={<RouteIcon className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> 新建路径
          </Button>
        }
      />

      <div className="rounded-xl border" style={cardClass}>
        <Table<PathItem>
          aria-label="学习路径管理列表"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText={
            <EmptyState
              title="暂无学习路径"
              description="创建一条学习路径，帮助用户系统学习。"
              action={
                <Button onClick={openCreate} variant="primary">
                  <Plus className="h-4 w-4" /> 新建路径
                </Button>
              }
            />
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "编辑路径" : "新建路径"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} loading={saving}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>路线名称 *</label>
            <input className={inputWrap} style={fieldStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入路线名称" />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入描述" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: "var(--on-surface)" }}>方向</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--on-surface)" }}>难度</label>
              <Select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>学习天数 *</label>
            <input type="number" className={inputWrap} style={fieldStyle} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
          </div>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
