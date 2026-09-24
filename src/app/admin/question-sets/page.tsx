"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Layers, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "../components/PageHeader";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { formatDateTime } from "@/lib/utils";

interface QuestionSetItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover: string | null;
  isPublished: boolean;
  sortOrder: number;
  viewCount: number;
  createdAt: string;
  questionCount: number;
}

interface QuestionOption {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
}

interface EditingSet {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover: string | null;
  isPublished: boolean;
  sortOrder: number;
  questions: QuestionOption[];
}

const inputWrap =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

const fieldStyle: React.CSSProperties = {
  borderColor: "var(--outline-variant)",
  backgroundColor: "var(--surface-bright)",
  color: "var(--on-surface)",
};

export default function AdminQuestionSetsPage() {
  const { confirm, alert, dialog } = useConfirmDialog();
  const [data, setData] = useState<QuestionSetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingSet | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  // 选题状态
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionOption[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/question-sets?take=100");
      if (res.ok) {
        const json = await res.json();
        setData(json.sets ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 打开弹窗时加载题库供选题
  useEffect(() => {
    if (!modalOpen) return;
    if (questions.length > 0) return;
    setQuestionsLoading(true);
    fetch("/api/questions?take=300")
      .then((r) => r.json())
      .then((json) => setQuestions(json.questions ?? []))
      .catch(() => {})
      .finally(() => setQuestionsLoading(false));
  }, [modalOpen, questions.length]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setCover("");
    setIsPublished(true);
    setSortOrder("0");
    setSelectedQuestions([]);
    setSearchQuery("");
    setModalOpen(true);
  };

  const openEdit = async (c: QuestionSetItem) => {
    // 立即用列表数据设置 editing（含 id），避免异步回填期间 editing 为 null 导致误走创建
    setEditing({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      cover: c.cover,
      isPublished: c.isPublished,
      sortOrder: c.sortOrder,
      questions: [],
    });
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description ?? "");
    setCover(c.cover ?? "");
    setIsPublished(c.isPublished);
    setSortOrder(String(c.sortOrder));
    setSelectedQuestions([]);
    setSearchQuery("");
    setModalOpen(true);
    // 异步回填已绑定题目
    try {
      const res = await fetch(`/api/admin/question-sets/${c.id}`);
      if (res.ok) {
        const detail = await res.json();
        setEditing((prev) => (prev && prev.id === c.id ? { ...prev, questions: detail.questions ?? [] } : prev));
        setSelectedQuestions(detail.questions ?? []);
      }
    } catch {
      // 回填失败不影响编辑，用户仍可重新选题
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
    (q) => !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!name.trim()) {
      alert({ title: "请完善信息", message: "请输入题集名称。" });
      return;
    }
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      alert({ title: "请完善信息", message: "请输入题集别名（slug）。" });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      alert({ title: "请完善信息", message: "别名（slug）只能包含小写字母、数字和连字符。" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        slug: normalizedSlug,
        description: description || null,
        cover: cover || null,
        isPublished,
        sortOrder: parseInt(sortOrder || "0", 10) || 0,
        questionIds: selectedQuestions.map((q) => q.id),
      };
      const res = editing
        ? await fetch(`/api/admin/question-sets/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/question-sets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setModalOpen(false);
        fetchList();
      } else {
        alert({ title: "保存失败", message: json.error ?? "保存失败，请稍后重试。" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = data.find((s) => s.id === id);
    if (!(await confirm({ title: "删除题集", message: `确定删除题集「${target?.name || id}」吗？此操作不可恢复。`, confirmText: "删除", danger: true }))) return;
    const res = await fetch(`/api/admin/question-sets/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchList();
    } else {
      alert({ title: "删除失败", message: "删除失败，请稍后重试。" });
    }
  };

  const columns = [
    {
      key: "name",
      title: "题集",
      width: 220,
      render: (r: QuestionSetItem) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: "var(--primary-container)" }}
          >
            {r.cover ?? "📚"}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium" style={{ color: "var(--on-surface)" }}>
              {r.name}
            </div>
            <div className="truncate text-[11px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
              /{r.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "questionCount",
      title: "题目数",
      width: 80,
      render: (r: QuestionSetItem) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
          {r.questionCount}
        </span>
      ),
    },
    {
      key: "viewCount",
      title: "浏览量",
      width: 90,
      render: (r: QuestionSetItem) => (
        <span className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          <Eye className="h-3.5 w-3.5" />
          {r.viewCount}
        </span>
      ),
    },
    {
      key: "isPublished",
      title: "状态",
      width: 80,
      render: (r: QuestionSetItem) => (
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={
            r.isPublished
              ? { backgroundColor: "var(--success-container)", color: "var(--success-text)" }
              : { backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }
          }
        >
          {r.isPublished ? "已发布" : "草稿"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: 150,
      render: (r: QuestionSetItem) => formatDateTime(r.createdAt),
    },
    {
      key: "actions",
      title: "操作",
      width: 170,
      render: (r: QuestionSetItem) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="inline-flex items-center gap-1 text-sm hover:opacity-70 whitespace-nowrap"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <Pencil className="h-3.5 w-3.5" /> 编辑
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            className="inline-flex items-center gap-1 text-sm hover:opacity-70 whitespace-nowrap"
            style={{ color: "var(--error)" }}
          >
            <Trash2 className="h-3.5 w-3.5" /> 删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="题集管理"
        description={`共 ${total} 个题集`}
        icon={<Layers className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> 新建题集
          </Button>
        }
      />

      <div className="rounded-xl border" style={{ backgroundColor: "var(--surface-bright)", borderColor: "var(--outline-variant)" }}>
        <Table<QuestionSetItem> aria-label="题集管理列表" columns={columns} dataSource={data} loading={loading} rowKey={(r) => r.id} emptyText="暂无题集" />
      </div>

      {/* 创建/编辑弹窗 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "编辑题集" : "新建题集"}
        width="720px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} loading={saving}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
                名称 <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <Input placeholder="如：Java 高频 100 题" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
                别名 slug <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <Input placeholder="如：java-top100（用于 URL）" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
              简介
            </label>
            <textarea
              className={inputWrap}
              style={{ ...fieldStyle, minHeight: 72 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="题集简介，展示在卡片上"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
                封面 emoji
              </label>
              <Input placeholder="📚" value={cover} onChange={(e) => setCover(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
                排序
              </label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
                发布状态
              </label>
              <Select value={isPublished ? "true" : "false"} onChange={(e) => setIsPublished(e.target.value === "true")}>
                <option value="true">已发布</option>
                <option value="false">草稿</option>
              </Select>
            </div>
          </div>

          {/* 选题 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                绑定题目
                <span className="ml-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  已选 {selectedQuestions.length} 道
                </span>
              </label>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--outline-variant)" }}>
              <Input
                placeholder="搜索题目..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto">
                {questionsLoading ? (
                  <div className="py-6 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    加载中…
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="py-6 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    没有匹配的题目
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredQuestions.map((q) => {
                      const checked = selectedQuestions.some((s) => s.id === q.id);
                      return (
                        <label key={q.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-surface-high">
                          <input type="checkbox" checked={checked} onChange={() => toggleQuestion(q)} />
                          <span className="text-sm truncate flex-1" style={{ color: "var(--on-surface)" }}>
                            {q.title}
                          </span>
                          <span className="text-xs shrink-0" style={{ color: "var(--on-surface-variant)" }}>
                            {q.difficulty === "easy" ? "简单" : q.difficulty === "medium" ? "中等" : "困难"} · {q.questionType === "code" ? "编程" : q.questionType === "judge" ? "判断" : "问答"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
