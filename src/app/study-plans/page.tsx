"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  icon: string;
  totalDays: number;
  totalQuestions: number;
  completedCount: number;
}

function CreatePlanModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          totalDays: Number(totalDays),
        }),
      });
      if (!res.ok) throw new Error("创建失败");
      setTitle("");
      setDescription("");
      setTotalDays(30);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl p-4 md:p-6"
        style={{
          backgroundColor: "var(--surface-low)",
          border: "1px solid var(--outline-variant)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-semibold mb-6"
          style={{ color: "var(--on-surface)" }}
        >
          创建学习计划
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              计划名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：前端面试 30 天冲刺"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述这个计划的目标和覆盖范围..."
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              总天数
            </label>
            <input
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--error)" }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !title.trim()}
            >
              {submitting ? "创建中..." : "创建计划"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPlanModal({
  open,
  plan,
  onClose,
  onUpdated,
}: {
  open: boolean;
  plan: StudyPlan | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalDays, setTotalDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description);
      setTotalDays(plan.totalDays);
      setError(null);
    }
  }, [plan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan || !title.trim()) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/study-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          totalDays: Number(totalDays),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "更新失败");
      }
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !plan) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl p-4 md:p-6"
        style={{
          backgroundColor: "var(--surface-low)",
          border: "1px solid var(--outline-variant)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-semibold mb-6"
          style={{ color: "var(--on-surface)" }}
        >
          编辑学习计划
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              计划名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：前端面试 30 天冲刺"
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述这个计划的目标和覆盖范围..."
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--on-surface-variant)" }}
            >
              总天数
            </label>
            <input
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface)",
                border: "1px solid var(--outline-variant)",
              }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              增加天数会自动创建新的天数记录
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--error)" }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !title.trim()}
            >
              {submitting ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanCard({ plan, onRefresh, onEdit }: { plan: StudyPlan; onRefresh: () => void; onEdit: () => void }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const progress =
    plan.totalQuestions > 0
      ? Math.round((plan.completedCount / plan.totalQuestions) * 100)
      : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除学习计划「${plan.title}」吗？此操作不可恢复。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/study-plans/${plan.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "删除失败");
      }
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit();
  };

  return (
    <Card
      hoverable
      className="p-6 flex flex-col gap-4 cursor-pointer relative"
      onClick={() => router.push(`/study-plans/${plan.id}`)}
    >
      {/* 更多操作菜单 */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-md hover:bg-[var(--surface-high)] transition-colors"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg z-10"
            style={{
              backgroundColor: "var(--surface-low)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <button
              onClick={handleEdit}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-high)] transition-colors"
              style={{ color: "var(--on-surface)" }}
            >
              编辑计划
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--error-container)] transition-colors disabled:opacity-50"
              style={{ color: "var(--error)" }}
            >
              {isDeleting ? "删除中..." : "删除计划"}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" role="img" aria-label="plan">
          {plan.icon || "\u{1F4DA}"}
        </span>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold truncate"
            style={{ color: "var(--on-surface)" }}
          >
            {plan.title}
          </h3>
          <p
            className="text-sm mt-1 line-clamp-2"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {plan.description || "暂无描述"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {plan.totalDays} 天
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          {plan.totalQuestions} 题
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold"
          style={{ color: progress >= 100 ? "var(--success)" : "var(--primary)" }}
        >
          {progress}%
        </span>
      </div>

      <div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--surface-highest)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor:
                progress >= 100 ? "var(--success)" : "var(--primary)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--on-surface-variant)" }}
          >
            已完成 {plan.completedCount}/{plan.totalQuestions}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function StudyPlansPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study-plans");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch (err) {
      console.error("Failed to fetch study plans:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <AuthGuard>
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold mb-1"
            style={{ color: "var(--on-surface)" }}
          >
            学习计划
          </h1>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            系统化备战面试，按计划高效刷题
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setModalOpen(true)}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          创建学习计划
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg p-6"
              style={{
                backgroundColor: "var(--surface-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <SkeletonBox className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1">
                  <SkeletonBox className="h-5 w-3/4 mb-2" />
                  <SkeletonBox className="h-4 w-full" />
                </div>
              </div>
              <SkeletonBox className="h-3 w-full mb-3" />
              <SkeletonBox className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--error-container)" }}
          >
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--error)"
              strokeWidth="1.5"
            >
              <path d="M12 9v2m0 4h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--on-surface)" }}
          >
            加载失败
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--on-surface-variant)" }}
          >
            无法加载学习计划。<br />
            <span className="text-xs opacity-70">错误：{error}</span>
          </p>
          <Button variant="primary" onClick={fetchPlans}>
            重新加载
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--surface-high)" }}
          >
            <svg
              className="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--on-surface-variant)"
              strokeWidth="1.2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8M8 11h8M8 15h5" />
            </svg>
          </div>
          <h2
            className="text-2xl font-semibold mb-2"
            style={{ color: "var(--on-surface)" }}
          >
            还没有学习计划
          </h2>
          <p
            className="text-sm mb-8 text-center max-w-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            创建你的第一个学习计划，按照天为单位系统化地组织你的面试备考。
            <br />
            每天进步一点点，积跬步以至千里。
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setModalOpen(true)}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            创建你的第一个计划
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onRefresh={fetchPlans}
              onEdit={() => setEditingPlan(plan)}
            />
          ))}
        </div>
      )}

      <CreatePlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchPlans}
      />

      <EditPlanModal
        open={!!editingPlan}
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onUpdated={fetchPlans}
      />
    </div>
    </AuthGuard>
  );
}
