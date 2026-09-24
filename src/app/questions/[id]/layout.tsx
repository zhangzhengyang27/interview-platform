import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const question = await prisma.question.findUnique({
      where: { id },
      select: { title: true, content: true },
    });

    if (!question) {
      return {
        title: "题目未找到",
        description: "该题目不存在或已被删除",
      };
    }

    // 截取描述（去掉 HTML 标签，取前 160 字符）
    const plainText = question.content.replace(/<[^>]*>/g, "").slice(0, 160);

    return {
      title: question.title,
      description: `${plainText}...`,
      openGraph: {
        title: question.title,
        description: `${plainText}...`,
        type: "article",
      },
    };
  } catch {
    return {
      title: "面试题详情",
      description: "查看面试题目、答案解析和讨论",
    };
  }
}

export default function QuestionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
