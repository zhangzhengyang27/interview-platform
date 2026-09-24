"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CAREER_CATEGORIES } from "@/data/career-catalog";
import { cn } from "@/lib/utils";

function SidebarNav({
  activeCategory,
  expanded,
  onToggle,
}: {
  activeCategory: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);
  return (
    <>
      {CAREER_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const isOpen = expanded.has(cat.id);
        return (
          <div key={cat.id} className="py-1">
            <button
              type="button"
              onClick={() => onToggle(cat.id)}
              data-skip-touch-min-height
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-90")}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="truncate">{cat.label}</span>
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: "var(--surface-variant)", color: "var(--on-surface-variant)" }}
              >
                {cat.docs.length}
              </span>
            </button>

            {isOpen && (
              <div className="pb-1">
                {cat.docs.map((doc) => {
                  const isDocActive = segs[2] === doc.slug;
                  return (
                    <Link
                      key={doc.slug}
                      href={`/career/${cat.id}/${doc.slug}`}
                      data-skip-touch-min-height
                      className={cn(
                        "flex items-start gap-2 pl-9 pr-3 py-2 text-[13px] leading-snug transition-colors",
                        isDocActive
                          ? "text-primary font-medium"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                      )}
                    >
                      <span className="text-on-surface-variant/60 text-xs mt-0.5">
                        {doc.order ? `${doc.order}` : "•"}
                      </span>
                      <span className="flex-1">{doc.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // /career/<category>/<slug>
  const segs = pathname.split("/").filter(Boolean);
  const activeCategory = segs.length >= 2 ? segs[1] : CAREER_CATEGORIES[0]?.id;

  // 展开/收起状态：默认展开当前激活分类
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeCategory ? [activeCategory] : [])
  );

  // 移动端目录浮层开关
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] overflow-hidden">
      {/* 左侧分类导航：移动端隐藏，md 及以上显示 */}
      <aside
        className="hidden md:flex w-55 lg:w-60 shrink-0 flex-col border-r overflow-y-auto"
        style={{ backgroundColor: "var(--surface-lowest)", borderColor: "var(--outline-variant)" }}
      >
        <SidebarNav activeCategory={activeCategory} expanded={expanded} onToggle={toggle} />
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-y-auto min-w-0 relative">
        {/* 移动端目录按钮 + 浮层：md 以下显示 */}
        <div className="md:hidden sticky top-0 z-20 px-3 py-2 border-b"
          style={{ backgroundColor: "var(--surface-bright)", borderColor: "var(--outline-variant)" }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            data-skip-touch-min-height
            className="flex w-full items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: "var(--surface-container)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)",
            }}
            aria-expanded={mobileOpen}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="text-sm font-medium flex-1 text-left">目录</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("shrink-0 transition-transform", mobileOpen && "rotate-180")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* 移动端目录浮层 */}
        {mobileOpen && (
          <div
            className="md:hidden absolute left-0 right-0 top-[52px] z-10 border-b shadow-lg shadow-black/10 max-h-[60dvh] overflow-y-auto"
            style={{
              backgroundColor: "var(--surface-bright)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="p-2">
              <SidebarNav activeCategory={activeCategory} expanded={expanded} onToggle={toggle} />
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
