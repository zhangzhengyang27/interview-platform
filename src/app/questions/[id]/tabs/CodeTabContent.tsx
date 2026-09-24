"use client";

import { memo } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { CodeRunner } from "@/components/CodeRunner";
import { CodeSubmitter } from "@/components/CodeSubmitter";
import { AICodeReviewer } from "@/components/AICodeReviewer";
import { ProgressiveHints } from "@/components/ProgressiveHints";

const CodeTabContent = memo(function CodeTabContent({
  code,
  setCode,
  language,
  questionId,
}: {
  code: string;
  setCode: (c: string) => void;
  language: string;
  questionId: string;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="shrink-0 mb-3">
        <ProgressiveHints questionId={questionId} />
      </div>
      <div className="shrink-0">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>
      <CodeRunner code={code} language={language} />
      <CodeSubmitter code={code} language={language} questionId={questionId} />
      <AICodeReviewer code={code} language={language} questionId={questionId} />
    </div>
  );
});

export default CodeTabContent;
