import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    role: { findUnique: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

// next/headers 的 headers() 在路由处理器外不可用，mock 为返回无 Authorization 头
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map([["authorization", ""]])),
}));

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { requirePermission } from "../permission";

const mockRoleFindUnique = prisma.role.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockGetServerSession = getServerSession as unknown as ReturnType<typeof vi.fn>;

function roleWithPermissions(codes: string[]) {
  return {
    permissions: codes.map((code) => ({ permission: { code } })),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("requirePermission（RBAC 权限点校验）", () => {
  it("未登录返回 401", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await requirePermission("question:add");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("登录但角色缺少权限点返回 403", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "user-no-perm" } });
    mockRoleFindUnique.mockResolvedValue(roleWithPermissions(["question:view"]));
    const res = await requirePermission("question:add");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("具备权限点返回 null（放行）", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
    mockRoleFindUnique.mockResolvedValue(
      roleWithPermissions(["question:view", "question:add"])
    );
    const res = await requirePermission("question:add");
    expect(res).toBeNull();
  });

  it("角色不存在（无任何权限）返回 403", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "ghost" } });
    // ghost 角色查库返回 null
    mockRoleFindUnique.mockResolvedValue(null);
    const res = await requirePermission("question:add");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("同角色权限查询走 30s 内存缓存", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "user-cache" } });
    mockRoleFindUnique.mockResolvedValue(roleWithPermissions(["question:add"]));

    await requirePermission("question:add");
    await requirePermission("question:add");

    // 第二次命中缓存，不再查库
    expect(mockRoleFindUnique).toHaveBeenCalledTimes(1);
  });
});
