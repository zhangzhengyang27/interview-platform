import { NextRequest } from "next/server";
import { isSeedRealtimeConfigured } from "@/lib/volcengine";
import {
  generateRtcToken,
  getVolcRtcAppCredentials,
} from "@/lib/video-interview";

export const dynamic = "force-dynamic";

/**
 * 签发视频面试会话（RTC Token + 房间/用户信息）
 *
 * 前端拿到 roomId/userId/token 后，用 RTC Web SDK 进房。
 * AI 面试官由 StartVoiceChat 接口加入房间（见 start 接口）。
 * HEAD 用于探测视频面试是否已配置（前端据此隐藏入口）。
 */
export async function HEAD() {
  const configured = isSeedRealtimeConfigured();
  return new Response(null, { status: configured ? 200 : 503 });
}

export async function POST(request: NextRequest) {
  if (!isSeedRealtimeConfigured()) {
    return new Response(
      JSON.stringify({
        error:
          "视频面试未配置：请在 .env.local 设置 VOLC_S2S_APP_ID/VOLC_S2S_ACCESS_TOKEN/VOLC_RTC_APP_ID/VOLC_RTC_APP_KEY/VOLC_ACCESS_KEY/VOLC_SECRET_KEY",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const direction = typeof body.direction === "string" ? body.direction : "general";

    const { appId, appKey } = getVolcRtcAppCredentials();

    const roomId = `interview-${crypto.randomUUID()}`;
    const userId = `candidate-${crypto.randomUUID()}`;

    const token = generateRtcToken(appId, appKey, roomId, userId, 3600);

    return new Response(
      JSON.stringify({
        appId,
        roomId,
        userId,
        token,
        direction,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to issue RTC token:", error);
    const message = error instanceof Error ? error.message : "RTC Token 签发失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
