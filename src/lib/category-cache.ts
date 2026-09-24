import { prisma } from "@/lib/prisma"

/**
 * 分类树内存缓存
 * 避免每次题目列表请求都查询全部分类表
 * 创建/删除分类时需调用 invalidateCategoryCache() 清除
 */

let categoryCache: {
  allCategories: { id: string; parentId: string | null }[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

export async function getAllCategories(): Promise<
  { id: string; parentId: string | null }[]
> {
  const now = Date.now();
  if (categoryCache && now - categoryCache.timestamp < CACHE_TTL_MS) {
    return categoryCache.allCategories;
  }
  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  categoryCache = { allCategories, timestamp: now };
  return allCategories;
}

/** 清除分类缓存（创建/删除/修改分类后调用） */
export function invalidateCategoryCache(): void {
  categoryCache = null;
}
