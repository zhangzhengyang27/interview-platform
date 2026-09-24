import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CAREER_CATEGORIES, getCareerCategory, getCareerDoc } from "@/data/career-catalog";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export function generateStaticParams() {
  return CAREER_CATEGORIES.flatMap((cat) =>
    cat.docs.map((doc) => ({
      category: cat.id,
      slug: doc.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const cat = getCareerCategory(category);
  const doc = cat ? getCareerDoc(cat.id, slug) : undefined;
  return {
    title: doc ? doc.title : "求职指南",
    description: doc && cat ? `${cat.label} · ${doc.title}` : "求职方法论知识库",
  };
}

export default async function CareerDocPage({ params }: Props) {
  const { category, slug } = await params;
  const cat = getCareerCategory(category);
  const doc = cat ? getCareerDoc(cat.id, slug) : undefined;
  if (!cat || !doc) notFound();

  const filePath = path.join(
    process.cwd(),
    "public",
    "knowledge",
    "career",
    cat.id,
    `${doc.file}.md`
  );

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    notFound();
  }

  return (
    <article className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
        <span>{cat.label}</span>
        <span>·</span>
        <span>{doc.title}</span>
      </div>

      <MarkdownRenderer content={content} />
    </article>
  );
}
