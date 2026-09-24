/**
 * 轻量内存级速率限制器（滑动窗口）
 *
 * 适用于单实例部署。多实例部署需替换为 Redis 实现。
 * 基于标识符（IP / userId / API key）统计固定时间窗口内的请求次数。
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// 每 5 分钟清理一次过期条目，防止内存泄漏
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    // 最大窗口 1 小时，超过此时间的条目都可清理
    const MAX_WINDOW = 60 * 60 * 1000;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < MAX_WINDOW);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // 不阻塞进程退出
  if (typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetTime: number; // Unix 毫秒时间戳，表示窗口重置时间
}

/**
 * 检查并消耗一次速率限制配额
 *
 * @param identifier  唯一标识符（如 IP、userId、API key）
 * @param limit       窗口内最大请求次数
 * @param windowMs    时间窗口（毫秒）
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(identifier) ?? { timestamps: [] };

  // 清理窗口外的时间戳
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    store.set(identifier, entry);
    return {
      success: false,
      remaining: 0,
      limit,
      resetTime: oldest + windowMs,
    };
  }

  entry.timestamps.push(now);
  store.set(identifier, entry);

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    limit,
    resetTime: now + windowMs,
  };
}

/**
 * 从请求中提取客户端 IP（兼容 Next.js 部署在代理后的场景）
 */
export function getClientIp(request: Request): string {
  // XFF 第一段是客户端可自行伪造的值；取最后一跳（由最外层可信代理写入）
  // 单层反代（nginx/网关）部署形态下即真实客户端 IP
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  // 兜底：返回一个固定标识符（开发环境）
  return "unknown";
}

/**
 * 构建速率限制的 HTTP 响应头对象
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
}
