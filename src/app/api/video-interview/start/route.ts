import { NextRequest } from "next/server";
import { isSeedRealtimeConfigured } from "@/lib/volcengine";
import {
  startVoiceChat,
  stopVoiceChat,
  getVolcRtcAppCredentials,
} from "@/lib/video-interview";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const INTERVIEWER_PROMPT =
  "你是一位专业的 AI 面试官，正在为候选人进行一场技术面试。请根据面试方向逐步提问，认真倾听候选人的回答，并适时追问细节。语气专业、友好、清晰，问题要有深度和针对性。";

// 允许的面试方向白名单（防止 prompt 注入）
const ALLOWED_DIRECTIONS = new Set([
  "java",
  "backend",
  "frontend",
  "algorithm",
  "system-design",
  "python",
  "general",
]);

const DIRECTION_LABELS: Record<string, string> = {
  java: "Java",
  backend: "后端",
  frontend: "前端",
  algorithm: "算法",
  "system-design": "系统设计",
  python: "Python",
  general: "通用",
};

/**
 * 开启 AI 面试官（调用 StartVoiceChat 让 AI 加入 RTC 房间）
 */
export async function POST(request: NextRequest) {
  if (!isSeedRealtimeConfigured()) {
    return new Response(
      JSON.stringify({ error: "视频面试未配置" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const roomId = typeof body.roomId === "string" ? body.roomId : "";
    const userId = typeof body.userId === "string" ? body.userId : "";
    const direction =
      typeof body.direction === "string" && ALLOWED_DIRECTIONS.has(body.direction)
        ? body.direction
        : "general";

    if (!roomId || !userId) {
      return new Response(JSON.stringify({ error: "缺少 roomId 或 userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { appId } = getVolcRtcAppCredentials();
    const taskId = `task-${crypto.randomUUID()}`;

    const result = await startVoiceChat({
      appId,
      roomId,
      taskId,
      userId,
      systemPrompt: `${INTERVIEWER_PROMPT}\n当前面试方向：${DIRECTION_LABELS[direction]}`,
      firstQuestion: "你好，欢迎参加本次面试，请先简单介绍一下你自己。",
    });

    if (!result.success) {
      console.error("StartVoiceChat 失败:", result.error);
      return new Response(
        JSON.stringify({ error: "AI 面试官加入失败，请稍后重试", taskId }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, taskId, roomId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to start AI interviewer:", error);
    const message = error instanceof Error ? error.message : "开启 AI 面试官失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * 结束 AI 面试官（StopVoiceChat）
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomId = typeof body.roomId === "string" ? body.roomId : "";
    const taskId = typeof body.taskId === "string" ? body.taskId : "";

    if (!roomId || !taskId) {
      return new Response(JSON.stringify({ error: "缺少 roomId 或 taskId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { appId } = getVolcRtcAppCredentials();
    const result = await stopVoiceChat(appId, roomId, taskId);

    return new Response(
      JSON.stringify({ success: result.success, error: result.error }),
      { status: result.success ? 200 : 502, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to stop AI interviewer:", error);
    const message = error instanceof Error ? error.message : "结束 AI 面试官失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
