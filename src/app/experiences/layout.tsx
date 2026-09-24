import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "面经笔记",
  description:
    "查看和分享面试经验笔记，记录面试过程、题目回忆、心得体会，帮助更多求职者准备面试。",
};

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
