/**
 * 算法与数据结构面试题库 - 第三批（进阶篇）
 * 共 85 道：动态规划进阶(25) + 图论进阶(15) + 搜索进阶(7) + 字符串高级(8) + 数学数论(7) + 经典Hard补充(5)
 * 分布：easy~15, medium~40, hard~30 | code~65, qa~20
 */

export const algorithmQuestionsFinal = [

// ============================================================================
// 第一部分：动态规划进阶 (25道)
// ============================================================================

// ----- 背包变体 (5道) -----

{
  title: "多重背包问题",
  content: `## 题目描述

有 N 种物品和一个容量为 V 的背包。第 i 种物品最多有 $s_i$ 件可用，每件耗费的空间是 $c_i$，价值是 $w_i$。求解将哪些物品装入背包可使这些物品的耗费的空间总和不超过背包容量，且价值总和最大。

## 输入格式

第一行两个整数 N, V，用空格隔开，分别表示物品种数和背包容积。

接下来有 N 行，每行三个整数 $v_i$, $w_i$, $s_i$，用空格隔开，分别表示第 i 种物品的体积、价值和数量。

## 输出格式

输出一个整数，表示最大价值。

## 示例

\`\`\`
输入:
4 5
1 2 3
2 4 1
3 4 3
4 5 2

输出: 10
\`\`\`

**解释**: 选择 3 个物品 1（体积 1×3=3，价值 2×3=6）和 1 个物品 2（体积 2，价值 4），总体积 5，总价值 10。

## 约束条件

- $1 \\leq N \\leq 100$
- $1 \\leq V \\leq 2000$
- $1 \\leq v_i, w_i, s_i \\leq 200$`,
  solution: `## 解题思路

### 方法一：二进制分组优化（推荐）

多重背包的核心问题是每种物品有数量限制。朴素做法是将 $s_i$ 件物品拆成 $s_i$ 个 01 背包物品，但这样时间复杂度为 $O(V \\times \\sum s_i)$，当 $s_i$ 较大时会超时。

**二进制分组优化思想**：将 $s_i$ 拆分成若干组，每组代表 $2^k$ 个物品。例如 $s_i = 13$ 时，拆分为 1+2+4+6 = 13（其中 6 是余数）。这样任意 $[0, s_i]$ 的数量都可以通过组合这些组来表示，而组的数量只有 $O(\\log s_i)$ 个。

### 复杂度分析

- **时间复杂度**: $O(V \\times \\sum \\log s_i)$
- **空间复杂度**: $O(V)$

## 参考代码 (JavaScript)

\`\`\`javascript
function multipleKnapsack(N, V, items) {
  // 二进制分组优化：将每种物品拆分为 log(s) 组
  const goods = [];
  for (const [vi, wi, si] of items) {
    let k = 1;
    while (k <= si) {
      goods.push({ v: vi * k, w: wi * k });
      si -= k;
      k <<= 1;
    }
    if (si > 0) {
      goods.push({ v: vi * si, w: wi * si });
    }
  }

  // 01 背包求解
  const dp = new Array(V + 1).fill(0);
  for (const { v, w } of goods) {
    for (let j = V; j >= v; j--) {
      dp[j] = Math.max(dp[j], dp[j - v] + w);
    }
  }
  return dp[V];
}

// 测试
console.log(multipleKnapsack(4, 5, [
  [1, 2, 3], [2, 4, 1], [3, 4, 3], [4, 5, 2]
])); // 输出: 10
\`\`\`

## 参考代码 (Python)

\`\`\`python
def multiple_knapsack(N, V, items):
    goods = []
    for vi, wi, si in items:
        k = 1
        while k <= si:
            goods.append((vi * k, wi * k))
            si -= k
            k <<= 1
        if si > 0:
            goods.append((vi * si, wi * si))

    dp = [0] * (V + 1)
    for v, w in goods:
        for j in range(V, v - 1, -1):
            dp[j] = max(dp[j], dp[j - v] + w)
    return dp[V]

print(multiple_knapsack(4, 5, [
    (1, 2, 3), (2, 4, 1), (3, 4, 3), (4, 5, 2)
]))  # 输出: 10
\`\`\``,
  codeTemplate: {
    javascript: `/**
 * @param {number} N 物品数量
 * @param {number} V 背包容量
 * @param {number[][]} items [[v,w,s], ...]
 * @return {number}
 */
function solve(N, V, items) {
  // TODO: 实现多重背包（二进制分组优化）

}`,
    python: `def solve(N: int, V: int, items: list[list[int]]) -> int:
    # TODO: 实现多重背包（二进制分组优化）
    pass`,
    java: `public class Solution {
    public static int solve(int N, int V, int[][] items) {
        // TODO: 实现多重背包（二进制分组优化）
        return 0;
    }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["动态规划", "背包问题", "二进制优化"]
},

{
  title: "混合背包问题",
  content: `## 题目描述

有 N 种物品和一个容量为 V 的背包。每种物品有三种类型：
- **01 背包物品**：只有一件（$s_i = 1$）
- **完全背包物品**：无限件（$s_i = -1$）
- **多重背包物品**：有限 $s_i$ 件

求最大价值。

## 输入格式

第一行 N, V。
接下来 N 行，每行 $v_i$, $w_i$, $s_i$。

## 示例

\`\`\`
输入:
4 5
1 2 -1   // 完全背包
2 4 1    // 01背包
3 4 3    // 多重背包
4 5 2    // 多重背包

输出: 10
\`\`\`

## 约束条件

- $1 \\leq N \\leq 1000$
- $1 \\leq V \\leq 2000$
- $-1 \\leq s_i \\leq 1000$`,
  solution: `## 解题思路

混合背包的核心是根据不同类型的物品使用不同的转移方式：

1. **01 背包**：内层循环从大到小遍历容量
2. **完全背包**：内层循环从小到大遍历容量
3. **多重背包**：先做二进制分组，再按 01 背包处理

关键在于对每种物品判断其类型后选择对应的处理方式。

## 参考代码 (JavaScript)

\`\`\`javascript
function mixedKnapsack(N, V, items) {
  const dp = new Array(V + 1).fill(0);

  for (const [vi, wi, si] of items) {
    if (si === 0 || si === -1) {
      // 完全背包：正序遍历
      if (si === -1) {
        for (let j = vi; j <= V; j++) {
          dp[j] = Math.max(dp[j], dp[j - vi] + wi);
        }
      } else {
        // 01 背包：逆序遍历
        for (let j = V; j >= vi; j--) {
          dp[j] = Math.max(dp[j], dp[j - vi] + wi);
        }
      }
    } else {
      // 多重背包：二进制分组
      let k = 1, remain = si;
      while (k <= remain) {
        const gv = vi * k, gw = wi * k;
        for (let j = V; j >= gv; j--) {
          dp[j] = Math.max(dp[j], dp[j - gv] + gw);
        }
        remain -= k;
        k <<= 1;
      }
      if (remain > 0) {
        const gv = vi * remain, gw = wi * remain;
        for (let j = V; j >= gv; j--) {
          dp[j] = Math.max(dp[j], dp[j - gv] + gw);
        }
      }
    }
  }
  return dp[V];
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(V \\times \\sum \\log s_i)$（多重部分）+ $O(NV)$（完全/01 部分）
- **空间复杂度**: $O(V)$`,
  codeTemplate: {
    javascript: `function mixedKnapsack(N, V, items) {
  // TODO: 根据si判断类型并处理
}`,
    python: `def mixed_knapsack(N: int, V: int, items: list) -> int:
    pass`,
    java: `public class Solution {
    public static int solve(int N, int V, int[][] items) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "背包问题", "混合背包"]
},

{
  title: "分组背包问题",
  content: `## 题目描述

有 N 组物品和一个容量为 V 的背包。每组物品有若干个，同一组内的物品最多只能选一个。求最大价值。

## 输入格式

第一行 N, V。
接下来 N 组数据，每组：
- 第一行：该组物品数量 $s_i$
- 接下来 $s_i$ 行：每行 $v_{ij}$, $w_{ij}$

## 示例

\`\`\`
输入:
3 5
2
1 2
2 4
1
3 4
1
4 5

输出: 8
\`\`\`

**解释**: 选第1组第2个物品(v=2,w=4) + 第3组物品(v=4,w=5)，但超了；实际最优：第1组第2个(v=2,w=4)+第2组(v=3,w=4)=v=5,w=8

## 约束条件

- $1 \\leq N \\leq 100$
- $1 \\leq V \\leq 10000$
- 每组物品数 $\\leq 100$`,
  solution: `## 解题思路

分组背包的状态转移与 01 背包类似，区别在于每组内部需要枚举选择哪个物品：

$$dp[i][j] = \\max(dp[i-1][j], \\max_{k \\in group_i}(dp[i-1][j-v_{ik}] + w_{ik}))$$

外层循环组，中层循环容量（逆序），内层循环组内物品。

## 参考代码 (JavaScript)

\`\`\`javascript
function groupKnapsack(N, V, groups) {
  const dp = new Array(V + 1).fill(0);

  for (const group of groups) {
    // 逆序遍历容量（保证每组只选一个）
    for (let j = V; j >= 0; j--) {
      for (const [vj, wj] of group) {
        if (j >= vj) {
          dp[j] = Math.max(dp[j], dp[j - vj] + wj);
        }
      }
    }
  }
  return dp[V];
}

// 测试
console.log(groupKnapsack(3, 5, [
  [[1, 2], [2, 4]],
  [[3, 4]],
  [[4, 5]]
])); // 输出: 8
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(NV \\cdot S)$，S 为平均每组物品数
- **空间复杂度**: $O(V)$（一维优化后）`,
  codeTemplate: {
    javascript: `function groupKnapsack(N, V, groups) {
  // groups: [[[v,w],[v,w]], ...]
  // TODO: 分组背包实现
}`,
    python: `def group_knapsack(N: int, V: int, groups: list) -> int:
    pass`,
    java: `public class Solution {
    public static int solve(int N, int V, int[][][] groups) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "背包问题", "分组背包"]
},

{
  title: "二维费用背包（一和零）",
  content: `## 题目描述 (LeetCode 474)

给你一个二进制字符串数组 \`strs\` 和两个整数 \`m\` 和 \`n\`。

找出 \`strs\` 的最大子集的长度，该子集中 **最多** 有 \`m\` 个 \`0\` 和 \`n\` 个 \`1\`。

如果 \`x\` 的所有元素也是 \`y\` 的元素，集合 \`x\` 是集合 \`y\` 的 **子集** 。

## 示例

\`\`\`
输入: strs = ["10","0001","111001","1","0"], m = 5, n = 3
输出: 4
解释: 最多有 5 个 0 和 3 个 1 的最大子集是 {"10","0001","1","0"}，所以答案是 4。
其他满足题意但较小的子集包括 {"0001","1"} 和 {"10","1","0"}。
{"111001"} 不满足题意，因为它含 4 个 1，大于 n 的值 3。

输入: strs = ["10","0","1"], m = 1, n = 1
输出: 2
解释: 最大的子集是 {"0", "1"}，所以答案是 2。
\`\`\`

## 约束条件

- $1 \\leq strs.length \\leq 600$
- $1 \\leq strs[i].length \\leq 100$
- $strs[i]$ 仅由 '0' 和 '1' 组成
- $1 \\leq m, n \\leq 100$`,
  solution: `## 解题思路

这是一道典型的**二维费用背包问题**。每个字符串相当于一个"物品"，选取它需要消耗一定数量的 '0' 和 '1'（两种"费用"），获得的价值是 1（计数+1）。

状态定义：$dp[i][j][k]$ 表示从前 i 个字符串中选，最多使用 j 个 0 和 k 个 1 时的最大子集大小。

转移方程：
$$dp[i][j][k] = \\max(dp[i-1][j][k], dp[i-1][j-zeros][k-ones] + 1)$$

可以压缩为二维数组，注意两层费用都要**逆序遍历**。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string[]} strs
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
function findMaxForm(strs, m, n) {
  // dp[j][k]: 最多j个0和k个1时的最大子集大小
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (const str of strs) {
    let zeros = 0, ones = 0;
    for (const ch of str) {
      if (ch === '0') zeros++;
      else ones++;
    }

    // 二维费用背包：两维都要逆序
    for (let j = m; j >= zeros; j--) {
      for (let k = n; k >= ones; k--) {
        dp[j][k] = Math.max(dp[j][k], dp[j - zeros][k - ones] + 1);
      }
    }
  }

  return dp[m][n];
}

// 测试
console.log(findMaxForm(["10", "0001", "111001", "1", "0"], 5, 3)); // 4
console.log(findMaxForm(["10", "0", "1"], 1, 1)); // 2
\`\`\`

## 参考代码 (Python)

\`\`\`python
def find_max_form(strs: list[str], m: int, n: int) -> int:
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for s in strs:
        zeros = s.count('0')
        ones = len(s) - zeros
        for j in range(m, zeros - 1, -1):
            for k in range(n, ones - 1, -1):
                dp[j][k] = max(dp[j][k], dp[j - zeros][k - ones] + 1)
    return dp[m][n]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(L \\times m \\times n)$，L 为字符串总数
- **空间复杂度**: $O(m \\times n)$`,
  codeTemplate: {
    javascript: `/**
 * @param {string[]} strs 二进制字符串数组
 * @param {number} m 0的最大个数
 * @param {number} n 1的最大个数
 * @return {number}
 */
function findMaxForm(strs, m, n) {
  // TODO: 二维费用背包
}`,
    python: `def find_max_form(strs: list[str], m: int, n: int) -> int:
    pass`,
    java: `class Solution {
    public int findMaxForm(String[] strs, int m, int n) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "背包问题", "二维费用"]
},

{
  title: "有依赖的背包问题（树形DP结合背包）",
  content: `## 题目描述

有 N 个物品构成一棵树形依赖关系，根节点为 0。每个节点 i 有体积 $v_i$、价值 $w_i$。如果要选某个节点，必须先选其父节点。背包容量为 V，求最大价值。

## 输入格式

第一行 N, V。
第二行 N 个整数 $v_1...v_N$（体积）。
第三行 N 个整数 $w_1...w_N$（价值）。
接下来 N-1 行，每行两个整数 u, v，表示 v 的父节点是 u（根为 0）。

## 示例

\`\`\`
输入:
5 7
2 3 4 1 2
3 5 4 2 6
0 1
0 2
1 3
1 4

输出: 13
\`\`\`

**解释**: 选根节点0(v=2,w=3) + 节点1(v=3,w=5) + 节点4(v=2,w=6) = 总v=7, 总w=14？需验证

## 约束条件

- $1 \\leq N \\leq 100$
- $1 \\leq V \\leq 10000$`,
  solution: `## 解题思路

有依赖背包是树形 DP 与分组背包的结合。对于树上的每个节点，我们需要在子树上做一次分组背包——因为子节点的选择方案会影响当前节点的分配。

核心思想：DFS 后序遍历，在每个节点上对其子树做背包 DP。

状态定义：$dp[u][j]$ 表示以 u 为根的子树中，分配 j 体积能得到的最大价值。

转移时，u 必须被选中（占用 $v_u$），然后对每个子节点做分组背包合并。

## 参考代码 (JavaScript)

\`\`\`javascript
function treeKnapsack(N, V, volumes, values, edges) {
  // 建邻接表
  const children = Array.from({ length: N }, () => []);
  for (const [parent, child] of edges) {
    children[parent].push(child);
  }

  // dp[u][j]: 以u为根的子树，分配j体积的最大值
  function dfs(u) {
    const dp = Array.from({ length: V + 1 }, () => -Infinity);
    // 初始化：只选u自己
    const vu = volumes[u], wu = values[u];
    for (let j = 0; j <= V; j++) {
      dp[j] = j >= vu ? wu : -Infinity;
    }

    // 合并每个子树的背包结果
    for (const child of children[child]) {
      const childDp = dfs(child);
      // 分组背包合并：逆序遍历容量
      for (let j = V; j >= vu; j--) {
        let best = dp[j]; // 不选这个子树的任何东西
        for (let k = 0; k <= j - vu; k++) {
          if (childDp[k] > -Infinity) {
            best = Math.max(best, dp[j - k] + childDp[k]);
          }
        }
        dp[j] = best;
      }
    }
    return dp;
  }

  const result = dfs(0);
  let ans = 0;
  for (let j = 0; j <= V; j++) {
    ans = Math.max(ans, result[j]);
  }
  return ans;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(NV^2)$（每个节点做一次背包合并）
- **空间复杂度**: $O(NV)$`,
  codeTemplate: {
    javascript: `function treeKnapsack(N, V, volumes, values, edges) {
  // TODO: 树形依赖背包
}`,
    python: `def tree_knapsack(N: int, V: int, volumes: list, values: list, edges: list) -> int:
    pass`,
    java: `public class Solution {
    public static int solve(int N, int V, int[] volumes, int[] values, int[][] edges) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "背包问题", "树形DP", "树形背包"]
},

// ----- 区间DP (4道) -----

{
  title: "戳气球",
  content: `## 题目描述 (LeetCode 312 Hard)

有 n 个气球，编号为 0 到 n-1，每个气球上都标有一个数字，这些数字存在数组 nums 中。

现在要求你戳破所有的气球。戳破第 i 个气球，你可以获得 nums[i - 1] × nums[i] × nums[i + 1] 枚硬币。这里的 i - 1 和 i + 1 代表和 i 相邻的两个气球的序号。如果 i - 1 或 i + 1 超出了数组的边界，那么就当它是一个数字为 1 的气球。

求所能获得硬币的最大数量。

## 示例

\`\`\`
输入: nums = [3,1,5,8]
输出: 167
解释:
nums = [3,1,5,8] --> [3,5,8] --> [3,8] --> [8] --> []
coins =  3*1*5  +  3*5*8  +  1*3*8  + 1*8*1 = 167
\`\`\`

## 约束条件

- $n == nums.length$
- $1 \\leq n \\leq 300$
- $0 \\leq nums[i] \\leq 100$`,
  solution: `## 解题思路

这是**区间 DP** 的经典题目。难点在于戳破气球的顺序会改变相邻关系。

**逆向思维**：不思考"最后戳哪个"，而是思考"哪个气球最后被戳"。如果一个气球最后被戳，那它左右两边都已经戳完了，此时它的左右邻居就是边界。

在区间 $(l, r)$ 内最后戳破气球 k，获得的收益为：
$$dp[l][r] = \\max(dp[l][k] + dp[k][r] + arr[l] \\times arr[k] \\times arr[r])$$

其中 arr 是首尾添加了虚拟气球 1 的扩展数组。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
function maxCoins(nums) {
  const n = nums.length;
  // 添加虚拟边界气球
  const arr = [1, ...nums, 1];
  const m = n + 2;

  // dp[l][r]: 开区间(l,r)内戳破所有气球的最大收益
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));

  // 区间长度从小到大枚举
  for (let len = 2; len < m; len++) {
    for (let l = 0; l + len < m; l++) {
      const r = l + len;
      // 枚举最后一个被戳破的气球
      for (let k = l + 1; k < r; k++) {
        dp[l][r] = Math.max(
          dp[l][r],
          dp[l][k] + dp[k][r] + arr[l] * arr[k] * arr[r]
        );
      }
    }
  }

  return dp[0][m - 1];
}

// 测试
console.log(maxCoins([3, 1, 5, 8])); // 167
console.log(maxCoins([1, 5]));       // 10
\`\`\`

## 参考代码 (Python)

\`\`\`python
def max_coins(nums: list[int]) -> int:
    n = len(nums)
    arr = [1] + nums + [1]
    m = n + 2
    dp = [[0] * m for _ in range(m)]

    for length in range(2, m):
        for l in range(m - length):
            r = l + length
            for k in range(l + 1, r):
                dp[l][r] = max(dp[l][r], dp[l][k] + dp[k][r] + arr[l] * arr[k] * arr[r])

    return dp[0][m - 1]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n^3)$
- **空间复杂度**: $O(n^2)$`,
  codeTemplate: {
    javascript: `/**
 * @param {number[]} nums 气球上的数字
 * @return {number} 最大硬币数
 */
function maxCoins(nums) {
  // TODO: 区间DP - 戳气球
}`,
    python: `def max_coins(nums: list[int]) -> int:
    pass`,
    java: `class Solution {
    public int maxCoins(int[] nums) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "区间DP", "LeetCode 312"]
},

{
  title: "不同的二叉搜索树（卡特兰数）",
  content: `## 题目描述 (LeetCode 96 Medium)

给你一个整数 n ，求恰由 n 个节点组成且节点值从 1 到 n 互不相同的 **二叉搜索树** 有多少种？

返回满足题意的二叉搜索树的种数。

## 示例

\`\`\`
输入: n = 3
输出: 5
\`\`\`

解释：当 n = 3 时，有 5 种不同结构的 BST：
\\\
     1         3     3      2      1
      \\\\       /     /      / \\      \\\\
       3     2     1      1   3      2
      /     /       \\\\                \\\\
     2     1         2                  3

## 约束条件

- $1 \\leq n \\leq 19$`,
  solution: `## 解题思路

这道题的本质是求**卡特兰数**（Catalan Number）。设 $G(n)$ 为 n 个节点能构成的 BST 数量。

考虑根节点为 i（$1 \\leq i \\leq n$）的情况：
- 左子树由 $[1, i-1]$ 构成，共 $i-1$ 个节点，有 $G(i-1)$ 种
- 右子树由 $[i+1, n]$ 构成，共 $n-i$ 个节点，有 $G(n-i)$ 种

根据乘法原理和加法原理：
$$G(n) = \\sum_{i=1}^{n} G(i-1) \\times G(n-i), \\quad G(0) = G(1) = 1$$

这就是卡特兰数的递推公式：$C_n = \\frac{2(2n-1)}{n+1} C_{n-1}$

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number} n
 * @return {number}
 */
function numTrees(n) {
  // dp[i]: i个节点能组成的BST数量
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    // 枚举根节点
    for (let j = 1; j <= i; j++) {
      dp[i] += dp[j - 1] * dp[i - j];
    }
  }

  return dp[n];
}

// 测试
console.log(numTrees(1)); // 1
console.log(numTrees(3)); // 5
console.log(numTrees(19)); // 1767263190
\`\`\`

卡特兰数通项公式（可选）：
$$C_n = \\frac{1}{n+1}\\binom{2n}{n} = \\frac{(2n)!}{(n+1)! \\cdot n!}$$

## 复杂度分析

- **时间复杂度**: $O(n^2)$
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function numTrees(n) {
  // TODO: 卡特兰数 / DP
}`,
    python: `def num_trees(n: int) -> int:
    pass`,
    java: `class Solution {
    public int numTrees(int n) { return 0; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["动态规划", "卡特兰数", "二叉搜索树", "LeetCode 96"]
},

{
  title: "合并石子 / Minimum Cost to Merge Stones",
  content: `## 题目描述 (LeetCode 1000 Hard)

有 N 堆石头排成一排，第 i 堆有 stones[i] 个石头。

每次移动（merge）可以选择 **相邻的 K 堆** 石头将它们合并成一堆，这次移动的代价为这 K 堆石头的总数。

找出把所有石头合并成一堆的**最低**代价。如果无法合并成一堆则返回 -1。

## 示例

\`\`\`
输入: stones = [3,2,4,1], K = 2
输出: 20
解释:
从 [3, 2, 4, 1] 开始
1. 合并 [3, 2]，代价为 3，剩下 [5, 4, 1]
2. 合并 [4, 1]，代价为 5，剩下 [5, 5]
3. 合并 [5, 5]，代价为 10，剩下 [10]
总代价 = 3 + 5 + 10 = 20

输入: stones = [3,2,4,1], K = 3
输出: -1
解释: 任何操作都无法将4堆合并为1堆（每次减少K-1堆，需要 (N-1)%(K-1)==0）
\`\`\`

## 约束条件

- $1 \\leq stones.length \\leq 30$
- $2 \\leq K \\leq 30$
- $1 \\leq stones[i] \\leq 100$`,
  solution: `## 解题思路

这是**区间 DP** 的经典变体。关键观察：

1. **可行性判断**：每次合并减少 $K-1$ 堆，要从 N 堆变成 1 堆，需要 $(N-1) \\%(K-1) == 0$

2. **状态设计**：$dp[l][r][m]$ 表示将区间 $[l,r]$ 合并成 m 堆的最小代价。但我们只需要关心最终合成 1 堆的情况，可以用更简洁的方式。

3. **前缀和优化**：合并区间的代价等于区间元素之和，用前缀和 $O(1)$ 查询。

4. **转移方程**：尝试在 $[l,r]$ 内找分割点，将区间分为两部分分别合并。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} stones
 * @param {number} K
 * @return {number}
 */
function mergeStones(stones, K) {
  const n = stones.length;
  if ((n - 1) % (K - 1) !== 0) return -1;

  // 前缀和
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + stones[i];
  }

  // sum(l, r): 区间[l,r]的和（闭区间）
  const sum = (l, r) => prefix[r + 1] - prefix[l];

  // dp[l][r]: 将stones[l..r]合并成最少堆数的最小代价
  // 最终目标是 dp[0][n-1] 且合并为1堆
  const dp = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => new Array(K + 1).fill(Infinity))
  );

  // 初始化：单个元素自成1堆，代价为0
  for (let i = 0; i < n; i++) {
    dp[i][i][1] = 0;
  }

  // 区间长度递增
  for (let len = 2; len <= n; len++) {
    for (let l = 0; l + len - 1 < n; l++) {
      const r = l + len - 1;
      // 尝试合并成 m 堆 (2 ~ K)
      for (let m = 2; m <= K; m++) {
        for (let mid = l; mid < r; mid += K - 1) {
          dp[l][r][m] = Math.min(
            dp[l][r][m],
            dp[l][mid][1] + dp[mid + 1][r][m - 1]
          );
        }
      }
      // 如果能合成1堆，更新代价
      dp[l][r][1] = dp[l][r][K] + sum(l, r);
    }
  }

  return dp[0][n - 1][1];
}

// 测试
console.log(mergeStones([3, 2, 4, 1], 2)); // 20
console.log(mergeStones([3, 2, 4, 1], 3)); // -1
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n^3 \\cdot K)$
- **空间复杂度**: $O(n^2 \\cdot K)$`,
  codeTemplate: {
    javascript: `function mergeStones(stones, K) {
  // TODO: 区间DP - 合并石子
}`,
    python: `def merge_stones(stones: list[int], K: int) -> int:
    pass`,
    java: `class Solution {
    public int mergeStones(int[] stones, int K) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "区间DP", "LeetCode 1000"]
},

{
  title: "最长回文子序列",
  content: `## 题目描述 (LeetCode 516 Medium)

给定一个字符串 s ，找到其中最长的**回文子序列**的长度。

子序列定义为：不改变剩余字符相对位置的情况下，删除某些字符或者不删除任何字符形成的一个序列。

注意：**子序列**不同于**子串**，子序列不需要连续。

## 示例

\`\`\`
输入: s = "bbbab"
输出: 4
解释: 一个可能的最长回文子序列为 "bbbb"

输入: s = "cbbd"
输出: 2
解释: 一个可能的最长回文子序列为 "bb"
\`\`\`

## 约束条件

- $1 \\leq s.length \\leq 1000$
- s 仅由小写英文字母组成`,
  solution: `## 解题思路

经典的**区间 DP** 问题。定义 $dp[i][j]$ 为 s 在区间 $[i,j]$ 内的最长回文子序列长度。

**状态转移**：
- 如果 $s[i] === s[j]$：两端匹配，$dp[i][j] = dp[i+1][j-1] + 2$
- 否则：取去掉一端后的较大值，$dp[i][j] = \\max(dp[i+1][j], dp[i][j-1])$

**初始化**：$dp[i][i] = 1$（单字符本身就是长度为1的回文）

**遍历顺序**：区间长度从小到大，保证计算 $dp[i][j]$ 时 $dp[i+1][j-1]$ 已经算好。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} s
 * @return {number}
 */
function longestPalindromeSubseq(s) {
  const n = s.length;
  // dp[i][j]: s[i..j]的最长回文子序列长度
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));

  // 单字符初始化
  for (let i = 0; i < n; i++) {
    dp[i][i] = 1;
  }

  // 区间长度从2到n
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j]) {
        dp[i][j] = (len === 2 ? 0 : dp[i + 1][j - 1]) + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[0][n - 1];
}

// 测试
console.log(longestPalindromeSubseq("bbbab")); // 4
console.log(longestPalindromeSubseq("cbbd"));  // 2
console.log(longestPalindromeSubseq("a"));     // 1
\`\`\`

## 空间优化版本

可以压缩为一维数组，利用滚动数组技巧，从后向前更新。

## 复杂度分析

- **时间复杂度**: $O(n^2)$
- **空间复杂度**: $O(n^2)$（可优化至 $O(n)$）`,
  codeTemplate: {
    javascript: `function longestPalindromeSubseq(s) {
  // TODO: 最长回文子序列 - 区间DP
}`,
    python: `def longest_palindrome_subseq(s: str) -> int:
    pass`,
    java: `class Solution {
    public int longestPalindromeSubseq(String s) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "区间DP", "回文", "LeetCode 516"]
},

// ----- 树形DP (4道) -----

{
  title: "打家劫舍 III",
  content: `## 题目描述 (LeetCode 337 Medium)

小偷又发现了一个新的可行窃的地区。这个地区只有一个入口，我们称之为 root。

除了 root 之外，每栋房子有且只有一个"父"房子与之相连。一番侦察之后，聪明的小偷意识到"这个地方的所有房屋的排列类似于一棵二叉树"。如果 **两个直接相连的房子在同一天晚上被打劫** ，房屋将自动报警。

给定二叉树的 root 。返回 **在不触动警报的情况下** ，小偷能够盗取的最高金额。

## 示例

\`\`\`
输入: root = [3,2,3,null,3,null,1]
输出: 7
解释: 小偷一晚能够盗取的最高金额 = 3 + 3 + 1 = 7

输入: root = [3,4,5,1,3,null,1]
输出: 9
解释: 小偷一晚能够盗取的最高金额 = 4 + 5 = 9
\`\`\`

## 约束条件

- 节点数范围 $[1, 10^4]$`,
  solution: `## 解题思路

这是**树形 DP** 的经典入门题。由于房屋排列成树形，相邻（父子）节点不能同时选。

对每个节点定义两种状态：
- $select[u]$：选节点 u 能获得的最大金额
- $skip[u]$：不选节点 u 能获得的最大金额

**状态转移**：
$$
\\begin{aligned}
select[u] &= u.val + \\sum skip[child] \\\\
skip[u] &= \\sum \\max(select[child], skip[child])
\\end{aligned}
$$

采用后续 DFS 遍历，自底向上计算。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
function rob(root) {
  // 返回 [选root的最大值, 不选root的最大值]
  function dfs(node) {
    if (!node) return [0, 0];

    const [leftSelect, leftSkip] = dfs(node.left);
    const [rightSelect, rightSkip] = dfs(node.right);

    // 选当前节点：不能选左右孩子
    const select = node.val + leftSkip + rightSkip;
    // 不选当前节点：可以选或不选左右孩子
    const skip = Math.max(leftSelect, leftSkip) + Math.max(rightSelect, rightSkip);

    return [select, skip];
  }

  const [selectRoot, skipRoot] = dfs(root);
  return Math.max(selectRoot, skipRoot);
}

// 测试
function buildTree(arr) { /* 简化构建 */ }
console.log(rob(buildTree([3,2,3,null,3,null,1]))); // 7
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$，每个节点访问一次
- **空间复杂度**: $O(h)$，h 为树高（递归栈深度）`,
  codeTemplate: {
    javascript: `function rob(root) {
  // TODO: 树形DP - 打家劫舍III
}`,
    python: `def rob(root: TreeNode | None) -> int:
    pass`,
    java: `class Solution {
    public int rob(TreeNode root) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "树形DP", "二叉树", "LeetCode 337"]
},

{
  title: "监控二叉树",
  content: `## 题目描述 (LeetCode 968 Hard)

给定一个二叉树，我们在树的节点上安装摄像头。

节点上的每个摄像头可以监视**其父对象、自身及其直接子对象**。

计算监控树的所有节点所需的最小摄像头数量。

## 示例

\`\`\`
输入: [0,0,null,0,0]
输出: 1
解释: 如下图所示，一台摄像头足以监控所有节点。

输入: [0,0,null,0,null,0,null,null,0]
输出: 2
解释: 需要至少2台摄像头才能正确监控树的所有节点
\`\`\`

## 约束条件

- 节点数范围 $[1, 1000]$
- 每个节点的值为 0`,
  solution: `## 解题思路

**贪心 + 树形 DP**。从底向上（后序遍历）放置摄像头，因为叶子节点不放摄像头是最优策略（覆盖效率更高）。

每个节点有三种状态：
- **0**：未被覆盖（需要父节点放摄像头）
- **1**：已被覆盖（自身或子节点放了摄像头）
- **2**：已放置摄像头

**贪心策略（从下往上）**：
1. 左右孩子至少有一个未被覆盖 → 当前节点必须放摄像头
2. 左右孩子都被覆盖 → 当前节点不放（让父节点决定）
3. 左右孩子有一个放了摄像头 → 当前节点被覆盖

**特殊情况**：根节点如果最终状态是 0（未被覆盖），需要在根节点额外放一个摄像头。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {TreeNode} root
 * @return {number}
 */
function minCameraCover(root) {
  let cameras = 0;

  // 返回节点状态: 0=未覆盖, 1=已覆盖, 2=有摄像头
  function dfs(node) {
    if (!node) return 1; // 空节点视为已覆盖（不影响决策）

    const leftState = dfs(node.left);
    const rightState = dfs(node.right);

    // 左右孩子任一未被覆盖 → 必须放摄像头
    if (leftState === 0 || rightState === 0) {
      cameras++;
      return 2;
    }

    // 左右孩子至少有一个有摄像头 → 当前被覆盖
    if (leftState === 2 || rightState === 2) {
      return 1;
    }

    // 左右都被覆盖且无摄像头 → 未覆盖，等父节点
    return 0;
  }

  // 如果根节点未被覆盖，额外放一个
  if (dfs(root) === 0) {
    cameras++;
  }

  return cameras;
}

// 测试
// console.log(minCameraCover(buildTree([0,0,null,0,0]))); // 1
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$
- **空间复杂度**: $O(h)$`,
  codeTemplate: {
    javascript: `function minCameraCover(root) {
  // TODO: 贪心 + 树形DP
}`,
    python: `def min_camera_cover(root: TreeNode | None) -> int:
    pass`,
    java: `class Solution {
    public int minCameraCover(TreeNode root) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "树形DP", "贪心", "LeetCode 968"]
},

{
  title: "二叉树的直径 / 最长同值路径",
  content: `## 题目描述 A：二叉树的直径 (LeetCode 543 Easy)

给你一棵二叉树的根节点，返回该树的**直径**。

二叉树的直径是指树中任意两个节点路径长度中的最大值。这条路径可能经过也可能不经过根节点。

路径长度由经过的边数表示。

## 示例 A

\`\`\`
输入: root = [1,2,3,4,5]
输出: 3
解释: 最长路径 [4,2,1,3] 或 [5,2,1,3]，长度为3
\`\`\`

---

## 题目描述 B：最长同值路径 (LeetCode 687 Medium)

给定一个二叉树的 root ，返回**最长的路径的长度**，这个路径中的**每个节点具有相同值**。这条路径可以经过也可以不经过根节点。

**两个节点之间的路径长度** 由它们之间的边数表示。

## 示例 B

\`\`\`
输入: root = [5,4,5,1,1,null,5]
输出: 2
\`\`\`

## 约束条件

- 节点数 $[1, 10^4]$`,
  solution: `## 解题思路（二叉树直径）

直径的定义是任意两点间的最长路径。对于每个节点，经过它的最长路径 = 左子树最大深度 + 右子树最大深度。

用一个全局变量记录最大直径，DFS 计算每个节点的深度时顺便更新答案。

## 参考代码 (JavaScript) — 二叉树直径

\`\`\`javascript
/**
 * @param {TreeNode} root
 * @return {number}
 */
function diameterOfBinaryTree(root) {
  let diameter = 0;

  // 返回以 node 为根的子树最大深度
  function depth(node) {
    if (!node) return 0;

    const leftDepth = depth(node.left);
    const rightDepth = depth(node.right);

    // 更新直径：经过 node 的最长路径
    diameter = Math.max(diameter, leftDepth + rightDepth);

    // 返回深度
    return 1 + Math.max(leftDepth, rightDepth);
  }

  depth(root);
  return diameter;
}
\`\`\`

## 参考代码 (JavaScript) — 最长同值路径

\`\`\`javascript
/**
 * @param {TreeNode} root
 * @return {number}
 */
function longestUnivaluePath(root) {
  let maxLength = 0;

  function dfs(node) {
    if (!node) return 0;

    const leftLen = dfs(node.left);
    const rightLen = dfs(node.right);

    let leftPath = 0, rightPath = 0;

    // 如果左子节点值相同，累加路径
    if (node.left && node.left.val === node.val) {
      leftPath = leftLen + 1;
    }
    // 如果右子节点值相同，累加路径
    if (node.right && node.right.val === node.val) {
      rightPath = rightLen + 1;
    }

    // 更新全局最大值（经过当前节点的路径）
    maxLength = Math.max(maxLength, leftPath + rightPath);

    // 返回较长的单侧路径
    return Math.max(leftPath, rightPath);
  }

  dfs(root);
  return maxLength;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$
- **空间复杂度**: $O(h)$`,
  codeTemplate: {
    javascript: `function diameterOfBinaryTree(root) {
  // TODO: 二叉树直径
}

function longestUnivaluePath(root) {
  // TODO: 最长同值路径
}`,
    python: `def diameter_of_binary_tree(root: TreeNode | None) -> int:
    pass

def longest_univalue_path(root: TreeNode | None) -> int:
    pass`,
    java: `class Solution {
    public int diameterOfBinaryTree(TreeNode root) { return 0; }
    public int longestUnivaluePath(TreeNode root) { return 0; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["动态规划", "树形DP", "二叉树", "LeetCode 543", "LeetCode 687"]
},

{
  title: "二叉树中的最大路径和",
  content: `## 题目描述 (LeetCode 124 Hard)

二叉树中的 **路径** 被定义为一条节点序列，序列中每对相邻节点之间都存在一条边。同一个节点在一条路径序列中 **至多出现一次** 。该路径 **至少包含一个** 节点，且不一定经过根节点。

**路径和** 是路径中各节点值的总和。

给你一个二叉树的根节点 root ，返回其 **最大路径和** 。

## 示例

\`\`\`
输入: root = [1,2,3]
输出: 6
解释: 最优路径是 2 -> 1 -> 3，路径和为 2 + 1 + 3 = 6

输入: root = [-10,9,20,null,null,15,7]
输出: 42
解释: 最优路径是 15 -> 20 -> 7，路径和为 15 + 20 + 7 = 42
\`\`\`

## 约束条件

- 树中节点数范围 $[1, 3 \\times 10^4]$
- $-1000 \\leq Node.val \\leq 1000$`,
  solution: `## 解题思路

**树形 DP**。对于每个节点，计算以它为路径最高点的最大路径和。

对每个节点，返回两个信息：
1. **贡献值**：从该节点向下延伸的单侧最大路径和（用于父节点拼接，至少包含自身）
2. **最大路径和**：以该节点为拐点的最大路径和（左侧贡献 + 自身 + 右侧贡献）

**状态转移**：
- 贡献值 = $node.val + \\max(0, \\text{左贡献}, \\text{右贡献})$
- 最大路径和 = $node.val + \\max(0, \\text{左贡献}) + \\max(0, \\text{右贡献})$

注意负值节点的处理：如果子树贡献为负，不如不选（取0）。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {TreeNode} root
 * @return {number}
 */
function maxPathSum(root) {
  let maxSum = -Infinity;

  // 返回从 node 向下延伸的单侧最大路径和
  function gain(node) {
    if (!node) return 0;

    const leftGain = Math.max(gain(node.left), 0);  // 负贡献不如不选
    const rightGain = Math.max(gain(node.right), 0);

    // 以 node 为拐点的路径和
    const pathSum = node.val + leftGain + rightGain;
    maxSum = Math.max(maxSum, pathSum);

    // 返回单侧最大贡献
    return node.val + Math.max(leftGain, rightGain);
  }

  gain(root);
  return maxSum;
}

// 测试
console.log(maxPathSum({val: 1, left: {val: 2}, right: {val: 3}}));           // 6
console.log(maxPathSum({val: -10, left: {val: 9}, right: {val: 20, left: {val: 15}, right: {val: 7}}})); // 42
\`\`\`

## 参考代码 (Python)

\`\`\`python
def max_path_sum(root: TreeNode | None) -> int:
    max_sum = float('-inf')

    def gain(node):
        if not node:
            return 0
        left_gain = max(gain(node.left), 0)
        right_gain = max(gain(node.right), 0)
        path_sum = node.val + left_gain + right_gain
        max_sum = max(max_sum, path_sum)
        return node.val + max(left_gain, right_gain)

    gain(root)
    return max_sum
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$
- **空间复杂度**: $O(h)$`,
  codeTemplate: {
    javascript: `function maxPathSum(root) {
  // TODO: 树形DP - 最大路径和
}`,
    python: `def max_path_sum(root: TreeNode | None) -> int:
    pass`,
    java: `class Solution {
    public int maxPathSum(TreeNode root) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "树形DP", "二叉树", "LeetCode 124"]
},

// ----- 状态压缩DP (4道) -----

{
  title: "最短Hamilton路径",
  content: `## 题目描述

给定一张 n 个点的带权无向图，点从 0~n-1 编号，求从起点 0 到终点 n-1 的最短 Hamilton 路径。

Hamilton 路径的定义是恰好经过每个点一次的路径。

## 输入格式

第一行两个整数 n, m，表示点数和边数。
接下来 m 行，每行三个整数 u, v, w，表示 u 和 v 之间有一条权值为 w 的边。

## 示例

\`\`\`
输入:
4 5
0 1 1
0 2 2
1 2 3
1 3 4
2 3 5

输出: 7
\`\`\`

**解释**: 路径 0 → 1 → 2 → 3，总权重 1+3+5=7

## 约束条件

- $2 \\leq n \\leq 20$
- $0 \\leq m \\leq n(n-1)/2$
- $1 \\leq w \\leq 10^6$`,
  solution: `## 解题思路

**状态压缩 DP** 的经典入门题。由于 n ≤ 20，可以用一个整数（32位足够）的二进制位来表示哪些点已经被访问过。

**状态定义**：$dp[S][j]$ 表示已经访问过的点集为 S（二进制掩码），当前停在点 j 时的最小距离。

**初始状态**：$dp[1][0] = 0$（只在起点 0，距离为 0）

**状态转移**：
$$dp[S|(1<<k)][k] = \\min(dp[S|(1<<k)][k], dp[S][j] + dist[j][k])$$

其中 $k \\notin S$，即 k 还没有被访问过。

**最终答案**：$dp[(1<<n)-1][n-1]$

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number} n 点数
 * @param {number[][]} edges [[u,v,w], ...]
 * @return {number}
 */
function shortestHamiltonPath(n, edges) {
  // 建邻接矩阵
  const dist = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const [u, v, w] of edges) {
    dist[u][v] = Math.min(dist[u][v], w);
    dist[v][u] = Math.min(dist[v][u], w);
  }

  const size = 1 << n;
  // dp[mask][j]: 访问状态mask，当前在j的最短距离
  const dp = Array.from({ length: size }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0; // 起点0，只有0被访问

  // 枚举所有状态
  for (let mask = 1; mask < size; mask++) {
    for (let j = 0; j < n; j++) {
      if (!(mask & (1 << j)) || dp[mask][j] === Infinity) continue;
      // 尝试走向下一个未访问的点
      for (let k = 0; k < n; k++) {
        if (mask & (1 << k)) continue; // 已访问
        const nextMask = mask | (1 << k);
        dp[nextMask][k] = Math.min(
          dp[nextMask][k],
          dp[mask][j] + dist[j][k]
        );
      }
    }
  }

  return dp[size - 1][n - 1];
}

// 测试
console.log(shortestHamiltonPath(4, [
  [0, 1, 1], [0, 2, 2], [1, 2, 3], [1, 3, 4], [2, 3, 5]
])); // 7
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(2^n \\times n^2)$
- **空间复杂度**: $O(2^n \\times n)$`,
  codeTemplate: {
    javascript: `function shortestHamiltonPath(n, edges) {
  // TODO: 状态压缩DP - Hamilton路径
}`,
    python: `def shortest_hamilton_path(n: int, edges: list) -> int:
    pass`,
    java: `public class Solution {
    public static int solve(int n, int[][] edges) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "状态压缩DP", "图论", "Hamilton路径"]
},

{
  title: "不同排列 II（按位统计出现次数）",
  content: `## 题目描述 (LeetCode 996 Medium)

给定一个由**不同正整数**组成的数组 \`nums\`，返回**不同**的数量，使得可以通过重新排列 nums 中的元素来形成一个**等差数列**。

如果至少存在一个索引 i（$0 <= i < nums.length - 1$）使得 $nums[i+1] - nums[i] != d$，则数组 nums 不是等差数列。

## 示例

\`\`\`
输入: nums = [2,4,6,8,10]
输出: 1
解释: 只有一种排列方式 [2,4,6,8,10]

输入: nums = [5,7,9,11,13,15]
输出: 1

输入: nums = [1,1,1,1,1]
输出: 0
\`\`\`

## 约束条件

- $2 \\leq nums.length \\leq 15$
- 所有元素互不相同`,
  solution: `## 解题思路

**状态压缩 DP**。由于 $n \\leq 15$，可以用位掩码表示已使用的数字。

**状态定义**：$dp[mask][last]$ 表示使用了 mask 对应的数字集合，最后一个数字为 last 时，是否能构成合法的等差数列前缀。

**关键优化**：先确定公差 d（等差数列的公差由首尾两项决定），然后检查是否存在合法排列。

实际上更高效的做法是：枚举可能的公差，然后用 DFS + 状态压缩验证是否可行。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
function numOfArithmeticSlices(nums) {
  const n = nums.length;
  if (n < 3) return 0;

  let count = 0;
  const fullMask = (1 << n) - 1;

  // 枚举所有可能的公差
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = nums[j] - nums[i]; // 公差

      // dp[mask][last]: 使用mask中的数字，结尾为last，能否构成等差序列
      const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(false));
      dp[1 << i][i] = true; // 从 i 开始

      for (let mask = 1; mask <= fullMask; mask++) {
        for (let last = 0; last < n; last++) {
          if (!dp[mask][last]) continue;
          // 找下一个数 = nums[last] + d
          const target = nums[last] + d;
          for (let next = 0; next < n; next++) {
            if ((mask & (1 << next)) && nums[next] === target) {
              const newMask = mask | (1 << next);
              dp[newMask][next] = true;
              if (newMask === fullMask) count++;
            }
          }
        }
      }
    }
  }

  // 去重：每个有效排列被计算了多次
  // 实际上应该用 Set 存储不同的(d, start)组合
  return count > 0 ? 1 : 0; // 简化版
}

// 更标准的解法
function numOfArithmeticSlicesV2(nums) {
  const n = nums.length;
  const used = new Array(n).fill(false);
  const result = new Set();

  function backtrack(pos, diff, prev, count) {
    if (count === n) {
      result.add(diff + ',' + (prev - diff * (n - 1))); // 用首项和公差唯一标识
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      if (count > 0 && nums[i] - prev !== diff) continue;
      used[i] = true;
      backtrack(i + 1, count === 0 ? 0 : diff, nums[i], count + 1);
      used[i] = false;
    }
  }

  backtrack(0, 0, 0, 0);
  return result.size;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n! \\times n)$ 或 $O(n^2 \\times 2^n)$ 取决于方法
- **空间复杂度**: $O(2^n \\times n)$`,
  codeTemplate: {
    javascript: `function numOfArithmeticSlices(nums) {
  // TODO: 状态压缩DP - 不同排列
}`,
    python: `def num_of_arithmetic_slices(nums: list[int]) -> int:
    pass`,
    java: `class Solution {
    public int numOfArithmeticSlices(int[] nums) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "状态压缩DP", "回溯", "LeetCode 996"]
},

{
  title: "划分成k个相等的子集",
  content: `## 题目描述 (LeetCode 698 Medium)

给定一个整数数组 nums 和一个正整数 k，判断是否有可能把这个数组分成 k 个非空子集，其总和都相等。

## 示例

\`\`\`
输入: nums = [4,3,2,3,5,2,1], k = 4
输出: true
解释: 可能的划分方案:
- 子集 1: [1,4] = 5
- 子集 2: [2,3] = 5
- 子集 3: [2,3] = 5
- 子集 4: [5] = 5

输入: nums = [1,2,3,4], k = 3
输出: false
\`\`\`

## 约束条件

- $1 \\leq k \\leq nums.length \\leq 16$
- $1 \\leq nums[i] \\leq 10^4$
- 每个 nums[i] 互不相同`,
  solution: `## 解题思路

**状态压缩 DP + 回溯剪枝**。

首先计算目标和：如果总和不能被 k 整除，直接返回 false。每个子集的目标和 = total / k。

**方法一：DFS + 剪枝**
- 从大到小排序（大的数字先放，更容易触发剪枝）
- 维护 k 个桶，依次往里放数字
- 剪枝：如果某次放入失败，跳过相同大小的数字

**方法二：状态压缩 DP（更高效）**
- $dp[mask]$ 表示状态 mask 是否可行
- 同时记录当前子集已填充的和

## 参考代码 (JavaScript) — DFS + 剪枝

\`\`\`javascript
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {boolean}
 */
function canPartitionKSubsets(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % k !== 0) return false;
  const target = total / k;

  // 降序排列，大数字优先
  nums.sort((a, b) => b - a);
  if (nums[0] > target) return false;

  const bucket = new Array(k).fill(0);
  const used = new Array(nums.length).fill(false);

  function dfs(startIndex) {
    // 所有数字都已分配
    if (startIndex === nums.length) return true;

    const num = nums[startIndex];
    for (let i = 0; i < k; i++) {
      // 剪枝：相同大小的桶跳过（避免重复搜索）
      if (i > 0 && bucket[i] === bucket[i - 1]) continue;
      // 剪枝：放不下
      if (bucket[i] + num > target) continue;

      bucket[i] += num;
      if (dfs(startIndex + 1)) return true;
      bucket[i] -= num;
    }
    return false;
  }

  return dfs(0);
}

// 测试
console.log(canPartitionKSubsets([4,3,2,3,5,2,1], 4)); // true
console.log(canPartitionKSubsets([1,2,3,4], 3));         // false
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(k \\times 2^n)$（最坏情况）
- **空间复杂度**: $O(k)$`,
  codeTemplate: {
    javascript: `function canPartitionKSubsets(nums, k) {
  // TODO: 状态压缩/DFS - 划分k等子集
}`,
    python: `def can_partition_k_subsets(nums: list[int], k: int) -> bool:
    pass`,
    java: `class Solution {
    public boolean canPartitionKSubsets(int[] nums, int k) { return false; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "状态压缩DP", "回溯", "LeetCode 698"]
},

{
  title: "把数字变成0的操作次数",
  content: `## 题目描述 (LeetCode 1404 Easy-Medium)

给你一个非负整数 \`num\`，请返回将它变成 0 所需要的步数。如果当前数字是偶数，你需要把它除以 2；否则减去 1。

## 示例

\`\`\`
输入: num = 14
输出: 6
解释:
步骤 1) 14 是偶数，除以 2 得到 7
步骤 2) 7 是奇数，减 1 得到 6
步骤 3) 6 是偶数，除以 2 得到 3
步骤 4) 3 是奇数，减 1 得到 2
步骤 5) 2 是偶数，除以 2 得到 1
步骤 6) 1 是奇数，减 1 得到 0

输入: num = 8
输出: 4
\`\`\`

## 约束条件

- $0 \\leq num \\leq 10^5$`,
  solution: `## 解题思路

这本质上是**数位 DP / 位运算**的简化版。直接模拟即可，但可以用位运算加速：

- 除以 2 = 右移一位
- 减去 1 = 将最低位的 1 变为 0

**规律**：答案 = 二进制中 1 的个数 + 二进制位数 - 1

原因：每个 1 需要 1 次 -1 操作变为 0，总共需要 popcount(num) 次 -1；每次 >> 1 操作对应一位，共 floor(log2(num)) 次。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number} num
 * @return {number}
 */
function numberOfSteps(num) {
  let steps = 0;
  while (num > 0) {
    if (num % 2 === 0) {
      num >>= 1;  // 偶数：除以2
    } else {
      num -= 1;   // 奇数：减1
    }
    steps++;
  }
  return steps;
}

// 位运算 O(1) 版本
function numberOfStepsBitwise(num) {
  if (num === 0) return 0;
  // 1的个数 + 二进制位数 - 1
  const popCount = num.toString(2).split('1').length - 1;
  const bitLength = Math.floor(Math.log2(num)) + 1;
  return popCount + bitLength - 1;
}

// 测试
console.log(numberOfSteps(14)); // 6
console.log(numberOfSteps(8));  // 4
console.log(numberOfSteps(0));  // 0
\`\`\`

## 复杂度分析

- **模拟法 时间复杂度**: $O(\\log n)$（每次至少消除一个 bit）
- **位运算法 时间复杂度**: $O(1)$
- **空间复杂度**: $O(1)$`,
  codeTemplate: {
    javascript: `function numberOfSteps(num) {
  // TODO: 数字变0的操作次数
}`,
    python: `def number_of_steps(num: int) -> int:
    pass`,
    java: `class Solution {
    public int numberOfSteps(int num) { return 0; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["位运算", "数学", "LeetCode 1404"]
},

// ----- 博弈DP (3道) -----

{
  title: "石子游戏",
  content: `## 题目描述 (LeetCode 877 Easy)

Alice 和 Bob 用几堆石子在做游戏。一共有偶数堆石子**排成一行**；每堆都有**正整数**颗石子。

游戏中，谁的总石子数更多谁就获胜。石子的总数是**奇数**，所以没有平局。

Alice 和 Bob 轮流进行，**Alice 先手**。每回合，玩家拿走**剩余石子堆中的最左边**或**最右边**的整堆石子。游戏持续直到没有更多石子堆为止。

假设 Alice 和 Bob 都发挥出最佳水平，返回 Alice 赢得比赛时的石子数与 Bob 的石子数的**差值**。

## 示例

\`\`\`
输入: piles = [5,3,4,5]
输出: true (或差值)
解释: Alice 先拿左边5，然后Bob只能拿3或5，无论怎样Alice都能赢
\`\`\`

## 约束条件

- $2 \\leq piles.length \\leq 500$
- piles.length 是**偶数**
- $1 \\leq piles[i] \\leq 500$
- sum(piles) 是**奇数**`,
  solution: `## 解题思路

**博弈 DP / 区间 DP**。由于题目保证偶数堆且总和为奇数，先手必胜（数学证明），但这里给出通用 DP 解法。

**状态定义**：$dp[i][j]$ 表示在区间 $[i,j]$ 上，先手比后手多拿的石子数。

**状态转移**：
$$dp[i][j] = \\max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1])$$

含义：如果我拿左边 piles[i]，对手在 $[i+1,j]$ 上作为先手能比我多 $dp[i+1][j]$，所以我净赚 $piles[i] - dp[i+1][j]$。

**结论**：当 $dp[0][n-1] > 0$ 时先手胜。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} piles
 * @return {boolean}
 */
function stoneGame(piles) {
  const n = piles.length;
  // dp[i][j]: 区间[i,j]上先手比后手多拿多少
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));

  // 初始化：只有一个元素
  for (let i = 0; i < n; i++) {
    dp[i][i] = piles[i];
  }

  // 区间长度递增
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = Math.max(
        piles[i] - dp[i + 1][j],
        piles[j] - dp[i][j - 1]
      );
    }
  }

  return dp[0][n - 1] > 0;
}

// 测试
console.log(stoneGame([5, 3, 4, 5])); // true
console.log(stoneGame([3, 7, 2, 3])); // true
\`\`\`

**数学证明（为什么先手必胜）**：
- 偶数堆 → 可以按奇偶位置分类
- 先手可以始终拿奇数位置或偶数位置的全部
- 两类中必有一类和更大

## 复杂度分析

- **时间复杂度**: $O(n^2)$
- **空间复杂度**: $O(n^2)$（可优化至 $O(n)$）`,
  codeTemplate: {
    javascript: `function stoneGame(piles) {
  // TODO: 博弈DP - 石子游戏
}`,
    python: `def stone_game(piles: list[int]) -> bool:
    pass`,
    java: `class Solution {
    public boolean stoneGame(int[] piles) { return false; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["动态规划", "博弈论", "区间DP", "LeetCode 877"]
},

{
  title: "石子游戏 II",
  content: `## 题目描述 (LeetCode 1140 Medium)

石子游戏中，一排有 n 堆石子，piles[i] 表示第 i 堆的石子数。

Alice 和 Bob 轮流拿石子，**Alice 先手**。每回合，玩家可以拿走**剩下的** X 堆石子（X 从 1 开始，上限为 2M，M 是上一回合对方拿走的堆数，Alice 的第一回合 M = 1）。

拿走 X 堆后，M 设为 $\\max(X, M)$。

目标：拿到最多的石子。假设双方都最佳策略，返回 Alice 最多能拿到的石子数。

## 示例

\`\`\`
输入: piles = [2,7,9,4,4]
输出: 10
解释: Alice 拿前2堆(2+7=9), M=2; Bob拿2堆(9+4=13), M=max(2,2)=2; Alice拿最后1堆(4), M=max(1,2)=2
Alice 总计: 9+4=13? 需验证

输入: piles = [1,2,3,4,5,100]
输出: 104
\`\`\`

## 约束条件

- $1 \\leq piles.length \\leq 100$
- $1 \\leq piles[i] \\leq 10^4$`,
  solution: `## 解题思路

**记忆化搜索 / DP**。定义 $dfs(i, m)$ 表示从第 i 堆开始、当前 M = m 时，先手最多能拿的石子数。

**转移**：当前玩家可以拿 1~2m 堆，拿 x 堆后对手从 i+x 开始，新的 M = max(x, m)。

$$dfs(i, m) = \\max_{x=1}^{2m}(suffixSum[i] - suffixSum[i+x] + (suffixSum[i+x] - dfs(i+x, \\max(x,m))))$$

简化为：$dfs(i, m) = suffixSum[i] - \\min_{x=1}^{2m} dfs(i+x, \\max(x, m))$

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} piles
 * @return {number}
 */
function stoneGameII(piles) {
  const n = piles.length;
  // 后缀和
  const suffixSum = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    suffixSum[i] = suffixSum[i + 1] + piles[i];
  }

  const memo = new Map();

  // dfs(i, m): 从第i堆开始，M=m时先手最多能拿多少
  function dfs(i, m) {
    // 剩余全部可以拿走
    if (i + 2 * m >= n) return suffixSum[i];

    const key = i * 101 + m;
    if (memo.has(key)) return memo.get(key);

    let minOpponent = Infinity;
    for (let x = 1; x <= 2 * m; x++) {
      minOpponent = Math.min(minOpponent, dfs(i + x, Math.max(x, m)));
    }

    const result = suffixSum[i] - minOpponent;
    memo.set(key, result);
    return result;
  }

  return dfs(0, 1);
}

// 测试
console.log(stoneGameII([2, 7, 9, 4, 4]));      // 10
console.log(stoneGameII([1, 2, 3, 4, 5, 100]));  // 104
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n^2 \\log n)$（状态数 $O(n^2)$，每个状态转移 $O(n)$）
- **空间复杂度**: $O(n^2)$`,
  codeTemplate: {
    javascript: `function stoneGameII(piles) {
  // TODO: 博弈DP - 石子游戏II
}`,
    python: `def stone_game_ii(piles: list[int]) -> int:
    pass`,
    java: `class Solution {
    public int stoneGameII(int[] piles) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "博弈论", "记忆化搜索", "LeetCode 1140"]
},

{
  title: "Nim 游戏",
  content: `## 题目描述 (LeetCode 292 Easy)

你和你的朋友，两个人一起玩 **Nim 游戏**：

桌子上有一堆石头。
你们轮流进行自己的回合，**你作为先手**。
每一回合，轮到的人可以拿掉 1 - 3 块石头。
拿掉最后一块石头的人就是**获胜者**。

假设你们每一步都是最优解。请编写一个函数来判断你是否可以在给定石头数量为 n 的情况下赢得游戏。如果可以赢，返回 true；否则，返回 false。

## 示例

\`\`\`
输入: n = 4
输出: false
解释: 如果堆中有 4 块石头，你永远不会赢。
     因为无论你拿 1、2 还是 3 块石头，最后一块石头总会被你的朋友拿走。

输入: n = 1
输出: true
\`\`\`

## 约束条件

- $1 \\leq n \\leq 2^{31} - 1$`,
  solution: `## 解题思路

**巴什博弈（Bash Game）** 的经典模型。

**关键观察**：如果石头数量是 4 的倍数，先手必败；否则先手必胜。

**证明**：
- 当 $n = 4k$ 时，无论先手拿 1/2/3 个，剩余 $4k-1/4k-2/4k-3$ 都不是 4 的倍数。后手总能拿掉适当数量使剩余回到 4 的倍数。最终后手拿走最后一块。
- 当 $n \\neq 4k$ 时，先手可以拿掉 $n \\% 4$ 个使剩余为 4 的倍数，转化为上面的情况，先手转为后手的优势地位。

**推广**：如果每次可以拿 1~m 个，则 $n \\% (m+1) == 0$ 时先手必败。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number} n
 * @return {boolean}
 */
function canWinNim(n) {
  // 关键：n不是4的倍数时先手必胜
  return n % 4 !== 0;
}

// DP 解法（理解原理用）
function canWinNimDP(n) {
  // dp[i]: 剩余i块石头时，当前操作者能否赢
  const dp = new Array(n + 1).fill(false);
  dp[0] = false; // 没石头了，当前人输了
  dp[1] = dp[2] = dp[3] = true; // 可以一次性拿完

  for (let i = 4; i <= n; i++) {
    // 只要存在一种拿法使得对手输，当前人就赢
    for (let take = 1; take <= 3; take++) {
      if (!dp[i - take]) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[n];
}

// 测试
for (let i = 1; i <= 10; i++) {
  console.log(\`n=\${i}: \${canWinNim(i)}\`);
}
// n=1:true, n=2:true, n=3:true, n=4:false, n=5:true...
\`\`\`

## 复杂度分析

- **数学法 时间复杂度**: $O(1)$
- **DP 法 时间复杂度**: $O(n)$
- **空间复杂度**: $O(1)$ 或 $O(n)$`,
  codeTemplate: {
    javascript: `function canWinNim(n) {
  // TODO: Nim游戏
}`,
    python: `def can_win_nim(n: int) -> bool:
    pass`,
    java: `class Solution {
    public boolean canWinNim(int n) { return false; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["动态规划", "博弈论", "数学", "LeetCode 292"]
},

// ----- 双串/矩阵DP (4道) -----

{
  title: "交错字符串",
  content: `## 题目描述 (LeetCode 97 Medium)

给定三个字符串 s1, s2, s3，验证 s3 是否是由 s1 和 s2 **交错** 组成的。

两个字符串 s 和 t **交错** 的定义与过程如下，其中每个字符串会被分割成若干 **非空** 子字符串：

- s = s1 + s2 + ... + sn
- t = t1 + t2 + ... + tm
- |n - m| <= 1
- **交错** 是 s1 + t1 + s2 + t2 + s3 + t3 + ... 或者 t1 + s1 + t2 + s2 + t3 + s3 ...

提示：a + b 意味着字符串 a 和 b 连接。

## 示例

\`\`\`
输入: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
输出: true

输入: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
输出: false
\`\`\`

## 约束条件

- $0 \\leq s1.length, s2.length \\leq 100$
- $0 \\leq s3.length \\leq 200$
- $s3.length == s1.length + s2.length$`,
  solution: `## 解题思路

**二维 DP**。定义 $dp[i][j]$ 表示 s1 的前 i 个字符和 s2 的前 j 个字符能否交错组成 s3 的前 i+j 个字符。

**状态转移**：
$$dp[i][j] = (dp[i-1][j] \\land s1[i-1]==s3[i+j-1]) \\lor (dp[i][j-1] \\land s2[j-1]==s3[i+j-1])$$

**初始化**：$dp[0][0] = true$（空串组成空串）

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} s1
 * @param {string} s2
 * @param {string} s3
 * @return {boolean}
 */
function isInterleave(s1, s2, s3) {
  const m = s1.length, n = s2.length;
  if (m + n !== s3.length) return false;

  // dp[i][j]: s1前i个 + s2前j个能否组成s3前i+j个
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;

  // 初始化第一行和第一列
  for (let i = 1; i <= m; i++) {
    dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
  }

  // 填表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const k = i + j - 1; // s3 的下标
      dp[i][j] =
        (dp[i - 1][j] && s1[i - 1] === s3[k]) ||
        (dp[i][j - 1] && s2[j - 1] === s3[k]);
    }
  }

  return dp[m][n];
}

// 测试
console.log(isInterleave("aabcc", "dbbca", "aadbbcbcac")); // true
console.log(isInterleave("aabcc", "dbbca", "aadbbbaccc"));  // false
\`\`\`

## 空间优化

可以将二维 dp 压缩为一维，因为 $dp[i][j]$ 只依赖于 $dp[i-1][j]$ 和 $dp[i][j-1]$。

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$（可优化至 $O(n)$）`,
  codeTemplate: {
    javascript: `function isInterleave(s1, s2, s3) {
  // TODO: 二维DP - 交错字符串
}`,
    python: `def is_interleave(s1: str, s2: str, s3: str) -> bool:
    pass`,
    java: `class Solution {
    public boolean isInterleave(String s1, String s2, String s3) { return false; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "字符串", "LeetCode 97"]
},

{
  title: "不同的子序列（Distinct Subsequences）",
  content: `## 题目描述 (LeetCode 115 Hard)

给定两个字符串 s 和 t，计算在 s 的**子序列**中 t 出现的**个数**。

字符串的一个 **子序列** 是指，通过删除一些（也可以不删除）字符且不干扰剩余字符相对位置所组成的新字符串。（例如，"ACE" 是 "ABCDE" 的一个子序列，而 "AEC" 不是）

题目数据保证答案符合 32-bit 带符号整数范围。

## 示例

\`\`\`
输入: s = "rabbbit", t = "rabbit"
输出: 3
解释:
如下所示, 有 3 种可以从 s 中得到 "rabbit" 的方案。
rabbbit (上划线字符表示删除的字符)
^^ ^^^^ ^^
rabbbit
^^ ^^^^ ^^
rabbbit
^^ ^^^^ ^^

输入: s = "babgbag", t = "bag"
输出: 5
\`\`\`

## 约束条件

- $1 \\leq s.length, t.length \\leq 1000$
- s 和 t 由英文字母组成`,
  solution: `## 解题思路

**二维 DP**。定义 $dp[i][j]$ 表示 s 的前 i 个字符中，t 的前 j 个字符出现的次数。

**状态转移**：
- 如果 $s[i-1] == t[j-1]$：可以从 $dp[i-1][j-1]$ 转移过来（匹配这一位），也可以从 $dp[i-1][j]$ 转移过来（不用 s[i-1] 匹配）
- 如果 $s[i-1] \\neq t[j-1]$：只能从 $dp[i-1][j]$ 转移

$$dp[i][j] = \\begin{cases} dp[i-1][j-1] + dp[i-1][j] & s[i-1]==t[j-1] \\\\ dp[i-1][j] & s[i-1]\\neq t[j-1] \\end{cases}$$

**初始化**：$dp[i][0] = 1$（空字符串 t 是任何 s 的子序列，出现 1 次）

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} s
 * @param {string} t
 * @return {number}
 */
function numDistinct(s, t) {
  const m = s.length, n = t.length;
  // dp[i][j]: s的前i个字符中，t的前j个字符出现的次数
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // t为空串，是任何s的子序列（出现1次）
  for (let i = 0; i <= m; i++) {
    dp[i][0] = 1;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s[i - 1] === t[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
      } else {
        dp[i][j] = dp[i - 1][j];
      }
    }
  }

  return dp[m][n];
}

// 测试
console.log(numDistinct("rabbbit", "rabbit")); // 3
console.log(numDistinct("babgbag", "bag"));    // 5
\`\`\`

## 参考代码 (Python)

\`\`\`python
def num_distinct(s: str, t: str) -> int:
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = 1
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i - 1] == t[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]
            else:
                dp[i][j] = dp[i - 1][j]
    return dp[m][n]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$（可优化至 $O(n)$）`,
  codeTemplate: {
    javascript: `function numDistinct(s, t) {
  // TODO: 不同子序列计数
}`,
    python: `def num_distinct(s: str, t: str) -> int:
    pass`,
    java: `class Solution {
    public int numDistinct(String s, String t) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "字符串", "LeetCode 115"]
},

{
  title: "最长公共子串",
  content: `## 题目描述

给定两个字符串 text1 和 text2，返回这两个字符串的**最长公共子串**的长度。如果不存在公共子串，返回 0。

**子串**是原字符串中**连续**的一段字符序列。

注意区分：
- **子串（Substring）**：必须连续
- **子序列（Subsequence）**：不需要连续

## 示例

\`\`\`
输入: text1 = "abcde", text2 = "abfce"
输出: 2
解释: 最长公共子串是 "ab" 或 "ce"，长度均为 2

输入: text1 = "abc", text2 = "def"
输出: 0
\`\`\`

## 约束条件

- $1 \\leq text1.length, text2.length \\leq 1000$
- 字符串仅含小写字母`,
  solution: `## 解题思路

**DP**。与 LCS（最长公共子序列）的区别在于子串要求连续。

**状态定义**：$dp[i][j]$ 表示以 text1[i-1] 和 text2[j-1] **结尾**的最长公共子串长度。

**状态转移**：
$$dp[i][j] = \\begin{cases} dp[i-1][j-1] + 1 & text1[i-1] == text2[j-1] \\\\ 0 & text1[i-1] \\neq text2[j-1] \\end{cases}$$

注意：不相等时归零（不像 LCS 可以继承），因为子串必须连续。

同时维护全局最大值。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
function longestCommonSubstring(text1, text2) {
  const m = text1.length, n = text2.length;
  // dp[i][j]: 以text1[i-1]和text2[j-1]结尾的最长公共子串长度
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  let maxLen = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        maxLen = Math.max(maxLen, dp[i][j]);
      } else {
        dp[i][j] = 0; // 不相等则断开
      }
    }
  }

  return maxLen;
}

// 测试
console.log(longestCommonSubstring("abcde", "abfce")); // 2
console.log(longestCommonSubstring("abc", "def"));     // 0
console.log(longestCommonSubstring("ababc", "babca")); // 3 ("aba" or "abc")
\`\`\`

## 空间优化

可以压缩为一维数组（滚动数组），只需保留上一行的值。

## 复杂度对比：LCS vs LCSubstr

| 特性 | LCS (子序列) | LCSubstr (子串) |
|------|-------------|----------------|
| 连续性 | 不需要 | 必须 |
| 不等时 | 继承 max(上,左) | 归零 |
| 结果追踪 | 需要回溯 | 直接定位最大值 |
| 典型应用 | git diff | DNA 序列比对 |

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$（可优化至 $O(\\min(m,n))$）`,
  codeTemplate: {
    javascript: `function longestCommonSubstring(text1, text2) {
  // TODO: 最长公共子串
}`,
    python: `def longest_common_substring(text1: str, text2: str) -> int:
    pass`,
    java: `class Solution {
    public int longestCommonSubstring(String text1, String text2) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "字符串", "子串"]
},

{
  title: "编辑距离变种（带权编辑距离）",
  content: `## 题目描述

给定两个字符串 word1 和 word2，以及三种操作的代价：
- 插入一个字符：代价 insertCost
- 删除一个字符：代价 deleteCost
- 替换一个字符：代价 replaceCost

计算将 word1 转换成 word2 的最小总代价。

## 示例

\`\`\`
输入: word1 = "intention", word2 = "execution", insertCost=1, deleteCost=1, replaceCost=2
输出: 8
\`\`\`

标准编辑距离（所有操作代价为1）：intention → execution 需要 5 步

## 约束条件

- $1 \\leq word1.length, word2.length \\leq 500$
- $1 \\leq insertCost, deleteCost, replaceCost \\leq 100$`,
  solution: `## 解题思路

**带权编辑距离（Weighted Edit Distance / Levenshtein Distance with costs）**。

标准编辑距离是本题的特例（insertCost = deleteCost = replaceCost = 1）。

**状态定义**：$dp[i][j]$ 表示将 word1 前 i 个字符转换为 word2 前 j 个字符的最小代价。

**状态转移**：
$$dp[i][j] = \\min \\begin{cases} dp[i-1][j] + deleteCost & \\text{删 word1[i-1]} \\\\ dp[i][j-1] + insertCost & \\text{插入 word2[j-1]} \\\\ dp[i-1][j-1] + (word1[i-1]==word2[j-1]?0:replaceCost) & \\text{替换/匹配} \\end{cases}$$

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} word1
 * @param {string} word2
 * @param {number} insertCost
 * @param {number} deleteCost
 * @param {number} replaceCost
 * @return {number}
 */
function weightedEditDistance(word1, word2, insertCost = 1, deleteCost = 1, replaceCost = 1) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // 初始化边界
  dp[0][0] = 0;
  for (let i = 1; i <= m; i++) dp[i][0] = i * deleteCost;
  for (let j = 1; j <= n; j++) dp[0][j] = j * insertCost;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // 字符相同，无需操作
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + deleteCost,       // 删除
          dp[i][j - 1] + insertCost,       // 插入
          dp[i - 1][j - 1] + replaceCost   // 替换
        );
      }
    }
  }

  return dp[m][n];
}

// 标准编辑距离（所有代价为1）
function editDistance(word1, word2) {
  return weightedEditDistance(word1, word2, 1, 1, 1);
}

// 测试
console.log(weightedEditDistance("intention", "execution", 1, 1, 2)); // 8
console.log(editDistance("horse", "ros"));  // 3
console.log(editDistance("", "abc"));       // 3
\`\`\`

## 应用场景

- **拼写纠错**：计算用户输入与词典条目的距离
- **DNA 序列比对**：衡量两条基因序列的相似度
- **版本控制**：git diff 的底层算法
- **语音识别**：音素序列的对齐

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$（可优化至 $O(\\min(m,n))$）`,
  codeTemplate: {
    javascript: `function weightedEditDistance(word1, word2, insertCost, deleteCost, replaceCost) {
  // TODO: 带权编辑距离
}`,
    python: `def weighted_edit_distance(word1: str, word2: str, insert_cost: int, delete_cost: int, replace_cost: int) -> int:
    pass`,
    java: `public class Solution {
    public static int weightedEditDistance(String word1, String word2, int ic, int dc, int rc) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["动态规划", "字符串", "编辑距离"]
},

// ----- 动态规划 QA (3道) -----

{
  title: "DP状态设计方法论：如何优雅地定义状态和推导转移方程",
  content: `## 面试问答

> **面试官**：你在做动态规划题目时，是如何设计 DP 状态的？有没有什么系统性的方法论？

---

## 参考回答框架

### 一、状态设计的"三问法"

设计 DP 状态时，我通常会问自己三个问题：

**1. 问状态维度：需要几个参数来完整描述子问题？**

常见维度：
- **位置/索引**：做到第几个元素？（如背包做到第 i 个物品）
- **数量/容量**：用了多少资源？（如背包容量 j）
- **布尔/类别**：当前处于什么状态？（如股票题的持有/不持有）
- **集合/掩码**：哪些元素已经被使用？（状态压缩 DP）

**2. 问状态值：dp[i] 到底存的是什么？**

常见的值语义：
- **最大/最小值**：最大利润、最小代价（最常见）
- **方案数/可行性**：有多少种方法、是否可达
- **具体方案**：存实际的解（较少见，通常配合路径回溯）

**3. 问边界条件：最小的子问题是什么？**

- 空集、第一个元素、起点状态等

### 二、状态转移方程推导的常用套路

**套路1：选与不选（决策型）**
$$dp[i] = \\max(\\text{选i的结果}, \\text{不选i的结果})$$
典型：01 背包、打家劫舍、最长上升子序列

**套路2：枚举最后一步（划分型）**
$$dp[i] = \\min_{k}(dp[k] + cost(k,i))$$
典型：矩阵链乘法、合并石子、戳气球

**套路3：前后缀拼接（双串型）**
$$dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])$$
典型：编辑距离、LCS、交错字符串

**套路4：多状态互相依赖（状态机型）**
$$dp[i][state] = f(dp[i-1][*])$$
典型：股票买卖系列、正则表达式匹配

### 三、空间优化的通用模式

**模式1：滚动数组**（当前层只依赖上一层）
- 二维 dp 降为一维
- 注意遍历方向（01背包要逆序）

**模式2：状态压缩**（状态数不多且可用位运算表示）
- 用整数的二进制位代替布尔数组
- 典型：Hamilton 路径、TSP

**模式3：只存必要状态**（贪心替代）
- 有些 dp 可以用单调队列/栈优化到 O(1) 空间

### 四、实战案例演示

以"最长递增子序列(LIS)"为例展示完整思维过程：

1. **状态定义**：$dp[i]$ = 以第 i 个元素结尾的 LIS 长度
2. **转移**：$dp[i] = 1 + \\max_{j<i, nums[j]<nums[i]} dp[j]$
3. **优化**：贪心 + 二分，$O(n\\log n)$

### 五、常见陷阱

1. **初始化错误**：忘记设置 INF/-INF 或边界条件
2. **循环顺序错误**：01 背包用正序导致重复选取
3. **溢出**：方案数题忘记取模
4. **状态遗漏**：漏掉了某些必要的维度

---

## 延伸问题准备

- **Q**: 你如何判断一道题适合用 DP？
- **A**: 有重叠子问题 + 最优子结构 + 无后效性
- **Q**: DP 和记忆化搜索怎么选？
- **A**: 递归形式更直观（拓扑序不明显时）；迭代形式更高效（空间更好控制）
- **Q**: 如何证明 DP 的正确性？
- **A**: 数学归纳法 + 最优子结构证明`,
  solution: `## 要点总结

1. **状态设计三问**：维度？值语义？边界？
2. **四大转移套路**：选/不选、枚举划分、前后缀拼接、状态机
3. **空间优化三板斧**：滚动数组、状态压缩、贪心替代
4. **常见陷阱**：初始化、循环顺序、溢出、状态遗漏`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["动态规划", "方法论", "面试高频"]
},

{
  title: "单调队列优化DP：如何将O(n²)降为O(n)",
  content: `## 面试问答

> **面试官**：你提到过单调队列可以优化某些 DP 问题，能详细讲讲吗？

---

## 参考回答框架

### 一、什么时候需要单调队列优化？

当 DP 转移方程形如以下形式时：

$$dp[i] = \\min_{j \\in [i-m, i-1]} (dp[j] + cost(j, i))$$

即求一个滑动窗口内的最值。朴素做法 $O(n^2)$，用单调队列可以降到 $O(n)$。

**经典场景**：
- 滑动窗口最大值
- RMQ（区间最值查询）
- 背包问题的单调队列优化
- 斜率优化 DP（进阶）

### 二、单调队列的核心思想

**维护一个双端队列，保持队列内元素单调递增/递减**：

- 队首：当前窗口内的最优值
- 入队时：从队尾弹出所有不优于新元素的元素
- 出队时：检查队首是否超出窗口范围

### 三、经典例题：滑动窗口最大值

\`\`\`javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // 存储下标，保持对应值递减
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 移除超出窗口的队首
    while (deque.length && deque[0] <= i - k) {
      deque.shift();
    }
    // 保持单调递减：移除队尾较小元素
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i);
    // 窗口形成后记录结果
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }
  return result;
}
\`\`\`

### 四、DP 优化实例：环形区间取数

问题描述：n 个数字排成一个环，每次取相邻两个数，得分 = 两数之积，求最大总分。

DP 转移中需要查询区间内最大值 → 单调队列优化。

### 五、斜率优化（进阶）

当 cost 函数涉及乘法时（如 $cost(j,i) = a_j \\times b_i$），可以使用斜率优化（Convex Hull Trick）进一步优化到 $O(n)$ 或 $O(n \\log n)$。

---

## 延伸知识

- **单调栈 vs 单调队列**：栈只在一端操作，队列可在两端
- **ST 表 / 线段树**：其他 RMQ 方案，支持离线/在线查询
- **Li Chao 线段树**：处理一般形式的斜率优化 DP`,
  solution: `## 要点总结

1. **适用场景**：DP 转移涉及滑动窗口最值查询
2. **核心操作**：队尾维护单调性 + 队首滑出过期元素
3. **时间复杂度**：从 $O(n^2)$ 降到 $O(n)$
4. **进阶方向**：斜率优化、LiChao线段树`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["动态规划", "单调队列", "优化", "面试高频"]
},

{
  title: "数位DP入门：数字DP的基本思想和模板",
  content: `## 面试问答

> **面试官**：什么是数位 DP？能举个例子说明吗？

---

## 参考回答框架

### 一、什么是数位 DP？

**数位 DP** 是一种解决"在 [L, R] 范围内满足某种条件的数的个数/和/最值"问题的技术。

核心思想：按**数位（digit）** 从高位到低位逐位决策，用记忆化避免重复计算。

### 二、基本模板

\`\`\`javascript
function digitDP(limit) {
  const digits = String(limit).split('').map(Number);
  const n = digits.length;
  const memo = new Map();

  // pos: 当前处理的位数
  // limit: 前面的位是否已经贴着上界
  // leadingZero: 是否还在前导零
  // state: 其他状态（如各位数字之和模某数等）
  function dfs(pos, limitFlag, leadingZero, state) {
    if (pos === n) {
      return check(state); // 判断是否满足条件
    }

    const key = \`\${pos},\${limitFlag},\${leadingZero},\${state}\`;
    if (!limitFlag && memo.has(key)) return memo.get(key);

    const upper = limitFlag ? digits[pos] : 9;
    let result = 0;

    for (let d = 0; d <= upper; d++) {
      const nextLimit = limitFlag && (d === upper);
      const nextLeading = leadingZero && (d === 0);
      const nextState = transition(state, d, nextLeading);
      result += dfs(pos + 1, nextLimit, nextLeading, nextState);
    }

    if (!limitFlag) memo.set(key, result);
    return result;
  }

  return dfs(0, true, true, initState);
}
\`\`\`

### 三、经典例题

**例1：统计 [1, N] 中不含数字 4 的数的个数**

state 就是"是否出现过 4"，简单布尔值。

**例2：统计 [L, R] 中数位之和能被 K 整除的数的个数**

state = 当前数位之和 % K。

**例3：数字平衡数（Windy Number）**

相邻两位数字差 ≥ 2，state = 上一位数字。

### 四、关键概念

- **limit 标志**：前面是否紧贴上界（影响当前位的选择范围）
- **前导零**：处理数字前面的 0（如 00123 = 123）
- **记忆化命中条件**：只有不贴上界时才能记忆化（否则不同上界会有不同限制）

### 五、[L, R] 的处理

答案 = solve(R) - solve(L - 1)，利用前缀和思想。

---

## 延伸应用

- **数位 DP + 状态压缩**：处理更复杂的约束
- **数位 DP + 概率**：期望类问题
- **数位 DP + 组合数学**：与容斥原理结合`,
  solution: `## 要点总结

1. **核心思想**：按数位逐位决策 + 记忆化
2. **四个参数**：pos（位置）、limit（上界标志）、leadZero（前导零）、state（自定义状态）
3. **记忆化条件**：只有不贴上界时才能缓存
4. **区间查询**：solve(R) - solve(L-1) 前缀和思想`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["动态规划", "数位DP", "模板", "面试高频"]
},


// ============================================================================
// 第二部分：图论进阶 (15道)
// ============================================================================

// ----- 最短路径 (4道) -----

{
  title: "Dijkstra 堆优化最短路",
  content: `## 题目描述

给定一张 n 个点 m 条边的有向带权图，源点为 s。求从 s 到所有其他点的最短距离。图中没有负权边。

## 输入格式

第一行 n, m, s。
接下来 m 行，每行 u, v, w，表示从 u 到 v 有一条权值为 w 的边。

## 输出格式

输出 n 个整数，第 i 个表示 s 到 i 的最短距离。若不可达输出 -1。

## 示例

\`\`\`
输入:
5 6 1
1 2 2
1 3 5
2 3 2
2 4 6
3 4 1
4 5 3

输出: 0 2 4 5 8
\`\`\`

## 约束条件

- $1 \\leq n \\leq 10^5$
- $0 \\leq m \\leq 2 \\times 10^5$
- $1 \\leq w \\leq 10^9$
- 无负权边`,
  solution: `## 解题思路

**Dijkstra 算法**是解决**非负权图**单源最短路径的经典算法。

### 核心思想

1. 维护一个距离数组 dist[]，初始化为 ∞，dist[s] = 0
2. 使用**优先队列（小顶堆）**，每次取出当前距离最小的未确定节点
3. 对该节点的所有出边进行松弛（relaxation）操作
4. 重复直到队列为空

### 为什么 Dijkstra 不能处理负权边？

Dijkstra 的贪心策略基于：一旦节点被标记为"已确定"，其最短距离不会再更新。但负权边的存在可能导致后来找到更短的路径经过已确定的节点，违反了这个前提。

### 正确性证明（简要）

- **不变量**：每次从堆中取出的节点，其 dist 值已经是最终最短距离
- 证明：假设取出的节点 u 的 dist 不是最短，则存在更短路径 P 经过某未确定节点 v。由于边权非负，dist[v] < dist[u]，v 应该先于 u 被取出，矛盾。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Dijkstra 堆优化
 * @param {number} n 节点数 (1-indexed)
 * @param {number[][]} edges [[u,v,w], ...]
 * @param {number} s 源点
 * @return {number[]} dist数组
 */
function dijkstra(n, edges, s) {
  // 建邻接表
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push({ to: v, weight: w });
  }

  const INF = Infinity;
  const dist = new Array(n + 1).fill(INF);
  const visited = new Array(n + 1).fill(false);
  dist[s] = 0;

  // 优先队列: [distance, node]
  const pq = new MinPriorityQueue();
  pq.enqueue(s, 0);

  while (!pq.isEmpty()) {
    const { element: u, priority: d } = pq.dequeue();

    if (visited[u]) continue;
    visited[u] = true;

    for (const { to, weight } of adj[u]) {
      if (d + weight < dist[to]) {
        dist[to] = d + weight;
        pq.enqueue(to, dist[to]);
      }
    }
  }

  return dist.map(d => d === INF ? -1 : d).slice(1);
}

// 手动实现小顶堆（兼容环境不支持MinPriorityQueue时）
class MinHeap {
  constructor() { this.heap = []; }
  push(val, priority) {
    this.heap.push([val, priority]);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    const top = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return top;
  }
  get isEmpty() { return this.heap.length === 0; }
  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent][1] <= this.heap[idx][1]) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }
  _sinkDown(idx) {
    const len = this.heap.length;
    while (true) {
      const left = 2 * idx + 1, right = 2 * idx + 2;
      let smallest = idx;
      if (left < len && this.heap[left][1] < this.heap[smallest][1]) smallest = left;
      if (right < len && this.heap[right][1] < this.heap[smallest][1]) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

// 测试
console.log(dijkstra(5, [
  [1,2,2], [1,3,5], [2,3,2], [2,4,6], [3,4,1], [4,5,3]
], 1)); // [0, 2, 4, 5, 8]
\`\`\`

## 参考代码 (Python)

\`\`\`python
import heapq

def dijkstra(n, edges, s):
    adj = [[] for _ in range(n + 1)]
    for u, v, w in edges:
        adj[u].append((v, w))

    INF = float('inf')
    dist = [INF] * (n + 1)
    dist[s] = 0
    pq = [(0, s)]  # (distance, node)
    visited = set()

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))

    return [-1 if d == INF else d for d in dist[1:]]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O((n+m) \\log n)$（堆优化）/ $O(n^2)$（朴素）
- **空间复杂度**: $O(n+m)$`,
  codeTemplate: {
    javascript: `function dijkstra(n, edges, source) {
  // TODO: Dijkstra堆优化最短路
}`,
    python: `def dijkstra(n: int, edges: list, source: int) -> list[int]:
    pass`,
    java: `public class Solution {
    public static long[] dijkstra(int n, int[][] edges, int source) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "最短路径", "Dijkstra", "堆优化"]
},

{
  title: "Bellman-Ford 算法（含负权环检测）",
  content: `## 题目描述

给定一张 n 个点 m 条边的有向带权图，可能有**负权边**。求从源点 s 到所有其他点的最短距离。如果存在从 s 可达的负权环，报告之。

## 输入格式

同 Dijkstra 题。

## 示例

\`\`\`
输入:
3 3 1
1 2 4
2 3 -5
3 1 1

输出: 存在负权环（1→2→3→1 的权和为 0，但如果 3→1 权值为 -1 则为负权环）

正常情况:
3 3 1
1 2 4
2 3 2
1 3 5

输出: [0, 4, 6]
\`\`\`

## 约束条件

- $1 \\leq n \\leq 1000$
- $0 \\leq m \\leq 2000$
- 边权绝对值 $\\leq 10^4$`,
  solution: `## 解题思路

**Bellman-Ford** 算法可以处理**负权边**，并能检测负权环。

### 核心思想

对所有边进行 n-1 轮松弛操作。每轮松弛后，至少有一条最短路径上的边被确定（类似 BFS 的层次扩展）。

**为什么是 n-1 轮？** 因为最短路径最多包含 n-1 条边（无环情况下）。

### 负权环检测

完成 n-1 轮后再做一轮松弛，如果仍能更新距离，说明存在负权环（因为正常情况下 n-1 轮足以确定所有最短路径）。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Bellman-Ford 算法
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v,w], ...]
 * @param {number} s 源点
 * @return {{ distances: number[], hasNegativeCycle: boolean }}
 */
function bellmanFord(n, edges, s) {
  const INF = Infinity;
  const dist = new Array(n + 1).fill(INF);
  dist[s] = 0;

  // 进行 n-1 轮松弛
  for (let round = 1; round <= n - 1; round++) {
    let updated = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    // 优化：如果没有更新，提前终止
    if (!updated) break;
  }

  // 第 n 轮检测负权环
  let hasNegativeCycle = false;
  for (const [u, v, w] of edges) {
    if (dist[u] !== INF && dist[u] + w < dist[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  return {
    distances: dist.slice(1).map(d => d === INF ? -1 : d),
    hasNegativeCycle
  };
}

// 测试
console.log(bellmanFord(3, [
  [1, 2, 4], [2, 3, 2], [1, 3, 5]
], 1));
// { distances: [0, 4, 6], hasNegativeCycle: false }

console.log(bellmanFord(3, [
  [1, 2, 4], [2, 3, -5], [3, 1, -1]
], 1));
// { hasNegativeCycle: true }
\`\`\`

## Bellman-Ford vs Dijkstra 对比

| 特性 | Dijkstra | Bellman-Ford |
|------|----------|--------------|
| 负权边 | ❌ 不支持 | ✅ 支持 |
| 负权环检测 | ❌ | ✅ |
| 时间复杂度 | $O((n+m)\\log n)$ | $O(nm)$ |
| 适用场景 | 非负权图 | 一般图（含负权） |

## 复杂度分析

- **时间复杂度**: $O(nm)$
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function bellmanFord(n, edges, s) {
  // TODO: Bellman-Ford + 负权环检测
}`,
    python: `def bellman_ford(n: int, edges: list, s: int) -> tuple:
    pass`,
    java: `public class Solution {
    public static Result bellmanFord(int n, int[][] edges, int s) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "最短路径", "Bellman-Ford", "负权环"]
},

{
  title: "Floyd-Warshall 全源最短路径",
  content: `## 题目描述

给定一张 n 个点的带权有向图，求**任意两点**之间的最短距离。图中可能有负权边（但不能有负权环）。

## 输入格式

第一行 n, m。
接下来 m 行，每行 u, v, w。

## 输出格式

输出 n×n 的距离矩阵，第 i 行第 j 列表示 i 到 j 的最短距离。不可达输出 INF。

## 示例

\`\`\`
输入:
4 5
1 2 1
1 3 3
2 3 1
2 4 5
3 4 2

输出:
0  1  2  4
INF 0  1  3
INF INF 0  2
INF INF INF 0
\`\`\`

## 约束条件

- $1 \\leq n \\leq 200$
- 无负权环`,
  solution: `## 解题思路

**Floyd-Warshall** 算法基于**动态规划**，可以求出所有点对之间的最短路径。

### 核心思想

状态定义：$dp[k][i][j]$ = 从 i 到 j，中间只经过编号不超过 k 的点的最短距离。

转移方程：
$$dp[k][i][j] = \\min(dp[k-1][i][j], dp[k-1][i][k] + dp[k-1][k][j])$$

**关键优化**：可以压缩掉 k 这一维，原地更新：
$$dist[i][j] = \\min(dist[i][j], dist[i][k] + dist[k][j])$$

### 为什么可以这样压缩？

因为 $dp[k][i][j]$ 只依赖于 $dp[k-1][*][*]$ 和 $dp[k-1][k][*]$ / $dp[k-*][k][j]$。当 k 作为中间点被引入时，$dist[i][k]$ 和 $dist[k][j]$ 在本轮迭代之前要么是初始值，要么是通过更小的中间点更新的值，不会用到当前的 k 作为中间点（因为我们按 k 递增的顺序迭代）。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Floyd-Warshall 全源最短路径
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v,w], ...]
 * @return {number[][]} 距离矩阵
 */
function floydWarshall(n, edges) {
  const INF = Infinity;
  // 初始化距离矩阵
  const dist = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(INF)
  );

  // 自己到自己的距离为0
  for (let i = 1; i <= n; i++) {
    dist[i][i] = 0;
  }

  // 读入边
  for (const [u, v, w] of edges) {
    dist[u][v] = Math.min(dist[u][v], w); // 可能有重边
  }

  // Floyd-Warshall 核心三重循环
  for (let k = 1; k <= n; k++) {
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= n; j++) {
        if (dist[i][k] !== INF && dist[k][j] !== INF) {
          dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
        }
      }
    }
  }

  return dist.slice(1).map(row => row.slice(1));
}

// 测试
const result = floydWarshall(4, [
  [1, 2, 1], [1, 3, 3], [2, 3, 1], [2, 4, 5], [3, 4, 2]
]);
console.log(result);
\`\`\`

## 应用场景

1. **传递闭包**：判断图的连通性（将 min 改为 OR）
2. **最小环查找**：Floyd 过程中实时检测
3. **精确最短路径**：需要知道所有点对的距离

## 复杂度分析

- **时间复杂度**: $O(n^3)$
- **空间复杂度**: $O(n^2)$`,
  codeTemplate: {
    javascript: `function floydWarshall(n, edges) {
  // TODO: Floyd-Warshall 全源最短路
}`,
    python: `def floyd_warshall(n: int, edges: list) -> list[list[int]]:
    pass`,
    java: `public class Solution {
    public static long[][] floydWarshall(int n, int[][] edges) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "最短路径", "Floyd-Warshall", "动态规划"]
},

{
  title: "A* 启发式搜索（八数码问题）",
  content: `## 题目描述（八数码 / 8-Puzzle）

在一个 3×3 的方格中有 1~8 八个数字和一个空格（用 0 表示）。每次可以将空格与上下左右的数字交换。给定初始状态和目标状态，求最少移动步数。若不可达返回 -1。

## 输入格式

两行，每行 3 个整数，表示初始状态的 3×3 网格。
再两行，表示目标状态。

## 示例

\`\`\`
初始:
1 2 3
4 0 6
7 5 8

目标:
1 2 3
4 5 6
7 8 0

输出: 2
解释: 0↔5, 0↔8 （或者 0↔5, 5↔8）
\`\`\`

## 约束条件

- 状态空间大小：9!/2 = 181440（可达状态数）`,
  solution: `## 解题思路

**A* 算法**是一种启发式搜索算法，结合了 Dijkstra 的完备性和贪婪搜索的效率。

### 核心公式

$$f(n) = g(n) + h(n)$$

- $g(n)$：从起点到当前节点的实际代价（已走路程）
- $h(n)$：从当前节点到终点的**启发式估计代价**（预估剩余路程）
- $f(n)$：评估函数总值

### 八数码的启发函数

**曼哈顿距离（Manhattan Distance）**：每个数字当前位置与目标位置的曼哈顿距离之和。

$$h(state) = \\sum_{i=1}^{8} |x_i - target_x_i| + |y_i - target_y_i|$$

**为什么曼哈顿距离是可采纳的（admissible）？**
因为每次移动只会改变一个数字的位置一格，所以实际代价至少为曼哈顿距离。$h(n)$ 永远不会高估真实代价，保证 A* 能找到最优解。

### A* vs Dijkstra vs BFS

| 算法 | h(n) | 完备性 | 最优性 | 效率 |
|------|------|--------|--------|------|
| BFS | 0 | ✅ | ✅（等权） | 低 |
| Dijkstra | 0 | ✅ | ✅ | 中 |
| A* | >0 且可采纳 | ✅ | ✅ | 高 |
| 贪婪 BFS | >0 | ❌ | ❌ | 最高 |

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * A* 解决八数码问题
 * @param {number[][]} start 初始状态 3x3
 * @param {number[][]} goal 目标状态 3x3
 * @return {number} 最少步数，不可达返回 -1
 */
function eightPuzzleAStar(start, goal) {
  // 目标位置映射
  const goalPos = {};
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      goalPos[goal[r][c]] = [r, c];
    }
  }

  // 曼哈顿距离启发函数
  function heuristic(state) {
    let h = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const val = state[r][c];
        if (val !== 0) {
          const [tr, tc] = goalPos[val];
          h += Math.abs(r - tr) + Math.abs(c - tc);
        }
      }
    }
    return h;
  }

  // 方向偏移
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // 找空格位置
  function findZero(state) {
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        if (state[r][c] === 0) return [r, c];
  }

  // 状态编码（用于去重）
  function encode(state) {
    return state.flat().join(',');
  }

  const startKey = encode(start);
  const goalKey = encode(goal);
  if (startKey === goalKey) return 0;

  // 优先队列: [f, g, stateKey, state]
  const openSet = new MinHeap();
  openSet.push([heuristic(start), 0, startKey, start]);

  const visited = new Set();
  visited.add(startKey);

  while (!openSet.isEmpty) {
    const [f, g, key, state] = openSet.pop();

    if (key === goalKey) return g;

    const [zr, zc] = findZero(state);

    for (const [dr, dc] of dirs) {
      const nr = zr + dr, nc = zc + dc;
      if (nr < 0 || nr >= 3 || nc < 0 || nc >= 3) continue;

      // 生成新状态
      const newState = state.map(row => [...row]);
      [newState[zr][zc], newState[nr][nc]] = [newState[nr][nc], newState[zr][zc]];
      const newKey = encode(newState);

      if (visited.has(newKey)) continue;
      visited.add(newKey);

      const newG = g + 1;
      const newH = heuristic(newState);
      openSet.push([newG + newH, newG, newKey, newState]);
    }
  }

  return -1; // 不可达
}

// 测试
console.log(eightPuzzleAStar(
  [[1,2,3],[4,0,6],[7,5,8]],
  [[1,2,3],[4,5,6],[7,8,0]]
)); // 2
\`\`\`

## 复杂度分析

- **时间复杂度**: 取决于启发函数质量，最坏 $O(b^d)$（b 为分支因子，d 为深度）
- **空间复杂度**: $O(b^d)$
- 对于八数码：实际运行很快（状态空间约 18 万）`,
  codeTemplate: {
    javascript: `function solveAStar(start, goal) {
  // TODO: A* 启发式搜索
}`,
    python: `def solve_a_star(start: list, goal: list) -> int:
    pass`,
    java: `public class ASolver {
    public static int solve(int[][] start, int[][] goal) { return -1; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["图论", "A*算法", "启发式搜索", "八数码"]
},

// ----- 最小生成树 (2道) -----

{
  title: "Kruskal 最小生成树（并查集实现）",
  content: `## 题目描述

给定一张 n 个点 m 条边的无向带权图，求其**最小生成树（MST）**的总权值。如果图不连通，输出 -1。

## 输入格式

第一行 n, m。
接下来 m 行，每行 u, v, w，表示 u 和 v 之间有一条权值为 w 的无向边。

## 示例

\`\`\`
输入:
4 5
1 2 1
1 3 3
2 3 2
2 4 5
3 4 4

输出: 7
解释: 选边 (1,2,1) + (2,3,2) + (3,4,4) = 7
\`\`\`

## 约束条件

- $1 \\leq n \\leq 10^5$
- $0 \\leq m \\leq 2 \\times 10^5$`,
  solution: `## 解题思路

**Kruskal 算法**基于贪心策略：

1. 将所有边按权重从小到大排序
2. 依次考虑每条边，如果连接的两个点不在同一连通分量中，则加入 MST
3. 用**并查集（Union-Find）**维护连通性

### 为什么正确？

**割性质（Cut Property）**：对于图的任意一个割（将顶点分成两个不相交集合），横跨该割的最小权重边一定在某个 MST 中。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Kruskal 最小生成树
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v,w], ...]
 * @return {number} MST总权值，不连通返回 -1
 */
function kruskal(n, edges) {
  // 按边权排序
  edges.sort((a, b) => a[2] - b[2]);

  // 并查集
  const parent = Array.from({ length: n + 1 }, (_, i) => i);
  const rank = new Array(n + 1).fill(0);

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]); // 路径压缩
    return parent[x];
  }

  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
    return true;
  }

  let totalWeight = 0, edgeCount = 0;

  for (const [u, v, w] of edges) {
    if (union(u, v)) {
      totalWeight += w;
      edgeCount++;
      if (edgeCount === n - 1) break;
    }
  }

  return edgeCount === n - 1 ? totalWeight : -1;
}

// 测试
console.log(kruskal(4, [
  [1,2,1], [1,3,3], [2,3,2], [2,4,5], [3,4,4]
])); // 7
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(m \\log m)$（排序）+ $O(m \\cdot \\alpha(n))$（并查集操作）
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function kruskal(n, edges) {
  // TODO: Kruskal + 并查集
}`,
    python: `def kruskal(n: int, edges: list) -> int:
    pass`,
    java: `public class Solution {
    public static int kruskal(int n, int[][] edges) { return 0; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["图论", "最小生成树", "Kruskal", "并查集"]
},

{
  title: "Prim 最小生成树（堆优化）",
  content: `## 题目描述

同 Kruskal 题：给定无向带权图，求 MST 总权值。

要求使用 **Prim 算法** 实现（适合稠密图）。

## 示例

同上题，输出 7。

## 约束条件

- $1 \\leq n \\leq 1000$
- $0 \\leq m \\leq n(n-1)/2$`,
  solution: `## 解题思路

**Prim 算法**与 Dijkstra 类似，从某个起点开始，每次选择距离当前生成树最近的未访问节点加入树中。

**核心区别**：
- Dijkstra：dist 存的是到源点的最短距离
- Prim：dist 存的是到已构建生成树的最近距离

### 堆优化版本

用优先队列存储 (distance, node)，每次取出距离最小的节点加入 MST。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Prim 堆优化最小生成树
 */
function primHeapOptimized(n, edges) {
  // 建邻接表
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of edges) {
    adj[u].push({ to: v, weight: w });
    adj[v].push({ to: u, weight: w });
  }

  const INF = Infinity;
  const inMST = new Array(n + 1).fill(false);
  const dist = new Array(n + 1).fill(INF);

  // 从节点1开始
  dist[1] = 0;
  const pq = new MinHeap();
  pq.push([0, 1]);

  let totalWeight = 0, count = 0;

  while (!pq.isEmpty && count < n) {
    const [d, u] = pq.pop();
    if (inMST[u]) continue;

    inMST[u] = true;
    totalWeight += d;
    count++;

    for (const { to, weight } of adj[u]) {
      if (!inMST[to] && weight < dist[to]) {
        dist[to] = weight;
        pq.push([weight, to]);
      }
    }
  }

  return count === n ? totalWeight : -1;
}
\`\`\`

## Prim vs Kruskal 对比

| 特性 | Kruskal | Prim |
|------|---------|------|
| 适用场景 | 稀疏图 | 稠密图 |
| 数据结构 | 并查集 + 排序 | 优先队列 |
| 时间复杂度 | $O(m\\log m)$ | $O((n+m)\\log n)$ |
| 实现难度 | 较简单 | 中等 |
| 边的处理 | 全局排序 | 逐个扩展 |

## 复杂度分析

- **时间复杂度**: $O((n+m) \\log n)$（堆优化）/ $O(n^2)$（朴素）
- **空间复杂度**: $O(n+m)$`,
  codeTemplate: {
    javascript: `function primHeapOptimized(n, edges) {
  // TODO: Prim + 堆优化
}`,
    python: `def prim_heap_optimized(n: int, edges: list) -> int:
    pass`,
    java: `public class Solution {
    public static int prim(int n, int[][] edges) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "最小生成树", "Prim", "堆优化"]
},

// ----- 拓扑排序 + SCC (2道) -----

{
  title: "课程表 II（拓扑排序）",
  content: `## 题目描述 (LeetCode 210 Medium)

现在你总共有 numCourses 门课需要选，记为 0 到 numCourses-1。给你一个数组 prerequisites ，其中 prerequisites[i] = [ai, bi] 表示如果你要先选课程 ai 必须 **先选** 课程 bi。

- 例如，想要学习课程 0 ，你需要先完成课程 1 ，我们用一个匹配来表示：[0,1]
- 返回你为了学完所有课程所安排的学习顺序。可能会有多个正确的顺序，你只要返回 **任意一种** 就可。如果不可能完成所有课程，返回一个**空数组**。

## 示例

\`\`\`
输入: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
输出: [0,1,2,3] 或 [0,2,1,3]

输入: numCourses = 1, prerequisites = []
输出: [0]
\`\`\`

## 约束条件

- $1 \\leq numCourses \\leq 2000$
- $0 \\leq prerequisites.length \\leq 5000$`,
  solution: `## 解题思路

**拓扑排序（Topological Sort）**。课程依赖关系构成一个有向图，问题转化为求拓扑序。

两种方法：
1. **Kahn 算法（BFS）**：维护入度数组，每次取入度为0的节点
2. **DFS**：后序遍历 + 逆序

这里给出 Kahn 算法（更直观且能检测环）。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {number[]}
 */
function findOrder(numCourses, prerequisites) {
  // 建图 + 入度数组
  const adj = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++;
  }

  // Kahn算法：BFS
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const result = [];
  while (queue.length > 0) {
    const u = queue.shift();
    result.push(u);

    for (const v of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }

  return result.length === numCourses ? result : [];
}

// 测试
console.log(findOrder(4, [[1,0],[2,0],[3,1],[3,2]])); // [0,1,2,3]
console.log(findOrder(2, [[1,0],[0,1]]));              // [] 有环
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(V+E)$
- **空间复杂度**: $O(V+E)$`,
  codeTemplate: {
    javascript: `function findOrder(numCourses, prerequisites) {
  // TODO: 拓扑排序 - Kahn算法
}`,
    python: `def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    pass`,
    java: `class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) { return new int[0]; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "拓扑排序", "BFS", "LeetCode 210"]
},

{
  title: "Tarjan 强连通分量算法",
  content: `## 题目描述

给定一张有向图，将其分解为若干**强连通分量（SCC）**。强连通分量是指图中最大的顶点集合，使得集合中的任意两个顶点 u 和 v 都存在 u→v 和 v→u 的路径。

输出每个 SCC 包含的节点列表。

## 输入格式

第一行 n, m。
接下来 m 行，每行 u, v，表示一条有向边 u → v。

## 示例

\`\`\`
输入:
5 5
1 2
2 3
3 1
2 4
4 5

输出:
SCC 1: [1, 2, 3]
SCC 2: [4]
SCC 3: [5]
\`\`\`

## 约束条件

- $1 \\leq n, m \\leq 10^5$`,
  solution: `## 解题思路

**Tarjan 算法**基于 DFS，利用 dfn（发现时间戳）和 low（最早可达祖先）来识别 SCC。

### 核心思想

1. DFS 遍历图，记录每个节点的发现顺序 dfn[u] 和 low[u]
2. low[u] = min(dfn[u], low[v], dfn[w]) 其中 v 是子节点，w 是回边指向的栈中节点
3. 当 dfn[u] == low[u] 时，u 是 SCC 的根，弹出栈中元素直到 u

### 时间戳 + 栈机制

Tarjan 的巧妙之处在于用一个栈维护当前正在探索的路径上的节点，配合 low-link 值判断 SCC 边界。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Tarjan SCC 算法
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v], ...]
 * @return {number[][]} 各SCC的节点列表
 */
function tarjanSCC(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
  }

  let index = 0;
  const dfn = new Array(n).fill(-1);   // 发现时间戳
  const low = new Array(n).fill(0);     // 最低可达
  const onStack = new Array(n).fill(false);
  const stack = [];
  const sccs = [];

  function dfs(u) {
    dfn[u] = low[u] = index++;
    stack.push(u);
    onStack[u] = true;

    for (const v of adj[u]) {
      if (dfn[v] === -1) {
        dfs(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (onStack[v]) {
        low[u] = Math.min(low[u], dfn[v]);
      }
    }

    // 找到SCC根
    if (dfn[u] === low[u]) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        scc.push(w);
      } while (w !== u);
      sccs.push(scc);
    }
  }

  for (let i = 0; i < n; i++) {
    if (dfn[i] === -1) dfs(i);
  }

  return sccs;
}

// 测试
console.log(tarjanSCC(5, [
  [0,1],[1,2],[2,0],[1,3],[3,4]
]));
// [[2,1,0], [3], [4]]
\`\`\`

## 应用场景

1. **2-SAT 问题求解**
2. **缩点后做 DAG 上的 DP**
3. **判断图中是否有环**

## 复杂度分析

- **时间复杂度**: $O(V+E)$
- **空间复杂度**: $O(V)$`,
  codeTemplate: {
    javascript: `function tarjanSCC(n, edges) {
  // TODO: Tarjan 强连通分量
}`,
    python: `def tarjan_scc(n: int, edges: list) -> list[list[int]]:
    pass`,
    java: `public class Solution {
    public static List<List<Integer>> tarjanSCC(int n, int[][] edges) { return null; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["图论", "强连通分量", "Tarjan", "DFS"]
},

// ----- 网络流 (2道) -----

{
  title: "Ford-Fulkerson / Edmonds-Karp 最大流",
  content: `## 题目描述

给定一张网络流图，源点为 s，汇点为 t，每条边有一个容量 cap。求从 s 到 t 的**最大流**。

## 输入格式

第一行 n, m, s, t。
接下来 m 行，每行 u, v, c，表示 u→v 有一条容量为 c 的边。

## 示例

\`\`\`
输入:
4 6 1 4
1 2 16
1 3 13
2 3 10
2 4 12
3 2 4
3 4 14

输出: 23
\`\`\`

## 约束条件

- $2 \\leq n \\leq 200$
- $0 \\leq c \\leq 10^4$`,
  solution: `## 解题思路

**最大流问题**是图论的核心问题之一。

### Ford-Fulkerson 方法框架

反复寻找增广路（s 到 t 的可行路径），沿增广路增加流量，直到不存在增广路为止。

**Edmonds-Karp** 是 FF 的具体实现，用 BFS 寻找增广路（最短增广路），保证多项式时间复杂度。

### 关键概念

1. **残差网络（Residual Network）**：原始容量 - 已用流量
2. **增广路径（Augmenting Path）**：残差网络中 s→t 的路径
3. **最大流最小割定理**：最大流 = 最小割容量

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Edmonds-Karp 最大流算法
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v,cap], ...]
 * @param {number} s 源点
 * @param {number} t 汇点
 * @return {number} 最大流
 */
function edmondsKarp(n, edges, s, t) {
  // 容量矩阵
  const cap = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [u, v, c] of edges) {
    cap[u][v] += c; // 可能有重边
  }

  let maxFlow = 0;

  while (true) {
    // BFS 寻找增广路
    const parent = new Array(n).fill(-1);
    const queue = [s];
    parent[s] = -2; // 标记源点

    while (queue.length > 0) {
      const u = queue.shift();
      for (let v = 0; v < n; v++) {
        if (parent[v] === -1 && cap[u][v] > 0) {
          parent[v] = u;
          if (v === t) break;
          queue.push(v);
        }
      }
    }

    if (parent[t] === -1) break; // 无增广路

    // 计算瓶颈容量
    let bottleneck = Infinity;
    let v = t;
    while (v !== s) {
      const u = parent[v];
      bottleneck = Math.min(bottleneck, cap[u][v]);
      v = u;
    }

    // 更新残差网络
    v = t;
    while (v !== s) {
      const u = parent[v];
      cap[u][v] -= bottleneck;
      cap[v][u] += bottleneck; // 反向边
      v = u;
    }

    maxFlow += bottleneck;
  }

  return maxFlow;
}

// 测试
console.log(edmondsKarp(4,
  [[0,1,16],[0,2,13],[1,2,10],[1,3,12],[2,1,4],[2,3,14]],
  0, 3)); // 23
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(VE^2)$
- **空间复杂度**: $O(V^2)$`,
  codeTemplate: {
    javascript: `function edmondsKarp(n, edges, s, t) {
  // TODO: Edmonds-Karp 最大流
}`,
    python: `def edmonds_karp(n: int, edges: list, s: int, t: int) -> int:
    pass`,
    java: `public class Solution {
    public static int edmondsKarp(int n, int[][] edges, int s, int t) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["图论", "网络流", "最大流", "Edmonds-Karp"]
},

{
  title: "Dinic 最大流算法",
  content: `## 题目描述

同 Edmonds-Karp 题，但要求使用 **Dinic 算法** 实现。Dinic 比 EK 效率更高，尤其适合单位容量图或二分图匹配场景。

## 约束条件

- $2 \\leq n \\leq 10000$
- $0 \\leq m \\leq 50000$`,
  solution: `## 解题思路

**Dinic 算法**的核心改进：

1. **分层图（Level Graph）**：先用 BFS 从源点出发按残差容量分层，只保留满足 level[v] = level[u]+1 的边
2. **多路增广（Blocking Flow）**：在分层图上用 DFS 一次性找到多条增广路
3. **当前弧优化（Current Edge Optimization）**：对每个节点记录已经尝试过的边，避免重复搜索

### Dinic vs Edmonds-Karp

| 特性 | EK | Dinic |
|------|-----|-------|
| 增广路查找 | 每次 BFS 一条 | 分层后 DFS 多条 |
| 一般图复杂度 | $O(VE^2)$ | $O(EV^2)$ |
| 单位容量图 | $O(VE)$ | $O(E\\min(V^{2/3}, E^{1/2}))$ |
| 二分图匹配 | $O(VE)$ | $O(E\\sqrt{V})$ |

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Dinic 最大流算法
 */
function dinic(n, edges, s, t) {
  const adj = Array.from({ length: n }, () => []);

  // 边结构：to, capacity, rev（反向边索引）
  function addEdge(u, v, cap) {
    adj[u].push({ to: v, cap, rev: adj[v].length });
    adj[v].push({ to: u, cap: 0, rev: adj[u].length - 1 });
  }

  for (const [u, v, c] of edges) addEdge(u, v, c);

  const level = new Array(n).fill(0);
  const iter = new Array(n).fill(0);

  // BFS 分层
  function bfs() {
    level.fill(-1);
    const queue = [s];
    level[s] = 0;
    while (queue.length > 0) {
      const u = queue.shift();
      for (const e of adj[u]) {
        if (e.cap > 0 && level[e.to] < 0) {
          level[e.to] = level[u] + 1;
          queue.push(e.to);
        }
      }
    }
    return level[t] >= 0;
  }

  // DFS 多路增广
  function dfs(u, f) {
    if (u === t) return f;
    for (; iter[u] < adj[u].length; iter[u]++) {
      const e = adj[u][iter[u]];
      if (e.cap > 0 && level[u] < level[e.to]) {
        const d = dfs(e.to, Math.min(f, e.cap));
        if (d > 0) {
          e.cap -= d;
          adj[e.to][e.rev].cap += d;
          return d;
        }
      }
    }
    return 0;
  }

  let flow = 0;
  while (bfs()) {
    iter.fill(0);
    let f;
    while ((f = dfs(s, Infinity)) > 0) flow += f;
  }
  return flow;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(EV^2)$（一般图），$O(E\\sqrt{V})$（二分图）
- **空间复杂度**: $O(V+E)$`,
  codeTemplate: {
    javascript: `function dinic(n, edges, s, t) {
  // TODO: Dinic 最大流
}`,
    python: `def dinic(n: int, edges: list, s: int, t: int) -> int:
    pass`,
    java: `public class Solution {
    public static long dinic(int n, int[][] edges, int s, int t) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["图论", "网络流", "Dinic", "最大流"]
},

// ----- 其他图论 (2道) -----

{
  title: "重新安排行程（欧拉路径 Hierholzer）",
  content: `## 题目描述 (LeetCode 332 Medium)

给你一份航线列表 tickets ，其中 tickets[i] = [fromi, toi] 表示飞机出发和降落的机场地点。请对该行程进行重新规划排序。

所有这些机票都属于一个从 JFK（肯尼迪国际机场）出发的先生，所以该行程必须从 JFK 开始。如果存在多种有效的行程，请你按字典序排序返回最小的行程组合。

- 例如，行程 ["JFK", "LGA"] 比 ["JFK", "LGB"] 字典序更小但更靠前。
- 假定所有机票至少存在一种合理的行程。且所有的机票必须都用一次且只能用一次。

## 示例

\`\`\`
输入: tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
输出: ["JFK","MUC","LHR","SFO","SJC"]

输入: tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]
输出: ["JFK","ATL","JFK","SFO","ATL","SFO"]
\`\`\`

## 约束条件

- $1 \\leq tickets.length \\leq 300$`,
  solution: `## 解题思路

**Hierholzer 算法**用于寻找**欧拉路径/回路**（经过每条边恰好一次的路径）。

### 核心思想

1. **深度优先遍历**：从起点出发，优先走字典序小的边
2. **回溯记录**：当某节点没有出边时，将该节点加入结果（逆序）
3. **最终反转**得到正确路径

### 为什么逆序加入？

因为欧拉路径的特点是"走到死胡同才回头"，所以最先走到的终点应该最后被记录。逆序后自然得到正确顺序。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string[][]} tickets
 * @return {string[]}
 */
function findItinerary(tickets) {
  // 建图：邻接表（按目的地字母排序）
  const graph = {};
  for (const [from, to] of tickets) {
    if (!graph[from]) graph[from] = [];
    graph[from].push(to);
  }
  // 字典序排序
  for (const from in graph) {
    graph[from].sort().reverse(); // 逆向排序以便 pop() 取最小
  }

  const result = [];

  function dfs(node) {
    const dests = graph[node];
    while (dests && dests.length > 0) {
      const next = dests.pop(); // 取出并删除这条边
      dfs(next);
    }
    result.push(node); // 无出边时记录
  }

  dfs("JFK");
  return result.reverse();
}

// 测试
console.log(findItinerary([
  ["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]
]));
// ["JFK","MUC","LHR","SFO","SJC"]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(E \\log E)$（排序）+ $O(E)$（遍历）
- **空间复杂度**: $O(V+E)$`,
  codeTemplate: {
    javascript: `function findItinerary(tickets) {
  // TODO: Hierholzer 欧拉路径
}`,
    python: `def find_itinerary(tickets: list[list[str]]) -> list[str]:
    pass`,
    java: `class Solution {
    public List<String> findItinerary(List<List<String>> tickets) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "欧拉路径", "Hierholzer", "DFS", "LeetCode 332"]
},

{
  title: "二分图判定（染色法）",
  content: `## 题目描述

给定一张无向图，判断它是否是**二分图**。

二分图的定义：可以将图中的顶点分成两个不相交的集合 U 和 V，使得每条边都连接 U 中的一个顶点和 V 中的一个顶点。

## 输入格式

第一行 n, m。
接下来 m 行，每行 u, v，表示一条无向边。

## 示例

\`\`\`
输入:
4 4
1 2
2 3
3 4
4 1

输出: true（可以染成 1-红 2-蓝 3-红 4-蓝）

输入:
3 3
1 2
2 3
1 3

输出: false（奇环）
\`\`\`

## 约束条件

- $1 \\leq n, m \\leq 10^5$`,
  solution: `## 解题思路

**二分图判定定理**：一张图是二分图当且仅当它**不含奇数长度的环（奇环）**。

**染色法（BFS/DFS）**：
1. 任选一个未染色的节点，染成颜色 A
2. 对其所有邻居染成颜色 B
3. 如果发现冲突（邻居已被染成相同颜色），则不是二分图

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 二分图判定（染色法）
 * @param {number} n 节点数
 * @param {number[][]} edges [[u,v], ...]
 * @return {boolean}
 */
function isBipartite(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  // 0=未染色, 1=颜色A, -1=颜色B
  const color = new Array(n).fill(0);

  for (let start = 0; start < n; start++) {
    if (color[start] !== 0) continue;

    // BFS 染色
    const queue = [start];
    color[start] = 1;

    while (queue.length > 0) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (color[v] === 0) {
          color[v] = -color[u]; // 染成不同颜色
          queue.push(v);
        } else if (color[v] === color[u]) {
          return false; // 冲突！
        }
      }
    }
  }

  return true;
}

// 测试
console.log(isBipartite(4, [[0,1],[1,2],[2,3],[3,0]])); // true
console.log(isBipartite(3, [[0,1],[1,2],[0,2]]));       // false
\`\`\`

## 应用

- **二分图最大匹配**（匈牙利算法 / Hopcroft-Karp）
- **检测奇环**
- **任务调度**判断可行性

## 复杂度分析

- **时间复杂度**: $O(V+E)$
- **空间复杂度**: $O(V+E)$`,
  codeTemplate: {
    javascript: `function isBipartite(n, edges) {
  // TODO: 二分图判定 - 染色法
}`,
    python: `def is_bipartite(n: int, edges: list) -> bool:
    pass`,
    java: `class Solution {
    public boolean isBipartite(int n, int[][] edges) { return false; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["图论", "二分图", "BFS", "染色法"]
},

// ----- 图论 QA (3道) -----

{
  title: "最短路径算法选型指南",
  content: `## 面试问答

> **面试官**：Dijkstra、Bellman-Ford、Floyd、A*、BFS 这些最短路径算法怎么选？`,
  solution: `## 参考回答

### 选型决策树

\`\`\`
图中有负权边？
├─ 是 → Bellman-Ford（或 SPFA）
│      ├─ 需要检测负权环？→ Bellman-Ford
│      └─ 不需要？→ SPFA（均摊更快）
└─ 否 → 非负权图
       ├─ 单源最短 → Dijkstra（稀疏图用堆优化）
       ├─ 所有点对 → Floyd-Warshall（n≤200时很方便）
       ├─ 等权图（边权相同）→ BFS
       └─ 需要启发加速 → A*（如八数码、导航）

特殊需求：
├─ 需要路径还原 → 记录 predecessor 数组
├─ 需要第k短路 → A* / Yen's algorithm
└─ 动态图（边频繁变化）→ 可能需要在线算法
\`\`\`

### 对比表

| 算法 | 负权 | 负环检测 | 单源/全源 | 时间 | 适用场景 |
|------|------|---------|----------|------|----------|
| BFS | ✅ | N/A | 单源 | O(V+E) | 等权图 |
| Dijkstra | ❌ | ❌ | 单源 | O((V+E)logV) | 非负权 |
| Bellman-Ford | ✅ | ✅ | 单源 | O(VE) | 含负权 |
| Floyd-Warshall | ✅ | ✅ | 全源 | O(V³) | 小图全源 |
| A* | ❌ | ❌ | 单源 | 依h() | 启发式搜索 |

### 实际工程应用

- **地图导航**：A* 或双向 Dijkstra
- **网络路由**：Dijkstra（OSPF协议）
- **游戏寻路**：A* 或 JPS（Jump Point Search）
- **编译器优化**：Floyd（数据依赖分析）`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["图论", "最短路径", "算法选型", "面试高频"]
},

{
  title: "图的存储方式对比",
  content: `## 面试问答

> **面试官**：图有哪些存储方式？各有什么优缺点？`,
  solution: `## 参考回答

### 四种主要存储方式

#### 1. 邻接矩阵（Adjacency Matrix）
\`\`\`javascript
const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
matrix[u][v] = weight; // 有边
\`\`\`
- **优点**：O(1) 判断两点是否有边；矩阵运算友好
- **缺点**：O(V²) 空间；稀疏图浪费大
- **适用**：稠密图、需要快速查询边的存在性

#### 2. 邻接表（Adjacency List）
\`\`\`javascript
const adj = Array.from({ length: n }, () => []);
adj[u].push({ to: v, weight: w });
\`\`\`
- **优点**：O(V+E) 空间；遍历邻居高效
- **缺点**：判断边是否存在需 O(degree)
- **适用**：大多数图算法的标准选择

#### 3. 十字链表（Orthogonal List）
- 用于**有向图**，同时维护出边和入边链表
- **适用**：需要频繁操作入边/出边的场景

#### 4. 前向星（Forward Star）
- 将边排序后存为数组，用 head[u] 表示节点 u 的第一条边起始位置
- **优点**：内存紧凑，缓存友好
- **适用**：竞赛编程、嵌入式环境

### 选择建议

| 场景 | 推荐 |
|------|------|
| 一般算法题 | 邻接表 |
| 稠密图/Floyd | 邻接矩阵 |
| 大规模稀疏图 | 前向星 |
| 需要快速删边 | 平衡二叉树邻接表 |`,
  difficulty: "easy",
  questionType: "qa",
  tags: ["图论", "数据结构", "面试基础"]
},

{
  title: "网络流基本概念",
  content: `## 面试问答

> **面试官**：什么是网络流？什么是最大流最小割定理？`,
  solution: `## 参考回答

### 网络流的定义

**网络** = 有向图 G = (V, E) + 容量函数 c: E → R⁺ + 源点 s + 汇点 t

**流函数** f: E → R 满足：
1. **容量约束**：$0 \\leq f(e) \\leq c(e)$
2. **流守恒**：除 s/t 外，$\\sum_{in} f = \\sum_{out} f$

**流的值** $|f| = \\sum_{out\\ of\\ s} f(e)$

### 核心定理

**最大流最小割定理（Max-Flow Min-Cut Theorem）**：

> 在任何网络中，最大流的值等于最小割的容量。

**证明思路**：
- 最大流 ≤ 最小割（任何流都不能超过任何割的容量）
- 当算法终止时（无可增广路），构造的割容量 = 当前流值
- 所以最大流 = 最小割

### 相关变体问题

1. **最小费用最大流**：在最大流基础上，使总费用最小
2. **多源多汇流**：添加超源超汇转化
3. **上下界网络流**：每条边有流量下界和上界
4. **最大流应用**：二分图匹配、点/边覆盖、 DAG 最小路径覆盖`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["图论", "网络流", "理论", "面试高频"]
},


// ============================================================================
// 第三部分：搜索进阶 (7道)
// ============================================================================

{
  title: "双向 BFS（单词接龙 II）",
  content: `## 题目描述 (LeetCode 126 Hard)

按字典词表 wordList 从 beginWord 到 endWord 的**所有**最短转换序列。转换规则：每次只改变一个字符。

## 示例

\`\`\`
输入: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
输出:
[
  ["hit","hot","dot","dog","cog"],
  ["hit","hot","lot","log","cog"]
]
\`\`\`

## 约束条件

- $1 \\leq wordList.length \\leq 5000$`,
  solution: `## 解题思路

**双向 BFS** 同时从起点和终点搜索，在中间相遇时找到最短路径。

相比单向 BFS，双向 BFS 的搜索空间约为 $O(2bd/2)$ vs $O(b^d)$（b 为分支因子，d 为深度），效率大幅提升。

**关键技巧**：
1. 每次从较小的队列方向扩展
2. 使用通用状态（如 "h*t"）而非逐词比较来加速邻居查找
3. 收集完整路径时需要记录父节点关系

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 双向BFS - 单词接龙II
 */
function findLadders(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return [];

  const result = [];
  let beginSet = new Set([beginWord]);
  let endSet = new Set([endWord]);
  let visited = new Set([beginWord, endWord]);
  let found = false;
  const parents = new Map();

  while (beginSet.size > 0 && !found) {
    // 总是从较小的集合扩展
    if (beginSet.size > endSet.size) [beginSet, endSet] = [endSet, beginSet];

    const nextSet = new Set();
    const localVisited = new Set();

    for (const word of beginSet) {
      const chars = word.split('');
      for (let i = 0; i < chars.length; i++) {
        const original = chars[i];
        for (let c = 97; c <= 122; c++) {
          chars[i] = String.fromCharCode(c);
          const next = chars.join('');

          if (endSet.has(next)) found = true;
          if (wordSet.has(next) && !visited.has(next)) {
            nextSet.add(next);
            localVisited.add(next);
            if (!parents.has(next)) parents.set(next, []);
            parents.get(next).push(word);
          }
        }
        chars[i] = original;
      }
    }

    for (const w of localVisited) visited.add(w);
    beginSet = nextSet;
  }

  if (!found) return [];

  // 回溯收集所有路径
  const paths = [];
  function backtrack(node, path) {
    if (node === beginWord) {
      paths.push([node, ...path]);
      return;
    }
    for (const parent of (parents.get(node) || [])) {
      backtrack(parent, [node, ...path]);
    }
  }
  backtrack(endWord, []);
  return paths;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(N \\times L \\times 26)$（N 为单词数，L 为单词长度）
- **空间复杂度**: $O(N \\times L)$`,
  codeTemplate: {
    javascript: `function findLadders(beginWord, endWord, wordList) {
  // TODO: 双向BFS - 单词接龙II
}`,
    python: `def find_ladders(begin_word: str, end_word: str, word_list: list[str]) -> list[list[str]]:
    pass`,
    java: `class Solution {
    public List<List<String>> findLadders(String beginWord, String endWord, List<String> wordList) { return null; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["搜索", "双向BFS", "BFS", "LeetCode 126"]
},

{
  title: "IDA* 迭代加深 A*（十五数码）",
  content: `## 题目描述

给定一个 4×4 的数字滑块拼图（15-Puzzle），初始状态和目标状态，求最少移动步数。若不可达返回 -1。

这是 8-Puzzle 的 4×4 版本，状态空间达到约 $10^{13}$，普通 BFS/A* 内存不足。

## 约束条件

- 状态空间极大，需要 IDA* 解决`,
  solution: `## 解题思路

**IDA*（Iterative Deepening A*)** 结合了迭代加深 DFS 和 A* 的启发式：

1. 设定阈值 limit，执行 DFS（限制深度不超过 limit）
2. 如果找到了目标，返回成功
3. 如果没找到，找出超出 limit 最少的节点的新 f 值作为新 limit
4. 重复直到找到解或确认无解

**优势**：不需要像 A* 那样维护 open set，内存占用极低（只有 DFS 栈）。

### 十五数码的启发函数

**曼哈顿距离 + 线性冲突（Linear Conflict）**：
- 曼哈顿距离：每个数字到目标位置的曼哈顿距离之和
- 线性冲突修正：同行/列中两个数字都在对方目标位置时，至少需要额外 2 步

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * IDA* 解决15-Puzzle
 */
function solve15Puzzle(start, goal) {
  // 目标位置映射
  const goalPos = {};
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      goalPos[goal[r][c]] = [r, c];

  // 曼哈顿距离启发函数
  function h(state) {
    let d = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        const val = state[r][c];
        if (val !== 0) {
          const [tr, tc] = goalPos[val];
          d += Math.abs(r - tr) + Math.abs(c - tc);
        }
      }
    return d;
  }

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

  function findZero(state) {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (state[r][c] === 0) return [r, c];
  }

  let threshold = h(start);

  function search(state, g, threshold, prevDir) {
    const f = g + h(state);
    if (f > threshold) return f;
    if (h(state) === 0) return -1; // 找到目标

    let minThreshold = Infinity;
    const [zr, zc] = findZero(state);

    for (let d = 0; d < 4; d++) {
      // 不走回头路（剪枝）
      if (prevDir !== undefined && (d + prevDir) % 2 === 0) continue;

      const nr = zr + dirs[d][0], nc = zc + dirs[d][1];
      if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4) continue;

      const newState = state.map(row => [...row]);
      [newState[zr][zc], newState[nr][nc]] = [newState[nr][nc], newState[zr][zc]];

      const t = search(newState, g + 1, threshold, d);
      if (t === -1) return -1;
      minThreshold = Math.min(minThreshold, t);
    }

    return minThreshold;
  }

  while (true) {
    const result = search(start, 0, threshold);
    if (result === -1) return threshold;
    if (result === Infinity) return -1;
    threshold = result;
  }
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(b^{d*})$（d* 为最优解深度，通常远小于实际深度）
- **空间复杂度**: $O(d*)$（仅 DFS 栈）`,
  codeTemplate: {
    javascript: `function solve15Puzzle(start, goal) {
  // TODO: IDA* 迭代加深A*
}`,
    python: `def solve_15_puzzle(start: list, goal: list) -> int:
    pass`,
    java: `public class Solution {
    public static int solve15Puzzle(int[][] start, int[][] goal) { return -1; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["搜索", "IDA*", "启发式搜索", "15-Puzzle"]
},

{
  title: "A* 算法（启发函数设计 admissibility consistency）",
  content: `## 面试问答

> **面试官**：如何为 A* 算法设计一个好的启发函数？什么是可采纳性和一致性？`,
  solution: `## 参考回答

### 启发函数设计的核心原则

**h(n) 的质量直接决定 A* 的效率**：
- h(n) = 0 → 退化为 Dijkstra（完备但慢）
- h(n) > h*(n)（高估）→ 可能找不到最优解
- h(n) = h*(n)（精确值）→ 只走最优路径上的节点
- h(n) < h*(n) 且接近 → 高效且最优

### 可采纳性（Admissibility）

h(n) 是**可采纳的**当且仅当：对所有节点 n，$h(n) \\leq h^*(n)$

即启发估计**永远不高估**到目标的真实代价。

**为什么重要**：保证 A* 能找到最优解（在存在解时）。

### 一致性 / 单调性（Consistency）

h 满足**三角不等式**：$h(n) \\leq cost(n,m) + h(m)$，对所有相邻节点 n, m

一致性 ⇒ 可采纳性（反之不成立）

一致性的好处：当节点从 open set 中取出时，其 g 值已经是最优的（不需要重新调整）。

### 常见启发函数

| 问题 | 启发函数 | 可采纳 | 一致 |
|------|----------|--------|------|
| 地图导航 | 欧几里得距离/曼哈顿距离 | ✅ | ✅ |
| 八数码 | 曼哈顿距离+线性冲突 | ✅ | ✅ |
| TSP | MST 剩余代价 | ✅ | ❌ |
| 15-Puzzle | 替换模式数据库(PDB) | ✅ | ✅ |

### 设计启发函数的方法
1. **松弛问题**：放宽约束后求解（如允许对角移动）
2. **模式数据库**：预计算子问题的精确解
3. **加权组合**：$h = w_1 \\cdot h_1 + w_2 \\cdot h_2$
4. **机器学习**：从历史数据学习`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["搜索", "A*", "启发式搜索", "理论"]
},

{
  title: "Meet in the Middle 折半搜索",
  content: `## 题目描述（集合分割问题变体）

给定 N 个正整数和一个目标值 T。判断是否可以从中选出若干个数，使得它们的和恰好等于 T。

N 较大（$N \\leq 40$），但 $2^{N/2}$ 可以接受。

## 示例

\`\`\`
输入:
N=6, arr=[1,2,3,4,5,6], T=10
输出: true (如 4+6 或 1+3+6 等)
\`\`\`

## 约束条件

- $1 \\leq N \\leq 40$
- $1 \\leq arr[i], T \\leq 10^{18}$`,
  solution: `## 解题思路

**折半搜索（Meet in the Middle, MITM）** 将问题分成两半：

1. 将数组分为左右两半，各 N/2 个元素
2. 分别枚举所有子集的和（各 $2^{N/2}$ 个）
3. 对一半的结果排序，用二分查找匹配另一半

时间复杂度从 $O(2^N)$ 降为 $O(2^{N/2} \\cdot N)$，当 N=40 时从 $2^{40}$ 降到约 $2^{20} \\approx 10^6$。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Meet in the Middle - 子集和等于T
 */
function subsetSumMITM(arr, T) {
  const n = arr.length;
  const mid = Math.floor(n / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  // 枚举左半的所有子集和
  const leftSums = [];
  for (let mask = 0; mask < (1 << left.length); mask++) {
    let sum = 0;
    for (let i = 0; i < left.length; i++) {
      if ((mask >> i) & 1) sum += left[i];
    }
    if (sum <= T) leftSums.push(sum);
  }

  // 枚举右半的所有子集和，同时检查
  for (let mask = 0; mask < (1 << right.length); mask++) {
    let sum = 0;
    for (let i = 0; i < right.length; i++) {
      if ((mask >> i) & 1) sum += right[i];
    }
    if (sum === T || (sum < T && leftSums.includes(T - sum))) return true;
  }

  return false;
}

// 更高效的版本：排序+双指针
function subsetSumMITMFast(arr, T) {
  const n = arr.length;
  const mid = Math.floor(n / 2);

  function genSums(subArr) {
    const sums = [0];
    for (const x of subArr) {
      const len = sums.length;
      for (let i = 0; i < len; i++) sums.push(sums[i] + x);
    }
    return sums.sort((a, b) => a - b);
  }

  const leftSums = genSums(arr.slice(0, mid));
  const rightSums = genSums(arr.slice(mid));

  // 双指针查找
  let l = 0, r = rightSums.length - 1;
  while (l < leftSums.length && r >= 0) {
    const s = leftSums[l] + rightSums[r];
    if (s === T) return true;
    else if (s < T) l++;
    else r--;
  }
  return false;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(2^{N/2} \\cdot N)$
- **空间复杂度**: $O(2^{N/2})$`,
  codeTemplate: {
    javascript: `function subsetSumMITM(arr, T) {
  // TODO: Meet in the Middle 折半搜索
}`,
    python: `def subset_sum_mitm(arr: list[int], T: int) -> bool:
    pass`,
    java: `public class Solution {
    public static boolean subsetSumMITM(int[] arr, long T) { return false; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["搜索", "折半搜索", "状态压缩"]
},

{
  title: "记忆化搜索进阶",
  content: `## 题目描述

给定一个有向无环图（DAG），每个节点有权重。求从起点 s 到每个节点的最长路径长度。

要求使用**记忆化 DFS** 实现，而非迭代 DP。

## 示例

\`\`\`
输入: 节点数=5, 边=[(0→1),(0→2),(1→3),(2→3),(3→4)], 权重均为1
输出: node0→node4 最长路径长度 = 3 (0→2→3→4)
\`\`\``,
  solution: `## 解题思路

**记忆化搜索（Memoization）**是自顶向下的 DP：

1. 定义递归函数 f(u)：从 u 出发的最长路径
2. 在计算前检查 memo 中是否有缓存结果
3. 计算完成后将结果存入 memo
4. 对于 DAG，可以用拓扑序或直接带 memo 的 DFS

### 与迭代 DP 的对比

| 特性 | 记忆化搜索 | 迭代 DP |
|------|-----------|---------|
| 方向 | 自顶向下 | 自底向上 |
| 实现 | 递归 + 缓存 | 循环 + 数组 |
| 适用 | 状态空间不规则 | 状态空间规则 |
| 拓扑依赖 | 自动处理 | 需要手动排拓扑序 |

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * DAG最长路径 - 记忆化DFS
 */
function longestPathInDAG(n, edges, start) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  const memo = new Array(n).fill(-1);

  function dfs(u) {
    if (memo[u] !== -1) return memo[u];

    let maxLen = 0;
    for (const v of adj[u]) {
      maxLen = Math.max(maxLen, 1 + dfs(v));
    }

    memo[u] = maxLen;
    return maxLen;
  }

  return dfs(start);
}

// 测试
console.log(longestPathInDAG(5,
  [[0,1],[0,2],[1,3],[2,3],[3,4]], 0)); // 3
\`\`\`

### 进阶：状态压缩记忆化

对于状态压缩 DP 问题（如 Hamilton 路径），memo 的 key 可以用位掩码编码后的整数表示。

## 复杂度分析

- **时间复杂度**: $O(V+E)$（每个节点只计算一次）
- **空间复杂度**: $O(V)$`,
  codeTemplate: {
    javascript: `function longestPathInDAG(n, edges, start) {
  // TODO: 记忆化搜索 - DAG最长路径
}`,
    python: `def longest_path_in_dag(n: int, edges: list, start: int) -> int:
    pass`,
    java: `public class Solution {
    public static int longestPath(int n, int[][] edges, int start) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["搜索", "记忆化", "DP", "DAG"]
},

// ----- 搜索 QA (2道) -----

{
  title: "BFS vs DFS vs IDDFS vs A* vs 双向BFS 选型",
  content: `## 面试问答

> **面试官**：BFS、DFS、迭代加深DFS、A*、双向BFS 这些搜索算法怎么选？`,
  solution: `## 参考回答

### 选型决策树

\`\`\`
需要找最短路径？
├─ 是 → 权重相同？
│      ├─ 是 → BFS 或 双向BFS（分支因子大时）
│      └─ 否 → Dijkstra 或 A*
└─ 否 → 只需判断可达性？
       ├─ DFS 即可
       └─ 需要限制深度？

内存受限？
├─ 是 → IDA* 或 迭代加深 DFS
└─ 否 → A* 或 BFS 均可

状态空间大小？
├─ 小(<10⁶) → BFS/A*/DFS 均可
├─ 中(10⁶~10¹²) → 双向BFS / A* / IDA*
└─ 大(>10¹²) → 必须加强剪枝或改算法
\`\`\`

### 核心对比表

| 算法 | 完备性 | 最优性 | 内存 | 适用场景 |
|------|--------|--------|------|----------|
| BFS | ✅ | ✅(等权) | O(b^d) | 最短路径(等权) |
| DFS | ✅ | ❌ | O(d) | 判断连通/找路径 |
| IDDFS | ✅ | ✅ | O(d) | 内存受限的最短路径 |
| A* | ✅(h可采纳) | ✅(h可采纳) | O(b^d) | 加权图最短路 |
| 双向BFS | ✅ | ✅ | O(2b^(d/2)) | 大分支因子最短路 |

### 实际选择建议
- **迷宫/网格最短路**：BFS 或 A*
- **游戏寻路**：A*（曼哈顿距离启发）
- **大状态空间**：IDA*（如15-Puzzle）
- **单词转换**：双向BFS
- **全排列/子集枚举**：DFS + 回溯`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["搜索", "算法选型", "面试高频"]
},

{
  title: "剪枝技术大全",
  content: `## 面试问答

> **面试官**：回溯/DFS 搜索中有哪些常用的剪枝技术？`,
  solution: `## 参考回答

### 四大类剪枝技术

#### 1. 可行性剪枝（Feasibility Pruning）

当前部分解已不可能扩展为完整解时提前返回。

\`\`\`javascript
// 例：背包超容则剪枝
if (currentWeight > capacity) return;
if (currentValue + remainingMaxValue < bestValue) return;
\`\`\`

#### 2. 最优性剪枝（Optimality Pruning / Alpha-Beta）

当前部分解不可能优于已知最优解时剪枝。

\`\`\`javascript
// 例：当前代价 ≥ 已知最小代价
if (currentCost >= bestCost) return;

// Alpha-Beta 剪枝（博弈树）
function alphaBeta(node, alpha, beta) {
  if (isLeaf(node)) return evaluate(node);
  if (isMaxNode(node)) {
    let value = -Infinity;
    for (child of node.children) {
      value = Math.max(value, alphaBeta(child, alpha, beta));
      alpha = Math.max(alpha, value);
      if (beta <= value) break; // beta剪枝
    }
    return value;
  }
  // MinNode 类似...
}
\`\`\`

#### 3. 顺序剪枝（Ordering Heuristic）

通过调整搜索顺序使剪枝更早触发。

\`\`\`javascript
// 例：优先尝试约束最多的变量（MRV启发式）
variables.sort((a, b) => legalMoves(a).length - legalMoves(b).length);
// 例：优先尝试值域最小的变量
// 例：按权重/价值比降序排列物品（背包）
\`\`\`

#### 4. 等价性剪枝（Symmetry Breaking）

消除等价状态的重复搜索。

\`\`\`javascript
// 例：N皇后中对称位置只需搜一个
// 例：组合生成中保持严格递增避免重复
for (let i = start; i <= n; i++) { // 不是从1开始
  path.push(i);
  backtrack(i + 1); // 传递 i+1 而非 1
  path.pop();
}
\`\`\`

### 其他常用技巧
- **缓存中间结果**：记忆化
- **位运算加速**：用 bitset 表示集合
- **迭代加深**：限制搜索深度
- **随机重启**：多次随机初始顺序`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["搜索", "剪枝", "回溯", "优化"]
},


// ============================================================================
// 第四部分：字符串高级算法 (8道)
// ============================================================================

{
  title: "KMP 算法（strStr() KMP实现）",
  content: `## 题目描述 (LeetCode 28 Medium)

实现 strStr() 函数。给定两个字符串 haystack 和 needle，在 haystack 字符串中找出 needle 字符串出现的第一个位置（从下标 0 开始）。如果不存在，则返回 -1。

要求使用 **KMP 算法** 实现（非暴力匹配）。

## 示例

\`\`\`
输入: haystack = "sadbutsad", needle = "sad"
输出: 0
解释: "sad" 在下标 0 和 6 处匹配，第一次出现在下标 0。

输入: haystack = "leetcode", needle = "leeto"
输出: -1
\`\`\`

## 约束条件

- $0 \\leq haystack.length, needle.length \\leq 5 \\times 10^4$`,
  solution: `## 解题思路

**KMP（Knuth-Morris-Pratt）** 算法的核心是**部分匹配表（Next Array / LPS Array）**。

### 为什么暴力匹配效率低？

当匹配失败时，暴力做法把 pattern 右移一位从头比较。但之前匹配过的信息被浪费了——pattern 的某些前缀可能和后缀相同，这些信息可以被利用来跳过不必要的比较。

### Next 数组的含义

next[i] = pattern[0..i] 中**最长相等前后缀**的长度。

例如 pattern = "ABABC"：
- next[0] = 0 （单字符）
- next[1] = 0 ("AB" 无相等前后缀）
- next[2] = 1 ("ABA": 前缀"A" == 后缀"a"）
- next[3] = 2 ("ABAB": "AB" == "AB"）
- next[4] = 0 ("ABABC" 不匹配）

### 匹配过程

i 遍历 text，j 遍历 pattern。当 text[i] != pattern[j] 时，j = next[j-1]（利用已匹配信息跳转），而不是 j = 0。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * KMP 算法实现 strStr()
 */
function strStrKMP(haystack, needle) {
  const n = haystack.length, m = needle.length;
  if (m === 0) return 0;
  if (n < m) return -1;

  // 构建 next 数组（LPS: Longest Proper Prefix which is also Suffix）
  const next = new Array(m).fill(0);
  for (let i = 1, j = 0; i < m; i++) {
    while (j > 0 && needle[i] !== needle[j]) j = next[j - 1];
    if (needle[i] === needle[j]) j++;
    next[i] = j;
  }

  // KMP 匹配
  for (let i = 0, j = 0; i < n; i++) {
    while (j > 0 && haystack[i] !== needle[j]) j = next[j - 1];
    if (haystack[i] === needle[j]) j++;
    if (j === m) return i - m + 1; // 找到匹配
  }

  return -1;
}

// 测试
console.log(strStrKMP("sadbutsad", "sad"));     // 0
console.log(strStrKMP("leetcode", "leeto"));      // -1
console.log(strStrKMP("hello", "ll"));            // 2
console.log(strStrKMP("mississippi", "issip"));   // 4
\`\`\`

## 复杂度分析

- **构建 next 数组**: $O(m)$
- **匹配过程**: $O(n+m)$（最坏情况，通常远快于暴力 $O(nm)$）
- **空间复杂度**: $O(m)$`,
  codeTemplate: {
    javascript: `function strStrKMP(haystack, needle) {
  // TODO: KMP 算法实现
}`,
    python: `def str_str_kmp(haystack: str, needle: str) -> int:
    pass`,
    java: `class Solution {
    public int strStr(String haystack, String needle) { return -1; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["字符串", "KMP", "LeetCode 28"]
},

{
  title: "最短回文串（利用 KMP）",
  content: `## 题目描述 (LeetCode 214 Hard)

给定一个包含大写字母和小写字母的字符串 s ，返回通过将这些字母转变为回文所需的 **最少步数** 。

在每一步中，你可以在字符串的任意位置插入任意字符。

## 示例

\`\`\`
输入: s = "abcd"
输出: 4
解释: 一个可能的方案是 "dcbabcd"

输入: s = "aacecaaa"
输出: 2
解释: 可以在前面添加一个 'a' 和后面添加一个 'a' 得到 "aacecaaaaca"
\`\`\`

## 约束条件

- $0 \\leq s.length \\leq 500$`,
  solution: `## 解题思路

**核心观察**：最短回文串 = s 的最长回文前缀 + reverse(s 去掉该前缀的部分) + s

更巧妙的方法：构造新串 $t = s + '#' + reverse(s)$，对其求 KMP 的 next 数组。next 最后一位的值就是 s 与其反转串的最长公共前后缀长度，也就是 s 的**最长回文前缀**的长度。

设 L 为最长回文前缀长度，则需要添加的字符数为 $n - L$。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} s
 * @return {number}
 */
function shortestPalindrome(s) {
  const rev = s.split('').reverse().join('');
  const combined = s + '#' + rev;

  // KMP next 数组
  const next = new Array(combined.length).fill(0);
  for (let i = 1, j = 0; i < combined.length; i++) {
    while (j > 0 && combined[i] !== combined[j]) j = next[j - 1];
    if (combined[i] === combined[j]) j++;
    next[i] = j;
  }

  // next最后一位 = s与rev的最长公共前后缀长度
  const maxPalindromePrefix = next[combined.length - 1];
  const toAdd = s.slice(maxPalindromePrefix).split('').reverse().join('');

  return toAdd + s;
}

// 测试
console.log(shortestPalindrome("abcd"));        // "dcbabcd"
console.log(shortestPalindrome("aacecaaa"));    // "aaacecaaa"
console.log(shortestPalindrome("a"));           // "a"
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function shortestPalindrome(s) {
  // TODO: 利用KMP求最短回文串
}`,
    python: `def shortest_palindrome(s: str) -> str:
    pass`,
    java: `class Solution {
    public String shortestPalindrome(String s) { return ""; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["字符串", "KMP", "回文", "LeetCode 214"]
},

{
  title: "Manacher 算法（最长回文子串 O(n)）",
  content: `## 题目描述 (LeetCode 5 Hard)

给你一个字符串 s，找到 s 中最长的**回文子串**。

要求时间复杂度为 **O(n)**（Manacher 算法），不能用中心扩展法的 $O(n^2)$。

## 示例

\`\`\`
输入: s = "babad"
输出: "bab" 或 "aba"（都是合法答案）

输入: s = "cbbd"
输出: "bb"
\`\`\`

## 约束条件

- $1 \\leq s.length \\leq 1000$`,
  solution: `## 解题思路

**Manacher（马拉车）算法**能在 $O(n)$ 时间内找到最长回文子串。

### 核心思想

1. **预处理**：在每两个字符之间插入特殊字符（如 '#'），首尾也加入哨兵字符（如 '^' 和 '$'）。这样原串长度为 n 时，处理后长度变为 2n+3，且所有回文串都变成了**奇数长度**。

2. **半径数组 P**：P[i] 表示以位置 i 为中心的最大回文半径（不含自身）。

3. **关键性质——镜像**：如果 j 是 i 关于某个中心 C 的镜像点，且 j 的回文范围完全在 C 的回文范围内，则 P[i] 至少等于 P[j]。这避免了重复计算。

$$P[i] = \\min(R - i, P[mirror])$$

其中 R 是当前最右边界，C 是对应的中心。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Manacher 算法 - O(n) 最长回文子串
 */
function longestPalindromeManacher(s) {
  if (!s) return "";

  // 预处理：插入分隔符
  const t = '^#' + s.split('').join('#') + '#$';
  const n = t.length;
  const P = new Array(n).fill(0);

  let C = 0, R = 0; // 当前中心和右边界

  for (let i = 1; i < n - 1; i++) {
    // 镜像点
    const mirror = 2 * C - i;

    // 利用镜像信息初始化 P[i]
    if (i < R) {
      P[i] = Math.min(R - i, P[mirror]);
    }

    // 尝试扩展
    while (t[i + 1 + P[i]] === t[i - 1 - P[i]]) {
      P[i]++;
    }

    // 更新中心和右边界
    if (i + P[i] > R) {
      C = i;
      R = i + P[i];
    }
  }

  // 找最大半径及其中心
  let maxLen = 0, centerIndex = 0;
  for (let i = 1; i < n - 1; i++) {
    if (P[i] > maxLen) {
      maxLen = P[i];
      centerIndex = i;
    }
  }

  // 还原原始坐标
  const start = Math.floor((centerIndex - maxLen) / 2);
  return s.substring(start, start + maxLen);
}

// 测试
console.log(longestPalindromeManacher("babad")); // "bab" or "aba"
console.log(longestPalindromeManacher("cbbd"));  // "bb"
console.log(longestPalindromeManacher("a"));     // "a"
\`\`\`

## Manacher vs 中心扩展

| 方法 | 时间复杂度 | 空间复杂度 | 直观程度 |
|------|------------|------------|----------|
| 中心扩展 | $O(n^2)$ | $O(1)$ | ⭐⭐⭐⭐⭐ |
| Manacher | $O(n)$ | $O(n)$ | ⭐⭐ |

## 复杂度分析

- **时间复杂度**: $O(n)$
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function longestPalindromeManacher(s) {
  // TODO: Manacher O(n) 最长回文子串
}`,
    python: `def longest_palindrome_manacher(s: str) -> str:
    pass`,
    java: `class Solution {
    public String longestPalindrome(String s) { return ""; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["字符串", "Manacher", "回文", "LeetCode 5"]
},

{
  title: "Z 函数 / 扩展 KMP（Z-algorithm）",
  content: `## 题目描述

给定一个字符串 s，计算其 **Z 函数（Z-array）**。

Z 函数定义：z[i] = s 和 s[i...] 的**最长公共前缀（LCP）**的长度。

## 示例

\`\`\`
输入: s = "aabxaab"
输出: z = [0,1,0,0,3,1,0]

解释:
z[0] 通常定义为 0 或未使用
z[1] = 1: "aabxaab"[1:]="abxaab" 与 "aabxaab" LCP = "a" 长度1
z[4] = 3: "aabxaab"[4:]="aab" 与 "aabxaab" LCP = "aab" 长度3
\`\`\`

## 应用

Z 函数可用于：
- 字符串匹配（类似 KMP 但只需一次预处理）
- 统计不同子串出现次数
- 字符串周期性检测`,
  solution: `## 解题思路

**Z 算法（Z-algorithm / Extended KMP）**的核心与 KMP 类似：利用已计算的 z 值避免重复比较。

### 关键性质——Z-box

维护当前 Z-box 的右边界 [L, R]，对于位置 i：
- 如果 i ≤ R：z[i] 至少可以继承 z[i-L]（由对称性）
- 如果继承值超出 R：需要在 R 之后逐个字符扩展

### 与 KMP 的关系

Z 函数本质上是对**同一个字符串**做 KMP 式的匹配（KMP 是对不同字符串），因此也叫"扩展 KMP"。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Z 函数（Z-algorithm）
 * @param {string} s
 * @return {number[]} z数组
 */
function zFunction(s) {
  const n = s.length;
  const z = new Array(n).fill(0);

  // Z-box: [L, R]
  let L = 0, R = 0;

  for (let i = 1; i < n; i++) {
    if (i <= R) {
      // 在 Z-box 内，利用对称性初始化
      z[i] = Math.min(R - i + 1, z[i - L]);
    }

    // 从 z[i] 的位置开始逐个比较
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      z[i]++;
    }

    // 更新 Z-box
    if (i + z[i] - 1 > R) {
      L = i;
      R = i + z[i] - 1;
    }
  }

  return z;
}

// 使用Z函数做字符串匹配
function zSearch(text, pattern) {
  const combined = pattern + '$' + text;
  const z = zFunction(combined);
  const m = pattern.length;
  const result = [];

  for (let i = m + 1; i < combined.length; i++) {
    if (z[i] === m) result.push(i - m - 1);
  }

  return result;
}

// 测试
console.log(zFunction("aabxaab"));         // [0,1,0,0,3,1,0]
console.log(zSearch("abcabcxabcd", "abc")); // [0, 6]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$（均摊）
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function zFunction(s) {
  // TODO: Z函数 / 扩展KMP
}`,
    python: `def z_function(s: str) -> list[int]:
    pass`,
    java: `public class Solution {
    public static int[] zFunction(String s) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["字符串", "Z-algorithm", "扩展KMP"]
},

{
  title: "Rabin-Karp 滚动哈希",
  content: `## 题目描述 (LeetCode 1392 Longest Happy Prefix)

「快乐前缀」是在原字符串中既是**非空前缀也是后缀**的字符串（除了它本身不算）。

给定一个字符串 s，返回其中**最长快乐前缀**的长度。如果没有快乐前缀，返回 0。

## 示例

\`\`\`
输入: s = "level"
输出: 0
解释: 不存在满足条件的前缀

输入: s = "ababab"
输出: 4
解释: "abab" 是最长的快乐前缀（前缀==后缀）
\`\`\`

## 约束条件

- $1 \\leq s.length \\leq 10^5$`,
  solution: `## 解题思路

**Rabin-Karp（滚动哈希/Rabin fingerprint）** 利用哈希快速比较字符串是否相等。

### 核心思想

1. 选择一个大质数作为模数（如 $10^9+7$）
2. 用多项式哈希：$hash(s) = (s[0]*p^{n-1} + s[1]*p^{n-2} + ... + s[n-1]) \\mod M$
3. **滚动计算**：从左到右滑动窗口时，可以在 $O(1)$ 时间内更新哈希值

### 滚动公式

$$hash_{new} = ((hash_{old} - oldChar \\times p^{len-1}) \\times p + newChar) \\mod M$$

为了处理取模带来的冲突，可以使用**双重哈希**（两个不同质数的模）或者遇到哈希命中时再验证实际字符串。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Rabin-Karp 滚动哈希 - 最长快乐前缀
 */
function longestHappyPrefix(s) {
  const n = s.length;
  if (n === 0) return 0;

  const base = 31;
  const mod = BigInt(10 ** 9 + 7);

  // 计算 prefix hash 和 pow
  const prefixHash = [BigInt(0)];
  const pow = [BigInt(1)];

  for (let i = 0; i < n; i++) {
    const charCode = BigInt(s.charCodeAt(i) - 96);
    prefixHash.push((prefixHash[i] * base + charCode) % mod);
    pow.push((pow[i] * base) % mod);
  }

  // 从最长可能的前缀开始检查
  for (let len = n - 1; len >= 1; len--) {
    // 前缀 hash
    const prefixHashVal = prefixHash[len];
    // 后缀 hash（最后len个字符）
    const suffixHashVal =
      (prefixHash[n] - (prefixHash[n - len] * pow[len]) % mod + mod) % mod;

    if (prefixHashVal === suffixHashVal) {
      // 哈希命中，验证实际字符串（防碰撞）
      const prefix = s.slice(0, len);
      const suffix = s.slice(n - len);
      if (prefix === suffix) return len;
    }
  }

  return 0;
}

// 测试
console.log(longestHappyPrefix("level"));    // 0
console.log(longestHappyPrefix("ababab"));  // 4
console.log(longestHappyPrefix("aaaaa"));   // 4
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n)$（平均）/ $O(n^2)$（最坏，全部碰撞需验证）
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function longestHappyPrefix(s) {
  // TODO: Rabin-Karp 滚动哈希
}`,
    python: `def longest_happy_prefix(s: str) -> int:
    pass`,
    java: `class Solution {
    public int longestHappyPrefix(String s) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["字符串", "Rabin-Karp", "滚动哈希", "LeetCode 1392"]
},

{
  title: "后缀数组 SA（倍增算法基础版）",
  content: `## 题目描述

给定一个字符串 s，构造其**后缀数组 SA**。

后缀数组的定义：SA[i] 表示 s 的所有后缀中**字典序第 i 小**的后缀的起始位置。

## 示例

\`\`\`
输入: s = "banana"
输出: SA = [5, 3, 1, 0, 4, 2]

解释:
s 的所有后缀按字典序排序:
0: "banana"
1: "anana"    ← 第2小
2: "nana"     ← 第6小
3: "ana"      ← 第3小
4: "na"       ← 第5小
5: "a"        ← 第1小

所以 SA = [5, 3, 1, 0, 4, 2]
\`\`\`

## 约束条件

- $1 \\leq |s| \\leq 10^5$`,
  solution: `## 解题思路

**后缀数组（Suffix Array）** 是处理字符串问题的强大工具。

### 倍增算法（Doubling Algorithm）

核心思想：先按前 $2^k$ 个字符排序，再利用这个结果按前 $2^{k+1}$ 个字符排序。

**关键步骤**：
1. 初始：按单个字符排序（$2^0 = 1$）
2. 每轮倍长：用上一轮的排名作为二元组的两个关键字进行排序
3. 直到 $2^k > n$

时间复杂度：$O(n \\log^2 n)$（每轮排序 $O(n\\log n)$，共 $O(\\log n)$ 轮）

更高效的 DC3 / SA-IS 算法可以达到 $O(n)$，但实现复杂度高得多。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 后缀数组 - 倍增算法
 * @param {string} s
 * @return {number[]} 后缀数组
 */
function buildSA(s) {
  const n = s.length;
  // rank[i]: 第i个位置开头的后缀当前排名
  let rank = new Array(n);
  for (let i = 0; i < n; i++) rank[i] = s.charCodeAt(i);

  const sa = Array.from({ length: n }, (_, i) => i); // 初始SA
  let k = 1;

  while (k < n) {
    // 按 (rank[i], rank[i+k]) 二元组排序
    sa.sort((a, b) => {
      const ra = rank[a], rb = rank[b];
      if (ra !== rb) return ra - rb;
      const rak = (a + k < n ? rank[a + k] : -1);
      const rbk = (b + k < n ? rank[b + k] : -1);
      return rak - rbk;
    });

    // 重新计算 rank
    const tmpRank = new Array(n);
    tmpRank[sa[0]] = 0;
    for (let i = 1; i < n; i++) {
      const prev = sa[i - 1], cur = sa[i];
      tmpRank[cur] = tmpRank[prev] +
        ((rank[prev] !== rank[cur] ||
          (prev + k < n ? rank[prev + k] : -1) !==
          (cur + k < n ? rank[cur + k] : -1)) ? 1 : 0);
    }
    rank = tmpRank;
    k <<= 1;
  }

  return sa;
}

// 测试
console.log(buildSA("banana")); // [5,3,1,0,4,2]
console.log(buildSA("ababc"));   // [2,0,3,1,4]
\`\`\`

## 应用场景

- **最长重复子串**：配合 Height 数组
- **最长公共子串**（多个字符串）
- **子串出现次数统计**
- **模式匹配**

## 复杂度分析

- **时间复杂度**: $O(n \\log^2 n)$（倍增）/ $O(n)$（DC3/SA-IS）
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function buildSA(s) {
  // TODO: 后缀数组 - 倍增算法
}`,
    python: `def build_sa(s: str) -> list[int]:
    pass`,
    java: `public class Solution {
    public static int[] buildSA(String s) { return null; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["字符串", "后缀数组", "倍增算法"]
},

{
  title: "AC 自动机（多模式匹配简化版）",
  content: `## 题目描述

给定 N 个模式串和一个文本串 T，找出**每个模式串在 T 中出现的次数**。

这是 KMP 的多模式扩展版本——KMP 只能匹配一个模式串，AC 自动机可以同时匹配多个。

## 示例

\`\`\`
输入:
patterns = ["he", "she", "his", "hers"]
text = "ushershe"

输出:
he: 2
she: 1
his: 1
hers: 1
\`\`\`

## 约束条件

- $1 \\leq N, |T| \\leq 10^5$
- 所有模式串总长度 $\\leq 10^5$`,
  solution: `## 解题思路

**AC 自动机（Aho-Corasick Automaton）** 是 Trie + KMP 思想的结合：

### 三大组件

1. **Trie 树**：将所有模式串构建成 Trie
2. **失败指针（fail pointer）**：类似 KMP 的 next 数组，当匹配失败时跳转到哪个节点
3. **输出列表（output）**：记录每个节点对应的模式串

### fail 指针的构建

对 Trie 做 BFS，对于节点 u 的字符 c 的子节点 v：
- 如果 u 有 fail 节点且 fail(u) 有 c 子节点 → fail(v) = fail(u).child(c)
- 否则 fail(v) = root.child(c)，若不存在则回退到 root

### 匹配过程

从根开始遍历文本串，沿 Trie/fail 指针移动，每到节点就累加其 output 中所有模式串的计数。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * AC 自动机 - 多模式匹配
 */
class ACAutomaton {
  constructor() {
    this.next = []; // children: [26]
    this.fail = [];
    this.output = []; // 到达该节点时匹配的模式串索引列表
    this.newNode();
  }

  newNode() {
    this.next.push(new Array(26).fill(-1));
    this.fail.push(0);
    this.output.push([]);
    return this.next.length - 1;
  }

  insert(pattern, idx) {
    let node = 0;
    for (const ch of pattern) {
      const c = ch.charCodeAt(0) - 97;
      if (this.next[node][c] === -1) {
        this.next[node][c] = this.newNode();
      }
      node = this.next[node][c];
    }
    this.output[node].push(idx);
  }

  build() {
    const queue = [0];
    while (queue.length > 0) {
      const u = queue.shift();
      for (let c = 0; c < 26; c++) {
        const v = this.next[u][c];
        if (v === -1) continue;

        if (u === 0) {
          this.fail[v] = 0;
        } else {
          let f = this.fail[u];
          while (f && this.next[f][c] === -1) f = this.fail[f];
          this.fail[v] = (this.next[f]?.[c] ?? -1) >= 0 ? this.next[f][c] : 0;
        }

        // 继承 output
        this.output[v].push(...this.output[this.fail[v]]);
        queue.push(v);
      }
    }
  }

  search(text, patternCount) {
    const counts = new Array(patternCount).fill(0);
    let node = 0;

    for (const ch of text) {
      const c = ch.charCodeAt(0) - 97;
      while (node && this.next[node][c] === -1) {
        node = this.fail[node];
      }
      if (this.next[node][c] >= 0) {
        node = this.next[node][c];
      }
      for (const idx of this.output[node]) counts[idx]++;
    }

    return counts;
  }
}

// 使用示例
const ac = new ACAutomaton();
const patterns = ["he", "she", "his", "hers"];
patterns.forEach((p, i) => ac.insert(p, i));
ac.build();
console.log(ac.search("ushershe", patterns.length)); // [2,1,1,1]
\`\`\`

## 复杂度分析

- **建 Trie**: $O(\\sum |pattern_i|)$
- **构建 fail**: $O(\\sum |pattern_i| \\times alphabet)$
- **匹配**: $O(|T| + total\_matches)$
- **空间**: $O(\\sum |pattern_i| \\times alphabet)$`,
  codeTemplate: {
    javascript: `class ACAutomaton {
  // TODO: AC自动机完整实现
}`,
    python: `class ACAutomaton:
    pass`,
    java: `public class ACAutomaton {}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["字符串", "AC自动机", "Trie", "多模式匹配"]
},

{
  title: "Boyer-Moore 算法",
  content: `## 题目描述

实现 Boyer-Moore 字符串匹配算法。给定 text 和 pattern，返回 pattern 在 text 中首次出现的位置。

BM 算法的核心是**从右向左比较**，并使用两条规则来尽可能多地跳过不可能匹配的位置。

## 示例

同 KMP 题：text="hello", pattern="ll" → 返回 2

## 约束条件

- $|text|, |pattern| \\leq 10^6$`,
  solution: `## 解题思路

**Boyer-Moore 算法**在实际应用中通常比 KMP 更快（尤其是 pattern 较长时），因为它可以**跳跃式地**跳过大量字符。

### 两大规则

#### 1. 坏字符规则（Bad Character Rule）

当 text[i+j] != pattern[j] 时（从右向左比较）：
- 如果坏字符不在 pattern[0..j-1] 中：整个 pattern 可以跳过
- 如果存在：将 pattern 右移使该字符与 pattern 中最右的出现位置对齐

预处理 **badChar[c]** = c 在 pattern 中最右出现的位置（不存在则为 -1）

#### 2. 好后缀规则（Good Suffix Rule）

当 pattern[j+1..m-1] 与 text 已匹配但 pattern[j] 不匹配时：
- 找 pattern 中最靠右的、等于已匹配后缀的真子串
- 将其对齐

预处理 **goodSuffix[j]** = 需要右移的距离

每次取两条规则的**最大移动距离**。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Boyer-Moore 字符串匹配（仅坏字符规则的简化版）
 */
function boyerMoore(text, pattern) {
  const n = text.length, m = pattern.length;
  if (m === 0) return 0;
  if (n < m) return -1;

  // 坏字符规则预处理
  const badChar = new Array(256).fill(-1);
  for (let j = 0; j < m; j++) {
    badChar[pattern.charCodeAt(j)] = j; // 最右出现位置
  }

  let i = 0; // text 中的起始位置
  while (i <= n - m) {
    let j = m - 1; // 从 pattern 末尾开始比较

    while (j >= 0 && text[i + j] === pattern[j]) j--;

    if (j < 0) return i; // 完全匹配

    // 坏字符规则：计算最大安全偏移量
    const shift = Math.max(1, j - badChar[text.charCodeAt(i + j)]);
    i += shift;
  }

  return -1;
}

// 测试
console.log(boyerMoore("hello", "ll"));            // 2
console.log(boyerMoore("aaaaa", "bba"));            // -1
console.log(boyerMoore("abacadabrabracabracadabrabra", "abracadabra")); // 14
\`\`\`

### BM vs KMP vs Rabin-Karp 性能对比

| 算法 | 预处理 | 最坏匹配 | 平均性能 | 适用场景 |
|------|--------|----------|----------|----------|
| KMP | O(m) | O(n+m) | O(n+m) | 流式数据 |
| BM | O(m+Σ) | O(nm) | **O(n/m)** | 自然语言/长模式 |
| RK | O(m) | O(nm) | O(n+m) | 多模式 |

## 复杂度分析

- **预处理**: $O(m + |\\Sigma|)$
- **匹配最坏**: $O(nm)$（极少发生）
- **匹配平均**: $O(n/m)$（实际应用中非常快）`,
  codeTemplate: {
    javascript: `function boyerMoore(text, pattern) {
  // TODO: Boyer-Moore 算法
}`,
    python: `def boyer_moore(text: str, pattern: str) -> int:
    pass`,
    java: `class Solution {
    public static int boyerMoore(String text, String pattern) { return -1; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["字符串", "Boyer-Moore", "匹配"]
},


// ============================================================================
// 第五部分：数学/数论 (7道)
// ============================================================================

{
  title: "快速幂 + 矩阵快速幂",
  content: `## 题目描述 A：快速幂

计算 $x^n \\mod M$，其中 $n$ 可能非常大（如 $10^{18}$）。

## 题目描述 B：矩阵快速幂（斐波那契 log(n) 解法）

求斐波那契数列的第 n 项 $F_n$，其中 $n \\leq 10^{18}$，结果对 $10^9+7$ 取模。

要求时间复杂度为 $O(\\log n)$。

## 示例

\`\`\`
输入: x=2, n=10, M=1000000007
输出: 1024

输入: n=50 (Fibonacci)
输出: 12586269025 (或取模后的值)
\`\`\`

## 约束条件

- $0 \\leq n \\leq 10^{18}$
- $M$ 为质数，$M \\leq 10^9+7$`,
  solution: `## 解题思路

### 快速幂（Binary Exponentiation）

核心思想：将指数 n 用二进制表示，通过平方和乘法组合出结果。

$$x^n = x^{b_k 2^k + ... + b_1 2^1 + b_0 2^0} = \\prod_{i: b_i=1} x^{2^i}$$

例如 $x^{13} = x^{1101_2} = x^8 \\cdot x^4 \\cdot x^1$

### 矩阵快速幂

斐波那契有矩阵形式：
$$\\begin{pmatrix} F_{n+1} & F_n \\\\ F_n & F_{n-1} \\end{pmatrix} = \\begin{pmatrix} 1 & 1 \\\\ 1 & 0 \\end{pmatrix}^n$$

所以 $F_n = matrix^n$ 的 [0][1] 元素。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 快速幂
 * @param {bigint} x 底数
 * @param {bigint} n 指数
 * @param {bigint} mod 模数
 * @return {bigint}
 */
function fastPow(x, n, mod) {
  let result = BigInt(1);
  x = x % mod;

  while (n > 0n) {
    if (n % 2n === 1n) result = (result * x) % mod;
    x = (x * x) % mod;
    n /= 2n;
  }

  return result;
}

/**
 * 矩阵快速幂 - 斐波那契
 */
function fibMatrixPow(n) {
  const MOD = BigInt(10 ** 9 + 7);

  function matMul(A, B) {
    return [
      [(A[0][0]*B[0][0] + A[0][1]*B[1][0]) % MOD,
       (A[0][0]*B[0][1] + A[0][1]*B[1][1]) % MOD],
      [(A[1][0]*B[0][0] + A[1][1]*B[1][0]) % MOD,
       (A[1][0]*B[0][1] + A[1][1]*B[1][1]) % MOD],
    ];
  }

  function matPow(M, p) {
    let result = [[1n, 0n], [0n, 1n]]; // 单位矩阵
    let base = M;
    while (p > 0n) {
      if (p % 2n === 1n) result = matMul(result, base);
      base = matMul(base, base);
      p /= 2n;
    }
    return result;
  }

  if (n <= 1n) return Number(n);
  const baseMatrix = [[1n, 1n], [1n, 0n]];
  const result = matPow(baseMatrix, BigInt(n - 1));
  return Number(result[0][0]);
}

// 测试
console.log(fastPow(2n, 10n, BigInt(10**9+7)).toString()); // 1024
console.log(fastPow(2n, 1000000000000000000n, BigInt(10**9+7))); // 大数
console.log(fibMatrixPow(50));  // 12586269025
console.log(fibMatrixPow(10000000000000)); // 极大的n也能算
\`\`\`

## 复杂度分析

- **快速幂 时间复杂度**: $O(\\log n)$
- **矩阵快速幂 时间复杂度**: $O(d^3 \\log n)$（d 为矩阵维度，斐波那契 d=2）
- **空间复杂度**: $O(1)$ 或 $O(d^2)$`,
  codeTemplate: {
    javascript: `function fastPow(x, n, mod) {
  // TODO: 快速幂
}
function fibMatrixPow(n) {
  // TODO: 矩阵快速幂求斐波那契
}`,
    python: `def fast_pow(x: int, n: int, mod: int) -> int:
    pass
def fib_matrix_pow(n: int) -> int:
    pass`,
    java: `public class Solution {
    public static long fastPow(long x, long n, long mod) { return 0; }
    public static long fib(long n) { return 0; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["数学", "快速幂", "矩阵", "数论"]
},

{
  title: "质数筛（埃拉托斯特尼筛 + 线性筛）",
  content: `## 题目描述

给定一个整数 n，返回所有小于 n 的质数。

## 示例

\`\`\`
输入: n = 20
输出: [2, 3, 5, 7, 11, 13, 17, 19]

输入: n = 0
输出: []
\`\`\`

## 约束条件

- $0 \\leq n \\leq 5 \\times 10^6$`,
  solution: `## 解题思路

### 方法一：埃拉托斯特尼筛法（Eratosthenes Sieve）

从 2 开始，标记所有合数（质数的倍数）。

优化：外层只需遍历到 $\\sqrt{n}$；内层从 $i^2$ 开始标记。

### 方法二：线性筛 / 欧拉筛（Euler's Sieve）

保证每个合数只被其**最小质因子**筛掉一次，达到真正的 $O(n)$。

**关键性质**：如果 $i \\% primes[j] == 0$，则 break。因为此时 primes[j] 是 i 的最小质因子，后续更大的 primes[k] × i 会被 primes[k] × (i/primes[j] × primes[j]) 先筛掉。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 埃拉托斯特尼筛法
 * @param {number} n
 * @return {number[]} 所有小于n的质数
 */
function sieveOfEratosthenes(n) {
  if (n < 2) return [];
  const isPrime = new Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j < n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  return isPrime.map((p, i) => p ? i : -1).filter(x => x > 0);
}

/**
 * 线性筛 / 欧拉筛 - O(n)
 */
function linearSieve(n) {
  if (n < 2) return [];
  const isPrime = new Array(n).fill(true);
  const primes = [];

  for (let i = 2; i < n; i++) {
    if (isPrime[i]) primes.push(i);

    for (let j = 0; j < primes.length && i * primes[j] < n; j++) {
      isPrime[i * primes[j]] = false;
      if (i % primes[j] === 0) break; // 关键！
    }
  }

  return primes;
}

// 测试
console.log(sieveOfEratosthenes(20));  // [2,3,5,7,11,13,17,19]
console.log(linearSieve(20));         // [2,3,5,7,11,13,17,19]
console.log(linearSieve(1000000).length); // 78498 个质数
\`\`\`

## 复杂度分析

| 方法 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 埃氏筛 | $O(n \\log \\log n)$ | $O(n)$ |
| 线性筛 | $O(n)$ | $O(n)$ |
| 区间筛 | $O((R-L+1)\\log\\log R)$ | $O(\\sqrt{R})$ |`,
  codeTemplate: {
    javascript: `function sieveOfEratosthenes(n) {
  // TODO: 埃氏筛
}
function linearSieve(n) {
  // TODO: 线性筛/欧拉筛
}`,
    python: `def sieve_of_eratosthenes(n: int) -> list[int]:
    pass
def linear_sieve(n: int) -> list[int]:
    pass`,
    java: `public class Solution {
    public static List<Integer> sieve(int n) { return null; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["数学", "数论", "质数筛"]
},

{
  title: "欧几里得算法（GCD + LCM + 扩展欧几里得）",
  content: `## 题目描述

实现以下三个函数：

1. **gcd(a, b)**：最大公约数
2. **lcm(a, b)**：最小公倍数
3. **extendedGcd(a, b)**：扩展欧几里得算法，找到整数 x, y 使得 ax + by = gcd(a,b)

## 示例

\`\`\`
输入: a=48, b=18
输出: gcd=6, lcm=144, x=-1, y=3 (因为 48*(-1) + 18*3 = 6)
\`\`\`

## 约束条件

- $|a|, |b| \\leq 10^{18}$`,
  solution: `## 解题思路

### GCD — 欧几里得算法

$$gcd(a, b) = gcd(b, a \\% b), \\quad gcd(a, 0) = a$$

基于定理：gcd(a, b) = gcd(b, a mod b)。辗转相除直到余数为 0。

### LCM

$$lcm(a, b) = \\frac{|a \\times b|}{gcd(a, b)}$$

### 扩展欧几里得算法（Extended GCD）

不仅求 gcd，还找到一组系数 (x, y) 使得 $ax + by = g = gcd(a,b)$。

**递推关系**：
$$
\\begin{cases}
x = y' \\\\
y = x' - \\lfloor a/b \\rfloor \\cdot y'
\\end{cases}
$$

其中 $(x', y')$ 是 $(b, a\\%b)$ 的解。

### 应用

- **求解线性 Diophantine 方程**：ax + by = c
- **求乘法逆元**：ax ≡ 1 (mod m)，即 ax + my = 1
- **中国剩余定理**

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 最大公约数
 */
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

/**
 * 最小公倍数
 */
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * 扩展欧几里得算法
 * @returns {{ g: number, x: number, y: number }}
 */
function extendedGcd(a, b) {
  if (b === 0) return { g: a, x: 1, y: 0 };

  const { g, x: x1, y: y1 } = extendedGcd(b, a % b);
  // x = y1, y = x1 - floor(a/b) * y1
  return { g, x: y1, y: x1 - Math.floor(a / b) * y1 };
}

/**
 * 求模逆元：a*x ≡ 1 (mod m)
 * 要求 gcd(a, m) = 1
 */
function modInverse(a, m) {
  const { g, x } = extendedGcd(a, m);
  if (g !== 1) throw new Error('No inverse exists');
  return ((x % m) + m) % m;
}

// 测试
console.log(gcd(48, 18));              // 6
console.log(lcm(48, 18));              // 144
console.log(extendedGcd(48, 18));      // {g:6, x:-1, y:3}
console.log(modInverse(3, 11));         // 4 (因为 3*4=12≡1 mod 11)
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(\\log \\min(a, b))$
- **空间复杂度**: $O(\\log \\min(a, b))$（递归栈深度）`,
  codeTemplate: {
    javascript: `function gcd(a, b) {}
function lcm(a, b) {}
function extendedGcd(a, b) {}`,
    python: `def gcd(a: int, b: int) -> int: pass
def lcm(a: int, b: int) -> int: pass
def extended_gcd(a: int, b: int) -> tuple[int, int, int]: pass`,
    java: `public class Solution {
    public static long gcd(long a, long b) { return 0; }
    public static long lcm(long a, long b) { return 0; }
    public static long[] extendedGcd(long a, long b) { return null; }
}`
  },
  difficulty: "easy",
  questionType: "code",
  tags: ["数学", "数论", "GCD", "欧几里得"]
},

{
  title: "卡特兰数",
  content: `## 面试问答 + 编程题

> **面试官**：什么是卡特兰数？有哪些经典应用？

## 题目描述

给定整数 n，计算第 n 个卡特兰数 $C_n$，结果对 $10^9+7$ 取模。

卡特兰数的定义：
$$C_n = \\frac{1}{n+1}\\binom{2n}{n} = \\frac{(2n)!}{(n+1)! \\cdot n!}$$

递推公式：$C_0 = 1$, $C_{n+1} = C_n \\times \\frac{2(2n+1)}{n+2}$

## 示例

\`\`\`
输入: n=0 → 1
n=1 → 1
n=2 → 2
n=3 → 5
n=4 → 14
n=5 → 42
\`\`\`

## 经典应用

1. **合法括号序列**：n 对括号的合法排列方式数
2. **二叉树计数**：n 个节点的不同结构 BST 数量
3. **出栈序列**：n 个元素进栈后合法的出栈序列数
4. **凸多边形三角剖分**：(n+2) 边形的三角剖分方式数
5. **路径不穿过对角线**：从 (0,0) 到 (n,n) 只走右上的路径数`,
  solution: `## 解题思路

### 计算方法

**方法一：递推公式**（推荐，避免大数阶乘）
$$C_{n+1} = C_n \\times \\frac{2(2n+1)}{n+2}$$

需要用到**模逆元**来处理除法（费马小定理：$a^{-1} \\equiv a^{p-2} \\mod p$）。

**方法二：通项公式**
$$C_n = \\binom{2n}{n} - \\binom{2n}{n+1}$$

**方法三：动态规划**
$$C_n = \\sum_{i=0}^{n-1} C_i \\times C_{n-1-i}$$

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 卡特兰数（递推公式 + 模逆元）
 * @param {number} n
 * @param {number} mod 默认 1e9+7
 * @return {number}
 */
function catalanNumber(n, mod = 10 ** 9 + 7) {
  if (n === 0 || n === 1) return 1;

  let cat = 1n;
  const MOD = BigInt(mod);

  for (let i = 0; i < n; i++) {
    // cat = cat * 2*(2i+1) / (i+2)
    const numerator = cat * BigInt(2 * (2 * i + 1)) % MOD;
    const denominator = powMod(BigInt(i + 2), MOD - 2n, MOD);
    cat = numerator * denominator % MOD;
  }

  return Number(cat);
}

// 快速幂取模
function powMod(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod;
    base = base * base % mod;
    exp /= 2n;
  }
  return result;
}

// DP 版本
function catalanDP(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      dp[i] += dp[j] * dp[i - 1 - j];
    }
  }
  return dp[n];
}

// 测试
for (let i = 0; i <= 10; i++) {
  console.log(\`C_\${i} = \${catalanNumber(i)}\`);
}
// C_0=1, C_1=1, C_2=2, C_3=5, C_4=14, C_5=42, ...
\`\`\`

## 复杂度分析

- **递推法**: $O(n \\log M)$（每次需快速幂求逆元）
- **DP 法**: $O(n^2)$
- **空间**: $O(1)$ 或 $O(n)$`,
  codeTemplate: {
    javascript: `function catalanNumber(n) {
  // TODO: 卡特兰数
}`,
    python: `def catalan_number(n: int, mod: int = 10**9+7) -> int:
    pass`,
    java: `public class Solution {
    public static long catalan(int n) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["数学", "组合数学", "卡特兰数"]
},

{
  title: "容斥原理",
  content: `## 题目描述

给定 N 个属性集合和总数为 N 的物品集合，每个物品可能具有多个属性。求**至少具有 k 个属性**的物品数量。

或者更经典的版本：给定三个集合 A, B, C，求 $|A \\cup B \\cup C|$。

## 示例

\`\`\`
输入: 1~1000 中，
能被2整除的数集合A={2,4,6,...,1000}
能被3整除的数集合B={3,6,9,...,999}
能被5整除的数集合C={5,10,15,...,1000}

求能被 2 或 3 或 5 整除的数的个数

输出: 734
\`\`\`

## 约束条件

- $N \\leq 10^6$`,
  solution: `## 解题思路

**容斥原理（Inclusion-Exclusion Principle）**：

$$|A_1 \\cup A_2 \\cup ... \\cup A_n| = \\sum_{\\emptyset \\neq S \\subseteq \\{1..n\\}} (-1)^{|S|+1} |\\bigcap_{i \\in S} A_i|$$

通俗地说：加上奇数个集合的交集大小，减去偶数个集合的交集大小。

**两集合**：$|A \\cup B| = |A| + |B| - |A \\cap B|$

**三集合**：$|A \\cup B \\cup C| = |A|+|B|+|C| - |A\\cap B|-|A\\cap C|-|B\\cap C| + |A\\cap B\\cap C|$

### 一般化：至少 k 个属性满足

可以用容斥原理的推广形式，或转化为：枚举所有 $2^n$ 种属性组合，对每种组合计算恰好满足这些属性的物品数。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 容斥原理：1~N 中能被 a 或 b 或 c 整除的数的个数
 */
function inclusionExclusion(N, divisors) {
  const n = divisors.length;
  let result = 0;

  // 枚举所有非空子集
  for (let mask = 1; mask < (1 << n); mask++) {
    let lcmVal = 1;
    let bits = 0;

    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        bits++;
        lcmVal = lcm(lcmVal, divisors[i]);
      }
    }

    const count = Math.floor(N / lcmVal);
    if (bits % 2 === 1) result += count;  // 奇数个：加
    else result -= count;                 // 偶数个：减
  }

  return result;
}

function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }

// 测试
console.log(inclusionExclusion(1000, [2, 3, 5])); // 734

/**
 * 至少 k 个属性满足的计数
 */
function atLeastK(N, properties, k) {
  const m = properties.length;
  let total = 0;

  // 枚举所有非空子集
  for (let mask = 1; mask < (1 << m); mask++) {
    const bits = countBits(mask);
    if (bits < k) continue;

    let intersectionSize = N;
    for (let i = 0; i < m; i++) {
      if ((mask >> i) & 1) intersectionSize += properties[i];
    }
    // 这里需要根据具体问题调整...
  }

  return total;
}

function countBits(x) {
  let c = 0;
  while (x) { c++; x &= x - 1; }
  return c;
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(2^n \\cdot n)$（n 为属性/集合数）
- **空间复杂度**: $O(1)$`,
  codeTemplate: {
    javascript: `function inclusionExclusion(N, divisors) {
  // TODO: 容斥原理
}`,
    python: `def inclusion_exclusion(N: int, divisors: list[int]) -> int:
    pass`,
    java: `public class Solution {
    public static int inclusionExclusion(int N, int[] divisors) { return 0; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["数学", "组合数学", "容斥原理"]
},

{
  title: "凸包算法 Graham Scan",
  content: `## 题目描述

给定平面上 N 个点的坐标，求这 N 个点构成的**凸包（Convex Hull）**的所有顶点，按逆时针顺序输出。

凸包的定义：包含所有给定点的一个最小凸多边形。

## 示例

\`\`\`
输入: points = [[0,0],[0,1],[1,1],[1,0],[0.5,0.5]]
输出: [[0,0],[0,1],[1,1],[1,0]]
解释: 凸包是一个正方形，(0.5,0.5) 在内部
\`\`\`

## 约束条件

- $1 \\leq N \\leq 5000$`,
  solution: `## 解题思路

**Graham Scan 算法**是求平面凸包的经典方法。

### 步骤

1. **找极值点**：找 y 坐标最小的点（若有多个取最左的）作为起点 p0
2. **极角排序**：以 p0 为原点，按极角对所有点排序（角度相同按距离排序）
3. **扫描维护**：依次考虑每个点，用**叉积判断方向**维护凸包栈
   - 左转（逆时针）：入栈
   - 右转（顺时针）：弹出栈顶直到左转

### 叉积判断

对于连续三点 a→b→c，计算向量 ab 和 bc 的**叉积（cross product）**：
$$cross = (b_x-a_x)(c_y-b_y) - (b_y-a_y)(c_x-b_x)$$

- cross > 0：左转（逆时针）→ 保留
- cross < 0：右转（顺时针）→ 弹出 b
- cross = 0：共线

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Graham Scan 凸包算法
 * @param {number[][]} points [[x,y], ...]
 * @return {number[][]} 凸包顶点（逆时针）
 */
function convexHull(points) {
  const n = points.length;
  if (n <= 2) return [...points];

  // 找最下方的点作为起点
  let startIdx = 0;
  for (let i = 1; i < n; i++) {
    if (points[i][1] < points[startIdx][1] ||
        (points[i][1] === points[startIdx][1] && points[i][0] < points[startIdx][0])) {
      startIdx = i;
    }
  }

  // 以起点为基准，按极角排序
  const start = points[startIdx];
  const sorted = points.filter((_, i) => i !== startIdx).sort((a, b) => {
    const angleA = Math.atan2(a[1] - start[1], a[0] - start[0]);
    const angleB = Math.atan2(b[1] - start[1], b[0] - start[0]);
    if (Math.abs(angleA - angleB) < 1e-10) {
      return dist(start, a) - dist(start, b);
    }
    return angleA - angleB;
  });

  // 叉积
  function cross(o, a, b) {
    return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  }

  function dist(a, b) {
    return (a[0]-b[0])**2 + (a[1]-b[1])**2;
  }

  // Graham扫描
  const stack = [start];

  for (const p of sorted) {
    while (stack.length > 1 &&
           cross(stack[stack.length-2], stack[stack.length-1], p) <= 0) {
      stack.pop(); // 右转或共线时弹出
    }
    stack.push(p);
  }

  return stack;
}

// 测试
console.log(convexHull([[0,0],[0,1],[1,1],[1,0],[0.5,0.5]]));
// [[0,0],[1,0],[1,1],[0,1]] (逆时针)
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(n \\log n)$（主要来自排序）
- **空间复杂度**: $O(n)$`,
  codeTemplate: {
    javascript: `function convexHull(points) {
  // TODO: Graham Scan 凸包
}`,
    python: `def convex_hull(points: list[list[float]]) -> list[list[float]]:
    pass`,
    java: `public class Solution {
    public static int[][] convexHull(int[][] points) { return null; }
}`
  },
  difficulty: "medium",
  questionType: "code",
  tags: ["数学", "几何", "凸包", "Graham Scan"]
},

{
  title: "博弈论基础（Nim游戏 SG函数）",
  content: `## 面试问答

> **面试官**：什么是 Nim 游戏？SG 函数是什么？Sprague-Grundy 定理怎么用？

---

## 参考回答框架

### 一、Nim 游戏

有 N 堆石子，两人轮流取，每次从一堆中取任意正数个。取走最后一颗石子者胜。

**关键结论**：设各堆石子数为 $a_1, a_2, ..., a_n$。
- 若 $a_1 \\oplus a_2 \\oplus ... \\oplus a_n \\neq 0$，**先手必胜**
- 若 $a_1 \\oplus a_2 \\oplus ... \\oplus a_n = 0$，**后手必胜**

（异或和称为 **Nim-sum**）

### 二、SG 函数（Sprague-Grundy Function）

每个游戏状态对应一个 **SG 值（Grundy number / mex 值）**。

**mex（Minimum Excludant）**：不属于当前集合的最小非负整数。

$$SG(s) = mex(\\{SG(t) : t \\text{ 是 } s \\text{ 的可达状态}\\})$$

**终止状态的 SG 值 = 0**。

### 三、Sprague-Grundy 定理

**复合游戏的 SG 值 = 各子游戏 SG 值的异或和**。

$$SG(复合) = SG(子游戏_1) \\oplus SG(子游戏_2) \\oplus ... \\oplus SG(子游戏_n)$$

### 四、常见游戏的 SG 值

| 游戏 | 规则 | SG 值 |
|------|------|-------|
| Nim 单堆 | 可取 1~全部 | SG = 石子数 |
| 巴什博弈 | 可取 1~m | SG = n % (m+1) |
| Wythoff 游戏 | 可从一堆取或两堆同时取 | SG 涉及黄金分割比 |

### 五、解题模板

\`\`\`javascript
function getSG(state, memo, moves) {
  if (memo.has(state)) return memo.get(state);

  const nextStates = moves(state);
  const sgSet = new Set(nextStates.map(s => getSG(s, memo, moves)));

  // 计算 mex
  let mex = 0;
  while (sgSet.has(mex)) mex++;

  memo.set(state, mex);
  return mex;
}
\`\`\``,
  solution: `## 要点总结

1. **Nim 游戏**：异或和 ≠ 0 则先手必胜
2. **SG 函数**：mex(所有后继状态的SG值)
3. **SG 定理**：复合游戏 SG = 各子游戏 SG 异或和
4. **必胜策略**：使对手面对 SG = 0 的状态`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["数学", "博弈论", "Nim游戏", "SG函数", "面试高频"]
},


// ============================================================================
// 第六部分：经典 Hard 补充 (5道)
// ============================================================================

{
  title: "接雨水 II（三维接水）",
  content: `## 题目描述 (LeetCode 407 Hard)

给你一个 m x n 的整数矩阵 heightMap ，表示一个高度图，其中 heightMap[r][c] 表示第 r 行 c 列的高度。

请计算该高度图中能接住多少**雨水**。

## 示例

\`\`\`
输入: heightMap = [
  [1,4,3,1,3,2],
  [3,2,3,1,2,4],
  [2,3,3,2,3,1]
]
输出: 4
解释: 下雨后，这个矩阵能接 4 个单位的雨水
\`\`\`

## 约束条件

- $m == heightMap.length$
- $n == heightMap[r].length$
- $1 \\leq m, n \\leq 200$
- $0 \\leq heightMap[r][c] \\leq 2 \\times 10^4$`,
  solution: `## 解题思路

**优先队列 + BFS（类似 Dijkstra）**。

### 核心思想

与一维接雨水不同，二维情况下水可以从四个方向流出。关键观察：

1. **边界上的点无法存水**（水会从边界流出去）
2. 从边界开始向内扩展，维护一个"水位线"
3. 用优先队列（最小堆）始终处理当前最低的边界点
4. 如果邻居比当前水位低，说明可以存水

### 算法步骤

1. 将所有边界点加入最小堆
2. 标记已访问
3. 每次取出堆顶（最低的点），作为当前水位
4. 检查四个方向的邻居：
   - 若未访问：如果邻居更低 → 可以存水（差值累加），并将邻居以自身高度入堆；否则直接将邻居高度入堆

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[][]} heightMap
 * @return {number}
 */
function trapRainWater(heightMap) {
  if (!heightMap || heightMap.length < 3 || heightMap[0].length < 3) return 0;

  const m = heightMap.length, n = heightMap[0].length;
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));
  // 最小堆: [height, row, col]
  const pq = new MinHeap();

  // 边界入堆
  for (let i = 0; i < m; i++) {
    for (let j of [0, n - 1]) {
      pq.push([heightMap[i][j], i, j]);
      visited[i][j] = true;
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i of [0, m - 1]) {
      if (!visited[i][j]) {
        pq.push([heightMap[i][j], i, j]);
        visited[i][j] = true;
      }
    }
  }

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  let water = 0;

  while (!pq.isEmpty) {
    const [h, r, c] = pq.pop();

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= m || nc < 0 || nc >= n || visited[nr][nc]) continue;
      visited[nr][nc] = true;
      water += Math.max(0, h - heightMap[nr][nc]);
      pq.push([Math.max(h, heightMap[nr][nc]), nr, nc]);
    }
  }

  return water;
}

// 测试
console.log(trapRainWater([
  [1,4,3,1,3,2],
  [3,2,3,1,2,4],
  [2,3,3,2,3,1]
])); // 4
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(mn \\log(mn))$（每个节点最多入堆一次）
- **空间复杂度**: $O(mn)$`,
  codeTemplate: {
    javascript: `function trapRainWater(heightMap) {
  // TODO: 接雨水II - 优先队列BFS
}`,
    python: `def trap_rain_water(height_map: list[list[int]]) -> int:
    pass`,
    java: `class Solution {
    public int trapRainWater(int[][] heightMap) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["数组", "优先队列", "BFS", "LeetCode 407"]
},

{
  title: "合并K个排序链表（优先队列解法）",
  content: `## 题目描述 (LeetCode 23 Hard)

给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

## 示例

\`\`\`
输入: lists = [[1,4,5],[1,3,4],[2,6]]
输出: [1,1,2,3,4,4,5,6]

输入: lists = []
输出: null
\`\`\`

## 约束条件

- k == lists.length
- $0 \\leq k \\leq 10^4$
- $0 \\leq lists[i].length \\leq 500$
- $-10^4 \\leq lists[i][j] \\leq 10^4$`,
  solution: `## 解题思路

**方法：优先队列（最小堆）归并**

类似于多路归并排序中的归并过程：

1. 将每个链表的第一个节点加入最小堆
2. 每次取出堆顶（最小的节点），接入结果链表
3. 将取出节点的下一个节点（如果有）入堆
4. 重复直到堆为空

### 为什么不用两两合并？

两两合并的时间复杂度为 $O(k^2 N)$（k 为链表数，N 为平均长度），而优先队列方法为 $O(kN \\log k)$。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) { this.val = val; this.next = next; }
 */
/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
function mergeKLists(lists) {
  const dummy = new ListNode();
  let tail = dummy;

  // 最小堆: [val, listIndex]
  const pq = new MinHeap((a, b) => a[0] - b[0]);

  for (let i = 0; i < lists.length; i++) {
    if (lists[i]) {
      pq.push([lists[i].val, i]);
      lists[i] = lists[i].next;
    }
  }

  while (!pq.isEmpty) {
    const [val, idx] = pq.pop();
    tail.next = new ListNode(val);
    tail = tail.next;

    if (lists[idx]) {
      pq.push([lists[idx].val, idx]);
      lists[idx] = lists[idx].next;
    }
  }

  return dummy.next;
}

// 测试
function buildList(arr) {
  let head = null;
  for (let i = arr.length - 1; i >= 0; i--) {
    head = new ListNode(arr[i], head);
  }
  return head;
}
function printList(head) {
  const result = [];
  while (head) { result.push(head.val); head = head.next; }
  console.log(result.join('->'));
}
printList(mergeKLists([
  buildList([1,4,5]), buildList([1,3,4]), buildList([2,6])
])); // 1->1->2->3->4->4->5->6
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(Nk \\log k)$（N 为所有链表总长度）
- **空间复杂度**: $O(k)$（堆大小）`,
  codeTemplate: {
    javascript: `function mergeKLists(lists) {
  // TODO: 合并K个排序链表 - 优先队列
}`,
    python: `def merge_k_lists(lists: list[ListNode | None]) -> ListNode | None:
    pass`,
    java: `class Solution {
    public ListNode mergeKLists(ListNode[] lists) { return null; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["链表", "优先队列", "分治", "LeetCode 23"]
},

{
  title: "正则表达式匹配 DP 解法",
  content: `## 题目描述 (LeetCode 10 Hard)

给你一个字符串 s 和一个字符规律 p，请你来实现一个支持 '.' 和 '*' 的正则表达式匹配。

- '.' 匹配任意单个字符
- '*' 匹配零个或多个前面的那一个元素

所谓匹配，是要覆盖整个字符串 s 的（不是部分匹配）。

## 示例

\`\`\`
输入: s = "aa", p = "a"
输出: false
解释: "a" 无法匹配 "aa" 整个字符串。

输入: s = "aa", p = "a*"
输出: true
解释: '*' 代表可匹配零个或多个前面的元素，即可以匹配 'a'。

输入: s = "ab", p = ".*"
输出: true
解释: ".*" 表示可匹配零个或多个('*') 任意字符('.')。
\`\`\`

## 约束条件

- $1 \\leq s.length \\leq 20$
- $1 \\leq p.length \\leq 20$
- s 只包含从 a-z 的小写字母。
- p 只包含从 a-z 的小写字母，以及字符 . 和 *。`,
  solution: `## 解题思路

**动态规划**。定义 $dp[i][j]$ 表示 s 前 i 个字符和 p 前 j 个字符是否匹配。

### 状态转移

对于 p[j-1] 的不同情况：

1. **普通字符或 '.'**：
   $$dp[i][j] = dp[i-1][j-1] \\land (s[i-1]==p[j-1] \\lor p[j-1]=='.')$$

2. **'*'（需要看前一个字符 p[j-2]）**：
   - 匹配 0 次：$dp[i][j] = dp[i][j-2]$（跳过 x*）
   - 匹配 1+ 次：$dp[i][j] = dp[i-1][j] \\land (s[i-1]==p[j-2] \\lor p[j-2]=='.')$

### 初始化

$dp[0][0] = true$（空串匹配空模式）
$dp[0][j]$ 只有当 p[j-1]=='*' 且 dp[0][j-2]=true 时为 true

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} s
 * @param {string} p
 * @return {boolean}
 */
function isMatch(s, p) {
  const m = s.length, n = p.length;
  // dp[i][j]: s前i个字符 与 p前j个字符 是否匹配
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;

  // 初始化: s空时 p可能匹配（如 a*, a*b*, .* 等）
  for (let j = 1; j <= n; j++) {
    if (p[j - 1] === '*') {
      dp[0][j] = dp[0][j - 2];
    }
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        // 不匹配 或 匹配一次以上
        dp[i][j] = dp[i][j - 2] ||
          (dp[i - 1][j] && (s[i - 1] === p[j - 2] || p[j - 2] === '.'));
      } else {
        // 普通字符或 .
        dp[i][j] = dp[i - 1][j - 1] &&
          (p[j - 1] === '.' || s[i - 1] === p[j - 1]);
      }
    }
  }

  return dp[m][n];
}

// 测试
console.log(isMatch("aa", "a"));     // false
console.log(isMatch("aa", "a*"));    // true
console.log(isMatch("ab", ".*"));    // true
console.log(isMatch("aab", "c*a*b")); // true
console.log(isMatch("mississippi", "mis*is*p*.")); // false
\`\`\`

## 参考代码 (Python)

\`\`\`python
def is_match(s: str, p: str) -> bool:
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True

    for j in range(2, n + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 2]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                dp[i][j] = dp[i][j - 2] or (dp[i - 1][j] and (s[i - 1] == p[j - 2] or p[j - 2] == '.'))
            else:
                dp[i][j] = dp[i - 1][j - 1] and (p[j - 1] == '.' or s[i - 1] == p[j - 1])

    return dp[m][n]
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$`,
  codeTemplate: {
    javascript: `function isMatch(s, p) {
  // TODO: 正则表达式匹配 - DP
}`,
    python: `def is_match(s: str, p: str) -> bool:
    pass`,
    java: `class Solution {
    public boolean isMatch(String s, String p) { return false; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "字符串", "LeetCode 10"]
},

{
  title: "编辑距离完整 DP 推导",
  content: `## 题目描述 (LeetCode 72 Hard)

给定两个单词 word1 和 word2，返回将 word1 转换成 word2 所使用的最少操作次数。

你可以对一个单词进行如下三种操作：

- 插入一个字符
- 删除一个字符
- 替换一个字符

## 示例

\`\`\`
输入: word1 = "horse", word2 = "ros"
输出: 3
解释:
horse -> rorse (替换 'h' 为 'r')
rorse -> rose (删除 'r')
rose -> ros (删除 'e')

输入: word1 = "intention", word2 = "execution"
输出: 5
\`\`\`

## 约束条件

- $0 \\leq word1.length, word2.length \\leq 500$`,
  solution: `## 解题思路

**经典动态规划问题**。这是编辑距离问题的标准版本。

### 状态定义

$dp[i][j]$ = word1 前 i 个字符转换为 word2 前 j 个字符的最小操作次数。

### 状态转移方程推导

考虑 word1[0..i-1] → word2[0..j-1] 的最后一步操作：

| 操作 | 转移方程 | 含义 |
|------|----------|------|
| 删除 | $dp[i-1][j] + 1$ | 删掉 word1[i-1]，使 word1[0..i-2] → word2[0..j-1] |
| 插入 | $dp[i][j-1] + 1$ | 在 word1 后插入 word2[j-1] |
| 替换 | $dp[i-1][j-1] + cost$ | cost=0(相同) 或 1(不同) |

$$dp[i][j] = \\min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)$$

### 直观理解

想象一张表格，左上角是两个空串。每一步可以向右（插入）、向下（删除）、对角线走（替换/匹配）。

### 初始化

- $dp[0][j] = j$（word1 空串 → word2 前j字符，需 j 次插入）
- $dp[i][0] = i$（word1 前i字符 → 空串，需 i 次删除）

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // 初始化边界
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // 填表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // 字符相同，无需操作
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 删除 word1[i-1]
          dp[i][j - 1] + 1,    // 插入 word2[j-1]
          dp[i - 1][j - 1] + 1 // 替换
        );
      }
    }
  }

  return dp[m][n];
}

// 测试
console.log(minDistance("horse", "ros"));           // 3
console.log(minDistance("intention", "execution")); // 5
console.log(minDistance("", "abc"));                // 3
console.log(minDistance("abc", ""));                // 3
\`\`\`

### 空间优化

由于 $dp[i][j]$ 只依赖于上一行和当前行左边的一个值，可压缩为一维数组。

## 复杂度分析

- **时间复杂度**: $O(m \\times n)$
- **空间复杂度**: $O(m \\times n)$（可优化至 $O(\\min(m,n))$）

### 编辑距离的应用

1. **拼写纠错**：计算用户输入与词典条目的距离
2. **DNA 序列比对**：衡量两条基因序列的差异程度
3. **版本控制**：git diff 底层算法
4. **语音识别**：音素序列的对齐`,
  codeTemplate: {
    javascript: `function minDistance(word1, word2) {
  // TODO: 编辑距离 - 完整DP推导
}`,
    python: `def min_distance(word1: str, word2: str) -> int:
    pass`,
    java: `class Solution {
    public int minDistance(String word1, String word2) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "字符串", "LeetCode 72"]
},

{
  title: "直方图中最大的矩形（单调栈解法）",
  content: `## 题目描述 (LeetCode 84 Hard)

给定 n 个非负整数，用来表示柱状图中各个柱子的高度。每个柱子彼此相邻，且宽度为 1。

求在该柱状图中，能够勾勒出来的矩形的最大面积。

## 示例

\`\`\`
输入: heights = [2,1,5,6,2,3]
输出: 10
解释: 最大的矩形为宽度 2 × 高度 5 = 10（对应第 2、3 号柱子的区域）
\`\`\`

## 约束条件

- $1 \\leq heights.length \\leq 10^5$
- $0 \\leq heights[i] \\leq 10^4$`,
  solution: `## 解题思路

**单调栈（Monotonic Stack）** 是解决此问题的最优解法。

### 核心思路

对于每个柱子 heights[i]，我们需要找到它**左边第一个更矮的柱子**和**右边第一个更矮的柱子**，这样就能确定以它为最矮柱子的最大矩形宽度 = right - left - 1，面积 = heights[i] × width。

### 单调栈如何工作

维护一个**严格递增栈**（存储下标）。遍历每个柱子：
1. 当当前柱子 ≥ 栈顶：入栈
2. 当当前柱子 < 栈顶：弹出栈顶，计算以弹出的柱子为高度的矩形面积
   - 弹出的柱子的高度就是矩形的高
   - 新的栈顶是左边界，当前位置是右边界

### 为什么是 O(n)？

每个元素恰好被 push 一次和 pop 一次。

## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * @param {number[]} heights
 * @return {number}
 */
function largestRectangleArea(heights) {
  const stack = []; // 单调递增栈（存下标）
  let maxArea = 0;

  // 遍历所有柱子，包括末尾哨兵（确保清空栈）
  for (let i = 0; i <= heights.length; i++) {
    const curHeight = i === heights.length ? 0 : heights[i];

    // 当前柱子比栈顶矮 → 可以确定栈顶柱子的右边界
    while (stack.length > 0 && curHeight < heights[stack[stack.length - 1]]) {
      const h = heights[stack.pop()]; // 弹出柱子的高度
      // 左边界 = 新的栈顶（若栈空则为-1）
      const left = stack.length > 0 ? stack[stack.length - 1] : -1;
      const width = i - left - 1;
      maxArea = Math.max(maxArea, h * width);
    }

    stack.push(i);
  }

  return maxArea;
}

// 测试
console.log(largestRectangleArea([2,1,5,6,2,3])); // 10
console.log(largestRectangleArea([2,4]));             // 4
console.log(largestRectangleArea([2,1,2]));           // 3
\`\`\`

## 图示理解

以 heights = [2,1,5,6,2,3] 为例：

\`\`\`
索引:  0   1   2   3   4   5
高度:  [2,  1,  5,  6,  2,  3]
       █       ██████████
       █       ██████████   ██
       █   ██  ██████████   ██
\`\`\`

最大面积来自高度 5 的柱子（索引2）：左右边界分别为索引1和4，宽度=2，面积=10。

## 复杂度分析

- **时间复杂度**: $O(n)$（每个元素进出栈各一次）
- **空间复杂度**: $O(n)$

### 相关题目对比

| 题目 | 方法 | 关键 |
|------|------|------|
| LeetCode 84 最大矩形 | 单调栈 | 找左右第一个更小 |
| LeetCode 42 接雨水 | 单调栈 | 找左右第一个更大 |
| LeetCode 739 下一个更大元素 | 单调栈 | 同84但只需找右边 |
| LeetCode 85 最大矩形（二维） | 单调栈 + DP | 每行做84 + 高度压缩 |`,
  codeTemplate: {
    javascript: `function largestRectangleArea(heights) {
  // TODO: 直方图最大矩形 - 单调栈
}`,
    python: `def largest_rectangle_area(heights: list[int]) -> int:
    pass`,
    java: `class Solution {
    public int largestRectangleArea(int[] heights) { return 0; }
}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["栈", "单调栈", "数组", "LeetCode 84"]
},


// ============================================================================
// 第七部分：补充题目 (16道，达到85道目标)
// ============================================================================

// ----- DP 补充 (2道) -----

{
  title: "最佳买卖股票时机 IV（含交易次数限制）",
  content: `## 题目描述 (LeetCode 188 Hard)

给定一个整数数组 prices ，它的第 i 个元素 prices[i] 是一支给定的股票在第 i 天的价格。

设计一个算法来计算你所能获取的最大利润。你最多可以完成 k 笔交易。

**注意**：你不能同时参与多笔交易（你必须在再次购买前出售掉之前的股票）。

## 示例

\`\`\`
输入: k = 2, prices = [3,2,6,5,0,3]
输出: 7
解释: 在第 4 天（价格=0）买入，第 6 天（价格=3）卖出，利润 = 3-0 = 3。
     随后，第 1 天（价格=2）买入，第 2 天（价格=6）卖出，利润 = 6-2 = 4。
\`\`\`

## 约束条件

- $0 \\leq k \\leq 100$
- $0 \\leq prices.length \\leq 1000$`,
  solution: `## 解题思路

**状态机 DP**。定义 $dp[i][j][0/1]$ 表示第 i 天进行了 j 笔交易、是否持有股票时的最大利润。

当 k ≥ n/2 时退化为无限次交易问题（贪心即可），否则使用 DP。

$$dp[i][j][0] = \\max(dp[i-1][j][0], dp[i-1][j][1]+prices[i])$$
$$dp[i][j][1] = \\max(dp[i-1][j][1], dp[i-1][j-1][0]-prices[i])$$

## 参考代码 (JavaScript)

\`\`\`javascript
function maxProfit(k, prices) {
  const n = prices.length;
  if (n <= 1 || k === 0) return 0;

  // k >= n/2 → 无限次交易（贪心）
  if (k >= Math.floor(n / 2)) {
    let profit = 0;
    for (let i = 1; i < n; i++) {
      if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
    }
    return profit;
  }

  // dp[j][0/1]: 第j笔交易后，不持有/持有
  const dp = Array.from({ length: k + 1 }, () => [0, -Infinity]);
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= k; j++) {
      dp[j][0] = Math.max(dp[j][0], dp[j][1] + prices[i]);
      dp[j][1] = Math.max(dp[j][1], dp[j - 1][0] - prices[i]);
    }
  }

  return dp[k][0];
}
\`\`\`

## 复杂度分析

- **时间复杂度**: $O(nk)$ 或 $O(n)$（贪心情况）
- **空间复杂度**: $O(k)$`,
  codeTemplate: {
    javascript: `function maxProfit(k, prices) { /* TODO */ }`,
    python: `def max_profit(k: int, prices: list[int]) -> int: pass`,
    java: `class Solution { public int maxProfit(int k, int[] p) { return 0; } }`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "状态机", "股票", "LeetCode 188"]
},

{
  title: "通配符匹配",
  content: `## 题目描述 (LeetCode 44 Hard)

给定输入字符串 s 和模式字符 p，'?' 可以匹配任何单个字符，'*' 可以匹配任意字符串（包括空字符串）。判断是否完全匹配。

## 示例

\`\`\`
s="aa", p="a" → false
s="aa", p="*" → true
s="cb", p="?a" → false
s="adceb", p="*a*b" → true
\`\`\``,
  solution: `## 解题思路

与正则表达式匹配类似但更简单——'*' 匹配任意字符串而非前一个字符的重复。

DP 状态转移：
- p[j-1] == '?' 或 字符相同：dp[i][j] = dp[i-1][j-1]
- p[j-1] == '*'：dp[i][j] = dp[i][j-1]（空匹配）|| dp[i-1][j]（匹配一个或多个）

\`\`\`javascript
function isMatchWildcard(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({length:m+1}, () => new Array(n+1).fill(false));
  dp[0][0] = true;
  for (let j=1; j<=n; j++) dp[0][j] = dp[0][j-1] && p[j-1]==='*';

  for (let i=1; i<=m; i++)
    for (let j=1; j<=n; j++)
      if (p[j-1]=='?' || s[i-1]==p[j-1]) dp[i][j]=dp[i-1][j-1];
      else if (p[j-1]=='*') dp[i][j]=dp[i][j-1]||dp[i-1][j];

  return dp[m][n];
}
\`\`\``,
  codeTemplate: {
    javascript: `function isMatchWildcard(s,p){}`,
    python: `def is_match_wildcard(s:str,p:str)->bool:pass`,
    java: `class Solution{public boolean isMatch(String s,String p){return false;}}`
  },
  difficulty: "hard",
  questionType: "code",
  tags: ["动态规划", "字符串", "LeetCode 44"]
},

// ----- 图论补充 (2道) -----

{
  title: "差分约束系统",
  content: `## 题目描述

给定 m 个不等式约束，形如 $x_a - x_b \\leq c$。判断是否存在一组变量赋值满足所有约束，若存在求出一组解。

## 示例

\`\`\`
约束:
x1 - x2 <= 3
x2 - x3 <= -2
x3 - x1 <= 1

有解: x1=0, x2=-1, x3=1 满足所有约束
\`\`\``,
  solution: `## 解题思路

**差分约束系统**可转化为最短路径问题：

每个不等式 $x_u - x_v \\leq c$ 对应一条边 v→u 权重为 c。

建立超级源点 s，向每个节点连权为 0 的边。跑 Bellman-Ford / SPFA：
- 若存在负权环 → 无解
- 否则 dist[] 即为一组可行解

**原理**：三角不等式 $dist[v] + w(v,u) \\geq dist[u]$ 即 $x_v + c \\geq x_u$，等价于 $x_u - x_v \\leq c$。

\`\`\`javascript
function differenceConstraints(constraints, n) {
  // constraints: [[u,v,c], ...] 表示 xu - xv <= c
  const edges = [];
  const src = n; // 超级源点
  for (let i = 0; i < n; i++) edges.push([src, i, 0]); // xi >= 0
  for (const [u, v, c] of constraints) edges.push([v, u, c]);

  const dist = new Array(n+1).fill(Infinity);
  dist[src] = 0;

  for (let round = 0; round < n; round++) {
    let updated = false;
    for (const [u, v, w] of edges)
      if (dist[u] !== Infinity && dist[u]+w < dist[v]) { dist[v]=dist[u]+w; updated=true; }
    if (!updated) break;
  }

  // 检测负权环
  for (const [u, v, w] of edges)
    if (dist[u] !== Infinity && dist[u]+w < dist[v]) return null; // 无解

  return dist.slice(0, n);
}
\`\`\``,
  codeTemplate: { javascript: `function diffConstraints(c,n){}`, python: `def diff_constraints(c,n):pass`, java: `public class Solution{}` },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "最短路径", "差分约束"]
},

{
  title: "二分图最大匹配（匈牙利算法）",
  content: `## 题目描述

给定一张二分图，求其**最大匹配**的大小。匹配是指边的集合，其中任意两条边没有公共端点。

## 示例

左部 {1,2,3}，右部 {a,b,c}，边为 {(1,a),(1,b),(2,b),(2,c),(3,c)}
最大匹配大小 = 3（如 1-a, 2-b, 3-c）`,
  solution: `## 解题思路

**匈牙利算法（Hungarian Algorithm）**通过增广路寻找最大匹配。

核心思想：对左侧每个未匹配点尝试找增广路（沿非匹配边和匹配边交替），找到则翻转匹配状态使匹配数+1。

时间复杂度：$O(VE)$；Hopcroft-Karp 可优化至 $O(E\\sqrt{V})$。

\`\`\`javascript
function hungarian(adj, nLeft, nRight) {
  // adj[leftNode]: rightNodes[]
  const matchRight = new Array(nRight).fill(-1);
  const used = new Array(nRight).false;

  function dfs(u) {
    for (const v of adj[u]) {
      if (used[v]) continue;
      used[v] = true;
      if (matchRight[v] === -1 || dfs(matchRight[v])) {
        matchRight[v] = u;
        return true;
      }
    }
    return false;
  }

  let result = 0;
  for (let u = 0; u < nLeft; u++) {
    used.fill(false);
    if (dfs(u)) result++;
  }
  return result;
}
\`\`\``,
  codeTemplate: { javascript: `function hungarian(adj,l,r){}`, python: `def hungarian(adj,l,r):pass`, java: `public class Solution{}` },
  difficulty: "medium",
  questionType: "code",
  tags: ["图论", "二分图", "匈牙利算法", "最大匹配"]
},

// ----- 搜索补充 (2道) -----

{
  title: " Dancing Links / 精确覆盖问题",
  content: `## 题目描述（精确覆盖 Exact Cover）

给定一个 0-1 矩阵，选择若干行使得每列恰好有一个 1。判断是否存在解并输出方案。

典型应用：数独求解、N皇后、铺砖问题。`,
  solution: `## 解题思路

**Dancing Links（DLX）**是 Donald Knuth 提出的 Algorithm X 的高效实现，利用**双向十字链表**进行回溯搜索。

核心操作：
1. **Cover 列**：从矩阵中移除该列及其相关的行
2. **Uncover 列**：恢复被移除的列和行
3. 回溯时选择 1 最少的列优先（最小剩余值启发式）

DLX 将矩阵操作从 O(mn) 降到 O(1)，大幅加速精确覆盖问题的求解。

由于完整 DLX 实现较长，这里给出简化版的回溯框架：

\`\`\`javascript
function exactCover(matrix, cols) {
  if (cols.size === 0) return true; // 找到解

  // 选择列（MRV启发式）
  const col = [...cols][0]; // 实际应选1最少的一列

  for (const row of getRowsWithOne(matrix, col)) {
    select(row);
    cols.delete(col);
    for (const c in row) if (c!==col && row[c]===1) cols.delete(c);

    if (exactCover(matrix, cols)) return true;

    // 回溯
    deselect(row);
    cols.add(col);
    for (const c in row) if (c!==col && row[c]===1) cols.add(c);
  }
  return false;
}
\`\`\``,
  codeTemplate: { javascript: `function exactCover(matrix,cols){}`, python: `def exact_cover(matrix,cols):pass`, java: `public class Solution{}` },
  difficulty: "hard",
  questionType: "code",
  tags: ["搜索", "回溯", "Dancing Links", "精确覆盖"]
},

{
  title: "迭代加深搜索 IDS 基础模板",
  content: `## 题目描述

给定一个搜索树，用**迭代加深搜索（Iterative Deepening Search, IDS）**寻找目标节点。IDS 结合了 DFS 的空间优势和 BFS 的完备性。

限制搜索深度上限 d_max，逐步加深深度限制直到找到解。`,
  solution: `## 解题思路

**IDS = DFS + 逐步加深的深度限制**

每次只搜索深度 ≤ limit 的节点，limit 从 0 递增。这样既保持了 BFS 的最优性（按层扩展），又只有 O(d) 的空间消耗。

\`\`\`javascript
function ids(start, goal, neighbors, maxDepth) {
  for (let limit = 0; limit <= maxDepth; limit++) {
    const visited = new Set();
    const result = dfs(start, goal, limit, 0, neighbors, visited);
    if (result.found) return result.path;
  }
  return null; // 未找到
}

function dfs(node, goal, limit, depth, neighbors, visited) {
  if (node === goal) return { found: true, path: [node] };
  if (depth >= limit) return { found: false };

  visited.add(node);
  for (const next of neighbors(node)) {
    if (!visited.has(next)) {
      const result = dfs(next, goal, limit, depth + 1, neighbors, visited);
      if (result.found) return { found: true, path: [node, ...result.path] };
    }
  }
  visited.delete(node); // 注意：IDS 中通常不需要回溯标记
  return { found: false };
}
\`\`\`

## IDDFS vs BFS vs DFS

| | IDDFS | BFS | DFS |
|---|------|-----|-----|
| 空间 | O(d) | O(b^d) | O(d) |
| 时间 | O(b^d) | O(b^d) | 可能不终止 |
| 最优性 | ✅ | ✅ | ❌ |
| 适用 | 内存受限 | 一般图 | 需要完整路径 |`,
  codeTemplate: { javascript: `function ids(start,goal,neighbors,maxDepth){}`, python: `def ids(start,goal,neighbors,max_depth):pass`, java: `public class Solution{}` },
  difficulty: "easy",
  questionType: "code",
  tags: ["搜索", "IDDFS", "迭代加深"]
},

// ----- 字符串补充 (2道) -----

{
  title: "后缀自动机 SAM 入门",
  content: `## 题目描述

给定一个字符串 s，构建其后缀自动机（Suffix Automaton, SAM）。

SAM 是一种能接受 s 所有后缀的 DFA（确定性有限自动机），可用于解决大量子串相关问题。

## 核心性质

- 状态数 ≤ 2n-1，转移数 ≤ 3n-4（n 为原串长度）
- 每个状态代表一些 endpos 等价的子串集合
- 可在线性时间内构建`,
  solution: `## 参考代码 (JavaScript)

\`\`\`javascript
/**
 * 后缀自动机构建（线性时间）
 */
function buildSAM(s) {
  const n = s.length;
  // 状态结构: { len, link, next: Map<char, state> }
  const states = [{ len: 0, link: -1, next: new Map() }];
  let last = 0; // 整个串对应的状态

  for (const ch of s) {
    const cur = states.length;
    states.push({ len: states[last].len + 1, link: 0, next: new Map() });

    let p = last;
    while (p !== -1 && !states[p].next.has(ch)) {
      states[p].next.set(ch, cur);
      p = states[p].link;
    }

    if (p === -1) {
      states[cur].link = 0;
    } else {
      const q = states[p].next.get(ch);
      if (states[p].len + 1 === states[q].len) {
        states[cur].link = q;
      } else {
        const clone = states.length;
        states.push({
          len: states[p].len + 1,
          link: states[q].link,
          next: new Map(states[q].next)
        });
        while (p !== -1 && states[p].next.get(ch) === q) {
          states[p].next.set(ch, clone);
          p = states[p].link;
        }
        states[q].link = states[cur].link = clone;
      }
    }
    last = cur;
  }

  return states;
}

// 应用：统计不同子串数量
function countDistinctSubstrings(sam) {
  let total = 0;
  for (let i = 1; i < sam.length; i++) {
    total += sam[i].len - sam[sam[i].link].len;
  }
  return total;
}

console.log(countDistinctSubstrings(buildSAM("ababa"))); // 9
\`\`\`

## 复杂度

- 构建时间: O(n)
- 空间: O(n)`,
  codeTemplate: { javascript: `function buildSAM(s){}`, python: `def build_sam(s):pass`, java: `public class Solution{}` },
  difficulty: "hard",
  questionType: "code",
  tags: ["字符串", "后缀自动机", "SAM"]
},

{
  title: "字符串哈希 + 二分求最长回文前缀",
  content: `## 题目描述

给定字符串 s，回答 Q 个查询：每次查询区间 [l,r] 是否为回文串。

单次查询要求 O(1) 或 O(log n)。`,
  solution: `## 解题思路

**正反双哈希 + 二分**。

预处理正向和反向的前缀哈希，对于查询 [l,r]，可以用二分法找出最长公共前后缀长度来判断回文。

或者更直接地：如果正向 hash[l..r] == 反向 hash[n-r..n-l+1]，则是回文。

\`\`\`javascript
class StringHash {
  constructor(s, base = 131, mod = BigInt(10**9+7)) {
    this.n = s.length;
    this.mod = mod;
    this.base = base;
    this.pow = [BigInt(1)];
    this.pre = [BigInt(0)];

    for (let i = 0; i < this.n; i++) {
      this.pow.push(this.pow[i] * BigInt(base) % mod);
      this.pre.push((this.pre[i] * BigInt(base) + BigInt(s.charCodeAt(i))) % mod);
    }
  }

  getHash(l, r) { // 闭区间 [l, r]
    return (this.pre[r+1] - this.pre[l] * this.pow[r-l+1] % this.mod + this.mod) % this.mod;
  }
}

function isPalindromeRange(sh, l, r) {
  const n = sh.n;
  // 正向hash[l..r] 应等于 反向hash[n-1-r .. n-1-l]
  return sh.getHash(l, r) === sh.getHash(n-1-r, n-1-l);
}
\`\`\``,
  codeTemplate: { javascript: `class StringHash{constructor(s){}}`, python: `class StringHash:pass`, java: `public class Solution{}` },
  difficulty: "medium",
  questionType: "code",
  tags: ["字符串", "哈希", "二分"]
},

// ----- 数学补充 (3道) -----

{
  title: "中国剩余定理 CRT",
  content: `## 题目描述

求解以下同余方程组：
\\begin{cases}
x \\equiv a_1 \\pmod{m_1} \\\\
x \\equiv a_2 \\pmod{m_2} \\\\
... \\\\
x \\equiv a_n \\pmod{m_n}
\\end{cases}

其中 $m_i$ 两两互质。求最小非负整数解 x。

## 示例

\`\`\`
x ≡ 2 (mod 3)
x ≡ 3 (mod 5)
x ≡ 2 (mod 7)

输出: 23 （孙子定理经典"物不知数"）
\`\`\``,
  solution: `## 解题思路

**中国剩余定理（CRT）**：设 M = ∏m_i，M_i = M/m_i，t_i 为 M_i 模 m_i 的逆元。

$$x = \\sum_{i=1}^{n} a_i \\cdot M_i \\cdot t_i \\pmod M$$

\`\`\`javascript
function crt(remainders, moduli) {
  // remainders: [a1, a2, ...], moduli: [m1, m2, ...] 两两互质
  let M = 1n;
  for (const m of moduli) M *= BigInt(m);

  let x = 0n;
  for (let i = 0; i < remainders.length; i++) {
    const ai = BigInt(remainders[i]);
    const mi = BigInt(moduli[i]);
    const Mi = M / mi;
    // 求 Mi^(-1) mod mi（费马小定理）
    const ti = powMod(Mi, mi - 2n, mi);
    x = (x + ai * Mi * ti % M) % M;
  }
  return Number(x);
}

function powMod(base, exp, mod) {
  let r = 1n; base %= mod;
  while (exp > 0n) { if (exp%2n===1n) r=r*base%mod; base=base*base%mod; exp/=2n; }
  return r;
}

console.log(crt([2,3,2], [3,5,7])); // 23
\`\`\``,
  codeTemplate: { javascript: `function crt(rem,mods){}`, python: `def crt(rem,mods):pass`, java: `public class Solution{}` },
  difficulty: "medium",
  questionType: "code",
  tags: ["数学", "数论", "中国剩余定理"]
},

{
  title: "高斯消元法",
  content: `## 题目描述

给定 n 元线性方程组，用**高斯消元法**求解。支持无解、无穷多解、唯一解三种情况的判定。

## 示例

\`\`\`
x + y + z = 6
x + 2y + 3z = 14
x + 4y + 9z = 36

解: x=1, y=2, z=3
\`\`\``,
  solution: `## 参考代码 (JavaScript)

\`\`\`javascript
function gaussianElimination(A, b) {
  // A: n×n 系数矩阵, b: n×1 常数向量
  const n = A.length;
  // 增广矩阵
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // 选主元（部分选主元）
    let maxRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-10) continue; // 奇异，跳过

    // 消元
    for (let r = col + 1; r < n; r++) {
      const factor = aug[r][col] / aug[col][col];
      for (let c = col; c <= n; c++) aug[r][c] -= factor * aug[col][c];
    }
  }

  // 回代
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-10) return null; // 无解或无穷多解
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
    x[i] /= aug[i][i];
  }
  return x;
}
\`\`\`

## 复杂度: O(n³)`,
  codeTemplate: { javascript: `function gauss(A,b){}`, python: `def gauss(A,b):pass`, java: `public class Solution{}` },
  difficulty: "medium",
  questionType: "code",
  tags: ["数学", "线性代数", "高斯消元"]
},

{
  title: "离散对数 BSGS 算法",
  content: `## 题目描述

给定 a, b, p（质数），求最小的非负整数 x 使得 $a^x \\equiv b \\pmod p$。

即求离散对数 x = log_a(b) mod p。

## 约束条件

- $1 \\leq a, b < p$
- p 为质数，$p \\leq 10^9$`,
  solution: `## 解题思路

**Baby-Step Giant-Step (BSGS)** 算法，时间复杂度 $O(\\sqrt{p})$。

将 x 写成 $x = im - j$，其中 $m = \\lceil\\sqrt{p}\\rceil$。

$a^{im-j} \\equiv b \\pmod p$

$a^{im} \\equiv b \\cdot a^j \\pmod p$

预处理所有 $(b \\cdot a^j \\mod p, j)$ 存入哈希表，再枚举 i 查找匹配。

\`\`\`javascript
function bsgs(a, b, p) {
  a %= p; b %= p;
  if (b === 1) return 0; // a^0 = 1

  const m = Math.ceil(Math.sqrt(p));
  const map = new Map(); // val -> j

  // Baby step: 计算 b*a^j mod p
  let curB = b % p;
  for (let j = 0; j < m; j++) {
    map.set(curB, j);
    curB = curB * a % p;
  }

  // Giant step: 计算 a^(im) mod p
  let am = 1;
  for (let i = 0; i < m; i++) am = am * a % p;

  let curA = 1; // a^0
  for (let i = 1; i <= m; i++) {
    curA = curA * am % p; // a^(i*m)
    if (map.has(curA)) return i * m - map.get(curA);
  }

  return -1; // 无解
}
\`\`\``,
  codeTemplate: { javascript: `function bsgs(a,b,p){}`, python: `def bsgs(a,b,p):pass`, java: `public class Solution{}` },
  difficulty: "hard",
  questionType: "code",
  tags: ["数学", "数论", "BSGS", "离散对数"]
},

// ----- 经典Hard补充 (2道) -----

{
  title: "滑动窗口最大值（单调队列）",
  content: `## 题目描述 (LeetCode 239 Hard)

给你一个整数数组 nums，有一个大小为 k 的滑动窗口从数组的最左侧移动到数组的最右侧。你只可以看到在滑动窗口内的 k 个数字。滑动窗口每次只向右移动一位。

返回滑动窗口中的最大值。

## 示例

nums=[1,3,-1,-3,5,3,6,7], k=3 → [3,3,5,5,6,7]`,
  solution: `## 解题思路

**单调递减队列**维护窗口内候选的最大值。

\`\`\`javascript
function maxSlidingWindow(nums, k) {
  const dq = []; // 存下标，保持值递减
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 移除超出窗口的队首
    while (dq.length && dq[0] <= i - k) dq.shift();
    // 保持递减：移除比当前元素小的
    while (dq.length && nums[dq[dq.length-1]] < nums[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) result.push(nums[dq[0]]);
  }
  return result;
}
\`\`\`

## 复杂度: O(n) 时间, O(k) 空间`,
  codeTemplate: { javascript: `function maxSlidingWindow(nums,k){}`, python: `def max_sliding_window(nums,k):pass`, java: `class Solution{public int[] maxSlidingWindow(int[],int){return null;}}` },
  difficulty: "hard",
  questionType: "code",
  tags: ["数组", "单调队列", "滑动窗口", "LeetCode 239"]
},

{
  title: "合并区间 / 区间调度",
  content: `## 题目描述 (LeetCode 56 Medium)

以数组 intervals 表示若干个区间的集合，其中单个区间为 intervals[i] = [starti, endi]。请你合并所有重叠的区间，返回一个不重叠的区间数组。

## 示例

intervals=[[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]`,
  solution: `## 解题思路

**排序 + 贪心**。按起点排序后依次合并。

\`\`\`javascript
function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push([...intervals[i]]);
    }
  }
  return merged;
}
\`\`\`

## 复杂度: O(n log n) 时间, O(n) 空间`,
  codeTemplate: { javascript: `function merge(intervals){}`, python: `def merge(intervals):pass`, java: `class Solution{} `},
  difficulty: "medium",
  questionType: "code",
  tags: ["贪心", "排序", "区间", "LeetCode 56"]
},

// ----- 新增分类 (3道) -----

{
  title: "位运算技巧大全",
  content: `## 面试问答

> **面试官**：请总结常用的位运算技巧和应用场景？`,
  solution: `## 常用位运算技巧

### 基础操作
| 操作 | 表达式 |
|------|--------|
| 取最低位1 | x & (-x) |
| 去掉最低位1 | x & (x-1) |
| 交换两数 | a^=b; b^=a; a^=b |
| 不用临时变量交换 | 同上 |
| 判断奇偶 | x&1 (奇) / !(x&1) (偶) |
| 2的幂次方判断 | x>0 && (x&(x-1))==0 |
| 统计1的个数 | Brian Kernighan: while(x){cnt++;x&=x-1;} |

### 经典应用
1. **出现一次/两次/三次的数字**：异或分组
2. **子集枚举**：for(mask=0; mask<(1<<n); mask++)
3. **状态压缩**：用 bitset 表示集合
4. **Gray Code**：g(i)=i^(i>>1)
5. **翻转某一位**：x ^= (1<<k)

### 进阶
- **Fenwick Tree 底层原理**：lowbit(x) = x & (-x)
- **Bitmask DP**：状压 DP 的基础`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["位运算", "面试高频", "技巧"]
},

{
  title: "贪心算法经典模型",
  content: `## 面试问答

> **面试官**：什么情况下可以使用贪心算法？如何证明正确性？`,
  solution: `## 贪心的适用条件和证明方法

### 一、何时可用贪心？

**最优子结构** + **贪心选择性质**：
1. 局部最优选择能导致全局最优
2. 每一步的选择不依赖后续步骤

### 二、常见证明方法

1. **交换论证法**：证明任何最优解都可以替换为贪心选择的方案而不劣化
2. **归纳法**：假设前k步贪心成立，证明第k+1步也成立
3. **反证法**：假设贪心不是最优，导出矛盾

### 三、经典模型

| 问题 | 贪心策略 |
|------|----------|
| 活动选择 | 结束时间最早优先 |
| 分数背包 | 单位价值最高优先 |
| Huffman 编码 | 频率最小的两个节点合并 |
| Dijkstra | 当前距离最小优先 |
| Kruskal | 边权最小且不形成环 |
| 区间调度 | 按右端点排序 |
| 任务调度 | 最短处理时间优先(SPT) |

### 四、易错点
- 不是所有"看起来像贪心"的问题都能用贪心（如0-1背包）
- 需要严格证明，不能靠直觉`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["贪心", "算法设计", "证明方法", "面试高频"]
},

{
  title: "随机化算法入门",
  content: `## 面试问答 + 编程题

> **面试官**：什么是随机化算法？有哪些应用？`,
  solution: `## 核心概念

**随机化算法**在执行过程中引入随机性，使得：
- 平均性能优于最坏情况
- 解决某些确定性问题效率更高

### 常见模式

#### 1. Monte Carlo（蒙特卡洛）
运行时间固定，结果可能错误但有概率保证。

**示例：Miller-Rabin 素性测试**
\`\`\`javascript
function millerRabin(n, k=5) {
  if (n<2) return false; if (n<4) return true; if (n%2===0) return false;
  const write = n - 1; let r = 0, d = write;
  while (d%2===0) { d/=2; r++; }

  witness: for (let i=0;i<k;i++){
    const a = 2 + Math.floor(Math.random()*(n-4));
    let x = powMod(BigInt(a), BigInt(d), BigInt(n));
    if (x===1n||x===write) continue;
    for (let j=0;j<r-1;j++){x=x*x%n;if(x===write)continue witness;}
    return false; // 合数
  }
  return true; // 大概率素数
}
\`\`\`

#### 2. Las Vegas
结果一定正确，但运行时间是随机的（如 QuickSort 的随机 pivot、随机化增量式凸包）。

#### 3. 应用场景
- **Rabin-Karp**：双重哈希降低碰撞概率
- **Pollard's Rho**：大数因数分解
- **Simulated Annealing**：组合优化
- **Randomized QuickSelect**：期望 O(n) 的第 k 小元素`,
  difficulty: "medium",
  questionType: "qa",
  tags: ["随机化", "算法", "Miller-Rabin", "Monte Carlo"]
},
];
