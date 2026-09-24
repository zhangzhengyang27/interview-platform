import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学习计划",
  description:
    "制定个性化的面试学习计划，系统化备战面试，按天规划刷题进度，高效提升面试能力。",
};

export default function StudyPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
