"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CodeEditor } from "@/components/CodeEditor";

interface ContestProblem {
  id: string;
  contestId: string;
  questionId: string;
  score: number;
  orderBy: number;
  question: {
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
    codeTemplate: Record<string, string> | null;
  };
}

interface UserSubmission {
  id: string;
  questionId: string;
  status: string;
  score: number;
  submittedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  userName: string;
  userImage: string | null;
  totalScore: number;
  solvedCount: number;
  submissionCount: number;
  lastSubmitTime: string | null;
}

interface ContestDetail {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  duration: number;
  status: string;
  type: string;
  problems: ContestProblem[];
  userSubmissions: UserSubmission[];
  _count: {
    submissions: number;
  };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export default function ContestDetailPage() {
  const params = useParams();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<ContestProblem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: string;
    score: number;
    output?: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const contestId = typeof params?.id === "string" ? params.id : "";

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  }, [contestId]);

  // 加载竞赛详情
  const loadContest = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setContest(data);

      if (data.problems.length > 0 && !selectedProblem) {
        setSelectedProblem(data.problems[0]);
        // 设置默认代码模板
        const template = data.problems[0].question.codeTemplate;
        if (template?.javascript) {
          setCode(template.javascript);
        }
      }

      // 加载排行榜
      loadLeaderboard();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  // 故意省略 selectedProblem：仅用于"首次未选中时设默认值"，
  // 加入会导致用户切换题目时重复请求整个竞赛详情并重置选中态
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId, loadLeaderboard]);

  useEffect(() => {
    if (contestId) loadContest();
  }, [contestId, loadContest]);

  // 倒计时逻辑
  useEffect(() => {
    if (!contest) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(contest.startTime).getTime();
      const end = start + contest.duration * 60000;

      if (now < start) {
        // 未开始：倒计时到开始时间
        const diff = start - now;
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else if (now < end) {
        // 进行中：倒计时到结束时间
        const diff = end - now;
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setCountdown(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  // 切换题目
  const handleSelectProblem = (problem: ContestProblem) => {
    setSelectedProblem(problem);
    setSubmitResult(null);
    const template = problem.question.codeTemplate;
    if (template?.[language]) {
      setCode(template[language]);
    } else if (template?.javascript) {
      setCode(template.javascript);
    } else {
      setCode("// 开始编写你的代码...");
    }
  };

  // 提交代码
  const handleSubmit = async () => {
    if (!selectedProblem || submitting) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch(`/api/contests/${contestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: selectedProblem.questionId,
          code,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitResult({ status: "error", score: 0, output: data.error });
      } else {
        setSubmitResult({
          status: data.submission.status,
          score: data.submission.score,
          output: data.execution.output,
        });
        // 刷新排行榜
        loadLeaderboard();
        // 刷新用户提交状态
        loadContest();
      }
    } catch (error) {
      console.error(error);
      setSubmitResult({ status: "error", score: 0, output: "提交失败，请重试" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]">
        <p className="text-on-surface-variant">竞赛不存在</p>
      </div>
    );
  }

  const isOngoing = contest.status === "ongoing";
  const isUpcoming = contest.status === "upcoming";
  const isEnded = contest.status === "ended";

  return (
    <div className="min-h-[calc(100dvh-56px)]" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div
        className="border-b px-4 md:px-6 lg:px-8 py-6"
        style={{
          backgroundColor: "var(--surface-container-low)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-on-surface">{contest.title}</h1>
                <StatusBadge status={contest.status} />
              </div>
              {contest.description && (
                <p className="text-sm text-on-surface-variant max-w-2xl">
                  {contest.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-on-surface-variant">
                <span>{contest.problems.length} 道题目</span>
                <span>时长 {contest.duration} 分钟</span>
                <span>{contest._count.submissions} 人参与</span>
              </div>
            </div>

            {/* Countdown / Timer */}
            {countdown && (
              <div className="text-center">
                <p className="text-xs text-on-surface-variant mb-1">
                  {isUpcoming ? "距离开始还有" : "剩余时间"}
                </p>
                <div className="flex items-center gap-1 font-mono text-2xl font-bold" style={{ color: isOngoing ? "var(--success)" : "var(--info)" }}>
                  {countdown.days > 0 && (
                    <>
                      <TimeUnit value={countdown.days} label="天" />
                      <span className="text-on-surface-variant">:</span>
                    </>
                  )}
                  <TimeUnit value={countdown.hours} label="时" />
                  <span className="text-on-surface-variant">:</span>
                  <TimeUnit value={countdown.minutes} label="分" />
                  <span className="text-on-surface-variant">:</span>
                  <TimeUnit value={countdown.seconds} label="秒" />
                </div>
              </div>
            )}

            {isEnded && (
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                  竞赛已结束
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Problems List & Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Problem List */}
            <Card className="p-4">
              <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                题目列表
              </h2>
              <div className="space-y-2">
                {contest.problems.map((problem) => {
                  const isSelected = selectedProblem?.id === problem.id;
                  const submission = contest.userSubmissions.find(
                    (s) => s.questionId === problem.questionId
                  );

                  return (
                    <button
                      key={problem.id}
                      onClick={() => handleSelectProblem(problem)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? "var(--primary-container)"
                          : "var(--surface-container-low)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{
                              backgroundColor: isSelected
                                ? "var(--primary)"
                                : "var(--surface-high)",
                              color: isSelected
                                ? "var(--on-primary)"
                                : "var(--on-surface)",
                            }}
                          >
                            {problem.orderBy}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`font-medium truncate ${
                                isSelected ? "text-on-primary-container" : "text-on-surface"
                              }`}
                            >
                              {problem.question.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor:
                                    problem.question.difficulty === "easy"
                                      ? "var(--success-container)"
                                      : problem.question.difficulty === "medium"
                                      ? "var(--warning-container)"
                                      : "var(--error-container)",
                                  color:
                                    problem.question.difficulty === "easy"
                                      ? "var(--success-text)"
                                      : problem.question.difficulty === "medium"
                                      ? "var(--warning-text)"
                                      : "var(--error-text)",
                                }}
                              >
                                {DIFFICULTY_LABELS[problem.question.difficulty]}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {problem.score} 分
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Submission Status Icon */}
                        {submission && (
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2"
                            style={{
                              backgroundColor:
                                submission.status === "accepted"
                                  ? "var(--success-container)"
                                  : "var(--error-container)",
                            }}
                          >
                            {submission.status === "accepted" ? (
                              <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Code Editor */}
            {selectedProblem && isOngoing && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-on-surface">
                    编辑器 - {selectedProblem.question.title}
                  </h3>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: "var(--surface-container-low)",
                      borderColor: "var(--outline-variant)",
                      color: "var(--on-surface)",
                    }}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </Select>
                </div>

                <CodeEditor
                  value={code}
                  language={language}
                  onChange={setCode}
                  className="h-[400px]"
                />

                {/* Submit Result */}
                {submitResult && (
                  <div
                    className="mt-3 p-3 rounded-lg"
                    style={{
                      backgroundColor:
                        submitResult.status === "accepted"
                          ? "var(--success-container)"
                          : submitResult.status === "error"
                          ? "var(--error-container)"
                          : "var(--warning-container)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold text-sm"
                        style={{
                          color:
                            submitResult.status === "accepted"
                              ? "var(--success-text)"
                              : submitResult.status === "error"
                              ? "var(--error-text)"
                              : "var(--warning-text)",
                        }}
                      >
                        {submitResult.status === "accepted"
                          ? `✓ 通过！得分: ${submitResult.score}`
                          : submitResult.status === "error"
                          ? `✗ ${submitResult.output}`
                          : `✗ ${submitResult.status}`}
                      </span>
                      {submitResult.score > 0 && (
                        <span className="text-sm font-mono" style={{ color: "var(--primary)" }}>
                          +{submitResult.score}分
                        </span>
                      )}
                    </div>
                    {submitResult.output && submitResult.status !== "error" && (
                      <pre className="text-xs mt-1 overflow-auto max-h-32" style={{ color: "var(--on-surface-variant)" }}>
                        {submitResult.output}
                      </pre>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting || !code.trim()}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        提交代码
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {!isOngoing && selectedProblem && (
              <Card className="p-4 text-center">
                <p className="text-on-surface-variant">
                  {isUpcoming ? "⏰ 竞赛尚未开始，请等待开始后再提交代码" : "🏁 竞赛已结束"}
                </p>
              </Card>
            )}
          </div>

          {/* Right: Leaderboard */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-on-surface flex items-center gap-2">
                  <svg className="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  排行榜
                </h2>
                <button
                  onClick={loadLeaderboard}
                  className="text-xs text-primary hover:underline"
                >
                  刷新
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <p className="text-sm text-center text-on-surface-variant py-8">
                  暂无排名数据
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div
                      key={entry.userId ?? entry.rank}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor:
                          entry.rank <= 3
                            ? entry.rank === 1
                              ? "color-mix(in srgb, #FFD700 15%, transparent)"
                              : entry.rank === 2
                              ? "color-mix(in srgb, #C0C0C0 15%, transparent)"
                              : "color-mix(in srgb, #CD7F32 15%, transparent)"
                            : "transparent",
                      }}
                    >
                      {/* Rank */}
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          color:
                            entry.rank === 1
                              ? "#FFD700"
                              : entry.rank === 2
                              ? "#C0C0C0"
                              : entry.rank === 3
                              ? "#CD7F32"
                              : "var(--on-surface-variant)",
                        }}
                      >
                        {entry.rank}
                      </span>

                      {/* Avatar */}
                      {entry.userImage ? (
                        <img
                          src={entry.userImage}
                          alt={`${entry.userName ?? "用户"} 的头像`}
                          loading="lazy"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: "var(--surface-high)",
                            color: "var(--on-surface)",
                          }}
                        >
                          {entry.userName.charAt(0)}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {entry.userName}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {entry.solvedCount}题 · {entry.submissionCount}次提交
                        </p>
                      </div>

                      {/* Score */}
                      <span className="text-base font-bold font-mono text-primary">
                        {entry.totalScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    upcoming: { label: "即将开始", bg: "var(--info-container)", color: "var(--info-text)" },
    ongoing: { label: "进行中", bg: "var(--success-container)", color: "var(--success-text)" },
    ended: { label: "已结束", bg: "var(--surface-variant)", color: "var(--on-surface-variant)" },
  };

  const c = config[status as keyof typeof config] ?? config.ended;

  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2rem] text-center">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-on-surface-variant">{label}</span>
    </div>
  );
}
