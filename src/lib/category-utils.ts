export interface FlatCategory {
  id: string;
  name: string;
  parentId?: string | null;
}

/**
 * 为扁平分类列表构建每个分类的显示标签。
 * 当存在重名分类时，使用「父级路径 > 名称」格式区分；否则直接用名称。
 * 返回一个 id → 显示标签 的映射。
 */
export function buildCategoryLabels(categories: FlatCategory[]): Record<string, string> {
  const byId = new Map<string, FlatCategory>();
  for (const c of categories) byId.set(c.id, c);

  // 统计重名
  const nameCount: Record<string, number> = {};
  for (const c of categories) {
    nameCount[c.name] = (nameCount[c.name] || 0) + 1;
  }

  const pathOf = (id: string): string[] => {
    const path: string[] = [];
    let cur = byId.get(id);
    let guard = 0;
    while (cur && guard++ < 6) {
      path.unshift(cur.name);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return path;
  };

  const labels: Record<string, string> = {};
  for (const c of categories) {
    if (nameCount[c.name] > 1) {
      labels[c.id] = pathOf(c.id).join(" > ");
    } else {
      labels[c.id] = c.name;
    }
  }
  return labels;
}
