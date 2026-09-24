"use client";

import { memo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

const SolutionContent = memo(function SolutionContent({ solution }: { solution: string | null }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <MarkdownRenderer content={solution ?? "暂无题解"} />
    </div>
  );
});

export default SolutionContent;
