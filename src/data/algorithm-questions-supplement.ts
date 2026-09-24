// 算法与数据结构面试题库 - 补充批次（120道）
// 重点：高级数据结构、DP进阶、图论进阶、搜索进阶、字符串高级、数学数论
// 分布：easy~20, medium~55, hard~45 | code~90, qa~30

export interface AlgorithmQuestionSupplement {
  title: string;
  content: string;
  solution?: string;
  codeTemplate?: Record<string, string>;
  difficulty: "easy" | "medium" | "hard";
  questionType: "code" | "qa";
  tags: string[];
}

export const algorithmQuestionsSupplement: AlgorithmQuestionSupplement[] = [
  // ==================== 一、高级数据结构（30道）====================

  // ---------- 线段树（5道）----------

  {
    title: "区域和检索 - 数组不可修改",
    content: `## 题目描述

给定一个整数数组 \`nums\`，处理以下类型的多个查询：

1. **计算索引 \`left\` 和 \`right\`（包含 left 和 right）之间 nums 元素的 **和** ，其中 \`left <= right\`

实现 \`NumArray\` 类：

- \`NumArray(int[] nums)\` 用整数数组 \`nums\` 初始化对象
- \`int sumRange(int left, int right)\` 返回数组 \`nums\` 中索引 \`left\` 和 \`right\` 之间（包含）的元素的 **和** （即 \`nums[left] + nums[left + 1] + ... + nums[right]\` )

### 示例 1

**输入**
\`\`\`
["NumArray", "sumRange", "sumRange", "sumRange"]
[[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]]
\`\`\`
**输出**
\`\`\`
[null, 1, -1, -3]
\`\`\`

**解释**
\`\`\`
NumArray numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
numArray.sumRange(0, 2); // return 1 ((-2) + 0 + 3)
numArray.sumRange(2, 5); // return -1 (3 + (-5) + 2 + (-1))
numArray.sumRange(0, 5); // return -3 ((-2) + 0 + 3 + (-5) + 2 + (-1))
\`\`\`

### 提示

- \`1 <= nums.length <= 10^4\`
- \`-10^5 <= nums[i] <= 10^5\`
- \`0 <= left <= right < nums.length\`
- 最多调用 \`10^4\` 次 \`sumRange\` 方法`,
    solution: `## 解法一：前缀和（最优解）

### 思路分析

由于数组不可修改，可以使用**前缀和**预处理。构建前缀和数组 prefixSum，其中 prefixSum[i] 表示 nums[0..i-1] 的和。查询时 O(1) 时间复杂度。

如果要用线段树实现（学习目的），可以构建一棵线段树，每个节点存储区间的和。

### 代码实现（前缀和 - 最优）

\`\`\`javascript
var NumArray = function(nums) {
  this.prefixSum = new Array(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    this.prefixSum[i + 1] = this.prefixSum[i] + nums[i];
  }
};

NumArray.prototype.sumRange = function(left, right) {
  return this.prefixSum[right + 1] - this.prefixSum[left];
};
\`\`\`

### 代码实现（线段树版本 - 学习用）

\`\`\`javascript
class SegmentTreeNode {
  constructor(start, end, sum) {
    this.start = start;
    this.end = end;
    this.sum = sum;
    this.left = null;
    this.right = null;
  }
}

var NumArray = function(nums) {
  this.root = this.buildTree(nums, 0, nums.length - 1);
};

NumArray.prototype.buildTree = function(nums, start, end) {
  if (start > end) return null;
  const node = new SegmentTreeNode(start, end, 0);
  if (start === end) {
    node.sum = nums[start];
  } else {
    const mid = Math.floor((start + end) / 2);
    node.left = this.buildTree(nums, start, mid);
    node.right = this.buildTree(nums, mid + 1, end);
    node.sum = (node.left ? node.left.sum : 0) + (node.right ? node.right.sum : 0);
  }
  return node;
};

NumArray.prototype.sumRange = function(left, right) {
  return this.query(this.root, left, right);
};

NumArray.prototype.query = function(node, start, end) {
  if (!node || node.end < start || node.start > end) return 0;
  if (node.start >= start && node.end <= end) return node.sum;
  return this.query(node.left, start, end) + this.query(node.right, start, end);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：
  - 前缀和：初始化 O(n)，每次查询 O(1)
  - 线段树：初始化 O(n)，每次查询 O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var NumArray = function(nums) {\n  \n};\n\nNumArray.prototype.sumRange = function(left, right) {\n  \n};",
      python: "class NumArray:\n    def __init__(self, nums: List[int]):\n        pass\n    def sumRange(self, left: int, right: int) -> int:\n        pass",
      java: "class NumArray {\n    public NumArray(int[] nums) {\n        \n    }\n    public int sumRange(int left, int right) {\n        \n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["线段树", "前缀和", "设计"],
  },

  {
    title: "区域和检索 - 数组可修改",
    content: `## 题目描述

给你一个数组 \`nums\` ，请你完成两类查询：

1. **更新**：将数组中下标为 \`index\` 的元素值变为 \`val\`
2. **求和**：返回数组中下标在区间 \`[left, right]\` 内所有元素的和（**包含** 下标 \`left\` 和 \`right\` ）

实现 \`NumArray\` 类：

- \`NumArray(int[] nums)\` 用整数数组 \`nums\` 初始化对象
- \`void update(int index, int val)\` 将 \`nums[index]\` 的值改为 \`val\`
- \`int sumRange(int left, int right)\` 返回数组 \`nums\` 中下标在区间 \`[left, right]\` 内所有元素的和（包含下标 \`left\` 和 \`right\` ）

### 示例 1

**输入**
\`\`\`
["NumArray", "sumRange", "update", "sumRange"]
[[[1, 3, 5]], [0, 2], [1, 2], [0, 2]]
\`\`\`
**输出**
\`\`\`
[null, 9, null, 8]
\`\`\`

**解释**
\`\`\`
NumArray numArray = new NumArray([1, 3, 5]);
numArray.sumRange(0, 2); // 返回 1 + 3 + 5 = 9
numArray.update(1, 2);   // nums = [1, 2, 5]
numArray.sumRange(0, 2); // 返回 1 + 2 + 5 = 8
\`\`\`

### 提示

- \`1 <= nums.length <= 3 * 10^4\`
- \`-100 <= nums[i] <= 100\`
- \`0 <= index < nums.length\`
- \`-100 <= val <= 100\`
- \`0 <= left <= right < nums.length\`
- 最多调用 \`3 * 10^4\` 次 \`sumRange\` 和 \`update\` 方法`,
    solution: `## 解法：线段树 / 树状数组

### 思路分析

由于数组需要频繁修改和查询区间和，前缀和方法不再适用。使用**线段树**或**树状数组（Fenwick Tree）**可以在 O(log n) 时间内完成单点更新和区间查询。

这里展示**线段树**的实现。

### 代码实现

\`\`\`javascript
class SegmentTree {
  constructor(data) {
    this.n = data.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.build(data, 0, 0, this.n - 1);
  }

  build(data, node, start, end) {
    if (start === end) {
      this.tree[node] = data[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(data, 2 * node + 1, start, mid);
      this.build(data, 2 * node + 2, mid + 1, end);
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  update(index, val, node = 0, start = 0, end = undefined) {
    if (end === undefined) end = this.n - 1;
    if (start === end) {
      this.tree[node] = val;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (index <= mid) {
        this.update(index, val, 2 * node + 1, start, mid);
      } else {
        this.update(index, val, 2 * node + 2, mid + 1, end);
      }
      this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
    }
  }

  query(left, right, node = 0, start = 0, end = undefined) {
    if (end === undefined) end = this.n - 1;
    if (right < start || left > end) return 0;
    if (left <= start && end <= right) return this.tree[node];
    const mid = Math.floor((start + end) / 2);
    return this.query(left, right, 2 * node + 1, start, mid) +
           this.query(left, right, 2 * node + 2, mid + 1, end);
  }
}

var NumArray = function(nums) {
  this.segTree = new SegmentTree(nums);
};

NumArray.prototype.update = function(index, val) {
  this.segTree.update(index, val);
};

NumArray.prototype.sumRange = function(left, right) {
  return this.segTree.query(left, right);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：初始化 O(n)，update O(log n)，sumRange O(log n)
- **空间复杂度**：O(n)，线段树需要 4n 空间`,
    codeTemplate: {
      javascript: "var NumArray = function(nums) {\n  \n};\n\nNumArray.prototype.update = function(index, val) {\n  \n};\n\nNumArray.prototype.sumRange = function(left, right) {\n  \n};",
      python: "class NumArray:\n    def __init__(self, nums: List[int]):\n        pass\n    def update(self, index: int, val: int) -> None:\n        pass\n    def sumRange(self, left: int, right: int) -> int:\n        pass",
      java: "class NumArray {\n    public NumArray(int[] nums) {\n        \n    }\n    public void update(int index, int val) {\n        \n    }\n    public int sumRange(int left, int right) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["线段树", "树状数组", "设计"],
  },

  {
    title: "计数二进制子串",
    content: `## 题目描述

给定一个字符串 \`s\`，统计并返回具有相同数量 0 和 1 的非空（连续）子字符串的数量，并且这些子字符串中的所有 0 和所有 1 都是组合在一起的。

重复出现的子串要计算它们出现的次数。

### 示例 1

**输入：**\`s = "00110011"\`
**输出：**\`6\`
**解释：**有 6 个具有相同数量的连续 1's 和 0's 的子串：
\`"0011"\`, \`"01"\`, \`"1100"\`, \`"10"\`, \`"0011"\`, \`"01"\`。
注意，一些重复出现的子串要计算它们出现的次数。
另外，\`"00110011"\` 不是有效的子串，因为所有的 0（以及 1）没有组合在一起。

### 示例 2

**输入：**\`s = "10101"\`
**输出：**\`4\`
**解释：**有 4 个满足条件的子串：\`"10"\`, \`"01"\`, \`"10"\`, \`"01"\`

### 提示

- \`1 <= s.length <= 10^5\`
- \`s[i]\` 为 \`'0'\` 或 \`'1'\``,
    solution: `## 解法：分组计数 / 线段树思想

### 思路分析

将字符串按连续相同的字符分组，统计每组的长度。例如 "001110011" → [2, 3, 2, 2]。相邻两组之间的有效子串数为 min(组i长度, 组i+1长度)。

这本质上是线段树的区间统计思想的简化版——我们只需要相邻区间的边界信息。

### 代码实现

\`\`\`javascript
var countBinarySubstrings = function(s) {
  let result = 0;
  let prev = 0;  // 前一组连续字符的长度
  let curr = 1;  // 当前连续字符的长度

  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1]) {
      curr++;
    } else {
      result += Math.min(prev, curr);
      prev = curr;
      curr = 1;
    }
  }
  result += Math.min(prev, curr);  // 处理最后一组
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，一次遍历
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var countBinarySubstrings = function(s) {\n  \n};",
      python: "def countBinarySubstrings(self, s: str) -> int:\n    pass",
      java: "class Solution {\n    public int countBinarySubstrings(String s) {\n        \n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串", "双指针", "数学"],
  },

  {
    title: "范围求和 II - 可变",
    content: `## 题目描述

假设你有一个长度为 \`n\` 的数组，初始情况下所有的数字均为 **0** ，你将会被给出一个 **二维的更新操作**（updates），其中 \`updates[i] = [startIdx_i, endIdx_i, inc_i]\` 。你需要对从 \`startIdx_i\` 到 \`endIdx_i\`（包括 \`endIdx_i\`）之间的每个元素加 \`inc_i\` 。

请你返回执行完所有更新操作后的数组。

### 示例 1

**输入：**\`n = 5, updates = [[1,3,2],[2,4,3],[0,2,-2]]\`
**输出：**\`[-2,0,3,5,3]\`

### 示例 2

**输入：**\`n = 10, updates = [[2,4,6],[5,7,3],[1,8,-5]]\`
**输出：**\`[0,-5,1,7,9,3,3,3,-5,0]\`

### 提示

- \`1 <= n <= 10^5\`
- \`0 <= updates.length <= 10^5\`
- \`0 <= startIdx_i <= endIdx_i < n\`
- \`-1000 <= inc_i <= 1000\``,
    solution: `## 解法：差分数组 + 线段树思想

### 思路分析

这是经典的**差分数组**问题。对于区间 [l, r] 加 val：
- diff[l] += val
- diff[r+1] -= val（如果 r+1 存在）
- 最后对差分数组求前缀和得到结果

这等价于线段树的**区间更新+点查询**场景，但差分方法更高效。

### 代码实现

\`\`\`javascript
var getModifiedArray = function(length, updates) {
  const diff = new Array(length + 1).fill(0);

  for (const [start, end, inc] of updates) {
    diff[start] += inc;
    if (end + 1 < length) {
      diff[end + 1] -= inc;
    }
  }

  const result = new Array(length).fill(0);
  result[0] = diff[0];
  for (let i = 1; i < length; i++) {
    result[i] = result[i - 1] + diff[i];
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n + m)，m 是 updates 数量
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var getModifiedArray = function(length, updates) {\n  \n};",
      python: "def getModifiedArray(self, length: int, updates: List[List[int]]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] getModifiedArray(int length, int[][] updates) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["线段树", "差分数组", "数组"],
  },

  {
    title: "区间最大公约数",
    content: `## 题目描述

给你一个整数数组 \`nums\`，你需要回答若干次查询。每次查询由两个参数 \`left\` 和 \`right\` 组成，要求你返回 \`nums[left], nums[left+1], ..., nums[right]\` 这些数字的最大公约数（GCD）。

你需要实现 \`GCDQuery\` 类：

- \`GCDQuery(int[] nums)\` 用数组初始化
- \`int query(int left, int right)\` 返回区间 [left, right] 的 GCD

另外支持：
- \`void update(int index, int value)\` 将 nums[index] 改为 value

### 示例

**输入**
\`\`\`
["GCDQuery", "query", "update", "query"]
[[[18,24,36,48]], [1, 3], [2, 54], [0, 2]]
\`\`\`
**输出**
\`\`\`
[null, 12, null, 18]
\`\`\`

**解释**
- query(1,3): gcd(24,36,48) = 12
- update(2,54): nums = [18,24,54,48]
- query(0,2): gcd(18,24,54) = 6... 等等让我重新算: gcd(18,24)=6, gcd(6,54)=6

### 提示

- \`1 <= nums.length <= 10^5\`
- \`1 <= nums[i] <= 10^9\`
- 查询和更新次数不超过 \`10^5\` 次`,
    solution: `## 解法：线段树（GCD合并）

### 思路分析

GCD 满足结合律且可合并：gcd(a,b,c) = gcd(gcd(a,b), c)。因此可以用线段树维护区间GCD，支持 O(log n) 的点更新和区间查询。

### 代码实现

\`\`\`javascript
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

class GcdSegmentTree {
  constructor(data) {
    this.n = data.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.build(data, 0, 0, this.n - 1);
  }

  build(data, node, start, end) {
    if (start === end) {
      this.tree[node] = data[start];
    } else {
      const mid = Math.floor((start + end) / 2);
      this.build(data, 2 * node + 1, start, mid);
      this.build(data, 2 * node + 2, mid + 1, end);
      this.tree[node] = gcd(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
  }

  update(index, val, node = 0, start = 0, end = undefined) {
    if (end === undefined) end = this.n - 1;
    if (start === end) {
      this.tree[node] = val;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (index <= mid) {
        this.update(index, val, 2 * node + 1, start, mid);
      } else {
        this.update(index, val, 2 * node + 2, mid + 1, end);
      }
      this.tree[node] = gcd(this.tree[2 * node + 1], this.tree[2 * node + 2]);
    }
  }

  query(left, right, node = 0, start = 0, end = undefined) {
    if (end === undefined) end = this.n - 1;
    if (right < start || left > end) return 0;  // gcd(x,0)=x
    if (left <= start && end <= right) return this.tree[node];
    const mid = Math.floor((start + end) / 2);
    return gcd(
      this.query(left, right, 2 * node + 1, start, mid),
      this.query(left, right, 2 * node + 2, mid + 1, end)
    );
  }
}
\`\`\`

### 复杂度分析

- **时间复杂度**：初始化 O(n log n)（gcd运算开销），update/query 每次 O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "// 实现GCDQuery类\nvar GCDQuery = function(nums) {\n  \n};\n\nGCDQuery.prototype.query = function(left, right) {\n  \n};\n\nGCDQuery.prototype.update = function(index, value) {\n  \n};",
      python: "class GCDQuery:\n    def __init__(self, nums: List[int]):\n        pass\n    def query(self, left: int, right: int) -> int:\n        pass\n    def update(self, index: int, value: int) -> None:\n        pass",
      java: "class GCDQuery {\n    public GCDQuery(int[] nums) { }\n    public int query(int left, int right) { }\n    public void update(int index, int value) { }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["线段树", "数学", "GCD"],
  },

  // ---------- 树状数组/Fenwick Tree（3道）----------

  {
    title: "树状数组模板 - 单点更新区间查询",
    content: `## 题目描述

实现一个**树状数组（Fenwick Tree / Binary Indexed Tree）**，支持以下操作：

1. \`update(i, delta)\` ：将位置 \`i\` 的元素增加 \`delta\`
2. \`query(i)\` ：查询前 \`i\` 个元素的和（即 arr[0] + ... + arr[i]）
3. \`rangeQuery(l, r)\` ：查询区间 [l, r] 的和

初始数组全为 0。

### 示例

**操作序列**
\`\`\`
["BIT", "update", "update", "update", "query", "rangeQuery"]
[[5], [0, 1], [1, 2], [2, 3], [2], [0, 2]]
\`\`\`
**输出**
\`\`\`
[null, null, null, null, 6, 6]
\`\`\`

**解释**
- update(0,1): arr = [1,0,0,0,0]
- update(1,2): arr = [1,2,0,0,0]
- update(2,3): arr = [1,2,3,0,0]
- query(2): 1+2+3 = 6
- rangeQuery(0,2): 1+2+3 = 6

### 提示

- \`1 <= n <= 10^5\`
- 操作次数不超过 \`10^5\` 次`,
    solution: `## 解法：树状数组（Fenwick Tree）

### 思路分析

树状数组利用**低比特位（lowbit）技巧**高效维护前缀和：
- 节点 i 维护区间 [i-lowbit(i)+1, i] 的和
- lowbit(i) = i & (-i)，提取最右侧的 1

核心操作：
- **add(i, delta)**：向上更新父节点，i += lowbit(i)
- **prefixSum(i)**：向下累加子节点，i -= lowbit(i)

### 代码实现

\`\`\`javascript
class FenwickTree {
  constructor(size) {
    this.n = size;
    this.tree = new Array(size + 1).fill(0);  // 1-indexed
  }

  lowbit(x) {
    return x & (-x);
  }

  // 单点更新：将第 i 个元素增加 delta
  update(i, delta) {
    i++;  // 转 1-indexed
    while (i <= this.n) {
      this.tree[i] += delta;
      i += this.lowbit(i);
    }
  }

  // 查询前 i 个元素的和（即 [0, i] 的和）
  query(i) {
    i++;  // 转 1-indexed
    let sum = 0;
    while (i > 0) {
      sum += this.tree[i];
      i -= this.lowbit(i);
    }
    return sum;
  }

  // 区间查询 [l, r] 的和
  rangeQuery(l, r) {
    if (l === 0) return this.query(r);
    return this.query(r) - this.query(l - 1);
  }
}
\`\`\`

### 复杂度分析

- **时间复杂度**：初始化 O(n)，update/query/rangeQuery 每次 O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "class FenwickTree {\n  constructor(size) {\n    \n  }\n  update(i, delta) {\n    \n  }\n  query(i) {\n    \n  }\n  rangeQuery(l, r) {\n    \n  }\n}",
      python: "class FenwickTree:\n    def __init__(self, size: int):\n        pass\n    def update(self, i: int, delta: int) -> None:\n        pass\n    def query(self, i: int) -> int:\n        pass\n    def range_query(self, l: int, r: int) -> int:\n        pass",
      java: "class FenwickTree {\n    public FenwickTree(int size) { }\n    public void update(int i, int delta) { }\n    public int query(int i) { }\n    public int rangeQuery(int l, int r) { }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["树状数组", "Fenwick Tree", "数据结构"],
  },

  {
    title: "逆序数（树状数组解法）",
    content: `## 题目描述

在数组中的两个数字，如果前面一个数字大于后面的数字，则这两个数字组成一个**逆序对**。给你一个数组，求出这个数组中的**逆序对的总数**。

### 示例 1

**输入：**\`nums = [5, 2, 6, 2, 3]\`
**输出：**\`4\`
**解释：**逆序对包括：(5,2), (5,3), (6,2), (6,3)

### 示例 2

**输入：**\`nums = [1, 2, 3, 4]\`
**输出：**\`0\`

### 示例 3

**输入：**\`nums = [7, 5, 6, 4]\`
**输出：**\`5\`
**解释：**(7,5),(7,6),(7,4),(5,4),(6,4)

### 提示

- \`1 <= nums.length <= 5 * 10^4\`
- \`-5 * 10^4 <= nums[i] <= 5 * 10^4\``,
    solution: `## 解法：树状数组（离散化 + 统计）

### 思路分析

遍历数组，对于每个元素 nums[i]，统计之前出现过的比它大的元素个数（即逆序数贡献）。使用树状数组维护已出现元素的频率：

1. **离散化**：由于数值范围大但数量有限，先对所有数值排序去重，映射到 [1, n] 的紧凑范围
2. **倒序遍历**：对每个元素，查询当前树状数组中 [1, rank-1] 的和（已有更小元素的个数），用 i 减去它就是逆序数贡献
3. 或者正序遍历：查询 [rank+1, maxRank] 的和（已有更大元素的个数）

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var reversePairs = function(nums) {
  if (nums.length === 0) return 0;

  // 离散化：排序去重
  const sorted = [...new Set([...nums].sort((a, b) => a - b))];
  const rankMap = new Map();
  sorted.forEach((v, i) => rankMap.set(v, i + 1));  // 1-indexed

  const size = sorted.length;
  const bit = new Array(size + 2).fill(0);

  const lowbit = x => x & (-x);

  const add = (i) => {
    while (i <= size) {
      bit[i]++;
      i += lowbit(i);
    }
  };

  const sum = (i) => {
    let s = 0;
    while (i > 0) {
      s += bit[i];
      i -= lowbit(i);
    }
    return s;
  };

  let result = 0;

  // 正序遍历：对每个元素，查询比它大的已出现元素个数
  for (let i = 0; i < nums.length; i++) {
    const r = rankMap.get(nums[i]);
    // 已出现的大于 nums[i] 的元素个数 = 总已出现数 - 小于等于的
    const greaterCount = i - sum(r);
    result += greaterCount;
    add(r);
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n log n)，离散化 O(n log n)，遍历+树状数组操作 O(n log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var reversePairs = function(nums) {\n  \n};",
      python: "def reversePairs(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int reversePairs(int[] nums) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["树状数组", "归并排序", "离散化"],
  },

  {
    title: "树状数组 - 区间修改单点查询",
    content: `## 题目描述

实现一个支持**区间修改、单点查询**的数据结构：

1. \`rangeAdd(l, r, val)\` ：将区间 [l, r] 的每个元素都加上 val
2. \`pointQuery(i)\` ：查询位置 i 的当前值

初始数组全为 0。

### 示例

**操作序列**
\`\`\`
["RangeAddBIT", "rangeAdd", "rangeAdd", "pointQuery", "pointQuery", "pointQuery"]
[[5], [0, 2, 1], [1, 3, 2], [0], [2], [4]]
\`\`\`
**输出**
\`\`\`
[null, null, null, 1, 3, 2]
\`\`\`

**解释**
- rangeAdd(0,2,1): arr = [1,1,1,0,0]
- rangeAdd(1,3,2): arr = [1,3,3,2,0]
- pointQuery(0) = 1, pointQuery(2) = 3, pointQuery(4) = 0

### 提示

- \`1 <= n <= 10^5\`
- 操作次数不超过 \`10^5\` 次`,
    solution: `## 解法：差分数组 + 树状数组

### 思路分析

区间修改+单点查询是差分数组的经典应用。利用树状数组维护差分数组 d：
- 区间 [l,r] 加 val 等价于 d[l] += val, d[r+1] -= val
- 点查询 arr[i] = d[0] + d[1] + ... + d[i]，即差分数组的前缀和

树状数组天然适合维护前缀和，因此可以高效实现。

### 代码实现

\`\`\`javascript
class RangeAddPointQueryBIT {
  constructor(size) {
    this.n = size;
    this.bit = new Array(size + 2).fill(0);
  }

  lowbit(x) {
    return x & (-x);
  }

  _add(i, delta) {
    i++;
    while (i <= this.n + 1) {
      this.bit[i] += delta;
      i += this.lowbit(i);
    }
  }

  // 区间 [l, r] 加上 val
  rangeAdd(l, r, val) {
    this._add(l, val);
    this._add(r + 1, -val);
  }

  // 查询位置 i 的值
  pointQuery(i) {
    i++;
    let sum = 0;
    while (i > 0) {
      sum += this.bit[i];
      i -= this.lowbit(i);
    }
    return sum;
  }
}
\`\`\`

### 复杂度分析

- **时间复杂度**：rangeAdd O(log n)，pointQuery O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "class RangeAddPointQueryBIT {\n  constructor(size) {\n    \n  }\n  rangeAdd(l, r, val) {\n    \n  }\n  pointQuery(i) {\n    \n  }\n}",
      python: "class RangeAddPointQueryBIT:\n    def __init__(self, size: int):\n        pass\n    def range_add(self, l: int, r: int, val: int) -> None:\n        pass\n    def point_query(self, i: int) -> int:\n        pass",
      java: "class RangeAddPointQueryBIT {\n    public RangeAddPointQueryBIT(int size) { }\n    public void rangeAdd(int l, int r, int val) { }\n    public int pointQuery(int i) { }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["树状数组", "差分数组", "数据结构"],
  },

  // ---------- 并查集（5道）----------

  {
    title: "冗余连接 II",
    content: `## 题目描述

在本问题中，有根树指满足以下条件的有向图。该树只有一个根节点，所有其他节点都是该根节点的后继。每一个节点只有一个父节点，除了根节点没有父节点。

你输入一个有向图，该图由一个有着 \`n\` 个节点（节点编号为 1 到 n）的树及一条附加的有向边构成。附加的边不包含在已有的树中，这条边连接了树中的两个不同的节点。

给定信息 edges（由边组成的列表），其中 \`edges[i] = [ui, vi]\` 表示一条从 ui 指向 vi 的有向边。

找出一条能删除的边，使得剩下的图是一个有根树（恰好有一个根节点）。如果有多个答案，返回出现在数组 edges **最后** 的那个答案。

### 示例 1

**输入：**\`edges = [[1,2],[1,3],[2,3]]\`
**输出：**\`[2,3]\`

### 示例 2

**输入：**\`edges = [[1,2],[2,3],[3,4],[4,1],[1,5]]\`
**输出：**\`[4,1]\`

### 提示

- \`n == edges.length\`
- \`3 <= n <= 1000\`
- \`edges[i].length == 2\`
- \`1 <= ui, vi <= n\``,
    solution: `## 解法：并查集分类讨论

### 思路分析

本题比冗余连接 I 更复杂，因为有向图中可能存在两种违规情况：

**情况1：某个节点有两个父节点**（入度为2）
- 找到入度为2的节点及其两条入边
- 分别尝试删除每条边，判断剩余边能否构成合法树

**情况2：存在环**（无入度为2的点）
- 直接找形成环的那条边（与冗余连接I类似）

### 代码实现

\`\`\`javascript
/**
 * @param {number[][]} edges
 * @return {number[]}
 */
var findRedundantDirectedConnection = function(edges) {
  const n = edges.length;
  const parent = new Array(n + 1).fill(0);
  const inDegree = new Array(n + 1).fill(0);

  // 统计入度
  for (const [u, v] of edges) {
    inDegree[v]++;
  }

  // 找到入度为2的节点
  let conflictEdge = -1;
  for (let i = 0; i < edges.length; i++) {
    if (inDegree[edges[i][1]] === 2) {
      conflictEdge = i;
      break;
    }
  }

  // 并查集查找函数
  const find = (x) => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  // 尝试构建树
  const buildTree = (skipIndex) => {
    for (let i = 1; i <= n; i++) parent[i] = i;
    for (let i = 0; i < edges.length; i++) {
      if (i === skipIndex) continue;
      const [u, v] = edges[i];
      const pu = find(u), pv = find(v);
      if (pu === pv) return false;  // 形成环
      parent[pv] = pu;
    }
    return true;
  };

  if (conflictEdge !== -1) {
    // 情况1：有入度为2的点，尝试删除最后那条冲突边或之前的边
    if (buildTree(conflictEdge)) return edges[conflictEdge];
    // 如果删最后一条不行，就找另一条指向同一节点的边
    for (let i = conflictEdge - 1; i >= 0; i--) {
      if (edges[i][1] === edges[conflictEdge][1]) {
        return edges[i];
      }
    }
  }

  // 情况2：无入度为2的点，找环
  for (let i = 1; i <= n; i++) parent[i] = i;
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    const pu = find(u), pv = find(v);
    if (pu === pv) return edges[i];
    parent[pv] = pu;
  }

  return [];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n α(n)) ≈ O(n)，α 是反阿克曼函数
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var findRedundantDirectedConnection = function(edges) {\n  \n};",
      python: "def findRedundantDirectedConnection(self, edges: List[List[int]]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] findRedundantDirectedConnection(int[][] edges) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["并查集", "图论", "树"],
  },

  {
    title: "最长连续序列（并查集解法）",
    content: `## 题目描述

给定一个未排序的整数数组 \`nums\` ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 **O(n)** 的算法解决此问题。

### 示例 1

**输入：**\`nums = [100, 4, 200, 1, 3, 2]\`
**输出：**\`4\`
**解释：**最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。

### 示例 2

**输入：**\`nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]\`
**输出：**\`9\`

### 提示

- \`0 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
    solution: `## 解法：哈希表（标准最优解）/ 并查集（学习用）

### 思路分析

**哈希表解法（推荐）**：
- 将所有数字放入集合
- 只从序列起点（num-1 不在集合中）开始扩展
- 向右连续查找 num+1, num+2, ...

**并查集思路**：将相邻数字 union，维护每个连通块的大小。

### 代码实现（哈希表 - 最优）

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
  const set = new Set(nums);
  let maxLength = 0;

  for (const num of set) {
    // 只从序列起点开始
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentLength = 1;

      while (set.has(currentNum + 1)) {
        currentNum++;
        currentLength++;
      }

      maxLength = Math.max(maxLength, currentLength);
    }
  }

  return maxLength;
};
\`\`\`

### 代码实现（并查集 - 学习用）

\`\`\`javascript
var longestConsecutive = function(nums) {
  const numSet = new Set(nums);
  const parent = new Map();   // 数字 -> 父节点
  const size = new Map();     // 根节点 -> 连通块大小

  const find = (x) => {
    if (!parent.has(x)) {
      parent.set(x, x);
      size.set(x, 1);
      return x;
    }
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)));
    }
    return parent.get(x);
  };

  const union = (a, b) => {
    const pa = find(a), pb = find(b);
    if (pa === pb) return;
    if (size.get(pa) < size.get(pb)) [pa, pb] = [pb, pa];
    parent.set(pb, pa);
    size.set(pa, size.get(pa) + size.get(pb));
  };

  for (const num of nums) {
    find(num);  // 确保初始化
    if (numSet.has(num - 1)) union(num, num - 1);
    if (numSet.has(num + 1)) union(num, num + 1);
  }

  let maxSize = 0;
  for (const [, sz] of size) {
    maxSize = Math.max(maxSize, sz);
  }
  return maxSize;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多被访问两次
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var longestConsecutive = function(nums) {\n  \n};",
      python: "def longestConsecutive(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int longestConsecutive(int[] nums) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集", "哈希表", "数组"],
  },

  {
    title: "账户合并",
    content: `## 题目描述

给定一个列表 \`accounts\`，每个元素 \`accounts[i]\` 是一个字符串列表，其中第一个元素 \`accounts[i][0]\` 是 **名称**，其余元素是 **邮箱**，表示该账户拥有的邮箱地址。

现在，我们想**合并这些账户**。如果两个账户有一些**公共的邮箱地址**，则两个账户必定属于同一个人。请注意，即使两个账户具有相同的名称，它们也可能属于不同的人，因为人们可能具有相同的名称。一个人最初可以拥有任意数量的账户，但其所有账户都具有相同的名称。

合并账户后，按以下格式返回账户：每个账户的第一个元素是名称，其余元素是按 **字符顺序(ASCII)** 排序的邮箱地址。账户本身可以按 **任何顺序** 返回。

### 示例 1

**输入：**\`accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]\`

**输出：**
\`\`\`
[["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],
 ["John","johnnybravo@mail.com"],
 ["Mary","mary@mail.com"]]
\`\`\`

**解释：**
第一个和第二个 John 是同一个人，因为他们有公共邮箱 "johnsmith@mail.com"。第三个 John 和 Mary 是不同的人，因为他们的邮箱地址没有被其他账户所用。我们可以以任何顺序返回这些列表。

### 提示

- \`1 <= accounts.length <= 1000\`
- \`2 <= accounts[i].length <= 10\`
- \`1 <= accounts[i][j].length <= 30\`
- \`accounts[i][0]\` 由英文字母组成
- \`accounts[i][j]\` 对于 j > 0 是有效的邮箱地址`,
    solution: `## 解法：并查集

### 思路分析

1. 将每个邮箱视为一个节点
2. 同一账户内的所有邮箱属于同一个人，进行 union
3. 最终同一个连通分量内的邮箱属于同一个人
4. 使用 Map 记录每个邮箱对应的账户名

### 代码实现

\`\`\`javascript
/**
 * @param {string[][]} accounts
 * @return {string[][]}
 */
var accountsMerge = function(accounts) {
  const emailToName = new Map();
  const emailToId = new Map();
  let id = 0;

  // 给每个邮箱分配唯一ID
  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      const email = account[i];
      if (!emailToId.has(email)) {
        emailToId.set(email, id++);
        emailToName.set(email, name);
      }
    }
  }

  // 并查集
  const parent = new Array(id).fill(0).map((_, i) => i);

  const find = (x) => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const union = (a, b) => {
    parent[find(a)] = find(b);
  };

  // 同一账户内的邮箱 union
  for (const account of accounts) {
    const firstEmailId = emailToId.get(account[1]);
    for (let i = 2; i < account.length; i++) {
      union(firstEmailId, emailToId.get(account[i]));
    }
  }

  // 收集每个连通分量的邮箱
  const groups = new Map();
  for (const [email, eid] of emailToId) {
    const root = find(eid);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }

  // 构建结果
  const result = [];
  for (const [root, emails] of groups) {
    emails.sort();  // ASCII 排序
    result.push([emailToName.get(emails[0]), ...emails]);
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(N K α(NK)) ≈ O(NK log NK)，N 是账户数，K 是平均邮箱数（排序占主导）
- **空间复杂度**：O(NK)`,
    codeTemplate: {
      javascript: "var accountsMerge = function(accounts) {\n  \n};",
      python: "def accountsMerge(self, accounts: List[List[str]]) -> List[List[str]]:\n    pass",
      java: "class Solution {\n    public List<List<String>> accountsMerge(List<List<String>> accounts) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集", "哈希表", "排序"],
  },

  {
    title: "等式方程的可满足性",
    content: `## 题目描述

给定一个由表示变量之间关系的字符串方程组成的数组，每个字符串方程 \`equations[i]\` 的长度为 4，并采用以下两种形式之一：\`"a==b"\` 或 \`"a!=b"\` 。在这里，a 和 b 是小写字母（不一定不同），表示单字母变量名。

只有当可以将整数分配给变量名，以便满足所有给定的方程时才返回 \`true\`，否则返回 \`false\` 。

### 示例 1

**输入：**\`equations = ["a==b","b!=c","c==a"]\`
**输出：**\`false\`

### 示例 2

**输入：**\`equations = ["c==c","b==d","x!=z"]\`
**输出：**\`true\`

### 示例 3

**输入：**\`equations = ["a==b","e==c","b==c","a!=e"]\`
**输出：**\`false\`

### 提示

- \`1 <= equations.length <= 500\`
- \`equations[i].length == 4\`
- \`equations[i][0]\` 是一个大写字母
- \`equations[i][1]\` 要么是 \`'='\`，要么是 \`'!'\`
- \`equations[i][2]\` 是 \`'='\`
- \`equations[i][3]\` 是一个小写字母`,
    solution: `## 解法：并查集

### 思路分析

经典并查集应用题：

1. 先处理所有 \`==\` 方程，将相等的变量 union 到同一集合
2. 再处理所有 \`!=\` 方程，检查不等号两边的变量是否在同一集合
3. 如果发现 \`!=\` 两边的变量在同一集合，说明矛盾，返回 false

### 代码实现

\`\`\`javascript
/**
 * @param {string[]} equations
 * @return {boolean}
 */
var equationsPossible = function(equations) {
  const parent = new Array(26).fill(0).map((_, i) => i);

  const find = (x) => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const union = (a, b) => {
    parent[find(a)] = find(b);
  };

  // 第一步：处理所有相等关系
  for (const eq of equations) {
    if (eq[1] === '=') {
      const a = eq.charCodeAt(0) - 'a'.charCodeAt(0);
      const b = eq.charCodeAt(3) - 'a'.charCodeAt(0);
      union(a, b);
    }
  }

  // 第二步：检查所有不等关系是否矛盾
  for (const eq of equations) {
    if (eq[1] === '!') {
      const a = eq.charCodeAt(0) - 'a'.charCodeAt(0);
      const b = eq.charCodeAt(3) - 'a'.charCodeAt(0);
      if (find(a) === find(b)) return false;
    }
  }

  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(N α(26)) ≈ O(N)，α 是常数级别（26个变量）
- **空间复杂度**：O(1)，固定26个变量`,
    codeTemplate: {
      javascript: "var equationsPossible = function(equations) {\n  \n};",
      python: "def equationsPossible(self, equations: List[str]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean equationsPossible(String[] equations) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集", "图论", "贪心"],
  },

  {
    title: "移除最多的同行或同列石头",
    content: `## 题目描述

\`n\` 块石头放置在二维平面的一些整数坐标点上。每个坐标点上最多只能有一块石头。

如果一块石头的 **同行或者同列** 上有其他石头存在，那么就可以移除这块石头。

给你一个长度为 \`n\` 的数组 \`stones\` ，其中 \`stones[i] = [xi, yi]\` 表示第 \`i\` 块石头的位置，返回 **可以移除的石子** 的**最大数量**。

### 示例 1

**输入：**\`stones = [[0,0],[0,1],[1,0],[1,2],[2,1],[2,2]]\`
**输出：**\`5\`
**解释：**一种移除方式如下：
1. 移除石头 [2,2] ，因为它和 [2,1] 同行。
2. 移除石头 [2,1] ，因为它和 [0,1] 同列。
3. 移除石头 [1,2] ，因为它和 [1,0] 同行。
4. 移除石头 [1,0] ，因为它和 [0,0] 同列。
5. 移除石头 [0,1] ，因为它和 [0,0] 同行。
只剩下石头 [0,0] 不能移除。

### 示例 2

**输入：**\`stones = [[0,0]]\`
**输出：**\`0\`
**解释：**[0,0] 是唯一的石头，不能移除。

### 示例 3

**输入：**\`stones = [[0,2],[2,0]]\`
**输出：**\`0\`
**解释：**这两块石头不在同行或同列，无法移除任何一个。

### 提示

- \`1 <= stones.length <= 1000\`
- \`0 <= xi, yi <= 10^4\`
- 不会有两块石头放在同一个坐标点上`,
    solution: `## 解法：并查集

### 思路分析

关键观察：把每一行和每一列看作图的节点，一块石头连接其所在行和列。移除石头的过程等价于寻找连通分量：

- 在一个大小为 k 的连通分量（k 个行/列节点）中，最终会剩下 1 块石头不可移除
- 因此总可移除石头数 = 总石头数 - 连通分量个数

具体做法：将每块石头的行号和列号作为节点进行 union，最终连通分量数即为不可移除的石子数。

### 代码实现

\`\`\`javascript
/**
 * @param {number[][]} stones
 * @return {number}
 */
var removeStones = function(stones) {
  const parent = new Map();

  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)));
    }
    return parent.get(x);
  };

  const union = (a, b) => {
    parent.set(find(a), find(b));
  };

  for (const [x, y] of stones) {
    // 行号用 x 表示，列号用 ~y（取反）区分，避免行列编号冲突
    union(x, ~y);
  }

  // 统计连通分量数（根节点个数）
  const roots = new Set();
  for (const [x, y] of stones) {
    roots.add(find(x));
  }

  return stones.length - roots.size;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n α(n)) ≈ O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var removeStones = function(stones) {\n  \n};",
      python: "def removeStones(self, stones: List[List[int]]) -> int:\n    pass",
      java: "class Solution {\n    public int removeStones(int[][] stones) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集", "图论"],
  },

  // ---------- 前缀树/Trie（4道）----------

  {
    title: "实现 Trie (前缀树)",
    content: `## 题目描述

**Trie**（发音类似 "try"）或者说 **前缀树** 是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。这一数据结构有相当多的应用情景，例如自动补完和拼写检查。

请你实现 Trie 类：

- \`Trie()\` 初始化前缀树对象。
- \`void insert(String word)\` 向前缀树中插入字符串 word 。
- \`boolean search(String word)\` 如果字符串 word 在前缀树中，返回 true；否则，返回 false 。
- \`boolean startsWith(String prefix)\` 如果之前已经插入的字符串 word 的前缀之一为 prefix ，返回 true ；否则，返回 false 。

### 示例

**输入**
\`\`\`
["Trie", "insert", "search", "search", "startsWith", "insert", "search"]
[[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]
\`\`\`
**输出**
\`\`\`
[null, null, true, false, true, null, true]
\`\`\`

**解释**
\`\`\`
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // 返回 True
trie.search("app");     // 返回 False
trie.startsWith("app"); // 返回 True
trie.insert("app");
trie.search("app");     // 返回 True
\`\`\`

### 提示

- \`1 <= word.length, prefix.length <= 2000\`
- \`word\` 和 \`prefix\` 仅由小写英文字母组成
- insert、search 和 startsWith 操作次数总计不超过 3 * 10^4 次`,
    solution: `## 解法：前缀树（Trie）

### 思路分析

Trie 是一种多叉树，每个节点包含：
- \`children\`：26个子节点（对应26个小写字母）
- \`isEnd\`：标记是否为单词结尾

操作逻辑：
- **insert**：逐字符遍历，不存在则创建节点，末尾标记 isEnd=true
- **search**：逐字符查找，必须完整匹配且 isEnd=true
- **startsWith**：逐字符查找前缀即可

### 代码实现

\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};  // 或使用固定大小的数组
    this.isEnd = false;
  }
}

var Trie = function() {
  this.root = new TrieNode();
};

Trie.prototype.insert = function(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children[ch]) {
      node.children[ch] = new TrieNode();
    }
    node = node.children[ch];
  }
  node.isEnd = true;
};

Trie.prototype.search = function(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children[ch]) return false;
    node = node.children[ch];
  }
  return node.isEnd;
};

Trie.prototype.startsWith = function(prefix) {
  let node = this.root;
  for (const ch of prefix) {
    if (!node.children[ch]) return false;
    node = node.children[ch];
  }
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：insert/search/startsWith 均为 O(L)，L 为字符串长度
- **空间复杂度**：O(N × L)，N 为插入的单词总数`,
    codeTemplate: {
      javascript: "var Trie = function() {\n  \n};\n\nTrie.prototype.insert = function(word) {\n  \n};\n\nTrie.prototype.search = function(word) {\n  \n};\n\nTrie.prototype.startsWith = function(prefix) {\n  \n};",
      python: "class Trie:\n    def __init__(self):\n        pass\n    def insert(self, word: str) -> None:\n        pass\n    def search(self, word: str) -> bool:\n        pass\n    def startsWith(self, prefix: str) -> bool:\n        pass",
      java: "class Trie {\n    public Trie() { }\n    public void insert(String word) { }\n    public boolean search(String word) { }\n    public boolean startsWith(String prefix) { }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["前缀树", "Trie", "设计", "哈希表"],
  },

  {
    title: "添加和搜索单词 - 数据结构设计",
    content: `## 题目描述

请你设计一个支持通过添加和搜索单词的数据结构。搜索支持文字 '.' 通配符。

- \`WordDictionary()\` 初始化对象
- \`void addWord(word)\` 将 word 添加到数据结构中，之后可以对它进行匹配
- \`bool search(word)\` 如果数据结构中存在字符串与 word 匹配，则返回 true ；否则，返回 false 。word 可能包含 '.' ，每个 . 都可以代表任何一个字母。

### 示例

**输入**
\`\`\`
["WordDictionary","addWord","addWord","addWord","search","search","search","search"]
[[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]
\`\`\`
**输出**
\`\`\`
[null,null,null,null,false,true,true,true]
\`\`\`

**解释**
\`\`\`
WordDictionary wordDictionary = new WordDictionary();
wordDictionary.addWord("bad");
wordDictionary.addWord("dad");
wordDictionary.addWord("mad");
wordDictionary.search("pad"); // 返回 False
wordDictionary.search("bad"); // 返回 True
wordDictionary.search(".ad"); // 返回 True
wordDictionary.search("b.."); // 返回 True
\`\`\`

### 提示

- \`1 <= word.length <= 25\`
- \`addWord\` 中的 \`word\` 由小写英文字母组成
- \`search\` 中的 \`word\` 由 '.' 或小写英文字母组成
- 最多调用 10^4 次 \`addWord\` 和 \`search\``,
    solution: `## 解法：Trie + DFS（处理通配符）

### 思路分析

基于 Trie 实现，区别在于 search 方法需要处理通配符 \`.\`：

- 遇到普通字符：正常沿 Trie 子节点走
- 遇到 \`.\`：需要**递归/DFS** 尝试所有可能的子节点

### 代码实现

\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

var WordDictionary = function() {
  this.root = new TrieNode();
};

WordDictionary.prototype.addWord = function(word) {
  let node = this.root;
  for (const ch of word) {
    if (!node.children[ch]) {
      node.children[ch] = new TrieNode();
    }
    node = node.children[ch];
  }
  node.isEnd = true;
};

WordDictionary.prototype.search = function(word) {
  return this._dfs(this.root, word, 0);
};

WordDictionary.prototype._dfs = function(node, word, idx) {
  if (idx === word.length) return node.isEnd;
  const ch = word[idx];

  if (ch === '.') {
    // 通配符：尝试所有子节点
    for (const child of Object.values(node.children)) {
      if (this._dfs(child, word, idx + 1)) return true;
    }
    return false;
  } else {
    if (!node.children[ch]) return false;
    return this._dfs(node.children[ch], word, idx + 1);
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：addWord O(L)，search 最坏 O(N × 26^L)（全是通配符时），实际远小于此
- **空间复杂度**：O(N × L)`,
    codeTemplate: {
      javascript: "var WordDictionary = function() {\n  \n};\n\nWordDictionary.prototype.addWord = function(word) {\n  \n};\n\nWordDictionary.prototype.search = function(word) {\n  \n};",
      python: "class WordDictionary:\n    def __init__(self):\n        pass\n    def addWord(self, word: str) -> None:\n        pass\n    def search(self, word: str) -> bool:\n        pass",
      java: "class WordDictionary {\n    public WordDictionary() { }\n    public void addWord(String word) { }\n    public boolean search(String word) { }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["前缀树", "Trie", "DFS", "设计"],
  },

  {
    title: "替换所有的问号",
    content: `## 题目描述

给定一个仅包含小写英文字母和 \`?\` 字符的字符串 \`s\` ，请你将所有的 \`?\` 转换为若干小写字母，使最终的字符串不包含**任何连续重复**的字符。

**注意**：你不能修改非 \`?\` 字符。

题目测试用例保证 除 \`?\` 字符之外，不存在连续重复的字符。

在完成所有转换（可能无需转换）后返回最终的字符串。如果有多个解决方案，请返回其中任何一个。可以证明，在给定的约束条件下，答案总是存在的。

### 示例 1

**输入：**\`s = "?zs"\`
**输出：**\`"azs"\`
**解释：**该示例有 25 种解决方案，从 "azs" 到 "yzs" 都是符合题目要求的。只有 "zs" 是无效的修改，因为字符串 "zzs" 中有连续重复的两个 'z' 。

### 示例 2

**输入：**\`s = "ubv?w"\`
**输出：**\`"ubvaw"\`
**解释：**该示例有 24 种解决方案，只有在替换为 "ubvw" 时会存在连续重复的字符。

### 示例 3

**输入：**\`s = "j?qg??b"\`
**输出：**\`"jaqgacb"\`

### 提示

- \`1 <= s.length <= 100\`
- \`s\` 仅包含小写英文字母和 \`?\` 字符`,
    solution: `## 解法：贪心替换

### 思路分析

遍历字符串，遇到 \`?\` 时选择一个与前一个字符和后一个字符都不同的字母即可。因为有26个字母，而只需避开最多2个邻居，所以总是可行的。

### 代码实现

\`\`\`javascript
/**
 * @param {string} s
 * @return {string}
 */
var modifyString = function(s) {
  const arr = s.split('');
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === '?') {
      for (const c of 'abc') {
        if (c !== arr[i - 1] && c !== arr[i + 1]) {
          arr[i] = c;
          break;
        }
      }
    }
  }
  return arr.join('');
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，n 为字符串长度
- **空间复杂度**：O(n) 或 O(1)（取决于语言）`,
    codeTemplate: {
      javascript: "var modifyString = function(s) {\n  \n};",
      python: "def modifyString(self, s: str) -> str:\n    pass",
      java: "class Solution {\n    public String modifyString(String s) {\n        \n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串", "贪心"],
  },

  {
    title: "键值映射（Map Sum Pairs）",
    content: `## 题目描述

设计一个 map-like 结构，实现以下两类操作：

1. \`insert(key, val)\` ：插入键值对。如果 key 已存在，将其原始值覆盖为 val。
2. \`sum(prefix)\` ：返回所有以该前缀 prefix 开头的键的值的总和。

### 示例

**输入**
\`\`\`
["MapSum", "insert", "sum", "insert", "sum"]
[[], ["apple", 3], ["ap"], ["app", 2], ["ap"]]
\`\`\`
**输出**
\`\`\`
[null, null, 3, null, 5]
\`\`\`

**解释**
\`\`\`
MapSum mapSum = new MapSum();
mapSum.insert("apple", 3);
mapSum.sum("ap");           // 返回 3（apple = 3）
mapSum.insert("app", 2);
mapSum.sum("ap");           // 返回 5（apple = 3 + app = 2）
\`\`\`

### 提示

- \`1 <= key.length, prefix.length <= 50\`
- \`key\` 和 \`prefix\` 仅由小写英文字母组成
- \`1 <= val <= 1000\`
- 最多调用 50 次 \`insert\` 和 \`sum\``,
    solution: `## 解法：Trie 存储 value

### 思路分析

在 Trie 节点中增加 \`value\` 字段存储该路径对应单词的值。\`sum(prefix)\` 则需要从 prefix 对应的节点出发，DFS 累加所有子节点的 value。

优化：在每个节点维护 \`subtreeSum\`（子树中所有单词值的总和），insert 时沿途更新，sum 可直接返回。

### 代码实现

\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.value = 0;
  }
}

var MapSum = function() {
  this.root = new TrieNode();
};

MapSum.prototype.insert = function(key, val) {
  let node = this.root;
  for (const ch of key) {
    if (!node.children[ch]) {
      node.children[ch] = new TrieNode();
    }
    node = node.children[ch];
  }
  node.value = val;
};

MapSum.prototype.sum = function(prefix) {
  let node = this.root;
  for (const ch of prefix) {
    if (!node.children[ch]) return 0;
    node = node.children[ch];
  }
  return this._dfsSum(node);
};

MapSum.prototype._dfsSum = function(node) {
  let total = node.value;
  for (const child of Object.values(node.children)) {
    total += this._dfsSum(child);
  }
  return total;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：insert O(L)，sum 最坏 O(N×L)（DFS整棵子树），优化后 O(L)
- **空间复杂度**：O(N×L)`,
    codeTemplate: {
      javascript: "var MapSum = function() {\n  \n};\n\nMapSum.prototype.insert = function(key, val) {\n  \n};\n\nMapSum.prototype.sum = function(prefix) {\n  \n};",
      python: "class MapSum:\n    def __init__(self):\n        pass\n    def insert(self, key: str, val: int) -> None:\n        pass\n    def sum(self, prefix: str) -> int:\n        pass",
      java: "class MapSum {\n    public MapSum() { }\n    public void insert(String key, int val) { }\n    public int sum(String prefix) { }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["前缀树", "Trie", "哈希表", "设计"],
  },

  // ---------- 跳表（1道）----------

  {
    title: "设计跳表",
    content: `## 题目描述

不使用任何库函数，设计一个**跳表**（SkipList）。

跳表是在 O(log(n)) 时间内完成增加、删除、搜索操作的数据结构。跳表相比于树和哈希表，其优势在于：

- 跳表的效率可以和平衡树媲美，但实现起来更简单
- 可以在 O(log(n)) 时间内完成有序集合的操作
- 可以在 O(log(n)) 时间内找到范围内的元素

实现 \`Skiplist\` 类：

- \`Skiplist()\` 初始化 SkipList 对象
- \`bool search(int target)\` 搜索是否存在目标值 target
- \`void add(int num)\` 插入元素到 SkipList
- \`bool erase(int num)\` 删除 SkipList 中的一个元素，如果不存在返回 false。如果有多个相同值，删除其中一个即可

### 示例

**输入**
\`\`\`
["Skiplist", "add", "add", "add", "search", "add", "search", "erase", "erase", "search"]
[[], [1], [2], [3], [0], [4], [1], [0], [1], [1]]
\`\`\`
**输出**
\`\`\`
[null, null, null, null, false, null, true, false, true, false]
\`\`\`

### 提示

- \`0 <= num, target <= 2 * 10^4\`
- 最多调用 \`50000\` 次 \`search\`、\`add\`、\`erase\` 操作`,
    solution: `## 解法：跳表（SkipList）

### 思路分析

跳表是一种基于概率的数据结构，通过多层链表实现快速查找：

1. **底层链表**：包含所有元素，有序排列
2. **上层链表**：是下层链表的"快速通道"，包含部分元素
3. **查找**：从最高层开始，向右走到不能再走就下降一层
4. **插入**：先找到插入位置，然后随机决定层数（抛硬币决定是否上升）
5. **删除**：找到目标后在所有层删除

关键参数：提升概率 p 通常设为 0.5 或 0.25。

### 代码实现

\`\`\`javascript
class SkiplistNode {
  constructor(val = -1, level = 0) {
    this.val = val;
    this.forward = new Array(level + 1).fill(null);
  }
}

var Skiplist = function() {
  this.maxLevel = 16;
  this.level = 1;
  this.p = 0.25;
  this.head = new SkiplistNode(-1, this.maxLevel);
};

Skiplist.prototype._randomLevel = function() {
  let lv = 1;
  while (Math.random() < this.p && lv < this.maxLevel) {
    lv++;
  }
  return lv;
};

Skiplist.prototype.search = function(target) {
  let curr = this.head;
  for (let i = this.level - 1; i >= 0; i--) {
    while (curr.forward[i] && curr.forward[i].val < target) {
      curr = curr.forward[i];
    }
  }
  curr = curr.forward[0];
  return curr ? curr.val === target : false;
};

Skiplist.prototype.add = function(num) {
  const update = new Array(this.maxLevel).fill(null);
  let curr = this.head;

  for (let i = this.level - 1; i >= 0; i--) {
    while (curr.forward[i] && curr.forward[i].val < num) {
      curr = curr.forward[i];
    }
    update[i] = curr;
  }

  const lv = this._randomLevel();
  this.level = Math.max(this.level, lv);
  const newNode = new SkiplistNode(num, lv);

  for (let i = 0; i < lv; i++) {
    newNode.forward[i] = update[i].forward[i];
    update[i].forward[i] = newNode;
  }
};

Skiplist.prototype.erase = function(num) {
  const update = new Array(this.maxLevel).fill(null);
  let curr = this.head;

  for (let i = this.level - 1; i >= 0; i--) {
    while (curr.forward[i] && curr.forward[i].val < num) {
      curr = curr.forward[i];
    }
    update[i] = curr;
  }

  curr = curr.forward[0];
  if (!curr || curr.val !== num) return false;

  for (let i = 0; i < this.level; i++) {
    if (update[i].forward[i] !== curr) break;
    update[i].forward[i] = curr.forward[i];
  }

  while (this.level > 1 && !this.head.forward[this.level - 1]) {
    this.level--;
  }
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：期望 O(log n) 每次 search/add/erase
- **空间复杂度**：期望 O(n)`,
    codeTemplate: {
      javascript: "var Skiplist = function() {\n  \n};\n\nSkiplist.prototype.search = function(target) {\n  \n};\n\nSkiplist.prototype.add = function(num) {\n  \n};\n\nSkiplist.prototype.erase = function(num) {\n  \n};",
      python: "class Skiplist:\n    def __init__(self):\n        pass\n    def search(self, target: int) -> bool:\n        pass\n    def add(self, num: int) -> None:\n        pass\n    def erase(self, num: int) -> bool:\n        pass",
      java: "class Skiplist {\n    public Skiplist() { }\n    public boolean search(int target) { }\n    public void add(int num) { }\n    public boolean erase(int num) { }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["跳表", "SkipList", "设计", "随机化"],
  },

  // ---------- 单调栈（5道）----------

  {
    title: "柱状图中最大的矩形",
    content: `## 题目描述

给定 **n** 个非负整数，用来表示柱状图中各个柱子的高度。每个柱子彼此相邻，且宽度为 1 。

求在该柱状图中，能够勾勒出来的矩形的**最大面积**。

### 示例 1

![histogram](https://assets.leetcode.com/uploads/2021/01/04/histogram.jpg)

**输入：**\`heights = [2,1,5,6,2,3]\`
**输出：**\`10\`
**解释：**最大的矩形为图中红色区域，面积为 10

### 示例 2

**输入：**\`heights = [2,4]\`
**输出：**\`4\`

### 提示

- \`1 <= heights.length <= 10^5\`
- \`0 <= heights[i] <= 10^4\``,
    solution: `## 解法：单调栈

### 思路分析

对于每根柱子，找到它**左边第一根比它矮的柱子**和**右边第一根比它矮的柱子**，就能确定以它为高的最大矩形宽度。

使用**单调递增栈**来高效找到左右边界：

1. 从左到右扫描，保持栈单调递增
2. 当遇到比栈顶矮的柱子时，弹出栈顶，计算以弹出的柱子为高的矩形面积
3. 栈中保存的是**索引**，不是高度
4. 在数组两端各加一个哨兵（高度为0），确保所有柱子都会被处理

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} heights
 * @return {number}
 */
var largestRectangleArea = function(heights) {
  // 哨兵：前后各加一个高度为0的柱子
  const h = [0, ...heights, 0];
  const stack = [];  // 存储索引，保持单调递增
  let maxArea = 0;

  for (let i = 0; i < h.length; i++) {
    while (stack.length > 0 && h[i] < h[stack[stack.length - 1]]) {
      const height = h[stack.pop()];
      // 弹出后新的栈顶就是左边界（左边第一个更矮的）
      const left = stack.length > 0 ? stack[stack.length - 1] : -1;
      const width = i - left - 1;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }

  return maxArea;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多入栈出栈一次
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var largestRectangleArea = function(heights) {\n  \n};",
      python: "def largestRectangleArea(self, heights: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["单调栈", "栈", "数组"],
  },

  {
    title: "最大矩形",
    content: `## 题目描述

给定一个仅包含 \`0\` 和 \`1\` 、大小为 \`rows x cols\` 的二维二进制矩阵，找出只包含 \`1\` 的**最大矩形**，并返回其**面积**。

### 示例 1

![maximal](https://assets.leetcode.com/uploads/2021/01/04/maximal.jpg)

**输入：**\`matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]\`
**输出：**\`6\`
**解释：**最大矩形如上图所示。

### 示例 2

**输入：**\`matrix = [["0"]]\`
**输出：**\`0\`

### 示例 3

**输入：**\`matrix = [["1"]]\`
**输出：**\`1\`

### 提示

- \`rows == matrix.length\`
- \`cols == matrix[i].length\`
- \`1 <= row, cols <= 200\`
- \`matrix[i][j]\` 为 \`'0'\` 或 \`'1'\``,
    solution: `## 解法：单调栈（逐行转化为直方图）

### 思路分析

这是「柱状图中最大的矩形」的二维推广：

1. **逐行扫描**：对每一行，将该行及以上的连续1的高度累加，形成一个**直方图**
2. 例如第 i 行的直方图 heights[j] = matrix[i][j] === '1' ? heights[j] + 1 : 0
3. 对每行的直方图使用**单调栈**求最大矩形面积
4. 取所有行中的最大值

### 代码实现

\`\`\`javascript
/**
 * @param {character[][]} matrix
 * @return {number}
 */
var maximalRectangle = function(matrix) {
  if (matrix.length === 0) return 0;
  const rows = matrix.length, cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let maxArea = 0;

  for (let i = 0; i < rows; i++) {
    // 更新高度数组
    for (let j = 0; j < cols; j++) {
      heights[j] = matrix[i][j] === '1' ? heights[j] + 1 : 0;
    }
    maxArea = Math.max(maxArea, largestRectangleInHistogram(heights));
  }

  return maxArea;
};

function largestRectangleInHistogram(heights) {
  const h = [0, ...heights, 0];
  const stack = [];
  let maxArea = 0;

  for (let i = 0; i < h.length; i++) {
    while (stack.length > 0 && h[i] < h[stack[stack.length - 1]]) {
      const height = h[stack.pop()];
      const left = stack.length > 0 ? stack[stack.length - 1] : -1;
      const width = i - left - 1;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }
  return maxArea;
}
\`\`\`

### 复杂度分析

- **时间复杂度**：O(rows × cols)
- **空间复杂度**：O(cols)`,
    codeTemplate: {
      javascript: "var maximalRectangle = function(matrix) {\n  \n};",
      python: "def maximalRectangle(self, matrix: List[List[str]]) -> int:\n    pass",
      java: "class Solution {\n    public int maximalRectangle(char[][] matrix) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["单调栈", "动态规划", "矩阵"],
  },

  {
    title: "每日温度",
    content: `## 题目描述

给定一个整数数组 \`temperatures\` ，表示每天的温度，返回一个数组 \`answer\` ，其中 \`answer[i]\` 是指对于第 \`i\` 天，下一个更高温度出现在几天后。如果气温在这之后都不会升高，请在该位置用 \`0\` 来代替。

### 示例 1

**输入：**\`temperatures = [73,74,75,71,69,72,76,73]\`
**输出：**\`[1,1,4,2,1,1,0,0]\`

### 示例 2

**输入：**\`temperatures = [30,40,50,60]\`
**输出：**\`[1,1,1,0]\`

### 示例 3

**输入：**\`temperatures = [30,60,90]\`
**输出：**\`[1,1,0]\`

### 提示

- \`1 <= temperatures.length <= 10^5\`
- \`30 <= temperatures[i] <= 100\``,
    solution: `## 解法：单调栈（从右往左 / 从左往右均可）

### 思路分析

使用**单调递减栈**存储温度的索引：

- **从右往左**：栈中存右边待处理的索引，遇到更高的温度就结算
- **从左往右**：栈中存左边还没找到更高温度的索引，遇到更高温度就依次结算

这里采用**从左往右**的方式，更直观。

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
var dailyTemperatures = function(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const stack = [];  // 单调递减栈，存储索引

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      answer[prevIndex] = i - prevIndex;
    }
    stack.push(i);
  }

  // 栈中剩余的索引对应 answer 默认值 0（无需显式处理）
  return answer;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多入栈出栈一次
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var dailyTemperatures = function(temperatures) {\n  \n};",
      python: "def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["单调栈", "数组"],
  },

  {
    title: "移掉 K 位数字",
    content: `## 题目描述

给定一个以字符串表示的非负整数 \`num\` 和一个整数 \`k\` ，移除这个数中的 k 位数字，使得剩下的数字**最小**。

### 示例 1

**输入：**\`num = "1432219", k = 3\`
**输出：**\`"1219"\`
**解释：**移除掉三个数字 4, 3, 和 2 形成一个新的最小的数字 1219。

### 示例 2

**输入：**\`num = "10200", k = 1\`
**输出：**\`"200"\`
**解释：**移掉首位的 1 剩下的数字最小是 200。注意输出不能有任何前导零。

### 示例 3

**输入：**\`num = "10", k = 2\`
**输出：**\`"0"\`

### 提示

- \`1 <= k <= num.length <= 10^5\`
- \`num\` 仅由数字组成`,
    solution: `## 解法：单调栈（贪心）

### 思路分析

使用**单调递增栈**实现贪心策略：

1. 遍历每个数字，如果还有删除机会（k > 0）且当前数字小于栈顶，则弹出栈顶（相当于删除了一个更大的高位数字）
2. 这样保证高位尽可能小
3. 如果遍历完后 k 还没用完，从末尾继续删除
4. 注意去除前导零

### 代码实现

\`\`\`javascript
/**
 * @param {string} num
 * @param {number} k
 * @return {string}
 */
var removeKdigits = function(num, k) {
  const stack = [];

  for (const digit of num) {
    while (k > 0 && stack.length > 0 && digit < stack[stack.length - 1]) {
      stack.pop();
      k--;
    }
    stack.push(digit);
  }

  // 如果 k 还没用完，从末尾删除
  while (k > 0) {
    stack.pop();
    k--;
  }

  // 去除前导零
  let result = stack.join('').replace(/^0+/, '');
  return result === '' ? '0' : result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个字符最多入栈出栈一次
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var removeKdigits = function(num, k) {\n  \n};",
      python: "def removeKdigits(self, num: str, k: int) -> str:\n    pass",
      java: "class Solution {\n    public String removeKdigits(String num, int k) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["单调栈", "贪心", "字符串"],
  },

  {
    title: "去除重复字母",
    content: `## 题目描述

给你一个字符串 \`s\` ，请你去除字符串中**重复的字母**，使得每个字母**只出现一次**。需保证**返回结果的字典序最小**（要求不能打乱其他字符的相对位置）。

### 示例 1

**输入：**\`s = "bcabc"\`
**输出：**\`"abc"\`

### 示例 2

**输入：**\`s = "cbacdcbc"\`
**输出：**\`"acdb"\`

### 提示

- \`1 <= s.length <= 10^4\`
- \`s\` 由小写英文字母组成`,
    solution: `## 解法：单调栈 + 贪心

### 思路分析

类似于「移掉 K 位数字」，但要保证每个字母至少出现一次：

1. 先统计每个字符的出现次数
2. 使用**单调递增栈**，维护已使用的字符集合
3. 遇到一个字符时：
   - 如果已在栈中，跳过（保证唯一性）
   - 否则，在还能让栈顶字符再次出现的情况下，弹出更大的栈顶字符（贪心使字典序最小）
4. 将当前字符入栈，标记为已使用

### 代码实现

\`\`\`javascript
/**
 * @param {string} s
 * @return {string}
 */
var removeDuplicateLetters = function(s) {
  const count = new Array(26).fill(0);
  for (const ch of s) {
    count[ch.charCodeAt(0) - 'a'.charCodeAt(0)]++;
  }

  const stack = [];
  const inStack = new Array(26).fill(false);

  for (const ch of s) {
    const idx = ch.charCodeAt(0) - 'a'.charCodeAt(0);
    count[idx]--;

    if (inStack[idx]) continue;  // 已经在结果中了

    // 贪心：弹出更大且后面还会出现的字符
    while (stack.length > 0 && ch < stack[stack.length - 1]) {
      const topIdx = stack[stack.length - 1].charCodeAt(0) - 'a'.charCodeAt(0);
      if (count[topIdx] === 0) break;  // 后面不会再出现了
      inStack[topIdx] = false;
      stack.pop();
    }

    stack.push(ch);
    inStack[idx] = true;
  }

  return stack.join('');
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个字符最多入栈出栈一次
- **空间复杂度**：O(1)，固定26个字母`,
    codeTemplate: {
      javascript: "var removeDuplicateLetters = function(s) {\n  \n};",
      python: "def removeDuplicateLetters(self, s: str) -> str:\n    pass",
      java: "class Solution {\n    public String removeDuplicateLetters(String s) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["单调栈", "贪心", "字符串"],
  },

  // ---------- 单调队列（2道）----------

  {
    title: "滑动窗口最大值",
    content: `## 题目描述

给你一个整数数组 \`nums\`，有一个大小为 \`k\` 的滑动窗口从数组的最左侧移动到数组的最右侧。你只可以看到在滑动窗口内的 \`k\` 个数字。滑动窗口每次只向右移动一位。

返回**滑动窗口中的最大值**。

### 示例 1

**输入：**\`nums = [1,3,-1,-3,5,3,6,7], k = 3\`
**输出：**\`[3,3,5,5,6,7]\`
**解释：**
\`\`\`
滑动窗口的位置                最大值
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7
\`\`\`

### 示例 2

**输入：**\`nums = [1], k = 1\`
**输出：**\`[1]\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`
- \`1 <= k <= nums.length\``,
    solution: `## 解法：单调队列（双端队列）

### 思路分析

使用**单调递减双端队列**维护滑动窗口：

1. 队列头部始终是当前窗口的最大值
2. 新元素入队时，从队尾移除所有比它小的元素（保持单调递减）
3. 窗口滑出时，检查队头是否过期（索引超出左边界）
4. 每次移动后，队头即为当前窗口最大值

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function(nums, k) {
  const result = [];
  const deque = [];  // 存储索引，保持值单调递减

  for (let i = 0; i < nums.length; i++) {
    // 移除队头过期的元素
    if (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 保持单调递减：移除队尾比当前元素小的
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    // 从第 k-1 个元素开始记录结果
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多入队出队一次
- **空间复杂度**：O(k)，双端队列最多存 k 个元素`,
    codeTemplate: {
      javascript: "var maxSlidingWindow = function(nums, k) {\n  \n};",
      python: "def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["单调队列", "双端队列", "滑动窗口"],
  },

  {
    title: "最短子数组至少 K",
    content: `## 题目描述

给定一个含有 **n\` 个**正整数的数组和一个正整数 \`target\` 。

找出该数组中满足其 **和 ≥ target\` **的长度最小的 **连续子数组** \`[numsl, numsl+1, ..., numsr-1, numsr]\` ，并返回其**长度**。如果不存在符合条件的子数组，返回 \`0\` 。

### 示例 1

**输入：**\`target = 7, nums = [2,3,1,2,4,3]\`
**输出：**\`2\`
**解释：**子数组 [4,3] 是该条件下的长度最小的子数组。

### 示例 2

**输入：**\`target = 4, nums = [1,4,4]\`
**输出：**\`1\`

### 示例 3

**输入：**\`target = 11, nums = [1,1,1,1,1,1,1,1]\`
**输出：**\`0\`

### 提示

- \`1 <= target <= 10^9\`
- \`1 <= nums.length <= 10^5\`
- \`1 <= nums[i] <= 10^5\``,
    solution: `## 解法：滑动窗口（双指针）

### 思路分析

经典的滑动窗口问题，使用**双指针** + **单调性**：

1. 右指针扩展窗口，累加和
2. 当和 >= target 时，尝试收缩左指针缩小窗口
3. 记录最小窗口长度

注意：虽然这不是严格意义上的"单调队列"，但滑动窗口本身就是一种利用单调性的技术。也可以用**前缀和 + 二分查找**或**单调队列**来解决。

### 代码实现

\`\`\`javascript
/**
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
var minSubArrayLen = function(target, nums) {
  let minLength = Infinity;
  let windowSum = 0;
  let left = 0;

  for (let right = 0; right < nums.length; right++) {
    windowSum += nums[right];

    while (windowSum >= target) {
      minLength = Math.min(minLength, right - left + 1);
      windowSum -= nums[left];
      left++;
    }
  }

  return minLength === Infinity ? 0 : minLength;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，双指针各遍历一次
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var minSubArrayLen = function(target, nums) {\n  \n};",
      python: "def minSubArrayLen(self, target: int, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int minSubArrayLen(int target, int[] nums) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["滑动窗口", "双指针", "数组"],
  },

  // ---------- 笛卡尔树（1道 QA）----------

  {
    title: "什么是笛卡尔树？它与堆和BST有什么关系？",
    content: `## 问题

笛卡尔树（Cartesian Tree）是一种同时满足**堆性质**和**BST（二叉搜索树）性质**的二叉树数据结构。

### 请回答以下问题：

1. **定义**：笛卡尔树的严格定义是什么？给定一个序列如何构建？
2. **性质**：它同时满足哪两种性质？分别是什么？
3. **构建算法**：如何用单调栈 O(n) 构建笛卡尔树？为什么是 O(n)？
4. **应用场景**：笛卡尔树有哪些典型应用？（提示：RMQ、拓扑排序相关）
5. **变体**：Max-Heap 版本和 Min-Heap 版本的区别？

### 参考信息

- 笛卡尔树由 Jean Vuillemin 于 1980 年提出
- LeetCode 654. Maximum Binary Tree 就是构建 Max-Heap 笛卡尔树
- 与 Treap（树堆）的关系：Treap 是随机优先级的笛卡尔树`,
    solution: `## 详细解答

### 1. 定义

给定一个序列 A[0..n-1]，笛卡尔树定义为：
- **每个节点**对应序列中的一个元素，值为 A[i]
- **中序遍历**结果恰好是原序列 A[0..n-1]（BST 性质）
- **每个节点的值**满足堆性质（父节点 >= 或 <= 子节点，取决于 Min/Max 版本）

### 2. 同时满足的性质

| 性质 | 说明 |
|------|------|
| **BST 性质**（中序） | 中序遍历 = 原序列顺序 |
| **堆性质**（父子） | 父节点的键值 >= 所有子节点（Max-Heap 版本） |

这两种性质的组合使得笛卡尔树成为连接"顺序"和"层级"的桥梁。

### 3. 单调栈 O(n) 构建算法

\`\`\`javascript
// 构建 Max-Heap 笛卡尔树
// 输入：数组 arr
// 输出：根节点（包含 left, right, val 属性）
function buildCartesianTree(arr) {
  if (arr.length === 0) return null;

  // 单调递减栈（存储节点引用）
  const stack = [];

  for (const val of arr) {
    const node = { val, left: null, right: null };

    // 弹出所有值小于当前值的节点
    // 最后弹出的成为当前节点的左孩子
    while (stack.length > 0 && stack[stack.length - 1].val < val) {
      node.left = stack.pop();
    }

    // 当前节点成为栈顶的右孩子
    if (stack.length > 0) {
      stack[stack.length - 1].right = node;
    }

    stack.push(node);
  }

  // 栈底是根节点
  return stack[0];
}
\`\`\`

**为什么是 O(n)？** 每个节点最多入栈一次、出栈一次，总共 2n 次操作。

### 4. 典型应用

- **RMQ（区间最值查询）**：笛卡尔树 + LCA = O(1) RMQ
- **排序**：笛卡尔树的层序遍历可用于某些排序场景
- **LeetCode 654**：Maximum Binary Tree 就是构建 Max-Heap 笛卡尔树
- **Treap**：随机优先级版本的笛卡尔树，期望高度 O(log n)

### 5. Min-Heap vs Max-Heap

- **Max-Heap 版本**：父节点值最大，根是全局最大值（LeetCode 654）
- **Min-Heap 版本**：父节点值最小，根是全局最小值
- 构建时只需改变比较方向（< 改为 >）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["笛卡尔树", "单调栈", "数据结构", "理论"],
  },

  // ==================== 二、动态规划进阶（30道）====================

  // ---------- 背包进阶（5道）----------

  {
    title: "目标和",
    content: `## 题目描述

给你一个**非负**整数数组 \`nums\` 和一个整数 \`target\` 。

向数组中的每个整数前添加 \`'+'\` 或 \`'-'\` ，然后串联起所有整数，可以构造一个 **表达式**：

例如，\`nums = [2, 1]\` ，可以在 2 之前添加 \`'+'\` ，在 1 之前添加 \`'-'\` ，然后串联起来得到表达式 \`"+2-1"\` 。

返回可以通过上述方法构造的、运算结果等于 \`target\` 的**不同** 表达式的数目。

### 示例 1

**输入：**\`nums = [1,1,1,1,1], target = 3\`
**输出：**\`5\`
**解释：**一共有 5 种方法让最终目标和为 3。
\`-1 + 1 + 1 + 1 + 1 = 3\`
\`+1 - 1 + 1 + 1 + 1 = 3\`
\`+1 + 1 - 1 + 1 + 1 = 3\`
\`+1 + 1 + 1 - 1 + 1 = 3\`
\`+1 + 1 + 1 + 1 - 1 = 3\`

### 示例 2

**输入：**\`nums = [1], target = 1\`
**输出：**\`1\`

### 提示

- \`1 <= nums.length <= 20\`
- \`0 <= nums[i] <= 1000\`
- \`0 <= sum(nums[i]) <= 1000\`
- \`-1000 <= target <= 1000\``,
    solution: `## 解法：DP（转化为 0-1 背包）

### 思路分析

将问题转化：设加法的数的和为 P，减法的数的和为 N，则：
- P + N = sum(nums)
- P - N = target

解得：P = (sum + target) / 2

问题转化为：从 nums 中选取若干个数，使它们的和恰好为 P（0-1背包问题）。

**前提条件**：sum + target 必须为偶数且非负。

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var findTargetSumWays = function(nums, target) {
  const sum = nums.reduce((a, b) => a + b, 0);

  // 目标不可能达到的情况
  if (Math.abs(target) > sum) return 0;
  if ((sum + target) % 2 !== 0) return 0;

  const bagSize = (sum + target) / 2;
  const dp = new Array(bagSize + 1).fill(0);
  dp[0] = 1;  // 和为0有一种方式：什么都不选

  for (const num of nums) {
    for (let j = bagSize; j >= num; j--) {
      dp[j] += dp[j - num];
    }
  }

  return dp[bagSize];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × bagSize)，bagSize ≤ sum/2
- **空间复杂度**：O(bagSize)，可用滚动数组优化到 O(bagSize)`,
    codeTemplate: {
      javascript: "var findTargetSumWays = function(nums, target) {\n  \n};",
      python: "def findTargetSumWays(self, nums: List[int], target: int) -> int:\n    pass",
      java: "class Solution {\n    public int findTargetSumWays(int[] nums, int target) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "背包问题", "数组"],
  },

  {
    title: "分割等和子集",
    content: `## 题目描述

给你一个 **只包含正整数** 的 **非空** 数组 \`nums\` 。请你判断是否可以将这个数组分割成两个子集，使得两个子集的元素和相等。

### 示例 1

**输入：**\`nums = [1,5,11,5]\`
**输出：**\`true\`
**解释：**数组可以分割成 [1, 5, 5] 和 [11] 。

### 示例 2

**输入：**\`nums = [1,2,3,5]\`
**输出：**\`false\`
**解释：**数组不能分割成两个元素和相等的子集。

### 提示

- \`1 <= nums.length <= 200\`
- \`1 <= nums[i] <= 100\``,
    solution: `## 解法：0-1 背包 DP

### 思路分析

等价于判断能否从 nums 中选取若干个数，使其和等于 sum/2：

1. 如果 sum 为奇数，直接返回 false
2. 转化为 0-1 背包问题：容量为 sum/2，物品为 nums 中的数
3. dp[j] = 能否凑出和 j

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {boolean}
 */
var canPartition = function(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;

  const target = sum / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;

  for (const num of nums) {
    for (let j = target; j >= num; j--) {
      dp[j] = dp[j] || dp[j - num];
    }
  }

  return dp[target];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × target)，target = sum/2
- **空间复杂度**：O(target)`,
    codeTemplate: {
      javascript: "var canPartition = function(nums) {\n  \n};",
      python: "def canPartition(self, nums: List[int]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean canPartition(int[] nums) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "背包问题", "数组"],
  },

  {
    title: "最后一块石头的重量 II",
    content: `## 题目描述

有一堆石头，用整数数组 \`stones\` 表示。其中 \`stones[i]\` 表示第 i 块石头的重量。

每一回合，从中选出**任意两块石头**，然后将它们一起粉碎。假设石头的重量分别为 \`x\` 和 \`y\`，且 \`x <= y\`。那么粉碎的可能结果如下：

- 如果 \`x == y\`，那么两块石头都会被完全粉碎；
- 如果 \`x != y\`，那么重量为 \`x\` 的石头将会完全粉碎，而重量为 \`y\` 的石头新重量为 \`y-x\`。

最后，**最多只会剩下一块** 石头。返回此石头 **最小的可能重量** 。如果没有石头剩下，就返回 \`0\` 。

### 示例 1

**输入：**\`stones = [2,7,4,1,8,1]\`
**输出：**\`1\`
**解释：**
组合 2 和 4，得到 2，所以数组转化为 [2,7,1,8,1]，
组合 7 和 8，得到 1，所以数组转化为 [2,1,1,1]，
组合 2 和 1，得到 1，所以数组转化为 [1,1,1]，
组合 1 和 1，得到 0，所以数组转化为 [1]，这就是最优值。

### 示例 2

**输入：**\`stones = [31,26,33,21,40]\`
**输出：**\`5\`

### 提示

- \`1 <= stones.length <= 30\`
- \`1 <= stones[i] <= 100\``,
    solution: `## 解法：DP（转化为分割等和子集）

### 思路分析

这道题本质上和「分割等和子集」一样！关键是理解：

- 每次选两块石头碰撞，等价于给石头赋予 + 或 - 号
- 最终结果 = |(+A) - (+B)|，其中 A ∪ B = 全部石头，A ∩ B = ∅
- 要使结果最小，就要使两组重量尽可能接近
- 即：从 stones 中选取若干个，使其和尽量接近 sum/2

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} stones
 * @return {number}
 */
var lastStoneWeightII = function(stones) {
  const sum = stones.reduce((a, b) => a + b, 0);
  const target = Math.floor(sum / 2);
  const dp = new Array(target + 1).fill(0);

  for (const stone of stones) {
    for (let j = target; j >= stone; j--) {
      dp[j] = Math.max(dp[j], dp[j - stone] + stone);
    }
  }

  return sum - 2 * dp[target];  // 一组和为dp[target]，另一组为sum-dp[target]，差值即为答案
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × target)
- **空间复杂度**：O(target)`,
    codeTemplate: {
      javascript: "var lastStoneWeightII = function(stones) {\n  \n};",
      python: "def lastStoneWeightII(self, stones: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int lastStoneWeightII(int[] stones) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "背包问题"],
  },

  {
    title: "一和零",
    content: `## 题目描述

给你一个二进制字符串数组 \`strs\` 和两个整数 \`m\` 和 \`n\` 。

请你找出并返回 \`strs\` 的**最大子集**的大小，该子集中 **最多** 有 \`m\` 个 \`0\` 和 \`n\` 个 \`1\` 。

如果 \`x\` 的所有元素也是 \`y\` 的元素，集合 \`x\` 是集合 \`y\` 的 **子集** 。

### 示例 1

**输入：**\`strs = ["10","0001","111001","1","0"], m = 5, n = 3\`
**输出：**\`4\`
**解释：**最多有 5 个 0 和 3 个 1 的最大子集是 {"10","0001","1","0"} ，因此答案是 4。
其他满足题意但较小的子集包括 {"0001","1"} 和 {"10","1","0"} 。{"111001"} 不满足题意，因为它含 4 个 1 ，大于 n 的值 3 。

### 示例 2

**输入：**\`strs = ["10","0","1"], m = 1, n = 1\`
**输出：**\`2\`
**解释：**最大的子集是 {"0", "1"} ，所以答案是 2 。

### 提示

- \`1 <= strs.length <= 600\`
- \`1 <= strs[i].length <= 100\`
- \`strs[i]\` 仅由 \`'0'\` 和 \`'1'\` 组成
- \`1 <= m, n <= 100\``,
    solution: `## 解法：二维 0-1 背包 DP

### 思路分析

这是一个**二维费用**的 0-1 背包问题：

- **物品**：每个字符串 strs[i]
- **费用1**：消耗的 0 的个数 zeros[i]
- **费用2**：消耗的 1 的个数 ones[i]
- **价值**：1（每个字符串计为1个）
- **容量限制**：最多 m 个 0，n 个 1
- **目标**：最大化选取的物品数量

### 代码实现

\`\`\`javascript
/**
 * @param {string[]} strs
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
var findMaxForm = function(strs, m, n) {
  // dp[i][j] = 使用 i 个 0 和 j 个 1 时最多能选多少个字符串
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (const s of strs) {
    let zeros = 0, ones = 0;
    for (const c of s) {
      if (c === '0') zeros++;
      else ones++;
    }

    // 二维 0-1 背包，倒序遍历
    for (let i = m; i >= zeros; i--) {
      for (let j = n; j >= ones; j--) {
        dp[i][j] = Math.max(dp[i][j], dp[i - zeros][j - ones] + 1);
      }
    }
  }

  return dp[m][n];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(L × m × n)，L 是字符串数量
- **空间复杂度**：O(m × n)`,
    codeTemplate: {
      javascript: "var findMaxForm = function(strs, m, n) {\n  \n};",
      python: "def findMaxForm(self, strs: List[str], m: int, n: int) -> int:\n    pass",
      java: "class Solution {\n    public int findMaxForm(String[] strs, int m, int n) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "背包问题", "字符串"],
  },

  {
    title: "盈利计划",
    content: `## 题目描述

集团里有 \`n\` 名员工，他们可以完成各种各样的工作创造**利润**。

第 \`i\` 种工作会产生 \`profit[i]\` 的利润，它要求 \`group[i]\` 名成员共同参与。如果成员参与了其中一项工作就不能参与另一项工作。

工作的任何至少产生 \`minProfit\` 利润的子集称为**盈利计划**。并且工作的成员总数最多为 \`n\` 。

有多少种计划可以选择？因为答案很大，所以 **返回结果模 10^9 + 7 的值**。

### 示例 1

**输入：**\`n = 5, minProfit = 3, group = [2,2], profit = [2,3]\`
**输出：**\`2\`
**解释：**
至少产生 3 的利润，该集团可以完成工作 0 和工作 1，或仅完成工作 1。
总的来说，有两种计划。

### 示例 2

**输入：**\`n = 10, minProfit = 5, group = [2,3,5], profit = [6,7,8]\`
**输出：**\`7\`

### 提示

- \`1 <= n <= 100\`
- \`0 <= minProfit <= 100\`
- \`1 <= group.length <= 100\`
- \`1 <= group[i] <= 100\`
- \`profit.length == group.length\`
- \`0 <= profit[i] <= 100\``,
    solution: `## 解法：二维 0-1 背包 DP（利润维度特殊处理）

### 思路分析

又是一个**二维费用**的 0-1 背包：

- **费用1**：员工人数 group[i]
- **费用2**：产生的利润 profit[i]
- **目标**：利润至少 minProfit，员工最多 n 人

**关键技巧**：利润维度不需要精确匹配，而是"至少 minProfit"。将 dp 的利润维度上限设为 minProfit，超过 minProfit 的都归入 minProfit 这一类。

### 代码实现

\`\`\`javascript
/**
 * @param {number} n
 * @param {number} minProfit
 * @param {number[]} group
 * @param {number[]} profit
 * @return {number}
 */
var profitableSchemes = function(n, minProfit, group, profit) {
  const MOD = 10 ** 9 + 7;
  // dp[i][j] = 使用 i 个人，产生至少 j 利润的计划数
  const dp = Array.from({ length: n + 1 }, () => new Array(minProfit + 1).fill(0));
  dp[0][0] = 1;  // 0个人0利润，1种方案

  for (let k = 0; k < group.length; k++) {
    const g = group[k], p = profit[k];
    for (let i = n; i >= g; i--) {
      for (let j = minProfit; j >= 0; j--) {
        // 利润超过 minProfit 的都归入 minProfit
        const newProfit = Math.min(j + p, minProfit);
        dp[i][newProfit] = (dp[i][newProfit] + dp[i - g][j]) % MOD;
      }
    }
  }

  // 统计所有使用不超过 n 人且利润至少 minProfit 的方案
  let result = 0;
  for (let i = 0; i <= n; i++) {
    result = (result + dp[i][minProfit]) % MOD;
  }
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(L × n × minProfit)
- **空间复杂度**：O(n × minProfit)`,
    codeTemplate: {
      javascript: "var profitableSchemes = function(n, minProfit, group, profit) {\n  \n};",
      python: "def profitableSchemes(self, n: int, minProfit: int, group: List[int], profit: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int profitableSchemes(int n, int minProfit, int[] group, int[] profit) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "背包问题"],
  },

  // ---------- 区间DP（4道）----------

  {
    title: "戳气球",
    content: `## 题目描述

有 \`n\` 个气球，编号为\`0\` 到 \`n - 1\`，每个气球上都标有一个数字，这些数字存在数组 \`nums\` 中。

现在要求你戳破所有的气球。戳破第 \`i\` 个气球，你可以获得 \`nums[i - 1] * nums[i] * nums[i + 1]\` 枚硬币。这里的 \`i - 1\` 和 \`i + 1\` 代表和 \`i\` 相邻的两个气球的序号。如果 \`i - 1\` 或 \`i + 1\` 超出了数组的边界，那么就当它是一个数字为 1 的气球。

求所能获得枚硬币的**最大数量**。

### 示例 1

**输入：**\`nums = [3,1,5,8]\`
**输出：**\`167\`
**解释：**
\`\`\`
nums = [3,1,5,8] --> [3,5,8] --> [3,8] --> [8] []
coins =  3*1*5    +   3*5*8   +  1*3*8  + 1*8*1 = 167
\`\`\`

### 示例 2

**输入：**\`nums = [1,5]\`
**输出：**\`10\`

### 提示

- \`n == nums.length\`
- \`1 <= n <= 300\`
- \`0 <= nums[i] <= 100\``,
    solution: `## 解法：区间 DP

### 思路分析

**逆向思维**：考虑"最后戳破哪个气球"而不是"先戳哪个"。

设 dp[l][r] 为戳破开区间 (l, r) 内所有气球获得的最大硬币数（注意 l 和 r 不被戳破，作为边界）。

转移方程：
\`\`\`
dp[l][r] = max(dp[l][r],
              dp[l][k] + dp[k][r] + vals[l] * vals[k] * vals[r])
对于所有 k ∈ (l, r)
\`\`\`

其中 vals 是在 nums 两端各加一个 1 后的数组（处理边界）。

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxCoins = function(nums) {
  const n = nums.length;
  // 添加虚拟边界气球
  const vals = [1, ...nums, 1];
  const m = n + 2;
  // dp[l][r]: 戳破 (l, r) 开区间内所有气球的最大收益
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));

  // 区间长度从小到大枚举
  for (let len = 2; len < m; len++) {
    for (let l = 0; l + len < m; l++) {
      const r = l + len;
      for (let k = l + 1; k < r; k++) {
        dp[l][r] = Math.max(
          dp[l][r],
          dp[l][k] + dp[k][r] + vals[l] * vals[k] * vals[r]
        );
      }
    }
  }

  return dp[0][m - 1];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n³)，三层循环
- **空间复杂度**：O(n²)`,
    codeTemplate: {
      javascript: "var maxCoins = function(nums) {\n  \n};",
      python: "def maxCoins(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int maxCoins(int[] nums) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "区间DP"],
  },

  {
    title: "不同的二叉搜索树",
    content: `## 题目描述

给你一个整数 \`n\` ，求恰由 \`n\` 个节点组成且节点值从 \`1\` 到 \`n\` 互不相同的 **二叉搜索树** 有多少种？返回满足题意的二叉搜索树的**种数**。

### 示例 1

**输入：**\`n = 3\`
**输出：**\`5\`

### 示例 2

**输入：**\`n = 1\`
**输出：**\`1\`

### 提示

- \`1 <= n <= 19\``,
    solution: `## 解法：DP（卡特兰数）

### 思路分析

设 G(n) 为 n 个节点能构成的 BST 数量。枚举根节点 i（1 ≤ i ≤ n）：

- 左子树有 i-1 个节点，共 G(i-1) 种
- 右子树有 n-i 个节点，共 G(n-i) 种
- 以 i 为根的总数 = G(i-1) × G(n-i)

状态转移方程（卡特兰数）：
\`\`\`
G(n) = Σ G(i-1) × G(n-i)  for i = 1 to n
G(0) = G(1) = 1
\`\`\`

### 代码实现

\`\`\`javascript
/**
 * @param {number} n
 * @return {number}
 */
var numTrees = function(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = dp[1] = 1;

  for (let nodes = 2; nodes <= n; nodes++) {
    for (let root = 1; root <= nodes; root++) {
      const left = root - 1;
      const right = nodes - root;
      dp[nodes] += dp[left] * dp[right];
    }
  }

  return dp[n];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n²)
- **空间复杂度**：O(n)

### 数学公式（卡特兰数）

G(n) = C(2n,n) / (n+1) = (2n)! / ((n+1)! · n!)`,
    codeTemplate: {
      javascript: "var numTrees = function(n) {\n  \n};",
      python: "def numTrees(self, n: int) -> int:\n    pass",
      java: "class Solution {\n    public int numTrees(int n) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "卡特兰数", "二叉搜索树"],
  },

  {
    title: "合并石子（区间DP经典）",
    content: `## 题目描述

有 N 堆石子排成一排，第 i 堆有 \`stones[i]\` 个石子。每次只能合并**相邻的两堆**石子，代价为这两堆石子的总数。求将所有石子合并成一堆的**最小总代价**。

### 示例 1

**输入：**\`stones = [3, 4, 3]\`
**输出：**\`17\`
**解释：**
- 先合并前两堆：代价 3+4=7，变成 [7, 3]
- 再合并：代价 7+3=10，总代价 7+10=17

### 示例 2

**输入：**\`stones = [1, 2, 3, 4, 5]\`
**输出：**\`33\`
**解释：**最优合并顺序：(1+2)+(3+4)+... 的某种组合

### 提示

- \`1 <= N <= 100\`
- \`1 <= stones[i] <= 1000\``,
    solution: `## 解法：区间 DP

### 思路分析

经典的**区间 DP** 问题：

- \`dp[l][r]\` = 合并区间 [l, r] 内所有石子堆的最小代价
- 转移：枚举分割点 k，\`dp[l][r] = min(dp[l][k] + dp[k+1][r]) + sum(l,r)\`
- 其中 sum(l,r) 是区间 [l, r] 的石子总数（最后一次合并的代价）
- 区间长度从小到大枚举

### 代码实现

\`\`\`javascript
/**
 * @param {number[]} stones
 * @return {number}
 */
var mergeStones = function(stones) {
  const n = stones.length;

  // 前缀和，方便快速计算区间和
  const prefixSum = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + stones[i];
  }

  const sumRange = (l, r) => prefixSum[r + 1] - prefixSum[l];

  // dp[l][r] = 合并 [l, r] 的最小代价
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));

  // 按区间长度枚举
  for (let len = 2; len <= n; len++) {
    for (let l = 0; l + len <= n; l++) {
      const r = l + len - 1;
      dp[l][r] = Infinity;
      for (let k = l; k < r; k++) {
        dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r]);
      }
      dp[l][r] += sumRange(l, r);  // 加上本次合并代价
    }
  }

  return dp[0][n - 1];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n³)
- **空间复杂度**：O(n²)`,
    codeTemplate: {
      javascript: "var mergeStones = function(stones) {\n  \n};",
      python: "def mergeStones(self, stones: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int mergeStones(int[] stones) {\n        \n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "区间DP"],
  },

  {
    title: "奇怪的打印机",
    content: `## 题目描述

有台奇怪的打印机有以下两个特殊要求：

- 打印机每次只能打印由 **同一个字符** 组成的序列。
- 每次可以在**任意起始和结束位置**打印新字符，并且会覆盖**原来**位置上已有的字符。

给你一个字符串 \`s\` ，你的任务是计算打印机打印它需要的**最少打印次数**。

### 示例 1

**输入：**\`s = "aaabbb"\`
**输出：**\`2\`
**解释：**首先打印 "aaaaaaa" 然后在位置 3-6 打印 "bbb"。

### 示例 2

**输入：**\`s = "aba"\`
**输出：**\`2\`
**解释：**首先打印 "aaa" 然后在位置 2 打印 "b" 覆盖原来的 'a'。

### 提示

- \`1 <= s.length <= 100\`
- \`s\` 由小写英文字母组成`,
    solution: `## 解法：区间 DP

### 思路分析

设 dp[l][r] 为打印 s[l..r] 的最少次数。

**关键观察**：如果 s[l] == s[r]，可以先打印 s[l]（同时也覆盖了 s[r] 的位置），然后只需要打印中间部分。即 dp[l][r] = dp[l][r-1]。

转移方程：
\`\`\`
if s[l] == s[r]:
  dp[l][r] = dp[l][r-1]  (或 dp[l+1][r])
else:
  dp[l][r] = min(dp[l][k] + dp[k+1][r]) for k in [l, r)
\`\`\`

### 代码实现

\`\`\`javascript
/**
 * @param {string} s
 * @return {number}
 */
var strangePrinter = function(s) {
  const n = s.length;
  if (n === 0) return 0;

  // dp[l][r]: 打印 s[l..r] 的最少次数
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));

  // 单个字符只需打印1次
  for (let i = 0; i < n; i++) dp[i][i] = 1;

  for (let len = 2; len <= n; len++) {
    for (let l = 0; l + len <= n; l++) {
      const r = l + len - 1;
      dp[l][r] = len;  // 最坏情况：每个字符单独打印

      if (s[l] === s[r]) {
        dp[l][r] = dp[l][r - 1];
      } else {
        for (let k = l; k < r; k++) {
          dp[l][r] = Math.min(dp[l][r], dp[l][k] + dp[k + 1][r]);
        }
      }
    }
  }

  return dp[0][n - 1];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n³)
- **空间复杂度**：O(n²)`,
    codeTemplate: {
      javascript: "var strangePrinter = function(s) {\n  \n};",
      python: "def strangePrinter(self, s: str) -> int:\n    pass",
      java: "class Solution {\n    public int strangePrinter(String s) {\n        \n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "区间DP"],
  },

  // ---------- 树形DP（4道）----------

  {
    title: "监控二叉树",
    content: `## 题目描述

给定一个二叉树，我们在树的节点上安装摄像头。

节点上的每个摄像头都可以**监视**其父对象、自身及其直接子对象。

计算监控树的所有节点所需的**最小摄像头数量**。

### 示例 1

**输入：**\`[0,0,null,0,0]\`
**输出：**\`1\`
**解释：**如图所示，一台摄像头足以监控所有节点。

### 示例 2

**输入：**\`[0,0,null,0,null,0,null,null,0]\`
**输出：**\`2\`
**解释：**需要至少两个摄像头才能监视所有节点。

### 提示

- 给定树的节点数的范围是 \`[1, 1000]\`。
- 每个节点的值都是 0。`,
    solution: `## 解法：树形 DP（贪心 + 后序遍历）

### 思路分析

对每个节点定义三种状态：
- **0**：该节点未被覆盖（需要父节点放相机）
- **1**：该节点已被覆盖（被子节点或自身相机覆盖）
- **2**：该点放了相机

**贪心策略**（从叶子往上，后序遍历）：
- 左右孩子都被覆盖（状态1）→ 当前节点不放相机（状态0）
- 左右孩子至少有一个未覆盖（状态0）→ 当前节点放相机（状态2）
- 左右孩子至少有一个放了相机（状态2）→ 当前节点被覆盖（状态1）

**时间复杂度**: O(N)
**空间复杂度**: O(H) 递归栈深度`,
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "树形DP", "贪心"],
  }
];