"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

interface QuestionOption {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
}

interface ContestItem {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  duration: number;
  type: string;
  status: string;
  _count?: { problems?: number; submissions?: number };
}

const TYPE_LABELS: Record<string, string> = {
  weekly: "周赛",
  monthly: "月赛",
  custom: "自定义",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  ended: "已结束",
};

const STATUS_META: Record<string, { color: string; bg: string }> = {
  upcoming: { color: "var(--info-text)", bg: "var(--info-container)" },
  ongoing: { color: "var(--success-text)", bg: "var(--success-container)" },
  ended: { color: "var(--on-surface-variant)", bg: "var(--surface-high)" },
};

export default function AdminContestsPage() {
  const [data, setData] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContestItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("90");
  const [type, setType] = useState("weekly");

  // 选题相关
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionOption[]>([]);
  const { confirm, alert, dialog } = useConfirmDialog();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contests?limit=100");
      if (res.ok) {
        const json = await res.json();
        setData(json.contests ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 加载题库供选题（打开弹窗时加载一次）
  useEffect(() => {
    if (!modalOpen) return;
    if (questions.length > 0) return;
    setQuestionsLoading(true);
    fetch("/api/questions?take=200")
      .then((r) => r.json())
      .then((json) => setQuestions(json.questions ?? []))
      .catch(() => {})
      .finally(() => setQuestionsLoading(false));
  }, [modalOpen, questions.length]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStartTime("");
    setDuration("90");
    setType("weekly");
    setSelectedQuestions([]);
    setSearchQuery("");
    setModalOpen(true);
  };

  const openEdit = async (c: ContestItem) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description ?? "");
    setStartTime(new Date(c.startTime).toISOString().slice(0, 16));
    setDuration(String(c.duration));
    setType(c.type);
    setSelectedQuestions([]);
    setSearchQuery("");
    setModalOpen(true);
    // 编辑时回填该竞赛已有的题目，避免被清空
    try {
      const res = await fetch(`/api/contests/${c.id}`);
      if (res.ok) {
        const detail = await res.json();
        const existing = (detail?.contest?.problems ?? detail?.problems ?? [])
          .map((p: { question?: QuestionOption }) => p.question)
          .filter((q: QuestionOption | undefined): q is QuestionOption => !!q);
        if (existing.length > 0) setSelectedQuestions(existing);
      }
    } catch {
      // 回填失败不影响编辑，用户仍可选填
    }
  };

  const toggleQuestion = (q: QuestionOption) => {
    setSelectedQuestions((prev) =>
      prev.find((p) => p.id === q.id)
        ? prev.filter((p) => p.id !== q.id)
        : [...prev, q]
    );
  };

  const filteredQuestions = questions.filter(
    (q) =>
      (!searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (difficultyFilter === "all" || q.difficulty === difficultyFilter)
  );

  const handleSave = async () => {
    if (!title.trim()) {
      alert({ title: "请完善信息", message: "请输入竞赛名称。" });
      return;
    }
    // 新建竞赛必须选题；编辑可留空（仅更新基础信息）
    if (!editing && selectedQuestions.length === 0) {
      alert({ title: "请选择题目", message: "请至少选择一道题目。" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description: description || null,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        duration: parseInt(duration || "0", 10) || 1,
        type,
      };
      // 选题变更时提交题目列表（新建必填；编辑仅在选了题时更新）
      if (!editing || selectedQuestions.length > 0) {
        payload.problemIds = selectedQuestions.map((q) => q.id);
      }
      const res = editing
        ? await fetch(`/api/contests/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/contests", {
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
    if (!(await confirm({ title: "删除竞赛", message: "确定删除这场竞赛吗？此操作不可恢复。", confirmText: "删除", danger: true }))) return;
    const res = await fetch(`/api/contests/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchList();
    } else {
      alert({ title: "删除失败", message: "删除失败，请稍后重试。" });
    }
  };

  const columns: ColumnDef<ContestItem>[] = [
    {
      key: "title",
      title: "竞赛名称",
      width: 260,
      render: (r) => (
        <span className="line-clamp-1" title={r.title}>
          {r.title}
        </span>
      ),
    },
    { key: "type", title: "类型", width: 100, render: (r) => TYPE_LABELS[r.type] || r.type },
    {
      key: "status",
      title: "状态",
      width: 100,
      render: (r) => {
        const m = STATUS_META[r.status] ?? { color: "#999", bg: "var(--surface-high)" };
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: m.color, backgroundColor: m.bg }}>
            {STATUS_LABELS[r.status] || r.status}
          </span>
        );
      },
    },
    {
      key: "startTime",
      title: "开始时间",
      width: 160,
      render: (r) => new Date(r.startTime).toLocaleString("zh-CN"),
    },
    { key: "duration", title: "时长(分钟)", width: 100, align: "right", dataIndex: "duration" },
    { key: "problems", title: "题目数", width: 80, align: "right", render: (r) => r._count?.problems ?? 0 },
    { key: "submissions", title: "提交数", width: 80, align: "right", render: (r) => r._count?.submissions ?? 0 },
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
        title="竞赛管理"
        description={`共 ${data.length} 场竞赛`}
        icon={<Trophy className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> 新建竞赛
          </Button>
        }
      />

      <div className="rounded-xl border" style={cardClass}>
        <Table<ContestItem>
          aria-label="竞赛管理列表"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText={
            <EmptyState
              title="暂无竞赛"
              description="创建你的第一场竞赛，组织在线答题。"
              action={
                <Button onClick={openCreate} variant="primary">
                  <Plus className="h-4 w-4" /> 新建竞赛
                </Button>
              }
            />
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "编辑竞赛" : "新建竞赛"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} loading={saving}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>名称 *</label>
            <input className={inputWrap} style={fieldStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入竞赛名称" />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>描述</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入描述" rows={3} />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>开始时间 *</label>
            <input type="datetime-local" className={inputWrap} style={fieldStyle} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: "var(--on-surface)" }}>时长(分钟) *</label>
              <input type="number" className={inputWrap} style={fieldStyle} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--on-surface)" }}>类型</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="weekly">周赛</option>
                <option value="monthly">月赛</option>
                <option value="custom">自定义</option>
              </Select>
            </div>
          </div>

          {/* 选题 */}
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              选择题目 {!editing && "*"} ({selectedQuestions.length} 已选)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="搜索题目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-32 shrink-0">
                <option value="all">全部难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </Select>
            </div>
            <div
              className="rounded-lg border overflow-y-auto"
              style={{ maxHeight: "220px", borderColor: "var(--outline-variant)" }}
            >
              {questionsLoading ? (
                <div className="p-4 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  加载题目...
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  未找到匹配的题目
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestions.some((s) => s.id === q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => toggleQuestion(q)}
                      className="w-full text-left px-3 py-2 flex items-center justify-between transition-colors"
                      style={{
                        backgroundColor: isSelected ? "var(--primary-container)" : "transparent",
                        borderBottom: "1px solid var(--outline-variant)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: isSelected ? "var(--on-primary-container)" : "var(--on-surface)" }}>
                          {q.title}
                        </p>
                        <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                          {q.difficulty === "easy" ? "简单" : q.difficulty === "medium" ? "中等" : "困难"} · {q.questionType === "code" ? "编程题" : q.questionType === "judge" ? "判断题" : "问答题"}
                        </span>
                      </div>
                      <span
                        className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-2"
                        style={{
                          borderColor: isSelected ? "var(--primary)" : "var(--outline-variant)",
                          backgroundColor: isSelected ? "var(--primary)" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {selectedQuestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedQuestions.map((q) => (
                  <span
                    key={q.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
                  >
                    {q.title}
                    <button
                      type="button"
                      onClick={() => toggleQuestion(q)}
                      className="hover:opacity-70"
                      aria-label={`移除 ${q.title}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
