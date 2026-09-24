const PISTON_API = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
};

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
  duration: number;
}

export async function runCode(sourceCode: string, language: string, stdin?: string): Promise<RunResult> {
  const config = LANGUAGE_MAP[language];
  if (!config) throw new Error(`不支持的语言: ${language}`);

  const startTime = Date.now();
  const response = await fetch(PISTON_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: config.language,
      version: config.version,
      files: [{ content: sourceCode }],
      stdin: stdin || "",
    }),
  });

  if (!response.ok) throw new Error(`代码执行服务错误: ${response.status}`);

  const data = await response.json();
  return {
    stdout: data.run?.stdout || "",
    stderr: data.run?.stderr || "",
    code: data.run?.code || 1,
    output: data.run?.stdout || data.run?.stderr || "(无输出)",
    duration: Date.now() - startTime,
  };
}

export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_MAP);
}
