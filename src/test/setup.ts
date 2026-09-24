// Vitest 全局设置文件：在每个测试文件运行前加载
// 导入 jest-dom 的匹配器扩展，使得测试中可以使用诸如 toBeInTheDocument 等断言方法
import "@testing-library/jest-dom";

// prisma.ts 在模块加载时即创建连接池并要求 DATABASE_URL，
// 测试环境用占位连接串满足校验即可（纯函数测试不会真正连接数据库）
process.env.DATABASE_URL ??= "postgresql://vitest:vitest@localhost:5432/vitest";
