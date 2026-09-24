"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetcher } from "@/lib/swr";

const ONBOARDING_STORAGE_KEY = "interview-onboarding-completed";

// ─── 方向数据（简化版，用于 onboarding）────────────────────────────────────

interface DirectionOption {
  key: string;
  name: string;
  icon: React.ReactNode;
}

const DIRECTIONS: DirectionOption[] = [
  {
    key: "java",
    name: "Java",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      </svg>
    ),
  },
  {
    key: "backend",
    name: "后端",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    key: "frontend",
    name: "前端",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    key: "algorithm",
    name: "算法",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  {
    key: "system-design",
    name: "系统设计",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="6" rx="1" />
        <rect x="4" y="16" width="16" height="6" rx="1" />
        <rect x="8" y="9" width="8" height="6" rx="1" />
      </svg>
    ),
  },
  {
    key: "python",
    name: "Python",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M8 12v6a4 4 0 0 0 8 0v-6" />
      </svg>
    ),
  },
  {
    key: "general",
    name: "通用",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDirections, setSelectedDirections] = useState<Set<string>>(new Set());
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  // 题量动态获取，避免文案与实际数据脱节
  const { data: countData } = useSWR<{ total: number }>(
    "/api/questions?take=1",
    fetcher
  );
  const questionCount = countData?.total;

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  const goToNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleDirection = (key: string) => {
    setSelectedDirections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < 2) {
        next.add(key);
      }
      return next;
    });
  };

  const steps = [
    // Step 1: 欢迎页
    <div key="welcome" className="space-y-6">
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ backgroundColor: "var(--primary-container)" }}
        >
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--on-primary-container)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          欢迎来到面试网
        </h2>
        <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
          AI 驱动的程序员面试准备平台
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            ),
            title: questionCount !== undefined ? `${questionCount.toLocaleString()} 道面试题` : "海量面试题",
            desc: "覆盖算法/前端/后端/数据库等全方向",
          },
          {
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            ),
            title: "AI 模拟面试",
            desc: "真实面试场景，即时反馈评分",
          },
          {
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            ),
            title: "智能复习",
            desc: "艾宾浩斯遗忘曲线，科学安排复习",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              backgroundColor: "var(--surface-container)",
            }}
          >
            <div
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
              style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
            >
              {feature.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--on-surface)" }}>
                {feature.title}
              </h3>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="primary" size="lg" onClick={goToNext}>
          开始
        </Button>
      </div>
    </div>,

    // Step 2: 选择方向
    <div key="directions" className="space-y-5">
      <div className="text-center">
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--on-surface)" }}
        >
          选择你的面试方向
        </h2>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          选择 1-2 个你感兴趣的方向（我们将为你定制学习路线）
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {DIRECTIONS.map((dir) => {
          const isSelected = selectedDirections.has(dir.key);
          return (
            <button
              key={dir.key}
              onClick={() => toggleDirection(dir.key)}
              className="flex items-center gap-2.5 p-3 rounded-lg text-left transition-all duration-150 focus:outline-none"
              style={{
                backgroundColor: isSelected ? "var(--primary-container)" : "var(--surface-container)",
                border: `1.5px solid ${isSelected ? "var(--primary)" : "transparent"}`,
                opacity: !isSelected && selectedDirections.size >= 2 ? 0.5 : 1,
              }}
              disabled={!isSelected && selectedDirections.size >= 2}
            >
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: isSelected ? "var(--primary)" : "var(--surface-high)",
                  color: isSelected ? "var(--on-primary)" : "var(--on-surface-variant)",
                }}
              >
                {dir.icon}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: isSelected ? "var(--on-primary-container)" : "var(--on-surface)" }}
              >
                {dir.name}
              </span>
              {isSelected && (
                <svg
                  className="w-4 h-4 ml-auto shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={goToPrev}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--on-surface-variant)" }}
        >
          返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-surface-high transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            跳过
          </button>
          <Button variant="primary" onClick={goToNext} disabled={selectedDirections.size === 0}>
            继续
          </Button>
        </div>
      </div>
    </div>,

    // Step 3: 推荐路线
    <div key="recommendation" className="space-y-5">
      <div className="text-center">
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--on-surface)" }}
        >
          为你推荐学习路线
        </h2>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          基于你选择的方向，我们推荐以下学习路径
        </p>
      </div>

      <div className="space-y-2.5">
        {Array.from(selectedDirections).slice(0, 2).map((dirKey, idx) => {
          const dir = DIRECTIONS.find((d) => d.key === dirKey);
          if (!dir) return null;
          return (
            <Card key={dirKey} className="p-4" hoverable>
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: "var(--primary-container)",
                    color: "var(--on-primary-container)",
                  }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
                    {dir.name} 学习路线
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                    从基础到进阶，涵盖核心知识点、高频面试题和实战项目建议
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {selectedDirections.size === 0 && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              你还没有选择方向，可以先浏览所有题目
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={goToPrev}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--on-surface-variant)" }}
        >
          返回
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-surface-high transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
          >
            跳过
          </button>
          <Button variant="primary" onClick={goToNext}>
            完成设置
          </Button>
        </div>
      </div>
    </div>,

    // Step 4: 快速体验
    <div key="ready" className="space-y-5">
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: "var(--success-container)" }}
        >
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--success-text)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
        >
          一切就绪！
        </h2>
        <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
          选择一个快速入口开始你的面试准备之旅
        </p>
      </div>

      <div className="space-y-2.5">
        <Link href="/" className="block" onClick={completeOnboarding}>
          <Card className="p-4" hoverable>
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--surface-high)" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                  来一道每日一题
                </h3>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  每天一道精选题目，保持刷题手感
                </p>
              </div>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>

        <Link href="/ai/mock-interview" className="block" onClick={completeOnboarding}>
          <Card className="p-4" hoverable>
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--surface-high)" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                  试试 AI 模拟面试
                </h3>
                <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  真实面试场景，AI 即时评分反馈
                </p>
              </div>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      </div>

      <div className="pt-2 space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            completeOnboarding();
            router.push("/questions");
          }}
        >
          开始刷题
        </Button>
        <p className="text-center text-xs" style={{ color: "var(--on-surface-variant)" }}>
          随时可以在设置中重新查看引导
        </p>
      </div>
    </div>,
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "color-mix(in srgb, var(--on-surface) 60%, transparent)",
        animation: isExiting ? "fadeOut 0.3s ease-out forwards" : "fadeIn 0.25s ease-out forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSkip();
      }}
    >
      {/* 弹窗容器 */}
      <div
        className="relative w-full max-w-[520px] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--outline-variant)",
          transform: isExiting ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
          opacity: isExiting ? 0 : 1,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-high transition-colors"
          style={{ color: "var(--on-surface-variant)" }}
          aria-label="关闭"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div
            key={currentStep}
            className="animate-fade-in"
            style={{
              animation: "stepSlideIn 0.35s ease-out",
            }}
          >
            {steps[currentStep]}
          </div>
        </div>

        {/* 进度指示器 */}
        <div
          className="shrink-0 px-6 py-4 flex items-center justify-center gap-2"
          style={{
            borderTop: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-low)",
          }}
        >
          {[0, 1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => step < currentStep && setCurrentStep(step)}
              disabled={step > currentStep}
              className="w-2.5 h-2.5 rounded-full transition-all duration-200 focus:outline-none"
              style={{
                backgroundColor:
                  step === currentStep
                    ? "var(--primary)"
                    : step < currentStep
                    ? "var(--on-surface-variant)"
                    : "var(--surface-highest)",
                transform: step === currentStep ? "scale(1.2)" : "scale(1)",
                cursor: step < currentStep ? "pointer" : "default",
              }}
              aria-label={`步骤 ${step + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: 检测是否应该显示 Onboarding
 */
export function useShouldShowOnboarding(): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setShouldShow(true);
    }
  }, []);

  return shouldShow;
}
