"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_COLORS,
  QUESTION_TYPE_LABELS,
  getTagColor,
} from "@/lib/design-tokens";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Globe2,
  Hash,
  Layers,
  User,
  Calendar,
  Sparkles,
  ClipboardList,
  Check,
  X,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  User2,
  ChevronDown,
} from "lucide-react";

interface PaperDetail {
  id: string;
  name: string;
  detail: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  items: {
    id: string;
    sortOrder: number;
    questionType: string;
    question: {
      id: string;
      title: string;
      difficulty: string;
      questionType: string;
      content: string;
      codeTemplate: Record<string, string> | null;
      answer: boolean | null;
      solution: string | null;
      tags: { tag: string }[];
    };
  }[];
}

/** 题型分组：按题目顺序聚合相同题型，保留首次出现顺序 */
function useQuestionGroups(paper: PaperDetail | null) {
  return useMemo(() => {
    const groups: { type: string; label: string; indices: number[] }[] = [];
    const map = new Map<string, number>();
    (paper?.items ?? []).forEach((item, idx) => {
      const type = item.questionType;
      if (!map.has(type)) {
        map.set(type, groups.length);
        groups.push({
          type,
          label: QUESTION_TYPE_LABELS[type as keyof typeof QUESTION_TYPE_LABELS] ?? type,
          indices: [idx],
        });
      } else {
        groups[map.get(type)!].indices.push(idx);
      }
    });
    return groups;
  }, [paper]);
}

export default function TestPaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params?.id as string;
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [judgeAnswers, setJudgeAnswers] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mobileCardOpen, setMobileCardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    total: number;
    correctCount: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/test-papers/${paperId}`)
      .then((r) => r.json())
      .then((data) => setPaper(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [paperId]);

  const groups = useQuestionGroups(paper);

  if (loading) {
    return (
      <div
        className="min-h-[calc(100dvh-56px)] px-4 md:px-6 lg:px-8 py-6 md:py-8"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="max-w-6xl mx-auto">
          {/* 骨架：Hero */}
          <div
            className="rounded-2xl p-6 md:p-8 mb-6 animate-pulse"
            style={{ backgroundColor: "var(--surface-container)" }}
          >
            <div className="w-32 h-3 rounded-full mb-3" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-7 rounded-full w-2/3 mb-3" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-4 rounded-full w-1/2 mb-5" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-2 rounded-full w-full" style={{ backgroundColor: "var(--surface-high)" }} />
          </div>
          {/* 骨架：双栏 */}
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <div
              className="hidden lg:block rounded-2xl p-4 animate-pulse h-96"
              style={{ backgroundColor: "var(--surface-container)" }}
            />
            <div className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 rounded-full w-1/2" style={{ backgroundColor: "var(--surface-container)" }} />
                <div className="h-6 rounded-full w-16" style={{ backgroundColor: "var(--surface-container)" }} />
              </div>
              <div className="space-y-2.5">
                <div className="h-4 rounded-full w-full" style={{ backgroundColor: "var(--surface-container)" }} />
                <div className="h-4 rounded-full w-11/12" style={{ backgroundColor: "var(--surface-container)" }} />
                <div className="h-4 rounded-full w-4/5" style={{ backgroundColor: "var(--surface-container)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[calc(100dvh-56px)] px-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--surface-container)", color: "var(--on-surface-variant)" }}
        >
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--on-surface)" }}>试卷不存在</h3>
        <p className="text-sm mb-5" style={{ color: "var(--on-surface-variant)" }}>可能已被删除或链接有误</p>
        <Button variant="primary" onClick={() => router.push("/test-papers")}>
          返回试卷列表
        </Button>
      </div>
    );
  }

  const currentItem = paper.items[currentIdx];
  const answeredCount = completedIds.size;
  const progress = Math.round((answeredCount / paper.items.length) * 100);

  const toggleGroup = (type: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const selectQuestion = (idx: number) => {
    setCurrentIdx(idx);
    setMobileCardOpen(false);
  };

  const markComplete = () => {
    if (currentItem) {
      setCompletedIds((prev) => new Set(prev).add(currentItem.question.id));
      if (currentIdx < paper.items.length - 1) {
        setCurrentIdx(currentIdx + 1);
      }
    }
  };

  /** 提交试卷：收集判断题答案，调用后端判分 */
  const handleSubmitPaper = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/test-papers/${paperId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: judgeAnswers }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "提交失败");
      }
      const data = await res.json();
      setSubmissionResult({
        score: data.score,
        total: data.total,
        correctCount: data.correctCount,
      });
    } catch (err) {
      console.error("提交试卷失败:", err);
      alert(err instanceof Error ? err.message : "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  /** 题目格子状态：done=已标记完成，answered=已作答，active=当前，else=未答 */
  const cellStatus = (idx: number) => {
    const qId = paper.items[idx].question.id;
    if (idx === currentIdx) return "active" as const;
    if (completedIds.has(qId)) return "done" as const;
    if (answeredIds.has(qId)) return "answered" as const;
    return "todo" as const;
  };

  /** 左侧答题卡（分组 + 题号格），桌面与移动端共用 */
  const AnswerCard = (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
    >
      {/* 答题卡头部：统计 + 进度 */}
      <div className="px-4 py-3.5 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "var(--on-surface)" }}>
            <Layers className="w-4 h-4" style={{ color: "var(--primary)" }} /> 答题卡
          </h2>
          <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
            {answeredCount}/{paper.items.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "var(--primary)" }}
          />
        </div>
        {/* 图例 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />当前</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />已完成</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--info-text)" }} />已作答</span>
        </div>
      </div>

      {/* 分组列表 */}
      <div className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 240px)" }}>
        {groups.map((g) => {
          const collapsed = collapsedGroups.has(g.type);
          const groupDone = g.indices.filter((i) => completedIds.has(paper.items[i].question.id)).length;
          return (
            <div key={g.type} className="mb-2 last:mb-0">
              <button
                onClick={() => toggleGroup(g.type)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{ transform: collapsed ? "rotate(-90deg)" : undefined }}
                  />
                  {g.label}
                  <span className="text-[10px] px-1 rounded-full" style={{ backgroundColor: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                    {groupDone}/{g.indices.length}
                  </span>
                </span>
              </button>
              {!collapsed && (
                <div className="grid grid-cols-5 gap-1.5 px-1 pt-1.5 pb-1">
                  {g.indices.map((idx) => {
                    const status = cellStatus(idx);
                    const dc = DIFFICULTY_COLORS[paper.items[idx].question.difficulty as keyof typeof DIFFICULTY_COLORS] ?? DIFFICULTY_COLORS.medium;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectQuestion(idx)}
                        title={`第 ${idx + 1} 题：${paper.items[idx].question.title}`}
                        className="relative h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold transition-all duration-200 overflow-hidden"
                        style={{
                          backgroundColor:
                            status === "active" ? "var(--primary)"
                              : status === "done" ? "var(--success-container)"
                                : status === "answered" ? "var(--info-container)"
                                  : "var(--surface-container)",
                          color:
                            status === "active" ? "var(--on-primary)"
                              : status === "done" ? "var(--success)"
                                : status === "answered" ? "var(--info-text)"
                                  : "var(--on-surface-variant)",
                          border: `1px solid ${
                            status === "active" ? "var(--primary)"
                              : status === "done" ? "var(--success)"
                                : status === "answered" ? "var(--info-text)"
                                  : "var(--outline-variant)"
                          }`,
                          boxShadow: status === "active" ? "0 3px 10px color-mix(in srgb, var(--primary) 40%, transparent)" : undefined,
                          transform: status === "active" ? "translateY(-1px)" : undefined,
                        }}
                      >
                        {/* 难度色条 */}
                        <span className="absolute left-0 top-0 bottom-0 w-0.75" style={{ backgroundColor: dc.text }} />
                        {status === "done" ? <Check className="w-3.5 h-3.5" />
                          : status === "answered" ? <CircleDot className="w-3.5 h-3.5" />
                            : idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-[calc(100dvh-56px)] px-4 md:px-6 lg:px-8 py-6 md:py-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* ── Hero Header：渐变横幅 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background:
              "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary) 55%, var(--tertiary)))",
            color: "var(--on-primary-container)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 bg-white blur-2xl" />
          <div className="absolute -bottom-16 right-16 w-48 h-48 rounded-full opacity-10 bg-white blur-3xl" />

          <div className="relative">
            <button
              onClick={() => router.push("/test-papers")}
              className="flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> 返回试卷列表
            </button>

            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <ClipboardList className="w-5 h-5 opacity-90 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Test Paper</span>
              </div>
              <span
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={
                  paper.isPublic
                    ? { backgroundColor: "color-mix(in srgb, white 25%, transparent)", color: "var(--on-primary-container)" }
                    : { backgroundColor: "color-mix(in srgb, black 15%, transparent)", color: "var(--on-primary-container)" }
                }
              >
                {paper.isPublic ? <Globe2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {paper.isPublic ? "公开试卷" : "私密试卷"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{paper.name}</h1>
            {paper.detail && <p className="text-sm mt-2 opacity-90">{paper.detail}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs opacity-90">
              <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {paper.items.length} 题</span>
              <span className="flex items-center gap-1"><User2 className="w-3.5 h-3.5" /> {paper.user?.name ?? "匿名"}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(paper.createdAt).toLocaleDateString("zh-CN")}</span>
              {paper.tags?.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ backgroundColor: "color-mix(in srgb, white 22%, transparent)", color: "var(--on-primary-container)" }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                <span className="opacity-90">答题进度</span>
                <span className="font-semibold">{answeredCount}/{paper.items.length} · {progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, black 15%, transparent)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: "var(--on-primary-container)" }} />
              </div>
            </div>

            {/* 提交试卷 & 成绩 */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitPaper}
                disabled={submitting}
                className="flex items-center gap-1.5"
              >
                {submitting ? "提交中..." : "提交试卷"}
              </Button>
              {submissionResult && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, white 25%, transparent)",
                    color: "var(--on-primary-container)",
                  }}
                >
                  <span>成绩：{submissionResult.score} 分</span>
                  <span className="opacity-70">({submissionResult.correctCount}/{submissionResult.total} 正确)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 双栏：左答题卡 + 右题目区 ── */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* 桌面端：sticky 答题卡 */}
          <aside className="hidden lg:block lg:sticky lg:top-6">{AnswerCard}</aside>

          {/* 移动端：可折叠答题卡 */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileCardOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                <Layers className="w-4 h-4" style={{ color: "var(--primary)" }} /> 答题卡 {answeredCount}/{paper.items.length}
              </span>
              <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: mobileCardOpen ? "rotate(180deg)" : undefined, color: "var(--on-surface-variant)" }} />
            </button>
            {mobileCardOpen && <div className="mt-3">{AnswerCard}</div>}
          </div>

          {/* 右侧题目区 */}
          {currentItem && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
            >
              <div
                className="px-5 md:px-6 py-4 flex items-start justify-between gap-3 border-b"
                style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-container)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary) 70%, var(--tertiary)))",
                      color: "var(--on-primary-container)",
                    }}
                  >
                    {currentIdx + 1}
                  </div>
                  <h2 className="text-base font-semibold leading-snug" style={{ color: "var(--on-surface)" }}>
                    {currentItem.question.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: DIFFICULTY_COLORS[currentItem.question.difficulty as keyof typeof DIFFICULTY_COLORS]?.bg ?? "var(--surface-high)",
                      color: DIFFICULTY_COLORS[currentItem.question.difficulty as keyof typeof DIFFICULTY_COLORS]?.text ?? "var(--on-surface-variant)",
                    }}
                  >
                    {DIFFICULTY_LABELS[currentItem.question.difficulty as keyof typeof DIFFICULTY_LABELS] ?? currentItem.question.difficulty}
                  </span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: QUESTION_TYPE_COLORS[currentItem.question.questionType as keyof typeof QUESTION_TYPE_COLORS]?.bg ?? "var(--surface-high)",
                      color: QUESTION_TYPE_COLORS[currentItem.question.questionType as keyof typeof QUESTION_TYPE_COLORS]?.text ?? "var(--on-surface-variant)",
                    }}
                  >
                    {QUESTION_TYPE_LABELS[currentItem.question.questionType as keyof typeof QUESTION_TYPE_LABELS] ?? currentItem.question.questionType}
                  </span>
                </div>
              </div>

              <div className="p-5 md:p-6">
                {currentItem.question.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {currentItem.question.tags.map(({ tag }) => {
                      const tc = getTagColor(tag);
                      return (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: tc.bg, color: tc.text }}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="text-sm leading-relaxed" style={{ color: "var(--on-surface)" }}>
                  <MarkdownRenderer content={currentItem.question.content} />
                </div>

                {currentItem.question.questionType === "judge" && (
                  <div className="pt-4">
                    <p className="text-sm font-medium mb-3 flex items-center gap-1.5" style={{ color: "var(--on-surface)" }}>
                      <Sparkles className="w-4 h-4" style={{ color: "var(--primary)" }} /> 请判断该陈述是否正确：
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([true, false] as const).map((opt) => {
                        const picked = judgeAnswers[currentItem.question.id] === opt;
                        const isCorrect =
                          judgeAnswers[currentItem.question.id] !== undefined &&
                          judgeAnswers[currentItem.question.id] === currentItem.question.answer;
                        const showResult =
                          judgeAnswers[currentItem.question.id] !== undefined &&
                          currentItem.question.answer !== null;
                        return (
                          <button
                            key={String(opt)}
                            onClick={() => {
                              setJudgeAnswers((prev) => ({ ...prev, [currentItem.question.id]: opt }));
                              setAnsweredIds((prev) => new Set(prev).add(currentItem.question.id));
                            }}
                            className={cn(
                              "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                              !picked && "hover:-translate-y-px"
                            )}
                            style={{
                              borderColor: picked
                                ? showResult && isCorrect
                                  ? "var(--success)"
                                  : showResult && !isCorrect
                                    ? "var(--error)"
                                    : "var(--primary)"
                                : "var(--outline-variant)",
                              backgroundColor: picked
                                ? showResult && isCorrect
                                  ? "var(--success-container)"
                                  : showResult && !isCorrect
                                    ? "var(--error-container)"
                                    : "color-mix(in srgb, var(--primary) 8%, transparent)"
                                : "var(--surface-container)",
                              color: picked
                                ? showResult && isCorrect
                                  ? "var(--success)"
                                  : showResult && !isCorrect
                                    ? "var(--error)"
                                    : "var(--primary)"
                                : "var(--on-surface-variant)",
                              boxShadow: picked && !showResult ? "0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent)" : undefined,
                            }}
                          >
                            {opt ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {opt ? "正确" : "错误"}
                          </button>
                        );
                      })}
                    </div>

                    {judgeAnswers[currentItem.question.id] !== undefined &&
                      currentItem.question.answer !== null && (
                        <div
                          className="mt-4 p-4 rounded-xl"
                          style={{
                            backgroundColor: judgeAnswers[currentItem.question.id] === currentItem.question.answer
                              ? "var(--success-container)"
                              : "var(--error-container)",
                          }}
                        >
                          <div
                            className="flex items-center gap-2 text-sm font-semibold mb-1"
                            style={{
                              color: judgeAnswers[currentItem.question.id] === currentItem.question.answer
                                ? "var(--success)"
                                : "var(--error)",
                            }}
                          >
                            {judgeAnswers[currentItem.question.id] === currentItem.question.answer
                              ? <><CheckCircle2 className="w-4 h-4" /> 回答正确！</>
                              : <><X className="w-4 h-4" /> 回答错误，正确答案是「{currentItem.question.answer ? "正确" : "错误"}」。</>}
                          </div>
                          {currentItem.question.solution && (
                            <div className="text-sm leading-relaxed" style={{ color: "var(--on-surface)" }}>
                              <MarkdownRenderer content={currentItem.question.solution} />
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {currentItem.question.questionType !== "judge" &&
                  currentItem.question.solution && (
                    <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: "var(--info-container)" }}>
                      <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "var(--info-text)" }}>
                        <Lightbulb className="w-4 h-4" /> 参考题解
                      </div>
                      <div className="text-sm leading-relaxed" style={{ color: "var(--on-surface)" }}>
                        <MarkdownRenderer content={currentItem.question.solution} />
                      </div>
                    </div>
                  )}

                <div className="flex items-center justify-between pt-5 mt-5 border-t gap-3" style={{ borderColor: "var(--outline-variant)" }}>
                  <Button
                    variant="secondary"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(currentIdx - 1)}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> 上一题
                  </Button>
                  <Button
                    variant="primary"
                    onClick={markComplete}
                    className="flex items-center gap-1"
                  >
                    {completedIds.has(currentItem.question.id)
                      ? <><CheckCircle2 className="w-4 h-4" /> 已完成</>
                      : <><Check className="w-4 h-4" /> 标记完成并继续</>}
                    {currentIdx < paper.items.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
