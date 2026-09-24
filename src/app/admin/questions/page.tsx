"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Database, Eye, Pencil, Trash2 } from "lucide-react";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { buildCategoryLabels } from "@/lib/category-utils";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface QuestionItem {
  id: string;
  title: string;
  content: string;
  solution?: string | null;
  answer?: boolean | null;
  questionType: string;
  difficulty: string;
  company?: string | null;
  viewCount: number;
  categoryId?: string | null;
  createdAt: string;
  category?: { id: string; name: string } | null;
  tags?: { tag: string }[];
  _count?: { practiceHistory?: number };
}

interface CategoryOption {
  id: string;
  name: string;
  parentId?: string | null;
}

const DIFFICULTY_META: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "简单", color: "var(--success-text)", bg: "var(--success-container)" },
  medium: { label: "中等", color: "var(--warning-text)", bg: "var(--warning-container)" },
  hard: { label: "困难", color: "var(--error)", bg: "var(--error-container)" },
};

const TYPE_LABELS: Record<string, string> = {
  code: "编程题",
  qa: "问答题",
  judge: "判断题",
};

export default function AdminQuestionsPage() {
  const [data, setData] = useState<QuestionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});

  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<QuestionItem | null>(null);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const { confirm, alert, dialog } = useConfirmDialog();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        take: String(pageSize),
        skip: String((page - 1) * pageSize),
      });
      if (search) params.set("search", search);
      if (difficulty) params.set("difficulty", difficulty);
      if (questionType) params.set("questionType", questionType);
      if (categoryId) params.set("categoryId", categoryId);
      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.questions ?? []);
        setTotal(json.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  // 故意省略 search：回调函数内仅使用防抖后的 debouncedSearch，
  // 加入 search 会导致每次输入字符就重建回调，违背防抖目的
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, difficulty, questionType, categoryId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 搜索防抖：输入停止 400ms 后再触发列表请求
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        const list = json.categories || json || [];
        setCategories(
          list.map((c: { id: string; name: string; parentId?: string | null }) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
          })),
        );
        setCategoryLabels(buildCategoryLabels(list));
      })
      .catch(() => {});
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!(await confirm({ title: "删除题目", message: "确定删除这道题目吗？此操作不可恢复。", confirmText: "删除", danger: true }))) return;
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchList();
      } else {
        alert({ title: "删除失败", message: "删除失败，请稍后重试。" });
      }
    },
    [confirm, alert, fetchList]
  );

  const handleBatchCompany = async () => {
    if (selected.length === 0) return;
    const company = window.prompt(`为选中的 ${selected.length} 道题目设置公司标签（如：字节跳动、腾讯）：`);
    if (!company || !company.trim()) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/questions/batch-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, company: company.trim() }),
      });
      if (res.ok) {
        setSelected([]);
        fetchList();
      } else {
        const body = await res.json().catch(() => ({}));
        alert({ title: "设置失败", message: body.error || "批量设置公司标签失败，请稍后重试。" });
      }
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selected.length === 0) return;
    if (!(await confirm({ title: "批量删除", message: `确定删除选中的 ${selected.length} 道题目吗？此操作不可恢复。`, confirmText: "删除", danger: true }))) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/questions/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      if (res.ok) {
        setSelected([]);
        fetchList();
      } else {
        alert({ title: "删除失败", message: "批量删除失败，请稍后重试。" });
      }
    } finally {
      setBatchLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<QuestionItem>[]>(
    () => [
      {
        key: "title",
        title: "题目",
        dataIndex: "title",
        width: 280,
        render: (r) => (
          <span className="line-clamp-1" title={r.title}>
            {r.title}
          </span>
        ),
      },
      {
        key: "questionType",
        title: "类型",
        dataIndex: "questionType",
        width: 90,
        render: (r) => TYPE_LABELS[r.questionType] || r.questionType,
      },
      {
        key: "difficulty",
        title: "难度",
        dataIndex: "difficulty",
        width: 90,
        render: (r) => {
          const m = DIFFICULTY_META[r.difficulty];
          return (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ color: m?.color ?? "#999", backgroundColor: m?.bg ?? "var(--surface-high)" }}
            >
              {m?.label ?? r.difficulty}
            </span>
          );
        },
      },
      {
        key: "company",
        title: "公司",
        dataIndex: "company",
        width: 120,
        render: (r) => r.company || "—",
      },
      {
        key: "category",
        title: "分类",
        width: 120,
        render: (r) => r.category?.name || "—",
      },
      {
        key: "viewCount",
        title: "浏览",
        dataIndex: "viewCount",
        width: 80,
        align: "right",
      },
      {
        key: "practice",
        title: "练习",
        width: 80,
        align: "right",
        render: (r) => r._count?.practiceHistory ?? 0,
      },
      {
        key: "createdAt",
        title: "创建时间",
        dataIndex: "createdAt",
        width: 160,
        render: (r) => new Date(r.createdAt).toLocaleString("zh-CN"),
      },
      {
        key: "actions",
        title: "操作",
        width: 220,
        render: (r) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setViewing(r)}
              className="inline-flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              <Eye className="h-3.5 w-3.5" /> 查看
            </button>
            <button
              type="button"
              onClick={() => setEditing(r)}
              className="inline-flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <Pencil className="h-3.5 w-3.5" /> 编辑
            </button>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="inline-flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: "var(--error)" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  const cardClass = {
    backgroundColor: "var(--surface-bright)",
    borderColor: "var(--outline-variant)",
  } as const;

  return (
    <div className="space-y-4">
      <PageHeader title="题目管理" description={`共 ${total} 道题目`} icon={<Database className="h-5 w-5" />} />

      {/* 筛选栏 */}
      <div className="rounded-xl border p-4" style={cardClass}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[160px] w-full sm:w-auto">
            <Input
              placeholder="搜索题目 / 公司"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }} className="w-32">
            <option value="">全部难度</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </Select>
          <Select value={questionType} onChange={(e) => { setQuestionType(e.target.value); setPage(1); }} className="w-32">
            <option value="">全部类型</option>
            <option value="code">编程题</option>
            <option value="qa">问答题</option>
            <option value="judge">判断题</option>
          </Select>
          <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="w-40">
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabels[c.id] || c.name}
              </option>
            ))}
          </Select>
          {selected.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={handleBatchCompany} loading={batchLoading}>
                设置公司 ({selected.length})
              </Button>
              <Button variant="danger" size="sm" onClick={handleBatchDelete} loading={batchLoading}>
                批量删除 ({selected.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div>
        <Table<QuestionItem>
          aria-label="题目管理列表"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey={(r) => r.id}
          rowClassName={(r) => (selected.includes(r.id) ? "bg-primary-container/20" : "")}
          summary={
            <tr>
              <td colSpan={columns.length} className="px-4 py-2">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--on-surface-variant)" }}>
                  <input
                    type="checkbox"
                    checked={selected.length > 0 && selected.length === data.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(data.map((d) => d.id));
                      else setSelected([]);
                    }}
                  />
                  本页全选（{selected.length} 已选）
                </label>
              </td>
            </tr>
          }
        />
        <div className="mt-4">
          <Pagination current={page} pageSize={pageSize} total={total} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </div>
      </div>

      {/* 查看详情 */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="题目详情" width={760}>
        {viewing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
                {viewing.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ color: DIFFICULTY_META[viewing.difficulty]?.color ?? "#999", backgroundColor: DIFFICULTY_META[viewing.difficulty]?.bg ?? "var(--surface-high)" }}
                >
                  {DIFFICULTY_META[viewing.difficulty]?.label ?? viewing.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
                  {TYPE_LABELS[viewing.questionType] || viewing.questionType}
                </span>
                {viewing.questionType === "judge" && viewing.answer !== null && viewing.answer !== undefined && (
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: viewing.answer ? "var(--success-container)" : "var(--error-container)", color: viewing.answer ? "var(--success-text)" : "var(--error)" }}
                  >
                    答案：{viewing.answer ? "正确" : "错误"}
                  </span>
                )}
                {viewing.category?.name && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}>
                    {viewing.category.name}
                  </span>
                )}
                {viewing.company && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}>
                    {viewing.company}
                  </span>
                )}
                {viewing.tags?.map((t) => (
                  <span key={t.tag} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
                    {t.tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                <span>浏览 {viewing.viewCount ?? 0}</span>
                <span>练习 {viewing._count?.practiceHistory ?? 0}</span>
                <span>{new Date(viewing.createdAt).toLocaleString("zh-CN")}</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
                题目内容
              </h4>
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-low)" }}>
                <MarkdownRenderer content={viewing.content || "暂无内容"} />
              </div>
            </div>
            {viewing.solution && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
                  题解
                </h4>
                <div className="rounded-lg border p-4" style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-low)" }}>
                  <MarkdownRenderer content={viewing.solution} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 编辑 */}
      <QuestionEditModal
        open={!!editing}
        question={editing}
        categories={categories}
        categoryLabels={categoryLabels}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          fetchList();
        }}
      />

      {dialog}
    </div>
  );
}

function QuestionEditModal({
  open,
  question,
  categories,
  categoryLabels,
  onClose,
  onSaved,
}: {
  open: boolean;
  question: QuestionItem | null;
  categories: CategoryOption[];
  categoryLabels: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [solution, setSolution] = useState("");
  const [answer, setAnswer] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState("easy");
  const [questionType, setQuestionType] = useState("qa");
  const [categoryId, setCategoryId] = useState("");
  const [company, setCompany] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const { alert, dialog } = useConfirmDialog();

  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setContent(question.content);
      setSolution(question.solution ?? "");
      setAnswer(question.answer ?? true);
      setDifficulty(question.difficulty);
      setQuestionType(question.questionType);
      setCategoryId(question.categoryId ?? "");
      setCompany(question.company ?? "");
      setTags((question.tags ?? []).map((t) => t.tag).join(", "));
    }
  }, [question]);

  const handleSave = async () => {
    if (!question) return;
    if (!title.trim()) {
      alert({ title: "请完善信息", message: "请输入题目名称。" });
      return;
    }
    if (!content.trim()) {
      alert({ title: "请完善信息", message: "请输入题目内容。" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          solution: solution || null,
          difficulty,
          questionType,
          answer: questionType === "judge" ? answer : null,
          categoryId: categoryId || null,
          company: company || null,
          tags: tags ? tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        alert({ title: "保存失败", message: "保存失败，请稍后重试。" });
      }
    } finally {
      setSaving(false);
    }
  };

  const labelClass = "block text-sm font-medium mb-1";
  const inputWrap = "rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-primary w-full";
  const fieldStyle = { borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-bright)", color: "var(--on-surface)" } as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑题目"
      width={700}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} loading={saving}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass} style={{ color: "var(--on-surface)" }}>题目名称</label>
          <input className={inputWrap} style={fieldStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--on-surface)" }}>题目内容</label>
          <textarea className={inputWrap} style={{ ...fieldStyle, minHeight: 120 }} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--on-surface)" }}>题解</label>
          <textarea className={inputWrap} style={{ ...fieldStyle, minHeight: 100 }} value={solution} onChange={(e) => setSolution(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>难度</label>
            <select className={inputWrap} style={fieldStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>类型</label>
            <select className={inputWrap} style={fieldStyle} value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="code">编程题</option>
              <option value="qa">问答题</option>
              <option value="judge">判断题</option>
            </select>
          </div>
        </div>
        {questionType === "judge" && (
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>标准答案</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "var(--on-surface)" }}>
                <input type="radio" name="judge-answer" checked={answer === true} onChange={() => setAnswer(true)} />
                正确
              </label>
              <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "var(--on-surface)" }}>
                <input type="radio" name="judge-answer" checked={answer === false} onChange={() => setAnswer(false)} />
                错误
              </label>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>分类</label>
            <select className={inputWrap} style={fieldStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">未分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{categoryLabels[c.id] || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>公司</label>
            <input className={inputWrap} style={fieldStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="可选" />
          </div>
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--on-surface)" }}>标签（逗号分隔）</label>
          <input className={inputWrap} style={fieldStyle} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="数组, 哈希表" />
        </div>
      </div>
      {dialog}
    </Modal>
  );
}
