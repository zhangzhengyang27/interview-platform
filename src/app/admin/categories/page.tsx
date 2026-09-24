"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, FolderTree, ChevronRight, ChevronDown } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Table, type ColumnDef } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { buildCategoryLabels } from "@/lib/category-utils";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  sortOrder: number;
  parentId?: string | null;
  questionCount?: number;
  children?: CategoryItem[];
}

const TYPE_OPTIONS = [
  "language",
  "data-structure",
  "algorithm",
  "framework",
  "database",
  "system-design",
  "frontend",
  "backend",
  "other",
];

const TYPE_LABELS: Record<string, string> = {
  language: "编程语言",
  "data-structure": "数据结构",
  algorithm: "算法",
  framework: "框架",
  database: "数据库",
  "system-design": "系统设计",
  frontend: "前端",
  backend: "后端",
  other: "其他",
};

interface FlatRow extends CategoryItem {
  depth: number;
  hasChildren: boolean;
}

function buildTree(list: CategoryItem[]): CategoryItem[] {
  const sortByOrder = (items: CategoryItem[]) =>
    [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const map = new Map<string, CategoryItem>();
  const roots: CategoryItem[] = [];
  for (const item of list) map.set(item.id, { ...item, children: [] });
  for (const item of list) {
    const node = map.get(item.id);
    if (!node) continue;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return sortByOrder(roots.map((r) => ({ ...r, children: sortByOrder(r.children ?? []) })));
}

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<FlatRow[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [type, setType] = useState("language");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const { confirm, alert, dialog } = useConfirmDialog();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?includeStats=true");
      if (res.ok) {
        const json = await res.json();
        const list: CategoryItem[] = json.categories ?? [];
        setAllCategories(list);
        setCategoryLabels(buildCategoryLabels(list));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 基于展开状态动态生成树形扁平行
  const treeRows = useMemo(() => {
    const flat: FlatRow[] = [];
    const walk = (items: CategoryItem[], depth: number) => {
      for (const c of items) {
        const hasChildren = (c.children?.length ?? 0) > 0;
        flat.push({ ...c, children: undefined, depth, hasChildren });
        if (hasChildren && expandedIds.has(c.id)) walk(c.children ?? [], depth + 1);
      }
    };
    walk(buildTree(allCategories), 0);
    return flat;
  }, [allCategories, expandedIds]);

  useEffect(() => {
    setRows(treeRows);
  }, [treeRows]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("language");
    setDescription("");
    setSortOrder("0");
    setParentId("");
    setModalOpen(true);
  };

  const openEdit = (c: CategoryItem) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setDescription(c.description ?? "");
    setSortOrder(String(c.sortOrder ?? 0));
    setParentId(c.parentId ?? "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        description: description || null,
        sortOrder: parseInt(sortOrder || "0", 10) || 0,
        parentId: parentId || null,
      };
      const res = editing
        ? await fetch(`/api/categories/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        setModalOpen(false);
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = allCategories.find((c) => c.id === id);
    const hasChildren = allCategories.some((c) => c.parentId === id);
    if (hasChildren) {
      alert({ title: "无法删除", message: "该分类下存在子分类，请先删除或移动其子分类后再删除。" });
      return;
    }
    if (!(await confirm({ title: "删除分类", message: `确定删除分类「${target?.name || id}」吗？该分类下的题目将变为未分类。`, confirmText: "删除", danger: true }))) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchCategories();
    } else {
      alert({ title: "删除失败", message: "删除失败，请稍后重试。" });
    }
  };

  const handleSort = async (c: CategoryItem, direction: "up" | "down") => {
    // 找到同父级的兄弟分类，按 sortOrder 排序后与相邻兄弟交换，避免 sortOrder 冲突
    const siblings = allCategories
      .filter((s) => s.id !== c.id && s.parentId === (c.parentId ?? null))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = siblings.findIndex((s) => (s.sortOrder ?? 0) >= (c.sortOrder ?? 0));
    const targetIdx = direction === "up" ? idx - 1 : idx;
    const neighbor = siblings[targetIdx];
    if (!neighbor) return;
    await Promise.all([
      fetch(`/api/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: neighbor.sortOrder }),
      }),
      fetch(`/api/categories/${neighbor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: c.sortOrder }),
      }),
    ]);
    fetchCategories();
  };

  const columns: ColumnDef<FlatRow>[] = [
    {
      key: "name",
      title: "分类名称",
      width: 320,
      render: (r) => (
        <div
          className="flex items-center gap-1.5 min-w-0"
          style={{ paddingLeft: r.depth * 20 }}
        >
          {r.hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(r.id)}
              className="p-0.5 rounded hover:bg-surface-high transition-colors shrink-0"
              aria-label={expandedIds.has(r.id) ? "收起" : "展开"}
              title={expandedIds.has(r.id) ? "收起" : "展开"}
            >
              {expandedIds.has(r.id) ? (
                <ChevronDown className="h-4 w-4" style={{ color: "var(--on-surface-variant)" }} />
              ) : (
                <ChevronRight className="h-4 w-4" style={{ color: "var(--on-surface-variant)" }} />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span
            className="truncate"
            style={{
              color: "var(--on-surface)",
              fontWeight: r.depth === 0 ? 600 : 400,
            }}
          >
            {r.name}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      title: "类型",
      width: 130,
      render: (r) => (
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}
        >
          {TYPE_LABELS[r.type] || r.type}
        </span>
      ),
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
      key: "questionCount",
      title: "题目数",
      width: 90,
      align: "right",
      render: (r) => r.questionCount ?? 0,
    },
    {
      key: "sortOrder",
      title: "排序",
      width: 110,
      render: (r) => (
        <div className="flex items-center gap-1">
          <span className="text-sm w-5" style={{ color: "var(--on-surface-variant)" }}>
            {r.sortOrder ?? 0}
          </span>
          <button
            type="button"
            onClick={() => handleSort(r, "up")}
            className="p-2 rounded hover:bg-surface-high transition-colors"
            aria-label="上移"
            title="上移"
          >
            <ArrowUp className="h-4 w-4 text-on-surface-variant" />
          </button>
          <button
            type="button"
            onClick={() => handleSort(r, "down")}
            className="p-2 rounded hover:bg-surface-high transition-colors"
            aria-label="下移"
            title="下移"
          >
            <ArrowDown className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      title: "操作",
      width: 180,
      render: (r) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
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

  const cardClass = {
    backgroundColor: "var(--surface-bright)",
    borderColor: "var(--outline-variant)",
  } as const;

  const labelClass = "block text-sm font-medium mb-1";

  return (
    <div className="space-y-4">
      <PageHeader
        title="分类管理"
        description="管理题库分类体系"
        icon={<FolderTree className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> 新建分类
          </Button>
        }
      />

      <div className="rounded-xl border" style={cardClass}>
        <Table<FlatRow>
          columns={columns}
          dataSource={rows}
          loading={loading}
          rowKey={(r) => r.id}
          emptyText="暂无分类"
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "编辑分类" : "新建分类"}
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
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              名称 *
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入分类名称" />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              类型 *
            </label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] || t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              上级分类
            </label>
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">无（顶级）</option>
              {allCategories
                .filter((c) => !editing || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabels[c.id] || c.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              描述
            </label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入描述" rows={3} />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--on-surface)" }}>
              排序值
            </label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}
