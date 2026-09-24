import { prisma } from "@/lib/prisma";
import { runCode } from "@/lib/code-runner";

const TIMEOUT_MS = 15000;

export interface JudgeTestCaseResult {
  testCaseId: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  duration: number;
}

export interface JudgeResult {
  status: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded";
  passedCount: number;
  totalCount: number;
  duration: number;
  results: JudgeTestCaseResult[];
}

/**
 * 包装用户代码，自动注入调用逻辑和 stdout 输出
 * 支持 JavaScript / Python / Java / C++ 四种语言
 *
 * 约定：TestCase.input 为 JSON 数组字符串（表示函数参数列表）
 *       TestCase.output 为 JSON.stringify(期望返回值)
 */
export function wrapCode(userCode: string, language: string): string {
  switch (language) {
    case "javascript":
      return wrapJavaScript(userCode);
    case "python":
      return wrapPython(userCode);
    case "java":
      return wrapJava(userCode);
    case "cpp":
      return wrapCpp(userCode);
    default:
      return userCode;
  }
}

function wrapJavaScript(userCode: string): string {
  return `
${userCode}

// === Auto-generated runner (do not modify) ===
const fs = require('fs');
const raw = fs.readFileSync('/dev/stdin', 'utf-8').trim();
try {
  const args = JSON.parse(raw);
  const fnMatch = userCode.match(/(?:var|let|const)\s+(\w+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>)|(?:function)\s+(\w+)\s*\(|(?:class)\s+(Solution)/);
  const fnName = fnMatch ? (fnMatch[1] || fnMatch[2] || fnMatch[3]) : null;
  if (!fnName) {
    throw new Error('无法提取函数名');
  }
  const fn = eval(fnName);
  if (typeof fn === 'function') {
    const result = fn(...args);
    console.log(JSON.stringify(result));
  } else if (typeof fn === 'object' && fn !== null && typeof fn[Object.keys(fn).find(k => k !== 'constructor')] === 'function') {
    const methodName = Object.keys(fn).find(k => typeof fn[k] === 'function' && k !== 'constructor');
    if (methodName) {
      const result = fn[methodName](...args);
      console.log(JSON.stringify(result));
    } else {
      throw new Error('未找到可调用的方法');
    }
  } else {
    throw new Error('导出的 ' + fnName + ' 不是函数或类');
  }
} catch (e) {
  console.error('Error: ' + e.message);
  process.exit(1);
}
`.trim();
}

function wrapPython(userCode: string): string {
  return `
import sys, json

${userCode}

# === Auto-generated runner ===
try:
    raw = sys.stdin.read().strip()
    args = json.loads(raw)
    sol = Solution()
    method_name = None
    for name in dir(sol):
        if not name.startswith('_') and callable(getattr(sol, name)):
            method_name = name
            break
    if method_name:
        result = getattr(sol, method_name)(*args)
        print(json.dumps(result))
    else:
        print('Error: no callable method found', file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
`.trim();
}

function wrapJava(userCode: string): string {
  if (userCode.includes("public static void main")) {
    return userCode;
  }
  return `
import java.util.*;

${userCode}

class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine());
        }
        String input = sb.toString().trim();
        Solution sol = new Solution();
        System.out.println("Java wrapper: please include main method in your code");
    }
}
`.trim();
}

function wrapCpp(userCode: string): string {
  if (userCode.includes("int main(")) {
    return userCode;
  }
  return `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    string line;
    getline(cin, line);
    cout << "C++ wrapper: please include int main() in your code" << endl;
    return 0;
}
`.trim();
}

/**
 * 对指定题目执行代码判题
 * @param questionId 题目 ID
 * @param code 用户代码
 * @param language 编程语言
 * @param includeHidden 是否包含隐藏测试用例（默认 false，仅用可见用例）
 */
export async function judgeCode(
  questionId: string,
  code: string,
  language: string,
  includeHidden: boolean = false,
): Promise<JudgeResult> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      testCases: {
        where: includeHidden ? {} : { isHidden: false },
        orderBy: { orderBy: "asc" },
      },
    },
  });

  if (!question) {
    throw new Error("题目不存在");
  }

  const testCases = question.testCases;
  if (testCases.length === 0) {
    throw new Error("该题暂无测试用例");
  }

  const results: JudgeTestCaseResult[] = [];
  let overallStatus: JudgeResult["status"] = "accepted";
  let totalDuration = 0;
  const wrappedCode = wrapCode(code, language);

  for (const tc of testCases) {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        runCode(wrappedCode, language, tc.input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("超时")), TIMEOUT_MS),
        ),
      ]);

      const duration = Date.now() - startTime;
      totalDuration += duration;

      const actualOutput = (result.stdout || "").trim();
      const expectedOutput = (tc.output || "").trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.output,
        actual: result.stdout || "(无输出)",
        passed,
        duration,
      });

      if (!passed && overallStatus === "accepted") {
        overallStatus = "wrong_answer";
      }

      if (result.code !== 0 && result.stderr && overallStatus !== "wrong_answer") {
        overallStatus = "runtime_error";
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      totalDuration += duration;

      const isTimeout = err instanceof Error && err.message === "超时";

      results.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.output,
        actual: isTimeout ? "⏱ 执行超时 (>15s)" : (err instanceof Error ? err.message : "运行时错误"),
        passed: false,
        duration,
      });

      if (isTimeout) {
        overallStatus = "time_limit_exceeded";
        break;
      } else {
        if (overallStatus !== "wrong_answer") {
          overallStatus = "runtime_error";
        }
      }
    }
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    status: overallStatus,
    passedCount,
    totalCount: testCases.length,
    duration: totalDuration,
    results,
  };
}
