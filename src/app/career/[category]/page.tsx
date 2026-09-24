import Link from "next/link";
import { notFound } from "next/navigation";
import { CAREER_CATEGORIES, getCareerCategory } from "@/data/career-catalog";

export function generateStaticParams() {
  return CAREER_CATEGORIES.map((c) => ({ category: c.id }));
}

export default async function CareerCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCareerCategory(category);
  if (!cat) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--on-surface)" }}>
          {cat.label}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
          {cat.description}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {cat.docs.map((doc, i) => (
          <Link
            key={doc.slug}
            href={`/career/${cat.id}/${doc.slug}`}
            className="group flex items-start gap-3 rounded-lg p-4 transition-colors"
            style={{
              backgroundColor: "var(--surface-low)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <span
              className="flex items-center justify-center w-7 h-7 rounded text-xs font-semibold shrink-0"
              style={{
                backgroundColor: "var(--primary-container)",
                color: "var(--on-primary-container)",
              }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <span
                className="text-[15px] font-medium group-hover:text-primary transition-colors"
                style={{ color: "var(--on-surface)" }}
              >
                {doc.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
