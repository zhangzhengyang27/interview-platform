import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "面试题库",
  description:
    "浏览海量面试题目，涵盖前端、Java、Python、Go、数据库、算法等多个方向，支持按难度、分类筛选。",
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
