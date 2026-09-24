import useSWR, { SWRConfiguration } from "swr";
import { request } from "@/lib/request";

// 通用 fetcher 函数：接入统一请求封装（统一错误处理 + 401 跳转登录）
export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  return (await request<T>(url, { method: "GET" })) as T;
};

// 默认 SWR 配置
export const defaultSWROptions: SWRConfiguration = {
  revalidateOnFocus: false, // 窗口获得焦点时不重新验证
  revalidateOnReconnect: true, // 网络恢复时重新验证
  dedupingInterval: 2000, // 2秒内去重
  errorRetryCount: 3, // 错误重试次数
};

// 导出 useSWR 供直接使用
export { useSWR };
