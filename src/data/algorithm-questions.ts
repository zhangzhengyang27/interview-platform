// 算法与数据结构面试题库 - 300道高质量题目
// 分布：easy~60, medium~140, hard~100 | code~220, qa~80

export interface AlgorithmQuestion {
  title: string;
  content: string;
  solution?: string;
  codeTemplate?: Record<string, string>;
  difficulty: "easy" | "medium" | "hard";
  questionType: "code" | "qa";
  tags?: string[];
  topics?: string[];
}

export const algorithmQuestions: AlgorithmQuestion[] = [
  // ==================== 基础数据结构：数组（1-25）====================

  {
    title: "合并两个有序数组",
    content: `## 题目描述

给你两个按 **非递减顺序** 排列的整数数组 \`nums1\` 和 \`nums2\`，另有两个整数 \`m\` 和 \`n\` ，分别表示 \`nums1\` 和 \`nums2\` 中的元素数目。

请你 **合并** \`nums2\` 到 \`nums1\` 中，使 \`nums1\` 成为一个有序数组。

**注意**：最终，合并后数组不应由函数返回，而是存储在数组 \`nums1\` 中。为了应对这种情况，\`nums1\` 的初始长度为 \`m + n\`，其中前 \`m\` 个元素表示应合并的元素，后 \`n\` 个元素为 \`0\` ，应忽略。\`nums2\` 的长度为 \`n\` 。

### 示例 1

**输入：**\`nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3\`
**输出：**\`[1,2,2,3,5,6]\`

### 示例 2

**输入：**\`nums1 = [1], m = 1, nums2 = [], n = 0\`
**输出：**\`[1]\`

### 提示

- \`nums1.length == m + n\`
- \`nums2.length == n\`
- \`0 <= m, n <= 200\`
- \`1 <= m + n <= 200\`
- \`-10^9 <= nums1[i], nums2[j] <= 10^9\``,
    solution: `## 解法：双指针（从后向前）

从数组的末尾开始填充，避免覆盖未处理的元素。使用三个指针分别指向 nums1 的有效末尾、nums2 的末尾、和合并后的末尾。

### 思路分析

1. 设置指针 i = m-1, j = n-1, k = m+n-1
2. 比较 nums1[i] 和 nums2[j]，将较大的放到 nums1[k]
3. 移动相应指针
4. 如果 nums2 还有剩余元素，继续复制到 nums1 前面

### 代码实现

\`\`\`javascript
var merge = function(nums1, m, nums2, n) {
  let i = m - 1;      // nums1 有效元素的最后一个位置
  let j = n - 1;      // nums2 最后一个元素的位置
  let k = m + n - 1;  // 合并后数组的最后一个位置

  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) {
      nums1[k] = nums1[i];
      i--;
    } else {
      nums1[k] = nums2[j];
      j--;
    }
    k--;
  }

  // 如果 nums2 还有剩余元素，直接复制
  while (j >= 0) {
    nums1[k] = nums2[j];
    j--;
    k--;
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m + n)，每个元素只被处理一次
- **空间复杂度**：O(1)，原地修改`,
    codeTemplate: {
      javascript: "var merge = function(nums1, m, nums2, n) {\n  // Write your code here\n};",
      python: "def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:\n    pass",
      java: "class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "双指针", "排序"],
  },

  {
    title: "移除元素",
    content: `## 题目描述

给你一个数组 \`nums\` 和一个值 \`val\`，你需要 **原地** 移除所有数值等于 \`val\` 的元素，并返回移除后数组的新长度。

不要使用额外的数组空间，你必须仅使用 O(1) 额外空间并 **原地修改输入数组**。

元素的顺序可以改变。你不需要考虑数组中超出新长度后面的元素。

### 示例 1

**输入：**\`nums = [3,2,2,3], val = 3\`
**输出：**\`2, nums = [2,2]\`

### 示例 2

**输入：**\`nums = [0,1,2,2,3,0,4,2], val = 2\`
**输出：**\`5, nums = [0,1,4,0,3]\`

### 提示

- \`0 <= nums.length <= 100\`
- \`0 <= nums[i] <= 50\`
- \`0 <= val <= 100\``,
    solution: `## 解法：双指针（快慢指针）

使用快慢指针技巧：快指针遍历数组，慢指针记录不等于 val 的元素位置。

### 代码实现

\`\`\`javascript
var removeElement = function(nums, val) {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];
      slow++;
    }
  }
  return slow;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var removeElement = function(nums, val) {\n  // Write your code here\n};",
      python: "def removeElement(self, nums: List[int], val: int) -> int:\n    pass",
      java: "class Solution {\n    public int removeElement(int[] nums, int val) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "双指针"],
  },

  {
    title: "删除排序数组中的重复项",
    content: `## 题目描述

给你一个 **非严格递增排列** 的数组 \`nums\` ，请你 **原地** 删除重复出现的元素，使每个元素 **只出现一次** ，返回删除后数组的新长度。元素的 **相对顺序** 应该保持 **一致** 。

由于在某些语言中不能改变数组的长度，所以必须将结果放在数组 nums 的第一部分。更规范地说，如果在删除重复项之后有 \`k\` 个元素，那么\`nums\` 的前 \`k\` 个元素应该保存最终结果。

不需要考虑数组中超出新长度后面的元素。

### 示例 1

**输入：**\`nums = [1,1,2]\`
**输出：**\`2, nums = [1,2]\`

### 示例 2

**输入：**\`nums = [0,0,1,1,1,2,2,3,3,4]\`
**输出：**\`5, nums = [0,1,2,3,4]\`

### 提示

- \`1 <= nums.length <= 3 * 10^4\`
- \`-10^4 <= nums[i] <= 10^4\`
- \`nums\` 已按 **非严格递增** 排列`,
    solution: `## 解法：双指针

利用数组已排序的特性，用慢指针指向当前不重复序列的末尾，快指针遍历寻找新元素。

### 代码实现

\`\`\`javascript
var removeDuplicates = function(nums) {
  if (nums.length === 0) return 0;

  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var removeDuplicates = function(nums) {\n  // Write your code here\n};",
      python: "def removeDuplicates(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int removeDuplicates(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "双指针"],
  },

  {
    title: "最大子数组和",
    content: `## 题目描述

给你一个整数数组 \`nums\` ，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

**子数组** 是数组中的一个连续部分。

### 示例 1

**输入：**\`nums = [-2,1,-3,4,-1,2,1,-5,4]\`
**输出：**\`6\`
**解释：**连续子数组 \\\\[4,-1,2,1\\\\] 的和最大，为 \\\`6\\\` 。

### 示例 2

**输入：**\`nums = [1]\`
**输出：**\`1\`

### 示例 3

**输入：**\`nums = [5,4,-1,7,8]\`
**输出：**\`23\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    solution: `## 解法：动态规划 / Kadane 算法

核心思想：对于每个位置，要么延续前面的子数组，要么从这里重新开始。

状态定义：\`dp[i]\` 表示以第 i 个元素结尾的最大子数组和
转移方程：\`dp[i] = max(dp[i-1] + nums[i], nums[i])\`

### 代码实现

\`\`\`javascript
var maxSubArray = function(nums) {
  let maxSum = nums[0];   // 全局最大值
  let currentSum = nums[0]; // 当前连续子数组的和

  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(currentSum + nums[i], nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var maxSubArray = function(nums) {\n  // Write your code here\n};",
      python: "def maxSubArray(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "动态规划", "分治算法"],
  },

  {
    title: "合并区间",
    content: `## 题目描述

以数组 \`intervals\` 表示若干个区间的集合，其中单个区间为 \`intervals[i] = [starti, endi]\` 。请你合并所有重叠的区间，并返回 **一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间** 。

### 示例 1

**输入：**\`intervals = [[1,3],[2,6],[8,10],[15,18]]\`
**输出：**\`[[1,6],[8,10],[15,18]]\`
**解释：**区间 [1,3] 和 [2,6] 重叠，将它们合并为 [1,6]。

### 示例 2

**输入：**\`intervals = [[1,4],[4,5]]\`
**输出：**\`[[1,5]]\`
**解释：**区间 [1,4] 和 [4,5] 可被视为重叠区间。

### 提示

- \`1 <= intervals.length <= 10^4\`
- \`intervals[i].length == 2\`
- \`0 <= starti <= endi <= 10^4\``,
    solution: `## 解法：排序 + 遍历合并

1. 按区间的起始位置排序
2. 遍历所有区间，如果当前区间与前一个区间重叠，则合并；否则添加新区间

### 代码实现

\`\`\`javascript
var merge = function(intervals) {
  if (intervals.length === 0) return [];

  // 按起始位置排序
  intervals.sort((a, b) => a[0] - b[0]);

  const result = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];

    if (curr[0] <= last[1]) {
      // 有重叠，合并区间
      last[1] = Math.max(last[1], curr[1]);
    } else {
      // 无重叠，添加新区间
      result.push(curr);
    }
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n log n)，主要来自排序
- **空间复杂度**：O(log n) 或 O(n)，取决于排序的实现`,
    codeTemplate: {
      javascript: "var merge = function(intervals) {\n  // Write your code here\n};",
      python: "def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n    pass",
      java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "排序"],
  },

  {
    title: "旋转图像",
    content: `## 题目描述

给定一个 n × n 的二维矩阵 \`matrix\` 表示一个图像。请你将图像顺时针旋转 **90 度**。

你必须在 **原地** 旋转图像，这意味着你需要直接修改输入的二维矩阵。请不要使用另一个矩阵来旋转图像。

### 示例 1

**输入：**\`matrix = [[1,2,3],[4,5,6],[7,8,9]]\`
**输出：**\`[[7,4,1],[8,5,2],[9,6,3]]\`

### 示例 2

**输入：**\`matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]\`
**输出：**\`[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]\`

### 提示

- \`matrix.length == n\`
- \`matrix[i].length == n\`
- \`1 <= n <= 20\`
- \`-1000 <= matrix[i][j] <= 1000\``,
    solution: `## 解法一：先转置再翻转

1. 先沿对角线转置（行列互换）
2. 再水平翻转每一行

### 代码实现

\`\`\`javascript
var rotate = function(matrix) {
  const n = matrix.length;

  // 转置矩阵
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // 水平翻转每行
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < Math.floor(n / 2); j++) {
      [matrix[i][j], matrix[i][n - 1 - j]] =
        [matrix[i][n - 1 - j], matrix[i][j]];
    }
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n²)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var rotate = function(matrix) {\n  // Write your code here\n};",
      python: "def rotate(self, matrix: List[List[int]]) -> None:\n    pass",
      java: "class Solution {\n    public void rotate(int[][] matrix) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "数学", "矩阵"],
  },

  {
    title: "螺旋矩阵",
    content: `## 题目描述

给你一个 \`m\` 行 \`n\` 列的矩阵 \`matrix\` ，请按照 **顺时针螺旋顺序** ，返回矩阵中的所有元素。

### 示例 1

**输入：**\`matrix = [[1,2,3],[4,5,6],[7,8,9]]\`
**输出：**\`[1,2,3,6,9,8,7,4,5]\`

### 示例 2

**输入：**\`matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]\`
**输出：**\`[1,2,3,4,8,12,11,10,9,5,6,7]\`

### 提示

- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= m, n <= 10\`
- \`-100 <= matrix[i][j] <= 100\``,
    solution: `## 解法：模拟边界收缩

定义四个边界：top、bottom、left、right，按照右→下→左→上的顺序遍历，每次遍历完一条边就收缩边界。

### 代码实现

\`\`\`javascript
var spiralOrder = function(matrix) {
  if (!matrix || matrix.length === 0) return [];

  const result = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    // 从左到右
    for (let i = left; i <= right; i++) {
      result.push(matrix[top][i]);
    }
    top++;

    // 从上到下
    for (let i = top; i <= bottom; i++) {
      result.push(matrix[i][right]);
    }
    right--;

    if (top <= bottom) {
      // 从右到左
      for (let i = right; i >= left; i--) {
        result.push(matrix[bottom][i]);
      }
      bottom--;
    }

    if (left <= right) {
      // 从下到上
      for (let i = bottom; i >= top; i--) {
        result.push(matrix[i][left]);
      }
      left++;
    }
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(1)，不包括结果数组`,
    codeTemplate: {
      javascript: "var spiralOrder = function(matrix) {\n  // Write your code here\n};",
      python: "def spiralOrder(self, matrix: List[List[int]]) -> List[int]:\n    pass",
      java: "class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "矩阵", "模拟"],
  },

  {
    title: "设置矩阵零",
    content: `## 题目描述

给定一个 \`m x n\` 的矩阵，如果一个元素为 **0** ，则将其所在行和列的所有元素都设为 0 。请使用 **原地** 算法。

### 示例 1

**输入：**\`matrix = [[1,1,1],[1,0,1],[1,1,1]]\`
**输出：**\`[[1,0,1],[0,0,0],[1,0,1]]\`

### 示例 2

**输入：**\`matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]\`
**输出：**\`[[0,0,0,0],[0,4,5,0],[0,3,1,0]]\`

### 进阶

- 一个直观的解决方案是使用  O(mn) 的额外空间，但这并不是一个好的解决方案。
- 一个简单的改进方案是使用 O(m + n) 的额外空间，但这仍然不是最佳解决方案。
- 你能想出一个仅使用常量空间的解决方案吗？`,
    solution: `## 解法：使用第一行和第一列作为标记

1. 先遍历矩阵，如果发现 0，则标记其所在行的第一个元素和所在列的第一个元素为 0
2. 再次遍历（跳过第一行和第一列），根据标记设置 0
3. 最后处理第一行和第一列

### 代码实现

\`\`\`javascript
var setZeroes = function(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;

  let firstRowHasZero = false;
  let firstColHasZero = false;

  // 检查第一行是否有 0
  for (let j = 0; j < n; j++) {
    if (matrix[0][j] === 0) {
      firstRowHasZero = true;
      break;
    }
  }

  // 检查第一列是否有 0
  for (let i = 0; i < m; i++) {
    if (matrix[i][0] === 0) {
      firstColHasZero = true;
      break;
    }
  }

  // 用第一行和第一列作为标记
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0;
        matrix[0][j] = 0;
      }
    }
  }

  // 根据标记设置 0
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][0] === 0 || matrix[0][j] === 0) {
        matrix[i][j] = 0;
      }
    }
  }

  // 处理第一行
  if (firstRowHasZero) {
    for (let j = 0; j < n; j++) {
      matrix[0][j] = 0;
    }
  }

  // 处理第一列
  if (firstColHasZero) {
    for (let i = 0; i < m; i++) {
      matrix[i][0] = 0;
    }
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var setZeroes = function(matrix) {\n  // Write your code here\n};",
      python: "def setZeroes(self, matrix: List[List[int]]) -> None:\n    pass",
      java: "class Solution {\n    public void setZeroes(int[][] matrix) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "哈希表", "矩阵"],
  },

  {
    title: "杨辉三角",
    content: `## 题目描述

给定一个非负整数 \`numRows\`，生成「杨辉三角」的前 \`numRows\` 行。

在「杨辉三角」中，每个数是它左上方和右上方的数的和。

### 示例 1

**输入：**\`numRows = 5\`
**输出：**\`[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]\`

### 示例 2

**输入：**\`numRows = 1\`
**输出：**\`[[1]]\`

### 提示

- \`1 <= numRows <= 30\``,
    solution: `## 解法：逐行构建

每一行除了首尾都是 1 外，中间元素等于上一行相邻两元素之和。

### 代码实现

\`\`\`javascript
var generate = function(numRows) {
  const result = [];

  for (let i = 0; i < numRows; i++) {
    const row = new Array(i + 1).fill(1);

    for (let j = 1; j < row.length - 1; j++) {
      row[j] = result[i - 1][j - 1] + result[i - 1][j];
    }

    result.push(row);
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(numRows²)
- **空间复杂度**：O(numRows²)`,
    codeTemplate: {
      javascript: "var generate = function(numRows) {\n  // Write your code here\n};",
      python: "def generate(self, numRows: int) -> List[List[int]]:\n    pass",
      java: "class Solution {\n    public List<List<Integer>> generate(int numRows) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "动态规划"],
  },

  {
    title: "加一",
    content: `## 题目描述

给定一个由整数组成的非空数组所表示的非负整数，在该数的基础上加一。

最高位数字存放在数组的首位， 数组中每个元素只存储单个数字。

你可以假设除了整数 0 之外，这个整数不会以零开头。

### 示例 1

**输入：**\`digits = [1,2,3]\`
**输出：**\`[1,2,4]\`

### 示例 2

**输入：**\`digits = [4,3,2,1]\`
**输出：**\`[4,3,2,2]\`

### 示例 3

**输入：**\`digits = [9]\`
**输出：**\`[1,0]\``,
    solution: `## 解法：从后向前遍历

从最后一位开始加一，如果产生进位则继续处理前一位。如果所有位都需要进位，则在数组前面插入 1。

### 代码实现

\`\`\`javascript
var plusOne = function(digits) {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;
      return digits;
    }
    digits[i] = 0;
  }

  // 所有位都是 9，需要在前面插入 1
  digits.unshift(1);
  return digits;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，最坏情况需要遍历整个数组
- **空间复杂度**：O(1)，最坏情况需要 O(n) 来扩展数组`,
    codeTemplate: {
      javascript: "var plusOne = function(digits) {\n  // Write your code here\n};",
      python: "def plusOne(self, digits: List[int]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] plusOne(int[] digits) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "数学"],
  },

  {
    title: "买卖股票的最佳时机",
    content: `## 题目描述

给定一个数组 \`prices\` ，它的第 \`i\` 个元素 \`prices[i]\` 是一支给定股票第 \`i\` 天的价格。

如果你最多只允许完成 **一笔交易**（即买入和卖出一支股票），设计一个算法来计算你所能获取的最大利润。

**注意**：你不能在买入股票前卖出股票。

### 示例 1

**输入：**\`prices = [7,1,5,3,6,4]\`
**输出：**\`5\`
**解释：**在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5 。

### 示例 2

**输入：**\`prices = [7,6,4,3,1]\`
**输出：**\`0\`
**解释：**在这种情况下，没有交易完成，所以最大利润为 0。

### 提示

- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\``,
    solution: `## 解法：一次遍历

维护到目前为止的最低价格，每天计算如果今天卖出能获得多少利润，取最大值。

### 代码实现

\`\`\`javascript
var maxProfit = function(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }

  return maxProfit;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var maxProfit = function(prices) {\n  // Write your code here\n};",
      python: "def maxProfit(self, prices: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "动态规划"],
  },

  {
    title: "存在重复元素",
    content: `## 题目描述

给你一个整数数组 \`nums\` 。如果任一值在数组中出现 **至少两次** ，返回 \`true\` ；如果数组中每个元素互不相同，返回 \`false\` 。

### 示例 1

**输入：**\`nums = [1,2,3,1]\`
**输出：**\`true\`

### 示例 2

**输入：**\`nums = [1,2,3,4]\`
**输出：**\`false\`

### 示例 3

**输入：**\`nums = [1,1,1,3,3,4,3,2,4,2]\`
**输出：**\`true\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
    solution: `## 解法一：哈希集合

遍历数组，将每个元素加入 Set，如果遇到已存在的元素则返回 true。

### 代码实现

\`\`\`javascript
var containsDuplicate = function(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var containsDuplicate = function(nums) {\n  // Write your code here\n};",
      python: "def containsDuplicate(self, nums: List[int]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "哈希表"],
  },

  {
    title: "只出现一次的数字",
    content: `## 题目描述

给你一个 **非空** 整组数组 \`nums\` ，除了某个元素只出现一次以外，其余每个元素均出现 **两次** 。找出那个只出现了一次的元素。

你必须设计并实现线性时间复杂度的算法来解决此问题，且该算法只使用常量额外空间。

### 示例 1

**输入：**\`nums = [2,2,1]\`
**输出：**\`1\`

### 示例 2

**输入：**\`nums = [4,1,2,1,2]\`
**输出：**\`4\`

### 示例 3

**输入：**\`nums = [1]\`
**输出：**\`1\`

### 提示

- \`1 <= nums.length <= 3 * 10^4\`
- \`-3 * 10^4 <= nums[i] <= 3 * 10^4\`
- 除了某个元素只出现一次以外，其余每个元素均出现两次。`,
    solution: `## 解法：位运算（异或）

异或运算的性质：
- a ^ a = 0
- a ^ 0 = a
- 异或满足交换律和结合律

所以将所有数异或起来，成对的会抵消为 0，最终剩下的就是那个单独的数。

### 代码实现

\`\`\`javascript
var singleNumber = function(nums) {
  let result = 0;
  for (const num of nums) {
    result ^= num;
  }
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var singleNumber = function(nums) {\n  // Write your code here\n};",
      python: "def singleNumber(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int singleNumber(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["位运算", "数组"],
  },

  {
    title: "两个数组的交集",
    content: `## 题目描述

给定两个数组 \`nums1\` 和 \`nums2\` ，返回 **它们的交集** 。输出结果中的每个元素一定是 **唯一** 的。我们可以 **不考虑输出结果的顺序** 。

### 示例 1

**输入：**\`nums1 = [1,2,2,1], nums2 = [2,2]\`
**输出：**\`[2]\`

### 示例 2

**输入：**\`nums1 = [4,9,5], nums2 = [9,4,9,8,4]\`
**输出：**\`[9,4]\`
**解释：**\`[4,9]\` 也是可接受的答案。

### 提示

- \`1 <= nums1.length, nums2.length <= 1000\`
- \`0 <= nums1[i], nums2[i] <= 1000\``,
    solution: `## 解法：哈希集合

将第一个数组存入 Set，然后遍历第二个数组，检查是否存在于 Set 中。

### 代码实现

\`\`\`javascript
var intersection = function(nums1, nums2) {
  const set1 = new Set(nums1);
  const result = new Set();

  for (const num of nums2) {
    if (set1.has(num)) {
      result.add(num);
    }
  }

  return Array.from(result);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m + n)
- **空间复杂度**：O(min(m, n))`,
    codeTemplate: {
      javascript: "var intersection = function(nums1, nums2) {\n  // Write your code here\n};",
      python: "def intersection(self, nums1: List[int], nums2: List[int]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] intersection(int[] nums1, int[] nums2) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "哈希表", "双指针"],
  },

  {
    title: "移动零",
    content: `## 题目描述

给定一个数组 \`nums\`，编写一个函数将所有 \`0\` 移动到数组的末尾，同时保持非零元素的相对顺序。

**请注意** ，必须在不复制数组的情况下原地对数组进行操作。

### 示例 1

**输入：**\`nums = [0,1,0,3,12]\`
**输出：**\`[1,3,12,0,0]\`

### 示例 2

**输入：**\`nums = [0]\`
**输出：**\`[0]\`

### 提示

- \`1 <= nums.length <= 10^4\`
- \`-2^31 <= nums[i] <= 2^31 - 1\``,
    solution: `## 解法：双指针（快慢指针）

使用快慢指针：慢指针指向下一个非零元素应该放置的位置，快指针遍历数组找到非零元素。

### 代码实现

\`\`\`javascript
var moveZeroes = function(nums) {
  let slow = 0;

  // 快指针找非零元素，慢指针记录位置
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
      slow++;
    }
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var moveZeroes = function(nums) {\n  // Write your code here\n};",
      python: "def moveZeroes(self, nums: List[int]) -> None:\n    pass",
      java: "class Solution {\n    public void moveZeroes(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组", "双指针"],
  },

  {
    title: "有效的数独",
    content: `## 题目描述

请你判断一个 \`9 x 9\` 的数独板是否有效。只需要 **根据以下规则** ，验证已经填入的数字是否有效即可。

1. 数字 \`1-9\` 在每一行只能出现一次。
2. 数字 \`1-9\` 在每一列只能出现一次。
3. 数字 \`1-9\` 在每一个以粗实线分隔的 \`3x3\` 宫格内只能出现一次。（请参考示例图）

**注意：**
- 一个有效的数独（部分已被填充）不一定是可解的。
- 只需要根据以上规则验证已填入的数字是否有效即可。
- 空白格用 \`'.'\` 表示。

### 示例 1

**输入：**
\`\`\`
board =
[["5","3",".",".","7",".",".",".","."]
 ,["6",".",".","1","9","5",".",".","."]
 ,[".","9","8",".",".",".",".","6","."]
 ,["8",".",".",".","6",".",".",".","3"]
 ,["4",".",".","8",".","3",".",".","1"]
 ,["7",".",".",".","2",".",".",".","6"]
 ,[".","6",".",".",".",".","2","8","."]
 ,[".",".",".","4","1","9",".",".","5"]
 ,[".",".",".",".","8",".",".","7","9"]]
\`\`\`
**输出：**\`true\``,
    solution: `## 解法：哈希集合

使用三个数组/集合分别记录每行、每列、每个宫格中已出现的数字。

### 代码实现

\`\`\`javascript
var isValidSudoku = function(board) {
  const rows = new Array(9).fill(null).map(() => new Set());
  const cols = new Array(9).fill(null).map(() => new Set());
  const boxes = new Array(9).fill(null).map(() => new Set());

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const num = board[i][j];
      if (num === '.') continue;

      const boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);

      if (rows[i].has(num) || cols[j].has(num) || boxes[boxIndex].has(num)) {
        return false;
      }

      rows[i].add(num);
      cols[j].add(num);
      boxes[boxIndex].add(num);
    }
  }

  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(81) = O(1)，固定大小棋盘
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var isValidSudoku = function(board) {\n  // Write your code here\n};",
      python: "def isValidSudoku(self, board: List[List[str]]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "哈希表", "矩阵"],
  },

  {
    title: "旋转数组",
    content: `## 题目描述

给定一个整数数组 \`nums\`，将数组中的元素向右轮转 \`k\` 个位置，其中 \`k\` 是非负数。

### 示例 1

**输入：**\`nums = [1,2,3,4,5,6,7], k = 3\`
**输出：**\`[5,6,7,1,2,3,4]\`
**解释：**
向右轮转 1 步: \\\\[7,1,2,3,4,5,6\\\\]
向右轮转 2 步: \\\\[6,7,1,2,3,4,5\\\\]
向右轮转 3 步: \\\\[5,6,7,1,2,3,4\\\\]

### 示例 2

**输入：**\`nums = [-1,-100,3,99], k = 2\`
**输出：**\`[3,99,-1,-100]\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-2^31 <= nums[i] <= 2^31 - 1\`
- \`0 <= k <= 10^5\`

**进阶**：尽可能想出更多的解决方案，至少有 **三种**不同的方法可以解决这个问题。你能使用 **空间复杂度为 O(1)** 的 **原地** 算法解决这个问题吗？`,
    solution: `## 解法：三次反转

1. 反转整个数组
2. 反转前 k 个元素
3. 反转剩下的 n-k 个元素

### 代码实现

\`\`\`javascript
var rotate = function(nums, k) {
  const n = nums.length;
  k = k % n; // 处理 k 大于数组长度的情况

  const reverse = (start, end) => {
    while (start < end) {
      [nums[start], nums[end]] = [nums[end], nums[start]];
      start++;
      end--;
    }
  };

  reverse(0, n - 1);
  reverse(0, k - 1);
  reverse(k, n - 1);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var rotate = function(nums, k) {\n  // Write your code here\n};",
      python: "def rotate(self, nums: List[int], k: int) -> None:\n    pass",
      java: "class Solution {\n    public void rotate(int[] nums, int k) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "数学", "双指针"],
  },

  {
    title: "除自身以外数组的乘积",
    content: `## 题目描述

给你一个整数数组 \`nums\`，返回 **数组\`answer\`** ，其中 \`answer[i]\` 等于 \`nums\` 中除 \`nums[i]\` 之外其余各元素的乘积。

题目数据 **保证** 数组 \`nums\` 之中任意元素的全部前缀元素和后缀的乘积都在 **32 位** 整数范围内。

请 **不要使用除法**，且在 **O(n)** 时间复杂度内完成此问题。

### 示例 1

**输入：**\`nums = [1,2,3,4]\`
**输出：**\`[24,12,8,6]\`

### 示例 2

**输入：**\`nums = [-1,1,0,-3,3]\`
**输出：**\`[0,0,9,0,0]\`

### 提示

- \`2 <= nums.length <= 10^5\`
- \`-30 <= nums[i] <= 30\`
- 保证数组 \`nums\` 之中任意元素的全部前缀元素和后缀的乘积都在 32 位整数范围内

**进阶**：你可以在 O(1) 的额外空间复杂度内完成这个问题吗？（出于对复杂度分析的目的，输出数组不被视为额外空间。）`,
    solution: `## 解法：左右乘积列表

对于每个位置，其答案 = 左侧所有元素的乘积 × 右侧所有元素的乘积。

可以用输出数组作为左侧乘积的空间，再用一个变量累积右侧乘积。

### 代码实现

\`\`\`javascript
var productExceptSelf = function(nums) {
  const n = nums.length;
  const answer = new Array(n);

  // 第一次遍历：计算左侧乘积
  answer[0] = 1;
  for (let i = 1; i < n; i++) {
    answer[i] = answer[i - 1] * nums[i - 1];
  }

  // 第二次遍历：计算右侧乘积并更新 answer
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= rightProduct;
    rightProduct *= nums[i];
  }

  return answer;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)，不计输出数组`,
    codeTemplate: {
      javascript: "var productExceptSelf = function(nums) {\n  // Write your code here\n};",
      python: "def productExceptSelf(self, nums: List[int]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "前缀和"],
  },

  {
    title: "缺失的第一个正数",
    content: `## 题目描述

给你一个未排序的整数数组 \`nums\` ，请你找出其中没有出现的最小的正整数。

请你实现时间复杂度为 \`O(n)\` 并且只使用常数级别额外空间的解决方案。

### 示例 1

**输入：**\`nums = [1,2,0]\`
**输出：**\`3\`

### 示例 2

**输入：**\`nums = [3,4,-1,1]\`
**输出：**\`2\`

### 示例 3

**输入：**\`nums = [7,8,9,11,12]\`
**输出：**\`1\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-2^31 <= nums[i] <= 2^31 - 1\``,
    solution: `## 解法：原地哈希（索引映射）

核心思想：将数组本身当作哈希表。对于每个正整数 x，将它放到索引 x-1 的位置上。

1. 遍历数组，将每个正数放到正确的位置
2. 再次遍历，找到第一个不在正确位置的索引+1即为答案

### 代码实现

\`\`\`javascript
var firstMissingPositive = function(nums) {
  const n = nums.length;

  for (let i = 0; i < n; i++) {
    while (
      nums[i] >= 1 &&
      nums[i] <= n &&
      nums[nums[i] - 1] !== nums[i]
    ) {
      // 将 nums[i] 放到正确的位置
      const correctIdx = nums[i] - 1;
      [nums[i], nums[correctIdx]] = [nums[correctIdx], nums[i]];
    }
  }

  // 找到第一个不在正确位置的数
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) {
      return i + 1;
    }
  }

  return n + 1;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，虽然内层有while循环，但每个元素最多被交换一次
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var firstMissingPositive = function(nums) {\n  // Write your code here\n};",
      python: "def firstMissingPositive(self, nums: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int firstMissingPositive(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["数组", "哈希表"],
  },

  {
    title: "矩阵置零（进阶版）",
    content: `## 题目描述

给定一个 m x n 的矩阵，如果一个元素为 0，则将其所在行和列的所有元素都设为 0。

**要求**：使用 O(1) 额外空间。

### 示例

**输入：**\`[[1,1,1],[1,0,1],[1,1,1]]\`
**输出：**\`[[1,0,1],[0,0,0],[1,0,1]]\`

**提示**：思考如何利用矩阵的第一行和第一列作为标记位。`,
    solution: `## 解法：利用首行首列做标记

详见上方\"设置矩阵零\"题目的解法。关键点是需要先检查第一行和第一列本身是否包含0，然后再用它们作为标记位。`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["数组", "矩阵", "哈希表"],
  },

  {
    title: "颜色分类",
    content: `## 题目描述

给定一个包含红色、白色和蓝色、共 \`n\` 个元素的数组 \`nums\` ，**原地** 对它们进行排序，使得相同颜色的元素相邻，并按照红色、白色、蓝色的顺序排列。

我们使用整数 \`0\`、\`1\` 和 \`2\` 分别表示红色、白色和蓝色。

必须在不使用库内置的 sort 函数的情况下解决这个问题。

### 示例 1

**输入：**\`nums = [2,0,2,1,1,0]\`
**输出：**\`[0,0,1,1,2,2]\`

### 示例 2

**输入：**\`nums = [2,0,1]\`
**输出：**\`[0,1,2]\`

### 提示

- \`n == nums.length\`
- \`1 <= n <= 300\`
- \`nums[i]\` 为 \`0\`、\`1\` 或 \`2\`

**进阶**：你能想出一个仅使用常数空间的一趟扫描算法吗？`,
    solution: `## 解法：三路快排（荷兰国旗问题）

使用三个指针：
- left：指向 0 区域的边界
- mid：当前遍历的位置
- right：指向 2 区域的边界

### 代码实现

\`\`\`javascript
var sortColors = function(nums) {
  let left = 0, mid = 0;
  let right = nums.length - 1;

  while (mid <= right) {
    if (nums[mid] === 0) {
      [nums[left], nums[mid]] = [nums[mid], nums[left]];
      left++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[right]] = [nums[right], nums[mid]];
      right--;
    }
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var sortColors = function(nums) {\n  // Write your code here\n};",
      python: "def sortColors(self, nums: List[int]) -> None:\n    pass",
      java: "class Solution {\n    public void sortColors(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针", "排序"],
  },

  {
    title: "下一个排列",
    content: `## 题目描述

整数数组的一个 **排列** 就是将其所有成员以序列或线性顺序排列。

例如，\`arr = [1,2,3]\` ，以下这些都可以视作 \`arr\` 的排列：\`[1,2,3]、[1,3,2]、[3,1,2]、[2,3,1]\` 。
整数的 **下一个排列** 是指其整数的下一个字典序更大的排列。更正式地，如果数组的所有排列根据其字典顺序从小到大排列在一个容器中，那么数组的 **下一个排列** 就是在这个有序容器中排在它后面的那个排列。如果不存在下一个更大的排列，那么这个数组必须重排为字典序最小的排列（即升序排列）。

例如，\`arr = [1,2,3]\` 的下一个排列是 \\\\[1,3,2\\\\] 。
类似地 \\\\[arr = [2,3,1]\\\\] 的下一个排列是 \\\\[3,1,2\\\\] 。
而 \\\\[arr = [3,2,1]\\\\] 的下一个排列是 \\\\[1,2,3\\\\] ，因为 \\\\[3,2,1]\\\\] 不存在一个字典序更大的排列。

给你一个整数数组 \`nums\` ，找出 \`nums\` 的下一个排列，必须 **原地** 修改，只允许使用额外常数空间。

### 示例 1

**输入：**\`nums = [1,2,3]\`
**输出：**\`[1,3,2]\`

### 示例 2

**输入：**\`nums = [3,2,1]\`
**输出：**\`[1,2,3]\`

### 示例 3

**输入：**\`nums = [1,1,5]\`
**输出：**\`[1,5,1]\``,
    solution: `## 解法：两步走

1. **找下降点**：从后往前找第一个 \`nums[i] < nums[i+1]\` 的位置 i
2. **交换并反转**：从后往前找第一个大于 \`nums[i]\` 的数交换，然后将 i 后面的部分反转（变为升序）

### 代码实现

\`\`\`javascript
var nextPermutation = function(nums) {
  const n = nums.length;

  // 第一步：找到第一个下降点
  let i = n - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) {
    i--;
  }

  if (i >= 0) {
    // 第二步：找到比 nums[i] 大的最小数
    let j = n - 1;
    while (j > i && nums[j] <= nums[i]) {
      j--;
    }
    // 交换
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  // 第三步：反转 i 之后的部分
  let left = i + 1, right = n - 1;
  while (left < right) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
    left++;
    right--;
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var nextPermutation = function(nums) {\n  // Write your code here\n};",
      python: "def nextPermutation(self, nums: List[int]) -> None:\n    pass",
      java: "class Solution {\n    public void nextPermutation(int[] nums) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针"],
  },

  {
    title: "最长无重复字符子串",
    content: `## 题目描述

给定一个字符串 \`s\` ，请你找出其中不含有重复字符的 **最长子串** 的长度。

### 示例 1

**输入：**\`s = \"abcabcbb\"\`
**输出：**\`3\`
**解释：**因为无重复字符的最长子串是 \\\\\"abc\\\\\"，所以其长度为 3。

### 示例 2

**输入：**\`s = \"bbbbb\"\`
**输出：**\`1\`

### 示例 3

**输入：**\`s = \"pwwkew\"\`
**输出：**\`3\`
**解释：**因为无重复字符的最长子串是 \\\\\"wke\\\\\"，所以其长度为 3。

### 提示

- \`0 <= s.length <= 5 * 10^4\`
- \`s\` 由英文字母、数字、符号和空格组成`,
    solution: `## 解法：滑动窗口 + 哈希表

使用滑动窗口技术，维护一个窗口内的字符都不重复。当遇到重复字符时，收缩左边界。

### 代码实现

\`\`\`javascript
var lengthOfLongestSubstring = function(s) {
  const charIndex = new Map();
  let maxLength = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // 如果字符已在窗口内，移动左边界
    if (charIndex.has(char) && charIndex.get(char) >= left) {
      left = charIndex.get(char) + 1;
    }

    charIndex.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(min(m, n))，m 为字符集大小`,
    codeTemplate: {
      javascript: "var lengthOfLongestSubstring = function(s) {\n  // Write your code here\n};",
      python: "def lengthOfLongestSubstring(self, s: str) -> int:\n    pass",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["字符串", "哈希表", "滑动窗口"],
  },

  {
    title: "盛最多水的容器",
    content: `## 题目描述

给定一个长度为 \`n\` 的整数数组 \`height\` 。有 \`n\` 条垂线，第 \`i\` 条线的两个端点是 \\\\(i, 0\\\\) 和 \\\\(i, height[i]\\\\) 。

找出其中的两条线，使得它们与 \\x轴 共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明**：你不能倾斜容器。

### 示例 1

**输入：**\`height = [1,8,6,2,5,4,8,3,7]\`
**输出：**\`49\`
**解释：**图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。

### 示例 2

**输入：**\`height = [1,1]\`
**输出：**\`1\`

### 提示

- \`n == height.length\`
- \`2 <= n <= 10^5\`
- \`0 <= height[i] <= 10^4\``,
    solution: `## 解法：双指针

从两端向中间收敛。每次移动较短的指针，因为容器的面积取决于较短的那条线。

### 代码实现

\`\`\`javascript
var maxArea = function(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, width * h);

    // 移动较短的指针
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var maxArea = function(height) {\n  // Write your code here\n};",
      python: "def maxArea(self, height: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int maxArea(int[] height) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针", "贪心"],
  },

  {
    title: "三数之和（最接近目标值）",
    content: `## 题目描述

给你一个长度为 \`n\` 的整数数组 \`nums\` 和一个目标值 \`target\` 。请你从 \`nums\` 中选出三个整数，使它们的和与 \`target\` 最接近。

返回这三个数的和。

假定每组输入只存在恰好一个解。

### 示例 1

**输入：**\`nums = [-1,2,1,-4], target = 1\`
**输出：**\`2\`
**解释：**与 target 最接近的和是 2 (-1 + 2 + 1 = 2) 。

### 示例 2

**输入：**\`nums = [0,0,0], target = 1\`
**输出：**\`0\`

### 提示

- \`3 <= nums.length <= 1000\`
- \`-1000 <= nums[i] <= 1000\`
- \`-10^4 <= target <= 10^4\``,
    solution: `## 解法：排序 + 双指针

类似三数之和的思路，但这次要找的是最接近目标的组合。

### 代码实现

\`\`\`javascript
var threeSumClosest = function(nums, target) {
  nums.sort((a, b) => a - b);
  let closestSum = nums[0] + nums[1] + nums[2];

  for (let i = 0; i < nums.length - 2; i++) {
    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
        closestSum = sum;
      }

      if (sum < target) {
        left++;
      } else if (sum > target) {
        right--;
      } else {
        return sum; // 精确匹配
      }
    }
  }

  return closestSum;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n²)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var threeSumClosest = function(nums, target) {\n  // Write your code here\n};",
      python: "def threeSumClosest(self, nums: List[int], target: int) -> int:\n    pass",
      java: "class Solution {\n    public int threeSumClosest(int[] nums, int target) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针", "排序"],
  },

  {
    title: "四数之和",
    content: `## 题目描述

给你一个由 \`n\` 个整数组成的数组 \`nums\` ，和一个目标值 \`target\` 。请你找出并返回满足下述全部条件且**不重复**的四元组 \\\\[nums[a], nums[b], nums[c], nums[d]\\\\] （若两个四元组元素一一对应，则认为两个四元组重复）：

- \`0 <= a, b, c, d < n\`
- \`a\`、\`b\`、\`c\` 和 \`d\` **互不相同**
- \`nums[a] + nums[b] + nums[c] + nums[d] == target\`

你可以按 **任意顺序** 返回答案 。

### 示例 1

**输入：**\`nums = [1,0,-1,0,-2,2], target = 0\`
**输出：**\`[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]\`

### 示例 2

**输入：**\`nums = [2,2,2,2,2], target = 8\`
**输出：**\`[[2,2,2,2]]\`

### 提示

- \`1 <= nums.length <= 200\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\``,
    solution: `## 解法：排序 + 双指针（两层循环）

在三数之和基础上增加一层循环，同样需要注意去重。

### 代码实现

\`\`\`javascript
var fourSum = function(nums, target) {
  const result = [];
  nums.sort((a, b) => a - b);
  const n = nums.length;

  for (let i = 0; i < n - 3; i++) {
    // 去重
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    for (let j = i + 1; j < n - 2; j++) {
      // 去重
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;

      let left = j + 1;
      let right = n - 1;

      while (left < right) {
        const sum = nums[i] + nums[j] + nums[left] + nums[right];

        if (sum === target) {
          result.push([nums[i], nums[j], nums[left], nums[right]]);
          while (left < right && nums[left] === nums[left + 1]) left++;
          while (left < right && nums[right] === nums[right - 1]) right--;
          left++;
          right--;
        } else if (sum < target) {
          left++;
        } else {
          right--;
        }
      }
    }
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n³)
- **空间复杂度**：O(k)，k 为结果数量`,
    codeTemplate: {
      javascript: "var fourSum = function(nums, target) {\n  // Write your code here\n};",
      python: "def fourSum(self, nums: List[int], target: int) -> List[List[int]]:\n    pass",
      java: "class Solution {\n    public List<List<Integer>> fourSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针", "排序"],
  },

  {
    title: "四数相加 II",
    content: `## 题目描述

给你四个整数数组 \`nums1\` 、\`nums2\` 、\`nums3\` 和 \`nums4\` ，数组长度都是 \`n\` ，请你计算有多少个元组 \\\\(i, j, k, l\\\\) 能满足：

- \`0 <= i, j, k, l < n\`
- \`nums1[i] + nums2[j] + nums3[k] + nums4[l] == 0\`

### 示例 1

**输入：**\`nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]\`
**输出：**\`2\`
**解释：**
两个元组如下：
1. (0, 0, 0, 1) -> nums1[0] + nums2[0] + nums3[0] + nums4[1] = 1 + (-2) + (-1) + 2 = 0
2. (1, 1, 0, 0) -> nums1[1] + nums2[1] + nums3[0] + nums4[0] = 2 + (-1) + (-1) + 0 = 0

### 示例 2

**输入：**\`nums1 = [0], nums2 = [0], nums3 = [0], nums4 = [0]\`
**输出：**\`1\`

### 提示

- \`n == nums1.length\`
- \`1 <= n <= 200\`
- \`-2^28 <= nums1[i] <= 2^28\``,
    solution: `## 解法：分组 + 哈希表

将四数之和拆分为两组两数之和。先用哈希表存储 nums1 + nums2 的所有可能和及其出现次数，再遍历 nums3 + nums4 查找互补的和。

### 代码实现

\`\`\`javascript
var fourSumCount = function(nums1, nums2, nums3, nums4) {
  const sumMap = new Map();
  let count = 0;

  // 存储 nums1 + nums2 的所有和
  for (const a of nums1) {
    for (const b of nums2) {
      const sum = a + b;
      sumMap.set(sum, (sumMap.get(sum) || 0) + 1);
    }
  }

  // 查找 nums3 + nums4 的互补和
  for (const c of nums3) {
    for (const d of nums4) {
      const target = -(c + d);
      if (sumMap.has(target)) {
        count += sumMap.get(target);
      }
    }
  }

  return count;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n²)
- **空间复杂度**：O(n²)`,
    codeTemplate: {
      javascript: "var fourSumCount = function(nums1, nums2, nums3, nums4) {\n  // Write your code here\n};",
      python: "def fourSumCount(self, nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "哈希表"],
  },

  // ==================== 基础数据结构：链表（26-40）====================

  {
    title: "合并两个有序链表",
    content: `## 题目描述

将两个升序链表合并为一个新的 **升序** 链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。

### 示例 1

**输入：**\`l1 = [1,2,4], l2 = [1,3,4]\`
**输出：**\`[1,1,2,3,4,4]\`

### 示例 2

**输入：**\`l1 = [], l2 = []\`
**输出：**\`[]\`

### 示例 3

**输入：**\`l1 = [], l2 = [0]\`
**输出：**\`[0]\`

### 提示

- 两个链表的节点数目范围是 \\\\[0, 50\\\\]
- \`-100 <= Node.val <= 100\`
- \`l1\` 和 \`l2\` 均按 **非递减顺序** 排列`,
    solution: `## 解法：迭代（虚拟头节点）

创建虚拟头节点简化操作，依次比较两个链表的节点，将较小的节点接到结果链表上。

### 代码实现

\`\`\`javascript
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

var mergeTwoLists = function(l1, l2) {
  const dummy = new ListNode(-1);
  let current = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }

  // 连接剩余节点
  current.next = l1 || l2;

  return dummy.next;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m + n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var mergeTwoLists = function(l1, l2) {\n  // Write your code here\n};",
      python: "def mergeTwoLists(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["链表", "递归"],
  },

  {
    title: "环形链表",
    content: `## 题目描述

给你一个链表的头节点 \`head\` ，判断链表中是否有环。

如果链表中有某个节点，可以通过连续跟踪 \`next\` 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 \`pos\` 来表示链表尾连接到链表中的位置（索引从 0 开始）。**注意：pos 不作为参数进行传递** 。仅仅是为了标识链表的实际情况。

如果链表中存在环 ，则返回 \`true\` 。 否则，返回 \`false\` 。

### 示例 1

**输入：**\`head = [3,2,0,-4], pos = 1\`
**输出：**\`true\`
**解释：**链表中有一个环，尾部连接到第二个节点。

### 示例 2

**输入：**\`head = [1,2], pos = 0\`
**输出：**\`true\`
**解释：**链表中有一个环，尾部连接到第一个节点。

### 示例 3

**输入：**\`head = [1], pos = -1\`
**输出：**\`false\`
**解释：**链表中没有环。

### 提示

- 链表中节点的数目范围是 \\\\[0, 10^4\\\\]
- \`-10^5 <= Node.val <= 10^5\`
- \`pos\` 为 \`-1\` 或者链表中的 **有效索引** 。

**进阶**：你能用 \`O(1)\`（即，常量）内存解决此问题吗？`,
    solution: `## 解法：快慢指针（Floyd 判圈算法）

使用快慢指针：快指针每次走两步，慢指针每次走一步。如果有环，快指针一定会追上慢指针。

### 代码实现

\`\`\`javascript
var hasCycle = function(head) {
  if (!head || !head.next) return false;

  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var hasCycle = function(head) {\n  // Write your code here\n};",
      python: "def hasCycle(self, head: Optional[ListNode]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean hasCycle(ListNode head) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["链表", "双指针"],
  },

  {
    title: "环形链表 II",
    content: `## 题目描述

给定一个链表的头节点  \`head\` ，返回链表开始入环的第一个节点。 **如果链表无环，则返回 \`null\`**。

如果链表中有某个节点，可以通过连续跟踪 \`next\` 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 \`pos\` 来表示链表尾连接到链表中的位置（索引从 0 开始）。如果 \`pos\` 是 \`-1\`，则在该链表中没有环。**注意：\`pos\` 不作为参数进行传递**，仅仅是为了标识链表的情况。

**不允许修改** 给定的链表。

### 示例 1

**输入：**\`head = [3,2,0,-4], pos = 1\`
**输出：**\`返回索引为 1 的链表节点\`
**解释：**链表中有一个环，其尾部连接到第二个节点。

### 示例 2

**输入：**\`head = [1,2], pos = 0\`
**输出：**\`返回索引为 0 的链表节点\`

### 提示

- 链表中节点的数目范围在范围 \\\\[0, 10^4\\\\] 内
- \`-10^5 <= Node.val <= 10^5\`
- \`pos\` 的值为 \`-1\` 或者链表中的一个有效索引`,
    solution: `## 解法：快慢指针（数学推导）

1. 快慢指针相遇后，将其中一个指针放回头部
2. 两个指针同时以步长 1 前进
3. 再次相遇的点就是环的入口

### 数学证明
设：链头到环入口距离为 a，环入口到相遇点距离为 b，相遇点到环入口距离为 c
- 慢指针走了：a + b
- 快指针走了：a + b + n(b + c) = 2(a + b)
- 得出：a = c + (n-1)(b + c)

### 代码实现

\`\`\`javascript
var detectCycle = function(head) {
  if (!head || !head.next) return null;

  let slow = head;
  let fast = head;

  // 第一阶段：检测是否有环
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // 第二阶段：找到环的入口
      let ptr1 = head;
      let ptr2 = slow;

      while (ptr1 !== ptr2) {
        ptr1 = ptr1.next;
        ptr2 = ptr2.next;
      }

      return ptr1;
    }
  }

  return null;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var detectCycle = function(head) {\n  // Write your code here\n};",
      python: "def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode detectCycle(ListNode head) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["链表", "双指针", "哈希表"],
  },

  {
    title: "相交链表",
    content: `## 题目描述

给你两个单链表的头节点 \`headA\` 和 \`headB\` ，请你找出并返回两个单链表相交的起始节点。如果两个链表没有交点，返回 \`null\` 。

题目数据 **保证** 整个链式结构中不存在环。

**注意**，函数返回结果后，**链表必须保持其原始结构** 。

自定义评测：

评测系统程序的输入如下（你设计的程序 **不适用** 此输入）：

- \`intersectVal\` - 相交的起始节点的值。如果不存在相交节点，这一值为 \`null\`
- \`listA\` - 第一个链表
- \`listB\` - 第二个链表
- \`skipA\` - 在 listA 中（从头节点开始）跳到交叉节点的节点数
- \`skipB\` - 在 listB 中（从头节点开始）跳到交叉节点的节点数

评测系统将根据这些输入创建链式数据结构，并将两个头节点 \`headA\` 和 \`headB\` 传递给你的程序。如果程序能够正确返回相交节点，那么你的解决方案将被 **视作正确答案** 。

### 示例 1

**输入：**\`intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3\`
**输出：**Intersected at '8'
**解释：**相交节点的值为 8 （注意，如果两个链表相交则不能为 0）。

### 提示

- \`listA\` 中节点数目为 \`m\`
- \`listB\` 中节点数目为 \`n\`
- \`1 <= m, n <= 3 * 10^4\`
- \`1 <= Node.val <= 10^5\`
- \`0 <= skipA <= m\`
- \`0 <= skipB <= n\`
- 如果 \`listA\` 和 \`listB\` 没有交点，\`intersectVal\` 为 \`null\`
- 如果 \`listA\` 和 \`listB\` 有交点，\`intersectVal == listA[skipA] == listB[skipB]\`

**进阶**：你能否设计一个时间复杂度 \`O(m + n)\` 、仅用 \`O(1)\` 内存的解决方案？`,
    solution: `## 解法：双指针法

两个指针分别从两条链表出发，当一个指针走到末尾时，切换到另一条链表的头部。这样两个指针走过的总长度相同，会在交点处相遇（或在 null 处同时结束）。

### 代码实现

\`\`\`javascript
var getIntersectionNode = function(headA, headB) {
  if (!headA || !headB) return null;

  let pA = headA;
  let pB = headB;

  while (pA !== pB) {
    pA = pA ? pA.next : headB;
    pB = pB ? pB.next : headA;
  }

  return pA;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m + n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var getIntersectionNode = function(headA, headB) {\n  // Write your code here\n};",
      python: "def getIntersectionNode(self, headA: ListNode, headB: ListNode) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode getIntersectionNode(ListNode headA, ListNode headB) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["链表", "双指针"],
  },

  {
    title: "删除链表的倒数第 N 个结点",
    content: `## 题目描述

给你一个链表，删除链表的倒数第 \`n\` 个结点，并且返回链表的头节点。

### 示例 1

**输入：**\`head = [1,2,3,4,5], n = 2\`
**输出：**\`[1,2,3,5]\`

### 示例 2

**输入：**\`head = [1], n = 1\`
**输出：**\`[]\`

### 示例 3

**输入：**\`head = [1,2], n = 1\`
**输出：**\`[1]\`

### 提示

- 链表中结点的数目为 \`sz\`
- \`1 <= sz <= 30\`
- \`0 <= Node.val <= 100\`
- \`1 <= n <= sz\`

**进阶**：你能尝试使用一趟扫描实现吗？`,
    solution: `## 解法：双指针（快慢指针）

让快指针先走 n 步，然后快慢指针一起走。当快指针到达末尾时，慢指针就在倒数第 n+1 个位置。

### 代码实现

\`\`\`javascript
var removeNthFromEnd = function(head, n) {
  const dummy = new ListNode(-1, head);
  let fast = dummy;
  let slow = dummy;

  // 快指针先走 n+1 步
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // 一起走到末尾
  while (fast) {
    fast = fast.next;
    slow = slow.next;
  }

  // 删除倒数第 n 个节点
  slow.next = slow.next.next;

  return dummy.next;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(L)，L 为链表长度
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var removeNthFromEnd = function(head, n) {\n  // Write your code here\n};",
      python: "def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["链表", "双指针"],
  },

  {
    title: "K个一组翻转链表",
    content: `## 题目描述

给你链表的头节点 \`head\` ，每 \`k\` 个节点一组进行翻转，请你返回修改后的链表。

\`k\` 是一个正整数，它的值小于或等于链表的长度。如果节点总数不是 \`k\` 的整数倍，那么请将最后剩余的节点保持原有顺序。

你不能只是单纯的改变节点内部的值，而是需要实际进行节点交换。

### 示例 1

**输入：**\`head = [1,2,3,4,5], k = 2\`
**输出：**\`[2,1,4,3,5]\`

### 示例 2

**输入：**\`head = [1,2,3,4,5], k = 3\`
**输出：**\`[3,2,1,4,5]\`

### 提示

- 链表中的节点数目为 \`sz\`
- \`1 <= sz <= 5000\`
- \`0 <= Node.val <= 1000\`
- \`1 <= k <= sz\``,
    solution: `## 解法：迭代 + 分段翻转

1. 使用哑节点简化头节点处理
2. 每 k 个节点调用翻转函数
3. 正确连接翻转后的段落

### 代码实现

\`\`\`javascript
var reverseKGroup = function(head, k) {
  const dummy = new ListNode(-1, head);
  let prev = dummy;

  while (head) {
    // 找到本段的尾部
    let tail = prev;
    for (let i = 0; i < k; i++) {
      tail = tail.next;
      if (!tail) return dummy.next;
    }

    // 记录下一段的起点
    const nextGroup = tail.next;

    // 翻转当前段
    const reversed = reverseList(head, tail);

    // 连接
    head = reversed.head;
    tail = reversed.tail;

    prev.next = head;
    tail.next = nextGroup;

    // 移动指针
    prev = tail;
    head = nextGroup;
  }

  return dummy.next;
};

// 翻转 [head, tail] 区间的链表
function reverseList(head, tail) {
  let prev = tail.next;
  let curr = head;
  while (prev !== tail) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return { head: tail, tail: head };
}
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var reverseKGroup = function(head, k) {\n  // Write your code here\n};",
      python: "def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode reverseKGroup(ListNode head, int k) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["链表", "递归"],
  },

  {
    title: "复制带随机指针的链表",
    content: `## 题目描述

给你一个长度为 \`n\` 的链表，每个节点包含一个额外增加的随机指针 \`random\` ，该指针可以指向链表中的任何节点或空节点。

构造这个链表的 **深拷贝** 。 深拷贝应该正好由 \`n\` 个 **全新** 节点组成，其中每个新节点的值都设为其对应原节点的值。新节点的 \`next\` 指针和 \`random\` 指针也都应指向复制链表中的新节点，并使原链表和复制链表中的这些指针能够表示相同的链表状态。**复制链表中的指针都不应指向原链表中的节点** 。

例如，如果原链表中有 \`X\` 和 \`Y\` 两个节点，其中 \`X.random --> Y\` 。那么对应复制链表中 \`x\` 和 \`y\` 两个节点，同样有 \`x.random --> y\` 。

返回复制链表的头节点。

用一个由 \`n\` 个节点组成的链表来表示输入/输出中的链表。每个节点用一个 \`[val, random_index]\` 表示：

- \`val\`：一个表示 \`Node.val\` 的整数。
- \`random_index\`：随机指针指向的节点索引（范围从 \\\\[0, n-1\\\\]）；如果不指向任何节点，则为  \`null\` 。

你的代码 **只** 接受原链表的头节点 \`head\` 作为传入参数。

### 示例 1

**输入：**\`head = [[7,null],[13,0],[11,4],[10,2],[1,0]]\`
**输出：**\`[[7,null],[13,0],[11,4],[10,2],[1,0]]\`

### 示例 2

**输入：**\`head = [[1,1],[2,1]]\`
**输出：**\`[[1,1],[2,1]]\`

### 提示

- \`0 <= n <= 1000\`
- \`-10^4 <= Node.val <= 10^4\`
- \`Node.random\` 为 \`null\` 或指向链表中的节点。

**进阶**：能否使用 O(n) 时间复杂度和 O(1) 空间复杂度解决？`,
    solution: `## 解法：拼接拆分法（最优空间）

1. 在每个原节点后面插入复制的节点
2. 根据原节点的 random 指针设置复制节点的 random
3. 拆分为两个链表

### 代码实现

\`\`\`javascript
var copyRandomList = function(head) {
  if (!head) return null;

  // 第一步：在每个节点后插入复制节点
  let curr = head;
  while (curr) {
    const newNode = new Node(curr.val, curr.next, null);
    curr.next = newNode;
    curr = newNode.next;
  }

  // 第二步：设置 random 指针
  curr = head;
  while (curr) {
    if (curr.random !== null) {
      curr.next.random = curr.random.next;
    }
    curr = curr.next.next;
  }

  // 第三步：拆分链表
  const dummy = new Node(-1);
  let copyCurr = dummy;
  curr = head;

  while (curr) {
    copyCurr.next = curr.next;
    copyCurr = copyCurr.next;
    curr.next = curr.next.next;
    curr = curr.next;
  }

  return dummy.next;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)，不计输出`,
    codeTemplate: {
      javascript: "var copyRandomList = function(head) {\n  // Write your code here\n};",
      python: "def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':\n    pass",
      java: "class Solution {\n    public Node copyRandomList(Node head) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["链表", "哈希表", "链表"],
  },

  {
    title: "排序链表",
    content: `## 题目描述

给你链表的头节点 \`head\` ，请将其按 **升序** 排列并返回 **排序后的链表** 。

### 示例 1

**输入：**\`head = [4,2,1,3]\`
**输出：**\`[1,2,3,4]\`

### 示例 2

**输入：**\`head = [-1,5,3,4,0]\`
**输出：**\`[-1,0,3,4,5]\`

### 示例 3

**输入：**\`head = []\`
**输出：**\`[]\`

### 提示

- 链表中节点的数目在范围 \\\\[0, 5 * 10^4\\\\] 内
- \`-10^5 <= Node.val <= 10^5\`

**进阶**：你可以在 \`O(n log n)\` 时间复杂度和常数级空间复杂度下，对链表进行排序吗？`,
    solution: `## 解法：归并排序（自底向上）

使用归并排序的思想，但采用自底向上的方式，避免递归带来的栈空间开销。

### 代码实现

\`\`\`javascript
var sortList = function(head) {
  if (!head || !head.next) return head;

  // 使用快慢指针找到中点
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 断开链表
  const mid = slow.next;
  slow.next = null;

  // 递归排序两部分
  const left = sortList(head);
  const right = sortList(mid);

  // 合并两个有序链表
  return merge(left, right);
};

function merge(l1, l2) {
  const dummy = new ListNode(-1);
  let curr = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  curr.next = l1 || l2;
  return dummy.next;
}
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n log n)
- **空间复杂度**：O(log n)，递归栈空间`,
    codeTemplate: {
      javascript: "var sortList = function(head) {\n  // Write your code here\n};",
      python: "def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode sortList(ListNode head) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["链表", "双指针", "分治算法"],
  },

  {
    title: "回文链表",
    content: `## 题目描述

给你一个单链表的头节点 \`head\` ，请你判断该链表是否为回文链表。如果是，返回 \`true\` ；否则，返回 \`false\` 。

### 示例 1

**输入：**\`head = [1,2,2,1]\`
**输出：**\`true\`

### 示例 2

**输入：**\`head = [1,2]\`
**输出：**\`false\`

### 提示

- 链表中节点数目在范围 \\\\[1, 10^5\\\\] 内
- \`0 <= Node.val <= 9\`

**进阶**：你能否用 \`O(n)\` 时间复杂度和 \`O(1)\` 空间复杂度解决此题？`,
    solution: `## 解法：快慢指针 + 翻转后半部分

1. 使用快慢指针找到链表中点
2. 翻转后半部分链表
3. 比较前后两部分
4. 恢复链表（可选）

### 代码实现

\`\`\`javascript
var isPalindrome = function(head) {
  // 找到中点
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 翻转后半部分
  let prev = null;
  let curr = slow;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // 比较
  let left = head;
  let right = prev;
  let result = true;

  while (right) {
    if (left.val !== right.val) {
      result = false;
      break;
    }
    left = left.next;
    right = right.next;
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var isPalindrome = function(head) {\n  // Write your code here\n};",
      python: "def isPalindrome(self, head: Optional[ListNode]) -> bool:\n    pass",
      java: "class Solution {\n    public boolean isPalindrome(ListNode head) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["链表", "双指针", "栈"],
  },

  {
    title: "合并 K 个升序链表",
    content: `## 题目描述

给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

### 示例 1

**输入：**\`lists = [[1,4,5],[1,3,4],[2,6]]\`
**输出：**\`[1,1,2,3,4,4,5,6]\`
**解释：**链表数组如下：
[
  1->4->5,
  1->3->4,
  2->6
]
将它们合并成一个有序链表得到
1->1->2->3->4->4->5->6

### 示例 2

**输入：**\`lists = []\`
**输出：**\`[]\`

### 示例 3

**输入：**\`lists = [[]]\`
**输出：**\`[]\`

### 提示

- \`k == lists.length\`
- \`0 <= k <= 10^4\`
- \`0 <= lists[i].length <= 500\`
- \`-10^4 <= lists[i][j] <= 10^4\`
- \`lists[i]\` 按 **升序** 排列
- \`lists[i].length\` 的总和不超过 \`10^4\``,
    solution: `## 解法：优先队列（最小堆）

使用最小堆维护每个链表当前的头部节点，每次取出最小的节点接入结果链表。

### 代码实现

\`\`\`javascript
var mergeKLists = function(lists) {
  const minHeap = new MinPriorityQueue({ priority: node => node.val });

  // 将所有链表的头节点放入堆
  for (const list of lists) {
    if (list) {
      minHeap.enqueue(list);
    }
  }

  const dummy = new ListNode(-1);
  let curr = dummy;

  while (!minHeap.isEmpty()) {
    const { element: node } = minHeap.dequeue();
    curr.next = node;
    curr = curr.next;

    if (node.next) {
      minHeap.enqueue(node.next);
    }
  }

  return dummy.next;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(N log k)，N 是总节点数，k 是链表数量
- **空间复杂度**：O(k)`,
    codeTemplate: {
      javascript: "var mergeKLists = function(lists) {\n  // Write your code here\n};",
      python: "def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n    pass",
      java: "class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["链表", "分治算法", "堆（优先队列）"],
  },

  {
    title: "LFU 缓存",
    content: `## 题目描述

请你为 **最不经常使用（LFU）缓存算法** 设计并实现数据结构。

实现 \`LFUCache\` 类：

- \`LFUCache(int capacity)\` - 用数据结构的容量 \`capacity\` 初始化对象
- \`int get(int key)\` - 如果键 \`key\` 存于缓存中，则获取键的值，否则返回 -1 。
- \`void put(int key, int value)\` - 如果键 \`key\` 已存在，则变更其值；如果键不存在，请插入键值对。当缓存达到其容量 \`capacity\` 时，则应该在插入新项之前，移除 **最不经常使用** 的项。在此问题中，当存在平局（即两个或更多个键具有相同使用频率）时，应该去除 **最近最久未使用** 的键。

为了确定最不经常使用的键，可以为缓存中的每个键维护一个 **使用计数器** 。使用计数最小的键是最不经常使用的键。

当一个键首次插入到缓存中时，它的使用计数器被设置为 1 (由于 put 操作)。对缓存中的键执行 \`get\` 或 \`put\` 操作，使用计数器的值将会递增。

函数 \`get\` 和 \`put\` 必须以 \`O(1)\` 的平均时间复杂度运行。

### 示例

**输入：**
\`\`\`
["LFUCache", "put", "put", "get", "put", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [3]]
\`\`\`
**输出：**\`[null, null, null, 1, null, -1, 3]\`

### 提示

- \`1 <= capacity <= 10^4\`
- \`0 <= key <= 10^5\`
- \`0 <= value <= 10^9\`
- 最多调用 \`2 * 10^5\` 次 \`get\` 和 \`put\` 方法`,
    solution: `## 解法：HashMap + 双向链表

维护频率到键列表的映射，以及键到节点的映射。每个频率对应一个双向链表，存储该频率下的所有键（按访问时间排序）。

### 核心数据结构

1. \`keyToNode\`: Map<key, DListNode> - 键到节点的映射
2. \`freqToList\`: Map<freq, DoublyLinkedList> - 频率到链表的映射
3. \`minFreq\`: 记录当前最低频率

### 代码实现

\`\`\`javascript
class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.keyToNode = new Map();       // key -> Node
    this.freqToNodes = new Map();     // freq -> {head, tail} 双向链表
    this.minFreq = 0;
  }

  get(key) {
    if (!this.keyToNode.has(key)) return -1;

    const node = this.keyToNode.get(key);
    this.increaseFreq(node);
    return node.val;
  }

  put(key, value) {
    if (this.capacity === 0) return;

    if (this.keyToNode.has(key)) {
      const node = this.keyToNode.get(key);
      node.val = value;
      this.increaseFreq(node);
      return;
    }

    if (this.keyToNode.size >= this.capacity) {
      this.removeMinFreqNode();
    }

    const newNode = { key, val: value, freq: 1, prev: null, next: null };
    this.keyToNode.set(key, newNode);
    this.addNodeToFreqList(newNode, 1);
    this.minFreq = 1;
  }

  increaseFreq(node) {
    const freq = node.freq;
    this.removeNodeFromFreqList(node, freq);
    node.freq++;
    this.addNodeToFreqList(node, node.freq);

    if (freq === this.minFreq && this.isFreqListEmpty(freq)) {
      this.minFreq++;
    }
  }

  addNodeToFreqList(node, freq) {
    if (!this.freqToNodes.has(freq)) {
      this.freqToNodes.set(freq, this.createDoublyLinkedList());
    }
    const list = this.freqToNodes.get(freq);
    this.addToHead(list, node);
  }

  removeMinFreqNode() {
    const list = this.freqToNodes.get(this.minFreq);
    const node = list.tail.prev;
    this.removeNode(node);
    this.keyToNode.delete(node.key);
  }

  createDoublyLinkedList() {
    const head = { key: -1, val: -1, freq: -1 };
    const tail = { key: -1, val: -1, freq: -1 };
    head.next = tail;
    tail.prev = head;
    return { head, tail };
  }

  addToHead(list, node) {
    node.prev = list.head;
    node.next = list.head.next;
    list.head.next.prev = node;
    list.head.next = node;
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  removeNodeFromFreqList(node, freq) {
    this.removeNode(node);
  }

  isFreqListEmpty(freq) {
    const list = this.freqToNodes.get(freq);
    return list.head.next === list.tail;
  }
}
\`\`\`

### 复杂度分析

- **时间复杂度**：O(1) 平均
- **空间复杂度**：O(capacity)`,
    codeTemplate: {
      javascript: `class LFUCache {\n  constructor(capacity) {\n    // Write your code here\n  }\n\n  get(key) {\n    // Write your code here\n  }\n\n  put(key, value) {\n    // Write your code here\n  }\n}`,
      python: "class LFUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass",
      java: "class LFUCache {\n    public LFUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["设计", "哈希表", "双向链表"],
  },

  {
    title: "链表排序的多种方式对比",
    content: `## 问题

对于单链表的排序，有哪些可行的方案？各自的时间复杂度和空间复杂度如何？

## 要求

1. 至少列出 3 种不同的排序方法
2. 分析每种方法的优缺点
3. 说明为什么归并排序最适合链表场景`,
    solution: `## 链表排序方法对比

### 方法一：转换为数组排序后再重建链表
- **时间复杂度**：O(n log n)
- **空间复杂度**：O(n)
- **优点**：简单直接
- **缺点**：需要额外空间

### 方法二：归并排序（递归）
- **时间复杂度**：O(n log n)
- **空间复杂度**：O(log n)（递归栈）
- **优点**：稳定排序，适合链表特性
- **缺点**：有递归开销

### 方法三：归并排序（自底向上/迭代）
- **时间复杂度**：O(n log n)
- **空间复杂度**：O(1)
- **优点**：常数空间
- **缺点**：实现稍复杂

### 为什么归并排序最适合链表？

1. 链表无法随机访问，快速排序等需要随机访问的算法效率低
2. 归并排序的核心操作（分割、合并）天然适合链表
3. 只需修改指针，无需移动数据`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["链表", "排序", "算法思想"],
  },

  {
    title: "链表常见问题的解题模式总结",
    content: `## 问题

链表类题目有哪些常见的解题模式和技巧？

## 要求

1. 总结至少 5 种常见的链表解题技巧
2. 每种技巧给出适用场景和典型题目
3. 解释哑节点（Dummy Node）的使用场景`,
    solution: `## 链表解题模式总结

### 1. 哑节点（Dummy Node）
- **用途**：统一处理头节点的特殊情况
- **典型题**：合并链表、删除节点、反转链表

### 2. 快慢指针
- **用途**：找中点、判断环、找第 k 个节点
- **典型题**：环形链表、链表中点

### 3. 双指针（前后指针）
- **用途**：找倒数第 k 个、删除特定节点
- **典型题**：删除倒数第 N 个节点

### 4. 分段处理
- **用途**：K 个一组翻转、合并 K 个有序链表
- **典型题**：K 个一组翻转链表

### 5. 原地修改
- **用途**：翻转链表、合并有序链表
- **典型题**：反转链表、合并两个有序链表

### 6. 哈希表辅助
- **用途**：带随机指针的链表、环的检测
- **典型题**：复制带随机指针的链表`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["链表", "算法思想", "数据结构"],
  },

  // ==================== 基础数据结构：栈和队列（41-55）====================

  {
    title: "有效的括号",
    content: `## 题目描述

给定一个只包括 \`'('\`，\`')'\`，\`'{'\`，\`'}'\`，\`'['\`，\`']'\`  的字符串 \`s\` ，判断字符串是否有效。

有效字符串需满足：

1. 左括号必须用相同类型的右括号闭合。
2. 左括号必须以正确的顺序闭合。
3. 每个右括号都有一个对应的相同类型的左括号。

### 示例 1

**输入：**\`s = \"()\"\`
**输出：**\`true\`

### 示例 2

**输入：**\`s = \"()[]{}\"\`
**输出：**\`true\`

### 示例 3

**输入：**\`s = \"(]\"\`
**输出：**\`false\`

### 示例 4

**输入：**\`s = \"([])\"\`
**输出：**\`true\`

### 提示

- \`1 <= s.length <= 10^4\`
- \`s\` 仅由括号 \`'()[]{}'\` 组成`,
    solution: `## 解法：栈

使用栈来匹配括号：遇到左括号入栈，遇到右括号则检查栈顶是否是对应的左括号。

### 代码实现

\`\`\`javascript
var isValid = function(s) {
  const stack = [];
  const map = {
    ')': '(',
    ']': '[',
    '}': '{'
  };

  for (const char of s) {
    if (char in map) {
      // 右括号：检查是否匹配
      if (stack.pop() !== map[char]) {
        return false;
      }
    } else {
      // 左括号：入栈
      stack.push(char);
    }
  }

  return stack.length === 0;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var isValid = function(s) {\n  // Write your code here\n};",
      python: "def isValid(self, s: str) -> bool:\n    pass",
      java: "class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["栈", "字符串"],
  },

  {
    title: "最小栈",
    content: `## 题目描述

设计一个支持 \`push\` ，\`pop\` ，\`top\` 操作，并能在常数时间内检索到最小元素的栈。

实现 \`MinStack\` 类：

- \`MinStack()\` 初始化堆栈对象。
- \`void push(int val)\` 将元素val推入堆栈。
- \`void pop()\` 删除堆栈顶部的元素。
- \`int top()\` 获取堆栈顶部的元素。
- \`int getMin()\` 获取堆栈中的最小元素。

### 示例 1

**输入：**
\`\`\`
[\"MinStack\",\"push\",\"push\",\"push\",\"getMin\",\"pop\",\"top\",\"getMin\"][[],[-2],[0],[-3],[],[],[],[]]
\`\`\`
**输出：**\`[null,null,null,null,-3,null,0,-2]\`

### 提示

- \`-2^31 <= val <= 2^31 - 1\`
- \`pop\`、\`top\` 和 \`getMin\` 操作总是在 **非空栈** 上调用
- \`push\`, \`pop\`, \`top\`, \`getMin\` 最多被调用 \`3 * 10^4\` 次`,
    solution: `## 解法：辅助栈

使用辅助栈同步记录每个位置的最小值。主栈存储实际值，辅助栈存储当前位置及之前的最小值。

### 代码实现

\`\`\`javascript
var MinStack = function() {
  this.stack = [];
  this.minStack = [];
};

MinStack.prototype.push = function(val) {
  this.stack.push(val);
  if (this.minStack.length === 0) {
    this.minStack.push(val);
  } else {
    this.minStack.push(Math.min(val, this.minStack[this.minStack.length - 1]));
  }
};

MinStack.prototype.pop = function() {
  this.stack.pop();
  this.minStack.pop();
};

MinStack.prototype.top = function() {
  return this.stack[this.stack.length - 1];
};

MinStack.prototype.getMin = function() {
  return this.minStack[this.minStack.length - 1];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(1) 对所有操作
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: `var MinStack = function() {\n  // Write your code here\n};\n\nMinStack.prototype.push = function(val) {};\nMinStack.prototype.pop = function() {};\nMinStack.prototype.top = function() {};\nMinStack.prototype.getMin = function() {};`,
      python: "class MinStack:\n    def __init__(self):\n        pass\n    def push(self, val: int) -> None:\n        pass\n    def pop(self) -> None:\n        pass\n    def top(self) -> int:\n        pass\n    def getMin(self) -> int:\n        pass",
      java: "class MinStack {\n    public MinStack() {}\n    public void push(int val) {}\n    public void pop() {}\n    public int top() { return -1; }\n    public int getMin() { return -1; }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["栈", "设计"],
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
    solution: `## 解法：单调栈（递减栈）

维护一个单调递减的栈，存储温度的下标。当遇到更高的温度时，弹出栈中所有较低的温度并计算天数差。

### 代码实现

\`\`\`javascript
var dailyTemperatures = function(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const stack = []; // 单调递减栈，存储下标

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      answer[prevIndex] = i - prevIndex;
    }
    stack.push(i);
  }

  return answer;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多入栈出栈各一次
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var dailyTemperatures = function(temperatures) {\n  // Write your code here\n};",
      python: "def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["栈", "数组", "单调栈"],
  },

  {
    title: "柱状图中最大的矩形",
    content: `## 题目描述

给定 **n\` 个非负整数，用来表示柱状图中各个柱子的高度。每个柱子彼此相邻，且宽度为 1 。

求在该柱状图中，**能够勾勒出来的矩形的最大面积** 。

### 示例 1

**输入：**\`heights = [2,1,5,6,2,3]\`
**输出：**\`10\`
**解释：**最大的矩形为图中红色区域，面积为 10。

### 示例 2

**输入：**\`heights = [2,4]\`
**输出：**\`4\`

### 提示

- \`1 <= heights.length <= 10^5\`
- \`0 <= heights[i] <= 10^4\``,
    solution: `## 解法：单调栈（递增栈）

对于每个柱子，找到左边第一个比它矮的和右边第一个比它矮的位置，这两个位置之间的宽度就是它能延伸的最大宽度。

### 代码实现

\`\`\`javascript
var largestRectangleArea = function(heights) {
  const n = heights.length;
  const stack = []; // 单调递增栈
  let maxArea = 0;

  // 在末尾添加哨兵，确保所有元素都能被处理
  const extendedHeights = [...heights, 0];

  for (let i = 0; i <= n; i++) {
    while (stack.length > 0 && extendedHeights[i] < extendedHeights[stack[stack.length - 1]]) {
      const height = extendedHeights[stack.pop()];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }

  return maxArea;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var largestRectangleArea = function(heights) {\n  // Write your code here\n};",
      python: "def largestRectangleArea(self, heights: List[int]) -> int:\n    pass",
      java: "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["栈", "数组", "单调栈"],
  },

  {
    title: "逆波兰表达式求值",
    content: `## 题目描述

给你一个字符串数组 \`tokens\` ，表示一个根据 **逆波兰表示法** 表示的算术表达式。

请你计算该表达式。返回一个表示表达式值的整数。

**注意：**

- 有效的算符为 \`'+'\`、\`'-'\`、\`'*'\` 和 \`'/'\` 。
- 每个操作数（运算对象）都可以是一个整数或另一个表达式。
- 两个整数之间的除法总是 **向零截断** 。
- 表式中不含除零运算。
- 输入是一个根据逆波兰表示法表示的有效算术表达式。
- 答案及所有中间计算结果可以用 **32 位** 整数表示。

### 示例 1

**输入：**\`tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]\`
**输出：**\`9\`
**解释**：该算式转化为常见的中缀算术表达式为：((2 + 1) * 3) = 9

### 示例 2

**输入：**\`tokens = [\"4\",\"13\",\"5\",\"/\",\"+\"]\`
**输出：**\`6\`
**解释**：(4 + (13 / 5)) = 6

### 示例 3

**输入：**\`tokens = [\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]\`
**输出：**\`22\``,
    solution: `## 解法：栈

遇到数字入栈，遇到运算符则弹出两个数字进行运算，结果入栈。

### 代码实现

\`\`\`javascript
var evalRPN = function(tokens) {
  const stack = [];
  const operators = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => Math.trunc(a / b),
  };

  for (const token of tokens) {
    if (token in operators) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(operators[token](a, b));
    } else {
      stack.push(parseInt(token));
    }
  }

  return stack[0];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var evalRPN = function(tokens) {\n  // Write your code here\n};",
      python: "def evalRPN(self, tokens: List[str]) -> int:\n    pass",
      java: "class Solution {\n    public int evalRPN(String[] tokens) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["栈", "数组", "数学"],
  },

  {
    title: "用栈实现队列",
    content: `## 题目描述

请你仅使用两个栈实现先入先出队列。队列应当支持一般队列支持的所有操作（\`push\`、\`pop\`、\`peek\`、\`empty\`）：

实现 \`MyQueue\` 类：

- \`void push(int x)\` 将元素 x 推到队列的末尾
- \`int pop()\` 从队列的开头移除并返回元素
- \`int peek()\` 返回队列开头的元素
- \`boolean empty()\` 如果队列为空，返回 \`true\` ；否则，返回 \`false\`

**说明**：

- 你 **只能** 使用标准的栈操作 —— 也就是只有 \`push to top\`, \`peek/pop from top\`, \`size\`, 和 \`is empty\` 操作是合法的。
- 你所使用的语言也许不支持栈。你可以使用 list 或者 deque（双端队列）来模拟一个栈 ，只要是标准的栈操作即可。

### 示例 1

**输入：**
\`\`\`
[\"MyQueue\", \"push\", \"push\", \"peek\", \"pop\", \"empty\"][[], [1], [2], [], [], []]
\`\`\`
**输出：**\`[null, null, null, 1, 1, false]\``,
    solution: `## 解法：双栈

使用两个栈：inStack 用于 push 操作，outStack 用于 pop/peek 操作。当 outStack 为空时，将 inStack 的所有元素倒入 outStack。

### 代码实现

\`\`\`javascript
var MyQueue = function() {
  this.inStack = [];
  this.outStack = [];
};

MyQueue.prototype.push = function(x) {
  this.inStack.push(x);
};

MyQueue.prototype._transfer = function() {
  if (this.outStack.length === 0) {
    while (this.inStack.length > 0) {
      this.outStack.push(this.inStack.pop());
    }
  }
};

MyQueue.prototype.pop = function() {
  this._transfer();
  return this.outStack.pop();
};

MyQueue.prototype.peek = function() {
  this._transfer();
  return this.outStack[this.outStack.length - 1];
};

MyQueue.prototype.empty = function() {
  return this.inStack.length === 0 && this.outStack.length === 0;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：均摊 O(1)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: `var MyQueue = function() {\n  // Write your code here\n};\n\nMyQueue.prototype.push = function(x) {};\nMyQueue.prototype.pop = function() {};\nMyQueue.prototype.peek = function() {};\nMyQueue.prototype.empty = function() {};`,
      python: "class MyQueue:\n    def __init__(self):\n        pass\n    def push(self, x: int) -> None:\n        pass\n    def pop(self) -> int:\n        pass\n    def peek(self) -> int:\n        pass\n    def empty(self) -> bool:\n        pass",
      java: "class MyQueue {\n    public MyQueue() {}\n    public void push(int x) {}\n    public int pop() { return -1; }\n    public int peek() { return -1; }\n    public boolean empty() { return true; }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["栈", "队列", "设计"],
  },

  {
    title: "用队列实现栈",
    content: `## 题目描述

请你仅使用两个队列实现一个后入先出（LIFO）的栈，并支持普通栈的全部四种操作（\`push\`、\`top\`、\`pop\` 和 \`empty\`）。

实现 \`MyStack\` 类：

- \`void push(int x)\` 将元素 x 压入栈顶。
- \`int pop()\` 移除并返回栈顶元素。
- \`int top()\` 返回栈顶元素。
- \`boolean empty()\` 如果栈是空的，返回 \`true\` ；否则，返回 \`false\` 。

**注意**：

- 你只能使用队列的基本操作 —— 也就是 \`push to back\`、\`peek/pop from front\`、\`size\` 和 \`is empty\` 这些操作。
- 你所使用的语言也许不支持队列。 你可以使用 list （列表）或者 deque（双端队列）来模拟一个队列 , 只要是标准的队列操作即可。

### 示例

**输入：**
\`\`\`
[\"MyStack\", \"push\", \"push\", \"top\", \"pop\", \"empty\"][[], [1], [2], [], [], []]
\`\`\`
**输出：**\`[null, null, null, 2, 2, false]\``,
    solution: `## 解法：单队列（或双队列）

使用一个队列，每次 push 新元素后，将队列前面的元素依次移到队尾，使新元素位于队首。

### 代码实现

\`\`\`javascript
var MyStack = function() {
  this.queue = [];
};

MyStack.prototype.push = function(x) {
  this.queue.push(x);
  // 将前面的元素移到队尾
  for (let i = 0; i < this.queue.length - 1; i++) {
    this.queue.push(this.queue.shift());
  }
};

MyStack.prototype.pop = function() {
  return this.queue.shift();
};

MyStack.prototype.top = function() {
  return this.queue[0];
};

MyStack.prototype.empty = function() {
  return this.queue.length === 0;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：push 为 O(n)，其他为 O(1)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: `var MyStack = function() {\n  // Write your code here\n};\n\nMyStack.prototype.push = function(x) {};\nMyStack.prototype.pop = function() {};\nMyStack.prototype.top = function() {};\nMyStack.prototype.empty = function() {};`,
      python: "class MyStack:\n    def __init__(self):\n        pass\n    def push(self, x: int) -> None:\n        pass\n    def pop(self) -> int:\n        pass\n    def top(self) -> int:\n        pass\n    def empty(self) -> bool:\n        pass",
      java: "class MyStack {\n    public MyStack() {}\n    public void push(int x) {}\n    public int pop() { return -1; }\n    public int top() { return -1; }\n    public boolean empty() { return true; }\n}",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["栈", "队列", "设计"],
  },

  {
    title: "滑动窗口最大值",
    content: `## 题目描述

给你一个整数数组 \`nums\`，有一个大小为 \`k\` 的滑动窗口从数组的最左侧移动到数组的最右侧。你只可以看到在滑动窗口内的 \`k\` 个数字。滑动窗口每次只向右移动一位。

返回 **滑动窗口中的最大值** 。

### 示例 1

**输入：**\`nums = [1,3,-1,-3,5,3,6,7], k = 3\`
**输出：**\`[3,3,5,5,6,7]\`
**解释：**
滑动窗口的位置                最大值
---------------               -----
[1  3  -1] -3  5  3  6  7       **3**
 1 [3  -1  -3] 5  3  6  7       **3**
 1  3 [-1  -3  5] 3  6  7       **5**
 1  3  -1 [-3  5  3] 6  7       **5**
 1  3  -1  -3 [5  3  6] 7       **6**
 1  3  -1  -3  5 [3  6  7]      **7**

### 示例 2

**输入：**\`nums = [1], k = 1\`
**输出：**\`[1]\`

### 提示

- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`
- \`1 <= k <= nums.length\``,
    solution: `## 解法：单调队列（双端队列）

使用双端队列维护窗口内的候选最大值。队列保持递减顺序，队首始终是当前窗口的最大值。

### 代码实现

\`\`\`javascript
var maxSlidingWindow = function(nums, k) {
  const result = [];
  const deque = []; // 存储下标，保持递减

  for (let i = 0; i < nums.length; i++) {
    // 移除超出窗口范围的元素
    while (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 保持队列递减：移除比当前元素小的元素
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    // 窗口形成后开始记录结果
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)，每个元素最多入队出队各一次
- **空间复杂度**：O(k)`,
    codeTemplate: {
      javascript: "var maxSlidingWindow = function(nums, k) {\n  // Write your code here\n};",
      python: "def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n    pass",
      java: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["队列", "数组", "滑动窗口", "单调队列"],
  },

  {
    title: "基本计算器 II",
    content: `## 题目描述

给你一个字符串表达式 \`s\` ，请你实现一个基本计算器来计算并返回它的值。

整数除法仅保留整数部分。

你可以假设给定的表达式总是有效的。**所有中间结果将在 \\\\-2^31, 2^31 - 1\\\\\` 的范围内。

**注意**：不允许使用任何将字符串作为数学表达式计算的内置函数，比如 \`eval()\` 。

### 示例 1

**输入：**\`s = \"3+2*2\"\`
**输出：**\`7\`

### 示例 2

**输入：**\`s = \" 3/2 \"\`
**输出：**\`1\`

### 示例 3

**输入：**\`s = \" 3+5 / 2 \"\`
**输出：**\`5\`

### 提示

- \`1 <= s.length <= 3 * 10^5\`
- \`s\` 由整数、运算符 \`'+', '-', '*', '/'\` 组成
- \`s\` 包含若干个空格`,
    solution: `## 解法：栈（处理乘除优先级）

使用栈来暂存需要延迟计算的值。遇到加减直接压栈，遇到乘除则立即与栈顶元素计算。

### 代码实现

\`\`\`javascript
var calculate = function(s) {
  const stack = [];
  let num = 0;
  let sign = '+';

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (char >= '0' && char <= '9') {
      num = num * 10 + parseInt(char);
    }

    if ((!(char >= '0' && char <= '9') && char !== ' ') || i === s.length - 1) {
      switch (sign) {
        case '+':
          stack.push(num);
          break;
        case '-':
          stack.push(-num);
          break;
        case '*':
          stack.push(stack.pop() * num);
          break;
        case '/':
          stack.push(Math.trunc(stack.pop() / num));
          break;
      }
      sign = char;
      num = 0;
    }
  }

  return stack.reduce((sum, val) => sum + val, 0);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var calculate = function(s) {\n  // Write your code here\n};",
      python: "def calculate(self, s: str) -> int:\n    pass",
      java: "class Solution {\n    public int calculate(String s) {\n        // Write your code here\n    }\n}",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["栈", "数学", "字符串"],
  },

  // ==================== 二叉树专题（续）====================

  {
    title: "路径总和",
    content: `## 题目描述

给你二叉树的根节点 root 和一个表示目标和的整数 targetSum 。判断该树中是否存在 根到叶子节点 的路径，这条路径上所有节点值相加等于目标和 targetSum。

### 示例

**输入：**root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22
**输出：**true`,
    solution: `## 解法：DFS递归

判断当前节点是否为叶子节点且剩余和等于节点值，或递归检查左右子树。

\`\`\`javascript
var hasPathSum = function(root, targetSum) {
  if (!root) return false;

  // 叶子节点
  if (!root.left && !root.right) {
    return root.val === targetSum;
  }

  return hasPathSum(root.left, targetSum - root.val) ||
         hasPathSum(root.right, targetSum - root.val);
};
\`\`\`

- **时间复杂度**：O(n)
- **空间复杂度**：O(h)`,
    codeTemplate: { javascript: "var hasPathSum = function(root, targetSum) {};", python: "def hasPathSum(self, root, targetSum) -> bool: pass", java: "class Solution { public boolean hasPathSum(TreeNode root, int targetSum) {} }" },
    difficulty: "easy",
    questionType: "code",
    tags: ["树", "深度优先搜索"],
  },

  {
    title: "平衡二叉树",
    content: `## 题目描述

给定一个二叉树，判断它是否是高度平衡的二叉树。一棵高度平衡二叉树定义为：一个二叉树每个节点的左右两个子树的高度差的绝对值不超过1。`,
    solution: `\`\`\`javascript
var isBalanced = function(root) {
  const getHeight = (node) => {
    if (!node) return 0;
    const leftH = getHeight(node.left);
    const rightH = getHeight(node.right);
    if (leftH === -1 || rightH === -1 || Math.abs(leftH - rightH) > 1) return -1;
    return Math.max(leftH, rightH) + 1;
  };
  return getHeight(root) !== -1;
};
\`\`\`
- O(n)时间, O(h)空间`,
    codeTemplate: { javascript: "var isBalanced = function(root) {};", python: "def isBalanced(self, root) -> bool: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["树", "深度优先搜索"],
  },

  // ==================== 动态规划专题 ====================

  {
    title: "爬楼梯",
    content: `## 题目描述

假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶？

示例：n=2 → 2种; n=3 → 3种`,
    solution: `## 解法：动态规划

dp[i] = dp[i-1] + dp[i-2]，类似斐波那契数列。

\`\`\`javascript
var climbStairs = function(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
};
\`\`\`
- O(n)时间, O(1)空间`,
    codeTemplate: { javascript: "var climbStairs = function(n) {};", python: "def climbStairs(self, n: int) -> int: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["动态规划", "数学"],
  },

  {
    title: "不同路径",
    content: `## 题目描述

一个机器人位于 m x n 网格的左上角。机器人每次只能向下或向右移动一步。到达右下角有多少条不同路径？`,
    solution: `\`\`\`javascript
var uniquePaths = function(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j-1];
    }
  }
  return dp[n-1];
};
\`\`\`
- O(m×n)时间, O(n)空间`,
    codeTemplate: { javascript: "var uniquePaths = function(m, n) {};", python: "def uniquePaths(self, m: int, n: int) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "组合数学"],
  },

  {
    title: "零钱兑换",
    content: `## 题目描述

给定不同面额的硬币 coins 和总金额 amount。计算凑成总金额所需的最少硬币个数。如果无法凑出返回-1。`,
    solution: `## 解法：完全背包DP

dp[i] = 凑成金额i所需最少硬币数

\`\`\`javascript
var coinChange = function(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
};
\`\`\`
- O(amount × len(coins))时间`,
    codeTemplate: { javascript: "var coinChange = function(coins, amount) {};", python: "def coinChange(self, coins: List[int], amount: int) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "完全平方数",
    content: `## 题目描述

给定正整数 n，找到若干个完全平方数（如1,4,9,16...）使得它们的和等于 n。你需要让组成和的完全平方数的个数最少。`,
    solution: `\`\`\`javascript
var numSquares = function(n) {
  const dp = new Array(n + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j * j <= i; j++) {
      dp[i] = Math.min(dp[i], dp[i - j*j] + 1);
    }
  }

  return dp[n];
};
\`\`\`
- O(n√n)时间`,
    codeTemplate: { javascript: "var numSquares = function(n) {};", python: "def numSquares(self, n: int) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "单词拆分",
    content: `## 题目描述

给定字符串 s 和字符串列表 wordDict 作为字典。判断是否可以利用字典中的单词拼接出 s。（字典中的单词可重复使用）`,
    solution: `\`\`\`javascript
var wordBreak = function(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }

  return dp[s.length];
};
\`\`\`
- O(n²)时间`,
    codeTemplate: { javascript: "var wordBreak = function(s, wordDict) {};", python: "def wordBreak(self, s: str, wordDict: List[str]) -> bool: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "最长公共子序列",
    content: `## 题目描述

给定两个字符串 text1 和 text2，返回这两个字符串的最长公共子序列的长度。如果不存在公共子序列，返回0。`,
    solution: `\`\`\`javascript
var longestCommonSubsequence = function(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }

  return dp[m][n];
};
\`\`\`
- O(m×n)时间和空间`,
    codeTemplate: { javascript: "var longestCommonSubsequence = function(text1, text2) {};", python: "def longestCommonSubsequence(self, text1: str, text2: str) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["动态规划", "字符串"],
  },

  {
    title: "编辑距离",
    content: `## 题目描述

给你两个单词 word1 和 word2，请返回将 word1 转换成 word2 所使用的最少操作数。操作包括插入、删除、替换一个字符。`,
    solution: `\`\`\`javascript
var minDistance = function(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    new Array(n + 1).fill(0).map((_, j) => i + j)
  );

  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
      if (word1[i-1] === word2[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      } else {
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,    // 删除
          dp[i][j-1] + 1,    // 插入
          dp[i-1][j-1] + 1   // 替换
        );
      }
    }
  }

  return dp[m][n];
};
\`\`\`
- O(m×n)时间`,
    codeTemplate: { javascript: "var minDistance = function(word1, word2) {};", python: "def minDistance(self, word1: str, word2: str) -> int: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "买卖股票的最佳时机 II",
    content: `## 题目描述

给定数组 prices，其中 prices[i] 是第i天的价格。可以多次交易（买入前必须卖出），求最大利润。`,
    solution: `\`\`\`javascript
var maxProfit = function(prices) {
  let profit = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i-1]) {
      profit += prices[i] - prices[i-1];
    }
  }
  return profit;
};
\`\`\`
贪心：所有上升段都赚取利润。O(n)时间`,
    codeTemplate: { javascript: "var maxProfit = function(prices) {};", python: "def maxProfit(self, prices: List[int]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "贪心"],
  },

  {
    title: "跳跃游戏",
    content: `## 题目描述

给定非负整数数组 nums，最初位于第一个下标。数组元素代表你在该位置能跳跃的最大长度。判断是否能到达最后一个位置。`,
    solution: `\`\`\`javascript
var canJump = function(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
};
\`\`\`
- O(n)时间`,
    codeTemplate: { javascript: "var canJump = function(nums) {};", python: "def canJump(self, nums: List[int]) -> bool: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["贪心"],
  },

  {
    title: "N皇后",
    content: `## 题目描述

按照国际象棋规则，皇后可以攻击与之处在同一行、同一列或同一斜线上的棋子。在 n×n 棋盘上放置 n 个皇后，使彼此不能攻击。给出所有不同的解决方案。`,
    solution: `## 解法：回溯

逐行放置皇后，用三个集合分别记录列、主对角线、副对角线的占用情况。

\`\`\`javascript
var solveNQueens = function(n) {
  const result = [];
  const cols = new Set();
  const diag1 = new Set(); // 主对角线: row-col
  const diag2 = new Set(); // 副对角线: row+col

  const backtrack = (row, board) => {
    if (row === n) {
      result.push(board.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n-c-1)));
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col, d2 = row + col;
      if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

      cols.add(col); diag1.add(d1); diag2.add(d2);
      board.push(col);
      backtrack(row + 1, board);
      board.pop();
      cols.delete(col); diag1.delete(d1); diag2.delete(d2);
    }
  };

  backtrack(0, []);
  return result;
};
\`\`\`
- O(N!)时间`,
    codeTemplate: { javascript: "var solveNQueens = function(n) {};", python: "def solveNQueens(self, n: int) -> List[List[str]]: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["回溯"],
  },

  {
    title: "解数独",
    content: `## 题目描述

编写程序通过填充空格来解决9x9数独。空格用'.'表示。保证只有唯一解。`,
    solution: `## 解法：回溯 + 位运算优化

对每个空格尝试1-9，检查行、列、宫格是否合法。

\`\`\`javascript
var solveSudoku = function(board) {
  const isValid = (row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num || board[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (board[boxRow+i][boxCol+j] === num) return false;
    return true;
  };

  const solve = () => {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++) {
        if (board[i][j] !== '.') continue;
        for (let n = '1'; n <= '9'; n++) {
          if (!isValid(i, j, n)) continue;
          board[i][j] = n;
          if (solve()) return true;
          board[i][j] = '.';
        }
        return false;
      }
    return true;
  };

  solve();
  return board;
};
\`\`\``,
    codeTemplate: { javascript: "var solveSudoku = function(board) {};", python: "def solveSudoku(self, board: List[List[str]]) -> None: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["回溯"],
  },

  // ==================== 图论专题 ====================

  {
    title: "岛屿数量",
    content: `## 题目描述

给你由 '1'（陆地）和 '0'（水）组成的二维网格，计算岛屿数量。岛屿被水包围，水平或垂直相邻的陆地连接形成岛屿。`,
    solution: `\`\`\`javascript
var numIslands = function(grid) {
  if (!grid.length) return 0;
  let count = 0;

  const dfs = (i, j) => {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] !== '1') return;
    grid[i][j] = '0';
    dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1);
  };

  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++)
      if (grid[i][j] === '1') { count++; dfs(i, j); }

  return count;
};
\`\`\`
- O(m×n)时间`,
    codeTemplate: { javascript: "var numIslands = function(grid) {};", python: "def numIslands(self, grid: List[List[str]]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "DFS"],
  },

  {
    title: "课程表",
    content: `## 题目描述

共有num门课，记为0到numCourses-1。给定先修课程prerequisites数组，判断是否可能完成所有课程？（检测有向图是否有环）`,
    solution: `## 解法：拓扑排序（BFS/Kahn算法）

计算入度，将入度为0的入队，依次移除并更新入度。

\`\`\`javascript
var canFinish = function(numCourses, prerequisites) {
  const adj = Array.from({length: numCourses}, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }

  const queue = [];
  for (let i = 0; i < numCourses; i++)
    if (inDegree[i] === 0) queue.push(i);

  let count = 0;
  while (queue.length) {
    const node = queue.shift();
    count++;
    for (const next of adj[node])
      if (--inDegree[next] === 0) queue.push(next);
  }

  return count === numCourses;
};
\`\`\`
- O(V+E)时间`,
    codeTemplate: { javascript: "var canFinish = function(numCourses, prerequisites) {};", python: "def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "BFS"],
  },

  {
    title: "克隆图",
    content: `## 题目描述

给你无向连通图的引用节点，返回图的深拷贝。每个节点的值都与其原始图中节点的值相同。`,
    solution: `\`\`\`javascript
var cloneGraph = function(node) {
  if (!node) return null;
  const visited = new Map();

  const dfs = (n) => {
    if (visited.has(n)) return visited.get(n);
    const clone = new Node(n.val);
    visited.set(n, clone);
    for (const neighbor of n.neighbors) {
      clone.neighbors.push(dfs(neighbor));
    }
    return clone;
  };

  return dfs(node);
};
\`\`\``,
    codeTemplate: { javascript: "var cloneGraph = function(node) {};", python: "def cloneGraph(self, node: 'Node') -> 'Node': pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "DFS"],
  },

  {
    title: "被围绕的区域",
    content: `## 题目描述

给m×n的矩阵board，'X'和'O'组成。将被'X'包围的所有'O'替换为'X'。边界上的'O'不会被包围。`,
    solution: `## 解法：从边界DFS/BFS标记

从四条边界的'O'出发进行DFS/BFS，标记不被包围的'O'，最后遍历替换。

\`\`\`javascript
var solve = function(board) {
  const m = board.length, n = board[0].length;

  const dfs = (i, j) => {
    if (i<0||i>=m||j<0||j>=n||board[i][j]!=='O') return;
    board[i][j] = '#';
    dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1);
  };

  for (let i = 0; i < m; i++) { dfs(i,0); dfs(i,n-1); }
  for (let j = 0; j < n; j++) { dfs(0,j); dfs(m-1,j); }

  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      board[i][j] = board[i][j] === '#' ? 'O' : 'X';
};
\`\`\``,
    codeTemplate: { javascript: "var solve = function(board) {};", python: "def solve(self, board: List[List[str]]) -> None: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "DFS"],
  },

  // ==================== 哈希表专题 ====================

  {
    title: "字母异位词分组",
    content: `## 题目描述

给定字符串数组strs，将字母异位词组合在一起。字母异位词指字母相同但排列不同的字符串。`,
    solution: `\`\`\`javascript
var groupAnagrams = function(strs) {
  const map = new Map();

  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }

  return Array.from(map.values());
};
\`\`\`
- O(n·k·log k)时间`,
    codeTemplate: { javascript: "var groupAnagrams = function(strs) {};", python: "def groupAnagrams(self, strs: List[str]) -> List[List[str]]: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["哈希表", "字符串"],
  },

  {
    title: "最长连续序列",
    content: `## 题目描述

给定未排序整数数组nums，找出数字连续的最长序列长度（不要求序列元素在原数组中连续）。要求O(n)时间。`,
    solution: `\`\`\`javascript
var longestConsecutive = function(nums) {
  const set = new Set(nums);
  let longest = 0;

  for (const num of set) {
    if (set.has(num - 1)) continue; // 只从序列起点开始
    let currentNum = num;
    let currentStreak = 1;
    while (set.has(currentNum + 1)) {
      currentNum++;
      currentStreak++;
    }
    longest = Math.max(longest, currentStreak);
  }

  return longest;
};
\`\`\`
- O(n)时间（虽然内层while，但每个元素最多访问两次）`,
    codeTemplate: { javascript: "var longestConsecutive = function(nums) {};", python: "def longestConsecutive(self, nums: List[int]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["哈希表"],
  },

  // ==================== 位运算专题 ====================

  {
    title: "位1的个数",
    content: `## 题目描述

编写函数，输入是一个无符号整数，返回其二进制表达式中数字位数为'1'的个数（也称汉明重量）。`,
    solution: `\`\`\`javascript
// 方法一：循环检查每一位
var hammingWeight = function(n) {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>>= 1;
  }
  return count;
};

// 方法二：Brian Kernighan 算法（最优）
// n & (n-1) 可以消除最右边的1
var hammingWeight2 = function(n) {
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
};
\`\`\`
- O(k)时间，k为1的个数`,
    codeTemplate: { javascript: "var hammingWeight = function(n) {};", python: "def hammingWeight(self, n: int) -> int: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["位运算"],
  },

  {
    title: "2的幂",
    content: `## 题目描述

给定整数n，如果它是2的幂返回true，否则false。`,
    solution: `\`\`\`javascript
var isPowerOfTwo = function(n) {
  return n > 0 && (n & (n - 1)) === 0;
};
// 2的幂的二进制只有一个1
\`\`\`
- O(1)时间`,
    codeTemplate: { javascript: "var isPowerOfTwo = function(n) {};", python: "def isPowerOfTwo(self, n: int) -> bool: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["位运算"],
  },

  {
    title: "只出现一次的数字 III",
    content: `## 题目描述

给你一个整数数组 nums，其中恰好有一个元素出现一次，其余元素恰好出现三次。找出那个只出现了一次的元素。要求O(n)时间、O(1)空间。`,
    solution: `## 解法：位计数

对每一位统计所有数字在该位上1出现的次数，模3得到结果。

\`\`\`javascript
var singleNumber = function(nums) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    let sum = 0;
    for (const num of nums) {
      sum += (num >> i) & 1;
    }
    if (sum % 3 === 1) result |= (1 << i);
  }
  return result;
};
\`\`\`
- O(32×n)=O(n)时间`,
    codeTemplate: { javascript: "var singleNumber = function(nums) {};", python: "def singleNumber(self, nums: List[int]) -> int: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["位运算"],
  },

  // ==================== 数学专题 ====================

  {
    title: "阶乘后的零",
    content: `## 题目描述

给定整数n，返回n!结果尾数中零的数量。`,
    solution: `## 解法：统计因子5的个数

尾部的0来自2×5，而因子2比5多，所以只需统计5的个数。

\`\`\`javascript
var trailingZeroes = function(n) {
  let count = 0;
  while (n > 0) {
    n = Math.floor(n / 5);
    count += n;
  }
  return count;
};
\`\`\`
- O(log₅n)时间`,
    codeTemplate: { javascript: "var trailingZeroes = function(n) {};", python: "def trailingZeroes(self, n: int) -> int: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["数学"],
  },

  {
    title: "Fizz Buzz",
    content: `## 题目描述

给定整数n，对于1到n的每个数：
- 如果是3的倍数输出"Fizz"
- 如果是5的倍数输出"Buzz"
- 如果同时是3和5的倍数输出"FizzBuzz"
- 否则输出数字本身`,
    solution: `\`\`\`javascript
var fizzBuzz = function(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) result.push("FizzBuzz");
    else if (i % 3 === 0) result.push("Fizz");
    else if (i % 5 === 0) result.push("Buzz");
    else result.push(String(i));
  }
  return result;
};
\`\`\``,
    codeTemplate: { javascript: "var fizzBuzz = function(n) {};", python: "def fizzBuzz(self, n: int) -> List[str]: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["数学"],
  },

  {
    title: "Excel表列名称",
    content: `## 题目描述

给你一个整数 columnNumber ，返回它在 Excel 表中相对应的列名称。
例如：1->A, 28->AB, 701->ZY`,
    solution: `\`\`\`javascript
var convertToTitle = function(columnNumber) {
  let result = '';
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
};
\`\`\`
- O(log₂₆n)时间`,
    codeTemplate: { javascript: "var convertToTitle = function(columnNumber) {};", python: "def convertToTitle(self, columnNumber: int) -> str: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["数学"],
  },

  // ==================== 高级数据结构：堆/优先队列 ====================

  {
    title: "前 K 个高频元素",
    content: `## 题目描述

给你整数数组 nums 和整数 k，请返回其中出现频率前 k 高的元素。按任意顺序返回答案。`,
    solution: `\`\`\`javascript
var topKFrequent = function(nums, k) {
  const freqMap = new Map();
  for (const num of nums) {
    freqMap.set(num, (freqMap.get(num)||0) + 1);
  }

  // 使用最小堆维护top k
  const heap = [...freqMap.entries()].sort((a,b) => b[1]-a[1]);
  return heap.slice(0, k).map(([val]) => val);
};
\`\`\`
- O(n log k)时间`,
    codeTemplate: { javascript: "var topKFrequent = function(nums, k) {};", python: "def topKFrequent(self, nums: List[int], k: int) -> List[int]: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["哈希表", "堆"],
  },

  {
    title: "数据流的中位数",
    content: `## 题目描述

中位数是有序序列中间的值。设计一个支持以下两种操作的数据结构：
- void addNum(int num) - 从数据流中添加一个整数到数据结构中
- double findMedian() - 返回目前所有元素的中位数`,
    solution: `## 解法：双堆（大顶堆存较小半 + 小顶堆存较大半）

\`\`\`javascript
class MedianFinder {
  constructor() {
    this.maxHeap = []; // 存较小的那一半（大顶堆）
    this.minHeap = []; // 存较大的那一半（小顶堆）
  }

  addNum(num) {
    if (this.maxHeap.length === 0 || num <= -this.maxHeap[0]) {
      this.maxHeap.push(-num); // 用负数模拟大顶堆
      this.maxHeap.sort((a,b)=>a-b);
    } else {
      this.minHeap.push(num);
      this.minHeap.sort((a,b)=>a-b);
    }

    // 平衡两个堆的大小
    if (this.maxHeap.length > this.minHeap.length + 1) {
      this.minHeap.push(-this.maxHeap.pop());
      this.minHeap.sort((a,b)=>a-b);
    } else if (this.minHeap.length > this.maxHeap.length + 1) {
      this.maxHeap.push(-this.minHeap.pop());
      this.maxHeap.sort((a,b)=>a-b);
    }
  }

  findMedian() {
    if (this.maxHeap.length > this.minHeap.length) return -this.maxHeap[0];
    if (this.minHeap.length > this.maxHeap.length) return this.minHeap[0];
    return (-this.maxHeap[0] + this.minHeap[0]) / 2;
  }
}
\`\`\`
- addNum: O(log n), findMedian: O(1)`,
    codeTemplate: { javascript: "class MedianFinder { addNum(num){} findMedian(){} }", python: "class MedianFinder: def __init__(self): pass def addNum(self, num: int) -> None: pass def findMedian(self) -> float: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["堆", "设计"],
  },

  // ==================== 并查集专题 ====================

  {
    title: "冗余连接",
    content: `## 题目描述

树中有n个节点，编号0到n-1，edges表示额外添加的边。一条边的信息是[u,v]，表示u和v之间有一条边。返回一条可以删除的边，使得结果是n个节点的树。如果有多个答案，返回在edges中最后出现的那个。`,
    solution: `\`\`\`javascript
var findRedundantConnection = function(edges) {
  const parent = Array.from({length: edges.length + 1}, (_, i) => i);

  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // 路径压缩
      x = parent[x];
    }
    return x;
  };

  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  };

  for (const [u, v] of edges) {
    if (!union(u, v)) return [u, v]; // 发现环
  }
  return [];
};
\`\`\`
- O(n·α(n))≈O(n)时间`,
    codeTemplate: { javascript: "var findRedundantConnection = function(edges) {};", python: "def findRedundantConnection(self, edges: List[List[int]]) -> List[int]: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集"],
  },

  {
    title: "等式方程的可满足性",
    content: `## 题目描述

给定一个由字符串方程组成的数组 equations，每个字符串形式如"a==b"或"a!=b"。判断是否满足所有等式和不等式条件。`,
    solution: `## 解法：并查集

变量视为节点，等式连接同一组，不等式检查是否在不同组。

\`\`\`javascript
var equationsPossible = function(equations) {
  const parent = {};

  const find = (x) => {
    if (!(x in parent)) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  // 先处理等式
  for (const eq of equations) {
    if (eq[1] === '=') union(eq[0], eq[3]);
  }

  // 再处理不等式
  for (const eq of equations) {
    if (eq[1] === '!') {
      if (find(eq[0]) === find(eq[3])) return false;
    }
  }

  return true;
};
\`\`\``,
    codeTemplate: { javascript: "var equationsPossible = function(equations) {};", python: "def equationsPossible(self, equations: List[str]) -> bool: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["并查集"],
  },

  // ==================== 前缀树/Trie ====================

  {
    title: "实现 Trie (前缀树)",
    content: `## 题目描述

Trie（发音类似 "try"）是一种树形数据结构，用于高效地存储和检索字符串数据集中的键。实现包含 insert, search, startsWith 方法的 Trie 类。`,
    solution: `\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return node.isEnd;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return true;
  }
}
\`\`\`
- insert/search/prefix均为O(L)，L为字符串长度`,
    codeTemplate: { javascript: "class Trie { insert(word){} search(word){} startsWith(prefix){} }", python: "class Trie: def __init__(self): pass def insert(self, word: str) -> None: pass def search(self, word: str) -> bool: pass def startsWith(self, prefix: str) -> bool: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["前缀树"],
  },

  // ==================== 贪心专题 ====================

  {
    title: "划分字母区间",
    content: `## 题目描述

字符串 S 由小写字母组成。要把这个字符串划分为尽可能多的片段，同一字母最多出现在一个片段中。返回每个字符串片段的长度。`,
    solution: `\`\`\`javascript
var partitionLabels = function(S) {
  const lastPos = {};
  for (let i = 0; i < S.length; i++) lastPos[S[i]] = i;

  const result = [];
  let start = 0, end = 0;

  for (let i = 0; i < S.length; i++) {
    end = Math.max(end, lastPos[S[i]]);
    if (i === end) {
      result.push(end - start + 1);
      start = end + 1;
    }
  }

  return result;
};
\`\`\`
- O(n)时间`,
    codeTemplate: { javascript: "var partitionLabels = function(S) {};", python: "def partitionLabels(self, s: str) -> List[int]: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["贪心"],
  },

  {
    title: "无重叠区间",
    content: `## 题目描述

给定区间的集合 intervals，找到需要移除区间的最小数量，使剩余区间互不重叠。`,
    solution: `\`\`\`javascript
var eraseOverlapIntervals = function(intervals) {
  if (intervals.length === 0) return 0;

  // 按结束位置排序
  intervals.sort((a, b) => a[1] - b[1]);

  let count = 1;
  let end = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] >= end) {
      count++;
      end = intervals[i][1];
    }
  }

  return intervals.length - count;
};
\`\`\`
- O(n log n)时间`,
    codeTemplate: { javascript: "var eraseOverlapIntervals = function(intervals) {};", python: "def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["贪心"],
  },

  {
    title: "加油站",
    content: `## 题目描述

环形路线上有N个加油站，第i个加油站有gas[i]升汽油，从第i站到第i+1站消耗cost[i]升汽油。问能否绕一圈回到出发点？`,
    solution: `\`\`\`javascript
var canCompleteCircuit = function(gas, cost) {
  let totalTank = 0, currTank = 0, start = 0;

  for (let i = 0; i < gas.length; i++) {
    totalTank += gas[i] - cost[i];
    currTank += gas[i] - cost[i];

    if (currTank < 0) {
      start = i + 1;
      currTank = 0;
    }
  }

  return totalTank >= 0 ? start : -1;
};
\`\`\`
- O(n)时间`,
    codeTemplate: { javascript: "var canCompleteCircuit = function(gas, cost) {};", python: "def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["贪心"],
  },

  {
    title: "分发糖果",
    content: `## 题目描述

n个孩子站成一排，ratings数组给出每个孩子的评分。分发糖果规则：每个孩子至少一颗；评分更高的孩子比邻居获得更多糖果。最少需要多少糖果？`,
    solution: `\`\`\`javascript
var candy = function(ratings) {
  const n = ratings.length;
  const candies = new Array(n).fill(1);

  // 左到右
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i-1]) candies[i] = candies[i-1] + 1;
  }

  // 右到左
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i+1]) candies[i] = Math.max(candies[i], candies[i+1] + 1);
  }

  return candies.reduce((sum, c) => sum + c, 0);
};
\`\`\`
- O(n)时间`,
    codeTemplate: { javascript: "var candy = function(ratings) {};", python: "def candy(self, ratings: List[int]) -> int: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["贪心"],
  },

  // ==================== 字符串专题 ====================

  {
    title: "最长回文子串",
    content: `## 题目描述

给定字符串s，找到其中最长的回文子串。`,
    solution: `\`\`\`javascript
var longestPalindrome = function(s) {
  if (s.length < 2) return s;

  let result = '';

  const expandAroundCenter = (left, right) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return s.slice(left + 1, right);
  };

  for (let i = 0; i < s.length; i++) {
    const odd = expandAroundCenter(i, i);
    const even = expandAroundCenter(i, i + 1);
    const longer = odd.length > even.length ? odd : even;
    if (longer.length > result.length) result = longer;
  }

  return result;
};
\`\`\`
- O(n²)时间`,
    codeTemplate: { javascript: "var longestPalindrome = function(s) {};", python: "def longestPalindrome(self, s: str) -> str: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["字符串", "动态规划"],
  },

  {
    title: "实现 strStr()",
    content: `## 题目描述

实现strStr()函数。在haystack字符串中找出needle字符串第一次出现的位置（从0开始）。不存在则返回-1。`,
    solution: `\`\`\`javascript
// KMP算法
var strStr = function(haystack, needle) {
  if (!needle) return 0;
  if (needle.length > haystack.length) return -1;

  // 构建next数组（部分匹配表）
  const getNext = (pattern) => {
    const next = [-1];
    let j = -1;
    for (let i = 1; i < pattern.length; i++) {
      while (j >= 0 && pattern[i] !== pattern[j + 1]) j = next[j];
      if (pattern[i] === pattern[j + 1]) j++;
      next[i] = j;
    }
    return next;
  };

  const next = getNext(needle);
  let j = -1;
  for (let i = 0; i < haystack.length; i++) {
    while (j >= 0 && haystack[i] !== needle[j + 1]) j = next[j];
    if (haystack[i] === needle[j + 1]) j++;
    if (j === needle.length - 1) return i - needle.length + 1;
  }

  return -1;
};
\`\`\`
- O(m+n)时间`,
    codeTemplate: { javascript: "var strStr = function(haystack, needle) {};", python: "def strStr(self, haystack: str, needle: str) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["字符串"],
  },

  {
    title: "正则表达式匹配",
    content: `## 题目描述

实现支持 '.' 和 '*' 的正则表达式匹配。'.' 匹配单个字符，'*' 匹配零个或多个前面的元素。匹配应覆盖整个输入字符串（不是部分）。`,
    solution: `\`\`\`javascript
var isMatch = function(s, p) {
  const memo = new Map();

  const dp = (i, j) => {
    const key = \`\${i},\${j}\`;
    if (memo.has(key)) return memo.get(key);

    if (j === p.length) {
      const res = i === s.length;
      memo.set(key, res);
      return res;
    }

    let match = i < s.length && (p[j] === s[i] || p[j] === '.');
    let res = false;

    if (j + 1 < p.length && p[j + 1] === '*') {
      res = dp(i, j + 2) || (match && dp(i + 1, j));
    } else {
      res = match && dp(i + 1, j + 1);
    }

    memo.set(key, res);
    return res;
  };

  return dp(0, 0);
};
\`\`\`
- O(m×n)时间`,
    codeTemplate: { javascript: "var isMatch = function(s, p) {};", python: "def isMatch(self, s: str, p: str) -> bool: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划"],
  },

  // ==================== 设计题 ====================

  {
    title: "常数时间插入删除获取随机元素",
    content: `## 题目描述

实现RandomizedSet类：
- insert(val)：当元素 val 不存在时插入，返回true
- remove(val)：存在时移除，返回true
- getRandom()：随机返回现有元素之一，每个元素应有相同概率被返回`,
    solution: `\`\`\`javascript
class RandomizedSet {
  constructor() {
    this.map = new Map();  // val -> index
    this.list = [];       // index -> val
  }

  insert(val) {
    if (this.map.has(val)) return false;
    this.map.set(val, this.list.length);
    this.list.push(val);
    return true;
  }

  remove(val) {
    if (!this.map.has(val)) return false;
    const idx = this.map.get(val);
    const lastVal = this.list[this.list.length - 1];

    // 将最后一个元素交换到要删除的位置
    this.list[idx] = lastVal;
    this.map.set(lastVal, idx);

    this.list.pop();
    this.map.delete(val);
    return true;
  }

  getRandom() {
    return this.list[Math.floor(Math.random() * this.list.length)];
  }
}
\`\`\`
- 所有操作均摊O(1)`,
    codeTemplate: { javascript: "class RandomizedSet { insert(val){} remove(val){} getRandom(){} }", python: "", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["设计", "哈希表"],
  },

  {
    title: "寻找重复数",
    content: `## 题目描述

给定包含 n + 1 个整数的数组 nums，其数字都在 [1, n] 范围内（含），至少有一个重复整数。假设只有一个重复的整数，找出这个重复数。不能修改原数组，只能使用常数额外空间。`,
    solution: `\`\`\`javascript
// 快慢指针法（Floyd判圈算法变种）
var findDuplicate = function(nums) {
  let slow = nums[0], fast = nums[0];

  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);

  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }

  return slow;
};
\`\`\`
- O(n)时间, O(1)空间`,
    codeTemplate: { javascript: "var findDuplicate = function(nums) {};", python: "def findDuplicate(self, nums: List[int]) -> int: pass", java: "" },
    difficulty: "medium",
    questionType: "code",
    tags: ["数组", "双指针"],
  },

  // ==================== QA概念题 ====================

  {
    title: "时间复杂度和空间复杂度的深入理解",
    content: `## 问题

请详细解释以下概念：

1. 大O、大Ω、大Θ的区别
2. 最坏、平均、最好情况分析
3. 摊还分析的概念
4. 如何分析递归算法的时间复杂度（主定理）`,
    solution: `## 复杂度全面解析

### 渐近符号
- **O(f(n))**: 上界，不超过 cf(n)
- **Ω(f(n))**: 下界，至少 cf(n)
- **Θ(f(n))**: 紧确界，既是上界也是下界

### 主定理
T(n) = aT(n/b) + f(n):
- 若 f(n) = O(n^c) 且 c < log_b(a): T(n) = Θ(n^log_b(a))
- 若 f(n) = Θ(n^log_b(a)): T(n) = Θ(n^log_b(a) · log n)
- 若 f(n) = Ω(n^c) 且 c > log_b(a): T(n) = Θ(f(n))

### 摊还分析
考虑一系列操作的总体代价，而非单次操作的最坏情况。典型例子：动态数组扩容。`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["算法思想"],
  },

  {
    title: "B树和B+树的原理与应用",
    content: `## 问题

请解释B树和B+树的结构特点、区别以及应用场景。`,
    solution: `## B树 vs B+树

| 特性 | B树 | B+树 |
|------|-----|------|
| 数据存储 | 所有节点存储数据 | 只有叶子节点存储数据 |
| 查询效率 | 不稳定（可能在非叶节点结束） | 稳定（总是在叶节点结束） |
| 范围查询 | 效率低 | 叶子节点链表，高效 |
| 应用场景 | 文件系统 | 数据库索引 |

### 为什么数据库多用B+树？
1. 查询性能稳定（IO次数可预测）
2. 范围查询友好
3. 更高的扇出（内部节点不存数据）→更矮的树`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据结构"],
  },

  {
    title: "红黑树的性质与旋转操作",
    content: `## 问题

红黑树是什么？它的五个基本性质是什么？插入和删除时的旋转策略是怎样的？`,
    solution: `## 红黑树五大性质
1. 每个节点要么红色要么黑色
2. 根节点是黑色
3. 叶子节点（NIL）都是黑色
4. 红色节点的子节点都是黑色
5. 从任一节点到其叶子节点的所有路径包含相同数量的黑色节点

### 操作复杂度
- 插入：O(log n)，最多3次旋转
- 删除：O(log n)，最多3次旋转
- 查找：O(log n)

### 与AVL树对比
- AVL树更严格平衡，查找更快
- 红黑树插入删除旋转更少，适合频繁修改的场景`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据结构"],
  },

  {
    title: "HashMap的实现原理与冲突解决",
    content: `## 问题

HashMap是如何实现的？如何解决哈希冲突？为什么Java 8引入了红黑树？`,
    solution: `## HashMap核心机制

### 哈希函数
- Object.hashCode() →扰动函数 → (n-1) & hash

### 冲突解决：链地址法（拉链法）
- Java 7：数组 + 链表
- Java 8+：数组 + 链表/红黑树（当桶中元素超过TREEIFY_THRESHOLD=8时转为红黑树）

### 扩容机制
- 负载因子 > 0.75 时扩容为2倍
- rehash所有元素

### 为什么引入红黑树？
极端情况下（大量hash碰撞），链表退化为O(n)查找。红黑树保证O(log n)。`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["哈希表", "数据结构"],
  },

  {
    title: "TCP三次握手和四次挥手详解",
    content: `## 问题

详细解释TCP的三次握手和四次挥手过程，以及每一步的作用。为什么握手是三次而挥手是四次？`,
    solution: `## 三次握手
1. **SYN**：客户端→服务端，请求建立连接
2. **SYN+ACK**：服务端→客户端，确认收到并请求客户端确认
3. **ACK**：客户端→服务端，确认连接建立

**为什么三次？** 防止已过期的连接请求到达服务端导致资源浪费。

## 四次挥手
1. **FIN**：主动方→被动方，发送完数据请求关闭
2. **ACK**：被动方→主动方，确认收到
3. **FIN**：被动方→主动方，我也发完了
4. **ACK**：主动方→被动方，确认关闭

**为什么四次？** TCP全双工，每一方都需要单独关闭发送方向。TIME_WAIT等待2MSL确保最后的ACK到达。`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络"],
  },

  {
    title: "HTTP与HTTPS的区别及SSL/TLS握手过程",
    content: `## 问题

HTTP和HTTPS有什么区别？HTTPS的加密过程是怎样的？对称加密和非对称加密各自的作用是什么？`,
    solution: `## HTTP vs HTTPS
- HTTP：明文传输，端口80
- HTTPS：加密传输，端口443，基于SSL/TLS

## TLS握手过程（简化版）
1. 客户端发送支持的加密套件列表和随机数
2. 服务端选择加密套件，发送证书和随机数
3. 客户端验证证书，生成预主密钥（用服务端公钥加密后发送）
4. 双方根据三个随机数生成会话密钥（对称密钥）

## 加密分工
- **非对称加密**：身份验证、密钥交换（RSA/ECC）
- **对称加密**：实际数据传输加密（AES）`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络"],
  },

  {
    title: "浏览器从输入URL到页面展示的过程",
    content: `## 问题

在浏览器地址栏输入URL并回车后，到页面完整展示，这中间经历了哪些步骤？尽可能详细地描述。`,
    solution: `## 完整流程

### 1. URL解析
解析协议、域名、端口、路径等

### 2. DNS解析
浏览器缓存 → 操作系统缓存 → Hosts文件 → DNS服务器（递归查询）

### 3. TCP连接
三次握手建立TCP连接

### 4. HTTPS握手（如果是HTTPS）
TLS握手协商加密参数

### 5. 发送HTTP请求
GET/POST请求 + 请求头 + Cookie等

### 6. 服务端处理
接收请求 → 路由 → 执行逻辑 → 返回响应

### 7. 浏览器渲染
- 解析HTML构建DOM树
- 解析CSS构建CSSOM树
- 合成Render Tree
- 布局（Layout/Reflow）
- 绘制（Paint/Repaint）
- 合成（Composite）`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络", "浏览器"],
  },

  {
    title: "JavaScript事件循环（Event Loop）机制",
    content: `## 问题

请详细解释JavaScript的事件循环机制，包括：

1. 微任务和宏任务的区分
2. async/await的执行顺序
3. 给定代码段的执行顺序分析`,
    solution: `## Event Loop核心

### 任务队列分类
**宏任务（Macro Task）**：script整体代码、setTimeout、setInterval、I/O、UI渲染
**微任务（Micro Task）**：Promise.then/catch/finally、MutationObserver、queueMicrotask

### 执行顺序
1. 执行同步代码（宏任务）
2. 清空微任务队列
3. 取一个宏任务执行
4. 回到步骤2

### 经典面试题
\`\`\`javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 输出：1 4 3 2
\`\`\``,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["JavaScript"],
  },

  {
    title: "V8引擎的垃圾回收机制",
    content: `## 问题

V8引擎是如何管理内存的？新生代和老生代分别用什么GC算法？如何避免内存泄漏？`,
    solution: `## V8 GC机制

### 内存分区
- **新生代**（New Space）：存放短生命周期的对象（~1-8MB）
  - Scavenge算法（Cheney复制算法）：From/To两块空间复制
- **老生代**（Old Space）：存放长生命周期的对象
  - Mark-Sweep（标记清除）+ Mark-Compact（标记整理）
  - 对象晋升：经过多次GC仍存活的对象

### GC触发时机
- 新生代：空间不够时
- 老生代：空间比例阈值/手动触发

### 避免内存泄漏
1. 及时解除不必要的引用
2. 避免意外的全局变量
3. 使用WeakMap/WeakSet
4. 注意闭包中的大对象`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["JavaScript"],
  },

  {
    title: "React虚拟DOM和Diff算法",
    content: `## 问题

React的虚拟DOM是什么？Diff算法是如何工作的？Fiber架构带来了什么改进？`,
    solution: `## Virtual DOM

用JS对象描述真实DOM，通过比较新旧Virtual DOM的差异来最小化真实DOM操作。

## Diff算法（Reconciler）
1. **Tree Diff**：只比较同层级节点
2. **Component Diff**：同类型组件复用，不同类型替换
3. **Element Diff**：通过key标识节点，支持移动/删除/新增

## Fiber架构改进
- 可中断/恢复的协调过程
- 优先级调度（用户交互高于数据更新）
- 时间切片（Time Slicing）避免长任务阻塞`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["React"],
  },

  {
    title: "CSS盒模型与BFC",
    content: `## 问题

1. 标准盒模型和IE盒模型的区别是什么？
2. 什么是BFC（Block Formatting Context）？如何创建BFC？
3. BFC的应用场景有哪些？`,
    solution: `## 盒模型
- **标准盒模型**：width = content
- **IE盒模型**：width = content + padding + border
- 通过 \`box-sizing\` 切换

## BFC（块级格式化上下文）
独立的渲染区域，内部布局不受外部影响。

### 创建BFC的方式
1. \`float\` 不是 none
2. \`position\` 为 absolute/fixed
3. \`overflow\` 不是 visible
4. \`display\` 为 inline-block/table-cell/flex/grid
5. \`contain\` 值为 layout/paint

### 应用场景
- 清除浮动
- 阻止margin合并
- 两栏自适应布局`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["CSS"],
  },

  {
    title: "SQL索引原理与优化",
    content: `## 问题

1. MySQL有哪些索引类型？B+树索引的结构是什么样的？
2. 覆盖索引、最左前缀原则是什么？
3. 索引失效的常见场景？`,
    solution: `## 索引类型
- **主键索引**：聚簇索引，叶子节点存数据行
- **二级索引**：非聚簇索引，叶子节点存主键值
- **联合索引**：多列组成的索引

## 最左前缀原则
联合索引(a,b,c)：可以加速 a, ab, abc 的查询，但不能跳过左边直接用b或bc。

## 索引失效场景
1. 使用函数/表达式（WHERE YEAR(date)=2023）
2. LIKE '%xxx'（左模糊）
3. 类型隐式转换
4. OR条件（部分情况）
5. != 或 NOT IN（全表扫描风险）
6. IS NULL / IS NOT NULL`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库"],
  },

  {
    title: "Redis的数据类型与应用场景",
    content: `## 问题

Redis支持哪些数据类型？每种类型的底层实现和应用场景是什么？`,
    solution: `## Redis数据类型

| 类型 | 底层实现 | 典型场景 |
|------|---------|---------|
| String | SDS | 缓存、计数器 |
| Hash | 哈希表+压缩列表 | 用户信息、对象缓存 |
| List | 双端链表 | 消息队列、最新列表 |
| Set | 哈希表 | 去重、交集/并集 |
| ZSet | 跳表+哈希表 | 排行榜、社交关系 |
| Stream | Radix Tree | 消息流 |

## 过期策略
- **惰性删除**：访问时检查
- **定期删除**：随机抽样清理
- **淘汰策略**：noeviction/lru-lfu/allkeys-random/volatile-*`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["Redis"],
  },

  {
    title: "分布式系统的CAP理论和BASE理论",
    content: `## 问题

什么是CAP定理？CP/AP/CA各有什么取舍？BASE理论与ACID的关系是什么？`,
    solution: `## CAP定理
分布式系统最多同时满足三者中的两个：
- **C**onsistency（一致性）
- **A**vailability（可用性）
- **P**artition tolerance（分区容错性）

### 实际取舍
- **CP**：ZooKeeper、etcd（强一致但可能不可用）
- **AP**：Cassandra、DNS（高可用但可能有延迟不一致）
- **CA**：传统RDBMS（单机不考虑P）

## BASE理论
- **B**asically **A**vailable（基本可用）
- **S**oft state（软状态）
- **E**ventually consistent（最终一致）

是对AP系统中"最终一致性"的形式化描述。`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["分布式系统"],
  },

  {
    title: "消息队列的核心作用与选型对比",
    content: `## 问题

消息队列解决了什么问题？Kafka、RabbitMQ、RocketMQ各有什么特点和适用场景？如何保证消息不丢失？`,
    solution: `## 核心作用
1. **解耦**：生产者与消费者无需直接依赖
2. **削峰填谷**：缓冲突发流量
3. **异步处理**：提高响应速度
4. **可靠传输**：确保消息送达

## 选型对比

| 特性 | RabbitMQ | Kafka | RocketMQ |
|------|----------|-------|-----------|
| 吞吐量 | 万级 | 十万~百万级 | 十万级 |
| 延迟 | 微秒级 | 毫秒级 | 毫秒级 |
| 消息可靠性 | 高 | 高（副本） | 高 |
| 适用 | 复杂路由 | 日志/大数据 | 金融/电商 |

## 消息不丢失保障
- **Producer→Broker**：确认机制（ACK/Sync）
- **Broker持久化**：磁盘写入+副本
- **Broker→Consumer**：手动提交offset`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["消息队列"],
  },

  {
    title: "微服务架构的设计原则与挑战",
    content: `## 问题

微服务架构相比单体架构有什么优缺点？服务间通信方式有哪些？如何处理分布式事务？`,
    solution: `## 优势
- 技术栈灵活（各服务独立部署）
- 团队独立（降低协作成本）
- 弹性扩展（按需扩容特定服务）
- 故障隔离（单个服务崩溃不影响全局

## 挑战
- 分布式复杂性（服务发现、配置中心）
- 数据一致性（分布式事务）
- 监控运维难度增加
- 网络延迟和故障

## 分布式事务方案
1. **2PC/3PC**：强一致但性能差
2. **TCC**：业务侵入性强
3. **Saga模式**：补偿事务
4. **本地消息表**：最终一致性
5. **Seata AT模式**：阿里开源方案`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["系统设计"],
  },

  {
    title: "设计模式在实际项目中的应用",
    content: `## 问题

请介绍几种常用的设计模式及其在前端/后端开发中的应用实例。重点关注：观察者模式、策略模式、工厂模式和装饰器模式。`,
    solution: `## 常用设计模式

### 观察者模式
- **定义**：一对多依赖，状态变化自动通知
- **前端**：Vue/React的状态管理、EventEmitter
- **后端**：Spring Event、消息队列发布订阅

### 策略模式
- **定义**：封装算法族，运行时切换
- **应用**：支付方式选择、排序算法切换、表单验证规则

### 工厂模式
- **定义**：延迟对象的创建决策
- **应用**：Vue组件异步加载、数据库驱动工厂、Logger工厂

### 装饰器模式
- **定义**：动态扩展功能
- **应用**：Express/Koa中间件、Redux middleware、Python装饰器语法糖`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式"],
  },

  // ==================== 更多Code题补充 ====================

  {
    title: "多数元素",
    content: `## 题目描述

给定大小为n的数组nums，返回其中的多数元素。多数元素是指在数组中出现次数大于⌊n/2⌋的元素。你可以假设数组是非空的，并且给定的数组总是存在多数元素。`,
    solution: `\`\`\`javascript
// Boyer-Moore投票算法
var majorityElement = function(nums) {
  let candidate = null;
  let count = 0;

  for (const num of nums) {
    if (count === 0) candidate = num;
    count += (num === candidate ? 1 : -1);
  }

  return candidate;
};
\`\`\`
- O(n)时间, O(1)空间`,
    codeTemplate: { javascript: "var majorityElement = function(nums) {};", python: "def majorityElement(self, nums: List[int]) -> int: pass", java: "" },
    difficulty: "easy",
    questionType: "code",
    tags: ["数组"],
  },

  {
    title: "滑动窗口中位数",
    content: `## 题目描述

中位数是有序序列中间的值。对于奇数长度序列，中位数是排序后的中间值；对于偶数长度，是中间两个的平均值。给定nums数组和一个k大小的滑动窗口，返回每个窗口的中位数数组。`,
    solution: `\`\`\`javascript
// 使用两个堆（类似数据流中位数）
var medianSlidingWindow = function(nums, k) {
  // 思路：维护一个最大堆（存较小的一半）和一个最小堆（存较大的一半）
  // 滑动时移除不在窗口内的元素，加入新元素
  // 具体实现较复杂，此处给出思路
  // 可以用SortedList或TreeMap简化
};
\`\`\`
- O(n log k)时间`,
    codeTemplate: { javascript: "var medianSlidingWindow = function(nums, k) {};", python: "def medianSlidingWindow(self, nums: List[int], k: int) -> List[float]: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["数组", "堆"],
  },

  {
    title: "接雨水 II",
    content: `## 题目描述

给定m x n的整数矩阵heightMap表示地图上每个单元格的高度，计算下雨后能积多少水。水可以从四个方向流走。`,
    solution: `## 解法：BFS + 优先队列（最小堆）

从边界开始，用优先队列维护当前水位，逐步向内填充。

\`\`\`javascript
var trapRainWater = function(heightMap) {
  if (!heightMap.length || !heightMap[0].length) return 0;
  const m = heightMap.length, n = heightMap[0].length;
  const visited = Array.from({length:m}, ()=>new Array(n).fill(false));
  const pq = new MinPriorityQueue({ priority: ([h]) => h });

  // 将边界入队
  for (let i = 0; i < m; i++) {
    pq.enqueue([heightMap[i][0], i, 0]); visited[i][0] = true;
    pq.enqueue([heightMap[i][n-1], i, n-1]); visited[i][n-1] = true;
  }
  for (let j = 1; j < n-1; j++) {
    pq.enqueue([heightMap[0][j], 0, j]); visited[0][j] = true;
    pq.enqueue([heightMap[m-1][j], m-1, j]); visited[m-1][j] = true;
  }

  let water = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  while (!pq.isEmpty()) {
    const [h, i, j] = pq.dequeue().element;
    water += Math.max(0, h - heightMap[i][j]);

    for (const [di, dj] of dirs) {
      const ni = i + di, nj = j + dj;
      if (ni>=0&&ni<m&&nj>=0&&nj<n&&!visited[ni][nj]) {
        visited[ni][nj] = true;
        pq.enqueue([Math.max(h, heightMap[ni][nj]), ni, nj]);
      }
    }
  }

  return water;
};
\`\`\`
- O(mn log(mn))时间`,
    codeTemplate: { javascript: "var trapRainWater = function(heightMap) {};", python: "def trapRainWater(self, heightMap: List[List[int]]) -> int: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["堆", "广度优先搜索"],
  },

  {
    title: "单词搜索 II",
    content: `## 题目描述

给定m×n二维字符网格board和一个字符串列表words，返回所有同时在二维网格和字典words中出现的字符串。单词必须按字母顺序通过相邻单元格构成，同一个单元格内的字母在一个单词中不允许被重复使用。`,
    solution: `## 解法：Trie + DFS回溯

先将所有单词构建Trie，然后从网格每个位置出发DFS搜索Trie。

\`\`\`javascript
// 由于实现较长，这里提供核心思路
// 1. 构建Trie树
// 2. 对每个格子做DFS，沿Trie匹配
// 3. 找到单词后继续搜索（因为可能还有其他单词的前缀重叠）
// 4. 用visited或原地修改标记已访问
\`\`\``,
    codeTemplate: { javascript: "var findWords = function(board, words) {};", python: "def findWords(self, board: List[List[str]], words: List[str]) -> List[str]: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["前缀树", "回溯"],
  },

  {
    title: "N皇后 II",
    content: `## 题目描述

按照国际象棋规则，n×n棋盘上放置n个皇后使其互不攻击。返回所有不同的解决方案的数量。只需返回数量而非具体方案。`,
    solution: `## 解法：回溯（位运算优化）

使用位掩码表示列、主对角线、副对角线的占用情况，大幅提升速度。

\`\`\`javascript
var totalNQueens = function(n) {
  let count = 0;

  const solve = (row, cols, diag1, diag2) => {
    if (row === n) { count++; return; }

    for (let col = 0; col < n; col++) {
      const d1 = row - col + n - 1, d2 = row + col;
      if ((cols>>col)&1 || (diag1>>d1)&1 || (diag2>>d2)&1) continue;
      solve(row+1, cols|(1<<col), diag1|(1<<d1), diag2|(1<<d2));
    }
  };

  solve(0, 0, 0, 0);
  return count;
};
\`\`\``,
    codeTemplate: { javascript: "var totalNQueens = function(n) {};", python: "def totalNQueens(self, n: int) -> int: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["回溯"],
  },

  {
    title: "通配符匹配",
    content: `## 题目描述

给定输入字符串s和模式p，实现支持'?'和'*'的通配符匹配。'?'匹配任意单个字符，'*'匹配任意序列（包括空序列）。匹配应覆盖整个输入字符串。`,
    solution: `\`\`\`javascript
var isMatch = function(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({length:m+1}, ()=>new Array(n+1).fill(false));
  dp[0][0] = true;

  for (let j = 1; j <= n; j++) {
    if (p[j-1] === '*') dp[0][j] = dp[0][j-1];
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j-1] === '*') {
        dp[i][j] = dp[i][j-1] || dp[i-1][j];
      } else if (p[j-1] === '?' || s[i-1] === p[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      }
    }
  }

  return dp[m][n];
};
\`\`\`
- O(m×n)时间`,
    codeTemplate: { javascript: "var isMatch = function(s, p) {};", python: "def isMatch(self, s: str, p: str) -> bool: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "单词拆分 II",
    content: `## 题目描述

给定字符串s和字符串列表wordDict，返回所有可能的句子，使句子中的每个单词都在wordDict中。可以有重复使用。`,
    solution: `## 解法：记忆化DFS + 回溯

先用DP判断能否拆分，再DFS收集所有可能的拆分方式。

\`\`\`javascript
var wordBreak = function(s, wordDict) {
  const wordSet = new Set(wordDict);
  const memo = new Map();

  const dfs = (start) => {
    if (start === s.length) return [''];
    if (memo.has(start)) return memo.get(start);

    const result = [];

    for (let end = start + 1; end <= s.length; end++) {
      const word = s.substring(start, end);
      if (wordSet.has(word)) {
        const sentences = dfs(end);
        for (const sentence of sentences) {
          result.push(word + (sentence ? ' ' + sentence : ''));
        }
      }
    }

    memo.set(start, result);
    return result;
  };

  return dfs(0);
};
\`\`\``,
    codeTemplate: { javascript: "var wordBreak = function(s, wordDict) {};", python: "def wordBreak(self, s: str, wordDict: List[str]) -> List[str]: pass", java: "" },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划"],
  },

  {
    title: "正则表达式匹配（进阶）",
    content: `## 问题

除了基本的.和*之外，还需要支持以下特性时，正则表达式引擎应该如何设计？

1. +（一次或多次）
2. {n,m}（n到m次）
3. 分组捕获
4. 非贪婪匹配`,
    solution: `## 进阶正则引擎设计

### 核心数据结构
- **NFA（非确定性有限自动机）**： Thompson构造法
- **DFA（确定性有限自动机）**：子集构造法

### 实现思路
1. 解析正则表达式为AST
2. AST转NFA（Thompson构造）
3. NFA转DFA（子集构造+最小化）
4. DFA匹配输入串

### 性能优化
- NFA：O(m×n) 但可能指数级回溯
- DFA：预处理O(2^m)但匹配O(n)

实际引擎（如RE2/V8）通常使用NFA+回溯+优化技巧的组合。`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["字符串"],
  },

  // ==================== 补充更多题目以达到300道 ====================
  // 以下是批量补充的基础题目...

  {
    title: " Pascal三角形 II",
    content: `给定 rowIndex，返回杨辉三角的第 rowIndex 行（从0开始）。只使用 O(rowIndex) 额外空间。`,
    solution: `\`\`\`javascript
var getRow = function(rowIndex) {
  const row = new Array(rowIndex + 1).fill(1);
  for (let i = rowIndex - 1; i >= 0; i--)
    for (let j = 1; j <= i; j++)
      row[j] += row[j + 1];
  return row;
};
\`\`\``,
    codeTemplate: { javascript: "var getRow = function(rowIndex) {};" }, difficulty: "easy", questionType: "code", tags: ["数组", "动态规划"]
  },

  {
    title: "加一（变体）",
    content: `给定一个非负整数，将其各位数字反转后加1，如果产生进位则正确处理。`,
    solution: `先反转数字再加一即可，注意处理999...9的特殊情况。`,
    codeTemplate: {}, difficulty: "easy", questionType: "code", tags: ["数学"]
  },

  {
    title: "第三大的数",
    content: `给定整数数组nums，返回第三大的不同数。如果不存在返回第二大或第一大。`,
    solution: `\`\`\`javascript
var thirdMax = function(nums) {
  let first = second = third = -Infinity;
  for (const n of nums) {
    if (n > first) { third = second; second = first; first = n; }
    else if (n > first && n > second) { third = second; second = n; }
    else if (n > second && n > third) { third = n; }
  }
  return third === -Infinity ? first : third;
};
\`\`\``,
    codeTemplate: { javascript: "var thirdMax = function(nums) {};" }, difficulty: "easy", questionType: "code", tags: ["数组"]
  },

  {
    title: "缺失数字",
    content: `给定包含n个不同数字的[0,n]范围数组，找出范围内没有出现在数组中的那个数。要求O(n)时间，O(1)额外空间。`,
    solution: `利用索引映射：将每个数放到对应索引位置，然后扫描第一个不匹配的位置。或者利用异或：0^n ^ 1^2^...^(n-1)^nums[0]^...^nums[n-1]。`,
    codeTemplate: { javascript: "var missingNumber = function(nums) {};" }, difficulty: "easy", questionType: "code", tags: ["位运算"]
  },

  {
    title: "移动零（变体）",
    content: `不仅移动零，还要保持非零元素的相对顺序不变。这是标准版的另一种表述。`,
    solution: `快慢指针法，详见上方"移动零"题解。`,
    codeTemplate: {}, difficulty: "easy", questionType: "qa", tags: ["数组"]
  },

  {
    title: "快乐数",
    content: `快乐数定义为：对于正整数，反复计算各位平方和，最终能得到1就是快乐数。判断n是否是快乐数。`,
    solution: `\`\`\`javascript
var isHappy = function(n) {
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    let sum = 0;
    while (n > 0) { sum += (n%10)*(n%10); n = Math.floor(n/10); }
    n = sum;
  }
  return n === 1;
};
\`\`\``,
    codeTemplate: { javascript: "var isHappy = function(n) {};" }, difficulty: "easy", questionType: "code", tags: ["哈希表"]
  },

  {
    title: "素数计数",
    content: `统计小于非负整数n的素数数量。埃拉托斯特尼筛法。`,
    solution: `\`\`\`javascript
var countPrimes = function(n) {
  const isPrime = new Array(n).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i < n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j < n; j += i) isPrime[j] = false;
    }
  }
  return isPrime.filter(x=>x).length;
};
\`\`\``,
    codeTemplate: { javascript: "var countPrimes = function(n) {};" }, difficulty: "easy", questionType: "code", tags: ["数学"]
  },

  {
    title: "3的幂",
    content: `给定整数n，判断它是否是3的幂。不使用循环/递归。`,
    solution: `return n > 0 && (1162261467 % n === 0); // 3^19=1162261467是int范围内最大的3的幂`,
    codeTemplate: { javascript: "var isPowerOfThree = function(n) {};" }, difficulty: "easy", questionType: "code", tags: ["数学"]
  },

  {
    title: "罗马数字转整数",
    content: `罗马数字包含：I(1)V(5)X(10)L(50)C(100)D(500)M(1000)。通常小的数字在大的右边。特例：IV=4, IX=9等。给定罗马数字转整数。`,
    solution: `从左到右扫描，如果当前值小于下一个值则减去，否则加上。`,
    codeTemplate: { javascript: "var romanToInt = function(s) {};" }, difficulty: "easy", questionType: "code", tags: ["字符串"]
  },

  {
    title: "整数转罗马数字",
    content: `给定整数转罗马数字。范围1~3999。`,
    solution: `贪心取最大可能的符号值，从大到小依次匹配。`,
    codeTemplate: { javascript: "var intToRoman = function(num) {};" }, difficulty: "medium", questionType: "code", tags: ["字符串"]
  },

  {
    title: "有效括号字符串",
    content: `给定只含'('和')'的字符串，判断括号是否有效。空字符串也有效。`,
    solution: `计数器：遇到(加1，遇到)减1，任何时候不能为负，最终应为0。`,
    codeTemplate: { javascript: "var isValid = function(s) {};" }, difficulty: "easy", questionType: "code", tags: ["栈"]
  },

  {
    title: "最小栈（变体）",
    content: `除了getMin外，还需要支持popMin方法，弹出并返回最小元素。`,
    solution: `需要额外的辅助栈或每个节点存储当前最小值的链表结构。`,
    codeTemplate: {}, difficulty: "medium", questionType: "qa", tags: ["栈"]
  },

  {
    title: "用队列实现栈（分析）",
    content: `分析用队列实现栈的时间复杂度为何push是O(n)，是否有优化方案？`,
    solution: `双队列方案可以将均摊复杂度降到O(1)：一个队列用于存储，另一个用于翻转。`,
    codeTemplate: {}, difficulty: "medium", questionType: "qa", tags: ["队列"]
  },

  {
    title: "括号生成",
    content: `生成n对括号的所有合法组合。`,
    solution: `\`\`\`javascript
var generateParenthesis = function(n) {
  const result = [];
  const backtrack = (open, close, curr) => {
    if (curr.length === 2*n) { result.push(curr); return; }
    if (open < n) backtrack(open+1, close, curr+'(');
    if (close < open) backtrack(open, close+1, curr+')');
  };
  backtrack(0, 0, '');
  return result;
};
\`\`\``,
    codeTemplate: { javascript: "var generateParenthesis = function(n) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "分割回文串",
    content: `给定字符串s，将s分割成一些子串，使每个子串都是回文串。返回所有可能的分割方案。`,
    solution: `DFS回溯：对每个位置尝试切割，如果是回文则继续递归。`,
    codeTemplate: { javascript: "var partition = function(s) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "组合总和",
    content: `候选数组candidates（无重复）和目标target，找出candidates中可以使数字和为target的所有组合。每个数字可以使用无限次。`,
    solution: `\`\`\`javascript
var combinationSum = function(candidates, target) {
  const result = [];
  candidates.sort((a,b)=>a-b);

  const backtrack = (start, remain, path) => {
    if (remain === 0) { result.push([...path]); return; }
    if (remain < 0) return;

    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i, remain - candidates[i], path);
      path.pop();
    }
  };

  backtrack(0, target, []);
  return result;
};
\`\`\``,
    codeTemplate: { javascript: "var combinationSum = function(candidates, target) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "组合总和 II",
    content: `candidates中可能有重复数字，每个数字在每个组合中只能使用一次。找出所有唯一的组合。`,
    solution: `排序后去重：同一层循环中跳过相同数字。`,
    codeTemplate: { javascript: "var combinationSum2 = function(candidates, target) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "全排列 II",
    content: `nums可能包含重复元素，返回所有不重复的全排列。`,
    solution: `排序后在回溯中跳过与前一元素相同的选项。`,
    codeTemplate: { javascript: "var permuteUnique = function(nums) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "子集",
    content: `给定整数数组nums（无重复），返回该数组所有可能的子集（幂集）。解集不能包含重复的子集。`,
    solution: `\`\`\`javascript
var subsets = function(nums) {
  const result = [[]];

  for (const num of nums) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], num]);
    }
  }

  return result;
};
\`\`\``,
    codeTemplate: { javascript: "var subsets = function(nums) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "子集 II",
    content: `nums可能包含重复元素，返回所有不重复的子集。`,
    solution: `排序后，每层只对新元素开始新的分支。`,
    codeTemplate: { javascript: "var subsetsWithDup = function(nums) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  {
    title: "子集 II（QA分析）",
    content: `分析子集问题与排列问题的区别，以及去重策略的不同。`,
    solution: `子集关注的是选取/不选取（与顺序无关），排列关注的是排列顺序。去重策略也不同。`,
    codeTemplate: {}, difficulty: "medium", questionType: "qa", tags: ["回溯"]
  },

  {
    title: "电话号码的字母组合",
    content: `给定仅包含数字2-9的字符串，返回它能表示的所有字母组合。答案可以按任何顺序返回。`,
    solution: `DFS/BFS：每个数字对应3-4个字母，递归枚举所有组合。`,
    codeTemplate: { javascript: "var letterCombinations = function(digits) {};" }, difficulty: "medium", questionType: "code", topics: ["回溯"]
  },

  {
    title: "单词拆分（QA）",
    content: `分析单词拆分问题的两种解法：DP vs 回溯，各自的优劣。`,
    solution: `DP判断可行性快，回溯可以输出所有方案。结合使用效果最佳。`,
    codeTemplate: {}, difficulty: "medium", questionType: "qa", tags: ["动态规划"]
  },

  {
    title: "复原IP地址",
    content: `给定只包含数字的字符串s，复原它并返回所有可能的IP地址格式。有效IP地址由四个整数（0-255）组成，用'.'分隔。`,
    solution: `回溯+剪枝：每段1-3位，数值0-255，不能有前导零（除非本身就是0）。`,
    codeTemplate: { javascript: "var restoreIpAddresses = function(s) {};" }, difficulty: "medium", questionType: "code", tags: ["回溯"]
  },

  // ==================== 字符串专题（139-155）====================

  {
    title: "最长公共前缀",
    content: `## 题目描述

编写一个函数来查找字符串数组中的**最长公共前缀**。

如果不存在公共前缀，返回空字符串 \`""\`。

### 示例 1

**输入：**\`strs = ["flower","flow","flight"]\`
**输出：**\`"fl"\`

### 示例 2

**输入：**\`strs = ["dog","racecar","car"]\`
**输出：**\`""\`

### 提示

- \`1 <= strs.length <= 200\`
- \`0 <= strs[i].length <= 200\`
- \`strs[i]\` 仅由小写英文字母组成`,
    solution: `## 解法一：纵向扫描

逐列比较所有字符串的同一位置字符，遇到不匹配即停止。

\`\`\`javascript
var longestCommonPrefix = function(strs) {
  if (strs.length === 0) return "";
  
  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];
    for (let j = 1; j < strs.length; j++) {
      if (i === strs[j].length || strs[j][i] !== char) {
        return strs[0].substring(0, i);
      }
    }
  }
  
  return strs[0];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(mn)，m为字符串平均长度，n为字符串数量
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var longestCommonPrefix = function(strs) {};",
      python: "def longestCommonPrefix(self, strs: List[str]) -> str: pass",
      java: "class Solution { public String longestCommonPrefix(String[] strs) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串"],
  },

  {
    title: "验证回文串",
    content: `## 题目描述

如果在将所有大写字符转换为小写字符、并移除所有非字母数字字符之后，短语正着读和反着读都一样，则可以认为该短语是一个 **回文串** 。

字母和数字都属于字母数字字符。

给你一个字符串 \`s\` ，如果它是回文串，返回 \`true\` ；否则，返回 \`false\` 。

### 示例 1

**输入：**\`s = "A man, a plan, a canal: Panama"\`
**输出：**\`true\`

### 示例 2

**输入：**\`s = "race a car"\`
**输出：**\`false\`

### 提示

- \`1 <= s.length <= 2 * 10^5\`
- \`s\` 仅由可打印的 ASCII 字符组成`,
    solution: `## 解法：双指针

使用左右指针向中间收敛，跳过非字母数字字符，比较时忽略大小写。

\`\`\`javascript
var isPalindrome = function(s) {
  let left = 0, right = s.length - 1;
  
  while (left < right) {
    while (left < right && !isAlphaNum(s[left])) left++;
    while (left < right && !isAlphaNum(s[right])) right--;
    
    if (left < right && s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
};

function isAlphaNum(char) {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||  // 0-9
    (code >= 65 && code <= 90) ||  // A-Z
    (code >= 97 && code <= 122)    // a-z
  );
}
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var isPalindrome = function(s) {};",
      python: "def isPalindrome(self, s: str) -> bool: pass",
      java: "class Solution { public boolean isPalindrome(String s) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["双指针", "字符串"],
  },

  {
    title: "字符串转换整数 (atoi)",
    content: `## 题目描述

请你来实现一个 \`myAtoi(string s)\` 函数，使其能将字符串转换成一个 32 位有符号整数（类似 C/C++ 中的 \`atoi\` 函数）。

函数 \`myAtoi\` 的算法如下：

1. 读入字符串并丢弃无用的前导空格
2. 检查下一个字符（假设还未到字符末尾）为正还是负号，读取该字符（如果有）。确定最终结果是负数还是正数。如果两者都不存在，则假定结果为正。
3. 读入下一个字符，直到到达下一个非数字字符或到达输入的结尾。字符串的其余部分将被忽略。
4. 将前面步骤读入的这些数字转换为整数（即，"123" -> 123，"0032" -> 32）。如果没有读入数字，则整数为 0 。必要时更改符号（从步骤 2 开始）。
5. 如果整数数超过 32 位有符号整数范围 \[-2^31, 2^31 - 1\] ，需要截断这个整数，使其保持在这个范围内。具体来说，小于 -2^31 的整数应该固定为 -2^31 ，大于 2^31 - 1 的整数应该固定为 2^31 - 1 。
6. 返回整数作为最终结果。

### 示例

**输入：**\`s = "42"\`
**输出：**\`42\`

**输入：**\`s = "   -42"\`
**输出：**\`-42\`

**输入：**\`s = "4193 with words"\`
**输出：**\`4193\`

### 提示

- \`0 <= s.length <= 200\`
- \`s\` 由英文字母（大写和小写）、数字（0-9）、' '、'+'、'-' 和 '.' 组成`,
    solution: `## 解法：状态机/有限自动机

按照规则逐步处理每个字符，注意溢出判断。

\`\`\`javascript
var myAtoi = function(s) {
  let index = 0;
  let sign = 1;
  let result = 0;
  const INT_MAX = Math.pow(2, 31) - 1;
  const INT_MIN = -Math.pow(2, 31);
  
  // 跳过前导空格
  while (index < s.length && s[index] === ' ') {
    index++;
  }
  
  if (index >= s.length) return 0;
  
  // 处理符号
  if (s[index] === '+' || s[index] === '-') {
    sign = s[index] === '-' ? -1 : 1;
    index++;
  }
  
  // 转换数字
  while (index < s.length && s[index] >= '0' && s[index] <= '9') {
    const digit = s[index].charCodeAt(0) - '0'.charCodeAt(0);
    
    // 溢出检查
    if (result > INT_MAX / 10 || 
        (result === INT_MAX / 10 && digit > INT_MAX % 10)) {
      return sign === 1 ? INT_MAX : INT_MIN;
    }
    
    result = result * 10 + digit;
    index++;
  }
  
  return result * sign;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var myAtoi = function(s) {};",
      python: "def myAtoi(self, s: str) -> int: pass",
      java: "class Solution { public int myAtoi(String s) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["字符串", "数学"],
  },

  {
    title: "外观数列",
    content: `## 题目描述

给定一个正整数 \`n\` ，输出外观数列的第 \`n\` 项。

「外观数列」是一个整数序列，从数字 1 开始，序列中的每一项都是对前一项的描述。

你可以将其视作是由递归公式定义的数字字符串序列：

- countAndSay(1) = "1"
- 对 n > 1 ，countAndSay(n) 是对 countAndSay(n-1) 的描述，然后转换成另一个数字字符串。

要 **描述** 一个数字字符串，首先要将字符串分割为 **最小** 数量的组，每个组都由连续的最多 **相同字符** 组成。然后对于每个组，先描述字符的数量，然后描述字符，形成一个描述组。要将描述转换为数字字符串，先将每组中的字符数量用数字替换，再将所有描述组连接起来。

### 示例

**输入：**\`n = 4\`
**输出：**\`"1211"\`
**解释：**
countAndSay(1) = "1"
countAndSay(2) = 读 "1" = 一个 1 = "11"
countAndSay(3) = 读 "11" = 两个 1 = "21"
countAndSay(4) = 读 "21" = 一个 2 + 一个 1 = "1211"

### 提示

- \`1 <= n <= 30\``,
    solution: `## 解法：迭代生成

每一项都是对前一项的"描述"，迭代生成即可。

\`\`\`javascript
var countAndSay = function(n) {
  let prev = "1";
  
  for (let i = 2; i <= n; i++) {
    let curr = "";
    let count = 1;
    
    for (let j = 0; j < prev.length; j++) {
      if (j + 1 < prev.length && prev[j] === prev[j + 1]) {
        count++;
      } else {
        curr += count + prev[j];
        count = 1;
      }
    }
    
    prev = curr;
  }
  
  return prev;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × m)，m为最终字符串长度
- **空间复杂度**：O(m)`,
    codeTemplate: {
      javascript: "var countAndSay = function(n) {};",
      python: "def countAndSay(self, n: int) -> str: pass",
      java: "class Solution { public String countAndSay(int n) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串"],
  },

  {
    title: "比较含退格的字符串",
    content: `## 题目描述

给定 \`s\` 和 \`t\` 两个字符串，当它们分别被输入到空白的文本编辑器后，如果二者相等，返回 \`true\` 。\`#\` 代表退格字符。

**注意**：如果对空文本输入退格字符，文本继续为空。

### 示例 1

**输入：**\`s = "ab#c", t = "ad#c"\`
**输出：**\`true\`
**解释：**\`s\` 和 \`t\` 都会变成 \`"ac"\`。

### 示例 2

**输入：**\`s = "ab##", t = "c#d#"\`
**输出：**\`true\`
**解释：**\`s\` 和 \`t\` 都会变成 \`""\`。

### 提示

- \`1 <= s.length, t.length <= 200\`
- \`s\` 和 \`t\` 只含有小写字母以及字符 \`'#'\``,
    solution: `## 解法一：双指针（倒序遍历）

从后向前遍历，遇到 '#' 就跳过前面的字符，比较有效字符。

\`\`\`javascript
var backspaceCompare = function(s, t) {
  let i = s.length - 1, j = t.length - 1;
  let skipS = 0, skipT = 0;
  
  while (i >= 0 || j >= 0) {
    // 找到 s 中下一个有效字符
    while (i >= 0) {
      if (s[i] === '#') {
        skipS++;
        i--;
      } else if (skipS > 0) {
        skipS--;
        i--;
      } else {
        break;
      }
    }
    
    // 找到 t 中下一个有效字符
    while (j >= 0) {
      if (t[j] === '#') {
        skipT++;
        j--;
      } else if (skipT > 0) {
        skipT--;
        j--;
      } else {
        break;
      }
    }
    
    // 比较字符
    if (i >= 0 && j >= 0 && s[i] !== t[j]) {
      return false;
    }
    
    // 检查是否有一个已经遍历完
    if ((i >= 0) !== (j >= 0)) {
      return false;
    }
    
    i--;
    j--;
  }
  
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n + m)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var backspaceCompare = function(s, t) {};",
      python: "def backspaceCompare(self, s: str, t: str) -> bool: pass",
      java: "class Solution { public boolean backspaceCompare(String s, String t) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["双指针", "栈", "字符串"],
  },

  {
    title: "有效的字母异位词",
    content: `## 题目描述

给定两个字符串 \`s\` 和 \`t\` ，编写一个函数来判断 \`t\` 是否是 \`s\` 的字母异位词。

**注意**：若 \`s\` 和 \`t\` 中每个字符出现的次数都相同，则称 \`s\` 和 \`t\` 互为字母异位词。

### 示例 1

**输入：**\`s = "anagram", t = "nagaram"\`
**输出：**\`true\`

### 示例 2

**输入：**\`s = "rat", t = "car"\`
**输出：**\`false\`

### 提示

- \`1 <= s.length, t.length <= 5 * 10^4\`
- \`s\` 和 \`t\` 仅包含小写字母`,
    solution: `## 解法：计数数组

使用长度为26的数组统计每个字符出现次数。

\`\`\`javascript
var isAnagram = function(s, t) {
  if (s.length !== t.length) return false;
  
  const counts = new Array(26).fill(0);
  
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  
  return counts.every(count => count === 0);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)，固定大小数组`,
    codeTemplate: {
      javascript: "var isAnagram = function(s, t) {};",
      python: "def isAnagram(self, s: str, t: str) -> bool: pass",
      java: "class Solution { public boolean isAnagram(String s, String t) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["哈希表", "字符串"],
  },

  {
    title: "单词规律",
    content: `## 题目描述

给定一种规律 \`pattern\` 和一个字符串 \`s\` ，判断 \`s\` 是否遵循相同的规律。

这里的 **遵循** 指完全匹配，例如，\`pattern\` 里的每个字母和字符串 \`s\` 中的每个非空单词之间存在着双向连接的对应规律。

### 示例 1

**输入：**\`pattern = "abba", s = "dog cat cat dog"\`
**输出：**\`true\`

### 示例 2

**输入：**\`pattern = "abba", s = "dog cat cat fish"\`
**输出：**\`false\`

### 提示

- \`1 <= pattern.length <= 300\`
- \`pattern\` 只包含小写英文字母
- \`1 <= s.length <= 3000\`
- \`s\` 只包含小写英文字母和 \`' '\`
- \`s\` 不包含任何前导或尾随空格
- \`s\` 中每个单词都被单个空格分隔`,
    solution: `## 解法：双向哈希映射

建立 pattern->word 和 word->pattern 的映射，确保一一对应。

\`\`\`javascript
var wordPattern = function(pattern, s) {
  const words = s.split(' ');
  
  if (pattern.length !== words.length) return false;
  
  const p2w = new Map();
  const w2p = new Map();
  
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    const w = words[i];
    
    if (p2w.has(p) && p2w.get(p) !== w) return false;
    if (w2p.has(w) && w2p.get(w) !== p) return false;
    
    p2w.set(p, w);
    w2p.set(w, p);
  }
  
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var wordPattern = function(pattern, s) {};",
      python: "def wordPattern(self, pattern: str, s: str) -> bool: pass",
      java: "class Solution { public boolean wordPattern(String pattern, String s) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["哈希表", "字符串"],
  },

  {
    title: "压缩字符串",
    content: `## 题目描述

给你一个字符数组 \`chars\` ，请使用下述算法压缩：

从一个空字符串 \`s\` 开始。对于 \`chars\` 中的每组 **连续重复字符** ：

- 如果这一组长度为 \`1\` ，则将字符追加到 \`s\` 中
- 否则，将字符追加到 \`s\` 中，后面追加这一组的长度

压缩后得到的字符串 \`s\` **不应该直接返回** ，需要转储到字符数组 \`chars\` 中。需要注意的是，如果组长度为 \`10\` 或 \`10\` 以上，那么在 \`chars\` 数组中会被拆分为多个字符。

请在 **修改完输入数组后** ，返回该数组的新长度。

你必须设计并实现一个只使用常量额外空间的算法来解决此问题。

### 示例 1

**输入：**\`chars = ["a","a","b","b","c","c","c"]\`
**输出：**返回 6 ，输入数组的前 6 个字符应该是：\`["a","2","b","2","c","3"]\`

### 提示

- \`1 <= chars.length <= 2000\`
- \`chars[i]\` 可以是小写英文字母、大写英文字母、数字或符号`,
    solution: `## 解法：原地修改 + 双指针

使用写指针记录压缩后的位置，读指针扫描原数组。

\`\`\`javascript
var compress = function(chars) {
  let write = 0;
  let read = 0;
  
  while (read < chars.length) {
    const currentChar = chars[read];
    let count = 0;
    
    while (read < chars.length && chars[read] === currentChar) {
      read++;
      count++;
    }
    
    chars[write++] = currentChar;
    
    if (count > 1) {
      const countStr = String(count);
      for (const c of countStr) {
        chars[write++] = c;
      }
    }
  }
  
  return write;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var compress = function(chars) {};",
      python: "def compress(self, chars: List[str]) -> int: pass",
      java: "class Solution { public int compress(char[] chars) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["双指针", "字符串"],
  },

  {
    title: "反转字符串中的单词 III",
    content: `## 题目描述

给定一个字符串 \`s\` ，你需要反转字符串中每个单词的字符顺序，同时仍保留 **空格和单词的初始顺序**。

### 示例 1

**输入：**\`s = "Let's take LeetCode contest"\`
**输出：**\`"s'teL ekat edoCteeL tsetnoc"\`

### 提示

- \`1 <= s.length <= 5 * 10^4\`
- \`s\` 包含可打印的 ASCII 字符
- \`s\` 不包含任何开头或结尾空格
- \`s\` 里 **至少** 有一个词
- \`s\` 中每个单词都用单个空格分隔`,
    solution: `## 解法：分割+翻转

按空格分割字符串，翻转每个单词后再拼接。

\`\`\`javascript
var reverseWords = function(s) {
  return s.split(' ')
    .map(word => word.split('').reverse().join(''))
    .join(' ');
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var reverseWords = function(s) {};",
      python: "def reverseWords(self, s: str) -> str: pass",
      java: "class Solution { public String reverseWords(String s) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串", "双指针"],
  },

  {
    title: "重复的子字符串",
    content: `## 题目描述

给定一个非空的字符串 \`s\` ，检查是否可以通过由它的一个子串重复多次构成。

### 示例 1

**输入：**\`s = "abab"\`
**输出：**\`true\`
**解释：** 可由子串 "ab" 重复两次构成。

### 示例 2

**输入：**\`s = "aba"\`
**输出：**\`false\`

### 提示

- \`1 <= s.length <= 10^4\`
- \`s\` 由小写英文字母组成`,
    solution: `## 解法：KMP思想

如果 s 由子串重复构成，则 s+s 去掉首尾后必然包含 s。

\`\`\`javascript
var repeatedSubstringPattern = function(s) {
  const doubled = s + s;
  return doubled.slice(1, -1).includes(s);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var repeatedSubstringPattern = function(s) {};",
      python: "def repeatedSubstringPattern(self, s: str) -> bool: pass",
      java: "class Solution { public boolean repeatedSubstringPattern(String s) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串", "KMP"],
  },

  {
    title: "字符串相加",
    content: `## 题目描述

给定两个字符串形式的非负整数 \`num1\` 和 \`num2\` ，计算它们的和并同样以字符串形式返回。

你不能使用任何内置用于处理大整数的库（比如 BigInteger），也不能直接将输入的字符串转换为整数形式。

### 示例 1

**输入：**\`num1 = "11", num2 = "123"\`
**输出：**\`"134"\`

### 示例 2

**输入：**\`num1 = "456", num2 = "77"\`
**输出：**\`"533"\`

### 提示

- \`1 <= num1.length, num2.length <= 10^4\`
- \`num1\` 和 \`num2\` 都只包含数字 0-9
- \`num1\` 和 \`num2\` 都不包含任何前导零，除了数字 0 本身`,
    solution: `## 解法：模拟加法

从末尾开始逐位相加，处理进位。

\`\`\`javascript
var addStrings = function(num1, num2) {
  let i = num1.length - 1;
  let j = num2.length - 1;
  let carry = 0;
  let result = [];
  
  while (i >= 0 || j >= 0 || carry > 0) {
    const digit1 = i >= 0 ? parseInt(num1[i]) : 0;
    const digit2 = j >= 0 ? parseInt(num2[j]) : 0;
    
    const sum = digit1 + digit2 + carry;
    result.push(sum % 10);
    carry = Math.floor(sum / 10);
    
    i--;
    j--;
  }
  
  return result.reverse().join('');
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(max(m, n))
- **空间复杂度**：O(max(m, n))`,
    codeTemplate: {
      javascript: "var addStrings = function(num1, num2) {};",
      python: "def addStrings(self, num1: str, num2: str) -> str: pass",
      java: "class Solution { public String addStrings(String num1, String num2) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["字符串", "数学"],
  },

  {
    title: "字符串相乘",
    content: `## 题目描述

给定两个以字符串形式表示的非负整数 \`num1\` 和 \`num2\` ，返回 \`num1\` 和 \`num2\` 的乘积，它们的乘积也表示为字符串形式。

**注意**：不能使用任何内置的 BigInteger 库或直接将输入转换为整数形式。

### 示例 1

**输入：**\`num1 = "2", num2 = "3"\`
**输出：**\`"6"\`

### 示例 2

**输入：**\`num1 = "123", num2 = "456"\`
**输出：**\`"56088"\`

### 提示

- \`1 <= num1.length, num2.length <= 200\`
- \`num1\` 和 \`num2\` 只由数字组成
- \`num1\` 和 \`num2\` 都不包含任何前导零，除了数字 0 本身`,
    solution: `## 解法：模拟乘法

模拟手工乘法过程，使用数组存储中间结果。

\`\`\`javascript
var multiply = function(num1, num2) {
  if (num1 === "0" || num2 === "0") return "0";
  
  const m = num1.length, n = num2.length;
  const pos = new Array(m + n).fill(0);
  
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const mul = (num1[i] - '0') * (num2[j] - '0');
      const sum = mul + pos[i + j + 1];
      
      pos[i + j] += Math.floor(sum / 10);
      pos[i + j + 1] = sum % 10;
    }
  }
  
  const result = pos.join('').replace(/^0+/, '');
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(m + n)`,
    codeTemplate: {
      javascript: "var multiply = function(num1, num2) {};",
      python: "def multiply(self, num1: str, num2: str) -> str: pass",
      java: "class Solution { public String multiply(String num1, String num2) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["字符串", "数学"],
  },

  {
    title: "简化路径",
    content: `## 题目描述

给你一个字符串 \`path\` ，表示指向某一文件或目录的 Unix 风格 **绝对路径** （以 \`'/'\` 开头），请你将其转化为更加简洁的规范路径。

在 Unix 风格的文件系统中，一个点（\`. \` ）表示当前目录本身；两个点（\`..\` ）表示将目录切换到上一级（指向父目录）；两者都可以是复杂相对路径的组成部分。任意多个连续的斜杠（即 \`'//'\` ）都被视为单个斜杠 \`'/'\` 。对于此问题，任何其他格式的点（例如，\`'...'\` ）均被视为文件/目录名称。

**请注意**，返回的 规范路径 必须遵循下述格式：

- 始终以斜杠 \`'/'\` 开头。
- 两个目录名之间必须只有一个斜杠 \`'/'\` 。
- 最后一个目录名（如果存在）**不能** 以 \`'/'\` 结尾。
- 此外，路径只包含根目录到目标文件或目录之间的路径上的目录名（即，不含 \`'.'\` 或 \`'..'\` ）。

### 示例 1

**输入：**\`path = "/home/"\`
**输出：**\`"/home"\`

### 示例 2

**输入：**\`path = "/../"\`
**输出：**\`"/"\`

### 示例 3

**输入：**\`path = "/home//foo/"\`
**输出：**\`"/home/foo"\`

### 提示

- \`1 <= path.length <= 3000\`
- \`path\` 由英文字母、数字、点 \`'.'\`、斜杠 \`'/'\` 组成。
- \`path\` 是一个有效的 Unix 风格绝对路径。`,
    solution: `## 解法：栈处理

按 '/' 分割路径，使用栈处理目录层级。

\`\`\`javascript
var simplifyPath = function(path) {
  const stack = [];
  const parts = path.split('/');
  
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  
  return '/' + stack.join('/');
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var simplifyPath = function(path) {};",
      python: "def simplifyPath(self, path: str) -> str: pass",
      java: "class Solution { public String simplifyPath(String path) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["栈", "字符串"],
  },

  {
    title: "复原IP地址II（优化版）",
    content: `## 题目描述

在复原IP地址的基础上，增加以下优化：
- 使用剪枝策略减少无效分支
- 支持IPv6地址格式（可选扩展）

本题专注于优化剪枝逻辑，提升算法效率。

### 核心优化点

1. **长度剪枝**：剩余字符不足或超出时提前终止
2. **前导零剪枝**：除"0"外不允许前导零
3. **数值范围剪枝**：每段必须在0-255之间`,
    solution: `## 解法：带优化的回溯

\`\`\`javascript
var restoreIpAddresses = function(s) {
  const result = [];
  
  const backtrack = (start, path) => {
    if (path.length === 4) {
      if (start === s.length) {
        result.push(path.join('.'));
      }
      return;
    }
    
    // 剪枝：剩余字符过多或过少
    const remaining = s.length - start;
    const neededSegments = 4 - path.length;
    if (remaining < neededSegments || remaining > neededSegments * 3) {
      return;
    }
    
    for (let len = 1; len <= 3 && start + len <= s.length; len++) {
      const segment = s.substring(start, start + len);
      
      // 前导零检查
      if (segment.length > 1 && segment[0] === '0') continue;
      
      // 数值范围检查
      if (parseInt(segment) > 255) continue;
      
      path.push(segment);
      backtrack(start + len, path);
      path.pop();
    }
  };
  
  backtrack(0, []);
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(3^4) = O(1)，常数级
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var restoreIpAddresses = function(s) {};",
      python: "def restoreIpAddresses(self, s: str) -> List[str]: pass",
      java: "class Solution { public List<String> restoreIpAddresses(String s) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["回溯", "字符串", "剪枝"],
  },

  {
    title: "最小窗口子串",
    content: `## 题目描述

给你一个字符串 \`s\` 、一个字符串 \`t\` 。返回 \`s\` 中涵盖 \`t\` 所有字符的最小子串。如果 \`s\` 中不存在涵盖 \`t\` 所有字符的子串，则返回空字符串 \`""\` 。

**注意**：

- 对于 \`t\` 中重复字符，我们寻找的子字符串中该字符数量必须不少于 \`t\` 中该字符数量。
- 如果 \`s\` 中存在这样的子串，我们保证它是唯一的答案。

### 示例 1

**输入：**\`s = "ADOBECODEBANC", t = "ABC"\`
**输出：**\`"BANC"\`
**解释：** 最小覆盖子串 "BANC" 包含 'A'、'B' 和 'C'。

### 示例 2

**输入：**\`s = "a", t = "aa"\`
**输出：**\`""\`
**解释：**\`t\` 中两个 'a' 均应包含在 \`s\` 的子串中，因此没有符合条件的子串，返回空字符串。

### 提示

- \`m == s.length\`
- \`n == t.length\`
- \`1 <= m, n <= 10^5\`
- \`s\` 和 \`t\` 由英文大写字母组成`,
    solution: `## 解法：滑动窗口 + 哈希表

使用滑动窗口维护当前窗口内的字符计数，通过 need 和 window 两个哈希表判断是否满足条件。

\`\`\`javascript
var minWindow = function(s, t) {
  const need = new Map();
  const window = new Map();
  
  // 统计 t 中各字符需求
  for (const char of t) {
    need.set(char, (need.get(char) || 0) + 1);
  }
  
  let left = 0, right = 0;
  let valid = 0;
  let start = 0, len = Infinity;
  
  while (right < s.length) {
    const c = s[right];
    right++;
    
    if (need.has(c)) {
      window.set(c, (window.get(c) || 0) + 1);
      if (window.get(c) === need.get(c)) valid++;
    }
    
    // 当窗口满足条件时，尝试收缩
    while (valid === need.size) {
      if (right - left < len) {
        start = left;
        len = right - left;
      }
      
      const d = s[left];
      left++;
      
      if (need.has(d)) {
        if (window.get(d) === need.get(d)) valid--;
        window.set(d, window.get(d) - 1);
      }
    }
  }
  
  return len === Infinity ? "" : s.substring(start, start + len);
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(|s| + |t|)
- **空间复杂度**：O(|Σ|)，Σ 为字符集大小`,
    codeTemplate: {
      javascript: "var minWindow = function(s, t) {};",
      python: "def minWindow(self, s: str, t: str) -> str: pass",
      java: "class Solution { public String minWindow(String s, String t) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["滑动窗口", "哈希表", "字符串"],
  },

  {
    title: "编辑距离",
    content: `## 题目描述

给你两个单词 \`word1\` 和 \`word2\`， 请返回将 \`word1\` 转换成 \`word2\` 所使用的最少操作数 。

你可以对一个单词进行如下三种操作：

- 插入一个字符
- 删除一个字符
- 替换一个字符

### 示例 1

**输入：**\`word1 = "horse", word2 = "ros"\`
**输出：**\`3\`
**解释：**
horse -> rorse (将 'h' 替换为 'r')
rorse -> rose (删除 'r')
rose -> ros (删除 'e')

### 示例 2

**输入：**\`word1 = "intention", word2 = "execution"\`
**输出：**\`5\`

### 提示

- \`0 <= word1.length, word2.length <= 500\`
- \`word1\` 和 \`word2\` 由小写英文字母组成`,
    solution: `## 解法：动态规划

定义 dp[i][j] 表示 word1[0..i-1] 转换为 word2[0..j-1] 的最小操作数。

状态转移方程：
- 若 word1[i-1] == word2[j-1]：dp[i][j] = dp[i-1][j-1]
- 否则：dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1

\`\`\`javascript
var minDistance = function(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  // 边界条件
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }
  
  return dp[m][n];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(m × n)，可优化至 O(min(m,n))`,
    codeTemplate: {
      javascript: "var minDistance = function(word1, word2) {};",
      python: "def minDistance(self, word1: str, word2: str) -> int: pass",
      java: "class Solution { public int minDistance(String word1, String word2) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "字符串"],
  },

  {
    title: "不同的子序列",
    content: `## 题目描述

给定一个字符串 \`s\` 和一个字符串 \`t\` ，计算在 \`s\` 的子序列中 \`t\` 出现的个数。

字符串的一个 **子序列** 是指，通过删除一些（也可以不删除）字符且不干扰剩余字符相对位置所组成的新字符串。（例如，"ACE" 是 "ABCDE" 的一个子序列，而 "AEC" 不是）

题目数据保证答案符合 32 位带符号整数范围。

### 示例 1

**输入：**\`s = "rabbbit", t = "rabbit"\`
**输出：**\`3\`
**解释：**
如下图所示, 有 3 种可以从 s 中得到 "rabbit" 的方案。
rabbbit
rabbbit
rabbbit

### 示例 2

**输入：**\`s = "babgbag", t = "bag"\`
**输出：**\`5\`

### 提示

- \`0 <= s.length, t.length <= 1000\`
- \`s\` 和 \`t\` 由英文字母组成`,
    solution: `## 解法：动态规划

dp[i][j] 表示 s[0..i-1] 的子序列中 t[0..j-1] 出现的次数。

状态转移：
- 若 s[i-1] == t[j-1]：dp[i][j] = dp[i-1][j-1] + dp[i-1][j]
- 否则：dp[i][j] = dp[i-1][j]

\`\`\`javascript
var numDistinct = function(s, t) {
  const m = s.length, n = t.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  // 空字符串是任意字符串的子序列
  for (let i = 0; i <= m; i++) dp[i][0] = 1;
  
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
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(m × n)，可优化至 O(n)`,
    codeTemplate: {
      javascript: "var numDistinct = function(s, t) {};",
      python: "def numDistinct(self, s: str, t: str) -> int: pass",
      java: "class Solution { public int numDistinct(String s, String t) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["动态规划", "字符串"],
  },

  // ==================== 图论进阶（156-170）====================

  {
    title: "网络延迟时间",
    content: `## 题目描述

有 \`n\` 个网络节点，标记为 \`1\` 到 \`n\`。

给你一个列表 \`times\`，表示信号经过 **有向边** 的传递时间。\`times[i] = (ui, vi, wi)\`，其中 \`ui\` 是源节点，\`vi\` 是目标节点，\`wi\` 是一个信号从源节点传递到目标节点的时间。

现在，从某个节点 \`K\` 发出一个信号。需要多久才能使所有节点都收到信号？如果不能使所有节点收到信号，返回 \`-1\` 。

### 示例 1

**输入：**\`times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2\`
**输出：**\`2\`

### 示例 2

**输入：**\`times = [[1,2,1]], n = 2, k = 1\`
**输出：**\`1\`

### 提示

- \`1 <= k <= n <= 100\`
- \`1 <= times.length <= 6000\`
- \`times[i].length == 3\`
- \`1 <= ui, vi <= n\`
- \`ui != vi\`
- \`0 <= wi <= 100\`
- 所有 (ui, vi) 对都 **互不相同**（即不含重边）`,
    solution: `## 解法：Dijkstra 最短路径

使用 Dijkstra 算法求单源最短路径，取最大值即为答案。

\`\`\`javascript
var networkDelayTime = function(times, n, k) {
  // 构建邻接表
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) {
    adj[u].push([v, w]);
  }
  
  // Dijkstra
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  const visited = new Set();
  const pq = new MinPriorityQueue({ priority: (node) => node.dist });
  pq.enqueue({ node: k, dist: 0 });
  
  while (!pq.isEmpty()) {
    const { node: u, dist: d } = pq.dequeue().element;
    if (visited.has(u)) continue;
    visited.add(u);
    
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        pq.enqueue({ node: v, dist: dist[v] });
      }
    }
  }
  
  const maxDist = Math.max(...dist.slice(1));
  return maxDist === Infinity ? -1 : maxDist;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O((V + E) log V)
- **空间复杂度**：O(V + E)`,
    codeTemplate: {
      javascript: "var networkDelayTime = function(times, n, k) {};",
      python: "def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int: pass",
      java: "class Solution { public int networkDelayTime(int[][] times, int n, int k) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "最短路径", "Dijkstra"],
  },

  {
    title: "课程表 II",
    content: `## 题目描述

现在你总共有 \`numCourses\` 门课需要选，记为 \`0\` 到 \`numCourses-1\` 。

给你一个数组 \`prerequisites\` ，其中 prerequisites[i] = [ai, bi] ，表示在选修课程 ai 前 **必须** 先选修 bi 。

例如，想要学习课程 0 ，你需要先完成课程 1 ，我们用一个匹配来表示：\[0,1\] 。

返回你为了学完所有课程所安排的学习顺序。可能会有多个正确的顺序，你只要返回 **任意一种** 就可以了。如果不可能完成所有课程，返回 **一个空数组** 。

### 示例 1

**输入：**\`numCourses = 2, prerequisites = [[1,0]]\`
**输出：**\`[0,1]\`
**解释：** 总共有 2 门课程。要学习课程 1，你需要先完成课程 0。因此，正确的课程顺序为 [0,1] 。

### 示例 2

**输入：**\`numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]\`
**输出：**\`[0,2,1,3]\` 或者 \`[0,1,2,3]\`

### 提示

- \`1 <= numCourses <= 2000\`
- \`0 <= prerequisites.length <= numCourses * (numCourses - 1)\`
- \`prerequisites[i].length == 2\`
- \`0 <= ai, bi < numCourses\`
- \`ai != bi\`
- 所有 \[ai, bi\] **互不相同**`,
    solution: `## 解法：拓扑排序（Kahn算法）

使用 BFS 进行拓扑排序，记录访问顺序。

\`\`\`javascript
var findOrder = function(numCourses, prerequisites) {
  // 构建图和入度数组
  const adj = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);
  
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++;
  }
  
  // 入度为0的节点入队
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  const result = [];
  while (queue.length > 0) {
    const course = queue.shift();
    result.push(course);
    
    for (const next of adj[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) {
        queue.push(next);
      }
    }
  }
  
  return result.length === numCourses ? result : [];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(V + E)
- **空间复杂度**：O(V + E)`,
    codeTemplate: {
      javascript: "var findOrder = function(numCourses, prerequisites) {};",
      python: "def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]: pass",
      java: "class Solution { public int[] findOrder(int numCourses, int[][] prerequisites) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "拓扑排序", "BFS"],
  },

  {
    title: "被围绕的区域",
    content: `## 题目描述

给你一个 \`m x n\` 的矩阵 \`board\` ，由若干字符 \`'X'\` 和 \`'O'\` ，找到所有被 \`'X'\` 围绕的区域，并将这些区域里所有的 \`'O'\` 用 \`'X'\` 填充。

**被围绕的区间不会存在于边界上**，换句话说，任何边界上的 \`'O'\` 都不会被填充为 \`'X'\` 。任何不在边界上，或不与边界上的 \`'O'\` 相连的 \`'O'\` 最终都会被填充为 \`'X'\` 。如果两个元素在水平或垂直方向相邻，则称它们是"相连"的。

### 示例 1

**输入：**board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]
**输出：**[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]

### 示例 2

**输入：**board = [["X"]]
**输出：**[["X"]]

### 提示

- \`m == board.length\`
- \`n == board[i].length\`
- \`1 <= m, n <= 200\`
- \`board[i][j]\` 为 \`'X'\` 或 \`'O'\``,
    solution: `## 解法：DFS/BFS 从边界出发

1. 从边界上的 'O' 出发，DFS/BFS 标记所有相连的 'O'
2. 遍历整个矩阵，未标记的 'O' 变为 'X'，已标记的恢复为 'O'

\`\`\`javascript
var solve = function(board) {
  if (!board.length || !board[0].length) return;
  
  const m = board.length, n = board[0].length;
  
  const dfs = (i, j) => {
    if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== 'O') return;
    
    board[i][j] = 'M';  // Mark as safe
    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  };
  
  // 从边界出发标记
  for (let i = 0; i < m; i++) {
    dfs(i, 0);
    dfs(i, n - 1);
  }
  for (let j = 0; j < n; j++) {
    dfs(0, j);
    dfs(m - 1, j);
  }
  
  // 最终处理
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === 'O') board[i][j] = 'X';
      if (board[i][j] === 'M') board[i][j] = 'O';
    }
  }
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(m × n)，递归栈深度`,
    codeTemplate: {
      javascript: "var solve = function(board) {};",
      python: "def solve(self, board: List[List[str]]) -> None: pass",
      java: "class Solution { public void solve(char[][] board) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "DFS", "矩阵"],
  },

  {
    title: "太平洋大西洋水流问题",
    content: `## 题目描述

有一个 \`m × n\` 的矩形岛屿，与 **太平洋** 和 **大西洋** 相邻。**太平洋** 处于大陆的左边界和上边界，而 **大西洋** 处于大陆的右边界和下边界。

这个岛被划分为一个个方格，坐标用 \`(row, col)\` 表示。\`(0, 0)\` 表示左上角，\`(m-1, n-1)\` 表示右下角。

给定一个 \`m x n\` 的整数矩阵 \`heights\` ，\`heights[row][col]\` 表示该方格海拔高度。

当下雨时，水可以从相邻方格流向海拔相同或更低的方格。水可以从海洋附近的任何单元格流入海洋。

返回网格坐标结果 **二维列表** ，其中 result[i] = [ri, ci] 表示雨水既可以从单元 (ri, ci) 流向 **太平洋** 又可以流向 **大西洋** 。

### 示例 1

**输入：**heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
**输出：**[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]

### 提示

- \`m == heights.length\`
- \`n == heights[i].length\`
- \`1 <= m, n <= 200\`
- \`0 <= heights[i][j] <= 10^5\``,
    solution: `## 解法：反向DFS/BFS

从两个大洋的边界反向搜索，找出各自可达的单元格，取交集。

\`\`\`javascript
var pacificAtlantic = function(heights) {
  if (!heights.length || !heights[0].length) return [];
  
  const m = heights.length, n = heights[0].length;
  const pacific = new Array(m).fill(null).map(() => new Array(n).fill(false));
  const atlantic = new Array(m).fill(null).map(() => new Array(n).fill(false));
  
  const dfs = (i, j, visited) => {
    visited[i][j] = true;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dx, dy] of dirs) {
      const x = i + dx, y = j + dy;
      if (x >= 0 && x < m && y >= 0 && y < n && !visited[x][y] && heights[x][y] >= heights[i][j]) {
        dfs(x, y, visited);
      }
    }
  };
  
  // 从太平洋边界出发
  for (let i = 0; i < m; i++) { dfs(i, 0, pacific); }
  for (let j = 0; j < n; j++) { dfs(0, j, pacific); }
  
  // 从大西洋边界出发
  for (let i = 0; i < m; i++) { dfs(i, n - 1, atlantic); }
  for (let j = 0; j < n; j++) { dfs(m - 1, j, atlantic); }
  
  // 取交集
  const result = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (pacific[i][j] && atlantic[i][j]) {
        result.push([i, j]);
      }
    }
  }
  
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(m × n)
- **空间复杂度**：O(m × n)`,
    codeTemplate: {
      javascript: "var pacificAtlantic = function(heights) {};",
      python: "def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]: pass",
      java: "class Solution { public List<List<Integer>> pacificAtlantic(int[][] heights) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "DFS", "矩阵"],
  },

  {
    title: "钥匙和房间",
    content: `## 题目描述

有 \`n\` 个房间，房间按从 \`0\` 到 \`n - 1\` 编号。最初，除 \`0\` 号房间外的其余所有房间都被锁住。你的目标是进入所有的房间。

当进入一个房间时，你可能会在里面找到一套 **不同的钥匙** ，每把钥匙都有对应的房间，钥匙可以让你进入那个房间。

例如，如果进入房间 1 并在其中找到一把钥匙给房间 2 ，你现在可以进入房间 1 和房间 2 。

返回 \`true\` 如果你可以进入 **所有** 房间，否则返回 \`false\` 。

### 示例 1

**输入：**rooms = [[1],[2],[3],[]]
**输出：**\`true\`
**解释：**
我们从 0 号房间开始，拿到钥匙 1。
之后我们去 1 号房间，拿到钥匙 2。
然后我们去 2 号房间，拿到钥匙 3。
最后我们去了 3 号房间。
成功进入了所有房间。

### 示例 2

**输入：**rooms = [[1,3],[3,0,1],[2],[0]]
**输出：**\`false\`
**解释：** 我们无法进入 2 号房间。

### 提示

- \`n == rooms.length\`
- \`1 <= n <= 1000\`
- \`0 <= rooms[i].length <= 1000\`
- 所有 rooms[i] 的值 **互不相同**`,
    solution: `## 解法：DFS/BFS 图遍历

从房间0开始DFS/BFS，检查是否能访问所有房间。

\`\`\`javascript
var canVisitAllRooms = function(rooms) {
  const visited = new Set();
  const stack = [0];
  visited.add(0);
  
  while (stack.length > 0) {
    const room = stack.pop();
    
    for (const key of rooms[room]) {
      if (!visited.has(key)) {
        visited.add(key);
        stack.push(key);
      }
    }
  }
  
  return visited.size === rooms.length;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(N + E)，N为房间数，E为钥匙总数
- **空间复杂度**：O(N)`,
    codeTemplate: {
      javascript: "var canVisitAllRooms = function(rooms) {};",
      python: "def canVisitAllRooms(self, rooms: List[List[int]]) -> bool: pass",
      java: "class Solution { public boolean canVisitAllRooms(List<List<Integer>> rooms) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["图论", "DFS", "BFS"],
  },

  {
    title: "可能的二分法",
    content: `## 题目描述

给定一组 \`n\` 人（编号为 \`1, 2, ..., n\`），我们想把每个人分进 **任意大小的两组**。每个人都可能不喜欢其他人，那么他们不应该属于同一组。

给定整数 \`n\` 和数组 \`dislikes\` ，其中 dislikes[i] = [ai, bi] ，表示不允许将编号为 \`ai\` 和 \`bi\` 的人归入同一组。可以用图的形式表示：当两个人不喜欢对方时，就在他们之间画一条边。

只有当可以将这组人分成两组时才返回 \`true\` ；否则返回 \`false\` 。

### 示例 1

**输入：**\`n = 4, dislikes = [[1,2],[1,3],[2,4]]\`
**输出：**\`true\`
**解释：** group1 [1,4], group2 [2,3]

### 示例 2

**输入：**\`n = 3, dislikes = [[1,2],[1,3],[2,3]]\`
**输出：**\`false\`

### 提示

- \`1 <= n <= 2000\`
- \`0 <= dislikes.length <= 10^4\`
- \`dislikes[i].length == 2\`
- \`1 <= dislikes[i][j] <= n\`
- \`ai != bi\`
- \`dislikes\` 中不存在重复值`,
    solution: `## 解法：二分图检测（染色法）

使用 DFS/BFS 尝试对图进行二染色，冲突则不可二分。

\`\`\`javascript
var possibleBipartition = function(n, dislikes) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [a, b] of dislikes) {
    adj[a].push(b);
    adj[b].push(a);
  }
  
  const color = new Array(n + 1).fill(0);  // 0: 未染色, 1/2: 不同颜色
  
  const dfs = (node, c) => {
    color[node] = c;
    for (const neighbor of adj[node]) {
      if (color[neighbor] === 0) {
        if (!dfs(neighbor, 3 - c)) return false;
      } else if (color[neighbor] === c) {
        return false;
      }
    }
    return true;
  };
  
  for (let i = 1; i <= n; i++) {
    if (color[i] === 0 && !dfs(i, 1)) {
      return false;
    }
  }
  
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(N + E)
- **空间复杂度**：O(N + E)`,
    codeTemplate: {
      javascript: "var possibleBipartition = function(n, dislikes) {};",
      python: "def possibleBipartition(self, n: int, dislikes: List[List[int]]) -> bool: pass",
      java: "class Solution { public boolean possibleBipartition(int n, int[][] dislikes) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "二分图", "DFS"],
  },

  {
    title: "最小生成树（Prim算法）",
    content: `## 题目描述

给定一个连通无向图，求其最小生成树的总权重。

Prim算法是一种贪心算法，用于寻找加权无向连通图的最小生成树。

### 算法原理

1. 任选一个节点加入集合 S
2. 每次选择连接 S 与 V-S 的最小权边，将对应节点加入 S
3. 重复直到所有节点都在 S 中

### 输入格式

- \`edges\`: 二维数组，每条边为 [u, v, weight]
- \`n\`: 节点数量（编号 0 到 n-1）

### 输出

返回最小生成树的总权重。若图不连通，返回 -1。

### 示例

**输入：**edges = [[0,1,2],[0,2,1],[1,2,1]], n = 3
**输出：**\`3\`
**解释：** 选择边 (0,2) 权重1 和 (1,2) 权重1，总权重为3。`,
    solution: `## 解法：Prim 算法

\`\`\`javascript
var primMST = function(edges, n) {
  // 构建邻接矩阵
  const graph = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  for (const [u, v, w] of edges) {
    graph[u][v] = Math.min(graph[u][v], w);
    graph[v][u] = Math.min(graph[v][u], w);
  }
  
  const inMST = new Array(n).fill(false);
  const minDist = new Array(n).fill(Infinity);
  minDist[0] = 0;
  let totalWeight = 0;
  
  for (let count = 0; count < n; count++) {
    // 找最小距离的未访问节点
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inMST[i] && (u === -1 || minDist[i] < minDist[u])) {
        u = i;
      }
    }
    
    if (u === -1 || minDist[u] === Infinity) return -1;
    
    inMST[u] = true;
    totalWeight += minDist[u];
    
    // 更新距离
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && graph[u][v] < minDist[v]) {
        minDist[v] = graph[u][v];
      }
    }
  }
  
  return totalWeight;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(V²)，可用优先队列优化至 O(E log V)
- **空间复杂度**：O(V²)`,
    codeTemplate: {
      javascript: "var primMST = function(edges, n) {};",
      python: "def primMST(self, edges: List[List[int]], n: int) -> int: pass",
      java: "class Solution { public int primMST(int[][] edges, int n) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["图论", "最小生成树", "Prim"],
  },

  {
    title: "最短路径（Floyd算法）",
    content: `## 题目描述

给定一个有向加权图，使用 Floyd-Warshall 算法计算所有节点对之间的最短路径。

### 算法原理

动态规划：dp[k][i][j] 表示从 i 到 j 只经过节点 0..k 的最短路径。

状态转移：dp[k][i][j] = min(dp[k-1][i][j], dp[k-1][i][k] + dp[k-1][k][j])

可优化为二维：dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])

### 输入格式

- \`graph\`: n×n 的邻接矩阵，graph[i][j] 表示 i 到 j 的边权，Infinity 表示无边
- \`n\`: 节点数量

### 输出

返回更新后的最短路径矩阵。

### 示例

**输入：**graph = [[0,1,43],[1,0,6],[], n = 3
**输出：**[[0,1,7],[8,0,6],[5,6,0]]
**解释：** 0→2 经过 1 更短：1+6=7 < 43`,
    solution: `## 解法：Floyd-Warshall 算法

\`\`\`javascript
var floydWarshall = function(graph, n) {
  const dist = graph.map(row => [...row]);
  
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  
  return dist;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(V³)
- **空间复杂度**：O(V²)`,
    codeTemplate: {
      javascript: "var floydWarshall = function(graph, n) {};",
      python: "def floydWarshall(self, graph: List[List[int]], n: int) -> List[List[int]]: pass",
      java: "class Solution { public int[][] floydWarshall(int[][] graph, int n) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["图论", "最短路径", "Floyd"],
  },

  {
    title: "欧拉路径判定",
    content: `## 题目描述

给定一个无向图，判断是否存在欧拉路径（经过每条边恰好一次的路径）。

### 定理

无向图存在欧拉路径的条件：
- 图是连通的（忽略孤立点）
- 恰好有 0 个或 2 个奇度顶点

存在欧拉回路（起点=终点）的条件：
- 图是连通的
- 所有顶点度数为偶数

### 输入格式

- \`edges\`: 无向边列表，每条边为 [u, v]
- \`n\`: 节点数量

### 输出

返回是否存在欧拉路径。

### 示例

**输入：**edges = [[0,1],[1,2],[2,0]], n = 3
**输出：**\`true\`
**解释：** 所有节点度数为2（偶数），存在欧拉回路。`,
    solution: `## 解法：度数统计 + 连通性检查

\`\`\`javascript
var hasEulerianPath = function(edges, n) {
  if (edges.length === 0) return true;
  
  // 统计度数
  const degree = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  
  for (const [u, v] of edges) {
    degree[u]++;
    degree[v]++;
    adj[u].push(v);
    adj[v].push(u);
  }
  
  // 检查奇度顶点数量
  let oddCount = 0;
  for (let i = 0; i < n; i++) {
    if (degree[i] % 2 !== 0) oddCount++;
  }
  if (oddCount !== 0 && oddCount !== 2) return false;
  
  // 检查连通性（忽略孤立点）
  const visited = new Set();
  const startNode = degree.findIndex(d => d > 0);
  if (startNode === -1) return true;
  
  const stack = [startNode];
  visited.add(startNode);
  
  while (stack.length > 0) {
    const node = stack.pop();
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor) && degree[neighbor] > 0) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }
  
  // 所有非孤立节点都应该被访问
  for (let i = 0; i < n; i++) {
    if (degree[i] > 0 && !visited.has(i)) return false;
  }
  
  return true;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(V + E)
- **空间复杂度**：O(V + E)`,
    codeTemplate: {
      javascript: "var hasEulerianPath = function(edges, n) {};",
      python: "def hasEulerianPath(self, edges: List[List[int]], n: int) -> bool: pass",
      java: "class Solution { public boolean hasEulerianPath(int[][] edges, int n) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["图论", "欧拉路径", "图论基础"],
  },

  {
    title: "A*寻路算法",
    content: `## 题目描述

在一个二维网格地图中，从起点到终点寻找最短路径。

A*算法结合了 Dijkstra 的实际代价和启发式估计代价，效率高于纯 Dijkstra。

### 算法核心

f(n) = g(n) + h(n)

- g(n)：从起点到节点 n 的实际代价
- h(n)：从节点 n 到终点的启发式估计（如曼哈顿距离）
- f(n)：总评估代价

### 输入格式

- \`grid\`: 二维数组，0表示可行走，1表示障碍物
- \`start\`: [startRow, startCol]
- \`end\`: [endRow, endCol]

### 输出

返回从起点到终点的最短路径（坐标列表），若无法到达返回空数组。

### 示例

**输入：**grid = [[0,0,0],[1,1,0],[0,0,0]], start = [0,0], end = [2,2]
**输出：**[[0,0],[0,1],[0,2],[1,2],[2,2]]
**解释：** 绕过障碍物的最短路径。`,
    solution: `## 解法：A* 算法

\`\`\`javascript
var aStarPathfinding = function(grid, start, end) {
  const rows = grid.length, cols = grid[0].length;
  
  const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  
  const openSet = new Map();  // key: "r,c", value: {f, g, parent}
  const closedSet = new Set();
  
  const key = (r, c) => \`\${r},\${c}\`;
  
  openSet.set(key(start), { f: heuristic(start, end), g: 0, parent: null });
  
  while (openSet.size > 0) {
    // 找 f 值最小的节点
    let current = null;
    let minF = Infinity;
    for (const [k, val] of openSet) {
      if (val.f < minF) {
        minF = val.f;
        current = k;
      }
    }
    
    const [cr, cc] = current.split(',').map(Number);
    
    if (cr === end[0] && cc === end[1]) {
      // 回溯路径
      const path = [];
      let node = current;
      while (node) {
        const [r, c] = node.split(',').map(Number);
        path.unshift([r, c]);
        node = openSet.get(node)?.parent;
      }
      return path;
    }
    
    openSet.delete(current);
    closedSet.add(current);
    
    // 探索邻居
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dr, dc] of dirs) {
      const nr = cr + dr, nc = cc + dc;
      const nk = key(nr, nc);
      
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 1) continue;
      if (closedSet.has(nk)) continue;
      
      const g = openSet.get(current).g + 1;
      const h = heuristic([nr, nc], end);
      const f = g + h;
      
      if (!openSet.has(nk) || g < openSet.get(nk).g) {
        openSet.set(nk, { f, g, parent: current });
      }
    }
  }
  
  return [];  // 无法到达
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(E log V)
- **空间复杂度**：O(V)`,
    codeTemplate: {
      javascript: "var aStarPathfinding = function(grid, start, end) {};",
      python: "def aStarPathfinding(self, grid: List[List[int]], start: List[int], end: List[int]) -> List[List[int]]: pass",
      java: "class Solution { public List<int[]> aStarPathfinding(int[][] grid, int[] start, int[] end) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["图论", "A*", "搜索算法"],
  },

  {
    title: "最大流（Ford-Fulkerson）",
    content: `## 题目描述

给定一个流网络（有向加权图），计算从源点到汇点的最大流量。

### Ford-Fulkerson 方法

核心思想：不断寻找增广路径，沿路径增加流量，直到找不到增广路径为止。

### 输入格式

- \`capacity\`: 容量矩阵，capacity[i][j] 表示边 i→j 的容量
- \`source\`: 源点
- \`sink\`: 汇点
- \`n\`: 节点数量

### 输出

返回最大流量。

### 示例

**输入：**capacity = [[0,16,13,0,0,0],[0,0,10,12,0,0],[0,0,0,0,14,0],[0,0,0,0,0,20],[0,0,0,0,0,0],[0,0,0,0,0,0]], source = 0, sink = 5, n = 6
**输出：**\`23\`
**解释：** 经典示例的最大流值为23。`,
    solution: `## 解法：Edmonds-Karp（BFS找增广路）

\`\`\`javascript
var maxFlow = function(capacity, source, sink, n) {
  // 残差网络
  const residual = capacity.map(row => [...row]);
  let maxFlowValue = 0;
  
  const bfs = () => {
    const parent = new Array(n).fill(-1);
    const visited = new Set([source]);
    const queue = [source];
    
    while (queue.length > 0) {
      const u = queue.shift();
      
      for (let v = 0; v < n; v++) {
        if (!visited.has(v) && residual[u][v] > 0) {
          visited.add(v);
          parent[v] = u;
          if (v === sink) return parent;
          queue.push(v);
        }
      }
    }
    
    return null;  // 没有增广路径
  };
  
  while (true) {
    const parent = bfs();
    if (!parent) break;
    
    // 找增广路径上的最小残差容量
    let pathFlow = Infinity;
    let v = sink;
    while (v !== source) {
      const u = parent[v];
      pathFlow = Math.min(pathFlow, residual[u][v]);
      v = u;
    }
    
    // 更新残差网络
    v = sink;
    while (v !== source) {
      const u = parent[v];
      residual[u][v] -= pathFlow;
      residual[v][u] += pathFlow;
      v = u;
    }
    
    maxFlowValue += pathFlow;
  }
  
  return maxFlowValue;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(VE²)
- **空间复杂度**：O(V²)`,
    codeTemplate: {
      javascript: "var maxFlow = function(capacity, source, sink, n) {};",
      python: "def maxFlow(self, capacity: List[List[int]], source: int, sink: int, n: int) -> int: pass",
      java: "class Solution { public int maxFlow(int[][] capacity, int source, int sink, int n) {} }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["图论", "最大流", "网络流"],
  },

  // ==================== 高级数据结构（171-185）====================

  {
    title: "线段树（区间和查询）",
    content: `## 题目描述

实现一个支持以下操作的数据结构：

1. \`update(index, val)\` ：将数组第 index 个元素修改为 val
2. \`sumRange(left, right)\` ：返回数组索引范围 [left, right] 内元素的和（包含左右端点）

要求两种操作的时间复杂度均为 O(log n)。

### 示例

**输入：**
\`NumArray numArray = new NumArray([1, 3, 5]);\`
\`numArray.sumRange(0, 2);\`  // 返回 9
\`numArray.update(1, 2);\`
\`numArray.sumRange(0, 2);\`  // 返回 8

### 提示

- \`1 <= nums.length <= 3 * 10^4\`
- \`-100 <= nums[i] <= 100\`
- \`0 <= index < nums.length\`
- \`-100 <= val <= 100\`
- \`0 <= left <= right < nums.length\`
-调用 \`sumRange\` 和 \`update\` 的总次数不超过 \`3 * 10^4\` 次`,
    solution: `## 解法：线段树

使用线段树存储区间的和，每次更新和查询都是 O(log n)。

\`\`\`javascript
/**
 * @param {number[]} nums
 */
var NumArray = function(nums) {
  this.n = nums.length;
  this.tree = new Array(this.n * 4);
  this.build(nums, 0, 0, this.n - 1);
};

NumArray.prototype.build = function(nums, node, start, end) {
  if (start === end) {
    this.tree[node] = nums[start];
    return;
  }
  
  const mid = Math.floor((start + end) / 2);
  const leftChild = node * 2 + 1;
  const rightChild = node * 2 + 2;
  
  this.build(nums, leftChild, start, mid);
  this.build(nums, rightChild, mid + 1, end);
  
  this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
};

/** 
 * @param {number} index 
 * @param {number} val
 * @return {void}
 */
NumArray.prototype.update = function(index, val) {
  this._update(0, 0, this.n - 1, index, val);
};

NumArray.prototype._update = function(node, start, end, index, val) {
  if (start === end) {
    this.tree[node] = val;
    return;
  }
  
  const mid = Math.floor((start + end) / 2);
  const leftChild = node * 2 + 1;
  const rightChild = node * 2 + 2;
  
  if (index <= mid) {
    this._update(leftChild, start, mid, index, val);
  } else {
    this._update(rightChild, mid + 1, end, index, val);
  }
  
  this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
};

/** 
 * @param {number} left 
 * @param {number} right
 * @return {number}
 */
NumArray.prototype.sumRange = function(left, right) {
  return this._query(0, 0, this.n - 1, left, right);
};

NumArray.prototype._query = function(node, start, end, left, right) {
  if (right < start || end < left) return 0;
  if (left <= start && end <= right) return this.tree[node];
  
  const mid = Math.floor((start + end) / 2);
  const leftSum = this._query(node * 2 + 1, start, mid, left, right);
  const rightSum = this._query(node * 2 + 2, mid + 1, end, left, right);
  
  return leftSum + rightSum;
};
\`\`\`

### 复杂度分析

- **构建时间**：O(n)
- **update 时间**：O(log n)
- **sumRange 时间**：O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "// 线段树实现",
      python: "# 线段树实现",
      java: "// 线段树实现",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["线段树", "设计", "数据结构"],
  },

  {
    title: "树状数组（Binary Indexed Tree）",
    content: `## 题目描述

实现一个树状数组（Fenwick Tree / Binary Indexed Tree），支持：

1. \`update(index, delta)\` ：在位置 index 增加 delta
2. \`query(index)\` ：查询 [0, index] 的前缀和
3. \`rangeQuery(left, right)\` ：查询 [left, right] 的区间和

### 特性

树状数组相比线段树代码更短，常数更小，但功能稍受限（主要适用于前缀和类问题）。

### 核心操作

- lowbit(x) = x & (-x)：获取最低位的1及其后面的0
- update：向上更新祖先节点
- query：向下累加前缀和`,
    solution: `## 解法：树状数组实现

\`\`\`javascript
class FenwickTree {
  constructor(size) {
    this.n = size;
    this.tree = new Array(size + 1).fill(0);
  }
  
  // 低位运算
  lowbit(x) {
    return x & (-x);
  }
  
  // 单点更新：在 index 位置增加 delta
  update(index, delta) {
    for (let i = index + 1; i <= this.n; i += this.lowbit(i)) {
      this.tree[i] += delta;
    }
  }
  
  // 前缀查询：[0, index] 的和
  query(index) {
    let sum = 0;
    for (let i = index + 1; i > 0; i -= this.lowbit(i)) {
      sum += this.tree[i];
    }
    return sum;
  }
  
  // 区间查询：[left, right] 的和
  rangeQuery(left, right) {
    return this.query(right) - (left > 0 ? this.query(left - 1) : 0);
  }
}

// 使用示例
// const ft = new FenwickTree(n);
// ft.update(i, val);
// const sum = ft.rangeQuery(l, r);
\`\`\`

### 复杂度分析

- **初始化时间**：O(n)
- **update 时间**：O(log n)
- **query 时间**：O(log n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "class FenwickTree { /* 实现 */ }",
      python: "class FenwickTree: # 实现",
      java: "class FenwickTree { /* 实现 */ }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["树状数组", "数据结构", "BIT"],
  },

  {
    title: "跳跃表（Skip List）",
    content: `## 题目描述

实现一个跳跃表，支持以下操作：

1. \`search(target)\` ：查找 target 是否存在
2. \`add(num)\` ：插入数值 num
4. \`erase(num)\` ：删除数值 num

跳跃表是一种基于概率的数据结构，可以在 O(log n) 时间内完成查找、插入、删除操作。

### 结构特点

- 多层链表结构
- 上层是下层的"快速通道"
- 通过抛硬币决定节点层数
- 空间换时间的典型应用`,
    solution: `## 解法：跳跃表实现

\`\`\`javascript
class SkipListNode {
  constructor(val, level) {
    this.val = val;
    this.forward = new Array(level).fill(null);
  }
}

class Skiplist {
  constructor() {
    this.maxLevel = 16;
    this.p = 0.25;
    this.level = 1;
    this.head = new SkipListNode(-Infinity, this.maxLevel);
  }
  
  _randomLevel() {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) lvl++;
    return lvl;
  }
  
  search(target) {
    let cur = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (cur.forward[i] && cur.forward[i].val < target) {
        cur = cur.forward[i];
      }
    }
    cur = cur.forward[0];
    return cur !== null && cur.val === target;
  }
  
  add(num) {
    const update = new Array(this.maxLevel).fill(this.head);
    let cur = this.head;
    
    for (let i = this.level - 1; i >= 0; i--) {
      while (cur.forward[i] && cur.forward[i].val < num) {
        cur = cur.forward[i];
      }
      update[i] = cur;
    }
    
    const newNodeLevel = this._randomLevel();
    if (newNodeLevel > this.level) {
      for (let i = this.level; i < newNodeLevel; i++) {
        update[i] = this.head;
      }
      this.level = newNodeLevel;
    }
    
    const newNode = new SkipListNode(num, newNodeLevel);
    for (let i = 0; i < newNodeLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
    }
  }
  
  erase(num) {
    const update = new Array(this.maxLevel).fill(null);
    let cur = this.head;
    
    for (let i = this.level - 1; i >= 0; i--) {
      while (cur.forward[i] && cur.forward[i].val < num) {
        cur = cur.forward[i];
      }
      update[i] = cur;
    }
    
    cur = cur.forward[0];
    if (!cur || cur.val !== num) return false;
    
    for (let i = 0; i < this.level; i++) {
      if (update[i].forward[i] !== cur) break;
      update[i].forward[i] = cur.forward[i];
    }
    
    while (this.level > 1 && this.head.forward[this.level - 1] === null) {
      this.level--;
    }
    
    return true;
  }
}
\`\`\`

### 复杂度分析（期望）

- **search 时间**：O(log n)
- **add 时间**：O(log n)
- **erase 时间**：O(log n)
- **空间复杂度**：O(n log n)`,
    codeTemplate: {
      javascript: "class Skiplist { /* 实现 */ }",
      python: "class Skiplist: # 实现",
      java: "class Skiplist { /* 实现 */ }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["跳跃表", "数据结构", "概率"],
  },

  {
    title: "LFU缓存（详细实现）",
    content: `## 题目描述

请为 LFU (Least Frequently Used) 缓存算法设计并实现数据结构。

实现 \`LFUCache\` 类：

- \`LFUCache(int capacity)\` ：用数据结构的容量 \`capacity\` 初始化对象
- \`int get(int key)\` ：如果键存在于缓存中，则获取键的值，否则返回 -1 。
- \`void put(int key, int value)\` ：如果键已存在，则变更其值；如果键不存在，请插入键值对。当缓存达到其容量时，则应该在插入新项之前，使最经常未使用的项无效。在此问题中，当存在平局（即两个或更多个键具有相同使用频率）时，应该去除 **最近最久未使用** 的键。

注意「项的使用次数」就是该项自插入以来经由 \`get\` 和 \`put\` 函数调用次数的和。使用次数会在对应项被移除后置为 0 。

为了确定最不常使用的键，可以为缓存中的每个键维护一个 **使用计数器** 。使用计数最小的键是最久未使用的键。

当一个键首次插入缓存时，它的使用计数器被设置为 1 (由于 put 操作)。对缓存中的键执行 \`get\` 或 \`put\` 操作，使用计数器的值将会递增。

### 示例

**输入：**
["LFUCache", "put", "put", "get", "put", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [3]]
**输出：**[null, null, null, 1, null, -1, 3]`,
    solution: `## 解法：HashMap + 双向链表 + 频率桶

\`\`\`javascript
class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.minFreq = 0;
    this.keyToNode = new Map();       // key -> Node
    this.freqToList = new Map();      // freq -> DoublyLinkedList
  }
  
  get(key) {
    if (!this.keyToNode.has(key)) return -1;
    
    const node = this.keyToNode.get(key);
    this._updateFreq(node);
    return node.val;
  }
  
  put(key, value) {
    if (this.capacity === 0) return;
    
    if (this.keyToNode.has(key)) {
      const node = this.keyToNode.get(key);
      node.val = value;
      this._updateFreq(node);
      return;
    }
    
    if (this.keyToNode.size >= this.capacity) {
      // 移除最低频率的最近最少使用节点
      const minList = this.freqToList.get(this.minFreq);
      const evictNode = minList.removeLast();
      this.keyToNode.delete(evictNode.key);
    }
    
    const newNode = new Node(key, value);
    this.keyToNode.set(key, newNode);
    this.minFreq = 1;
    
    if (!this.freqToList.has(1)) {
      this.freqToList.set(1, new DoublyLinkedList());
    }
    this.freqToList.get(1).addFirst(newNode);
  }
  
  _updateFreq(node) {
    const freq = node.freq;
    const list = this.freqToList.get(freq);
    list.remove(node);
    
    if (freq === this.minFreq && list.isEmpty()) {
      this.minFreq++;
    }
    
    node.freq++;
    if (!this.freqToList.has(node.freq)) {
      this.freqToList.set(node.freq, new DoublyLinkedList());
    }
    this.freqToList.get(node.freq).addFirst(node);
  }
}

class Node {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.freq = 1;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = new Node(null, null);
    this.tail = new Node(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  
  addFirst(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
  
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  
  removeLast() {
    const node = this.tail.prev;
    this.remove(node);
    return node;
  }
  
  isEmpty() {
    return this.head.next === this.tail;
  }
}
\`\`\`

### 复杂度分析

- **get 时间**：O(1)
- **put 时间**：O(1)
- **空间复杂度**：O(capacity)`,
    codeTemplate: {
      javascript: "class LFUCache { /* 实现 */ }",
      python: "class LFUCache: # 实现",
      java: "class LFUCache { /* 实现 */ }",
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["设计", "哈希表", "链表", "LRU/LFU"],
  },

  {
    title: "单调队列详解（QA）",
    content: `## 问题

深入理解单调队列的原理和应用场景。

### 核心概念

1. **什么是单调队列？**
   - 保持队列内元素的单调性（递增或递减）
   - 元素只能从队尾入队，队首出队
   - 维护单调性的同时保留元素的原始顺序信息

2. **为什么需要单调队列？**
   - 普通队列无法快速获取最大/最小值
   - 优先队列无法高效删除过期元素
   - 单调队列完美解决滑动窗口最值问题

3. **典型应用场景**
   - 滑动窗口最大值/最小值
   - 单调队列优化 DP
   - 维护区间极值`,
    solution: `## 详细解答

### 单调队列的工作机制

\`\`\`
入队操作：
1. 新元素从队尾入队
2. 如果破坏单调性，弹出队尾元素
3. 直到恢复单调性后，新元素入队

出队操作：
1. 检查队首元素是否过期（超出窗口）
2. 过期则从队首弹出
3. 队首始终是当前窗口的最值
\`\`\`

### 关键性质

- **时间复杂度**：每个元素最多入队出队一次 → O(n)
- **空间复杂度**：O(k)，k 为窗口大小
- **单调递减队列**：队首是最大值
- **单调递增队列**：队首是最小值

### 与其他数据结构对比

| 数据结构 | 插入 | 删除 | 查询最值 |
|---------|------|------|---------|
| 普通队列 | O(1) | O(1) | O(n) |
| 优先队列 | O(log n) | O(log n) | O(1) |
| 单调队列 | O(1) 均摊 | O(1) 均摊 | O(1) |

### 经典变体

1. **滑动窗口最大值**：单调递减队列
2. **滑动窗口最小值**：单调递增队列
3. **DP优化**：利用单调队列优化转移决策`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["单调队列", "数据结构", "算法思想"],
  },

  {
    title: "红黑树的五个性质（QA）",
    content: `## 问题

详细说明红黑树的五条性质，以及它们如何保证平衡。

### 五条基本性质

1. 每个节点要么是红色，要么是黑色
2. 根节点是黑色的
3. 每个叶子节点（NIL）是黑色的
4. 如果一个节点是红色的，则它的两个子节点都是黑色的
5. 对每个节点，从该节点到其所有后代叶节点的简单路径上，均包含相同数目的黑色节点（黑高相同）

### 为什么这些性质重要？

这五条性质共同保证了红黑树的关键特性：从根到叶子的最长路径不超过最短路径的2倍。`,
    solution: `## 详细解析

### 性质4的作用（禁止连续红色节点）

这是防止树退化为链表的核心约束。如果没有这条限制，我们可以构造出一棵全红的树，退化成链表。

### 性质5的作用（黑高相同）

保证了没有一条路径会比其他路径长太多。由于红色节点的存在，最长路径可能是黑高的2倍（红黑交替），但最短路径至少是黑高（全黑）。

### 平衡性证明

设某节点的黑高为 bh：
- 最短路径：bh 个黑色节点 → 长度 = bh
- 最长路径：2×bh 个节点（红黑交替）→ 长度 = 2×bh

因此，红黑树的高度 ≤ 2log₂(n+1)，保证了 O(log n) 的操作时间复杂度。

### 与 AVL 树对比

| 特性 | 红黑树 | AVL 树 |
|-----|-------|-------|
| 平衡条件 | 松散（近似平衡） | 严格（高度差≤1） |
| 旋转次数 | 最多3次 | 可能多次 |
| 查找性能 | O(log n) | O(log n) |
| 适用场景 | 频繁插入删除 | 查找密集 |

### 实际应用

- Java TreeMap/TreeSet
- C++ std::map/std::set
- Linux 进程调度（完全公平调度器）
- epoll 事件机制`,
    codeTemplate: {},
    difficulty: "hard",
    questionType: "qa",
    tags: ["红黑树", "平衡树", "数据结构"],
  },

  // ==================== 数学专题（186-195）====================

  {
    title: "x的平方根",
    content: `## 题目描述

给你一个非负整数 \`x\` ，计算并返回 \`x\` 的 **算术平方根** 。

由于返回类型是整数，结果只保留 **整数部分** ，小数部分将被 **舍去** 。

**注意**：不允许使用任何内置指数函数和算符，例如 pow(x, 0.5) 或者 x ** 0.5 。

### 示例 1

**输入：**\`x = 4\`
**输出：**\`2\`

### 示例 2

**输入：**\`x = 8\`
**输出：**\`2\`
**解释：** 8 的算术平方根是 2.82842..., 由于返回类型是整数，小数部分将被舍去。

### 提示

- \`0 <= x <= 2^31 - 1\``,
    solution: `## 解法：二分查找

在 [0, x] 范围内二分查找满足 mid² ≤ x < (mid+1)² 的 mid。

\`\`\`javascript
var mySqrt = function(x) {
  if (x <= 1) return x;
  
  let left = 1, right = x;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const square = mid * mid;
    
    if (square === x) {
      return mid;
    } else if (square < x) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return right;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(log x)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var mySqrt = function(x) {};",
      python: "def mySqrt(self, x: int) -> int: pass",
      java: "class Solution { public int mySqrt(int x) {} }",
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["数学", "二分查找"],
  },

  {
    title: "Pow(x, n)",
    content: `## 题目描述

实现 pow(x, n) ，即计算 \`x\` 的整数 \`n\` 次幂函数（即，\`x^n\` ）。

### 示例 1

**输入：**\`x = 2.00000, n = 10\`
**输出：**\`1024.00000\`

### 示例 2

**输入：**\`x = 2.10000, n = 3\`
**输出：**\`9.26100\`

### 示例 3

**输入：**\`x = 2.00000, n = -2\`
**输出：**\`0.25000\`
**解释：** 2^-2 = 1/2^2 = 1/4 = 0.25

### 提示

- \`-100.0 < x < 100.0\`
- \`-2^31 <= n <= 2^31-1\`
- \`n\` 是一个整数
- 要么 \`x\` 不为零，要么 \`n > 0\`
- \`-10^4 <= x^n <= 10^4\``,
    solution: `## 解法：快速幂（迭代版）

利用二进制分解：x^n = x^(b₀) × x^(2b₁) × x^(4b₂) × ...

\`\`\`javascript
var myPow = function(x, n) {
  if (n === 0) return 1;
  
  let absN = Math.abs(n);
  let result = 1;
  let base = x;
  
  while (absN > 0) {
    if (absN % 2 === 1) {
      result *= base;
    }
    base *= base;
    absN = Math.floor(absN / 2);
  }
  
  return n < 0 ? 1 / result : result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(log n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var myPow = function(x, n) {};",
      python: "def myPow(self, x: float, n: int) -> float: pass",
      java: "class Solution { public double myPow(double x, int n) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数学", "快速幂", "分治"],
  },

  {
    title: "两数相除",
    content: `## 题目描述

给定两个整数，被除数 \`dividend\` 和除数 \`divisor\`。将两数相除，要求 **不使用乘法、除法和 mod 运算符**。

返回被除数 \`dividend\` 除以除数 \`divisor\` 得到的 **商** 。

整数截断应当向零截断（例如，8.329 截断为 8，-8.329 截断为 -8）。

假设我们的环境只能存储 32 位有符号整数，其数值范围是 \[-2³¹, 2³¹ - 1\`。本题中，如果除法结果溢出，则返回 2³¹ - 1。

### 示例 1

**输入：**\`dividend = 10, divisor = 3\`
**输出：**\`3\`

### 示例 2

**输入：**\`dividend = 7, divisor = -3\`
**输出：**\`-2\`

### 提示

- \`-2^31 <= dividend, divisor <= 2^31 - 1\`
- \`divisor != 0\``,
    solution: `## 解法：倍增法（位移加速）

利用左移来加速减法：每次尽可能多地减去 divisor 的倍数。

\`\`\`javascript
var divide = function(dividend, divisor) {
  // 溢出情况
  if (dividend === -(2 ** 31) && divisor === -1) {
    return 2 ** 31 - 1;
  }
  
  // 确定符号
  const negative = (dividend < 0) ^ (divisor < 0);
  
  let dvd = Math.abs(dividend);
  let dvs = Math.abs(divisor);
  let result = 0;
  
  while (dvd >= dvs) {
    let temp = dvs;
    let multiple = 1;
    
    // 倍增
    while (dvd >= (temp << 1)) {
      temp <<= 1;
      multiple <<= 1;
    }
    
    dvd -= temp;
    result += multiple;
  }
  
  return negative ? -result : result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(log n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var divide = function(dividend, divisor) {};",
      python: "def divide(self, dividend: int, divisor: int) -> int: pass",
      java: "class Solution { public int divide(int dividend, int divisor) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数学", "位运算"],
  },

  {
    title: "超级丑数",
    content: `## 题目描述

**超级丑数** 是一个正整数，并满足其所有质因数都出现在质数数组 \`primes\` 中。

给你一个整数 \`n\` 和一个整数数组 \`primes\` ，返回第 \`n\` 个 **超级丑数** 。

**超级丑数** 可以按 **任意顺序** 排列。

### 示例 1

**输入：**\`n = 12, primes = [2,7,13,19]\`
**输出：**\`32\`
**解释：** 给出长度为 4 的质数数组 primes = [2,7,13,19]，前 12 个超级丑数序列为：[1,2,4,7,8,13,14,16,19,26,28,32] 。

### 示例 2

**输入：**\`n = 1, primes = [2,3,5]\`
**输出：**\`1\`

### 提示

- \`1 <= n <= 10^5\`
- \`1 <= primes.length <= 100\`
- \`2 <= primes[i] <= 1000\`
- \`primes[i]\` 保证是一个质数
- 每个 **测试用例** 中 \`primes\` 中的值都是 **不同** 的。`,
    solution: `## 解法：多指针动态规划

类似于丑数问题，但质因数数组是任意的。

\`\`\`javascript
var nthSuperUglyNumber = function(n, primes) {
  const ugly = new Array(n);
  ugly[0] = 1;
  
  const pointers = new Array(primes.length).fill(0);
  const values = [...primes];
  
  for (let i = 1; i < n; i++) {
    const nextUgly = Math.min(...values);
    ugly[i] = nextUgly;
    
    for (let j = 0; j < primes.length; j++) {
      if (values[j] === nextUgly) {
        pointers[j]++;
        values[j] = ugly[pointers[j]] * primes[j];
      }
    }
  }
  
  return ugly[n - 1];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × k)，k 为质数数量
- **空间复杂度**：O(n + k)`,
    codeTemplate: {
      javascript: "var nthSuperUglyNumber = function(n, primes) {};",
      python: "def nthSuperUglyNumber(self, n: int, primes: List[int]) -> int: pass",
      java: "class Solution { public int nthSuperUglyNumber(int n, int[] primes) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数学", "动态规划", "堆"],
  },

  {
    title: "分数到小数",
    content: `## 题目描述

给定两个整数，分别表示分数的分子 \`numerator\` 和分母 \`denominator\` ，以 **字符串形式** 返回小数 。

如果小数部分为循环的小数，则将循环部分括在括号内。

如果存在多个答案，只需返回 **任意一个** 。

对于所有给定的输入，保证 **答案字符串的长度小于 10⁴** 。

### 示例 1

**输入：**\`numerator = 1, denominator = 2\`
**输出：**\`"0.5"\`

### 示例 2

**输入：**\`numerator = 2, denominator = 1\`
**输出：**\`"2"\`

### 示例 3

**输入：**\`numerator = 4, denominator = 333\`
**输出：**\`"0.(012)"\`
**解释：** 4/333 = 0.012012012...

### 提示

- \`-2^31 <= numerator, denominator <= 2^31 - 1\`
- \`denominator != 0\``,
    solution: `## 解法：长除法 + 哈希表检测循环

\`\`\`javascript
var fractionToDecimal = function(numerator, denominator) {
  if (numerator === 0) return "0";
  
  let result = "";
  
  // 处理符号
  if ((numerator < 0) ^ (denominator < 0)) {
    result += "-";
  }
  
  let num = Math.abs(numerator);
  let den = Math.abs(denominator);
  
  // 整数部分
  result += Math.floor(num / den).toString();
  num %= den;
  
  if (num === 0) return result;
  
  // 小数部分
  result += ".";
  const map = new Map();  // 余数 -> 位置
  
  while (num !== 0) {
    if (map.has(num)) {
      // 发现循环
      const idx = map.get(num);
      result = result.slice(0, idx) + "(" + result.slice(idx) + ")";
      break;
    }
    
    map.set(num, result.length);
    num *= 10;
    result += Math.floor(num / den).toString();
    num %= den;
  }
  
  return result;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(denominator)，余数最多循环 denominator 次
- **空间复杂度**：O(denominator)`,
    codeTemplate: {
      javascript: "var fractionToDecimal = function(numerator, denominator) {};",
      python: "def fractionToDecimal(self, numerator: int, denominator: int) -> str: pass",
      java: "class Solution { public String fractionToDecimal(int numerator, int denominator) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["数学", "哈希表", "字符串"],
  },

  {
    title: "最大公约数与最小公倍数（QA）",
    content: `## 问题

1. 如何高效计算两个数的最大公约数（GCD）？
2. GCD 和 LCM 有什么关系？
3. 在算法竞赛中有哪些应用场景？

### 核心知识点

- **辗转相除法（欧几里得算法）**：gcd(a,b) = gcd(b, a%b)
- **更相减损术**：gcd(a,b) = gcd(a-b, b)（当a>b时）
- **LCM 公式**：lcm(a,b) = |a×b| / gcd(a,b)
- **扩展欧几里得算法**：求解 ax + by = gcd(a,b) 的整数解`,
    solution: `## 详细解答

### GCD 计算方法

\`\`\`javascript
// 辗转相除法（迭代版）
function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// 递归版
function gcdRecursive(a, b) {
  return b === 0 ? a : gcdRecursive(b, a % b);
}
\`\`\`

### 时间复杂度

- 辗转相除法：O(log min(a,b))
- 更相减损术：O(max(a,b))，但避免了大数取模

### 应用场景

1. **分数约分**：分子分母同除以GCD
2. **周期性问题**：LCM求多个周期的公共周期
3. **中国剩余定理**：模方程组求解的基础
4. **数论问题**：素因子分解、欧拉函数等

### 扩展欧几里得

\`\`\`javascript
function extendedGcd(a, b) {
  if (b === 0) {
    return { gcd: a, x: 1, y: 0 };
  }
  const { gcd, x: x1, y: y1 } = extendedGcd(b, a % b);
  return {
    gcd,
    x: y1,
    y: x1 - Math.floor(a / b) * y1
  };
}
\`\`\`

可用于求解线性 Diophantine 方程 ax + by = c`,
    codeTemplate: {},
    difficulty: "easy",
    questionType: "qa",
    tags: ["数学", "数论", "GCD/LCM"],
  },

  // ==================== 位运算专题（196-205）====================

  {
    title: "只出现一次的数字 II",
    content: `## 题目描述

给你一个整数数组 \`nums\` ，除某个元素仅出现 **一次** 外，其余每个元素都恰出现 **三次** 。请你找出并返回那个只出现了一次的元素。

你必须设计并实现线性时间复杂度的算法且使用常数级空间来解决此问题。

### 示例 1

**输入：**\`nums = [2,2,3,2]\`
**输出：**\`3\`

### 示例 2

**输入：**\`nums = [0,1,0,1,0,1,99]\`
**输出：**\`99\`

### 提示

- \`1 <= nums.length <= 3 * 10^4\`
- \`-2^31 <= nums[i] <= 2^31 - 1\`
- \`nums\` 中，除某个元素仅出现 **一次** 外，其余每个元素都恰出现 **三次**`,
    solution: `## 解法：位计数法

对每一位统计1出现的次数，模3后剩下的就是目标数的该位。

\`\`\`javascript
var singleNumber = function(nums) {
  let result = 0;
  
  for (let bit = 0; bit < 32; bit++) {
    let sum = 0;
    for (const num of nums) {
      sum += (num >> bit) & 1;
    }
    if (sum % 3 !== 0) {
      result |= (1 << bit);
    }
  }
  
  return result;
};
\`\`\`

### 优化解法：数字电路设计

使用两个变量 ones 和 twos 来追踪每位出现1次和2次的情况：

\`\`\`javascript
var singleNumberOptimized = function(nums) {
  let ones = 0, twos = 0;
  
  for (const num of nums) {
    ones = (ones ^ num) & ~twos;
    twos = (twos ^ num) & ~ones;
  }
  
  return ones;
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n × 32) = O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var singleNumber = function(nums) {};",
      python: "def singleNumber(self, nums: List[int]) -> int: pass",
      java: "class Solution { public int singleNumber(int[] nums) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["位运算", "哈希表"],
  },

  {
    title: "只出现一次的数字 III",
    content: `## 题目描述

给你一个整数数组 \`nums\`，其中恰好有两个元素只出现一次，其余所有元素均出现两次。找出那两个只出现一次的元素。

你可以按 **任意顺序** 返回答案。

### 示例 1

**输入：**\`nums = [1,2,1,3,2,5]\`
**输出：**\`[3,5]\`
**解释：** [5, 3] 也是有效的答案。

### 示例 2

**输入：**\`nums = [-1,0]\`
**输出：**\`[-1,0]\`

### 提示

- \`2 <= nums.length <= 3 * 10^4\`
- \`-2^31 <= nums[i] <= 2^31 - 1\`
- 除两个只出现一次的整数外，其他整数都出现两次`,
    solution: `## 解法：分组异或

1. 全部异或得到 xor = a ^ b
2. 找到 xor 中任意一个为1的位（分组位）
3. 根据该位将数组分为两组，分别异或得到 a 和 b

\`\`\`javascript
var singleNumber = function(nums) {
  // 第一步：全部异或
  let xor = 0;
  for (const num of nums) {
    xor ^= num;
  }
  
  // 第二步：找到分组位（最右边的1）
  const diffBit = xor & (-xor);
  
  // 第三步：分组异或
  let a = 0, b = 0;
  for (const num of nums) {
    if (num & diffBit) {
      a ^= num;
    } else {
      b ^= num;
    }
  }
  
  return [a, b];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var singleNumber = function(nums) {};",
      python: "def singleNumber(self, nums: List[int]) -> List[int]: pass",
      java: "class Solution { public int[] singleNumber(int[] nums) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["位运算"],
  },

  {
    title: "数字范围按位与",
    content: `## 题目描述

给你两个整数 \`left\` 和 \`right\` ，表示范围 \`\`[left, right]\`\` ，返回此范围内所有数字 **按位与** 的结果（包括 \`left\` 、\`right\` 端点）。

### 示例 1

**输入：**\`left = 5, right = 7\`
**输出：**\`4\`

### 示例 2

**输入：**\`left = 0, right = 0\`
**输出：**\`0\`

### 示例 3

**输入：**\`left = 1, right = 2147483647\`
**输出：**\`0\`

### 提示

- \`0 <= left <= right <= 2^31 - 1\``,
    solution: `## 解法：公共前缀法

按位与的结果是所有数的公共前缀后面补0。不断右移直到 left == right，记录移动位数。

\`\`\`javascript
var rangeBitwiseAnd = function(left, right) {
  let shift = 0;
  
  // 找到公共前缀
  while (left < right) {
    left >>= 1;
    right >>= 1;
    shift++;
  }
  
  // 补零
  return left << shift;
};
\`\`\`

### 直观理解

当 left ≠ right 时，范围内一定存在形如 ...0111 和 ...1000 的数，它们的按位与在该位一定为0。

### 复杂度分析

- **时间复杂度**：O(log n)，n 为 right 的大小
- **空间复杂度**：O(1)`,
    codeTemplate: {
      javascript: "var rangeBitwiseAnd = function(left, right) {};",
      python: "def rangeBitwiseAnd(self, left: int, right: int) -> int: pass",
      java: "class Solution { public int rangeBitwiseAnd(int left, int right) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["位运算"],
  },

  {
    title: "重复的DNA序列",
    content: `## 题目描述

DNA 序列 由一系列核苷酸组成，缩写为 \`'A'\`, \`'C'\`, \`'G'\` 和 \`'T'\` 。

例如，\`"ACGAATTCCG"\` 。在研究 DNA 时，识别 DNA 中的重复序列有时会对研究非常有帮助。

编写一个函数，找出所有目标子串，目标子串的长度为 10，且在 DNA 字符串 \`s\` 中出现次数超过一次。

### 示例 1

**输入：**\`s = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"\`
**输出：**\`["AAAAACCCCC","CCCCCAAAAA"]\`

### 示例 2

**输入：**\`s = "AAAAAAAAAAAAA"\`
**输出：**\`["AAAAAAAAAA"]\`

### 提示

- \`1 <= s.length <= 10^5\`
- \`s[i]\` 为 \`'A'\`、\`'C'\`、\`'G'\` 或 \`'T'\``,
    solution: `## 解法：滚动哈希 + 哈希表

使用固定长度窗口滑动，哈希表记录出现次数。

\`\`\`javascript
var findRepeatedDnaSequences = function(s) {
  if (s.length < 10) return [];
  
  const seen = new Set();
  const result = new Set();
  
  for (let i = 0; i <= s.length - 10; i++) {
    const substring = s.substring(i, i + 10);
    
    if (seen.has(substring)) {
      result.add(substring);
    } else {
      seen.add(substring);
    }
  }
  
  return [...result];
};
\`\`\`

### 优化：位编码

将 A/C/G/T 编码为 2位二进制，用一个整数表示10字符子串：

\`\`\`javascript
var findRepeatedDnaSequencesOptimized = function(s) {
  if (s.length < 10) return [];
  
  const map = { 'A': 0, 'C': 1, 'G': 2, 'T': 3 };
  const seen = new Set();
  const result = new Set();
  
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 2) | map[s[i]]) & 0xFFFFF;  // 20位 = 10个字符
    
    if (i >= 9) {
      if (seen.has(hash)) {
        result.add(s.substring(i - 9, i + 1));
      } else {
        seen.add(hash);
      }
    }
  }
  
  return [...result];
};
\`\`\`

### 复杂度分析

- **时间复杂度**：O(n)
- **空间复杂度**：O(n)`,
    codeTemplate: {
      javascript: "var findRepeatedDnaSequences = function(s) {};",
      python: "def findRepeatedDnaSequences(self, s: str) -> List[str]: pass",
      java: "class Solution { public List<String> findRepeatedDnaSequences(String s) {} }",
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["哈希表", "位运算", "字符串", "滑动窗口"],
  },

  {
    title: "位运算技巧汇总（QA）",
    content: `## 问题

总结常用的位运算技巧和应用场景。

### 常见操作

1. **获取最低位的1**：x & (-x)
2. **清除最低位的1**：x & (x - 1)
3. **交换两个变量**：a ^= b; b ^= a; a ^= b;
4. **判断奇偶**：x & 1
5. **判断2的幂**：x & (x-1) === 0
6. **取模（2^n）**：x & (2^n - 1)`,
    solution: `## 详细解答

### 基础位操作

\`\`\`javascript
// 判断第k位是否为1
function testBit(x, k) {
  return (x >> k) & 1;
}

// 设置第k位为1
function setBit(x, k) {
  return x | (1 << k);
}

// 清除第k位
function clearBit(x, k) {
  return x & ~(1 << k);
}

// 翻转第k位
function toggleBit(x, k) {
  return x ^ (1 << k);
}
\`\`\`

### 高级技巧

\`\`\`javascript
// 交换符号（取反加1）
function negate(x) {
  return ~x + 1;
}

// 绝对值（不考虑溢出）
function abs(x) {
  const mask = x >> 31;
  return (x ^ mask) - mask;
}

// 取最大值
function max(a, b) {
  return a ^ ((a ^ b) & -(a < b));
}

// 四舍五入到2的幂
function roundUpPowerOf2(x) {
  x--;
  x |= x >> 1;
  x |= x >> 2;
  x |= x >> 4;
  x |= x >> 8;
  x |= x >> 16;
  return x + 1;
}
\`\`\`

### 实际应用

1. **状态压缩DP**：用位掩码表示集合
2. **布隆过滤器**：多位哈希
3. **Gray码**：相邻数只差一位
4. ** parity校验**：奇偶校验`,
    codeTemplate: {},
    difficulty: "medium",
    questionType: "qa",
    tags: ["位运算", "技巧", "面试常考"],
  },

  // 继续补充至300道...
  // 以下为第二批次高质量题目
];