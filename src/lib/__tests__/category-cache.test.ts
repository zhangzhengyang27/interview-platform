import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAllCategories, invalidateCategoryCache } from "../category-cache";

const mockFindMany = prisma.category.findMany as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  invalidateCategoryCache();
  vi.clearAllMocks();
});

describe("getAllCategories（分类树缓存）", () => {
  it("首次调用查库并缓存", async () => {
    mockFindMany.mockResolvedValue([{ id: "a", parentId: null }]);
    const result = await getAllCategories();
    expect(result).toEqual([{ id: "a", parentId: null }]);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("TTL 内的后续调用命中缓存", async () => {
    mockFindMany.mockResolvedValue([{ id: "a", parentId: null }]);
    await getAllCategories();
    await getAllCategories();
    await getAllCategories();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("invalidate 后重新查库", async () => {
    mockFindMany.mockResolvedValue([{ id: "a", parentId: null }]);
    await getAllCategories();
    invalidateCategoryCache();
    await getAllCategories();
    expect(mockFindMany).toHaveBeenCalledTimes(2);
  });
});
