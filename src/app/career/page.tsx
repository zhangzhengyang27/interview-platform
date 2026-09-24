import { redirect } from "next/navigation";
import { CAREER_CATEGORIES } from "@/data/career-catalog";

export default function CareerIndexPage() {
  const first = CAREER_CATEGORIES[0];
  const firstDoc = first?.docs[0];
  if (first && firstDoc) {
    redirect(`/career/${first.id}/${firstDoc.slug}`);
  }
  return null;
}
