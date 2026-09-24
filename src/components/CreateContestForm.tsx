"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
}

interface CreateContestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateContestForm({ onClose, onSuccess }: CreateContestFormProps) {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("120"); // 默认2小时
  const [type, setType] = useState("weekly");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load questions for selection
  useEffect(() => {
    setLoading(true);
    fetch("/api/questions?take=200")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredQuestions = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.difficulty.includes(searchQuery)
  );

  const toggleQuestion = (question: Question) => {
    setSelectedQuestions((prev) =>
      prev.find((p) => p.id === question.id)
        ? prev.filter((p) => p.id !== question.id)
        : [...prev, question]
    );
  };

  const handleSubmit = async () => {
    if (!title || !startTime || !duration || selectedQuestions.length === 0) {
      alert("请填写完整信息并选择至少一道题目");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          startTime,
          duration: parseInt(duration),
          type,
          problemIds: selectedQuestions.map((q) => q.id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      alert(`创建失败: ${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "color-mix(in srgb, var(--on-surface) 60%, transparent)" }}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <h2 className="text-lg font-bold text-on-surface">
            {step === "form" ? "创建新竞赛" : "确认竞赛信息"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-high transition-colors"
          >
            <svg className="w-5 h-5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {step === "form" ? (
            <div className="space-y-5">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  竞赛标题 *
                </label>
                <Input
                  placeholder="例如：第1届算法挑战赛"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  描述（可选）
                </label>
                <textarea
                  placeholder="简要描述这场竞赛..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:ring-2 focus:ring-primary outline-none"
                  style={{
                    backgroundColor: "var(--surface-container-low)",
                    borderColor: "var(--outline-variant)",
                    color: "var(--on-surface)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    开始时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary outline-none"
                    style={{
                      backgroundColor: "var(--surface-container-low)",
                      borderColor: "var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    时长（分钟）*
                  </label>
                  <Select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{
                      backgroundColor: "var(--surface-container-low)",
                      borderColor: "var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                  >
                    <option value="30">30 分钟</option>
                    <option value="60">1 小时</option>
                    <option value="90">1.5 小时</option>
                    <option value="120">2 小时（推荐）</option>
                    <option value="180">3 小时</option>
                    <option value="240">4 小时</option>
                    <option value="360">6 小时</option>
                    <option value="480">8 小时</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  竞赛类型
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "weekly", label: "周赛" },
                    { id: "monthly", label: "月赛" },
                    { id: "custom", label: "自定义" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        type === t.id ? "ring-2 ring-primary" : ""
                      }`}
                      style={{
                        backgroundColor:
                          type === t.id ? "var(--primary-container)" : "var(--surface-container-low)",
                        color:
                          type === t.id ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Selection */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">
                  选择题目 * ({selectedQuestions.length} 已选)
                </label>

                {/* Search */}
                <Input
                  placeholder="搜索题目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />

                {/* Question List */}
                <div
                  className="rounded-lg border overflow-y-auto"
                  style={{
                    maxHeight: "250px",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  {loading ? (
                    <div className="p-4 text-center text-sm text-on-surface-variant">
                      加载题目...
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-on-surface-variant">
                      未找到匹配的题目
                    </div>
                  ) : (
                    filteredQuestions.map((question) => {
                      const isSelected = selectedQuestions.some(
                        (q) => q.id === question.id
                      );
                      return (
                        <button
                          key={question.id}
                          onClick={() => toggleQuestion(question)}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                            isSelected ? "" : "hover:bg-surface-container-low"
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? "var(--primary-container)"
                              : "transparent",
                            borderBottom: "1px solid var(--outline-variant)",
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                isSelected
                                  ? "text-on-primary-container"
                                  : "text-on-surface"
                              }`}
                            >
                              {question.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor:
                                    question.difficulty === "easy"
                                      ? "var(--success-container)"
                                      : question.difficulty === "medium"
                                      ? "var(--warning-container)"
                                      : "var(--error-container)",
                                  color:
                                    question.difficulty === "easy"
                                      ? "var(--success-text)"
                                      : question.difficulty === "medium"
                                      ? "var(--warning-text)"
                                      : "var(--error-text)",
                                }}
                              >
                                {question.difficulty === "easy"
                                  ? "简单"
                                  : question.difficulty === "medium"
                                  ? "中等"
                                  : "困难"}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {question.questionType === "code" ? "编程题" : "问答题"}
                              </span>
                            </div>
                          </div>

                          {/* Checkbox indicator */}
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-2 ${
                              isSelected ? "border-primary" : "border-outline-variant"
                            }`}
                            style={{
                              backgroundColor: isSelected ? "var(--primary)" : "transparent",
                            }}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-on-surface">{title}</h3>
                {description && (
                  <p className="text-sm text-on-surface-variant">{description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-on-surface-variant">开始时间</p>
                    <p className="font-medium text-on-surface">
                      {new Date(startTime).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">时长</p>
                    <p className="font-medium text-on-surface">{duration} 分钟</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">类型</p>
                    <p className="font-medium text-on-surface">
                      {type === "weekly" ? "周赛" : type === "monthly" ? "月赛" : "自定义"}
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <h4 className="text-sm font-medium text-on-surface mb-2">
                  已选题目 ({selectedQuestions.length})
                </h4>
                <div className="space-y-2">
                  {selectedQuestions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "var(--surface-container-low)" }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--on-primary)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-on-surface flex-1 truncate">
                        {q.title}
                      </span>
                      <span className="text-xs text-on-surface-variant">100分</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: "var(--info-container)", color: "var(--info-text)" }}
              >
                ⚠️ 创建后竞赛信息将不可修改，请确认无误后提交。
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          {step === "form" ? (
            <Button
              variant="secondary"
              onClick={() => setStep("preview")}
              disabled={!title || !startTime || selectedQuestions.length === 0}
            >
              下一步：预览
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setStep("form")}
              >
                返回修改
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "创建中..." : "确认创建"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
