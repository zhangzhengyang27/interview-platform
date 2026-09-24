// 后端方向面试题 - 110道（第三批补充）
// 生成时间：2026-06-10
// 覆盖领域：Java核心、微服务架构、数据库高级、中间件进阶、DevOps运维、安全、算法数据结构、系统设计、操作系统、网络、设计模式、性能优化、场景题

export interface BackendQuestion {
  title: string;
  content: string;
  solution?: string;
  codeTemplate?: Record<string, string>;
  difficulty: "easy" | "medium" | "hard";
  questionType: "code" | "qa";
  tags: string[];
}

export const backendQuestionsFinal: BackendQuestion[] = [

  // ==================== Java核心深入 (12道) ====================

  {
    title: "String不可变性原理与JDK版本演进",
    content: `## 题目描述

深入分析Java中String的不可变性机制，包括：

### 核心问题
1. **底层实现**：String如何通过 \`char[] value\` (JDK8及之前) 或 \`byte[] value\` (JDK9+) 加 \`final\` 修饰实现不可变性？
2. **内存泄漏**：JDK6的 \`substring()\` 为何会导致内存泄漏？JDK7u6及之后如何修复？
3. **字符串常量池**：
   - \`intern()\` 方法的工作原理（JDK6 vs JDK7+ 的差异）
   - 常量池的位置变化（永久代 → 元空间/堆）
   - 字面量赋值 vs \`new String()\` vs \`intern()\` 的区别
4. **字符串拼接**：编译器对 \`+\` 的优化（StringBuilder）、循环拼接的性能陷阱
5. **JDK9 Compact Strings**：coder字段、LATIN1 vs UTF-16 编码选择

### 考察点
- String源码分析（JDK8 vs JDK9+）
- 不可变性的设计意义（线程安全、哈希缓存、安全性）
- 常量池GC与OOM风险`,
    solution: `## 深度解析

### 1. 不可变性实现

**JDK8及之前：**
\`\`\`java
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {
    private final char value[];  // final保证引用不变
    private int hash;  // 缓存hashCode
}
\`\`\`

**JDK9+（JEP 254 Compact Strings）：**
\`\`\`java
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {
    @Stable
    private final byte[] value;   // 替代char[]
    private final byte coder;     // LATIN1=0, UTF16=1
}
\`\`\`

**不可变性保障机制：**
- 类声明为 \`final\`，不可被继承
- \`value[]\` 为 \`private final\`，无setter方法
- 所有修改操作返回新对象（concat、substring、replace等）
- \`hash\` 字段延迟计算并缓存（首次hashCode()调用时）

**设计优势：**
1. **线程安全**：无需同步，可自由共享跨线程
2. **hashCode缓存**：作为HashMap键时只计算一次
3. **安全性**：作为网络连接参数、文件路径时不会被篡改

### 2. substring() 内存泄漏（JDK6经典问题）

**JDK6实现——共享原始数组：**
\`\`\`java
public String substring(int beginIndex, int endIndex) {
    // 共享原始char[]，只调整offset和count
    return new String(offset + beginIndex, endIndex - beginIndex, value);
}
\`\`\`

**问题场景：**
\`\`\`java
String big = new String(new char[100000]); // 100KB字符数组
String small = big.substring(0, 2);        // 只要2个字符
// 但small仍然持有100KB的char[]引用！导致严重内存泄漏！
\`\`\`

**修复（JDK7u6+）——复制新数组：**
\`\`\`java
public String(char value[], int offset, int count) {
    this.value = Arrays.copyOfRange(value, offset, offset + count); // 不再共享
}
\`\`\`

### 3. intern() 与字符串常量池

| 版本 | 实现 | 位置 | 特点 |
|------|------|------|------|
| JDK6 | 永久代拷贝 | PermGen | 常量池满则OOM |
| JDK7 | 堆上引用不拷贝 | Heap | 避免PermGen OOM |
| JDK8+ | 哈希表Native | Heap(Metaspace) | \`-XX:StringTableSize\` 可调 |

**三种创建方式对比：**
\`\`\`java
String s1 = "hello";           // 字面量 → 直接入常量池
String s2 = new String("hello"); // 堆对象
String s3 = s2.intern();       // 返回常量池引用
System.out.println(s1 == s2);  // false
System.out.println(s1 == s3);  // true
\`\`\`

### 4. 字符串拼接优化要点

- 编译器将 \`a+b+c\` 常量折叠为 \`abc\`
- 含变量时编译为 StringBuilder.append() 链式调用
- **循环内避免用\`+\`拼接**（每次循环创建新StringBuilder）
- JDK9使用InvokeDynamic + StringConcatFactory动态选择最优策略

### 5. JDK9 Compact Strings 效果

纯ASCII字符串占用减半（每个字符1字节而非2字节），实测JVM启动内存减少约10-15%。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "String", "JVM", "内存管理"]
  },

  {
    title: "HashMap 1.7 vs 1.8 源码级差异分析",
    content: `## 题目描述

全面对比HashMap在JDK 1.7和JDK 1.8中的实现差异：

### 核心问题
1. **数据结构变化**：1.7 数组+链表 vs 1.8 数组+链表+红黑树（树化阈值8、退化阈值6的原因）
2. **插入方式**：1.7 头插法（为何导致死链）vs 1.8 尾插法
3. **resize扩容机制**：容量为何必须是2的幂次？1.7 resize死链详细过程
4. **Hash计算**：1.7 多次扰动 vs 1.8 高16位异或低16位
5. **负载因子0.75的选择依据**：泊松分布
6. **容量初始化**：\`new HashMap(10)\` 实际初始容量是多少？

### 考察点
- HashMap源码逐行分析能力
- 并发安全问题
- 空间换时间的设计权衡`,
    solution: `## 深度解析

### 数据结构差异

**JDK 1.7：** \`Entry<K,V>[] table\`（数组+单向链表）
**JDK 1.8：** \`Node<K,V>[] table\`（数组+链表+红黑树TreeNode）

### 树化阈值为何是8？

根据泊松分布 P(X=k) = (e^-λ * λ^k) / k!，当 λ=0.75（负载因子）时：
- P(0) = 0.472（47%桶为空）
- P(8) = 0.00000006（千万分之一）
当链表长度达到8时说明hash函数质量有问题，转为红黑树合理。退化阈值设为6（非8）是为了避免频繁转换震荡。

### 头插法死链问题（JDK 1.7）

两个线程同时put触发resize时，由于头插法改变链表顺序，可能导致A→B→A的循环链表，后续get操作CPU 100%。JDK 1.8改用尾插法保持顺序，自然解决此问题（但不代表1.8 HashMap线程安全！）。

### 容量为2的幂次的原因

\`(n-1) & hash\` 位运算替代 \`hash % n\` 取模，速度快且当n为2的幂次时(n-1)二进制全为1，hash每一位都能影响结果使分布更均匀。\`tableSizeFor()\` 通过位运算找到大于等于cap的最小2幂次。

### Hash计算优化

JDK 1.8简化为一次扰动：\`h ^ (h >>> 16)\` 让高位参与index计算降低冲突。x86架构下只需一条mfence指令即可保证volatile写语义。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "HashMap", "数据结构", "并发编程"]
  },

  {
    title: "ConcurrentHashMap 1.7分段锁 vs 1.8 CAS+Synchronized",
    content: `## 题目描述

深入对比ConcurrentHashMap在JDK 1.7和JDK 1.8中的实现演进：

### 核心问题
1. **JDK 1.7 Segment分段锁**：继承ReentrantLock，默认16段，每个Segment独立HashEntry[]
2. **JDK 1.8 CAS + synchronized**：抛弃Segment，CAS初始化数组，synchronized锁头节点
3. **sizeCtl控制字的多重含义**：-1初始化中 / <-n扩容线程数 / 0默认值 / >0阈值或容量
4. **LongAdder思想的计数器**：baseCount + Cell[]分散热点
5. **多线程协助扩容机制**：ForwardingNode + transferIndex任务分配
6. **为何不允许null key/value？**

### 考察点
- ConcurrentHashMap架构演进理解
- CAS与synchronized协同使用
- 无锁编程思想`,
    solution: `## 深度解析

### JDK 1.7 分段锁架构

\`\`\`java
final Segment<K,V>[] segments;  // 默认16个段
static class Segment<K,V> extends ReentrantLock {
    transient volatile HashEntry<K,V>[] table;  // 每段独立数组
}
// 并发度 = Segment数量（最大16），get无锁volatile读，put锁定具体Segment
// size()痛点：需多次不加锁统计直到稳定或全锁兜底
\`\`\`

### JDK 1.8 CAS + Synchronized 核心改进

**initTable —— CAS抢初始化权：**
sizeCtl从0CAS为-1表示正在初始化，只有一个线程能成功，其余yield等待。

**putVal 三种情况：**
1. 桶为空 → \`casTabAt(null, newNode)\` 无锁插入成功
2. 桶为ForwardingNode → 正在扩容，去helpTransfer()协助
3. 桶有数据 → \`synchronized(头节点)\` 锁住链表/树操作

**关键优势：**
- 锁粒度从段级别降到桶级别
- 大部分操作CAS无锁完成
- LongAdder计数器高并发下性能显著提升
- 多线程协助扩容将压力分散

### 不允许null的原因

并发场景下get(key)返回null无法区分key不存在还是value为null（check-then-act竞态）。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "ConcurrentHashMap", "并发编程", "锁机制"]
  },

  {
    title: "ThreadPoolExecutor线程池七大参数与拒绝策略",
    content: `## 题目描述

深入理解ThreadPoolExecutor的工作原理：

### 核心问题
1. **七大参数详解**：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler
2. **ctl变量**：高3位存储状态(RUNNING/SHUTDOWN/STOP/TIDYING/TERMINATED)，低29位存储workerCount
3. **任务提交流程**：核心线程→队列→非核心线程→拒绝策略
4. **四种拒绝策略**：AbortPolicy/CallerRunsPolicy/DiscardOldestPolicy/DiscardPolicy
5. **workQueue选择**：SynchronousQueue/LinkedBlockingQueue/ArrayBlockingQueue
6. **execute() vs submit()**：submit异常被封装在Future中不抛出！
7. **Executors工具类的坑**：FixedThreadPool/CachedThreadPool的OOM风险
8. **如何合理配置参数**（IO密集型/CPU密集型）？
9. **shutdown() vs shutdownNow()**

### 考察点
- 线程池内部工作机理
- 生产环境配置经验
- 优雅关闭策略`,
    solution: `## 深度解析

### 任务提交流程（核心！）

\`\`\`
提交任务
  ├─ 线程数 < corePoolSize? ──YES──→ 创建核心线程执行
  │                              NO
  ├─ 队列未满? ──YES──→ 入队列等待
  │                  NO
  ├─ 线程数 < maxPoolSize? ──YES──→ 创建非核心线程执行
  │                           NO
  └─ 拒绝策略
\`\`\`

### 四种拒绝策略

| 策略 | 行为 | 适用场景 |
|------|------|---------|
| AbortPolicy | 抛RejectedExecutionException | 默认，明确失败 |
| CallerRunsPolicy | 调用者线程自己执行 | 自适应限流（背压） |
| DiscardOldestPolicy | 丢弃最老任务，重试当前 | 允许丢任务 |
| DiscardPolicy | 静默丢弃 | 日志/监控场景 |

### Executors的坑

\`\`\`java
// ❌ FixedThreadPool：无界LinkedBlockingQueue → OOM
Executors.newFixedThreadPool(10);
// ❌ CachedThreadPool：max=Integer.MAX_VALUE → 线程爆炸
Executors.newCachedThreadPool();

// ✅ 正确做法：有界队列 + 合理拒绝策略
new ThreadPoolExecutor(10, 20, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(500),
    new ThreadFactoryBuilder().setNameFormat("pool-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy());
\`\`\`

### 参数配置经验

- CPU密集型：线程数 ≈ CPU核数 + 1
- IO密集型：线程数 ≈ CPU核数 × 2（或根据等待时间/计算时间比例调整）
- Tomcat参考：maxThreads=200, minSpareThreads=25, acceptCount=100

### submit陷阱

Future<?> future = executor.submit(() -> { throw new RuntimeException(); });
// 异常不会抛出！必须future.get()才能获取ExecutionException
// 建议：统一用execute或在submit包装try-catch记录日志`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java", "线程池", "并发编程", "ThreadPoolExecutor"]
  },

  {
    title: "Volatile关键字与JMM内存模型深度剖析",
    content: `## 题目描述

深入理解volatile关键字的工作原理及其在Java内存模型(JMM)中的语义：

### 核心问题
1. **JMM抽象结构**：主内存(Main Memory)、工作内存(Working Memory)
2. **volatile两层语义**：可见性(Memory Visibility)、有序性(Ordering/禁止重排序)
3. **Memory Barrier内存屏障**：StoreStore/StoreLoad/LoadLoad/LoadStore四种屏障
4. **Happens-Before原则**：volatile写-happens-before-volatile读
5. **volatile不能保证原子性的原因**：i++的字节码分解(getfield/iconst_1/iadd/putfield)
6. **DCL双重检查锁定**：为什么instance变量必须加volatile？（半初始化对象问题）
7. **volatile vs AtomicXXX vs synchronized** 适用场景对比
8. **实际应用场景**：状态标志、一次性安全发布(DSP)、volatile bean模式

### 考察点
- JMM规范的理解深度
- volatile底层实现原理（汇编层面）
- DCL模式的完整推导`,
    solution: `## 深度解析

### JMM抽象结构

主内存存储所有共享变量，每个线程有自己的工作内存（副本）。线程间通信必须通过主内存。JMM定义了8种原子操作：lock/unlock/read/load/use/assign/store/write。

### Volatile内存语义

**volatile写：**
1. 刷新工作内存中所有共享变量到主内存
2. 写入volatile变量最新值到主内存
3. 插入StoreStore屏障（前面的普通写可见）
4. 插入StoreLoad屏障（防止后面的读重排到前面）

**volatile读：**
1. 插入LoadLoad屏障
2. 插入LoadStore屏障
3. 从主内存读取volatile最新值
4. 使工作内存中对应共享变量失效

### x86架构特殊处理

x86采用强内存模型(TSO)，仅存在Store-Load重排序。HotSpot在x86上实现volatile只需在写后插入一条 **lock addl $0x0, (%rsp)** （等效于mfence）。

### DCL半初始化对象问题

\`new Singleton()\` 分三步：①分配内存 ②初始化对象 ③指向地址。②③可能重排。如果线程1执行了①③（instance非null但未初始化），线程2判断非null就直接使用了半初始化对象！volatile禁止这种重排序。

### i++非原子性证明

i++编译为：getstatic→iconst_1→iadd→putstatic 四条指令，多线程可能交叉执行导致丢失更新。解决方案用AtomicInteger或synchronized。

### 应用场景总结

- 状态标志（shutdownRequested）：最常用
- 一次性安全发布：构造完成后通过volatile写发布
- volatile bean模式：读多写少的配置对象
- 替代ReadWriteLock读锁：CopyOnWrite + volatile写`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "JMM", "Volatile", "并发编程", "内存模型"]
  },

  {
    title: "CAS底层原理与ABA问题解决方案",
    content: `## 题目描述

深入分析Compare And Swap(CAS)机制的底层实现与应用：

### 核心问题
1. **CAS三操作数**：内存值(V)、预期原值(A)、新值(B)
2. **Unsafe类**：sun.misc.Unsafe提供的compareAndSwapInt/Long/Object原生方法
3. **底层汇编指令**：x86的cmpxchg、ARM的LDREX/STREX
4. **AtomicInteger源码分析**：Unsafe + 自旋 + Offset偏移量
5. **ABA问题**：A→B→A，CAS误判未修改。解决方案：AtomicStampedReference(版本号)、AtomicMarkableReference(布尔标记)
6. **自旋开销**：高并发下长时间自旋浪费CPU
7. **LongAdder优化**：分散热点到Cell[]数组
8. **CAS只能保证单一共享变量的原子性**

### 考察点
- CAS硬件基础和软件实现
- ABA问题的本质和解决
- CAS局限性及替代方案`,
    solution: `## 深度解析

### CAS基本概念

CAS(V, A, B): 如果V==A则V=B返回true，否则返回false且V当前值给调用者。基于CPU原子指令实现乐观并发。

### Unsafe类核心方法

\`\`\`java
public final native boolean compareAndSwapObject(Object o, long offset,
                                                  Object expected, Object x);
public final native boolean compareAndSwapInt(Object o, long offset,
                                               int expected, int x);
public native long objectFieldOffset(Field f);  // 获取字段偏移量
\`\`\`

### AtomicInteger自旋过程

\`\`\`java
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}

// Unsafe内部：do { v=getIntVolatile; } while(!compareAndSwapInt(o,offset,v,v+delta))
// 反复读取当前值，尝试CAS更新直到成功
\`\`\`

### ABA问题详解

栈的实现场景：栈=A→B→C，线程1 pop读到top=A准备CAS(A→B)，线程2 pop A再pop B再push A（栈变为A→C），线程1 CAS(A→B)成功但next指针已过时导致数据结构损坏！

**解决方案：**
- AtomicStampedReference：每次修改增加版本号，CAS同时检查版本号
- AtomicMarkableReference：更轻量，只标记是否被修改过
- 数据库乐观锁WHERE version=N同理

### LongAdder分散优化

baseCount(无竞争时直接用) + Cell[](竞争激烈时各线程更新不同Cell)。牺牲强一致性(sum()弱一致)换取高吞吐。典型适用于统计计数场景。

### 局限性总结

1. ABA问题 → 版本号/标记
2. 自旋开销 → 自适应自旋/Yield/限制次数后阻塞
3. 只能单变量原子 → 封装成对象用AtomicReference
4. 不适合复合操作 → 改用锁`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "CAS", "并发编程", "Unsafe", "Atomic"]
  },

  {
    title: "Java引用类型WeakReference/SoftReference/PhantomReference",
    content: `## 题目描述

深入理解Java四种引用类型的特性、使用场景及GC交互：

### 核心问题
1. **四种引用强度**：Strong > Soft > Weak > Phantom
2. **SoftReference**：OOM前回收，适合缓存。-XX:SoftRefLRUPolicyMSPerMB调优
3. **WeakReference**：下次GC即回收。WeakHashMap原理、ThreadLocal内存泄漏根因
4. **PhantomReference**：get()永远返回null，必须配合ReferenceQueue。DirectByteBuffer堆外内存释放
5. **ReferenceQueue**：GC回收前将引用入队用于清理资源
6. **Finalizer/FinalReference**：终结器机制问题，Cleaner替代方案

### 考察点
- 四种引用生命周期与GC行为
- WeakHashMap/ThreadLocal内存泄漏根因
- 虚引用的高级用法`,
    solution: `## 深度解析

### 四种引用总览

| 引用类型 | get()返回 | GC时机 | 典型场景 |
|---------|----------|--------|---------|
| Strong | 对象引用 | 永不(除非不可达) | 普通变量 |
| Soft | 对象/null | OOM前 | 图片缓存 |
| Weak | 对象/null | 下次GC | WeakHashMap key、观察者注册 |
| Phantom | **永远null** | 下次GC | DirectByteBuffer清理 |

### WeakHashMap原理

Entry继承WeakReference，key为弱引用。GC时key被回收后Entry.key=null，expungeStaleEntries()从ReferenceQueue取出清除。注意value仍是强引用（如果value也弱引用就失去了意义）。

### ThreadLocal内存泄漏根因

Thread → ThreadLocalMap → Entry(value强引用 + key弱引用)。线程归还池后Thread对象还在，ThreadLocal静态字段还在，value大对象无法回收。**必须在finally中remove()！**

### PhantomReference实战——DirectByteBuffer

\`\`\`java
// DirectByteBuffer分配堆外内存(malloc)，注册Cleaner(基于PhantomReference)
// GC回收DirectByteBuffer → ReferenceQueue入队 → Cleaner执行Deallocator
// Deallocator.run() → unsafe.freeMemory() 释放堆外内存
\`\`\`

这是虚引用唯一真正广泛使用的生产级场景。

### 最佳实践

- 缓存用SoftReference（或更好的Guava Cache/Caffeine）
- 规范化映射用WeakReference
- ThreadLocal务必finally remove()
- 不要使用finalize()，用Cleaner替代`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "引用类型", "GC", "内存管理", "ThreadLocal"]
  },

  {
    title: "Java异常体系与try-with-resources机制",
    content: `## 题目描述

全面掌握Java异常处理体系与实践：

### 核心问题
1. **异常层次结构**：Throwable → Error/Exception → Checked/Unchecked(RuntimeException)
2. **Checked vs Unchecked设计哲学**：何时自定义Checked vs Unchecked？
3. **异常链(Exception Chaining)**：initCause()/getCause()
4. **try-with-resources(JDK7)**：AutoCloseable接口、反序关闭、Suppressed Exceptions
5. **finally中return/break/continue**：会覆盖try块异常吗？
6. **suppressed异常**：close()抛出的异常如何保存
7. **自定义异常设计原则**

### 考察点
- 异常体系完整认知
- try-with-resources底层实现
- finally块执行细节`,
    solution: `## 深度解析

### 异常层次结构

Throwable → Error(JVM级: OOM/StackOverflow) / Exception(程序级)
Exception → IOException/SQLException等Checked(编译强制处理) / RuntimeException(Unchecked)

### try-with-resources机制

实现了AutoCloseable接口的对象可在try()中声明，退出时自动close()（反序关闭）。编译器生成等价代码包含try-catch-finally，close()异常作为suppressed附加到主异常上。

### finally return覆盖规则

**finally中的return会覆盖try/catch中的return值和异常！** 这是经典的面试坑点。finally中修改return值：基本类型不影响（值拷贝），引用类型影响（修改引用指向的对象内容）。

### Suppressed异常示例

\`\`\`java
try (MyResource r = new MyResource()) {
    throw new RuntimeException("try块异常");
}
// close()抛IOException → 输出为主异常，IOException为Suppressed
\`\`\`

### 最佳实践

- 精确捕获具体异常（不要catch Exception）
- 保留异常链(initCause)
- 全局异常处理器(@RestControllerAdvice)
- 统一异常体系(BaseException → BizException/SystemException)`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java", "异常处理", "try-with-resources"]
  },

  {
    title: "Java泛型通配符PECS原则与类型擦除",
    content: `## 题目描述

深入理解Java泛型的通配符机制与底层实现：

### 核心问题
1. **泛型擦除(Type Erasure)**：编译期检查，运行时擦除为原始类型(raw type)
2. **上界通配符 <? extends T>(Producer Extends)**：只能读不能写，协变
3. **下界通配符 <? super T>(Consumer Super)**：只能写不能读(除Object)，逆变
4. **PECS原则**：Producer Extends Consumer Super
5. **类型擦除限制**：不能创建泛型数组、不能实例化T、instanceof不能用泛型
6. **桥方法(Bridge Method)**：擦除后多态如何保持
7. **反射获取泛型信息**：ParameterizedType、Signature属性

### 考察点
- PECS原则深刻理解
- 类型擦除底层机制
- 桥方法生成原理`,
    solution: `## 深度解析

### PECS原则口诀

Joshua Bloch Effective Java: **P**roducer **E**xtends(往外提供数据), **C**onsumer **S**uper(往里接收数据)

**<? extends Number>**: 能读出Number，不能写入(null除外)。因为可能是List<Double>往里加Integer不对。
**<? super Integer>:** 能写入Integer及其子类，只能读出Object。因为可能是List<Object>读出来不知道具体类型。

### 类型擦除原因

历史兼容性(JDK 5引入泛型，旧代码无需修改)。Class文件保留Signature属性，反射可部分获取泛型信息。对比C#具现化(generics reification)：运行时保留泛型类型List<int>≠List<string>，但导致代码膨胀。

### 桥方法示例

\`\`\`java
class StringComparator implements Comparator<String> {
    public int compare(String s1, String s2) { ... }
    // 编译器自动生成桥方法：
    // public bridge int compare(Object o1, Object o2) { return compare((String)o1,(String)o2); }
}
\`\`\`

擦除后Comparator.compare(Object,Object)需要桥方法委托到compare(String,String)以保持多态。

### 常见限制绕过

- 不能new T() → 传Supplier<T>或Class<T>+反射
- 不能new T[] → 强转(List<String>[])(new List<?>[5])有警告
- instanceof<T> → 用原始类型转型`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java", "泛型", "PECS", "类型擦除", "桥方法"]
  },

  {
    title: "Java枚举Enum单例与高级用法",
    content: `## 题目描述

深入理解Java枚举类型的特性与高级应用：

### 核心问题
1. **枚举本质**：final类继承java.lang.Enum，私有构造器，<clinit>中创建实例
2. **枚举单例**（Effective Java推荐）：为什么是最安全的单例？防反射/防序列化/防克隆
3. **内置方法**：values()/ordinal()/name()/valueOf()/compareTo()
4. **枚举抽象方法**：每个常量不同实现（策略模式）
5. **EnumSet/EnumMap**：位向量实现的高性能集合/映射
6. **枚举实现接口**：扩展行为而不破坏封闭性
7. **状态机/权限系统应用**

### 考察点
- Enum底层原理
- 枚举单例安全性证明
- EnumSet/EnumMap位运算优化`,
    solution: `## 深度解析

### 枚举本质

反编译enum Color { RED, GREEN, BLUE } 可见：
- public final class Color extends Enum<Color>
- static final字段RED/GREEN/BLUE在<clinit>中创建
- values()返回\$VALUES.clone()

### 构举单例四重安全保障

① **线程安全**：<clinit>由JVM保证同步
② **防反射**：Constructor.newInstance()检查Modifier.ENUM直接抛IllegalArgumentException
③ **防序列化**：Enum.readObject返回valueOf(Class,name)已有实例
④ **防克隆**：Enum.clone()抛CloneNotSupportedException

### EnumSet位向量原理

<=64个枚举时用一个long的bit位表示每个常量是否存在。add()=位或操作，contains()=位测试，O(1)时间复杂度。EnumMap用Object[]数组以ordinal为索引，O(1)访问且按声明顺序遍历有序。

### 枚举抽象方法——策略模式

\`\`\`java
enum Operation {
    ADD("+") { double apply(double x,double y){ return x+y; } },
    MULTIPLY("*") { double apply(double x,double y){ return x*y; } };
    abstract double apply(double x,double y);
}
// 每个常量编译为匿名内部类
\`\`\`

ordinal()勿用于持久化（插入新常量会改变所有ordinal值），应使用自定义code字段或name()。`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java", "Enum", "单例模式", "设计模式"]
  },

  {
    title: "Java注解Annotation与运行时反射处理",
    content: `## 题目描述

深入理解Java注解的定义、元注解与运行时处理：

### 核心问题
1. **三种保留策略**：SOURCE(编译器用@Override)/CLASS(字节码默认)/RUNTIME(反射获取@Test)
2. **四个元注解**：@Target/@Retention/@Documented/@Inherited
3. **@Repeatable(JDK8)**：重复注解
4. **注解元素类型限制**：八种基本类型/String/Class/枚举/注解/以上数组
5. **运行时反射获取**：getAnnotation/isAnnotationPresent/getAnnotations
6. **Spring注解处理**：@Component扫描/@Autowired注入/@Transactional代理
7. **自定义@Retry注解实现**(AOP/动态代理)
8. **注解vs配置文件优劣**

### 考察点
- 注解完整生命周期
- 运行时注解处理能力
- 注解驱动开发思维`,
    solution: `## 深度解析

### 元注解速查

@Target({TYPE,FIELD,METHOD,PARAMETER,CONSTRUCTOR,LOCAL_VARIABLE,...}) — 限定作用位置
@Retention(SOURCE/CLASS/RUNTIME) — 生命周期
@Documented — 出现在javadoc
@Inherited — 子类可继承类级别注解
@Repeatable(JDK8) — 同一位置重复标注

### Spring注解处理流程

1. BeanPostProcessor扫描@Transactional等方法注解
2. AOP代理创建(JDK动态代理/CGLIB)
3. TransactionInterceptor拦截：开启事务→执行目标→提交/回滚

### 自定义Retry注解核心逻辑

\`\`\`java
@Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME)
@interface Retry { int maxAttempts() default 3; long delayMs() default 1000; }

// 处理：反射检测注解 → for循环重试 → Thread.sleep延迟 → 超限抛异常
\`\`\`

### 注解vs配置文件

注解耦合度高但类型安全编译期检查；配置文件解耦可热部署但字符串易错。现代趋势：约定优于配置+注解为主+application.yml为辅。`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java", "注解", "反射", "Spring"]
  },

  {
    title: "Reflection反射机制与性能优化",
    content: `## 题目描述

深入理解Java反射机制及其在生产环境的应用：

### 核心问题
1. **反射核心API**：Class.forName()/getClass()/.class/getMethod/setAccessible()
2. **反射破坏单例**：setAccessible(true)绕过private限制
3. **反射性能开销**：为什么慢？如何优化？(缓存Method/MethodHandle)
4. **反射安全隐患**：SecurityManager/JPMS模块系统限制
5. **实际应用**：Spring IoC依赖注入、Jackson序列化、JUnit框架、ORM映射
6. **MethodHandle(JDK7)**：比反射更现代的API
7. **VarHandle(JDK9)**：替代部分Unsafe用法

### 考察点
- 反射API熟练程度
- 性能分析与优化
- 主流框架中的应用`,
    solution: `## 深度解析

### 获取Class三种方式

1. \`.class\`（编译期确定，最高效安全）
2. \`.getClass()\`（运行时获取）
3. \`Class.forName()\`（动态加载，触发类初始化<clinit>）

### 为什么反射慢？

1. 参数装箱拆箱（Object[] ↔ 基本类型）
2. 安全检查（每次调用都校验可见性）
3. JIT编译优化受限（无法内联虚方法分发）
4. 方法分派需额外查找

### 性能优化方案

**缓存反射对象**（最重要！）：
\`\`\`java
// ❌ 每次都查找
Method m = clazz.getMethod("setName", String.class);
m.invoke(obj, "value");

// ✅ 缓存Method对象
private static final Method SET_NAME_METHOD;
static { SET_NAME_METHOD = User.class.getMethod("setName", String.class); }
SET_NAME_METHOD.invoke(obj, "value");  // 快3-10倍
\`\`\`

**MethodHandle（JDK7+，更接近原生性能）：**
\`\`\`java
MethodHandles.Lookup lookup = MethodHandles.lookup();
MethodHandle mh = lookup.findVirtual(User.class, "setName",
    MethodType.methodType(void.class, String.class));
mh.invokeExact(obj, "value");  // 接近直接调用速度
\`\`\`

### 反射破坏单例

\`\`\`java
Constructor<Singleton> ctor = Singleton.class.getDeclaredConstructor();
ctor.setAccessible(true);
Singleton instance = ctor.newInstance();  // 绕过private！
// 注意：枚举单例防反射（见Enum题目）
\`\`\`

### 主流框架中的反射

- Spring：@Autowired字段注入(setAccessible=true)
- Jackson：发现getter/setter进行JSON序列化
- Hibernate：实体类字段映射数据库列
- Dubbo：泛化调用generic reference通过反射调用服务方法`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java", "反射", "MethodHandle", "性能优化"]
  },

  // ==================== 微服务架构实战 (10道) ====================

  {
    title: "DDD领域驱动设计的限界上下文与服务拆分策略",
    content: `## 题目描述

基于DDD(Domain-Driven Design)理念的服务拆分策略：

### 核心问题
1. **限界上下文(Bounded Context)识别**：如何从业务领域划分出合理的上下文边界？
2. **三种拆分策略对比**：按业务域拆分 vs 按功能拆分 vs 按团队拆分
3. **通用子域/核心子域/支撑子域**的分类与投入策略
4. **防腐层ACL(Anti-Corruption Layer)**：跨上下文集成的翻译层设计
5. **共享库(Shared Kernel) vs 共享服务(Shared Service)**的反模式识别
6. **聚合根(Aggregate Root)与一致性边界**：事务边界如何决定微服务边界？
7. **事件驱动架构在DDD中的位置**：领域事件(Domain Event)跨上下文同步
8. **实际案例**：电商系统的用户/商品/订单/支付/库存上下文划分

### 考察点
- DDD战略设计能力
- 服务拆分的决策依据
- 跨服务协作模式`,
    solution: `## 深度解析

### 限界上下文识别方法论

**Step 1 - 事件风暴(Event Storming)：**
聚集领域专家和开发者，用不同颜色便签识别：
- 🟡 黄色：命令(Command) — 用户触发的动作
- 🔵 蓝色：领域事件(Domain Event) — 发生了什么
- 🟢 绿色：策略(Policy) — 业务规则
- 🟠 橙色：读模型(Read Model) — 查询结果
- 🔴 红色：热点(Hot Spot) — 复杂/争议区域
- 🟣 紫色：外部系统

**Step 2 - 聚合相似事件为聚合：** 找出紧密关联的事件簇
**Step 3 - 划分上下文边界：** 聚合间关系复杂的考虑拆分

### 三种拆分策略

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| 按业务域 | 高内聚低耦合，符合业务语言 | 初期难界定 | 成熟业务、长期演进 |
| 按功能 | 简单直观，易上手 | 可能产生上帝服务 | MVP阶段、简单系统 |
| 按团队(Conway's Law) | 减少跨团队协调成本 | 团队变动影响架构 | 多团队大型组织 |

### 子域分类与投入

- **核心子域(Core Domain)**：差异化竞争力，最大投入（如电商的智能推荐引擎）
- **支撑子域(Supporting Domain)**：必要但无差异，适度投入（如权限管理）
- **通用子域(Generic Domain)**：可直接购买/外包，最小投入（如发送邮件）

### 防腐层ACL设计

\`\`\`
┌─────────────┐    ACL      ┌─────────────┐
│  上下文A     │ ←──────→  │  上下文B     │
│ (OrderCtx)  │  翻译适配  │ (PaymentCtx) │
└─────────────┘            └─────────────┘

// ACL职责：
// 1. 转换模型（PaymentDTO → OrderDomain PaymentInfo）
// 2. 协议转换（gRPC → 内部HTTP）
// 3. 语义转换（PayStatus.PAID → OrderStatus.PAID）
// 4. 隔离外部变更（Payment API改动不影响Order）
\`\`\`

### 共享库反模式

❌ **Common Utils Jar**：多个服务共用一个大的工具包 → 改一处全局发布
❌ **Database Schema Sharing**：多服务共用库表 → 耦合数据库变更
✅ **正确的共享**：定义清晰的API契约（OpenAPI Spec）、共享值对象定义（独立maven module版本化管理）

### 电商系统上下文划分示例

| 上下文 | 聚合根 | 核心领域事件 |
|--------|--------|-------------|
| 用户上下文 | User, Identity | UserRegistered, PasswordChanged |
| 商品上下文 | Product, Category, SKU | ProductCreated, PriceChanged |
| 订单上下文 | Order, OrderItem | OrderCreated, OrderPaid, OrderCancelled |
| 支付上下文 | Payment, Refund | PaymentCompleted, RefundProcessed |
| 库存上下文 | Inventory, StockReservation | StockReserved, StockReleased |
| 物流上下文 | Shipment, Delivery | ShipmentCreated, Delivered |

**关键规则：** 一个聚合根通常对应一个微服务（或一个服务内的一个模块）。聚合内强一致性（本地事务），聚合间最终一致性（领域事件/MQ）。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "DDD", "服务拆分", "架构设计", "领域驱动设计"]
  },

  {
    title: "API网关深度剖析：路由断言与过滤器链",
    content: `## 题目描述

深入理解API网关的核心机制与生产实践：

### 核心问题
1. **网关核心功能**：路由转发、负载均衡、认证鉴权、限流熔断、协议转换、日志监控
2. **Spring Cloud Gateway工作原理**：
   - RouteLocator路由定位（基于Predicate谓词匹配）
   - FilterChain过滤链(GlobalFilter + GatewayFilter)
   - WebFlux响应式编程模型(Netty)
3. **路由断言工厂(Route Predicate Factory)**：Path/Method/Header/Query/RemoteAddr/After/Before/Cookie等
4. **过滤器分类**：PreFilter(前置)/PostFilter(后置)、GlobalFilter(全局)/GatewayFilter(路由级)
5. **限流实现**：RequestRateLimiter（内置Redis RateLimiter）、令牌桶/滑动窗口算法
6. **跨域CORS处理**：CorsProcessor、预检请求OPTIONS
7. **鉴权JWT集成**：Token提取/验证/用户信息传递
8. **Kong/APISIX对比选型**：性能、插件生态、运维复杂度
9. **网关高可用部署**：多实例 + LVS/SLB + 健康检查

### 考察点
- 网关架构理解深度
- Spring Cloud Gateway原理
- 生产级网关配置经验`,
    solution: `## 深度解析

### Spring Cloud Gateway 架构

\`\`\`
客户端请求
    ↓
DispatcherHandler (WebFlux)
    ↓
RoutePredicateHandlerMapping  ← 匹配路由（Predicate谓词）
    ↓ 匹配成功
FilteringWebHandler
    ↓
GlobalFilter → GatewayFilter(路由级) → 目标服务
    ↓
响应回传（PostFilter逆向执行）
\`\`\`

### 路由配置示例

\`\`\`yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service          # 负载均衡
          predicates:
            - Path=/api/user/**            # 路径匹配
            - Header=X-Request-Id, \\d+     # 请求头匹配
            - Method=GET,POST               # 方法匹配
            - After=2024-01-01T00:00:00+08:00  # 时间匹配
          filters:
            - StripPrefix=1                 # 去掉前缀
            - RequestRateLimiter=10,1        # 令牌桶限流
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY
\`\`\`

### 过滤器链执行顺序

**Gateway过滤器通过Ordered接口排序：** 数字越小优先级越高。
- \-2147483648 ~ -1000: AdjustContextFilter、NettyWriteResponseFilter等内置
- \-100 ~ 10: 自定义GlobalFilter
- 1 ~ 999: 路由级GatewayFilter
- 1000+: SendResponseFilter等后置

**请求流向：** PreFilter按升序执行 → 目标服务 → PostFilter按降序执行

### 限流实现（Redis令牌桶）

\`\`\`java
// Gateway内置RedisRateLimiter基于Redis Lua脚本
// 核心Lua脚本逻辑：
// 1. 当前时间戳清理过期令牌
// 2. 计算应补充令牌数 = (now-lastFillTime) * rate
// 3. 如果tokens >= 1，扣减并放行；否则拒绝
// Redis: KEY=rate_limiter:{id}, FIELD=tokens,lastFillTime
\`\`\`

### JWT鉴权过滤器

\`\`\`java
@Component
@Order(-100)
public class JwtAuthFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (token != null && jwtUtil.validateToken(token)) {
            Claims claims = jwtUtil.parseToken(token);
            // 将用户信息放入Header传递给下游服务
            exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-Roles", String.join(",", claims.get("roles")))
                .build();
            return chain.filter(exchange);
        }

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = response.bufferFactory()
            .wrap("{\"code\":401,\"msg\":\"Unauthorized\"}".getBytes());
        return response.writeWith(Mono.just(buffer));
    }
}
\`\`\`

### Kong vs APISIX vs Spring Cloud Gateway

| 维度 | Kong | APISIX | SCG |
|------|------|--------|-----|
| 性能 | 高(C/OpenResty) | 最高(C/lua-nginx-module) | 中(Java/WebFlux) |
| 插件生态 | 丰富(200+) | 丰富(80+) | 需自写Filter |
| 配置方式 | Admin API/DB | etcd/Admin API | YAML/代码 |
| 动态路由 | ✅ 支持 | ✅ 原生支持 | 需配合Nacos |
| 适合团队 | 运维能力强 | 云原生团队 | Java技术栈 |

**选型建议：** Java技术栈优先SCG（生态好、学习成本低）；高性能需求选APISIX；混合云/多协议选Kong。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "API网关", "Spring Cloud Gateway", "Kong", "APISIX"]
  },

  {
    title: "配置中心Nacos与Apollo架构对比",
    content: `## 题目描述

深入对比主流配置中心的架构设计与实现原理：

### 核心问题
1. **Nacos配置中心架构**：
   - 长轮询机制(30s延时)：客户端挂起等待，服务端配置变更立即推送
   - Namespace集群环境隔离（dev/test/prod）
   - Group分组管理
   - 配置格式支持(YAML/Properties/JSON/XML)
2. **Apollo架构**：
   - 客户端定时拉取(5s interval) + 服务端实时推送
   - AppId/Cluster/Namespace三级隔离
   - 发布机制：灰度发布、一键回滚、变更审计
   - ConfigService/AdminService/Portal三层架构
3. **配置加密方案**：敏感信息(DB密码/API Key)的加密存储与传输
4. **配置热更新**：@RefreshScope、@ConfigurationProperties、EnvironmentChangeEvent
5. **配置冲突与覆盖优先级**：bootstrap.yml → Nacos → 环境变量 → 启动参数
6. **高可用部署**：Nacos集群(AP模式/CP模式)、Apollo多机房部署
7. **配置版本管理与审批流程**

### 考察点
- 配置中心架构理解
- Nacos/Apollo原理差异
- 生产环境配置管理最佳实践`,
    solution: `## 深度解析

### Nacos长轮询机制（核心！）

\`\`\`
客户端                              Nacos Server
  │                                    │
  ├── HTTP POST /v1/cs/configs/longPolling ──→ │
  │   (DataId, Group, MD5, Timeout=30s)       │
  │                                    │       │
  │                         (挂起请求30s)      │
  │                                    │       │
  │                         [配置未变]         │
  │ ←── HTTP 304 (30s超时) ────────────── │
  │                                    │
  │ (立即发起下一次长轮询)              │
  │                                    │
  │                         [配置变更!]     │
  │ ←── HTTP 200 变更DataId列表 ──────── │ (立即返回!)
  │                                    │
  ├── HTTP GET /v1/cs/configs ──────────→ │ (拉取最新配置)
  │ ←── 最新配置内容 ──────────────────── │
  │                                    │
  │ (应用新配置 → 更新本地Cache)        │
  │ (发布LocalDataChangedEvent)         │
\`\`\`

**关键设计：** 30秒超时而非无限等待，防止连接意外断开无人感知。服务端配置变更时立即响应，正常情况下最多30秒感知变更。

### Apollo架构分层

\`\`\`
┌──────────┐    ┌──────────────┐    ┌───────────────┐
│  Portal   │───▶│ AdminService │───▶│ ConfigService │
│ (管理界面) │    │ (配置管理)    │    │ (配置读取)    │
└──────────┘    └──────┬───────┘    └──────┬────────┘
                       │                   │
                  ┌────▼────┐        ┌────▼────┐
                  │ MySQL   │        │ Client  │
                  │ (Config)│◀───────▶│ (App)   │
                  └─────────┘        └─────────┘

// Apollo客户端双机制：
// 1. 定时拉取：每5秒请求ConfigService比对MD5
// 2. 实时推送：ConfigService通过长连接主动通知变更
\`\`\`

### Nacos vs Apollo 对比

| 特性 | Nacos | Apollo |
|------|-------|--------|
| 推送模型 | 长轮询(30s) | 定时拉取(5s) + 长连接推送 |
| 延迟 | 最差30s | 最差5s（推送更快） |
| 部署复杂度 | 低（一体化） | 高（Portal/Admin/Config分离） |
| 灰度发布 | 基础支持 | 完善（按IP/标签灰度） |
| 审计日志 | 有 | 详细（谁在什么时候改了什么） |
| 权限管理 | 基础 | 细粒度（命名空间/环境/角色） |
| 一键回滚 | 有 | 有（基于发布历史） |
| 社区活跃度 | 高(阿里) | 中(携程开源) |

### 配置热更新实现

\`\`\`java
// 方式1：@RefreshScope + @Value
@RefreshScope  // 代理Bean，配置变更时销毁重建
@RestController
public class ConfigController {
    @Value("\${app.timeout:5000}")
    private int timeout;
}

// 方式2：@ConfigurationProperties（推荐，类型安全）
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private int timeout;
    // getter/setter
}

// 方式3：监听EnvironmentChangeEvent
@EventListener
public void onEnvChange(EnvironmentChangeEvent event) {
    // 自定义处理逻辑
}
\`\`\`

### 配置加密实践

\`\`\`yaml
# Nacos加密配置（使用Jasypt）
app:
  datasource:
    password: ENC(encrypted_string_here)

# 或者使用Nacos插件加密
# 1. 控制台创建密钥对
# 2. 上传公钥到Nacos
# 3. 配置值使用私钥加密后的密文
# 4. 客户端用私钥解密
\`\`\`

### 生产建议

1. **敏感配置绝不明文**：DB密码、API Key用加密方案
2. **环境严格隔离**：dev/test/staging/prod各自Namespace
3. **变更走审批**：生产配置修改需要Code Review + 发布工单
4. **灰度发布**：先小流量验证再全量
5. **监控告警**：配置变更事件推送到监控系统`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "Nacos", "Apollo", "配置中心", "分布式配置"]
  },

  {
    title: "服务网格Service Mesh架构与Istio落地实践",
    content: `## 题目描述

深入理解Service Mesh架构及Istio在生产环境的落地：

### 核心问题
1. **Sidecar代理模式**：每个Pod注入Envoy代理，业务容器无感知
2. **Istio控制面(Control Plane)**：
   - Pilot：服务发现、流量管理规则下发（Envoy xDS API: CDS/EDS/LDS/RDS）
   - Citadel：身份认证与证书管理（mTLS自动证书轮换）
   - Mixer：遥测收集（现已弃用，改为Envoy原生指标+Prometheus）
3. **数据面(Data Plane)**：Envoy代理功能（L4/L7代理、熔断、重试、流量镜像）
4. **VirtualService + DestinationRule**：流量管理CRD定义
5. **故障注入(Fault Injection)**：延迟注入、中止注入（混沌工程）
6. **从Spring Cloud迁移到Istio的挑战**：功能重叠、学习曲线、调试复杂度
7. **性能开销评估**：Sidecar带来的额外延迟和资源消耗
8. **多集群/多网格管理**：联邦、远程访问

### 考察点
- Service Mesh架构理解
- Istio组件职责
- 落地难点与应对`,
    solution: `## 深度解析

### Sidecar模式架构

\`\`\`
┌─────────────────────────────────────────────────┐
│                    Pod                           │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │  App Container│───▶│  Envoy Proxy(Sidecar)  │ │
│  │  (Business)   │◀───│  localhost:15001        │ │
│  └──────────────┘    └──────────┬─────────────┘ │
│                                 │                 │
└─────────────────────────────────┼─────────────────┘
                                  │ (mTLS: 15001)
                     ┌────────────▼────────────┐
                     │    Service Mesh Network   │
                     │  (Envoy-to-Envoy mTLS)    │
                     └──────────────────────────┘
\`\`\`

**关键点：** 业务代码完全不需要引入任何SDK！所有流量治理由Envoy Sidecar完成。应用只需要访问localhost即可。

### VirtualService + DestinationRule 示例

\`\`\`yaml
# 流量路由规则
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - match:
        - headers:
            x-version:
              exact: canary
      route:
        - destination:
            host: user-service
            subset: canary
          weight: 100
    - route:
        - destination:
            host: user-service
            subset: stable
          weight: 90
        - destination:
            host: user-service
            subset: canary
          weight: 10
---
# 子集定义（版本/标签）
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  subsets:
    - name: stable
      labels:
        version: stable
    - name: canary
      labels:
        version: canary
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
\`\`\`

### 故障注入（混沌工程）

\`\`\`yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-service
spec:
  http:
    - fault:
        delay:
          percentage:
            value: 10          # 10%的请求
          fixedDelay: 5s       # 延迟5秒
      route:
        - destination:
            host: payment-service
    - fault:
        abort:
          percentage:
            value: 1           # 1%的请求
          httpStatus: 500      # 返回500错误
      route:
        - destination:
            host: payment-service
\`\`\`

### Pilot xDS 下发机制

\`\`\`
Pilot (istiod)
  │
  ├── CDS (Cluster Discovery)  → Envoy知道有哪些上游服务
  ├── EDS (Endpoint Discovery) → Envoy知道服务的IP:Port列表
  ├── LDS (Listener Discovery) → Envoy知道监听哪些端口/协议
  └── RDS (Route Discovery)    → Envoy知道流量路由规则

// 下发方式：gRPC streaming (ADS - Aggregated Discovery Service)
// Envoy建立长连接到Pilot，增量推送变更
\`\`\`

### Citadel mTLS 双向认证

\`\`\`
1. Citadel CA为每个Workload签发证书(SPIFFE ID: spiffe://cluster/ns/default/sa/default)
2. 证书通过Secret Volume挂载到Sidecar
3. Envoy自动完成mTLS握手（客户端证书+服务端证书验证）
4. 证书自动轮换（默认TTL较短）
5. STRICT/PERMISSIVE/DISABLE 三种模式可选
\`\`\`

### 性能开销实测

| 指标 | 无Sidecar | 有Envoy Sidecar | 开销 |
|------|-----------|-----------------|------|
| P99延迟(ms) | 10 | 15-25 | +50~150% |
| CPU/ Pod | 0.1 core | 0.3-0.5 core | +3~5x |
| Memory/Pod | 128MB | 256-512MB | +2~4x |
| 吞吐量(QPS/Pod) | 10000 | 6000-8000 | -20~40% |

**缓解措施：** 使用Ambient Mesh(无Sidecar模式)、优化Envoy配置、合理设置连接池。

### Spring Cloud → Istio 迁移挑战

| Spring Cloud功能 | Istio对应 | 差异 |
|------------------|----------|------|
| Ribbon负载均衡 | DestinationRule/LDS | 自动、更细粒度 |
| Hystrix熔断 | DestinationRule.outlierDetection | 配置方式不同 |
| Zuul网关 | Ingress Gateway | 功能更强 |
| Sleuth追踪 | Envoy Wasm/OTel | 自动注入 |
| Config配置 | ConfigMap + 外部配置中心 | Istio不管配置 |
| **最大的挑战** | | 调试困难（多了一层代理）、学习曲线陡峭 |`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "Service Mesh", "Istio", "Envoy", "Kubernetes"]
  },

  {
    title: "分布式追踪OpenTelemetry与Jaeger实战",
    content: `## 题目描述

深入理解分布式追踪系统的原理与生产实践：

### 核心问题
1. **Trace/Span/ParentSpanId模型**：一次请求的完整调用链路建模
2. **OpenTelemetry SDK**：统一的Tracing API（取代OpenCensus+Jaeger+Zipkin SDK碎片化）
3. **Span上下文传播**：W3C Trace Context标准(traceparent header)、Baggage跨进程传递
4. **采样率策略**：Always Sample/概率采样(1%) / Tail-based Sampling(异常必采)/自适应采样
5. **Jaeger架构**：Collector(收集) → Storage(Elasticsearch/Cassandra/Kafka) → UI(查询展示)
6. **性能影响**：Span创建/序列化/网络传输的开销与优化
7. **与日志/指标的关联**：TraceID注入日志、Metrics Exemplar
8. **常见排查场景**：慢请求定位、错误链路分析、依赖关系发现

### 考察点
- 分布式追踪数据模型
- OTel标准化理解
- 生产环境采样策略`,
    solution: `## 深度解析

### Trace/Span 数据模型

\`\`\`
Trace (一次完整的分布式请求)
├── Span A (Client Request, root span)
│   ├── Span B (HTTP GET /api/user, child of A)
│   │   ├── Span C (MySQL SELECT * FROM users, child of B)
│   │   └── Span D (Redis GET user:123, child of B)
│   └── Span E (HTTP POST /api/audit, child of A)
│       └── Span F (Kafka SEND audit-event, child of E)

// 每个Span包含：
// - traceId: 全局唯一的Trace标识
// - spanId: 当前Span的唯一标识
// - parentSpanId: 父Span标识(root span为空)
// - operationName: 操作名称
// - startTime/duration: 开始时间与耗时
// - tags: 键值对属性(http.method, db.statement, error=true)
// - logs: 结构化日志事件
// - status: OK/ERROR
\`\`\`

### OpenTelemetry 上下文传播

**W3C Trace Context标准Header：**
\`\`\`
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
//          ^-version  ^-trace-id                    ^-span-id  ^-flags

tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
// 供应商特定的上下文数据（Baggage）
\`\`\`

**Java OTel SDK使用：**
\`\`\`java
// 自动instrumentation agent（零侵入）
-javaagent:opentelemetry-javaagent.jar \\
  -Dotel.service.name=my-service \\
  -Dotel.exporter.otlp.endpoint=http://jaeger-collector:4317

// 手动创建Span
Tracer tracer = openTelemetry.getTracer("my-instrumentation", "1.0.0");

Span span = tracer.spanBuilder("processOrder")
    .setParent(Context.current())  // 关联父Span
    .setAttribute("order.id", orderId)
    .setAttribute("order.amount", amount)
    .startSpan();

try (Scope scope = span.makeCurrent()) {
    // 业务逻辑...
    processPayment(orderId);
} catch (Exception e) {
    span.setStatus(StatusCode.ERROR, e.getMessage());
    span.recordException(e);
} finally {
    span.end();
}
\`\`\`

### 采样策略对比

| 策略 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| Always Sample | 全量采集 | 数据完整 | 存储压力大 |
| 概率采样(1%) | 随机决定 | 存储省 | 可能遗漏重要错误 |
| Tail-based | 先缓冲，异常的全量采集 | 错误不漏 | 需要尾部处理器，延迟高 |
| 自适应采样 | 根据QPS动态调整 | 平衡效果 | 实现复杂 |

**推荐生产配置：** 正常请求1%采样 + 错误请求(Span status=ERROR)100%采样 + P99慢请求100%采样。

### Jaeger架构部署

\`\`\`yaml
# Jaeger Collector (接收OTLP/gRPC数据)
jaeger-collector:
  otlp:
    grpc:
      host: 0.0.0.0
      port: 4317
  storage:
    type: elasticsearch
    servers: http://elasticsearch:9200
    index-prefix: jaeger-index

# Jaeger Query (UI查询)
jaeger-query:
  service: query
  ui:
    config-file: /etc/jaeger-ui/ui.json

# Jaeger Agent (可选，sidecar模式采集)
jaeger-agent:
  reporter:
    collectorHostPort: "jaeger-collector:14267"
\`\`\`

### 排查实战：慢请求定位

**场景：** 用户反馈订单接口响应超过5秒

**步骤1：Jaeger UI搜索**
- 按Service=user-api, Operation=POST /api/orders, Duration>5s筛选
- 找到目标Trace

**步骤2：分析调用链**
\`\`\`
[user-api] POST /api/orders (5200ms) ⚠️
  └── [order-svc] createOrder (4800ms)
       ├── [mysql] INSERT INTO orders ... (200ms)
       ├── [inventory-svc] reserveStock (3500ms) ⚠️ SLOW!
       │    └── [mysql] UPDATE inventory ... (3400ms) ⚠️ 行锁等待!
       └── [payment-svc] createPayment (300ms)
\`\`\`

**结论：** 库存服务的UPDATE语句存在行锁竞争，需要优化SQL或拆分热点行。

### TraceID注入日志

\`\`\`java
// MDC自动注入TraceID
// logback-spring.xml
<pattern>%d{yyyy-MM-dd HH:mm:ss} [%X{trace_id}] %-5level %logger{36} - %msg%n</pattern>

// OTel自动将traceId/spanId放入MDC，日志输出：
// 2024-01-15 10:23:45 [0af7651916cd43dd8448eb211c80319c] ERROR c.s.OrderService - 创建订单失败
// 用trace_id可以在Jaeger和日志之间跳转查询
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "分布式追踪", "OpenTelemetry", "Jaeger", "可观测性"]
  },

  {
    title: "熔断器模式与Sentinel实现原理",
    content: `## 题目描述

深入理解熔断器(Circuit Breaker)模式及Sentinel的实现：

### 核心问题
1. **熔断器三态模型**：Closed(关闭/正常) → Open(打开/熔断) → Half-Open(半开/探测)
2. **状态转换条件**：失败率阈值/慢调用比例/异常数阈值、恢复时间窗口
3. **Half-Open探测机制**：放行少量请求探测下游是否恢复
4. **Sentinel滑动窗口统计**：LeapArray数组环形窗口、样本统计(WindowWrap)
5. **Sentinel规则体系**：流控规则(flow)、降级规则(degrade)、热点规则(param_flow)、系统规则(system)、授权规则(authority)
6. ** Sentinel控制台(Dashboard)**：实时监控、规则推送(Nacos/Apollo持久化)
7. **Hystrix vs Resilience4j vs Sentinel对比**
8. **降级返回策略**：默认降级/Fallback方法/自定义降级响应

### 考察点
- 熔断器模式本质
- Sentinel底层原理
- 规则配置与调优`,
    solution: `## 深度解析

### 熔断器三态模型

\`\`\`
              失败率 > 阈值
    ┌───────── Closed ─────────┐
    │                          │
    │   (正常放行所有请求)      │
    │   统计失败率/慢调用比例   │
    │                          ▼
    │                      Half-Open
    │                      (探测状态)
    │                      放行N个请求
    │                      ╱         ╲
    │                  成功           失败
    │                  ╱               ╲
    │                 ▼                 ▼
    │             Closed            Open
    │         (恢复正常)        (继续熔断)
    │                            │
    │                            │ 经过冷却时间
    │                            │ (recovery timeout)
    │                            └──────────► Half-Open
    └───────────────────────────────────────────
\`\`\`

**各状态行为：**

| 状态 | 请求处理 | 统计 | 说明 |
|------|---------|------|------|
| **Closed** | 正常放行 | 滑动窗口统计 | 正常状态 |
| **Open** | **快速失败**(不调用下游) | 暂停统计 | 熔断中，直接返回降级结果 |
| **Half-Open** | 放行少量请求(如1个) | 重新统计 | 探测下游是否恢复 |

### Sentinel滑动窗口原理

\`\`\`java
// LeapArray: 核心数据结构
public abstract class LeapArray<T> {
    private final int windowLengthInMs;   // 窗口长度(如500ms)
    private final int sampleCount;         // 窗口数(如2个=1秒)
    private final int intervalInMs;        // 总间隔(如1000ms)
    private final AtomicReferenceArray<WindowWrap<T>> array;  // 环形数组

    // currentWindow() 根据时间计算当前窗口索引
    // 时间 % arrayLength → 窗口位置
    // 每个WindowWrap记录startTime和MetricBucket(统计指标)
}

// MetricBucket统计内容：
// pass(通过数) / block(拦截数) / exception(异常数) / rt(响应时间) / success(成功数)
\`\`\`

**统计精度：** windowLength=500ms, sampleCount=2 → 每500ms一个统计窗口，滑动窗口总跨度1秒。精度越高(sampleCount越大)内存占用越大。

### Sentinel降级规则配置

\`\`\`java
// 方式1：注解定义
@GetMapping("/api/resource")
@SentinelResource(
    value = "getResource",
    fallback = "resourceFallback",        // 降级方法
    blockHandler = "resourceBlockHandler"  // 流控方法
)
public Resource getResource(@RequestParam String id) { ... }

// Fallback方法（业务异常降级）
public Resource resourceFallback(String id, Throwable t) {
    return new Resource("default", "服务繁忙，请稍后再试");
}

// BlockHandler方法（Sentinel流控/熔断触发）
public Resource resourceBlockHandler(String id, BlockException ex) {
    return new Resource("default", "系统限流中");
}

// 方式2：Dashboard控制台配置
// 降级规则：
//   策略: 慢调用比例
//   最大RT: 200ms
//   比例阈值: 0.5 (50%请求超过200ms)
//   最小请求数: 5
//   熔断时长: 10s
//   统计时长: 10s
\`\`\`

### 三大熔断框架对比

| 维度 | Hystrix(已停更) | Resilience4j | Sentinel(阿里) |
|------|----------------|--------------|---------------|
| 语言 | Java | Java(函数式) | Java |
| 隔离策略 | 线程池/信号量 | 信号量 | 信号量 |
| 熔断 | ✅ | ✅ | ✅ |
| 限流 | ❌ | ❌ | ✅(内置) |
| 热点防护 | ❌ | ❌ | ✅(参数级) |
| 实时监控 | ✅(RxJava流) | ✅(Micrometer) | ✅(Dashboard) |
| 规则持久化 | Archaius配置 | 配置文件 | Nacos/Apollo/ZooKeeper |
| 动态推送 | 需重启 | 需重启 | ✅ 实时推送 |
| 生态 | Netflix系 | Java MicroProfile | Spring Cloud Alibaba |

### 生产调优建议

1. **熔断阈值不要设太低**：偶发网络抖动不应触发熔断（建议失败率>50%才熔断）
2. **恢复时间窗口适中**：太短频繁切换，太长恢复慢（建议10-30秒）
3. **Half-Open探测量要少**：1-3个请求足够，太多可能压垮刚恢复的下游
4. **结合降级**：熔断时返回兜底数据（缓存值/默认值/友好提示），而不是直接报错
5. **监控熔断事件**：熔断本身是重要告警信号，说明下游有问题`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "熔断器", "Sentinel", "Hystrix", "Resilience4j", "高可用"]
  },

  {
    title: "限流算法实现与分布式限流方案",
    content: `## 题目描述

深入理解各种限流算法的原理、实现与适用场景：

### 核心问题
1. **固定窗口(Fixed Window)**：时间窗口内计数，临界突发问题
2. **滑动窗口(Sliding Window)**：滑动子窗口平滑计数，解决临界突发
3. **漏桶(Leaky Bucket)**：匀速流出，削峰填谷
4. **令牌桶(Token Bucket)**：允许一定突发，Guava RateLimiter原理
5. **滑动日志(Sliding Log)**：精确记录每次请求时间戳，精度最高但内存大
6. **Redis Lua分布式限流**：固定窗口/滑动窗口的Redis实现
7. **Sentinel热点参数限流**：针对特定参数值的QPS限制
8. **网关层限流 vs 应用层限流 vs 数据库层限流的多级限流架构
9. **限流的优雅处理**：429 Too Many Requests、Retry-After Header、排队等待

### 考察点
- 各算法原理与trade-off
- 分布式限流实现
- 生产环境限流架构`,
    solution: `## 深度解析

### 六种限流算法对比

| 算法 | 原理 | 突发处理 | 精度 | 内存 | 复杂度 | 适用场景 |
|------|------|---------|------|------|--------|---------|
| 固定窗口 | 按时间片计数 | 临界突发❌ | 低 | O(1) | 简单 | 简单防护 |
| 滑动窗口 | 滑动子窗口求和 | 较好✅ | 中 | O(n) | 中等 | API网关 |
| 漏桶 | 队列+匀速流出 | 不允许❌ | 高 | O(1) | 中等 | 流量整形 |
| 令牌桶 | 令牌桶+突发额度 | 允许✅ | 高 | O(1) | 中等 | 微服务 |
| 滑动日志 | 记录每次请求时间 | 精确✅ | 最高 | O(n) | 高 | 精确计费 |
| Redis Lua | 分布式原子操作 | 取决于算法 | 高 | O(1) | 中等 | 分布式 |

### 令牌桶算法详解（Guava RateLimiter）

\`\`\`java
// Guava RateLimiter核心原理（平滑突发限流）
RateLimiter limiter = RateLimiter.create(100.0); // 100 QPS

// 核心变量：
// storedPermits: 当前桶中令牌数
// maxPermits: 桶的最大容量（允许突发的令牌数）
// stableIntervalMicros: 令牌生成间隔（1/QPS微秒）
// nextFreeTicketTimestamps: 下次可以获取令牌的时间戳

public double acquire(int permits) {
    long microsToWait = reserve(permits);  // 计算需要等待的时间
    stopwatch.sleepMicrosUninterruptibly(microsToWait);  // 等待
    return microsToWait / 1000000.0;  // 返回等待秒数
}

// reserve()核心逻辑：
// 1. 计算当前时刻应该有多少令牌（距离上次获取的时间 * 速率）
// 2. storedPermits = min(maxPermits, 新计算的令牌数)
// 3. if (storedPermits >= permits) 直接扣除，等待时间为0
// 4. else 等待时间 = (permits - storedPermits) * stableIntervalMicros
\`\`\`

**关键特性：** 允许突发流量（桶中有囤积令牌时可立即获取），长期来看平均速率不超过设定值。

### Redis Lua分布式限流

**固定窗口实现：**
\`\`\`lua
-- KEYS[1] = limit:key
-- ARGV[1] = 限流阈值, ARGV[2] = 窗口时长(毫秒)

local current = tonumber(redis.call('GET', KEYS[1]) or "0")
if current >= tonumber(ARGV[1]) then
    return 0  -- 达到限额
else
    redis.call('INCR', KEYS[1])
    if current == 0 then
        redis.call('PEXPIRE', KEYS[1], ARGV[2])
    end
    return 1  -- 放行
end
\`\`\`

**滑动窗口优化实现：**
\`\`\`lua
-- 使用ZSET(score=请求时间戳)实现精确滑动窗口
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])  -- 窗口大小(毫秒)
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - window)  -- 清除过期
local count = redis.call('ZCARD', KEYS[1])

if count < limit then
    redis.call('ZADD', KEYS[1], now, now .. ':' .. math.random())  -- 记录请求
    return 1
else
    return 0
end
\`\`\`

### 多级限流架构

\`\`\`
用户请求
  ↓
[Nginx层] limit_req zone=api burst=20 nodelay;  (第一道防线：IP级限流)
  ↓
[API网关] Sentinel/RateLimiter  (第二道防线：路由级限流)
  ↓
[应用层] @RateLimiter annotation  (第三道防线：接口级限流)
  ↓
[数据库] max_connections=200  (第四道防线：连接数限制)
\`\`\`

**各级限流关注点：**
- Nginx：防DDoS、IP维度的粗粒度限流
- 网关：服务级别的全局限流、热点参数限流
- 应用：精细化的业务接口限流
- DB：最终保护，防止连接池耗尽

### 限流响应处理

\`\`\`java
@ExceptionHandler(RateLimitExceededException.class)
public ResponseEntity<ApiResult> handleRateLimit(RateLimitExceededException e) {
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)  // 429
        .header("Retry-After", "1")  // 告知客户端1秒后重试
        .body(ApiResult.fail("REQUEST_TOO_FAST", "请求过于频繁，请稍后再试"));
}
\`\`\`

**客户端配合：** 收到429 + Retry-After后指数退避重试（1s → 2s → 4s → 8s）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "限流", "令牌桶", "Redis", "Sentinel", "高可用"]
  },

  {
    title: "幂等性设计方案与分布式防重",
    content: `## 题目描述

深入理解分布式系统中的幂等性设计：

### 核心问题
1. **幂等性定义**：f(f(x)) = f(x)，多次执行与一次执行结果相同
2. **需要幂等的场景**：前端重复点击、网络超时重试、MQ重复消费、第三方回调重试
3. **六种幂等方案**：
   - Token机制（前端获取Token→提交携带→服务端删除Token）
   - 数据库唯一约束（UNIQUE INDEX防重复插入）
   - 乐观锁（版本号/时间戳 WHERE version=N）
   - 分布式锁（Redis SETNX / Redisson RLock）
   - 状态机约束（订单状态流转：PAID→不能再次PAY）
   - 去重表（独立幂等表记录请求ID）
4. **Token机制的完整流程**：获取Token接口、前端隐藏域/LocalStorage、提交校验删除
5. **MQ消费者幂等**：消息唯一ID + Redis/DB去重
6. **支付回调幂等**：商户订单号+流水号唯一性校验
7. **幂等性与性能的平衡**：Redis vs DB的选择、TTL设置

### 考察点
- 幂等性的多种实现方案
- 不同场景的最优选择
- 分布式防重的完整性`,
    solution: `## 深度解析

### 幂等性方案全景图

\`\`\`
场景                    推荐方案              实现复杂度    可靠性
─────────────────────────────────────────────────────────────
前端重复提交            Token机制              中           高
接口重复调用            唯一约束 + 去重表       低           最高
更新操作(扣款)         乐观锁(version)         低           高
分布式定时任务          分布式锁                中           高
MQ重复消费             消息ID去重              低           高
支付回调               商户订单号+流水号唯一    低           最高
\`\`\`

### 方案1：Token防重复提交（最常用）

\`\`\`java
// Step 1: 前端获取Token
@GetMapping("/token")
public Result<String> getToken(HttpServletRequest request) {
    String token = UUID.randomUUID().toString().replace("-", "");
    redisTemplate.opsForValue()
        .set("idempotent:" + token, "1", 5, TimeUnit.MINUTES);  // 5分钟有效
    return Result.success(token);
}

// Step 2: 提交时携带Token
@PostMapping("/order")
public Result<Order> createOrder(@RequestBody OrderDTO dto,
                                   @RequestHeader("X-Idempotency-Token") String token) {
    // Lua脚本：原子性地判断+删除Token
    String script =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";

    Long result = redisTemplate.execute(
        new DefaultRedisScript<>(script, Long.class),
        Collections.singletonList("idempotent:" + token),
        "1"
    );

    if (result == 0) {
        return Result.fail("请勿重复提交");
    }

    // 执行真正的业务逻辑...
    return Result.success(orderService.create(dto));
}
\`\`\`

**前端配合：**
\`\`\`javascript
// 表单提交前获取Token
async function beforeSubmit() {
    const res = await fetch('/api/token');
    document.getElementById('idempotent-token').value = res.data.token;
}

// 提交时自动携带Token（隐藏域或Header）
form.submit();
\`\`\`

### 方案2：数据库唯一约束（最可靠）

\`\`\`sql
-- 去重表
CREATE TABLE idempotent_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    biz_type VARCHAR(32) NOT NULL COMMENT '业务类型',
    biz_no VARCHAR(64) NOT NULL COMMENT '业务编号(如订单号)',
    request_id VARCHAR(64) NOT NULL UNIQUE COMMENT '请求唯一ID',
    result JSON COMMENT '执行结果(幂等返回)',
    expire_time DATETIME COMMENT '过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_request_id (request_id),
    KEY idx_biz (biz_type, biz_no)
);

-- 业务表也加唯一约束兜底
CREATE TABLE orders (
    order_no VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号(业务唯一)',
    ...
);
\`\`\`

\`\`\`java
@Service
public class OrderService {
    @Transactional
    public Order createOrder(OrderDTO dto) {
        // 1. 插入去重记录（唯一约束冲突则说明重复）
        try {
            idempotentRepo.save(new IdempotentRecord(dto.getBizType(),
                dto.getRequestId()));
        } catch (DuplicateKeyException e) {
            // 查询之前的结果直接返回（幂等返回）
            return queryPreviousResult(dto.getRequestId());
        }

        // 2. 执行业务逻辑
        Order order = doCreateOrder(dto);

        // 3. 更新去重表的结果
        idempotentRepo.updateResult(dto.getRequestId(), order);

        return order;
    }
}
\`\`\`

### 方案3：乐观锁（更新操作幂等）

\`\`\`sql
-- 扣款操作（version乐观锁）
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 5 AND balance >= 100;

-- 受影响行数=1 → 成功
-- 受影响行数=0 → 版本不匹配（已被别人修改）或余额不足 → 抛异常/重试
\`\`\`

### 方案4：MQ消费幂等

\`\`\`java
@RocketMQMessageListener(topic = "order-topic", consumerGroup = "pay-group")
public class PayConsumer implements RocketMQListener<MessageExt> {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void onMessage(MessageExt message) {
        String msgId = message.getMsgId();  // RocketMQ自带唯一消息ID

        // Redis SETNX 去重
        Boolean isNew = redisTemplate.opsForValue()
            .setIfAbsent("mq consumed:" + msgId, "1", 24, TimeUnit.HOURS);

        if (!isNew) {
            log.info("消息{}已消费，跳过", msgId);
            return;  // 幂等：直接跳过
        }

        // 执行消费逻辑...
        processPayment(message);
    }
}
\`\`\`

### 各方案选型指南

| 场景 | 首选方案 | 备选方案 |
|------|---------|---------|
| 表单防重复提交 | Token机制 | 前端按钮disable |
| 创建型接口 | 唯一约束(去重表) | Token |
| 更新型接口 | 乐观锁(version) | 分布式锁 |
| MQ消费 | 消息ID + Redis | 消息ID + DB |
| 支付回调 | 商户号+流水号唯一 | 状态机校验 |
| 定时任务 | 分布式锁(Redisson) | 任务执行记录表 |`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["分布式系统", "幂等性", "防重设计", "Token", "Redis"]
  },

  {
    title: "灰度发布与金丝雀部署策略",
    content: `## 题目描述

深入理解灰度发布(Canary Release)的各种策略与实践：

### 核心问题
1. **灰度发布策略**：按权重比例、按用户特征(Header/Cookie/UserID)、按IP地域、按白名单
2. **金丝雀部署(Canary Deployment)**流程：小流量验证 → 逐步扩大 → 全量发布 → 回滚预案
3. **全链路灰度**：从网关→服务A→服务B→MQ→DB的整条链路灰度（Trace传递）
4. **Feature Flag(特性开关)**：功能粒度的发布控制（Unleash/LaunchDarkly）
5. **ABTest实验平台**：分流策略、指标埋点、统计显著性检验
6. **灰度流量染色**：Gray Tag/Header在服务间透传
7. **数据库灰度**：Schema变更灰度(Double Write)、数据迁移灰度
8. **灰度监控与自动回滚**：错误率/延迟/业务指标阈值触发自动回滚
9. **蓝绿部署 vs 滚动更新 vs 金丝雀 对比

### 考察点
- 灰度发布策略设计
- 全链路灰度实现
- 发布风险控制`,
    solution: `## 深度解析

### 三种发布策略对比

| 策略 | 原理 | 优点 | 缺点 | 回滚速度 |
|------|------|------|------|---------|
| **蓝绿部署** | 两套环境整体切换 | 即时回滚 | 资源翻倍、数据迁移复杂 | 秒级 |
| **滚动更新** | 逐个Pod替换 | 资源节省 | 版本共存期间问题难排查 | 分钟级 |
| **金丝雀** | 小流量逐步扩大 | 风险可控、可验证 | 实现复杂 | 分钟级 |

### 金丝雀标准流程

\`\`\`
Phase 1: 部署1个Pod，流量1%
  ├─ 监控: 错误率、P99延迟、核心业务指标
  ├─ ✅ 通过 → Phase 2
  └─ ❌ 失败 → 自动回滚到上一版本

Phase 2: 扩大到10%，持续5分钟
  ├─ 同上监控
  ├─ ✅ 通过 → Phase 3
  └─ ❌ 失败 → 自动回滚

Phase 3: 扩大到50%，持续10分钟
  ├─ ✅ 通过 → Phase 4 全量
  └─ ❌ 失败 → 自动回滚

Phase 4: 100%全量，移除旧版本
\`\`\`

### 全链路灰度实现

**流量染色机制：**
\`\`\`
┌────────┐  X-Canary: true   ┌──────────┐  X-Canary: true   ┌──────────┐
│  网关   │ ──────────────▶  │ 服务A    │ ──────────────▶  │ 服务B    │
│ (入口)  │                  │ (灰度Pod) │                  │ (灰度Pod) │
└────────┘                  └──────────┘                  └──────────┘
                               │                              │
                         Header透传: MDC/X-Canary向下传播
\`\`\`

**Istio VirtualService灰度配置：**
\`\`\`yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: order-service
            subset: canary
          weight: 100
    - route:
        - destination:
            host: order-service
            subset: stable
          weight: 95
        - destination:
            host: order-service
            subset: canary
          weight: 5   # 5%流量到金丝雀版本
\`\`\`

**Spring Cloud灰度实现（Header透传+Ribbon路由）：**
\`\`\`java
// 灰度过滤器：在网关层标记灰度请求
@Component
public class CanaryFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                     HttpServletResponse res,
                                     FilterChain chain) {
        String userId = req.getHeader("X-User-Id");
        // 灰度用户白名单（可从配置中心动态获取）
        if (canaryUserIds.contains(userId)) {
            req.setHeader("X-Canary", "true");
        } else if (Math.random() < canaryRatio) {  // 如5%随机灰度
            req.setHeader("X-Canary", "true");
        }
        chain.doFilter(req, res);
    }
}

// Ribbon灰度路由规则
public class CanaryRule extends AbstractLoadBalancerRule {
    @Override
    public Server choose(Object key) {
        String canary = RibbonFilterContextHolder.getCurrent()
            .get("canary");
        List<Server> servers = getLoadBalancer().getAllServers();
        return servers.stream()
            .filter(s -> "true".equals(canary)
                ? s.getMetadata().get("canary").equals("true")
                : !s.getMetadata().containsKey("canary"))
            .findFirst()
            .orElse(servers.get(0));  // 兜底
    }
}
\`\`\`

### Feature Flag（特性开关）

\`\`\`java
// 使用Feature Flag控制功能发布
if (featureToggle.isEnabled("new-checkout-flow", userId)) {
    // 新的结算流程（灰度中）
    newCheckoutFlow.process(order);
} else {
    // 旧的结算流程（稳定版）
    oldCheckoutFlow.process(order);
}
\`\`\`

**Feature Flag类型：**
- **Release Flag**：发布完成后移除（临时）
- **Permission Flag**：长期存在（如VIP功能开关）
- **Experiment Flag**：AB实验用（附带分流和指标收集）

### 数据库灰度（Double Write）

\`\`\`
Schema变更灰度流程：
1. 新增列(new_column)到表（兼容旧代码NULL）
2. 应用双写：新旧字段同时写入
3. 数据回填：历史数据迁移到新字段
4. 切换读取：应用改为读新字段
5. 清理：删除旧列

// 每步都可回退！
\`\`\`

### 自动回滚规则

\`\`\`yaml
# Prometheus + Alertmanager 回滚规则
groups:
- name: canary-rollback
  rules:
  - alert: CanaryErrorRateHigh
    expr: |
      sum(rate(http_requests_total{version="canary",status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total{version="canary"}[5m])) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "金丝雀错误率超过5%，触发自动回滚"

  - alert: CanaryLatencyHigh
    expr: histogram_quantile(0.99,
      rate(http_duration_seconds_bucket{version="canary"}[5m])) > 2
    for: 3m
    annotations:
      summary: "金丝钥P99延迟超过2s，触发自动回滚"
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "灰度发布", "金丝雀部署", "DevOps", "Feature Flag"]
  },

  {
    title: "多活容灾架构与单元化设计",
    content: `## 题目描述

深入理解多活容灾架构的设计与实现：

### 核心问题
1. **容灾等级**：RTO(Recovery Time Objective) / RPO(Recovery Point Objective)定义
2. **几种架构模式**：
   - 单机房（无容灾）
   - 同城双活（同一城市两个机房，低延迟同步）
   - 异地双活（不同城市，异步复制）
   - 异地多活（多地同时对外服务，用户就近接入）
   - 两地三中心（生产+同城灾备+异地灾备）
3. **单元化架构(Unit-based Architecture)**：按用户ID分单元，单元内闭环
4. **流量调度**：DNS调度、Anycast、HTTP DNS(DoH)、边缘路由
5. **数据同步方案**：数据库主从复制、CDC(Debezium)、消息队列同步、双向同步冲突解决
6. **故障检测与切换**：健康检查、心跳机制、脑裂预防、故障决策自动化
7. **一致性保障**：跨单元事务、Saga模式、TCC补偿
8. **成本与复杂度权衡**：不是所有系统都需要多活

### 考察点
- 多活架构设计能力
- 数据一致性方案
- 故障切换机制`,
    solution: `## 深度解析

### 容灾等级定义

| 等级 | RTO(恢复时间) | RPO(数据丢失) | 年可用性 | 典型方案 |
|------|-------------|-------------|---------|---------|
| Tier 1 | < 1分钟 | 0 | 99.999% | 单元化多活 |
| Tier 2 | < 15分钟 | < 5分钟 | 99.99% | 异地双活+自动切换 |
| Tier 3 | < 1小时 | < 15分钟 | 99.9% | 异地热备+手动切换 |
| Tier 4 | < 4小时 | < 1小时 | 99% | 冷备+人工恢复 |

### 同城双活 vs 异地多活

\`\`\`
【同城双活】
┌─────────────┐         ┌─────────────┐
│  机房A(北京)  │ ◄─────► │  机房B(北京)  │
│  用户 50%     │  同步复制 │  用户 50%     │
│  延迟 < 1ms   │         │  延迟 < 1ms   │
└─────────────┘         └─────────────┘
特点：低延迟、同步复制强一致、成本中等
适用：金融核心系统

【异地多活】
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  北京单元     │         │  上海单元     │         │  广州单元     │
│  华北用户     │  异步复制 │  华东用户     │  异步复制 │  华南用户     │
│  延迟 ~30ms  │         │  延迟 ~30ms  │         │  延迟 ~30ms  │
└─────────────┘         └─────────────┘         └─────────────┘
特点：就近接入低延迟、最终一致性、成本高
适用：大规模互联网应用
\`\`\`

### 单元化架构（核心！）

\`\`\`
// 单元化路由规则：userId % 单元数量 = 目标单元编号
int unitId = hash(userId) % UNIT_COUNT;

// 单元化架构要求：
// 1. 用户的所有数据（账户/订单/积分/优惠券）都在同一个单元
// 2. 单元内的调用不走跨单元RPC（闭环）
// 3. 跨单元调用通过消息队列异步化

// 单元化数据路由：
┌──────────┐  userId=1001  ┌──────────┐  userId=2001  ┌──────────┐
│  Unit 0  │ ────────────▶│  Unit 1  │ ────────────▶│  Unit 2  │
│ (北京)    │              │ (上海)    │              │ (广州)    │
│ DB0      │              │ DB1      │              │ DB2      │
│ Cache0   │              │ Cache1   │              │ Cache2   │
│ MQ0      │              │ MQ1      │              │ MQ2      │
└──────────┘              └──────────┘              └──────────┘
\`\`\`

**单元化好处：**
- **无跨库事务**：单元内数据一致性容易保证
- **故障隔离**：一个单元故障不影响其他单元
- **无限水平扩展**：增加单元即可扩容
- **就近接入**：用户路由到最近单元，延迟最低

**单元化挑战：**
- **跨单元交易**：A单元用户转账给B单元用户（需要分布式事务）
- **热点数据**：超级用户（如头部主播）的数据集中在一个单元
- **运营复杂性**：多套环境需要同步配置和版本

### 流量调度方案

\`\`\`
层级1: DNS调度（粗粒度，按地域）
  → 华北用户DNS解析到北京VIP

层级2: 边缘路由/CDN（中粒度，按省份）
  → CDN-GW根据来源IP路由到对应单元

层级3: 网关路由（细粒度，按userId）
  → 网关解析token获取userId → hash(userId)路由到单元

层级4: 客户端路由（最细粒度）
  → App内置单元路由表 → 直连对应单元网关
\`\`\`

### 数据同步方案

| 方案 | 延迟 | 一致性 | 复杂度 | 适用场景 |
|------|------|--------|--------|---------|
| 主从同步复制 | ms级 | 强一致 | 低 | 同城双活 |
| 主从异步复制 | 秒级 | 最终一致 | 低 | 异地备份 |
| CDC(Debezium) | 秒级 | 最终一致 | 中 | 异地多活 |
| MQ广播 | 秒级 | 最终一致 | 中 | 事件驱动同步 |
| 双向同步 | 秒级 | 冲突需解决 | 高 | 双向写入场景 |

**冲突解决策略：** Last-Write-Win(时间戳)、版本号向量、业务规则裁定(如金额取大)。

### 故障切换自动化

\`\`\`yaml
# 健康检查配置
healthCheck:
  interval: 5s
  timeout: 2s
  unhealthyThreshold: 3    # 连续3次失败标记为不健康
  healthyThreshold: 2      # 连续2次成功恢复为健康

# 切换决策规则
failover:
  auto: true
  conditions:
    - master_unhealthy: true
    - slave_healthy: true
    - data_lag_seconds: < 10  # 从库延迟小于10秒
  cooldown: 300s  # 冷却时间，防止频繁切换（脑裂防护）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "多活容灾", "单元化", "高可用", "架构设计"]
  },

  // ==================== 数据库高级 (8道) ====================

  {
    title: "NewSQL数据库选型：TiDB/OceanBase/CockroachDB对比",
    content: `## 题目描述

NewSQL数据库的技术选型与场景决策：

### 核心问题
1. **NewSQL定义**：关系模型 + NoSQL的可扩展性 + ACID事务
2. **TiDB架构**：PD( Placement Driver) + TiKV(存储层, Raft) + TiSQL(SQL层), HTAP(TiFlash)
3. **OceanBase架构**：RS(RootService) + Observer(融合节点, Paxos), 多租户
4. **CockroachDB架构**：Range-based分片, SQL layer + KV存储层
5. **六大维度对比**：CAP取舍、扩展方式、SQL兼容性、生态工具、运维复杂度、社区/商业
6. **选型决策树**：什么场景该用什么数据库？
7. **从MySQL迁移到NewSQL的风险与注意事项**
8. **NewSQL vs 传统分库分表 vs 云原生RDS的选择

### 考察点
- NewSQL技术理解
- 数据库选型决策能力
- 迁移风险评估`,
    solution: `## 深度解析

### 架构对比

**TiDB（PingCAP开源）：**
\`\`\`
┌─────────────────────────────────────────────┐
│                  TiDB Cluster                │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  TiDB    │  │  TiDB    │  │  TiDB    │  │
│  │ (SQL层)  │  │ (SQL层)  │  │ (SQL层)  │  │
│  │ 无状态    │  │ 无状态    │  │ 无状态    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └──────────────┼──────────────┘       │
│                      ▼                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  TiKV    │  │  TiKV    │  │  TiKV    │  │
│  │ (存储层)  │  │ (存储层)  │  │ (存储层)  │  │
│  │ Raft组    │  │ Raft组    │  │ Raft组    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                      ▼                       │
│              ┌──────────────┐                │
│              │  PD (元信息)  │                │
│              │  调度/路由    │                │
│              └──────────────┘                │
└─────────────────────────────────────────────┘
\`\`\`

**OceanBase（蚂蚁集团/开源）：**
\`\`\`
┌─────────────────────────────────────────────┐
│              OceanBase Cluster               │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │           Observer (融合节点)          │   │
│  │  SQL引擎 + 存储引擎 + RPC (一体化)    │   │
│  │  基于Paxos的多副本协议                 │   │
│  └──────────────────────────────────────┘   │
│                      │                       │
│              ┌───────▼───────┐               │
│              │ RS (RootService)│              │
│              │ 集群管理/调度   │               │
│              └───────────────┘               │
└─────────────────────────────────────────────┘
\`\`\`

### 六维对比矩阵

| 维度 | TiDB | OceanBase | CockroachDB |
|------|------|-----------|-------------|
| **CAP取向** | CP(默认) | CP | CP |
| **分布式协议** | Multi-Raft | Paxos(自研) | Raft |
| **SQL兼容** | MySQL协议(高度兼容) | MySQL/Oracle双模式 | PostgreSQL协议 |
| **扩展方式** | 存储层水平扩展 | 节点动态加入/移除 | Range自动分裂/合并 |
| **HTAP** | TiFlash列存(优秀) | 列存副本(较好) | 列存族(一般) |
| **最大规模** | PB级 | 万亿行/百PB | PB级 |
| **生态工具** | DM(数据迁移)/TiSpark/BR | ODP代理/OMS管控平台 | 内置工具 |
| **社区** | 活跃(中国最强) | 活跃(蚂蚁背书) | 国际活跃 |
| **商业支持** | 企业版 | 云上OceanBase(阿里云) | Cockroach Labs |
| **学习曲线** | 中(MySQL背景友好) | 中 | 高(PostgreSQL背景) |

### 选型决策树

\`\`\`
你的场景是什么？
│
├─ 金融/支付核心系统？
│   ├─ 要求Oracle兼容？ → OceanBase(Oracle模式)
│   └─ MySQL技术栈？ → TiDB 或 OceanBase(MySQL模式)
│
├─ 海量数据分析+OLTP混合负载(HTAP)？
│   └─ → TiDB (TiFlash列存同步最成熟)
│
├─ 全球多区域部署？
│   └─ → CockroachDB (地理分区原生支持最好)
│
├─ 已有大量MySQL资产/人才？
│   └─ → TiDB (MySQL协议兼容度最高，迁移成本最低)
│
├─ 需要极致稳定性(银行级)？
│   └─ → OceanBase (蚂蚁双11验证，三地五中心)
│
└─ 云原生/Serverless偏好？
    └─ → CockroachDB Serverless 或 TiDB Cloud
\`\`\`

### NewSQL vs 分库分表 vs 云RDS

| 方案 | 扩展性 | 事务支持 | 运维成本 | 适合阶段 |
|------|--------|---------|---------|---------|
| 单机MySQL | ❌ | ✅ ACID | 最低 | 创业初期 |
| 分库分表(ShardingSphere) | ✅ 手动 | ✅(有限) | 高 | 中型规模 |
| 云RDS(读写分离) | ⚠️ 半自动 | ✅ | 低 | 中小型 |
| **NewSQL(TiDB等)** | ✅ 自动 | ✅ 分布式ACID | 中 | 大规模/快速增长 |

**结论：** 数据量TB级以下、QPS万级以下，传统MySQL+读写分离足够。超过这个门槛才值得考虑NewSQL。`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "NewSQL", "TiDB", "OceanBase", "CockroachDB", "选型"]
  },

  {
    title: "HTAP混合事务分析处理架构",
    content: `## 题目描述

HTAP(Hybrid Transactional/Analytical Processing)架构的原理与实践：

### 核心问题
1. **HTAP定义**：同时支持OLTP(事务处理)和OLAP(分析处理)的统一平台
2. **TiDB HTAP架构**：TiKV(行存,OLTP) + TiFlash(列存,OLAP) + 数据自动同步
3. **TiFlash原理**：Raft Learner角色(不参与投票，异步跟随Leader)
4. **MPP(Massively Parallel Processing)执行器**：并行查询加速
5. **行列转换与数据同步机制**：行存→列存的实时转换
6. **TP/AP资源隔离**：TiDB Server资源组(Resource Group)隔离
7. **HTAP vs 传统架构(OLTP DB + ETL + OLAP DW)对比
8. **实时数仓场景**：BI报表实时刷新、实时大屏、Ad-hoc查询
9. **HTAP的性能调优**：TiFlash副本数、MPP并行度、列裁剪

### 考察点
- HTAP架构理解
- TiDB/TiFlash原理
- 实时数据分析方案`,
    solution: `## 深度解析

### 传统架构 vs HTAP

\`\`\`
【传统架构】
OLTP(MySQL) → Binlog → Canal → Kafka → Flink → ClickHouse/Elasticsearch → BI报表
│ 延迟: 分钟级~小时级
│ 组件多、维护复杂、数据不一致窗口大

【HTAP架构(TiDB)】
TiDB SQL → 同时查询 TiKV(行存) 和 TiFlash(列存)
│ 延迟: 秒级(实时同步)
│ 统一平台、自动同步、一致性有保证
\`\`\`

### TiFlash Raft Learner机制

\`\`\`
Normal Raft Group (3副本):
┌──────┐  ┌──────┐  ┌──────┐
│ TiKV1│  │ TiKV2│  │ TiKV3│
│ Leader│  │Follower│Follower│
│ (投票)│  │ (投票) │ (投票) │
└──────┘  └──────┘  └──────┘
    │         │         │
    └─────────┼─────────┘
              │ Raft Log复制
              ▼
        ┌──────────┐
        │ TiFlash  │  ← Raft Learner
        │ (列存)   │  ← 不参与投票(不影响写性能)
        │ (异步)   │  ← 只跟随Leader
        └──────────┘
\`\`\`

**Learner的关键设计：**
- **不参与投票**：TiFlash副本的增加不影响Raft提交延迟（多数派仍为3中的2个）
- **异步解码**：TiFlash异步从Leader拉取Raft Log，解码为列存格式
- **无损转换**：行存→列存转换过程中数据不丢失

### MPP执行器原理

\`\`\`sql
-- 例：按地区汇总销售额（涉及大量扫描和聚合）
SELECT region, SUM(amount) as total_sales
FROM orders
GROUP BY region
ORDER BY total_sales DESC;

-- TiDB MPP执行计划：
TiDB SQL Layer (Coordinator)
  │
  ├── Exchange(Sender) → TiFlash Node 1: Scan region IN ('North')
  │                                          │ Aggregate(SUM)
  │                                          │ Exchange(Receiver)
  │
  ├── Exchange(Sender) → TiFlash Node 2: Scan region IN ('South')
  │                                          │ Aggregate(SUM)
  │                                          │ Exchange(Receiver)
  │
  ├── Exchange(Sender) → TiFlash Node 3: Scan region IN ('East','West')
  │                                          │ Aggregate(SUM)
  │                                          │ Exchange(Receiver)
  │
  └── Final Aggregation + Sort (Coordinator汇总各节点部分结果)
\`\`\`

**MPP加速效果：** 10亿行数据聚合查询，单节点可能需要60秒，3节点MPP可能只需20秒（接近线性加速）。

### TP/AP资源隔离

\`\`\`sql
-- 创建资源组：OLTP查询使用高优先级资源组
CREATE RESOURCE GROUP oltp_group
  RU_PER_SEC = 10000    -- 每秒10000 RU(Request Units)
  PRIORITY = HIGH
  BURST_LIMIT = 300;

CREATE RESOURCE GROUP olap_group
  RU_PER_SEC = 50000    -- 分析查询需要更多资源
  PRIORITY = LOW
  BURUST_LIMIT = 10000;

-- 绑定用户到资源组
ALTER USER 'oltp_user' RESOURCE GROUP oltp_group;
ALTER USER 'bi_analyst' RESOURCE GROUP olap_group;
\`\`\`

**效果：** BI分析师的大查询不会影响线上OLTP业务的响应时间。

### HTAP适用场景

| 场景 | 传统方案 | HTAP方案 | 提升 |
|------|---------|---------|------|
| 实时BI报表 | T+1离线 | 实时查询 | 延迟从天→秒 |
| 实时大屏 | Redis缓存+定时刷新 | 直接查询TiFlash | 准确性↑ 维护↓ |
| Ad-hoc分析 | 导出数据到分析库 | 直接SQL查询 | 效率↑ |
| 实时风控 | 异步同步到ES | 行列共存即时查 | 延迟↓ |

### 不适合HTAP的场景

- 需要复杂ETL清洗的数据仓库（仍建议专用OLAP）
- 需要机器学习训练的数据科学场景（建议Spark/Databricks）
- 超大规模数据挖掘（PB级以上建议ClickHouse/Doris）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "HTAP", "TiDB", "TiFlash", "OLAP", "MPP"]
  },

  {
    title: "时序数据库原理与选型",
    content: `## 题目描述

时序数据库(Time Series Database)的原理、选型与应用：

### 核心问题
1. **时序数据特征**：时间戳+度量值+标签、写入远多于读取、数据只追加不更新
2. **主流TSDB对比**：InfluxDB / TimescaleDB / Prometheus TSDB / VictoriaMetrics / IoTDB
3. **数据压缩算法**：Gorilla XOR压缩(Facebook)、Delta-of-Delta + XOR、Simple8b
4. **数据保留策略(Retention Policy)**：自动过期删除、降采样(Downsampling)
5. **连续查询(Continuous Query, CQ)**：预聚合、物化视图
6. **高基数(High Cardinality)问题**：标签组合爆炸、内存/性能影响
7. **Prometheus TSDB原理**：V2(V3)存储引擎、Head Chunk、Block、WAL+Checkpoint
8. **时序数据库在监控/IoT/金融/日志中的应用

### 考察点
- 时序数据特性理解
- Gorilla压缩原理
- TSDB选型能力`,
    solution: `## 深度解析

### 时序数据的四大特征

1. **时间结构化**：每条数据必有时间戳，按时间有序
2. **写入密集**：写入量通常是读取量的10-100倍
3. **极少更新删除**：主要是append-only，update/delete很少
4. **近期热数据**：90%的查询集中在最近的数据

### Gorilla XOR压缩算法（Facebook论文）

**核心思想：利用相邻数据点的差值通常很小来压缩**

\`\`\`
原始浮点数序列（CPU使用率）：
t1: 23.5  → IEEE 754: 0 10000011 01110100011001100110011
t2: 23.7  → IEEE 754: 0 10000011 01110110011001100110011
t3: 24.1  → IEEE 754: 0 10000011 01110001010001111010111

Gorilla压缩步骤：
Step 1: XOR相邻值
  t2 ⊕ t1 = 00000000 00000000 00000110 00000000000  (只有几位不同！)
  t3 ⊕ t2 = 00000000 00000000 00000110 11011111100

Step 2: 利用前导零和尾随零编码
  XOR结果的leading zeros和trailing zeros通常很多
  → 只存储有效位 + (leading_zeros, trailing_zeros)

Step 3: 进一步压缩
  - 如果XOR=0，用1个bit表示(0)
  - 如果与前一个XOR的有效位位置相同，只存有效位(10 + 有效位)
  - 否则存完整的(leading_zeros + 有效位 + trailing_zeros) (11 + ...)
\`\`\`

**压缩效果：** 浮点数从64bit压缩到平均1-2bit（压缩比30:1~60:1）！这就是为什么Prometheus能轻松存储百万级时间序列。

### 主流TSDB对比

| 特性 | InfluxDB | TimescaleDB | Prometheus | VictoriaMetrics |
|------|----------|-------------|-----------|-----------------|
| 底层存储 | TSM(自研) | PostgreSQL Hypertable | TSDB(自研) | LSM(自研) |
| 查询语言 | Flux/InQL | SQL(超集) | PromQL | MetricsQL(PromQL兼容) |
| 集群 | 企业版(付费) | 原生支持 | 联邦集群 | 原生集群(免费) |
| 压缩 | Gorilla变种 | 压缩 | Gorilla | Gorilla |
| 生态系统 | Chronograf/Tick | pgAdmin/psql | Grafana | Grafana |
| 写入性能 | 高 | 中(受PG限制) | 很高 | 最高 |
| 高基数处理 | 一般 | 好 | 差(内存瓶颈) | 优秀 |
| 适用场景 | IoT/DevOps | 已有PG资产 | K8s监控 | 替代Prometheus |

### Prometheus TSDB存储结构

\`\`\`
/var/lib/prometheus/
├── WAL/                    # Write-Ahead Log(预写日志)
│   ├── 00000001
│   └── 00000002
├── checkpoint/             # Checkpoint文件(WAL压缩)
│   └── 000001
├── chunks_head/            # Head Block(内存中的可变数据)
│   └── 000001
└── blocks/                 # 不可变Block(持久化的历史数据)
    ├── 01E.../
    │   ├── meta.json       # 元信息(min/max time, stats)
    │   ├── index           # 倒排索引(标签→Chunk)
    │   └── chunks/         # 数据文件(ORC格式压缩)
    └── 02E.../

// 数据写入流程：
// 1. 写入WAL(防崩溃)
// 2. 写入Head Block(内存, mmap)
// 3. Head满2h → 压缩为不可变Block → 落盘
// 4. Block进一步合并(compaction)提高压缩率
\`\`\`

### Retention Policy & Downsample

\`\`\`sql
-- InfluxDB: 数据保留7天，自动删除更早的数据
CREATE RETENTION POLICY "7day" ON "metrics" DURATION 7d REPLICATION 1 DEFAULT

-- TimescaleDB: 连续聚合(自动降采样)
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  device_id,
  avg(temperature) AS avg_temp,
  max(temperature) AS max_temp,
  count(*) AS readings_count
FROM sensor_data
GROUP BY hour, device_id;

-- 结果：原始数据保留7天，每小时聚合数据保留1年
\`\`\`

### 高基数问题与解决

**问题：** 如果每个请求都有unique_id标签，标签组合爆炸 → 内存耗尽

**解决策略：**
1. **控制标签基数**：不用userID做标签，用tenant_id（基数小得多）
2. **Recording Rules**：预聚合降低基数
3. **VictoriaMetrics**：对高基数场景做了专门优化（内存效率比Prometheus高10x）
4. **Thanos/Cortex**： 远程存储方案，将存储与计算分离`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "时序数据库", "InfluxDB", "Prometheus", "Gorilla压缩", "监控"]
  },

  {
    title: "图数据库Neo4j与知识图谱构建",
    content: `## 题目描述

图数据库(Graph Database)的原理与知识图谱(Knowledge Graph)构建：

### 核心问题
1. **图数据模型**：节点(Node/Vertex)、关系(Relationship/Edge)、属性(Property)
2. **Neo4j架构**：原生图存储、索引免费(Index-Free Adjacency)、Cypher查询语言
3. **图遍历算法**：BFS/DFS、最短路径(Dijkstra/A*)、PageRank、社区发现(Louvain)
4. **知识图谱构建流程**：数据抽取(NER/RE) → 知识融合 → 知识存储 → 图谱应用
5. **Cypher查询语法**：MATCH/WHERE/RETURN/Create/MERGE、模式匹配
6. **图数据库 vs 关系数据库**：多跳JOIN性能对比
7. **典型应用场景**：社交网络分析、推荐引擎、欺诈检测、知识问答、供应链追溯
8. **NebulaGraph(国产)与Neo4j对比**：分布式架构、查询语言(nGQL vs Cypher)

### 考察点
- 图数据库原理
- Cypher查询能力
- 知识图谱构建流程`,
    solution: `## 深度解析

### 为什么关系数据库不适合图查询？

\`\`\`
-- 问题：找出"张三的朋友的朋友买过的商品"(3跳查询)
-- MySQL: 需要5次JOIN（users JOIN friends JOIN friends JOIN orders JOIN products）
-- 每次JOIN都是O(n*m)，3跳就是O(n³)...

-- Neo4j: Index-Free Adjacency，直接沿关系指针遍历
-- 每跳都是O(1)指针寻址，3跳 = O(3) = O(k) k=跳数
\`\`\`

**Index-Free Adjacency（核心优势）：**
\`\`\`
// 关系数据库：JOIN需要索引查找 → 随机I/O
// Neo4j：每个节点直接存储关系的物理指针 → 顺序I/O

// Neo4j存储结构（简化）：
Node(张三):
  id: 1
  properties: {name:"张三"}
  relationships: [
    {type:FRIEND, target:2},    // 直接指向李四的存储位置
    {type:COLLEAGUE, target:5},  // 直接指向王五
    {type:FRIEND, target:8}      // 直接指向赵六
  ]
\`\`\`

### Cypher查询语法

\`\`\`cypher
-- 1. 创建节点和关系
CREATE (p:Person {name:'张三', age:30})
CREATE (c:Company {name:'阿里巴巴'})
CREATE (p)-[:WORKS_AT {since:2020, role:'工程师'}]->(c)

-- 2. 模式匹配查询（找朋友的朋友）
MATCH (p:Person {name:'张三'})-[:FRIEND]->(friend:Person)-[:FRIEND]->(fof:Person)
RETURN fof.name, fof.age

-- 3. 最短路径
MATCH (start:Person {name:'张三'}), (end:Person {name:'王五'})
MATCH p = shortestPath((start)-[*]-(end))
RETURN p, length(p) AS hops

-- 4. 推荐引擎（找共同好友最多的潜在朋友）
MATCH (me:Person {name:'张三'})-[:FRIEND]->(common:Person)<-[:FRIEND]-(:Person)-[:FRIEND]->(potential:Person)
WHERE NOT (me)-[:FRIEND]->(potential) AND me <> potential
RETURN potential.name, count(common) AS mutual_friends
ORDER BY mutual_friends DESC
LIMIT 10

-- 5. 欺诈检测（找环形转账）
MATCH path = (a:Account)-[r:TRANSFER*2..5]->(a)
WHERE ALL(rel in relationships(path) WHERE rel.amount > 10000)
RETURN path, [n in nodes(path) | n.id] AS cycle_accounts
\`\`\`

### 知识图谱构建流程

\`\`\`
Step 1: 数据抽取
├── 结构化数据：MySQL表 → 直接导入
├── 半结构化：JSON/XML → 解析提取实体
└── 非结构化：文本 → NLP(NER命名实体识别 + RE关系抽取)
    │  例："马云于1999年在杭州创办了阿里巴巴"
    │  → Entity: [马云(人物), 1999(时间), 杭州(地点), 阿里巴巴(组织)]
    │  → Relation: [马云-创办-阿里巴巴, 阿里巴巴-位于-杭州]

Step 2: 知识融合（实体对齐）
├── 指称消解："马老师" = "马云" = "Jack Ma"
└── 关系合并：多条相同关系合并，属性加权

Step 3: 知识质量
├── 冲突检测：同一事实矛盾（如两个不同的出生日期）
├── 不完整推理：缺失属性的推断
└── 知识校验：规则检验（如年龄不能为负）

Step 4: 图谱存储与应用
├── 存入Neo4j/NebulaGraph
├── 构建上层应用（搜索/推荐/问答/可视化）
└── 持续更新（增量构建）
\`\`\`

### Neo4j vs NebulaGraph

| 维度 | Neo4j | NebulaGraph |
|------|-------|-------------|
| 架构 | 单机/集群(Causal Clustering) | 原生分布式(Share Nothing) |
| 存储方式 | 原生图存储 | 原生图存储(分区+副本) |
| 查询语言 | Cypher(声明式) | nGQL(Cypher方言) |
| 最大规模 | 数十亿节点 | 千亿点万亿边 |
| 社区 | 国际成熟 | 中国活跃(字节跳动/美团/京东) |
| 部署 | Docker/手动 | Kubernetes原生 |
| 开源协议 | GPL v3(企业版闭源) | Apache 2.0(完全开源) |
| 适用场景 | 中小规模/快速原型 | 大规模生产/国产替代 |`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "图数据库", "Neo4j", "知识图谱", "Cypher", "NebulaGraph"]
  },

  {
    title: "多租户数据库架构设计",
    content: `## 题目描述

SaaS系统中多租户(Multi-Tenancy)的数据库架构设计：

### 核心问题
1. **三种隔离模式**：
   - Database per Tenant（独立数据库，最高隔离）
   - Schema per Tenant（独立Schema，中等隔离）
   - Row-Level Tenancy（共享库+租户ID行级隔离，最低成本）
2. **各模式的优缺点对比**：隔离性、成本、扩展性、备份恢复、合规性(GDPR)
3. **Row-Level实现方案**：
   - tenant_id列 + 全局过滤（Hibernate Filter / MyBatis Interceptor）
   - 行级安全(Row-Level Security, RLS)
   - 应用层透明化（自动注入tenant_id条件）
4. **数据迁移**：租户升级/降级时的数据搬迁
5. **跨租户查询与聚合**：管理后台需要查看全局数据
6. **性能隔离**：防止单租户的大查询影响其他租户(Resource Governor/CPULimit)
7. **合规与数据主权**：GDPR数据删除权、数据本地化要求

### 考察点
- 多租户架构设计
- Row-Level Security实现
- SaaS产品架构能力`,
    solution: `## 深度解析

### 三种隔离模式对比

\`\`\`
【Database per Tenant】
Tenant A → Database_A (完全独立的数据库)
Tenant B → Database_B (完全独立的数据库)
优点：最强隔离、独立备份恢复、可独立迁移
缺点：成本高(数千租户=数千DB)、维护困难、跨租户查询几乎不可能
适用：金融/医疗/政府（强合规要求）

【Schema per Tenant】
Database_Main
  ├── schema_tenant_a
  └── schema_tenant_b
优点：资源共享、中等隔离、独立备份schema
缺点：PG专属(MySQL不支持Schema)、租户数受限
适用：PostgreSQL技术栈的中型SaaS

【Row-Level Tenancy】(最常用!)
Database_Shared
  ├── table_orders (含 tenant_id 列)
  ├── table_users (含 tenant_id 列)
  └── table_products (含 tenant_id 列)
优点：成本最低、运维简单、易于横向扩展
缺点：需要应用层/DB层保证隔离、数据泄露风险、性能干扰
适用：大多数SaaS应用
\`\`\`

### Row-Level Security 实现方案

**方案1：MyBatis拦截器（应用层）**
\`\`\`java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class TenantInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        // 获取当前租户ID（从ThreadLocal/Token中）
        String tenantId = TenantContext.get();

        if (needTenantFilter(ms.getId())) {
            BoundSql boundSql = ms.getBoundSql(parameter);
            String originalSql = boundSql.getSql();
            // 自动追加 tenant_id 条件
            String tenantSql = "/*+TENANT_FILTER*/ " + originalSql +
                " AND tenant_id = '" + tenantId + "'";
            // 通过反射替换SQL（或使用Plugin包装）
        }
        return invocation.proceed();
    }
}
\`\`\`

**方案2：PostgreSQL Row-Level Security（数据库层，更安全）**
\`\`\`sql
-- 启用RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 创建策略：租户只能看到自己的数据
CREATE POLICY tenant_isolation ON orders
    FOR ALL
    TO app_user
    USING (tenant_id = current_setting('app.current_tenant')::bigint);

-- 应用层设置租户上下文
SET app.current_tenant = '1001';
SELECT * FROM orders;  -- 自动只返回 tenant_id=1001 的数据
\`\`\`

**方案3：Hibernate @Filter（ORM层）**
\`\`\`java
@Entity
@Table(name = "orders")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = Long.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Order {
    // ...
}

// Session开启时激活Filter
session.enableFilter("tenantFilter").setParameter("tenantId", TenantContext.get());
\`\`\`

### 跨租户查询（管理后台）

\`\`\`java
// 管理员查询需要绕过租户过滤
@Service
public class AdminService {

    // 方式1：显式指定超级租户
    public List<OrderStats> getOrderStatsByTenant() {
        TenantContext.setSuperUser(true);  // 标记为超级用户
        try {
            // 此时拦截器跳过tenant_id过滤
            return orderMapper.selectStatsGroupByTenant();
        } finally {
            TenantContext.clear();
        }
    }

    // 方式2：单独的管理数据源/连接（物理隔离）
    @Qualifier("adminDataSource")
    private JdbcTemplate adminJdbc;

    public List<OrderStats> getGlobalStats() {
        return adminJdbc.query("SELECT tenant_id, COUNT(*), SUM(amount) FROM orders GROUP BY tenant_id");
    }
}
\`\`\`

### GDPR合规——数据删除权

\`\`\`java
// 租户注销/数据删除（GDPR Article 17 Right to Erasure）
@Service
public class GdprComplianceService {

    @Transactional
    public void eraseTenantData(Long tenantId) {
        // 1. 删除业务数据
        orderRepository.deleteAllByTenantId(tenantId);
        userRepository.deleteAllByTenantId(tenantId);
        logRepository.deleteAllByTenantId(tenantId);

        // 2. 删除缓存
        cacheManager.evict(tenantId.toString(), "*");

        // 3. 删除搜索索引
        elasticsearchTemplate.deleteByQuery(Query.builder()
            .withQuery(termQuery("tenant_id", tenantId)).build());

        // 4. 记录删除审计日志（不可删除！）
        auditLog.log("ERASURE", tenantId, "GDPR data erasure completed");
    }
}
\`\`\`

### 性能隔离策略

\`\`\`sql
-- PostgreSQL: Resource Queue 限制单租户资源
CREATE RESOURCE QUEUE tenant_queue WITH (
    ACTIVE_STATEMENTS = 20,
    MAX_COST = 1000.0,
    COST_OVERCOMMIT = FALSE,
    MIN_COST = 100.0,
    MAX_MEMORY_PERCENT = 20  -- 单租户最多用20%内存
);

ALTER ROLE tenant_user_1001 RESOURCE QUEUE tenant_queue;

-- MySQL 8.0+: Resource Groups (实验性)
CREATE RESOURCE QUEUE rg_tenant_1001
    TYPE = USER
    VCPU = 2
    THREAD_PRIORITY = 10;
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "多租户", "SaaS", "Row-Level Security", "架构设计"]
  },

  {
    title: "Online DDL与数据库无锁变更工具",
    content: `## 题目描述

在线DDL变更与大表操作的安全生产实践：

### 核心问题
1. **MySQL DDL的锁机制**：MDL(Metadata Lock)、Online DDL(InnoDB)、Instant DDL(8.0+)
2. **DDL操作的风险**：ALTER TABLE导致的表锁、主从延迟、磁盘空间暴涨
3. **gh-ost原理**：(GitHub Online Schema Migration Tool) 触发器影子表无锁变更
4. **pt-online-schema-change原理**：(Percona Toolkit) 触发器拷表+原子切换
5. **MySQL 8.0 Instant DDL**：添加列仅需修改元数据（秒级完成）
6. **大表归档策略**：按时间分区归档、pt-archiver、归档到冷存储(S3/OSS)
7. **数据校验**：pt-table-checksum、pt-table-sync主从一致性检查
8. **DDL变更的最佳实践流程**：评估→测试→灰度→执行→验证

### 考察点
- Online DDL原理
- gh-ost/pt-osc工具掌握
- 大表操作安全规范`,
    solution: `## 深度解析

### MySQL DDL锁机制

\`\`\`
MySQL DDL执行期间的锁：
1. MDL读锁(SELECT): 不阻塞DDL，但DDL要等所有读锁释放
2. MDL写锁(DDL): 排他锁，阻塞所有读写
3. Online DDL(InnoDB): 部分操作支持"在线"执行（不锁表或短时锁）

-- 危险操作示例：
ALTER TABLE orders ADD COLUMN remark VARCHAR(500);
-- 在MySQL 5.6之前：需要重建整个表，期间表锁！(可能锁几十分钟)
-- 在MySQL 5.6+ Online DDL：大部分时间不锁表，但最后有短暂锁
-- 在MySQL 8.0 Instant DDL：添加列末尾只需修改frm文件，瞬间完成！
\`\`\`

### gh-ost 原理（GitHub出品，业界首选）

\`\`\`
┌─────────────────────────────────────────────────────┐
│                    gh-ost 工作流程                    │
│                                                      │
│  1. 创建幽灵表(ghost table) _orders_gho              │
│     CREATE TABLE _orders_gho LIKE orders;            │
│                                                      │
│  2. 创建3个触发器(捕获原表的增删改)                    │
│     AFTER INSERT → 写入_orders_gho                    │
│     AFTER DELETE → 删除_orders_gho对应行              │
│     AFTER UPDATE → 更新_orders_gho对应行              │
│                                                      │
│  3. 全量拷贝(批量chunk复制)                           │
│     SELECT * FROM orders LIMIT 1000 OFFSET 0          │
│     INSERT INTO _orders_gho ...                       │
│     SELECT * FROM orders LIMIT 1000 OFFSET 1000       │
│     ... (不断推进，不锁原表)                           │
│                                                      │
│  4. 增量同步(触发器实时捕获变更)                        │
│     原表的新INSERT/DELETE/UPDATE                      │
│     → 触发器 → 实时应用到_orders_gho                  │
│                                                      │
│  5. 增量应用(apply binlog events from changelog)       │
│     将增量变更追平                                    │
│                                                      │
│  6. CUT-OVER(原子切换)                                │
│     RENAME TABLE orders TO _orders_old,               │
│                  _orders_gho TO orders;               │
│     (RENAME是原子操作，锁时间<1秒!)                    │
│                                                      │
│  7. 清理                                              │
│     DROP TRIGGER; DROP _orders_old;                   │
└─────────────────────────────────────────────────────┘
\`\`\`

**gh-ost vs pt-online-schema-change：**

| 特性 | gh-ost | pt-osc |
|------|--------|--------|
| 触发器 | 3个(INSERT/DELETE/UPDATE) | 3个(同) |
| 增量同步 | binlog stream(无触发器模式可选) | 触发器 |
| Cut-over | RENAME(原子) | RENAME(原子) |
| 暂停/恢复 | ✅ 支持 | ❌ |
| 限流 | ✅ (throttle) | ✅ (--max-load) |
| 主从 | 检查延迟，延迟大则暂停 | 检查延迟 |
| 外键 | 不支持外键表 | 支持外键表 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### MySQL 8.0 Instant DDL

\`\`\`sql
-- Instant DDL支持的操作（仅修改元数据，无需重建表）：
ALTER TABLE orders ADD COLUMN remark VARCHAR(500);  -- 末尾添加列 ✅ Instant
ALTER TABLE orders DROP COLUMN remark;                -- 删除列 ✅ Instant
ALTER TABLE orders MODIFY COLUMN name VARCHAR(200);   -- 改宽列 ✅ 仅增大
ALTER TABLE orders ADD INDEX idx_status(status);       -- 添加索引 ❌ In-place(需要排序)

-- ALGORITHM选项：
ALTER TABLE orders ADD COLUMN remark VARCHAR(500), ALGORITHM=INSTANT;  -- 显式指定
-- ALGORITHM=INPLACE: 不拷贝表数据，但可能短期锁表
-- ALGORITHM=COPY: 重建表（最慢，5.6之前的行为）
\`\`\`

### DDL变更标准流程

\`\`\`
1. 影响评估
   ├── 表大小: SELECT round(data_length/1024/1024) FROM information_schema.tables
   ├── 当前QPS: SHOW GLOBAL STATUS LIKE 'Questions'
   ├── 是否有外键/触发器依赖
   └── 主从延迟容忍度

2. 测试环境验证
   ├── 在同样大小的测试表上执行
   ├── 验证业务SQL兼容性
   └── 记录执行时间和资源消耗

3. 灰度执行（从库先行）
   ├── 先在从库执行gh-ost（--test-on-replica）
   ├── 验证数据一致性
   ├── 切换主从角色
   └── 生产执行（低峰期）

4. 监控与回滚
   ├── gh-ost: --exact-rowcount 验证数据行数
   ├── pt-osc: --check-interval 监控延迟
   └── 回滚方案：gh-ost支持--switch-to-replica（反向同步）
\`\`\`

### ShardingSphere分库分表实战

\`\`\`yaml
# shardingphere配置示例
spring:
  shardingsphere:
    datasource:
      names: ds0,ds1
      ds0:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://localhost:3306/ds0
      ds1:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://localhost:3306/ds1
    rules:
      sharding:
        tables:
          orders:
            actual-data-nodes: ds\${0..1}.orders_\${0..3}
            table-strategy:
              standard:
                sharding-column: user_id
                sharding-algorithm-name: mod
            key-generator:
              column: order_id
              type: SNOWFLAKE
          order_items:
            binding-tables: [orders,order_items]  # 绑定表避免跨库JOIN
        sharding-algorithms:
          mod:
            type: MOD
            props:
              sharding-count: 4
        default-database-strategy:
          standard:
            sharding-column: tenant_id
            sharding-algorithm-name: db_mod
\`\`\`

**分片策略选择：**

| 策略 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| Range范围 | 时间序列数据 | 范围查询快 | 数据倾斜 |
| Hash取模 | 均匀分布 | 数据均匀 | 范围查询需全表扫描 |
| 一致性哈希 | 扩缩容频繁 | 最小迁移量 | 实现复杂 |
| 复合分片 | 多维度查询 | 灵活 | 配置复杂 |

**分库分表后的挑战与解决方案：**

\`\`\`
1. 全局唯一ID
   ├── Snowflake（雪花算法）
   ├── UUID（不推荐，无序导致页分裂）
   ├── Redis INCR / 号段模式（Leaf）
   └── 数据库自增步长（简单但扩展性差）

2. 跨库事务
   ├── Seata AT模式（自动补偿）
   ├── Seata TCC（手动Confirm/Cancel）
   ├── 本地消息表（最终一致性）
   └── Saga模式（长事务编排）

3. 跨库关联查询
   ├── 绑定表（相同分片键的表绑定）
   ├── 冗余字段（反范式设计）
   ├── 全局表（字典表复制到所有分片）
   └── 应用层组装（两次查询在内存中JOIN）

4. 跨库排序分页
   ├── 内存归并（ShardingSphere默认）
   ├── ES搜索引擎（异步同步）
   └── 预聚合+缓存

5. 数据迁移
   ├── 双写方案（新旧表同时写入）
   ├── 增量同步（Canal解析binlog）
   ├── 停机迁移（最简单但不适合高可用）
   └── 在线迁移工具（DM、Syncer）
\`\`\`

**生产环境 Checklist：**

- [ ] 分片键选择合理（高频查询条件、均匀分布）
- [ ] 避免跨库JOIN（通过绑定表或冗余解决）
- [ ] 全局ID生成器高可用部署
- [ ] 非分片键查询走ES索引
- [ ] 定期检查数据倾斜情况
- [ ] 制定扩容预案（倍增策略）
- [ ] 备份恢复策略（每个分片独立备份）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "MySQL", "分库分表", "Online DDL", "ShardingSphere"]
  },

  // ==================== 数据库高级 (第43-44题) ====================

  {
    title: "MySQL索引原理与查询优化深度分析",
    content: `## 题目描述

深入理解MySQL索引机制与SQL性能优化：

### 核心问题
1. **B+树索引结构**：为什么InnoDB选择B+树而非B树/Hash/跳表？聚簇索引 vs 二级索引 vs 联合索引？
2. **索引失效场景**：哪些操作会导致索引失效？如何用EXPLAIN分析执行计划？
3. **覆盖索引与索引下推**：ICP(Index Condition Pushdown)的工作原理与性能提升
4. **索引设计原则**：如何选择索引列？最左前缀原则、索引选择性、前缀索引？
5. **慢查询优化实战**：从EXPLAIN到优化方案的完整流程`,
    solution: `## 深度解析

### 1. B+树索引结构

**InnoDB B+树特点：**

\`\`\`
                    [根节点 - 内存常驻]
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         [非叶子节点]   [非叶子节点]   [非叶子节点]
              │            │            │
       ┌──────┼──────┐     │       ┌────┼────┐
       ▼      ▼      ▼     ▼       ▼    ▼    ▼
   [Leaf] [Leaf] [Leaf] [Leaf] [Leaf] [Leaf] [Leaf]
    ↓  ↓    ↓  ↓    ↓  ↓    ↓  ↓    ↓  ↓   ↓  ↓
   数据 数据 数据 数据 数据 数据 数据 数据

特点：
├── 非叶子节点只存key（不存data）→ 更高的扇出 → 更矮的树
├── 叶子节点用双向链表连接 → 范围查询高效
├── 所有数据都在叶子节点 → 查询稳定（O(log N)）
├── 聚簇索引：叶子节点存完整行数据
└── 二级索引：叶子节点存主键值（回表查询）
\`\`\`

**为何选择B+树而非其他结构：**

| 结构 | 查找 | 范围查询 | 插入删除 | 内存占用 |
|------|------|---------|---------|---------|
| B+树 | O(logN) | ✅ 高效（链表顺序遍历） | 平衡分裂/合并 | 中等 |
| B树 | O(logN) | ❌ 需中序遍历 | 较复杂 | 较大（存data） |
| Hash | O(1) | ❌ 不支持 | O(1)冲突处理 | 小 |
| 跳表 | O(logN) | ✅ | 概率平衡 | 较大（多级指针） |

### 2. 索引失效十大场景

\`\`\`sql
-- ❶ 对索引列使用函数或计算 → 失效
SELECT * FROM users WHERE YEAR(create_time) = 2024;
-- 修复：SELECT * FROM users WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';

-- ❷ 隐式类型转换 → 失效（phone是varchar，传了数字）
SELECT * FROM users WHERE phone = 13800138000;
-- 修复：SELECT * FROM users WHERE phone = '13800138000';

-- ❸ LIKE以%开头 → 失效
SELECT * FROM users WHERE name LIKE '%张';
-- 修复：ES全文检索 或 反转存储 + LIKE '张%'

-- ❹ OR连接的非索引列 → 整体失效
SELECT * FROM users WHERE status = 1 OR age > 30;  -- age无索引则status索引也失效
-- 修复：给age加索引 或 改用UNION

-- ❺ NOT IN / NOT EXISTS / <> / != → 可能失效
SELECT * FROM users WHERE status != 1;
-- 修复：SELECT * FROM users WHERE status IN (0, 2, 3);

-- ❻ 联合索引违反最左前缀 → 失效
INDEX idx_name_age(name, age)
SELECT * FROM users WHERE age = 25;  -- 未使用name，索引失效
-- 修复：调整查询或创建单独age索引

-- ❼ IS NULL / IS NOT NULL → MySQL 8.0之前可能失效
SELECT * FROM users WHERE name IS NULL;
-- 修复：MySQL 8.0已优化，或使用默认值替代NULL

-- ❽ 字符集不一致 → 隐式转换导致失效
-- utf8mb4列与latin1比较时发生转换

-- ❾ 优化器判断全表扫描更快 → 主动放弃索引
-- 当数据量小（<20%总行数）时，优化器可能选择全表扫描

-- ❿ ORDER BY使用了非索引列或混合方向 → 文件排序
SELECT * FROM users ORDER BY create_time DESC, name ASC;
-- 如果idx_create_time_name(create_time, name)，两个都是DESC才走索引
\`\`\`

### 3. EXPLAIN执行计划详解

\`\`\`sql
EXPLAIN SELECT o.id, u.name, o.amount
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.status = 1 AND o.create_time > '2024-01-01'
ORDER BY o.create_time DESC
LIMIT 100;

-- 关键字段解读：
+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+
| id | select_type | table | partitions | type | possible_keys | key      | key_len | ref  | rows | filtered | Extra                 |
+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+
|  1 | SIMPLE      | o     | NULL       | range| idx_status_time| idx_...  | 9       | NULL | 5000 |   100.00 | Using filesort        |
|  1 | SIMPLE      | u     | NULL       | eq_ref| PRIMARY      | PRIMARY  | 4       | o.id |    1 |   100.00 | NULL                  |
+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+

type字段（从优到差）：
├── system/const: 最多1行（系统表/主键/唯一索引）
├── eq_ref: JOIN时使用主键/唯一索引（每行匹配1次）
├── ref: 非唯一索引等值查找
├── range: 索引范围扫描(> < BETWEEN IN)
├── index: 紫引全扫描（比ALL快，因为不需要回表）
└── ALL: 全表扫描（必须优化！）

Extra关键字：
├── Using index: 覆盖索引（无需回表，最优）
├── Using where: 使用WHERE过滤（可能在存储引擎层或Server层）
├── Using index condition: ICP索引下推
├── Using filesort: 额外排序（需优化ORDER BY）
├── Using temporary: 使用临时表（需优化GROUP BY）
└── Using join buffer: JOIN无法使用索引
\`\`\`

### 4. 索引下推(ICP)原理

\`\`\`
传统方式（无ICP）：
Storage Engine → 返回所有符合索引条件的行 → Server层过滤其他条件

ICP优化方式：
Storage Engine → 在索引遍历时就过滤部分条件 → 减少回表次数

示例：
INDEX idx_age_status(age, status)
SELECT * FROM users WHERE age > 20 AND status = 1;

无ICP：
1. 用age > 20从索引找出1000行
2. 回表读取这1000行的完整数据
3. Server层过滤status = 1，得到50行
→ 回表1000次

有ICP：
1. 用age > 20从索引找出1000行
2. 同时在索引层检查status = 1，过滤得到50行
3. 只回表这50行
→ 回表50次，性能提升20倍！
\`\`\`

### 5. SQL优化完整流程

\`\`\`
1. 慢查询发现
   ├── 开启慢查询日志：SET GLOBAL slow_query_log = ON
   ├── 设置阈值：long_query_time = 1（秒）
   ├── 分析慢日志：mysqldumpslow -s t -t 10 slow.log
   └── 工具：pt-query-digest / Percona PMM

2. 执行计划分析
   ├── EXPLAIN查看执行计划
   ├── 关注type（避免ALL）、rows（预估行数）、Extra
   ├── EXPLAIN ANALYZE（MySQL 8.0，实际执行并返回时间）
   └── SHOW PROFILE查看各阶段耗时

3. 优化策略
   ├── 加索引（最有效）
   ├── 重写SQL（避免子查询改JOIN、避免SELECT *）
   ├── 修改Schema（拆分大字段、适当冗余）
   └── 架构层面（读写分离、分库分表、缓存）

4. 验证效果
   ├── 对比优化前后执行时间
   ├── 再次EXPLAIN确认走新索引
   └── 生产灰度验证
\`\`\`

**索引设计最佳实践：**

\`\`\`sql
-- 1. 选择性高的列优先建索引（不同值/总行数 > 80%）
-- 2. 联合索引遵循最左前缀原则
-- 3. 覆盖索引避免回表（SELECT只包含索引列）
-- 4. 前缀索引节省空间（长字符串列）
CREATE INDEX idx_email_prefix ON users(email(20));
-- 5. 避免过多索引（影响写入性能，占磁盘空间）
-- 6. 定期维护：ANALYZE TABLE更新统计信息
-- 7. 使用FORCE INDEX提示强制使用特定索引（谨慎使用）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "MySQL", "索引优化", "B+树", "SQL优化"]
  },

  {
    title: "数据库SQL审计与性能监控体系",
    content: `## 题目描述

构建企业级数据库SQL审计与性能监控系统：

### 核心问题
1. **SQL审计方案对比**：开源审计工具（审计插件、Proxy、binlog解析）各有何优劣？
2. **全链路SQL追踪**：如何实现从应用代码到数据库执行的完整链路追踪？
3. **基线建立与异常检测**：如何建立SQL性能基线？如何检测异常SQL？
4. **自动化治理**：如何实现SQL质量门禁、慢SQL自动告警与优化建议？`,
    solution: `## 深度解析

### 1. SQL审计方案对比

| 方案 | 原理 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| **MariaDB Audit Plugin** | 服务端插件拦截 | 无侵入、详细记录 | 仅限MariaDB/MySQL企业版 | 合规审计 |
| **Percona Audit Log** | 开源审计插件 | 兼容MySQL | 性能开销3-5% | 安全合规 |
| **MySQL Enterprise Audit** | Oracle官方插件 | 功能完善 | 付费 | 企业客户 |
| **Proxy层审计** | (MaxScale/ProxySQL)中间件拦截 | 统一入口、可扩展 | 增加延迟、单点风险 | 多DB统一管理 |
| **binlog解析** | 解析二进制日志 | 异步无侵入、完整 | 有延迟、格式复杂 | 异步审计、CDC |
| **应用层SDK** | JDBC/ORM拦截器 | 业务上下文丰富 | 需改造代码 | APM集成 |
| **网络抓包** | tcpdump/Wireshark | 零侵入 | 无法解密SSL、难解析 | 故障排查 |

**推荐架构（生产级）：**

\`\`\`
┌─────────────────────────────────────────────────┐
│                   应用层                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Java App │  │ Go App  │  │Python App│       │
│  │ p6spy   │  │dbtrace │  │SQLAlchemy│       │
│  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼───────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────────────────────────────────────────┐
│               ProxySQL / MaxScale                │
│  ┌─────────────────────────────────────────┐    │
│  │  Query Router │ Cache │ Query Rewrite   │    │
│  │  └────────────┴───────┴─────────────────┘    │
│  └────────────────┬────────────────────────┘    │
└───────────────────┼─────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Master  │ │ Slave1  │ │ Slave2  │
   │Audit Log│ │Binlog   │ │Slow Log │
   └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │
        ▼           ▼           ▼
   ┌─────────────────────────────────┐
   │      ELK Stack / ClickHouse     │
   │  收集 → 解析 → 存储 → 分析 → 告警  │
   └─────────────────────────────────┘
\`\`\`

### 2. 全链路SQL追踪实现

**基于OpenTelemetry的实现：**

\`\`\`java
// 自定义JDBC拦截器（p6spy或自定义DataSource代理）
public class TracingDataSource extends DataSourceProxy {

    @Override
    public Connection getConnection() throws SQLException {
        Connection conn = super.getConnection();
        return new TracingConnection(conn);
    }
}

class TracingConnection implements Connection {
    private final Connection delegate;
    private final Span parentSpan;

    @Override
    public PreparedStatement prepareStatement(String sql) throws SQLException {
        Span span = tracer.spanBuilder("sql.query")
            .setParent(Context.current().with(parentSpan))
            .setAttribute("db.system", "mysql")
            .setAttribute("db.statement", sanitizeSql(sql))
            .startSpan();

        return new TracingPreparedStatement(
            delegate.prepareStatement(sql), span);
    }

    @Override
    public PreparedStatement prepareStatement(String sql, int autoGeneratedKeys) {
        // 同上，记录autoGeneratedKeys参数
    }
}

class TracingPreparedStatement implements PreparedStatement {
    private final PreparedStatement delegate;
    private final Span span;
    private long startTime;

    @Override
    public ResultSet executeQuery() throws SQLException {
        startTime = System.nanoTime();
        try {
            ResultSet rs = delegate.executeQuery();
            long duration = System.nanoTime() - startTime;
            span.setAttribute("db.rows_affected", rs.getFetchSize());
            span.setAttribute("db.duration_ms", duration / 1_000_000);
            span.setStatus(StatusCode.OK);
            return rs;
        } catch (SQLException e) {
            span.recordException(e);
            span.setStatus(StatusCode.ERROR);
            throw e;
        } finally {
            span.end();
        }
    }
}
\`\`\`

**Trace上下文传递到DB：**

\`\`\`
Application Request
    │
    ├─ TraceID: abc123
    ├─ SpanID: def456
    │
    ▼
SQL Execute
    │
    ├─ 注释注入：/* trace_id=abc123 span_id=def456 */ SELECT ...
    ├─ 或Session变量：SET @trace_id = 'abc123'
    │
    ▼
MySQL Slow Log / General Log
    │
    └─ 可关联到具体请求链路
\`\`\`

### 3. 性能基线与异常检测

**基线指标体系：**

\`\`\`
┌────────────────────────────────────────────────┐
│              SQL性能基线模型                     │
├────────────────────────────────────────────────┤
│                                                │
│  1. 执行时间基线                                │
│     ├── P50 / P95 / P99 / P99.9               │
│     ├── 按时间段区分（高峰/低谷）                │
│     └── 按SQL模板聚合（参数化后）                │
│                                                │
│  2. 资源消耗基线                               │
│     ├── 扫描行数（rows examined）               │
│     ├── 返回行数（rows sent）                   │
│     ├── 临时表创建次数                          │
│     ├── 磁盘排序次数                            │
│     └── 锁等待时间                             │
│                                                │
│  3. 频率基线                                   │
│     ├── QPS / TPS                              │
│     ├── 并发连接数                              │
│     └── 相同SQL执行频率                         │
│                                                │
│  4. 错误基线                                   │
│     ├── 死锁发生率                              │
│     ├── 超时错误率                              │
│     └── 连接池耗尽频率                          │
│                                                │
└────────────────────────────────────────────────┘
\`\`\`

**异常检测算法：**

\`\`\`python
import statistics
from datetime import datetime, timedelta

class SQLAnomalyDetector:
    """基于统计学的SQL异常检测"""

    def __init__(self, window_size=1440, threshold=3.0):
        """
        window_size: 滑动窗口大小（分钟），默认24小时
        threshold: 标准差阈值（3σ原则）
        """
        self.window_size = window_size
        self.threshold = threshold
        self.history = {}  # sql_template -> [duration_list]

    def detect(self, sql_template: str, duration_ms: float,
               rows_examined: int) -> dict:
        """检测SQL是否异常"""
        if sql_template not in self.history:
            self.history[sql_template] = []

        history_data = self.history[sql_template]

        if len(history_data) < 30:
            # 数据不足，暂时不检测
            history_data.append(duration_ms)
            return {"anomaly": False, "reason": "insufficient_data"}

        # 计算统计值
        mean = statistics.mean(history_data)
        stdev = statistics.stdev(history_data)
        p95 = sorted(history_data)[int(len(history_data) * 0.95)]

        # Z-Score检测
        z_score = (duration_ms - mean) / stdev if stdev > 0 else 0

        # 多维异常判断
        anomalies = []
        if abs(z_score) > self.threshold:
            anomalies.append(f"execution_time_zscore={z_score:.2f}")
        if duration_ms > p95 * 3:
            anomalies.append(f"exceeds_p95_3x={duration_ms:.0f}ms>p95={p95:.0f}ms")

        # 更新历史窗口
        history_data.append(duration_ms)
        if len(history_data) > self.window_size:
            history_data.pop(0)

        return {
            "anomaly": len(anomalies) > 0,
            "reason": "; ".join(anomalies),
            "stats": {"mean": mean, "stdev": stdev, "p95": p95}
        }
\`\`\`

### 4. 自动化治理平台

**SQL质量门禁（CI/CD集成）：**

\`\`\`yaml
# .sql-review.yml 配置示例
rules:
  - name: forbid_select_star
    severity: error
    pattern: "SELECT \\* FROM"
    message: "禁止SELECT *，请明确列出所需列"

  - name: require_where_on_delete
    severity: error
    pattern: "^DELETE FROM[^WHERE]"
    message: "DELETE语句必须有WHERE条件"

  - name: limit_result_set
    severity: warning
    config:
      max_rows: 10000
    check: |
      EXPLAIN {{sql}} → rows > max_rows
    message: "预计返回{{rows}}行，超过限制{{max_rows}}"

  - name: index_usage_check
    severity: warning
    check: |
      EXPLAIN {{sql}} → type = ALL
    message: "该SQL将全表扫描，请添加索引"

  - name: no_function_on_index
    severity: error
    pattern: "WHERE\\s+\\w+\\s*\\("
    message: "索引列不能使用函数"

thresholds:
  query_duration_warning: 1000ms
  query_duration_error: 5000ms
  rows_scanned_warning: 10000
  rows_scanned_error: 100000
\`\`\`

**自动化优化建议生成：**

\`\`\`java
public class SQLOptimizer {

    public OptimizationPlan analyze(ExplainResult explain, String sql) {
        List<String> suggestions = new ArrayList<>();

        // 1. 全表扫描检测
        if ("ALL".equals(explain.getType())) {
            suggestions.add("⚠️ 检测到全表扫描，建议：");
            suggestions.add("   ① 为WHERE条件列添加索引");
            suggestions.add("   ② 检查是否有隐式类型转换");
            suggestions.add("   ③ 考虑是否可缩小查询范围");
        }

        // 2. 文件排序检测
        if (explain.getExtra() != null && explain.getExtra().contains("Using filesort")) {
            suggestions.add("⚠️ 检测到文件排序，建议：");
            suggestions.add("   ① 将ORDER BY列加入索引");
            suggestions.add("   ② 确保索引列顺序与ORDER BY一致");
        }

        // 3. 临时表检测
        if (explain.getExtra() != null && explain.getExtra().contains("Using temporary")) {
            suggestions.add("⚠️ 检测到临时表使用，建议：");
            suggestions.add("   ① 优化GROUP BY，确保与索引匹配");
            suggestions.add("   ② 考虑预聚合或物化视图");
        }

        // 4. 回表过多检测
        if (explain.getRows() > 10000 && !isCoveringIndex(explain)) {
            suggestions.add("⚠️ 预估回表" + explain.getRows() + "次，建议：");
            suggestions.add("   ① 使用覆盖索引避免回表");
            suggestions.add("   ② 考虑使用FORCE INDEX指定更优索引");
        }

        // 5. JOIN类型检测
        if (explain.getTable() != null) {
            for (TableExplain te : explain.getTable()) {
                if ("ALL".equals(te.getType())) {
                    suggestions.add("⚠️ 表" + te.getName() + "未使用索引JOIN");
                }
            }
        }

        return new OptimizationPlan(sql, suggestions, estimateImprovement(suggestions));
    }
}
\`\`\`

**告警规则配置（Prometheus + Alertmanager）：**

\`\`\`yaml
groups:
  - name: mysql_slow_query_alerts
    rules:
      - alert: MySQLSlowQueryHighLatency
        expr: histogram_quantile(0.99, mysql_query_duration_seconds_bucket) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MySQL P99查询延迟超过5秒"
          description: "实例{{ $labels.instance }} P99={{ $value }}秒"

      - alert: MySQLFullTableScan
        expr: increase(mysql_full_table_scan_count[10m]) > 100
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "10分钟内全表扫描超过100次"
          description: "可能缺少索引或有异常SQL"

      - alert: MySQLLockWaitTimeout
        expr: increase(mysql_lock_waits_timeout[5m]) > 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "锁等待超时频繁"
          description: "可能存在死锁或长事务"
\`\`\`

**生产落地Checklist：**

- [ ] 审计日志保留180天以上（合规要求）
- [ ] 敏感数据脱敏（手机号、身份证号掩码）
- [ ] 审计数据加密存储（AES-256）
- [ ] 审计日志防篡改（WORM存储或区块链存证）
- [ ] 与SOC/SIEM系统集成
- [ ] 定期审计报告输出（周报/月报）
- [ ] 异常SQL自动阻断（可选，高风险场景）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["数据库", "SQL审计", "性能监控", "APM", "Prometheus"]
  },

  // ==================== 中间件进阶 (第45-49题) ====================

  {
    title: "RocketMQ消息轨迹与全链路追踪",
    content: `## 题目描述

深入RocketMQ消息系统的可观测性建设：

### 核心问题
1. **消息轨迹采集**：RocketMQ原生的MsgTrace功能如何工作？TraceData包含哪些关键信息？
2. **自定义轨迹实现**：如何实现业务级别的消息追踪（订单ID→消息→消费者→回调）？
3. **与分布式追踪整合**：如何将MQ轨迹接入OpenTelemetry/Jaeger/SkyWalking？
4. **消息积压与消费延迟监控**：如何实时感知消费延迟并自动告警？`,
    solution: `## 深度解析

### 1. RocketMQ原生消息轨迹

**开启消息轨迹：**

\`\`\`java
// Producer端开启轨迹
DefaultMQProducer producer = new DefaultMQProducer("producer_group", true,  // enableTrace=true
    new CustomTraceDispatcher());

// Consumer端开启轨迹
DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("consumer_group", true);

// Broker端配置
brokerConfig.setTraceTopicEnable(true);  // 默认轨迹主题：RMQ_SYS_TRACE_TOPIC
brokerConfig.setTraceTopicName("RMQ_SYS_TRACE_TOPIC");
\`\`\`

**轨迹数据结构（TraceBean）：**

\`\`\`
轨迹事件类型：
├── Pub: Producer发送消息
├── SubBefore: Consumer拉取消息前
├── SubAfter: Consumer消费消息后（成功/失败）

轨迹数据字段：
├── topic: 消息主题
├── msgId: 消息ID（客户端生成）
├── offsetMsgId: Broker端消息偏移ID
├── tags: 消息标签
├── keys: 消息业务Key（用于查询）
├── storeTime: Broker存储时间
├── bodyLength: 消息体长度
├── retryTimes: 重试次数
├── clientHost: 客户端IP:Port
├── costTime: 耗时（毫秒）
├── success: 是否成功
├── groupName: 生产者/消费者组名
├── requestId: 请求ID（关联Pub-Sub）
└── contextCode: 上下文码（标识轨迹类型）
\`\`\`

**轨迹存储与查询：**

\`\`\`sql
-- 轨迹数据存储在RMQ_SYS_TRACE_TOPIC，可通过SQL查询
-- 查询某条消息的完整轨迹
SELECT * FROM rmq_sys_trace
WHERE msgId = 'xxx'
ORDER BY storeTime;

-- 查询某Topic的消息延迟分布
SELECT
  topic,
  AVG(costTime) as avg_cost,
  MAX(costTime) as max_cost,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY costTime) as p99
FROM rmq_sys_trace
WHERE topic = 'order_topic'
  AND storeTime > NOW() - INTERVAL 1 HOUR
GROUP BY topic;
\`\`\`

### 2. 自定义业务级消息追踪

\`\`\`java
@Component
public class MessageTracingProducer {

    @Autowired
    private RocketMQTemplate rocketMQTemplate;

    @Autowired
    private Tracer tracer;  // OpenTelemetry Tracer

    public void sendOrderMessage(OrderDTO order) {
        // 创建当前Span
        Span span = tracer.spanBuilder("mq.send.order")
            .setParent(Context.current())
            .setAttribute("order.id", order.getId())
            .setAttribute("order.amount", order.getAmount())
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            // 构建消息头（传递TraceContext）
            Map<String, String> headers = new HashMap<>();
            headers.put("trace-id", span.getSpanContext().getTraceId());
            headers.put("span-id", span.getSpanContext().getSpanId());
            headers.put("business-key", order.getId());
            headers.put("source-system", "order-service");

            Message<OrderDTO> msg = MessageBuilder
                .withPayload(order)
                .copyHeaders(headers)
                .build();

            // 发送消息
            SendResult result = rocketMQTemplate
                .syncSend("order-topic:tag-pay", msg);

            // 记录发送结果
            span.setAttribute("msg-id", result.getMsgId());
            span.setAttribute("send-status", result.getSendStatus().name());
            span.setAttribute("queue-id", result.getMessageQueue().getQueueId());

        } catch (Exception e) {
            span.recordException(e);
            span.setStatus(StatusCode.ERROR, e.getMessage());
            throw e;
        } finally {
            span.end();
        }
    }
}

@Component
public class MessageTracingConsumer {

    @Autowired
    private Tracer tracer;

    @RocketMQMessageListener(topic = "order-topic",
        consumerGroup = "pay-consumer-group")
    public static class PayConsumer implements RocketMQListener<OrderDTO> {

        @Override
        public void onMessage(OrderDTO order) {
            // 从消息头提取TraceContext
            MessageHeaders headers = (MessageHeaders) RocketMQHeaders.get();
            String traceId = headers.get("trace-id", String.class);
            String parentSpanId = headers.get("span-id", String.class);

            // 创建子Span（消费端）
            SpanContext parentContext = SpanContext.createFromRemoteParent(
                traceId, parentSpanId, TraceFlags.getDefault(), TraceState.getDefault()
            );

            Span consumeSpan = tracer.spanBuilder("mq.consume.order.pay")
                .setParent(Context.current().with(Span.wrap(parentContext)))
                .setAttribute("order.id", order.getId())
                .startSpan();

            try (Scope scope = consumeSpan.makeCurrent()) {
                // 业务处理
                processPayment(order);
                consumeSpan.setStatus(StatusCode.OK);
            } catch (Exception e) {
                consumeSpan.recordException(e);
                consumeSpan.setStatus(StatusCode.ERROR);
                // 发送到死信队列或重试
                throw e;
            } finally {
                consumeSpan.end();
            }
        }
    }
}
\`\`\`

**轨迹可视化效果：**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Trace: abc123-def456                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ HTTP POST /api/orders (200ms)                          │
│  │  └─ Service: order-service                              │
│  │                                                          │
│  ├─ MQ Send: order-topic (15ms)                            │
│  │  ├─ MsgId: ABC123                                       │
│  │  ├─ QueueId: 2                                          │
│  │  └─ Status: SEND_OK                                     │
│  │                                                          │
│  ├─ [~150ms network + queue delay]                          │
│  │                                                          │
│  ├─ MQ Consume: pay-consumer-group (80ms)                  │
│  │  ├─ OrderId: ORD-20240101-001                           │
│  │  ├─ RetryCount: 0                                       │
│  │  └─ Status: CONSUME_SUCCESS                             │
│  │                                                          │
│  ├─ DB INSERT: t_payment (12ms)                            │
│  │  └─ Affected Rows: 1                                    │
│  │                                                          │
│  └─ Total: ~450ms (end-to-end)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 3. 与SkyWalking整合

\`\`\`properties
# application.properties
skywalking.agent.service_name=order-service
skywalking.collector.backend_service=11800

# RocketMQ Plugin自动拦截（无需代码改动）
# skywalking-plugin.toml中启用：
# rocketmq-client-5.x-plugin (or 4.x)
\`\`\`

**SkyWalking中的MQ追踪展示：**

\`\`\`
Topology（拓扑图）：
  order-service --[MQ: order-topic]--> pay-service
       |
       +--[MQ: inventory-topic]--> inventory-service
       |
       +--[DB: MySQL]--> mysql-master

Trace详情：
  每个MQ消息自动显示：
  - 消息Topic/Tag/Keys
  - 消息发送耗时
  - 消息消费耗时
  - 消费结果（成功/失败/重试）
  - 消费者组名称
\`\`\`

### 4. 积压监控与告警

\`\`\`java
@Service
public class MessageLagMonitor {

    @Autowired
    private RocketMQTemplate rocketMQTemplate;

    @Scheduled(fixedRate = 5000)  // 每5秒检查一次
    public void checkLag() {
        DefaultMQAdminExt adminExt = new DefaultMQAdminExt();
        adminExt.start();

        try {
            String[] topics = {"order-topic", "payment-topic", "inventory-topic"};

            for (String topic : topics) {
                // 获取消费者组列表
                Set<GroupConsumeInfo> groups =
                    adminExt.queryTopicConsumeByWho(topic).getGroupList();

                for (GroupConsumeInfo group : groups) {
                    // 查询消费进度
                    ConsumeStats stats = adminExt.examineConsumeStats(group.getGroup());

                    for (Map.Entry<MessageQueue, OffsetWrapper> entry :
                        stats.getOffsetTable().entrySet()) {

                        MessageQueue mq = entry.getKey();
                        OffsetWrapper offset = entry.getValue();

                        // 计算积压量
                        long lag = offset.getMaxOffset() - offset.getCurrentOffset();
                        long lagTime = calculateLagTime(mq, lag);

                        // 上报到Prometheus
                        Metrics.counter("rocketmq_consumer_lag_total",
                            "topic", topic,
                            "group", group.getGroup(),
                            "queue", String.valueOf(mq.getQueueId()))
                            .increment(lag);

                        Metrics.gauge("rocketmq_consumer_lag_seconds",
                            "topic", topic,
                            "group", group.getGroup())
                            .set(lagTime);

                        // 判断是否告警
                        if (lag > LAG_THRESHOLD || lagTime > LAG_TIME_THRESHOLD) {
                            alertManager.sendAlert(AlertLevel.CRITICAL,
                                String.format("消息积压告警: Topic=%s Group=%s " +
                                    "积压=%d条 延迟=%ds",
                                    topic, group.getGroup(), lag, lagTime));
                        }
                    }
                }
            }
        } finally {
            adminExt.shutdown();
        }
    }

    /**
     * 根据积压量和当前TPS估算延迟时间
     */
    private long calculateLagTime(MessageQueue mq, long lag) {
        // 获取最近5分钟的平均消费速度
        double recentTps = getRecentTps(mq, 5);
        if (recentTps <= 0) return Long.MAX_VALUE;
        return (long)(lag / recentTps);
    }
}
\`\`\`

**Grafana Dashboard核心面板：**

\`\`\`
Panel 1: 消息生产速率 (msgs/sec)
  - metric: rate(rocketmq_producer_msgs_total[5m])
  - by: topic

Panel 2: 消息消费速率 (msgs/sec)
  - metric: rate(rocketmq_consumer_msgs_total[5m])
  - by: topic, group

Panel 3: 消息积压量 (条)
  - metric: rocketmq_consumer_lag_total
  - threshold: > 10000 yellow, > 50000 red

Panel 4: 消费延迟 (秒)
  - metric: rocketmq_consumer_lag_seconds
  - threshold: > 60s yellow, > 300s red

Panel 5: 消息P99延迟 (ms)
  - metric: histogram_quantile(0.99, rocketmq_msg_latency_seconds)

Panel 6: 重试队列深度
  - metric: rocketmq_retry_queue_size
  - by: group
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "RocketMQ", "消息队列", "分布式追踪", "可观测性"]
  },

  {
    title: "Redis Cluster数据倾斜与故障排查",
    content: `## 题目描述

Redis Cluster在生产环境中常见的数据倾斜问题：

### 核心问题
1. **数据倾斜类型**：槽位分配不均、Big Key、Hot Key、Tag导致的局部热点分别如何识别和解决？
2. **Cluster扩缩容**：如何进行在线Resharding？迁移过程中如何保证服务可用？
3. **脑裂与故障恢复**：Cluster何时会发生脑裂？如何配置避免？
4. **Cluster与Sentinel选型**：什么场景该用Cluster？什么场景用Sentinel？`,
    solution: `## 深度解析

### 1. 数据倾斜四大类型

**类型一：槽位分配不均**

\`\`\`
原因：初始分配时16384个槽位没有均匀分配到各节点

排查命令：
redis-cli -c -p 7000 cluster slots
# 查看每个master节点的槽位范围

redis-cli -c -p 7000 cluster info
# cluster_state:ok/fail
# cluster_slots_ok:16384
# cluster_known_nodes:6

解决：手动重新分配槽位
redis-cli --cluster rebalance 127.0.0.1:7000 \
  --cluster-weight 7000=1 7001=1 7002=1  # 权重相等
\`\`\`

**类型二：Big Key导致内存不均**

\`\`\`
# 发现Big Key（Redis 4.0+）
redis-cli --bigkeys -i 0.1  # 每100个key扫描暂停0.1秒

# 扫描结果示例：
# -------- summary -------
# Sampled 50000 keys in the keyspace.
# Total key length in bytes: 2500000 (avg len 50.00)
# Biggest string found "user:session:1001" has 10 bytes
# Biggest list found "order:pending" has 800 elements
# Biggest hash found "product:catalog" has 1200 fields
# Biggest set found "online:users" has 5000 members
# Biggest zset found "leaderboard" has 3000 members

# 使用MEMORY USAGE查看单个Key内存
MEMORY USER user:session:1001
# (integer) 2048

# 使用SCAN渐进式扫描（不阻塞）
SCAN 0 MATCH user:* COUNT 1000
# 对每个key执行 MEMORY USAGE
\`\`\`

**Big Key解决方案：**

\`\`\`
方案一：拆分（推荐）
# 大Hash拆分为多个小Hash
HGETALL product:catalog  # 1200 fields → 拆分为16个
for i in {0..15}; do
  redis-cli HSCAN product:catalog $i COUNT 100 | xargs -n 2 redis-cli HMSET product:catalog:$i
done

方案二：压缩
# 使用MessagePack/Protobuf压缩Value
# 序列化后再存储

方案三：Lazy Delete（Redis 4.0+）
UNLINK big_key  # 异步删除，不阻塞
# vs DEL big_key  # 同步删除，可能阻塞主线程

方案四：监控与预警
# 设置Key大小告警
if (MEMORY USAGE key) > 10MB:
    alert("Big Key detected: " + key)
\`\`\`

**类型三：Hot Key导致CPU不均**

\`\`\`
# Hot Key特征
# - 单Key QPS远超平均
# - 单节点CPU使用率显著高于其他节点
# - 网络带宽打满

# 发现方法
1. redis-cli --hotkeys  # Redis 4.0+（需要开启maxmemory-policy）
2. MONITOR命令（仅调试用，影响性能）
3. 业务埋点（统计Key访问频率）
4. 使用redis-faina分析MONITOR输出

# 解决方案
方案一：本地缓存（二级缓存）
┌────────┐     ┌────────┐     ┌────────┐
│ Caffeine│ --> │ Redis  │ --> │ DB     │
│ (本地)  │     │ Cluster│     │        │
└────────┘     └────────┘     └────────┘
  TTL: 5s       TTL: 30min

方案二：读写分离
  Hot Key读请求路由到从节点

方案三：分散访问
  # 一个Hot Key拆分为N个伪Key
  original_key = "hot:data"
  for i in range(16):
      key = f"hot:data:{hash(i) % 16}"
      redis.set(key, value)

  # 读时随机取一个
  import random
  key = f"hot:data:{random.randint(0, 15)}"
  data = redis.get(key)

方案四：请求合并
  # 多个并发请求合并为一个Redis请求
  SingleFlight Pattern (Go) / MergeableFuture (Java)
\`\`\`

**类型四：Hash Tag导致局部热点**

\`\`\`
# Hash Tag语法：{tag}key 会按tag计算槽位
# 误用案例：
SET {user}:1001:name "Alice"
SET {user}:1002:name "Bob"
SET {user}:1003:name "Charlie"
# 所有{user}*的key都映射到同一个槽位！

# 正确做法：去掉Hash Tag或使用不同的Tag
SET user:1001:name "Alice"  # 按1001分配槽位
SET user:1002:name "Bob"    # 按1002分配槽位

# Hash Tag的正确用途：相关数据必须在同一节点
# 例如：用户的基本信息和购物车需要在同一节点做原子操作
MULTI
  SET {1001}:profile '{"name":"Alice"}'
  LPUSH {1001}:cart "item_001"
EXEC
\`\`\`

### 2. Cluster在线Resharding

\`\`\`
# 扩容：添加新节点
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000
# 7006作为新master加入

# 分配槽位给新节点
redis-cli --cluster reshard 127.0.0.1:7000 \
  --cluster-from 7000,7001,7002 \  # 从这些节点迁出
  --cluster-to 7006 \             # 迁入到这个节点
  --cluster-slots 4096 \          # 迁移4096个槽位（约1/4）
  --cluster-yes

# 迁移过程详解：
# 1. Source节点状态变为MIGRATING（目标槽位）
# 2. Destination节点状态变为IMPORTING（目标槽位）
# 3. Source逐个key迁移到Destination
#    - Source: GET key → Destination: MIGRATE IMPORTING
#    - ASK重定向：访问正在迁移的key时返回ASK错误
# 4. 客户端收到ASK后向Destination查询
# 5. 迁移完成后更新槽位映射

# 为新节点添加从节点
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7006 \
  --cluster-slave --cluster-master-id <node-7006-id>

# 缩容：移除节点
redis-cli --cluster del-node 127.0.0.1:7006 <node-id>
# 注意：del-node前必须先reshard将该节点的槽位全部迁出
\`\`\`

**迁移期间的客户端行为：**

\`\`\`
正常访问：
  Client → [Slot 1000 on Node A] → OK

迁移中访问：
  Client → [Slot 1000 on Node A]
  → ASK 127.0.0.1:7006 1000  （key还在迁移中）
  Client → [Node B] → ASKING + GET key → OK

迁移完成后：
  Client → [Slot 1000 on Node B] → OK  （自动更新槽位缓存）

注意：Redis Cluster客户端（JedisCluster/Lettuce/Redisson）
会自动处理MOVED和ASK重定向！
\`\`\`

### 3. 脑裂与故障恢复

**脑裂产生条件：**

\`\`\`
集群分区（Network Partition）：

  [数据中心A]                    [数据中心B]
  Node-A (Master)                Node-B (旧Master)
  Node-C (Slave)                 Node-D (Slave)

  网络中断！
  ──────────────────────────────────────

  Node-C 升级为新Master           Node-B 仍然认为自己是Master
  (failover超时后)                (接收写入请求！)

  问题：两边同时写入！
  网络恢复后：
  - Node-B被降级为Slave
  - Node-B期间写入的数据可能丢失！
  - 或与Node-C的数据冲突！
\`\`\`

**预防配置：**

\`\`\`conf
# redis.conf 关键配置

# 节点超时时间（判定节点宕机的阈值）
cluster-node-timeout 15000  # 15秒

# 主从切换需要的最少主节点数
cluster-require-full-coverage yes  # 默认yes
# yes: 槽位没有全覆盖时集群停止服务（宁可不可用也不丢数据）
# no: 允许部分槽位不可用时集群继续服务（高可用优先）

# 最少需要多少个主节点在线才能写入
# (total_masters - tolerated_failures)
# 3主1从 → 最多容忍1个主挂掉

# 防止脑裂的关键：min-replicas-to-write + min-replicas-max-lag
min-replicas-to-write 1      # 至少1个从节点确认写入
min-replicas-max-lag 10      # 从节点延迟不超过10秒
# 这两个配置使得当从节点不可达时，Master拒绝写入
# 从而防止脑裂时的双写问题
\`\`\`

**故障恢复流程：**

\`\`\`
1. PING检测失败
   └── cluster-node-timeout内未收到PONG

2. FAIL标记
   └── 半数以上主节点标记为FAIL（Gossip协议传播）

3. Slave选举
   ├── 检查自身数据新鲜度（replication_offset）
   ├── 数据最新的Slave发起选举
   └── 其他Slave投票（每个主节点的一轮任期只能投一次）

4. 角色切换
   ├── 选中的Slave升级为Master
   ├── 接管Fail主节点的所有槽位
   ├── 广播PONG通知整个集群
   └── 旧的Master恢复后成为新Master的Slave

5. 数据同步
   ├── Partial Resynchronization（如果offset在repl_backlog内）
   └── Full Resynchronization（否则全量同步）
\`\`\`

### 4. Cluster vs Sentinel选型

| 维度 | Redis Sentinel | Redis Cluster |
|------|--------------|---------------|
| **数据规模** | 单机<25GB（内存限制） | 分布式，TB级 |
| **最大容量** | 受限于单机内存 | 受限于节点数×单机内存 |
| **写入能力** | 单线程，~10万QPS | 多主并行，线性扩展 |
| **运维复杂度** | 低（自动主从切换） | 高（槽位管理、扩缩容） |
| **客户端要求** | 普通客户端即可 | 需要Cluster-aware客户端 |
| **多Key操作** | 支持（Lua/MULTI） | 仅同slot支持（Hash Tag） |
| **Pipeline** | 支持 | 支持（但key要在同slot） |
| **适用场景** | 缓存、Session、计数器 | 海量数据缓存、排行榜、社交关系 |
| **成本** | 少量机器 | 至少6台（3主3从） |

**决策树：**
\`\`\`
你的数据能否放入单机内存（<20GB）？
├── 是 → 用 Sentinel（简单可靠）
│   ├── 写入QPS > 8万？→ 考虑分片或升级硬件
│   └── 写入QPS < 8万 → Sentinel完美适配
└── 否 → 必须用 Cluster
    ├── 能接受Pipeline/Multi-Key限制？→ 直接用Cluster
    └── 不能接受？→ 考虑Twemproxy/Codis代理层方案
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Redis", "Redis Cluster", "数据倾斜", "高可用"]
  },

  {
    title: "MyBatis Plus高级特性与性能调优",
    content: `## 题目描述

MyBatis Plus作为国内最流行的MyBatis增强框架：

### 核心问题
1. **CRUD扩展**：BaseMapper内置方法、IService服务层封装、LambdaQueryWrapper类型安全查询
2. **代码生成器**：AutoGenerator/FastAutoGenerator如何定制化生成？
3. **逻辑删除与填充**：@TableLogic、MetaObjectHandler自动填充机制
4. **多租户与数据权限**：TenantLineInnerInterceptor、DataPermissionInterceptor实现原理
5. **性能优化**：批量操作、二级缓存、SQL分析与优化`,
    solution: `## 深度解析

### 1. 核心API体系

\`\`\`java
// ========== BaseMapper CRUD接口 ==========
public interface UserMapper extends BaseMapper<UserDO> {

    // 内置方法（无需手写XML）：
    // Select: selectById, selectBatchIds, selectOne, selectList, selectMaps, selectPage, selectCount
    // Insert: insert, insertOrUpdate (3.5.3+)
    // Update: updateById, update (带wrapper)
    // Delete: deleteById, deleteBatchIds, delete (带wrapper)
}

// ========== IService 服务层接口 ==========
public interface UserService extends IService<UserDO> {

    // 内置方法：
    // get: getById, getOne, getMap, getObj, list, count
    // save: save, saveBatch, saveOrUpdate, saveOrUpdateBatch
    // remove: removeById, removeByIds, remove, removeByMap
    // update: updateById, update, updateBatchById
}

// ========== LambdaQueryWrapper 类型安全查询 ==========
// 传统方式（字符串硬编码，容易出错）：
QueryWrapper<UserDO> wrapper = new QueryWrapper<>();
wrapper.eq("name", "张三").gt("age", 18);  // 字符串拼写易错

// Lambda方式（编译期检查，重构友好）：
LambdaQueryWrapper<UserDO> lambdaWrapper = new LambdaQueryWrapper<>();
lambdaWrapper.eq(UserDO::getName, "张三")
             .gt(UserDO::getAge, 18)
             .like(UserDO::getEmail, "@gmail.com")
             .between(UserDO::getCreateTime, startDate, endDate)
             .orderByDesc(UserDO::getCreateTime)
             .last("LIMIT 10");

List<UserDO> users = userMapper.selectList(lambdaWrapper);

// ========== LambdaUpdateWrapper 类型安全更新 ==========
LambdaUpdateWrapper<UserDO> updateWrapper = new LambdaUpdateWrapper<>();
updateWrapper.eq(UserDO::getStatus, 0)
             .set(UserDO::getStatus, 1)  // set赋值
             .set(UserDO::getUpdateTime, LocalDateTime.now());

int rows = userMapper.update(null, updateWrapper);  // null表示更新所有匹配行
\`\`\`

### 2. 代码生成器

\`\`\`java
FastAutoGenerator.create("jdbc:mysql://localhost:3306/mydb?useUnicode=true",
                         "root", "password")

    // 全局配置
    .globalConfig(builder -> builder
        .author("system")                          // 作者
        .outputDir("src/main/java")                // 输出目录
        .dateType(DateType.TIME_PACK)              // 时间策略(LocalDateTime)
        .commentDate("yyyy-MM-dd HH:mm:ss")        // 注释日期格式
        .enableSwagger()                           // 生成Swagger注解
    )

    // 包配置
    .packageConfig(builder -> builder
        .parent("com.example.demo")                // 父包名
        .moduleName("system")                       // 模块名
        .entity("entity")                           // Entity包名
        .mapper("mapper")                           // Mapper包名
        .service("service")                         // Service包名
        .serviceImpl("service.impl")               // ServiceImpl包名
        .controller("controller")                   // Controller包名
        .pathInfo(Collections.singletonMap(
            OutputFile.xml, "src/main/resources/mapper/"  // XML路径
        ))
    )

    // 策略配置
    .strategyConfig(builder -> builder
        .addInclude("t_user", "t_order", "t_product")  // 表名
        .addTablePrefix("t_")                           // 表前缀过滤

        // Entity策略
        .entityBuilder()
            .superClass(BaseEntity.class)              // 父类
            .enableLombok()                            // 启用Lombok
            .enableChainModel()                        // 链式调用
            .enableTableFieldAnnotation()              // @TableField
            .logicDeleteColumnName("deleted")          // 逻辑删除字段
            .versionColumnName("version")              // 乐观锁字段
            .naming(NamingStrategy.underline_to_camel) // 下划线转驼峰
            .columnNaming(NamingStrategy.underline_to_camel)

        // Controller策略
        .controllerBuilder()
            .enableRestStyle()                         // REST风格
            .enableHyphenStyle()                       // URL中驼峰转连字符

        // Service策略
        .serviceBuilder()
            .formatServiceFileName("%sService")        // 格式化文件名
            .formatServiceImplFileName("%sServiceImpl")

        // Mapper策略
        .mapperBuilder()
            .enableMapperAnnotation()                  // @Mapper注解
            .enableBaseResultMap()                     // BaseResultMap
            .enableBaseColumnList()                    // BaseColumnList
    )
    // 模板引擎配置（可选Velocity/FreeMarker/Beetl）
    .templateEngine(new VelocityTemplateEngine())

    // 执行生成
    .execute();
\`\`\`

### 3. 自动填充与逻辑删除

\`\`\`java
// ========== MetaObjectHandler 自动填充 ==========
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime",
            LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "createBy",
            String.class, getCurrentUserId());
        this.strictInsertFill(metaObject, "version",
            Integer.class, 1);  // 乐观锁初始版本
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime",
            LocalDateTime.class, LocalDateTime.now());
        this.strictUpdateFill(metaObject, "updateBy",
            String.class, getCurrentUserId());
    }
}

// ========== Entity定义 ==========
@Data
@TableName("t_user")
public class UserDO extends BaseEntity {

    @TableId(type = IdType.ASSIGN_ID)  // 雪花算法ID
    private Long id;

    private String name;

    @TableLogic  // 逻辑删除：查询自动加 deleted=0，删除改为UPDATE deleted=1
    @TableField(fill = FieldFill.INSERT)
    private Integer deleted;

    @Version  // 乐观锁：UPDATE时自动加 version = version + 1 AND version = oldVersion
    private Integer version;

    @TableField(fill = FieldFill.INSERT)  // 插入时自动填充
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)  // 插入和更新时自动填充
    private LocalDateTime updateTime;
}

// 生成的SQL示例：
// 插入：INSERT INTO t_user (id, name, deleted, version, create_time, update_time)
//        VALUES (123456789, '张三', 0, 1, '2024-01-01 10:00:00', '2024-01-01 10:00:00')

// 查询：SELECT * FROM t_user WHERE deleted = 0 AND id = ?
// （自动拼接 deleted = 0 条件）

// 逻辑删除：UPDATE t_user SET deleted = 1, update_time = ? WHERE id = ? AND deleted = 0

// 乐观锁更新：UPDATE t_user SET name = ?, version = version + 1, update_time = ?
//             WHERE id = ? AND version = 1  （如果version不匹配则更新失败）
\`\`\`

### 4. 多租户与数据权限

\`\`\`java
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // 1. 多租户拦截器（必须在第一个位置）
        TenantLineInnerInterceptor tenantInterceptor = new TenantLineInnerInterceptor();
        tenantInterceptor.setTenantLineHandler(new TenantLineHandler() {
            @Override
            public Expression getTenantId() {
                // 从上下文获取租户ID
                return new LongValue(TenantContextHolder.getTenantId());
            }

            @Override
            public String getTenantIdColumn() {
                return "tenant_id";  // 租户ID字段名
            }

            @Override
            boolean ignoreTable(String tableName) {
                // 这些表不需要多租户过滤
                return IgnoreTenantTables.contains(tableName);
            }
        });
        interceptor.addInnerInterceptor(tenantInterceptor);

        // 2. 数据权限拦截器
        DataPermissionInterceptor dataPermissionInterceptor =
            new DataPermissionInterceptor();
        dataPermissionInterceptor.setDataPermissionHandler(new DataPermissionHandler() {
            @Override
            public void getSqlSegment(DataPermissionContext context) {
                // 根据角色动态拼接数据权限条件
                String role = SecurityContextHolder.getRole();
                if ("ADMIN".equals(role)) {
                    // 管理员看所有数据，不加条件
                } else if ("MANAGER".equals(role)) {
                    // 经理看本部门及下级部门数据
                    context.sqlSegment("(dept_id IN (SELECT dept_id FROM t_dept " +
                        "WHERE path LIKE '" + getUserDeptPath() + "%'))");
                } else {
                    // 普通员工只看自己的数据
                    context.sqlSegment("create_by = '" + getCurrentUserId() + "'");
                }
            }
        });
        interceptor.addInnerInterceptor(dataPermissionInterceptor);

        // 3. 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));

        // 4. 动态表名插件
        DynamicTableNameInnerInterceptor dynamicTableNameInterceptor =
            new DynamicTableNameInnerInterceptor();
        dynamicTableNameInterceptor.setTableNameHandler((sql, tableName) -> {
            // 按年分表：t_order → t_order_2024
            if ("t_order".equals(tableName)) {
                return "t_order_" + LocalDate.now().getYear();
            }
            return tableName;
        });
        interceptor.addInnerInterceptor(dynamicTableNameInterceptor);

        return interceptor;
    }
}
\`\`\`

**生成的SQL示例（多租户+数据权限+分页）：**

\`\`\`sql
-- 原始查询：userMapper.selectList(queryWrapper)
-- 经过拦截器链处理后实际执行的SQL：

SELECT id, name, email, dept_id, tenant_id, create_time
FROM t_order_2024  ← 动态表名：按年分表
WHERE tenant_id = 1001  ← 多租户：自动附加
  AND (dept_id IN (  ← 数据权限：经理视角
      SELECT dept_id FROM t_dept
      WHERE path_like 'D001%'
    ))
  AND name LIKE '%张%'  ← 业务条件
  AND deleted = 0  ← 逻辑删除
LIMIT 0, 10  ← 分页
\`\`\`

### 5. 性能优化技巧

\`\`\`java
// ========== 1. 批量操作 ==========
// ❌ 循环插入（每次一次网络往返）
for (UserDO user : userList) {
    userMapper.insert(user);  // N次INSERT
}

// ✅ 批量插入（一次网络往返）
userService.saveBatch(userList, 1000);  // 每1000条一批

// ✅ 批量插入自定义SQL（更高性能）
@Insert("<script>" +
    "INSERT INTO t_user (id, name, email) VALUES " +
    "<foreach collection='list' item='item' separator=','>" +
    "(#{item.id}, #{item.name}, #{item.email})" +
    "</foreach>" +
    "</script>")
void batchInsert(@Param("list") List<UserDO> list);

// ========== 2. 二级缓存 ==========
@CacheNamespace(implementation = MybatisRedisCache.class,
    eviction = MybatisRedisCache.class,
    flushInterval = 300000)  // 5分钟刷新
public interface UserMapper extends BaseMapper<UserDO> {
    // 该Mapper下的查询自动走Redis缓存
}

// ========== 3. SQL打印与分析 ==========
@Bean
public MybatisPlusInterceptor performanceInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        PerformanceInnerInterceptor perfInterceptor = new PerformanceInnerInterceptor();
        perfInterceptor.setMaxTime(1000);  // SQL执行超过1秒则警告
        perfInterceptor.setFormat(true);   // 格式化SQL
        interceptor.addInnerInterceptor(perfInterceptor);
        return interceptor;
    }

// ========== 4. 通用枚举处理 ==========
public enum UserStatus {
    NORMAL(0, "正常"),
    DISABLED(1, "禁用"),
    LOCKED(2, "锁定");

    @EnumValue  // 存储到DB的是code值
    private final int code;
}

// 查询时自动处理枚举转换
queryWrapper.eq(UserDO::getStatus, UserStatus.NORMAL);
// SQL: ... WHERE status = 0

// ========== 5. 防全表更新/删除 ==========
@Bean
public SqlInjector blockAttackSqlInjector() {
    return new DefaultSqlInjector() {{
        add(new BlockAttackInnerInterceptor());  // 阻止全表更新/删除
    };
}

// UPDATE t_user SET name = 'test'  → 报错！必须带WHERE条件
// DELETE FROM t_user              → 报错！必须带WHERE条件
\`\`\`

**性能基准测试参考：**

| 操作 | 方式 | 1000条耗时 | 10000条耗时 |
|------|------|-----------|-----------|
| 插入 | 循环insert | ~5s | ~50s |
| 插入 | saveBatch(1000) | ~200ms | ~2s |
| 插入 | 自定义batchInsert SQL | ~80ms | ~500ms |
| 查询 | selectList | ~10ms | ~50ms |
| 查询 | selectPage(分页) | ~15ms | ~80ms |
| 更新 | updateById循环 | ~3s | ~30s |
| 更新 | updateBatchById | ~150ms | ~1.5s |`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["中间件", "MyBatis Plus", "ORM", "多租户", "性能优化"]
  },

  {
    title: "Dubbo服务治理与微服务通信优化",
    content: `## 题目描述

Dubbo作为国内最成熟的RPC框架，其服务治理能力是面试重点：

### 核心问题
1. **负载均衡**：Random/RoundRobin/LeastActive/ConsistentHash/ShortestResponse五种策略的适用场景？
2. **容错机制**：Failover/Failfast/Failsafe/Failback/Forking/Broadcast六种模式的区别？
3. **服务降级与熔断**：如何配置？与Sentinel如何配合？
4. **泛化调用与泛化实现**：跨语言调用、网关透传的场景
5. **路由规则**：条件路由、标签路由、脚本路由的使用`,
    solution: `## 深度解析

### 1. 负载均衡策略

\`\`\`java
// ========== Random（随机，默认） ==========
// 适用：Provider性能相近的普通场景
// 原理：随机权重（加权随机）
@dubboReference(loadbalance = "random", weight = 100)
private UserService userService;

// ========== RoundRobin（轮询） ==========
// 适用：请求处理时间相近的场景
// 原理：按权重的比例轮询
@dubboReference(loadbalance = "roundrobin")
private OrderService orderService;

// ========== LeastActive（最小活跃数，推荐） ==========
// 适用：Provider性能差异大的场景（核心！）
// 原理：选择当前处理请求最少的Provider
// 类似"排队人少的窗口"，能自适应Provider性能差异
@dubboReference(loadbalance = "leastactive")
private PaymentService paymentService;

// ========== ConsistentHash（一致性哈希） ==========
// 适用：有状态服务（缓存、Session保持）
// 原理：根据参数哈希选择固定Provider
// 同一参数总是路由到同一节点（如缓存命中）
@dubboReference(loadbalance = "consistenthash",
    parameters = {"hash.arguments", "0"})  // 用第0个参数做哈希
private CacheService cacheService;

// ========== ShortestResponse（最短响应，Dubbo 2.7.5+） ==========
// 适用：Provider响应时间波动大的场景
// 原理：选择历史响应时间最短的Provider
// 结合了LeastActive和网络延迟因素
@dubboReference(loadbalance = "shortestresponse")
private SearchService searchService;
\`\`\`

**策略选择决策树：**

\`\`\`
Provider性能是否一致？
├── 是 → Random（简单高效）
└── 否 → Provider是否有状态？（如本地缓存）
           ├── 是 → ConsistentHash（保证同一用户到同一节点）
           └── 否 → LeastActive（自适应，推荐首选）
\`\`\`

### 2. 六种容错机制

\`\`\`
┌────────────────────────────────────────────────────────────┐
│                    Dubbo 容错机制全景图                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Failover（失败自动切换，默认）                             │
│  ├── 失败后重试其他节点                                      │
│  ├── retries=2（默认重试2次，共尝试3次）                    │
│  ├── 适用：读操作、幂等操作                                  │
│  └── ⚠️ 不适用于写操作！（可能导致重复写入）                   │
│                                                            │
│  Failfast（快速失败）                                      │
│  ├── 只调用一次，失败立即抛异常                              │
│  ├── 适用：写操作、非幂等操作                                │
│  └── 特点：调用方自行处理异常                               │
│                                                            │
│  Failsafe（安全失败）                                      │
│  ├── 失败时静默忽略，返回空结果                             │
│  ├── 适用：日志记录、辅助功能（不影响主流程）                 │
│  └── 特点：不抛异常                                        │
│                                                            │
│  Failback（失败自动恢复）                                   │
│  ├── 失败后后台定时重试                                     │
│  ├── 适用：消息通知、异步写入                               │
│  └── 配置：retryPeriod=5000（5秒后重试）                    │
│                                                            │
│  Forking（并行调用）                                       │
│  ├── 并行调用多个Provider，只要一个成功即返回                │
│  ├── forks=2（并行调用2个节点）                             │
│  ├── 适用：实时性要求高的读操作                              │
│  └── 代价：资源消耗大（2倍并发）                            │
│                                                            │
│  Broadcast（广播调用）                                     │
│  ├── 逐个调用所有Provider，任一失败则报错                   │
│  ├── 适用：缓存清理、全局通知、批量任务分发                  │
│  └── 特点：所有Provider都会执行                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
\`\`\`

**配置示例：**

\`\`\`yaml
# dubbo.yml / dubbo.properties
dubbo:
  consumer:
    # 全局默认
    timeout: 3000
    retries: 2
    loadbalance: leastactive

  references:
    # 写操作：快速失败，不重试
    order-service:
      cluster: failfast
      timeout: 5000
      retries: 0

    # 读操作：失败切换
    user-service:
      cluster: failover
      retries: 2

    # 通知类：失败自动恢复
    notify-service:
      cluster: failback
      retryPeriod: 5000

    # 实时查询：并行调用
    search-service:
      cluster: forking
      forks: 2

    # 广播：缓存清除
    cache-service:
      cluster: broadcast
\`\`\`

### 3. 服务降级与熔断

**Dubbo原生降级：**

\`\`\`java
// Mock降级（本地伪装）
// 当Provider不可用时，返回Mock数据
@dubboReference(mock = "com.example.UserServiceMock",
    cluster = "failfast")
private UserService userService;

// UserServiceMock.java（必须实现同一接口）
public class UserServiceMock implements UserService {
    @Override
    public UserDO getUser(Long id) {
        // 返回兜底数据（来自缓存/本地文件/默认值）
        return new UserDO(id, "默认用户", "default@example.com");
    }
}

// 或者直接返回null/空值
@dubboReference(mock = "return:null")  // 返回null
private UserService userService;

@dubboReference(mock = "force:return+empty")  // 强制返回空
private UserService userService;
\`\`\`

**与Sentinel整合：**

\`\`\`java
// 引入sentinel-apache-dubbo-adapter依赖

// Provider端：限流
@SentinelResource(value = "getUser", fallback = "getUserFallback",
    blockHandler = "getUserBlockHandler")
@Override
public UserDO getUser(Long id) {
    return userMapper.selectById(id);
}

// Fallback方法（业务异常）
public UserDO getUserFallback(Long id, Throwable t) {
    log.warn("getUser fallback, id={}, error={}", id, t.getMessage());
    return getDefaultUser();  // 返回兜底数据
}

// BlockHandler方法（限流/熔断触发）
public UserDO getUserBlockHandler(Long id, BlockException e) {
    log.warn("getUser blocked, id={}, rule={}", id, e.getClass().getSimpleName());
    throw new BizException("系统繁忙，请稍后重试");  // 抛出友好异常
}

// Consumer端：远程调用保护
@SentinelResource(value = "getUserRemote",
    fallback = "remoteFallback",
    exceptionsToIgnore = {BizException.class})  // 业务异常不触发fallback
public UserDO getUserFromRemote(Long id) {
    return userService.getUser(id);
}
\`\`\`

**Sentinel规则配置（控制台/Nacos持久化）：**

\`\`\`json
[
  {
    "resource": "getUser",
    "grade": 1,
    "count": 100,
    "limitApp": "default",
    "strategy": 0,
    "controlBehavior": 0
  },
  {
    "resource": "getUser",
    "grade": 0,
    "count": 50.0,
    "timeWindow": 30,
    "minRequestAmount": 10,
    "statIntervalMs": 1000,
    "slowRatioThreshold": 0.5
  },
  {
    "resource": "getUserRemote",
    "grade": 1,
    "count": 20,
    "limitApp": "default",
    "strategy": 0,
    "controlBehavior": 2,
    "maxQueueingTimeMs": 500
  }
]
\`\`\`

### 4. 泛化调用与泛化实现

**泛化调用（Generic Reference）：**

\`\`\`java
// 场景：API网关、测试平台、跨语言调用
// 无需依赖Provider的API Jar包

// 方式一：API方式（推荐）
@dubboReference(interfaceName = "com.example.UserService",
    generic = true,  // 泛化调用标志
    check = false)
private GenericService genericUserService;

public Object invokeGetUser(Long userId) {
    // 方法名, 参数类型数组, 参数值数组
    return genericUserService.$invoke("getUser",
        new String[]{"java.lang.Long"},
        new Object[]{userId});
    // 返回对象自动反序列化为Map/Pojo
}

// 方式二：原始泛化（Map方式）
public Object invokeGeneric(String method, String[] paramTypes, Object[] args) {
    return genericUserService.$invoke(method, paramTypes, args);
}
\`\`\`

**泛化实现（Generic Implement）：**

\`\`\`java
// 场景：快速开发Mock服务、网关转发
// 无需实现具体接口

// 定义一个通用泛化实现
@Service
public class GenericServiceImpl implements GenericService {

    @Override
    public Object $invoke(String method, String[] parameterTypes,
                          Object[] args) throws GenericException {

        switch (method) {
            case "getUser":
                Long userId = (Long) args[0];
                // 可以路由到实际的Provider，或者返回Mock数据
                return routeToRealService(method, args);

            case "findAll":
                return findAllUsers();

            default:
                throw new NoSuchMethodException("Method not found: " + method);
        }
    }

    private Object routeToRealService(String method, Object[] args) {
        // 动态路由到真实服务
        GenericService target = referenceMap.get(method.split("\\.")[0]);
        return target.$invoke(method, null, args);
    }
}

// 注册为Dubbo服务
// dubbo.xml:
// <dubbo:service interface="com.example.UserService" ref="genericServiceImpl" />
\`\`\`

### 5. 路由规则

\`\`\`yaml
# 条件路由（基于条件表达式）
dubbo:
  consumer:
    router:
      conditions:
        # tag-based routing（灰度发布）
        "userService":
          "=> tag=v2.0"  # 消费者只调用v2.0版本的Provider

        # 机房就近路由
        "orderService":
          "host = 192.168.1.* => host = 192.168.1.*"  # 同机房优先

        # 读写分离
        "readService":
          "method=find*,get*,list*,query* => host != master"  # 读走从库
          "method=add*,update*,delete*,save* => host = master"  # 写走主库

        # 黑白名单
        "adminService":
          "host != 10.0.0.* =>"  # 外网IP不允许调用

# 标签路由（Tag Routing，灰度发布核心）
dubbo:
  provider:
    parameters:
      tag: v1.0-stable  # Provider标签

# Consumer端设置期望标签
RpcContext.getContext().setAttachment("tag", "v2.0-beta");

# 脚本路由（JavaScript，最灵活）
dubbo:
  consumer:
    router:
      script:
        "userService": |
          function(routeInvokers, invocation, url) {
            var methodName = invocation.getMethodName();
            var result = new java.util.ArrayList(invokers.size());
            for (var i = 0; i < invokers.size(); i++) {
              if (methodName.startsWith('get') &&
                  invokers.get(i).getUrl().getParameter('readonly', 'false') === 'true') {
                result.add(invokers.get(i));
              }
            }
            return result;
          }
\`\`\`

**生产环境治理Checklist：**

- [ ] 超时时间合理设置（避免过长导致线程堆积）
- [ ] 写操作使用Failfast，读操作使用Failover
- [ ] 关键接口配置降级Mock
- [ ] Sentinel流控规则（QPS + 熔断 + 热点）
- [ ] 灰度发布使用Tag Routing
- [ ] 跨机房调用配置条件路由
- [ ] 日志中记录TraceID（RpcContext）
- [ ] 监控Provider健康状态（QPS/RT/成功率）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Dubbo", "RPC", "服务治理", "负载均衡"]
  },

  // ==================== DevOps运维 (第50题) ====================

  {
    title: "ELK日志收集与分析平台搭建",
    content: `## 题目描述

构建企业级ELK（Elasticsearch + Logstash + Kibana）日志平台：

### 核心问题
1. **架构选型**：ELK vs EFK vs PLG（Loki）各自优劣？什么场景选哪个？
2. **日志采集方案**：Filebeat → Logstash → Kafka → ES 的完整链路如何搭建？
3. **索引生命周期管理(ILM)**：Hot/Warm/Cold/Delete阶段如何规划？
4. **日志分析与告警**：Kibana Discover/Dashboard/Alert如何配置？`,
    solution: `## 深度解析

### 1. 架构选型对比

| 维度 | ELK (经典) | EFK (云原生) | PLG/Loki (轻量) |
|------|-----------|-------------|-----------------|
| **日志存储** | Elasticsearch | Elasticsearch | Loki (对象存储) |
| **采集** | Filebeat/Logstash | Fluent Bit/Fluentd | Promtail |
| **查询** | Kibana | Kibana | Grafana |
| **全文搜索** | ✅ 强项 | ✅ 强项 | ❌ 仅Label查询 |
| **资源占用** | 高（ES JVM堆内存） | 高 | 低（Go编写） |
| **成本** | 高（SSD + 大内存） | 高 | 低（S3存储） |
| **学习曲线** | 中等 | 中等 | 低 |
| **适合场景** | 日志分析/全文检索 | Kubernetes日志 | 指标+日志统一 |
| **日增量上限** | TB级 | TB级 | 百GB级 |

**推荐架构（生产级）：**

\`\`\`
┌──────────────────────────────────────────────────────────────┐
│                      应用服务器集群                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ App Node1│ │ App Node2│ │ App Node3│ │ App Node4│       │
│  │ Filebeat │ │ Filebeat │ │ Filebeat │ │ Filebeat │       │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘       │
└────────┼────────────┼────────────┼────────────┼─────────────┘
         │            │            │            │
         ▼            ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Kafka Cluster (缓冲层)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │Broker-0  │  │Broker-1  │  │Broker-2  │  3副本/3分区       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘                    │
└────────┼────────────┼────────────┼───────────────────────────┘
         │            │            │
         ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│              Logstash Cluster (解析层)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │Logstash-1      │  │Logstash-2      │  │Logstash-3      │  │
│  │Input: Kafka    │  │Input: Kafka    │  │Input: Kafka    │  │
│  │Filter: Grok    │  │Filter: Grok    │  │Filter: Grok    │  │
│  │Mutate/Drop/Geo │  │Mutate/Drop/Geo │  │Mutate/Drop/Geo │  │
│  │Output: ES      │  │Output: ES      │  │Output: ES      │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Elasticsearch Cluster (存储层)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ES-Hot-0  │ │ES-Hot-1  │ │ES-Hot-2  │ SSD, 3主3从         │
│  │(Master)  │ │(Data)    │ │(Data)    │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ES-Warm-0 │ │ES-Warm-1 │ │ES-Warm-2 │ HDD, 数据归档       │
│  └──────────┘ └──────────┘ └──────────┘                     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Kibana (可视化层)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │Discover  │ │Dashboard│ │Alerting  │                     │
│  │(搜索)    │ │(仪表盘)  │ │(告警)    │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
\`\`\`

### 2. Filebeat配置

\`\`\`yaml
# filebeat.yml

filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/app/*.log
      - /var/log/app/**/*.log

    # 多行日志合并（Java Stack Trace）
    multiline:
      pattern: '^\\d{4}-\\d{2}-\\d{2}'  # 日期开头的行作为新事件开始
      negate: true
      match: after

    # 字段添加
    fields:
      app: order-service
      env: production
      team: backend
    fields_under_root: true

    # 日志清理（避免重复发送）
    clean_removed: true
    close_inactive: 5m
    close_eof: false

output.kafka:
  hosts: ["kafka-0:9092", "kafka-1:9092", "kafka-2:9092"]
  topic: "app-logs"
  required_acks: 1
  compression: gzip
  max_message_bytes: 10485760  # 10MB

processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~  # K8s环境自动获取Pod信息
\`\`\`

### 3. Logstash管道配置

\`\`\`ruby
# logstash/pipeline/app-log.conf

input {
  kafka {
    bootstrap_servers => "kafka-0:9092,kafka-1:9092,kafka-2:9092"
    topics => ["app-logs"]
    group_id => "logstash-app-consumer"
    consumer_threads => 3
    auto_offset_reset => "latest"
    decorate_events => true  # 保留kafka元数据
    codec => json { charset => "UTF-8" }
  }
}

filter {
  # 解析JSON格式的日志
  if [message] =~ /^\{/ {
    json {
      source => "message"
      target => "parsed_json"
      remove_field => ["message"]
    }
  }

  # 解析Nginx访问日志
  grok {
    match => {
      "message" => '%{IPORHOST:client_ip} %{USER:ident} %{USER:auth} \\[%{HTTPDATE:timestamp}\\] "%{WORD:verb} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:response} %{NUMBER:bytes} "%{DATA:referrer}" "%{DATA:user_agent}"'
    }
  }

  # 解析日期
  date {
    match => ["timestamp", "ISO8601", "yyyy-MM-dd'T'HH:mm:ss.SSSZ"]
    timezone => "Asia/Shanghai"
    target => "@timestamp"
  }

  # 地理位置解析（IP → 城市/经纬度）
  geoip {
    source => "client_ip"
    target => "geoip"
    database => "/usr/share/logstash/GeoLite2-City.mmdb"
    fields => ["city_name", "country_name", "location", "region_name"]
  }

  # 用户Agent解析
  useragent {
    source => "user_agent"
    target => "ua"
  }

  # URL解码
  urldecode {
    field => "request"
  }

  # 字段类型转换
  mutate {
    convert => { "response" => "integer" }
    convert => { "bytes" => "integer" }
    convert => { "response_time" => "float" }
    lowercase => ["verb"]
    remove_field => ["message"]  # 清理原始字段
  }

  # 敏感数据脱敏
  if [parsed_json][phone] {
    mutate {
      gsub => [
        "[parsed_json][phone]", "(\\d{3})\\d{4}(\\d{4})", "\\1****\\2"
      ]
    }
  }

  # 过滤心跳日志
  if [level] == "DEBUG" and [logger] == "health-check" {
    drop { }
  }
}

output {
  elasticsearch {
    hosts => ["http://es-hot-0:9200", "http://es-hot-1:9200"]
    index => "app-%{[app]}-%{+YYYY.MM.dd}"  # 按应用+日期分索引
    template_name => "app-template"
    template_overwrite => true
    ilm_policy => "app-log-policy"  # ILM策略
    manage_template => true
  }

  # 调试输出（开发环境）
  # stdout { codec => rubydebug }
}
\`\`\`

### 4. 索引生命周期管理(ILM)

\`\`\`json
PUT _ilm/policy/app-log-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",           # 1天后滚动新索引
            "max_primary_shard_size": "50gb",  # 或达到50GB滚动
            "max_docs": 10000000       # 或达到1000万文档滚动
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",               # 7天后进入Warm阶段
        "actions": {
          "shrink": {
            "number_of_shards": 1      # 缩减为1个分片
          },
          "forcemerge": {
            "max_num_segments": 1      # 强制合并为1个段
          },
          "allocate": {
            "number_of_replicas": 0,   // Warm阶段减少副本
            "require": { "data_tier": "warm" }
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",              # 30天后进入Cold阶段
        "actions": {
          "allocate": {
            "number_of_replicas": 0,
            "require": { "data_tier": "cold" }
          },
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",              # 90天后自动删除
        "actions": {
          "delete": {}
        }
      }
    }
  }
}

// 存储成本估算（日均100GB日志）：
// Hot阶段(SSD): 7天 × 100GB = 700GB × ¥0.35/GB月 ≈ ¥245/月
// Warm阶段(HDD): 23天 × 100GB(压缩后≈30GB) = 690GB × ¥0.08/GB月 ≈ ¥55/月
// Cold阶段(对象存储): 60天 × 100GB(压缩后≈20GB) = 1200GB × ¥0.02/GB月 ≈ ¥24/月
// 总计：≈ ¥324/月
\`\`\`

### 5. Kibana告警配置

\`\`\`json
// 告警：ERROR日志激增
POST _alerting/alert/error-spike-alert
{
  "name": "ERROR日志突增告警",
  "enabled": true,
  "schedule": {
    "interval": "5m"  // 每5分钟检查
  },
  "throttle": true,
  "throttle_period": "30m",  // 30分钟内不重复告警
  "condition": {
    "compare": {
      "ctx.metadata.hits.total": {
        "gt": 100  // 5分钟内ERROR日志超过100条
      }
    }
  },
  "actions": {
    "notify-webhook": {
      "throttle_period": "30m",
      "webhook": {
        "scheme": "https",
        "host": "hooks.slack.com",
        "port": 443,
        "path": "/services/TXXXXX/BXXXXX/XXXXXXXX",
        "method": "post",
        "params": {},
        "headers": {"Content-Type": "application/json"},
        "body": "{\"text\":\"🚨 ERROR日志突增：过去5分钟{{ctx.metadata.hits.total}}条\"}",
        "template_source": "inline_params"
      }
    },
    "notify-email": {
      "email": {
        "to": ["oncall@example.com"],
        "subject": "🚨 ERROR日志突增告警",
        "body": {
          "html": "<h2>ERROR日志突增</h2><p>{{ctx.metadata.hits.total}}条ERROR日志在过去5分钟内产生</p>"
        }
      }
    }
  }
}
\`\`\`

**生产落地的关键实践：**

- [ ] 日志规范：统一的JSON格式、统一的字段命名、统一的级别定义
- [ ] 采样策略：Debug日志采样率1%（生产环境）
- [ ] 敏感数据：手机号/身份证/卡号必须脱敏后才写入ES
- [ ] 容量规划：预留30%余量，提前规划ILM策略
- [ ] 高可用：ES至少3主3从，Kibana多实例LB
- [ ] 备份：快照到S3/OSS，每日增量+每周全量
- [ ] 安全：RBAC权限控制、TLS加密传输、审计日志`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["DevOps", "ELK", "Elasticsearch", "Logstash", "日志分析"]
  },

  // ==================== 安全 (第51-53题) ====================

  {
    title: "CSRF攻击原理与防御体系",
    content: `## 题目描述

跨站请求伪造(CSRF)是Web安全中最常见的攻击之一：

### 核心问题
1. **攻击原理**：CSRF如何利用用户的已登录身份发起恶意请求？攻击流程是什么？
2. **攻击场景**：GET型CSRF、POST型CSRF、链接型CSRF的具体案例
3. **防御方案**：CSRF Token、SameSite Cookie、双重Cookie验证、Referer校验
4. **前后端分离架构下的CSRF防御**：JWT Token模式下如何防范？`,
    solution: `## 深度解析

### 1. CSRF攻击原理

**攻击前提条件：**
1. 用户已登录目标网站（浏览器持有目标站的Cookie）
2. 用户访问了攻击者的恶意页面
3. 目标站没有有效的CSRF防护

**攻击流程图：**

\`\`\`
正常请求：
┌──────────┐    登录成功     ┌──────────┐
│  用户     │ ──────────────→ │  银行网站  │
│ 浏览器    │ ←── Set-Cookie │  bank.com │
│          │   session=abc   │          │
└──────────┘                └──────────┘

用户在银行网站操作（合法）：
浏览器自动携带 Cookie: session=abc
POST /transfer HTTP/1.1
Cookie: session=abc
amount=1000&to_account=8888

CSRF攻击：
┌──────────┐   1.用户点击恶意链接   ┌──────────┐
│  用户     │ ──────────────────→   │ 攻击网站  │
│ 浏览器    │   evil.com/csrf.html │ evil.com │
└─────┬────┘                       └─────┬────┘
      │ 2.页面隐藏自动提交表单            │
      │                                  │
      │  3.浏览器自动携带bank.com的Cookie │
      ▼                                  ▼
┌──────────────────────────────────────────────┐
│              银行网站 bank.com                │
│                                               │
│  POST /transfer HTTP/1.1                      │
│  Cookie: session=abc  ← 浏览器自动附带！      │
│  Referer: http://evil.com/csrf.html           │
│                                               │
│  amount=10000&to_account=hacker_account       │
│  ↑ 恶意参数！银行以为是用户的合法操作          │
│                                               │
│  结果：资金被盗！用户完全不知情！              │
└──────────────────────────────────────────────┘
\`\`\`

**三种攻击类型：**

\`\`\`
类型一：GET型CSRF（最简单）
<!-- 攻击者网页 -->
<img src="http://bank.com/transfer?to=hacker&amount=10000">
<!-- 用户打开图片即触发转账 -->

类型二：POST型CSRF（常用）
<!-- 攻击者网页 -->
<form action="http://bank.com/transfer" method="POST" id="csrf">
  <input type="hidden" name="to" value="hacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('csrf').submit();</script>
<!-- 页面加载自动提交 -->

类型三：链接型CSRF（社交工程）
<a href="http://bank.com/transfer?to=hacker&amount=10000">
  点击领取红包！
</a>
<!-- 诱导用户点击 -->
\`\`\`

### 2. 防御方案详解

**方案一：CSRF Token（最主流）**

\`\`\`java
// 后端生成Token
@GetMapping("/form")
public ModelAndView showForm(HttpSession session, Model model) {
    // 生成随机Token（不可预测）
    String csrfToken = UUID.randomUUID().toString().replace("-", "");
    session.setAttribute("_csrf_token", csrfToken);
    model.addAttribute("csrfToken", csrfToken);
    return new ModelAndView("transfer-form");
}

// 后端验证Token
@PostMapping("/transfer")
public Result transfer(@RequestParam String to,
                       @RequestParam BigDecimal amount,
                       @RequestParam String _csrf_token,
                       HttpSession session) {
    String sessionToken = (String) session.getAttribute("_csrf_token");
    if (!csrfToken.equals(sessionToken)) {
        throw new CsrfException("CSRF token mismatch!");
    }
    // Token验证通过，执行业务逻辑
    return transferService.transfer(to, amount);
}
\`\`\`

\`\`html
<!-- 前端表单（Thymeleaf示例） -->
<form action="/transfer" method="POST">
  <!-- CSRF Token隐藏域 -->
  <input type="hidden" name="_csrf_token" th:value="\${csrfToken}">

  <label>收款账号：<input name="to"></label>
  <label>金额：<input name="amount"></label>
  <button type="submit">转账</button>
</form>
\`\`\`

**方案二：SameSite Cookie属性（现代浏览器标配）**

\`\`\`java
// 后端设置Cookie时指定SameSite属性
Cookie cookie = new Cookie("session", sessionId);
cookie.setHttpOnly(true);
cookie.setSecure(true);  // HTTPS only
cookie.setPath("/");
cookie.setAttribute("SameSite", "Strict");  // 或 "Lax"

// SameSite三个值：
// Strict: 严格，所有跨站请求都不携带Cookie（最安全，影响用户体验）
//   - 从外部站点点击链接到本站 → 不携带Cookie
//   - 从外部站点提交POST表单到本站 → 不携带Cookie
//
// Lax: 宽松（推荐），允许安全的顶级GET导航携带Cookie
//   - <a href>跳转 → ✅ 携带Cookie（用户主动行为）
//   - GET表单 → ✅ 携带Cookie
//   - POST表单 → ❌ 不携带Cookie
//   - AJAX/API调用 → ❌ 不携带Cookie
//
// None: 不限制，但必须配合Secure属性（HTTPS）
//   - 用于需要跨站携带Cookie的场景（如第三方OAuth回调）
\`\`\`

**方案三：双重Cookie验证**

\`\`\`java
// 登录时同时设置Cookie和Cookie中的CSRF值
@PostMapping("/login")
public Result login(@RequestBody LoginDTO dto, HttpServletResponse response) {
    User user = authService.login(dto);
    String sessionId = generateSession(user);

    // Session Cookie
    Cookie sessionCookie = new Cookie("session", sessionId);
    response.addCookie(sessionCookie);

    // CSRF Cookie（供前端JS读取后放在请求头中）
    String csrfToken = generateCsrfToken();
    Cookie csrfCookie = new Cookie("_csrf", csrfToken);
    csrfCookie.setHttpOnly(false);  // JS可读！
    csrfCookie.setPath("/");
    csrfCookie.setAttribute("SameSite", "Strict");
    response.addCookie(csrfCookie);

    return Result.ok();
}

// 请求时验证：前端从Cookie读取_csrf放到Header中
// 后端比对：Header中的token == Cookie中的token
@GetMapping("/api/data")
public Result getData(@RequestHeader(value = "X-CSRF-Token") String headerToken,
                      @CookieValue(value = "_csrf") String cookieToken) {
    if (!headerToken.equals(cookieToken)) {
        throw new CsrfException("CSRF validation failed");
    }
    // ...
}
\`\`\`

**方案四：Referer/Origin校验**

\`\`\`java
@Component
public class CsrfRefererFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String method = req.getMethod();

        // 只对状态改变的方法进行检查
        if ("POST".equalsIgnoreCase(method) ||
            "PUT".equalsIgnoreCase(method) ||
            "DELETE".equalsIgnoreCase(method)) {

            String origin = req.getHeader("Origin");
            String referer = req.getHeader("Referer");
            String serverName = req.getServerName();

            boolean valid = false;

            if (origin != null && origin.contains(serverName)) {
                valid = true;
            } else if (referer != null && referer.contains(serverName)) {
                valid = true;
            }

            if (!valid) {
                ((HttpServletResponse) response).sendError(403,
                    "Invalid origin/referer for state-changing request");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
\`\`\`

### 3. 前后端分离架构下的防御

\`\`\`javascript
// 前端：axios拦截器自动处理CSRF Token
import axios from 'axios';

// 1. 登录后获取CSRF Token
const login = async (credentials) => {
  const res = await axios.post('/api/auth/login', credentials);
  const csrfToken = res.data.csrfToken;  // 登录接口返回Token

  // 存储到localStorage（或内存）
  localStorage.setItem('csrfToken', csrfToken);

  // 2. 设置axios请求拦截器
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('csrfToken');
    if (token) {
      config.headers['X-CSRF-TOKEN'] = token;  // 每次请求带上
    }
    return config;
  });

  return res;
};

// 3. Token刷新机制
const refreshCsrfToken = async () => {
  const res = await axios.get('/api/auth/csrf-token');
  localStorage.setItem('csrfToken', res.data.csrfToken);
};

// 定期刷新（Token有效期一半的时间）
setInterval(refreshCsrfToken, 30 * 60 * 1000);  // 30分钟刷新
\`\`\`

\`\`\`java
// 后端：Spring Security配置
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF保护（对于API也需要）
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            // 对于纯API（无Cookie），可以使用Bearer Token认证替代
            // 此时CSRF风险较低（因为攻击者无法获取Token）
            // 但如果Token存在Cookie中（非LocalStorage），仍需防护
            ;
        return http.build();
    }
}
\`\`\`

**防御方案对比：**

| 方案 | 安全性 | 用户体验 | 实现复杂度 | 适用场景 |
|------|--------|---------|-----------|---------|
| CSRF Token | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中等 | 传统Web应用 |
| SameSite=Lax | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 简单 | 现代浏览器首选 |
| 双重Cookie | ⭐⭐⭐ | ⭐⭐⭐⭐ | 简单 | SPA应用 |
| Referer校验 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 简单 | 辅助手段 |
| 组合使用 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 较高 | 金融/支付场景 |`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["安全", "CSRF", "Web安全", "Cookie", "SameSite"]
  },

  {
    title: "CSP内容安全策略与XSS纵深防御",
    content: `## 题目描述

构建完整的XSS（跨站脚本攻击）防御体系：

### 核心问题
1. **XSS分类与原理**：存储型、反射型、DOM型的攻击向量有何不同？
2. **CSP策略配置**：Content-Security-Policy头部如何配置才能有效阻止XSS？
3. **输入输出编码**：OWASP推荐的编码规则是什么？
4. **前端安全框架**：DOMPurify、Helmet.js如何使用？`,
    solution: `## 深度解析

### 1. XSS三种类型

**反射型XSS（Reflected XSS）：**

\`\`\`
攻击流程：
1. 攻击者构造URL：https://example.com/search?q=<script>alert('XSS')</script>
2. 诱导用户点击链接
3. 服务器将q参数原样返回到HTML响应中
4. 浏览器执行恶意脚本

示例（漏洞代码）：
// ❌ 不安全的代码
@GetMapping("/search")
public String search(@RequestParam String q, Model model) {
    model.addAttribute("query", q);  // 直接渲染用户输入！
    return "search-result";
}

// Thymeleaf模板（自动转义，相对安全）
<p>搜索结果：[[\${query}]]</p>  <!-- Thymeleaf默认转义 -->

// 但如果是这样（危险！）：
<th:block th:utext="\${query}"></th:block>  <!-- utext不转义！ -->
\`\`\`

**存储型XSS（Stored XSS）：**

\`\`\`
攻击流程：
1. 攻击者在评论区提交：<script>stealCookies()</script>
2. 恶意脚本存入数据库
3. 其他用户查看评论时，脚本从数据库取出并执行
4. 影响所有查看该评论的用户（比反射型危害更大）

示例（漏洞代码）：
@PostMapping("/comment")
public Comment addComment(@RequestBody CommentDTO dto) {
    commentRepository.save(dto);  // 直接存储，未过滤！
    return dto;
}

@GetMapping("/comments")
public List<Comment> getComments() {
    return commentRepository.findAll();  // 直接返回，未转义！
}
\`\`\`

**DOM型XSS（DOM-based XSS）：**

\`\`\`
// 攻击完全在前端完成，不经过服务器
// ❌ 危险代码
const hash = window.location.hash.slice(1);
document.querySelector('#output').innerHTML = hash;  // 直接写入DOM！

// 攻击URL：page.html#<img src=x onerror=alert(1)>
// 或者：page.html#<script>alert(1)</script>

// ✅ 安全做法
const hash = window.location.hash.slice(1);
document.querySelector('#output').textContent = hash;  // textContent不解析HTML
// 或者使用DOMPurify.sanitize(hash)
\`\`\`

### 2. CSP策略配置

\`\`\`nginx
# nginx.conf CSP配置
server {
    listen 443 ssl;
    server_name example.com;

    # 严格的CSP策略（推荐生产环境）
    add_header Content-Security-Policy "
        default-src 'none';                          /* 默认禁止一切 */
        script-src 'self' https://cdn.trusted.com     /* JS来源 */
            'nonce-\${csp_nonce}'                      /* 内联脚本nonce */
            'strict-dynamic';                         /* 允许动态加载 */
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;  /* CSS */
        img-src 'self' data: https: blob:;            /* 图片 */
        font-src 'self' https://fonts.gstatic.com;    /* 字体 */
        connect-src 'self' https://api.example.com;   /* AJAX/WebSocket */
        frame-ancestors 'none';                       /* 禁止被嵌入iframe */
        form-action 'self';                           /* 表单提交目标 */
        base-uri 'self';                              /* base标签限制 */
        frame-src https://payment.example.com;        /* 允许的iframe */
        report-uri /csp-report;                       /* 违规上报地址 */
        report-to csp-endpoint;                       /* Reporting API */
    " always;

    # 其他安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
}
\`\`\`

**CSP指令详解：**

\`\`\`
指令                    作用                          示例值
─────────────────────────────────────────────────────────────
default-src             默认策略（其他指令的fallback）  'none' | 'self' | hostname
script-src              JavaScript来源                'self' 'nonce-abc123' https://cdn
style-src               CSS样式来源                   'self' 'unsafe-inline'
img-src                 图片来源                       'self' data: https:
connect-src             AJAX/Fetch/WebSocket来源      'self' api.example.com
font-src                字体来源                       'self' fonts.gstatic.com
frame-src               iframe允许的来源               payment.example.com
frame-ancestors         谁可以嵌套本页面               'none' | 'sameorigin'
form-action             表单可以提交到哪里             'self'
base-uri                <base>标签可以指向哪里         'self'
object-src              <object>/<embed>/<applet>      'none'
media-src              音视频来源                     'self'
manifest-src           manifest.json来源              'self'
worker-src             Worker脚本来源                 'self'
report-uri             违规报告提交地址               /api/csp-report
upgrade-insecure-requests  自动将HTTP升级为HTTPS
\`\`\`

**Nonce vs Hash：**

\`\`\`java
// 后端：为每个请求生成唯一的Nonce
@Component
public class CsrfNonceFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // 生成随机Nonce（Base64URL编码，每次请求不同）
        String nonce = java.util.Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(java.security.SecureRandom.getSeed(16));

        req.setAttribute("csp_nonce", nonce);

        // 将Nonce放入CSP响应头
        // 实际中可以通过Filter或拦截器统一设置
        resp.setHeader("Content-Security-Policy",
            String.format("script-src 'self' 'nonce-%s'", nonce));

        chain.doFilter(request, response);
    }
}
\`\`\`

\`\`html
<!-- 前端：使用Nonce的内联脚本 -->
<script th:nonce="\${csp_nonce}">
    // 这个内联脚本是允许执行的（因为Nonce匹配）
    const initData = /*[[\${jsonData}]]*/ {};
    renderApp(initData);
</script>

<!-- 下面的内联脚本会被阻止（因为没有Nonce或Nonce不匹配） -->
<script>
    alert('blocked!');  // CSP会阻止执行
</script>
\`\`\`

### 3. 输入输出编码规则

\`\`\`java
/**
 * OWASP推荐的编码工具类
 */
public class EncoderUtil {

    /**
     * HTML实体编码（防止XSS注入到HTML上下文）
     * & → &amp;  < → &lt;  > → &gt;  " → &quot;  ' &#39;
     */
    public static String encodeForHtml(String input) {
        if (input == null) return "";
        return HtmlUtils.htmlEscape(input);  // Spring提供
    }

    /**
     * HTML属性编码
     * 除了HTML编码外，还要处理引号
     */
    public static String encodeForHtmlAttribute(String input) {
        return StringEscapeUtils.escapeHtml4(input)
            .replace("\"", "&quot;")
            .replace("'", "&#x27;");
    }

    /**
     * JavaScript编码（防止XSS注入到JS上下文）
     * \\ → \\\\  ' → \\'  " → \\"
     * \\n → \\\\n  \\r → \\\\r
     * Unicode转义：\\uXXXX
     */
    public static String encodeForJavaScript(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            if (c > 0x7F || "'\"\\".indexOf(c) >= 0) {
                sb.append(String.format("\\u%04x", (int)c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * URL编码
     */
    public static String encodeForURL(String input) {
        try {
            return URLEncoder.encode(input, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            return input;
        }
    }

    /**
     * CSS编码（防止CSS注入）
     */
    public static String encodeForCSS(String input) {
        // CSS上下文的XSS较少见但仍需防范
        return CssEscape.escapeCssString(input);
    }
}
\`\`\`

**上下文相关的编码规则：**

\`\`\`
数据输出的上下文决定了编码方式：

1. HTML Body（HTML正文）
   → HTML Entity Encoding
   例：<div>[[\${user.name}]]</div>

2. HTML Attribute（HTML属性）
   → HTML Attribute Encoding + 引号包裹
   例：<div title="\${encodedName}">

3. JavaScript Data（JS变量）
   → JavaScript Encoding (\\uXXXX)
   例：var name = "\${encodedName}";

4. JavaScript DOM（innerHTML）
   → 先HTML Encode再赋值
   例：el.innerHTML = "\${htmlEncoded}";

5. URL Parameter（URL参数）
   → URL Encoding (Percent Encoding)
   例：<a href="/search?q=\${urlEncoded}">

6. CSS Value（CSS值）
   → CSS Encoding
   例：div.style.color = "\${cssEncoded}";

7. SVG/MathML（富媒体）
   → 极其危险！尽量避免用户输入进入此上下文
\`\`\`

### 4. 前端安全工具链

\`\`\`javascript
// DOMPurify：最流行的HTML消毒库
import DOMPurify from 'dompurify';

// 基础用法
const clean = DOMPurify.sanitize(dirtyInput);
// <img src=x onerror=alert(1)> → <img src="x">

// 配置选项
const clean = DOMPurify.sanitize(untrustedHtml, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror'],  // 明确禁止
  ADD_ATTR: ['data-custom'],  // 额外允许
  WHOLE_DOCUMENT: false,  // 是否允许html/body/head标签
  RETURN_DOM: true,  // 返回DOM节点而非字符串
  RETURN_DOM_FRAGMENT: true,
  RETURN_DOM_IMPORT: true,
  SANITIZE_DOM: true,  // 清洗DOM属性（formaction等）
});

// Helmet.js：Express安全头中间件
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => \`'nonce-\${res.locals.nonce}'\`],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // 某些CDN资源需要关闭
}));

// 自定义安全中间件
function securityMiddleware(req, res, next) {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');

  // MIME嗅探防护
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS保护（旧IE）
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 权限策略
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()');

  next();
}
\`\`\`

**XSS防御Checklist：**

- [ ] 所有用户输入在输出时必须编码（上下文相关编码）
- [ ] 配置严格的CSP策略（推荐default-src 'none'起步）
- [ ] 使用HttpOnly Cookie（防止JS读取Cookie）
- [ ] 使用DOMPurify等库清洗富文本输入
- [ ] 避免eval()、new Function()、innerHTML、document.write()
- [ ] API响应设置Content-Type: application/json（防止HTML注入）
- [ ] 定期使用安全扫描器（OWASP ZAP、Burp Suite）
- [ ] 前端框架（React/Vue）自带转义，不要dangerouslySetInnerHTML/v-html滥用`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "XSS", "CSP", "Web安全", "内容安全策略"]
  },

  {
    title: "DDoS攻击防护与流量清洗架构",
    content: `## 题目描述

构建多层DDoS攻击防御体系：

### 核心问题
1. **DDoS攻击分类**： volumetric（容量型）、protocol（协议型）、application layer（应用层）三类攻击的特点与防御
2. **流量清洗架构**：Cloudflare/AWS Shield/阿里云DDoS防护的原理？自建清洗中心的可行性？
3. **应用层CC攻击防护**：限流、验证码、人机验证、WAF规则的协同
4. **应急响应**：遭受DDoS攻击时的标准处置流程？`,
    solution: `## 深度解析

### 1. DDoS攻击分类与特点

\`\`\`
┌────────────────────────────────────────────────────────────┐
│                    DDoS 攻击分类                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Volumetric Attack（容量型/带宽消耗型）                  │
│  ├── 目标：堵塞网络带宽                                    │
│  ├── 手段：                                              │
│  │   ├── UDP Flood：大量UDP包（53/123/161端口）           │
│  │   ├── ICMP Flood：Ping洪流                             │
│  │   └── Amplification（放大攻击）：                      │
│  │       ├── DNS Amplification（放大44-54倍）            │
│  │       ├── NTP Amplification（放大556倍）               │
│  │       ├── Memcached Amplification（放大51000倍！）     │
│  │       └── SSDP Amplification（放大30倍）              │
│  ├── 特征：流量巨大（可达Tbps级）                          │
│  └── 防御：CDN清洗、Anycast分散、带宽扩容                  │
│                                                            │
│  2. Protocol Attack（协议型/协议滥用型）                    │
│  ├── 目标：消耗服务器/防火墙中间资源                        │
│  ├── 手段：                                              │
│  │   ├── SYN Flood：半连接攻击（TCP握手不完成）           │
│  │   ├── ACK Flood：确认包洪流                            │
│  │   ├── SYN-ACK Flood：伪造源IP的SYN-ACK                │
│  │   ├── Fragmentation：IP分片碎片攻击                    │
│  │   └── Ping of Death：超大ICMP包                        │
│  ├── 特征：利用协议处理逻辑缺陷                            │
│  └── 防御：SYN Cookie、防火墙规则、黑名单                   │
│                                                            │
│  3. Application Layer Attack（应用层攻击）                  │
│  ├── 目标：消耗应用服务器资源（CPU/内存/连接数）            │
│  ├── 手段：                                              │
│  │   ├── HTTP Flood：大量HTTP请求（GET/POST）             │
│  │   ├── CC Attack：针对特定页面的密集请求                │
│  │   ├── Slowloris：慢速连接（长期不释放）                 │
│  │   ├── Low-and-Slow：低速但大量连接                     │
│  │   └── API Abuse：高频调用昂贵API                       │
│  ├── 特征：模拟正常用户行为，难以区分                      │
│  └── 防御：WAF、限流、验证码、行为分析                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
\`\`\`

### 2. 流量清洗架构

**云厂商防护方案对比：**

| 维度 | Cloudflare | AWS Shield | 阿里云DDoS防护 |
|------|-----------|-----------|---------------|
| **免费额度** | 基础DDoS防护 | Shield Standard（免费） | 5Gbps保底 |
| **付费方案** | Pro($20/mo)/Business($200/mo)/Enterprise | Shield Advanced($3000/mo) | DDoS防护(按峰值带宽) |
| **清洗能力** | 71Tbps+ | 未知（很大） | 10Tbps+ |
| **WAF** | ✅ 强大（托管规则集） | ✅ AWS WAF | ✅ Web应用防火墙 |
| **Bot管理** | ✅ Bot Fight Mode | ✅ AWS Bot Control | ✅ 智能Bot防护 |
| **全球节点** | 310+城市 | 33区域 | 2800+边缘节点 |
| **中国合规** | ❌ 需合作伙伴 | ❌ 需合作伙伴 | ✅ 原生支持 |
| **特色** | Page Rules/Workers | Shield Advanced有SLA保障 | 和云产品深度整合 |

**推荐的多层防御架构：**

\`\`\`
                        ┌──────────────────┐
                        │   攻击者/僵尸网络   │
                        └────────┬─────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────┐
│              第一层：DNS/Anycast 分散                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  DNS服务商（Cloudflare DNS / DNSPod）               │  │
│  │  Anycast IP → 流量自动分散到最近的清洗中心            │  │
│  │  基础过滤：已知恶意IP、异常地理区域                  │  │
│  └─────────────────────┬───────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              第二层：CDN/边缘清洗节点                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  CDN Edge（Cloudflare/Aliyun CDN）                   │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ L3/L4清洗：                                    │  │  │
│  │  │ ├── UDP/ICMP异常流量丢弃                       │  │  │
│  │  │ ├── SYN Flood → SYN Cookie                     │  │  │
│  │  │ ├── ACK Flood → 速率限制                       │  │  │
│  │  │ └── 放大攻击源IP黑名单                          │  │  │
│  │  ├───────────────────────────────────────────────┤  │  │
│  │  │ L7清洗（WAF）：                                │  │  │
│  │  │ ├── SQL Injection/XSS/CSRF规则匹配             │  │  │
│  │  │ ├── Bot检测（指纹/Turing Test）               │  │  │
│  │  │ ├── CC攻击限流（IP维度/URL维度）               │  │  │
│  │  │ └── API Abnormal检测                           │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  清洗后的干净流量 → 源站                              │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              第三层：源站自身防护                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  SLB负载均衡                                         │  │
│  │  ├── 四层TCP健康检查                                 │  │
│  │  ├── 七层HTTP健康检查                                │  │
│  │  └── 连接数限制                                      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  WAF（Web应用防火墙）                                │  │
│  │  ├── OWASP Top 10规则集                              │  │
│  │  ├── 自定义规则（正则/语义）                         │  │
│  │  └── AI/ML异常检测（行为基线）                       │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  应用层防护                                         │  │
│  │  ├── Rate Limiter（令牌桶/滑动窗口）                 │  │
│  │  ├── CAPTCHA（图形/滑动/无感验证）                   │  │
│  │  ├── 人机验证（reCAPTCHA v3/hCaptcha）               │  │
│  │  └── 熔断器（自动降级）                              │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
\`\`\`

### 3. 应用层CC攻击防护

**限流策略（多层级）：**

\`\`\`java
// ========== IP维度限流 ==========
@Component
public class IpRateLimitFilter implements Filter {

    private final ConcurrentHashMap<String, RateLimiter> ipLimiters =
        new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String clientIp = getClientIp(req);

        // 每IP每秒最多20个请求
        RateLimiter limiter = ipLimiters.computeIfAbsent(clientIp,
            k -> RateLimiter.create(20.0));  // Guava RateLimiter

        if (!limiter.tryAcquire()) {
            HttpServletResponse resp = (HttpServletResponse) response;
            resp.setStatus(429);
            resp.getWriter().write("{\"error\":\"Too Many Requests\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}

// ========== 接口维度限流（Sentinel）==========
@GetMapping("/api/order/create")
@SentinelResource(value = "createOrder",
    blockHandler = "handleBlock")
public Result createOrder(@RequestBody OrderDTO dto) {
    // 业务逻辑
    return orderService.create(dto);
}

// Sentinel规则：QPS=50，超出返回限流信息
public Result handleBlock(OrderDTO dto, BlockException e) {
    return Result.error(429, "下单太频繁，请稍后再试");
}

// ========== 用户维度限流（Redis + Lua）==========
public class UserRateLimiter {

    private final StringRedisTemplate redisTemplate;

    public boolean allowRequest(Long userId, String api, int limit, int windowSeconds) {
        String key = String.format("rate:%s:%s:%d", api, userId,
            System.currentTimeMillis() / (windowSeconds * 1000));

        // Lua脚本保证原子性
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(RATE_LIMIT_LUA, Long.class);
        Long count = redisTemplate.execute(script,
            Collections.singletonList(key),
            String.valueOf(limit), String.valueOf(windowSeconds));

        return count <= limit;
    }

    private static final String RATE_LIMIT_LUA = ""
        + "local current = redis.call('incr', KEYS[1]) "
        + "if current == 1 then "
        + "  redis.call('expire', KEYS[1], ARGV[2]) "
        + "end "
        + "return current";
}
\`\`\`

**人机验证集成：**

\`\`\`javascript
// reCAPTCHA v3（无感验证，返回分数0.0-1.0）
async function verifyHuman(request) {
  const token = grecaptcha.execute(siteKey, {action: 'submit'});
  const result = await fetch('/api/verify-captcha', {
    method: 'POST',
    body: JSON.stringify({token})
  });

  const {score} = await result.json();
  // score >= 0.5 → 很可能是真人
  // score < 0.3 → 很可能是机器人
  // 0.3-0.5 → 灰色地带，触发额外验证

  if (score < 0.3) {
    // 要求完成图片验证码（reCAPTCHA v2）
    await showImageCaptcha();
  }

  return score >= 0.3;
}

// 滑动验证码（国内常用）
// 阿里云滑块验证 / 腾讯防水墙 / 极验GEETEST
\`\`\`

### 4. 应急响应流程

\`\`\`
DDoS攻击应急响应SOP（Standard Operating Procedure）：

Phase 1: 发现与评估（0-15分钟）
├── 监控告警触发（带宽/CPU/QPS/延迟异常）
├── 初步判断攻击类型（看流量特征）
│   ├── 带宽打满 → Volumetric
│   ├── 连接数暴增 → Protocol
│   └── 正常请求但QPS极高 → Application Layer
├── 评估影响范围（哪些服务受影响）
└── 通报相关人员（值班工程师/技术负责人/安全团队）

Phase 2: 快速缓解（15-30分钟）
├── 开启云厂商DDoS防护（如未开启）
├── 启用高防IP/加速线路
├── 调整DNS指向清洗中心
├── 启用 stricter WAF规则
├── 临时封禁攻击源IP段（如有明显特征）
├── 开启Challenge/JS Challenge（Cloudflare）
└── 非核心服务降级/熔断

Phase 3: 深度处置（30分钟-2小时）
├── 分析攻击日志（源IP/攻击向量/目标URL）
├── 调整清洗规则（白名单误伤检查）
├── 优化限流策略（精准限流，减少误杀）
├── 联系ISP/上游提供商（如攻击源头明确）
├── 准备法律取证（攻击证据保存）
└── 向监管机构报告（如涉及金融行业）

Phase 4: 恢复与复盘（攻击结束后）
├── 逐步解除紧急措施（观察流量稳定性）
├── 全面检查系统状态（数据完整性/服务健康）
├── 编写事故报告（时间线/影响/处置/改进）
├── 更新防护策略（加固薄弱环节）
├── 进行红蓝对抗演练
└── 优化监控告警阈值
\`\`\`

**日常防护Checklist：**

- [ ] 云厂商DDoS基础防护（免费开启）
- [ ] 重要域名接入高防/CDN
- [ ] WAF规则定期更新（OWASP CRS最新版）
- [ ] 限流策略覆盖所有对外接口
- [ ] 验证码机制就绪（可一键启用）
- [ ] 备份线路/备用域名（紧急切换用）
- [ ] DDoS应急预案文档化并定期演练
- [ ] 与云厂商/ISP建立紧急联系通道`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "DDoS", "网络安全", "WAF", "CC攻击"]
  },

  // ==================== 算法数据结构 (第54-68题) ====================

  {
    title: "实现LRU缓存淘汰算法",
    content: `## 题目描述

设计和实现一个LRU（Least Recently Used）缓存结构：

### 要求
1. \`get(key)\`: 如果key存在于缓存中，获取key的value（O(1)时间复杂度）
2. \`put(key, value)\`: 如果key不存在，写入数据；当缓存容量达到上限时，淘汰最久未使用的值
3. \`get\` 和 \`put\` 操作都必须在 **O(1)** 平均时间复杂度内完成
4. 支持泛型Key和Value
5. 实现线程安全版本

### 进阶要求
- 实现 \`LFU\`（Least Frequently Used）缓存
- 对比LRU和LFU的适用场景`,
    codeTemplate: {
      javascript: `/**
 * LRU缓存 - 哈希表 + 双向链表实现
 * get/put 时间复杂度均为O(1)
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();  // key -> ListNode
    this.head = new ListNode(null, null);  // dummy head
    this.tail = new ListNode(null, null);  // dummy tail
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const node = this.cache.get(key);
    this.moveToHead(node);  // 访问后移到头部（最近使用）
    return node.value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this.moveToHead(node);  // 更新后移到头部
    } else {
      if (this.cache.size >= this.capacity) {
        this.removeTail();  // 淘汰尾部（最久未使用）
      }
      const newNode = new ListNode(key, value);
      this.cache.set(key, newNode);
      this.addToHead(newNode);  // 新节点加入头部
    }
  }

  // TODO: 完成以下方法的实现
  moveToHead(node) {}
  addToHead(node) {}
  removeTail() {}
  removeNode(node) {}
}

class ListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}`,
      python: `"""
LRU缓存 - OrderedDict实现（Python 3.7+ dict有序）
"""
from collections import OrderedDict
from typing import TypeVar, Generic, Optional

K = TypeVar('K')
V = TypeVar('V')

class LRUCache(Generic[K, V]):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict[K, V] = OrderedDict()

    def get(self, key: K) -> Optional[V]:
        # TODO: 实现get方法，O(1)时间复杂度
        pass

    def put(self, key: K, value: V) -> None:
        # TODO: 实现put方法，O(1)时间复杂度
        pass


# 进阶：LFU缓存实现
class LFUCache(Generic[K, V]):
    def __init__(self, capacity: int):
        self.capacity = capacity
        # TODO: 实现LFU缓存
        # 提示：需要维护频率计数 + 同频率内的LRU顺序
        pass`,
      java: `import java.util.*;

/**
 * LRU缓存 - LinkedHashMap实现
 * @param <K> Key类型
 * @param <V> Value类型
 */
public class LRUCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> cache;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        // accessOrder=true: 按访问顺序排序（LRU核心）
        this.cache = new LinkedHashMap<K, V>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;  // 超过容量自动淘汰最老的
            }
        };
    }

    public V get(K key) {
        // TODO: 实现get方法
        return null;
    }

    public void put(K key, V value) {
        // TODO: 实现put方法
    }

    public int size() {
        return cache.size();
    }
}


// 进阶：LFU缓存（LeetCode 460 Hard）
public class LFUCache<K, V> {
    // TODO: 实现LFU缓存
    // 提示：
    // 1. HashMap<K, V> 存键值对
    // 2. HashMap<K, Integer> 存每个key的频率
    // 3. HashMap<Integer, LinkedHashSet<K>> 存相同频率的key集合（按访问顺序）
    // 4. int minFreq 记录最小频率（用于淘汰）
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "数据结构", "LRU缓存", "哈希表", "双向链表"]
  },

  // ==================== 算法数据结构续 (第55-68题) ====================

  {
    title: "实现一致性哈希算法（Consistent Hashing）",
    content: `## 题目描述

一致性哈希是分布式系统中常用的数据分片和负载均衡算法：

### 要求
1. 实现基础的一致性哈希环结构，支持节点添加/删除
2. 支持虚拟节点（Virtual Nodes）以解决数据倾斜问题
3. 实现 \`lookup(key)\` 方法找到对应的节点
4. 分析当节点增删时，数据迁移量
5. 对比普通取模哈希 vs 一致性哈希的优劣`,
    codeTemplate: {
      javascript: `/**
 * 一致性哈希 - 带虚拟节点的实现
 */
const crypto = require('crypto');

class ConsistentHash {
  constructor(virtualNodes = 150) {
    this.virtualNodes = virtualNodes;  // 每个真实节点的虚拟节点数
    this.ring = new Map();  // hash -> nodeName (有序，TreeMap)
    this.sortedKeys = [];   // 排序后的hash列表
    this.nodes = new Set(); // 真实节点集合
  }

  // 添加节点
  addNode(nodeName) {
    // TODO: 为每个节点创建virtualNodes个虚拟节点
    // 提示：使用 SHA1/MurmurHash 生成 hash
  }

  // 移除节点
  removeNode(nodeName) {
    // TODO: 删除该节点所有虚拟节点
  }

  // 查找key对应的节点
  lookup(key) {
    // TODO: 二分查找顺时针第一个节点
    // 如果找不到（超过最大值），返回第一个节点（环形）
  }

  // 哈希函数
  _hash(value) {
    return crypto.createHash('md5').update(String(value)).digest('hex');
  }
}

module.exports = { ConsistentHash };`,
      python: `"""
一致性哈希 - 带虚拟节点
"""
import hashlib
import bisect
from typing import Optional, List

class ConsistentHash:
    def __init__(self, virtual_nodes: int = 150):
        self.virtual_nodes = virtual_nodes
        self.ring: dict[int, str] = {}      # hash -> node_name
        self.sorted_keys: list[int] = []     # 排序后的hash
        self.nodes: set = set()              # 真实节点

    def add_node(self, node_name: str) -> None:
        # TODO: 创建虚拟节点并插入环
        pass

    def remove_node(self, node_name: str) -> None:
        # TODO: 删除该节点所有虚拟节点
        pass

    def lookup(self, key: str) -> Optional[str]:
        # TODO: bisect二分查找
        pass

    @staticmethod
    def _hash(value: str) -> int:
        return int(hashlib.md5(value.encode()).hexdigest(), 16)`,
      java: `import java.security.MessageDigest;
import java.util.*;
import java.nio.charset.StandardCharsets;

/**
 * 一致性哈希 - TreeMap实现有序环
 */
public class ConsistentHash<T> {

    private final int virtualNodes;
    private final TreeMap<Long, String> ring = new TreeMap<>();  // 有序Map
    private final Set<String> nodes = new HashSet<>();

    public ConsistentHash(int virtualNodes) {
        this.virtualNodes = virtualNodes;
    }

    public void addNode(String nodeName) {
        // TODO: 添加节点及其虚拟节点
    }

    public void removeNode(String nodeName) {
        // TODO: 移除节点及其虚拟节点
    }

    public String lookup(T key) {
        // TODO: 使用ceilingEntry查找
        // 如果为null则返回firstEntry（环形特性）
        return null;
    }

    private long hash(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            long result = 0;
            for (int i = 0; i < 4; i++) {
                result <<= 8;
                result |= ((long) digest[i]) & 0xFF;
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "一致性哈希", "分布式", "负载均衡", "虚拟节点"]
  },

  {
    title: "实现跳表（Skip List）数据结构",
    content: `## 题目描述

跳表是一种基于概率的数据结构，可实现O(log N)的查找、插入、删除：

### 要求
1. 实现跳表的插入、查找、删除操作
2. 支持动态层数（通过随机 coin flip 决定新节点层数）
3. 分析时间复杂度和空间复杂度
4. 对比跳表 vs 平衡二叉搜索树(BST/红黑树) vs B+树`,
    codeTemplate: {
      javascript: `/**
 * 跳表（Skip List）实现
 * 时间复杂度：查找/插入/删除均为 O(log N) 平均
 */
class SkipListNode {
  constructor(value = null, level = 0) {
    this.value = value;
    this.forward = new Array(level + 1).fill(null);  // 前驱指针数组
  }
}

class SkipList {
  constructor(maxLevel = 16, p = 0.5) {
    this.maxLevel = maxLevel;       // 最大层数
    this.p = p;                      // 提升概率
    this.level = 1;                 // 当前实际层数
    this.head = new SkipListNode(-Infinity, maxLevel);  // 头节点
    this NIL = new SkipListNode(Infinity, maxLevel);     // 尾哨兵
    // 初始化：head的所有forward指向NIL
    for (let i = 0; i <= maxLevel; i++) {
      this.head.forward[i] = this.NIL;
    }
  }

  // 随机生成层数
  randomLevel() {
    let level = 0;
    while (Math.random() < this.p && level < this.maxLevel) level++;
    return level;
  }

  search(target) {
    // TODO: 从最高层开始查找
  }

  insert(num) {
    // TODO: 更新数组记录每层的插入位置
    // TODO: 根据randomLevel决定新节点层数
    // TODO: 调整指针完成插入
  }

  delete(num) {
    // TODO: 查找并调整指针完成删除
    // TODO: 可能需要降低当前层数
  }
}`,
      python: `"""
跳表（Skip List）实现
"""
import random
from typing import Optional, List

class SkipListNode:
    def __init__(self, value: float = None, level: int = 0):
        self.value = value
        self.forward: List[Optional['SkipListNode']] = [None] * (level + 1)

class SkipList:
    def __init__(self, max_level: int = 16, p: float = 0.5):
        self.max_level = max_level
        self.p = p
        self.level = 1
        self.head = SkipListNode(float('-inf'), max_level)
        self.NIL = SkipListNode(float('inf'), max_level)
        for i in range(max_level + 1):
            self.head.forward[i] = self.NIL

    def random_level(self) -> int:
        # TODO: 抛硬币决定层数
        pass

    def search(self, target: float) -> bool:
        # TODO: 多层查找
        pass

    def insert(self, num: float) -> None:
        # TODO: 插入操作
        pass

    def delete(self, num: float) -> bool:
        # TODO: 删除操作
        pass`,
      java: `import java.util.Random;

/**
 * 跳表（Skip List）实现
 * @param <T> 必须实现Comparable接口
 */
public class SkipList<T extends Comparable<T>> {

    static class Node<T> {
        T value;
        Node<T>[] forward;

        @SuppressWarnings("unchecked")
        Node(T value, int level) {
            this.value = value;
            this.forward = new Node[level + 1];
        }
    }

    private final int maxLevel;
    private final double p;
    private int level;
    private final Node<T> head;
    private final Random rnd = new Random();

    public SkipList(int maxLevel, double p) {
        this.maxLevel = maxLevel;
        this.p = p;
        this.level = 1;
        this.head = new Node<>(null, maxLevel);
    }

    public boolean search(T target) {
        // TODO: 实现查找
        return false;
    }

    public void insert(T num) {
        // TODO: 实现插入
    }

    public boolean delete(T num) {
        // TODO: 实现删除
        return false;
    }

    private int randomLevel() {
        int lvl = 0;
        while (rnd.nextDouble() < p && lvl < maxLevel) lvl++;
        return lvl;
    }
}`
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["算法", "数据结构", "跳表", "概率数据结构", "O(logN)"]
  },

  {
    title: "布隆过滤器原理与实现",
    content: `## 题目描述

布隆过滤器（Bloom Filter）是一种空间效率极高的概率型数据结构：

### 核心问题
1. **原理**：如何用位数组 + K个哈希函数判断元素是否存在？
2. **误判率**：为什么一定存在假阳性（False Positive）？如何计算误判率？
3. **参数选择**：给定预期元素数n和期望误判率p，如何计算最优的位数组长度m和哈希函数个数k？
4. **应用场景**：Redis缓存穿透防护、URL去重、推荐系统去重、垃圾邮件过滤
5. **变体**：Counting Bloom Filter（支持删除）、Scalable Bloom Filter（动态扩容）、Cuckoo Filter（支持删除且无假阳性删除）`,
    solution: `## 深度解析

### 1. 原理与实现

\`\`\`java
import java.util.BitSet;
import java.util.HashFunction;

/**
 * 布隆过滤器实现
 */
public class BloomFilter {

    private final BitSet bitSet;          // 位数组
    private final int m;                  // 位数组长度
    private final int k;                  // 哈希函数个数
    private final HashFunction[] hashes;  // k个独立哈希函数

    /**
     * 构造布隆过滤器
     * @param n 预期元素数量
     * @param fpp 期望误判率（False Positive Probability）
     */
    public BloomFilter(int n, double fpp) {
        // 最优公式：
        // m = -n * ln(p) / (ln2)^2
        // k = (m/n) * ln2
        this.m = (int) (-n * Math.log(fpp) / (Math.log(2) * Math.log(2)));
        this.k = (int) (m / n * Math.log(2));

        this.bitSet = new BitSet(m);
        this.hashes = createHashFunctions(k);
    }

    public void add(String element) {
        for (HashFunction hash : hashes) {
            int position = Math.abs(hash.hash(element) % m);
            bitSet.set(position);  // 将对应位设为1
        }
    }

    public boolean mightContain(String element) {
        for (HashFunction hash : hashes) {
            int position = Math.abs(hash.hash(element) % m);
            if (!bitSet.get(position)) {
                return false;  // 只要有一位是0，肯定不存在
            }
        }
        return true;  // 所有位都是1，可能存在（可能误判！）
    }
}
\`\`\`

**工作流程图：**

\`\`\`
add("hello"):
┌─────────────────────────────────────────────┐
│  Hash1("hello") % m = 3   → bit[3] = 1      │
│  Hash2("hello") % m = 7   → bit[7] = 1      │
│  Hash3("hello") % m = 12  → bit[12] = 1     │
│  ... (k次)                                   │
└─────────────────────────────────────────────┘

mightContain("hello"):
┌─────────────────────────────────────────────┐
│  Hash1("hello") % m = 3   → bit[3]=1 ✅     │
│  Hash2("hello") % m = 7   → bit[7]=1 ✅     │
│  Hash3("hello") % m = 12  → bit[12]=1 ✅    │
│  全部命中 → 返回 true（确实存在或误判）        │
└─────────────────────────────────────────────┘

mightContain("world"):
┌─────────────────────────────────────────────┐
│  Hash1("world") % m = 5   → bit[5]=0 ❌     │
│  第一个就不匹配 → 返回 false（100%不存在！）   │
└─────────────────────────────────────────────┘
\`\`\`

### 2. 误判率分析

**数学推导：**

\`\`\`
设：
- m = 位数组长度
- k = 哈希函数个数
- n = 已插入元素数

某个特定bit在插入一个元素后仍为0的概率：
  p0 = 1 - 1/m

插入n个元素后仍为0的概率：
  P(某bit=0) = (1 - 1/m)^(k*n) ≈ e^(-kn/m)

查询时误判（所有k个位置都恰好被其他元素设为1）：
  FPP = [1 - P(某bit=0)]^k = [1 - e^(-kn/m)]^k

最优参数（对FPP求导=0）：
  k_optimal = (m/n) * ln2 ≈ 0.693 * (m/n)

给定n和期望FPP(p)：
  m_optimal = -n * ln(p) / (ln2)^2 ≈ -n * ln(p) / 0.48
  k_optimal = (m/n) * ln2 ≈ 0.693 * (m/n)
\`\`\`

**常用参数对照表：**

| 元素数n | 期望FPP | 位数组m | 哈希函数k | 内存占用 |
|--------|---------|---------|-----------|---------|
| 100万 | 1% | 958万bits | 7 | ~1.14MB |
| 100万 | 0.1% | 1438万bits | 10 | ~1.72MB |
| 1亿 | 1% | 9.58亿bits | 7 | ~114MB |
| 1亿 | 0.01% | 19.17亿bits | 10 | ~228MB |

### 3. Redis布隆过滤器实战

\`\`\`bash
# Redis 4.0+ 布隆过滤器模块（RedisBloom）
# 安装：redis-server --loadmodule /path/to/redisbloom

# 基本操作
BF.ADD user:filter user_001          # 添加元素
BF.EXISTS user:filter user_001       # 检查是否存在
BF.MADD user:filter u1 u2 u3         # 批量添加
BF.MEXISTS user:filter u1 u2 u3      # 批量检查

# 创建时指定参数（更精确控制）
BF.RESERVE user:filter 0.01 1000000
#           误判率=1%  预期容量=100万

# 缓存穿透防护场景：
def get_user(user_id):
    # 1. 先查布隆过滤器
    if not redis.bf_exists("user:filter", user_id):
        return None  # 一定不存在，直接返回（拦截穿透！）

    # 2. 再查缓存
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # 3. 最后查数据库
    db_user = db.query(user_id)
    if db_user:
        redis.setex(f"user:{user_id}", 3600, json.dumps(db_user))
        return db_user

    # 4. 数据库也没有（可能是布隆过滤器误判）
    return None
\`\`\`

### 4. 变体对比

| 类型 | 支持删除 | 动态扩容 | 无假阳性删除 | 空间效率 |
|------|---------|---------|------------|---------|
| Standard BF | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| Counting BF | ✅（计数器） | ❌ | ❌ | ⭐⭐⭐ |
| Scalable BF | ❌ | ✅（渐进式） | ❌ | ⭐⭐⭐⭐ |
| Cuckoo Filter | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| Quotient Filter | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |

**Cuckoo Filter核心思路：**
- 使用Cuckoo Hashing（布谷鸟哈希）
- 每个元素有两个候选位置（两个hash函数）
- 存储指纹（fingerprint）而非完整值
- 支持真正的删除操作（无假阳性删除）

**生产使用建议：**

- [ ] 预估好数据规模，避免过度扩容导致性能下降
- [ ] 误判率根据业务容忍度选择（缓存穿透1%够用，金融建议<0.01%）
- [ ] 不支持遍历（无法列出所有元素）
- [ ] 不能100%确定存在（需要二次验证）
- [ ] RedisBloom是生产首选（Guava的BloomFilter用于单机内存场景）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["算法", "布隆过滤器", "概率数据结构", "Redis", "缓存"]
  },

  {
    title: "红黑树（Red-Black Tree）原理与实现",
    content: `## 题目描述

红黑树是一种自平衡二叉搜索树，Java TreeMap/TreeSet、Linux进程调度、nginx timer等都使用了它：

### 核心问题
1. **五大性质**：红黑树的五个约束条件是什么？为什么这五条能保证平衡？
2. **旋转操作**：左旋和右旋的具体过程？时间复杂度？
3. **插入修复**：插入新节点后可能违反哪些性质？三种情况（uncle颜色）分别如何处理？
4. **删除修复**：为什么删除比插入更复杂？四种情况的处理逻辑
5. **对比AVL树**：红黑树 vs AVL树（严格平衡）的读写性能差异？什么场景选哪个？`,
    solution: `## 深度解析

### 1. 五大性质

\`\`\`
性质1：每个节点要么红色，要么黑色
性质2：根节点必须是黑色
性质3：叶子节点（NIL/空节点）都是黑色
性质4：红色节点的两个子节点都必须是黑色（不能有连续的红节点）
性质5：从任意节点到其所有后代叶子的简单路径上，黑色节点数量相同（黑高相同）

→ 这五条保证了：最长路径不超过最短路径的2倍！
   （因为红节点不能连续，所以最坏情况是交替红黑：黑-红-黑-红...
    最好情况是全黑：黑-黑-黑-黑... → 比例正好2:1）
\`\`\`

### 2. 旋转操作

**左旋（Left Rotate）：**

\`\`\`
    x              y
   / \\            / \\
  α   y    →     x   γ
     / \\        / \\
    β   γ      α   β

代码：
leftRotate(x):
  y = x.right
  x.right = y.left      // β成为x的右子树
  if y.left != NIL:
      y.left.parent = x
  y.parent = x.parent   // y替代x的位置
  if x.parent == NIL:
      root = y
  elif x == x.parent.left:
      x.parent.left = y
  else:
      x.parent.right = y
  y.left = x             // x成为y的左子树
  x.parent = y
\`\`\`

**右旋（Right Rotate）：** 左旋的镜像对称操作。

### 3. 插入与修复

\`\`\`
插入步骤：
1. 按BST规则找到插入位置
2. 新节点染成红色（为什么是红色？因为染黑色会违反性质5——改变黑高）
3. 调用insertFixup修复可能的违规

insertFixup(z):  // z是新插入的红色节点
while z.parent 是红色:  // 违反性质4（父子同为红）
    if z.parent 是左孩子:
        y = z.parent的兄弟(uncle)  // y是叔叔节点

        Case 1: uncle(y) 是红色
        ├── z.parent = BLACK
        ├── y = BLACK
        ├── z.parent.parent = RED  // 祖父染红
        └── z = z.parent.parent    // 向上递归处理

        Case 2: uncle(y) 是黑色 且 z是右孩子
        ├── z = z.parent
        └── leftRotate(z)         // 转为Case 3

        Case 3: uncle(y) 是黑色 且 z是左孩子
        ├── z.parent = BLACK
        ├── z.parent.parent = RED
        └── rightRotate(z.parent.parent)

    else: (z.parent是右孩子，镜像对称的三种case)
        ...左右互换...

root.color = BLACK  // 性质2保证
\`\`\`

**图解三种Case：**

\`\`\`
Case 1: Uncle是红 → 重染色，向上传递
      B                R
     / \\             / \\
    R   R    →      B   B
   /               /
  R(new)         R(new)

Case 2+3: Uncle是黑 + zigzag → 旋转变为直线 → 旋转+重染色
      B              B              B
     / \\            / \\           / \\
    R   B    →      R   B   →     R   R
     \\               \\           / \\
      R(new)          R(new)    (new) B
                   (Case2旋转)   (Case3旋转+染色)
\`\`\`

### 4. 删除操作（更复杂）

\`\`\`
删除步骤：
1. 找到要删除的节点z（类似BST删除）
2. 记录实际被移除的节点y（z本身或z的后继）
3. 记录y的唯一子节点x（可能为NIL）
4. 如果y是黑色的，调用deleteFixup(x)修复黑高变化
5. 用x替换y的位置

deleteFixup(x):
while x != root 且 x是黑色:
    if x是左孩子:
        w = x的兄弟(sibling)

        Case 1: w是红色
        ├── w = BLACK
        ├── x.parent = RED
        ├── leftRotate(x.parent)
        └── w = x的新兄弟

        Case 2: w的两个孩子都是黑色
        ├── w = RED
        └── x = x.parent

        Case 3: w的右孩子是黑色，左孩子是红色
        ├── w.left = BLACK
        ├── rightRotate(w)
        └── w = x的新兄弟

        Case 4: w的右孩子是红色
        ├── w.color = x.parent.color
        ├── x.parent = BLACK
        ├── w.right = BLACK
        ├── leftRotate(x.parent)
        └── x = root (退出循环)

    else: (镜像对称)
        ...

x.color = BLACK
\`\`\`

### 5. 红黑树 vs AVL树

| 维度 | 红黑树(RB-Tree) | AVL树 |
|------|---------------|-------|
| **平衡条件** | 近似平衡（最长≤2×最短） | 严格平衡（|高度差|≤1） |
| **查找** | O(logN) | O(logN)（略快，树更矮） |
| **插入** | O(logN)，最多2次旋转 | O(logN)，最多~1.44次旋转 |
| **删除** | O(logN)，最多3次旋转 | O(logN)，可能O(logN)次旋转 |
| **总体** | 写入性能更好 | 读取性能略优 |
| **适用** | 写多读少（TreeMap、调度器） | 读多写少 |

**选择建议：**

\`\`\`
你的场景是？
├── 查询远多于增删 → AVL树（如字典、静态索引）
├── 增删频繁 → 红黑树（如Java TreeMap、C++ std::map）
├── 需要范围查询 → 两者都支持中序遍历
├── 大数据量磁盘存储 → B+树（减少IO次数）
└── 内存中少量数据 → 都可以，红黑树更通用
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["算法", "数据结构", "红黑树", "自平衡树", "TreeMap"]
  },

  {
    title: "Top K问题的多种解法（海量数据处理）",
    content: `## 题目描述

Top K问题是面试中的高频题，有多种解法各有适用场景：

### 问题定义
从N个元素中找出最大的K个元素（或最小的K个），其中N可能非常大（无法全部装入内存）。

### 要求分析以下解法
1. **全局排序法**：O(N log N)，何时可用？
2. **堆（Heap）法**：O(N log K)，小顶堆 vs 大顶堆的选择
3. **快速选择（QuickSelect）法**：O(N)平均，最坏O(N²)
4. **计数排序/桶排序**：数据有范围限制时
5. **分治法（MapReduce思想）**：N极大时的分布式方案
6. **BFPRT算法**：最坏O(N)的确定性线性选择算法`,
    codeTemplate: {
      javascript: `/**
 * Top K - 多种解法实现
 */

// 解法一：最小堆（适用于N >> K的情况）
// 维护大小为K的最小堆，遍历所有元素
function topKMinHeap(arr, k) {
  const minHeap = new MinHeap(k);
  for (const num of arr) {
    if (minHeap.size() < k) {
      minHeap.insert(num);
    } else if (num > minHeap.peek()) {
      minHeap.extractMin();  // 弹出最小的
      minHeap.insert(num);
    }
  }
  return minHeap.toArray();
}

// 解法二：快速选择（QuickSelect）
// 基于快速排序的partition，平均O(N)
function quickSelect(arr, k) {
  // TODO: 实现QuickSelect
  // 提示：利用partition将数组分为两部分
  // 只递归包含第K大的那一侧
}

// 解法三：计数排序（数据范围有限时）
function topKCountingSort(arr, k, maxValue) {
  // TODO: 实现基于计数的Top K
}

// MinHeap类（需自行实现或使用优先队列库）
class MinHeap {
  constructor(capacity) {
    // TODO: 实现最小堆
  }
  insert(val) {}
  peek() {}
  extractMin() {}
  size() {}
  toArray() {}
}`,
      python: `"""
Top K - 多种解法
"""
import heapq
from typing import List
import random

def top_k_heap(nums: List[int], k: int) -> List[int]:
    """
    解法一：最小堆 - O(N log K)
    heapq是Python标准库的最小堆实现
    """
    # TODO: 使用nlargest或手动维护堆
    pass

def quick_select(nums: List[int], k: int) -> int:
    """
    解法二：快速选择 - 平均O(N)
    返回第K大的元素
    """
    # TODO: 实现quickselect算法
    # partition函数是关键
    pass

def top_k_bucket_sort(nums: List[int], k: int, max_val: int) -> List[int]:
    """
    解法三：桶排序 - O(N + M), M=max_val
    适用于数值范围有限的情况
    """
    # TODO: 实现桶排序版本
    pass

# 分布式Top K（MapReduce思想）
def distributed_top_k(data_chunks, k):
    """
    解法四：分治法
    1. 每个分片计算局部Top K
    2. 汇总所有局部结果
    3. 在汇总结果中计算最终Top K
    """
    local_topks = [top_k_heap(chunk, k) for chunk in data_chunks]
    merged = []
    for lst in local_topks:
        merged.extend(lst)
    return top_k_heap(merged, k)`,
      java: `import java.util.*;

/**
 * Top K - 多种解法
 */
public class TopKSolutions {

    /**
     * 解法一：PriorityQueue（最小堆）- O(N log K)
     */
    public static List<Integer> topKWithHeap(int[] nums, int k) {
        // 小顶堆：保持K个最大的元素
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(k);
        for (int num : nums) {
            if (minHeap.size() < k) {
                minHeap.offer(num);
            } else if (num > minHeap.peek()) {
                minHeap.poll();  // 移除最小的
                minHeap.offer(num);
            }
        }
        return new ArrayList<>(minHeap);
    }

    /**
     * 解法二：快速选择（QuickSelect）- 平均O(N)
     */
    public static int quickSelect(int[] nums, int k) {
        // TODO: 实现QuickSelect
        // k是第k大（从1开始计数）
        return 0;
    }

    /**
     * 解法三：BFPRT算法 - 最坏O(N)
     * 通过中位数的中位数(Median of Medians)选择好的pivot
     */
    public static int bfprt(int[] nums, int k) {
        // TODO: 实现BFPRT（可选进阶）
        return 0;
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "Top K", "堆排序", "快速选择", "海量数据"]
  },

  {
    title: "实现线程安全的阻塞队列（Blocking Queue）",
    content: `## 题目描述

设计并实现一个线程安全的阻塞队列：

### 要求
1. \`offer(e)\`: 如果队列未满，立即插入；否则返回false（非阻塞）
2. \`put(e)\`: 如果队列已满，阻塞等待直到有空间
3. \`poll()\`: 如果队列非空，立即移除并返回头部；否则返回null（非阻塞）
4. \`take()\`: 如果队列为空，阻塞等待直到有元素
5. 支持**公平**和**非公平**两种模式
6. 分析ArrayBlockingQueue vs LinkedBlockingQueue vs ConcurrentLinkedQueue的区别`,
    codeTemplate: {
      javascript: `/**
 * 阻塞队列 - JavaScript版（模拟，JS单线程但可用于理解概念）
 * 生产环境请使用 async/await 模拟阻塞语义
 */
class BlockingQueue {
  constructor(capacity, fair = false) {
    this.capacity = capacity;
    this.fair = fair;
    this.queue = [];
    this.notFull = new PromiseSource();  // 队列不满的条件变量
    this.notEmpty = new PromiseSource(); // 队列不空的条件变量
  }

  async put(item) {
    while (this.size() >= this.capacity) {
      await this.notFull.wait();  // 队列满时阻塞
    }
    this.enqueue(item);
    this.notEmpty.signal();  // 唤醒等待take的消费者
  }

  async take() {
    while (this.isEmpty()) {
      await this.notEmpty.wait();  // 队列空时阻塞
    }
    const item = this.dequeue();
    this.notFull.signal();  // 唤醒等待put的生产者
    return item;
  }

  // 非阻塞版本
  offer(item) { /* TODO */ }
  poll() { /* TODO */ }
  size() { return this.queue.length; }
  isEmpty() { return this.queue.length === 0; }
  enqueue(item) { this.queue.push(item); }
  dequeue() { return this.queue.shift(); }
}`,
      python: `"""
阻塞队列 - Python实现（threading.Condition）
"""
import threading
from collections import deque
from typing import TypeVar, Generic, Optional
import time

T = TypeVar('T')

class BlockingQueue(Generic[T]):
    def __init__(self, capacity: int, fair: bool = False):
        self.capacity = capacity
        self.fair = fair
        self._queue: deque = deque()
        self._lock = threading.Lock()
        self._not_full = threading.Condition(self._lock)
        self._not_empty = threading.Condition(self._lock)

    def put(self, item: T, timeout: float = None) -> None:
        """阻塞式放入，队列满时等待"""
        with self._not_full:
            # TODO: 实现超时等待
            while len(self._queue) >= self.capacity:
                if timeout is not None:
                    if not self._not_full.wait(timeout):
                        raise Full("Queue is full")
                else:
                    self._not_full.wait()
            self._queue.append(item)
            self._not_empty.notify()

    def take(self, timeout: float = None) -> T:
        """阻塞式取出，队列空时等待"""
        with self._not_empty:
            # TODO: 实现超时等待
            while not self._queue:
                if timeout is not None:
                    if not self._not_empty.wait(timeout):
                        raise Empty("Queue is empty")
                else:
                    self._not_empty.wait()
            item = self._queue.popleft()
            self._not_full.notify()
            return item

    def offer(self, item: T) -> bool:
        """非阻塞式放入，满则返回False"""
        # TODO: 实现
        pass

    def poll(self) -> Optional[T]:
        """非阻塞式取出，空则返回None"""
        # TODO: 实现
        pass`,
      java: `import java.util.concurrent.locks.*;
import java.util.concurrent.*;

/**
 * 阻塞队列 - ReentrantLock + Condition 实现
 * 模仿 ArrayBlockingQueue 的核心逻辑
 *
 * @param <E>
 */
public class MyBlockingQueue<E> {

    private final Object[] items;
    private int takeIndex;      // 出队下标
    private int putIndex;       // 入队下标
    private int count;          // 当前元素数

    private final ReentrantLock lock;
    private final Condition notEmpty;  // 出队条件（队列不空）
    private final Condition notFull;   // 入队条件（队列不满）

    public MyBlockingQueue(int capacity, boolean fair) {
        if (capacity <= 0) throw new IllegalArgumentException();
        this.items = new Object[capacity];
        this.lock = new ReentrantLock(fair);
        this.notEmpty = lock.newCondition();
        this.notFull = lock.newCondition();
    }

    public void put(E e) throws InterruptedException {
        Objects.requireNonNull(e);
        lock.lockInterruptibly();
        try {
            while (count == items.length) {
                notFull.await();  // 队列满，阻塞等待
            }
            enqueue(e);
            notEmpty.signal();  // 通知消费者
        } finally {
            lock.unlock();
        }
    }

    public E take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (count == 0) {
                notEmpty.await();  // 队列空，阻塞等待
            }
            E e = dequeue();
            notFull.signal();  // 通知生产者
            return e;
        } finally {
            lock.unlock();
        }
    }

    public boolean offer(E e) {
        // TODO: 非阻塞版本
        return false;
    }

    public E poll() {
        // TODO: 非阻塞版本
        return null;
    }

    private void enqueue(E e) {
        items[putIndex] = e;
        if (++putIndex == items.length) putIndex = 0;
        count++;
    }

    @SuppressWarnings("unchecked")
    private E dequeue() {
        E e = (E) items[takeIndex];
        items[takeIndex] = null;  // help GC
        if (++takeIndex == items.length) takeIndex = 0;
        count--;
        return e;
    }
}`
    },
    difficulty: "hard",
    questionType: "code",
    tags: ["算法", "并发编程", "阻塞队列", "生产者消费者", "线程安全"]
  },

  {
    title: "设计短链接系统（TinyURL）",
    content: `## 题目描述

设计一个类似 bit.ly 的短链接服务：

### 功能需求
1. 输入长URL → 生成唯一短码（如 \`https://tiny.url/abc12\`）
2. 访问短码 → 301/302重定向到原始长URL
3. 支持自定义短码（如 \`https://tiny.url/mybrand\`）
4. 统计点击次数、来源、访问时间等 analytics
5. 短链接有过期时间（可选永久有效）

### 非功能需求
- 高可用（99.99% SLA）
- 低延迟（生成<50ms，重定向<200ms）
- 可扩展（日活千万级用户，百亿次点击/月）

### 设计要点
1. **ID生成方案**：自增ID + Base62编码 vs UUID vs 雪花算法 vs 预生成号段
2. **存储设计**：MySQL vs Redis vs LevelDB（LSM Tree）
3. **缓存策略**：多级缓存（L1本地 + L2分布式）
4. **高并发优化**：批量写入、异步统计、CDN加速`,
    solution: `## 深度解析

### 整体架构

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN Layer (边缘缓存)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CDN Edge Nodes（全球分布）                           │   │
│  │  - 缓存热门短链的重定向响应                            │   │
│  │  - TTL: 1小时（热门）/ 5分钟（普通）                  │   │
│  │  - 回源策略：MISS时回源到API Gateway                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway (Kong/Nginx)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Rate Limit│ │ Auth     │ │ Routing  │                    │
│  │ (限流)    │ │ (鉴权)   │ │ (路由)   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Write Service│ │ Read Service │ │Analytics Svc │
│ (生成短链)   │ │ (重定向)     │ │ (统计分析)   │
│ POST /shorten│ │ GET /:code  │ │ GET /stats   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ MySQL Cluster│ │ Redis Cluster│ │ ClickHouse   │
│ (持久存储)    │ │ (热点缓存)   │ │ (分析存储)   │
└──────────────┘ └──────────────┘ └──────────────┘
\`\`\`

### ID生成方案详解

**方案一：自增ID + Base62编码（推荐）**

\`\`\`java
// 自增ID → Base62短码
public class Base62Encoder {

    private static final String BASE62_CHARS =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static String encode(long id) {
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(BASE62_CHARS.charAt((int)(id % 62)));
            id /= 62;
        }
        return sb.reverse().toString();
    }

    public static long decode(String shortCode) {
        long id = 0;
        for (char c : shortCode.toCharArray()) {
            id = id * 62 + BASE62_CHARS.indexOf(c);
        }
        return id;
    }
}

// 示例：
// ID=1000000000 → "15jcwVc" (7字符)
// ID=9999999999 → "gP0tWp" (6字符)
// 62^6 = 56.8亿 → 6字符可表示56.8亿条
// 62^7 = 3521亿 → 7字符可表示3521亿条
\`\`\`

**各方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **自增+Base62** | 简单、有序、最短 | 单点写入瓶颈 | 中小型服务 |
| **雪花算法** | 分布式友好、趋势递增 | 依赖时钟、较长(18位) | 分布式大规模 |
| **预生成号段** | 写入极快、无单点 | 需要号段管理服务 | 超高并发写入 |
| **UUID** | 天然唯一 | 太长(36字符)、无序 | 不适合短链 |

### 存储层设计

\`\`\`sql
-- MySQL 表结构
CREATE TABLE url_mapping (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,           -- 过期时间，NULL=永不过期
    custom_alias VARCHAR(50) NULL,      -- 用户自定义短码
    user_id BIGINT NULL,                -- 创建者
    click_count INT DEFAULT 0,          -- 点击次数（可考虑异步更新）
    INDEX idx_short_code (short_code),
    INDEX idx_expires (expires_at),
    INDEX idx_user (user_id)
);

-- 分表策略（按ID取模，16张表）
-- url_mapping_0 ~ url_mapping_15
\`\`\`

**缓存设计：**

\`\`\`
两级缓存架构：

L1: 本地缓存（Caffeine/Guava Cache）
├── 容量：10000条
├── TTL: 5分钟
├── 命中率目标：>80%
└── 减少Redis网络开销

L2: Redis分布式缓存
├── 热门短链（TOP 10000）
├── String类型: key=tiny:{code}, value={original_url}
├── TTL: 1小时（热门）/ 24小时（普通）
└── 淘汰策略：LFU（保留高频访问）

读取路径：
Client → CDN(命中?) → L1本地缓存(命中?) → L2 Redis(命中?) → MySQL
                                                    ↓
                                              回填L1和L2
\`\`\`

### API设计

\`\`\`yaml
# 生成短链
POST /api/v1/shorten
Request:
  url: "https://very-long-url.com/path?query=params"  # 必填
  custom_code: "my-brand"                              # 可选，自定义短码
  ttl_seconds: 86400                                    # 可选，过期时间
Response:
  short_url: "https://tiny.url/abc12"
  short_code: "abc12"

# 重定向（核心接口）
GET /{shortCode}
Response: 302 Redirect → Location: https://original-url.com
Headers:
  X-Cache: HIT/MISS  # 用于监控缓存命中率

# 统计信息
GET /api/v1/stats/{shortCode}
Response:
  short_code: "abc12"
  original_url: "..."
  created_at: "2024-01-01T00:00:00Z"
  click_count: 12345
  last_clicked_at: "2024-06-10T12:00:00Z"
\`\`\`

### 性能指标估算

\`\`\`
假设：DAU = 1000万，人均每天生成2个短链，点击5次

写入QPS：
  日均生成 = 1000万 × 2 = 2000万个
  峰值 QPS = 2000万 / 86400 × 10(峰值倍数) ≈ 2300 QPS

读取QPS：
  日均点击 = 1000万 × 5 = 5000万次
  峰值 QPS = 5000万 / 86400 × 20(峰值倍数) ≈ 11500 QPS

存储需求：
  年增长 = 2000万 × 365 = 73亿条/年
  MySQL: 73亿 × 200字节/条 ≈ 1.4TB/年（需分库分表）
  Redis: 热门1000万 × 500字节/key ≈ 5GB

成本估算（阿里云参考）：
  MySQL (RDS高可用): ~¥3000/月/TB
  Redis (集群版): ~¥2000/月/16GB
  CDN流量: 5000万次 × 1KB × ¥0.24/GB ≈ ¥12/天
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["系统设计", "短链接", "Base62", "高并发", "CDN"]
  },

  {
    title: "设计秒杀（Seckill）系统",
    content: `## 题目描述

设计一个电商平台的秒杀/抢购系统：

### 业务特点
- 商品库存极少（如iPhone 100台，茅台1000瓶）
- 流量瞬间爆发（10万+人同时抢购）
- 要求严格的库存一致性（超卖=严重事故）
- 公平性要求（防止机器人刷单）

### 核心挑战
1. **超高并发**：QPS从平时的几百飙升至数十万
2. **防止超卖**：卖多了就是重大事故（需要退款+公关危机）
3. **防刷防作弊**：黄牛党、脚本抢购、恶意请求
4. **用户体验**：排队等待、进度提示、友好的失败提示`,
    solution: `## 深度解析

### 整体架构（六层防护）

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     第一层：客户端/前端                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ · 按钮置灰（倒计时结束前不可点击）                      │  │
│  │ · 本地限流（同一用户1秒只能请求1次）                    │  │
│  │ · 验证码/滑块（人机验证）                             │  │
│  │ · 静态资源CDN（页面/图片/CSS/JS）                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   第二层：网关层（限流）                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 全局限流  │ │ IP限流   │ │ 用户限流  │                    │
│  │ 10万QPS  │ │ 100/IP/s │ │ 1次/user │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  第三层：服务层（削峰填谷）                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  消息队列（异步削峰）                                 │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐         │   │
│  │  │ 请求入队 │ →  │ 消费者   │ →  │ 下单服务  │         │   │
│  │  │ (缓冲)   │    │ (限速)   │    │ (数据库)  │         │   │
│  │  └─────────┘    └─────────┘    └─────────┘         │   │
│  │                                                     │   │
│  │  10万请求/秒 → MQ缓冲 → 1000下单/秒（数据库承受力）  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   第四层：缓存层（预减库存）                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Redis Lua脚本原子操作                                │   │
│  │  -- 先查库存                                         │   │
│  │  local stock = redis.call('get', KEYS[1])            │   │
│  │  if tonumber(stock) <= 0 then                        │   │
│  │    return 0  -- 库存不足                               │   │
│  │  end                                                 │   │
│  │  -- 原子扣减                                          │   │
│  │  redis.call('decrby', KEYS[1], 1)                    │   │
│  │  return 1  -- 抢购成功                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   第五层：数据库层（最终一致）                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MySQL:                                             │   │
│  │  UPDATE inventory                                     │   │
│  │  SET stock = stock - 1, version = version + 1        │   │
│  │  WHERE product_id = ? AND stock > 0 AND version = ?  │   │
│  │  (乐观锁 + 库存检查双重保障)                           │   │
│  │                                                      │   │
│  │  如果Redis扣了但DB失败了：                             │   │
│  │  → 异步补偿：定时任务扫描不一致数据                     │   │
│  │  → 或发消息到补偿队列人工处理                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### 核心代码：Redis Lua脚本扣库存

\`\`\`java
@Service
public class SeckillService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    // Lua脚本：原子性预减库存
    private static final String STOCK_LUA = ""
        + "local stock = redis.call('get', KEYS[1]) "
        + "if not stock then "
        + "  return -1 "  // key不存在
        + "end "
        + "stock = tonumber(stock) "
        + "if stock <= 0 then "
        + "  return 0 "   // 已售罄
        + "end "
        + "redis.call('decrby', KEYS[1], 1) "
        + "return 1 ";     // 扣减成功

    public boolean deductStock(Long productId) {
        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(STOCK_LUA, Long.class),
            Collections.singletonList("seckill:stock:" + productId)
        );

        if (result == null || result.longValue() <= 0) {
            return false;  // 库存不足
        }

        // 发送MQ消息异步下单
        seckillOrderMQ.send(new OrderMessage(productId, getUserId()));
        return true;
    }
}
\`\`\`

### 防刷策略

\`\`\`
┌──────────────────────────────────────────────────────────┐
│                    反作弊体系                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. 请求频率限制                                         │
│     ├── 同一IP: 10次/秒                                  │
│     ├── 同一用户: 1次/秒                                 │
│     ├── 同一设备: 5次/秒（Device Fingerprint）            │
│     └── Sentinel/Guava RateLimiter                       │
│                                                          │
│  2. 行为分析                                             │
│     ├── 风控引擎（规则+ML模型）                           │
│     │   ├── 请求间隔过于规律（脚本特征）                   │
│     │   ├── User-Agent异常                               │
│     │   ├── 操作轨迹不符合人类习惯                         │
│     │   └── 关联多个可疑账号                              │
│     ├── 黑名单（实时更新）                                │
│     └── 灰名单（额外验证）                                │
│                                                          │
│  3. 人机验证                                             │
│     ├── 滑块验证（图形/拼图/文字）                        │
│     ├── reCAPTCHA v3（行为评分）                         │
│     └── 短信验证码（高危操作）                            │
│                                                          │
│  4. 账号维度                                             │
│     ├── 新账号限制参与                                    │
│     ├── 历史作弊记录                                     │
│     ├── 关联检测（同设备/同IP/同支付账号）                │
│     └── 等级制度（信誉等级高的用户优先）                   │
│                                                          │
│  5. 前端保护                                             │
│     ├── 接口加密（签名+时间戳防重放）                     │
│     ├── 代码混淆                                         │
│     └── 动态加载（反爬虫）                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
\`\`\`

### 异常处理与兜底

\`\`\`
1. Redis扣减成功但下单失败（MQ消费异常）
   → 补偿机制：定时任务扫描"已扣库存但未下单"的记录
   → 自动退还库存 或 人工介入

2. 数据库最终超卖（极端情况）
   → 乐观锁UPDATE WHERE stock > 0 保证不超卖
   → 超卖的订单标记为异常，客服联系用户退款/补发

3. 服务宕机
   → Redis库存数据定期持久化到DB
   → 服务重启后从DB恢复Redis状态

4. 消息队列堆积
   → 监控队列深度告警
   → 动态扩容消费者
   → 降级策略：暂停秒杀入口，返回"活动太火爆"
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["系统设计", "秒杀", "高并发", "Redis", "消息队列"]
  },

  // ==================== 操作系统 (第79-86题) ====================

  {
    title: "进程与线程的本质区别及切换开销",
    content: `## 题目描述

进程和线程是操作系统中最基本的概念之一：

### 核心问题
1. **本质区别**：进程 vs 线程在资源分配、调度单位、通信方式上的根本差异
2. **上下文切换**：什么是上下文？进程切换 vs 线程切换的开销差多少？
3. **进程状态**：就绪/运行/阻塞/挂起的完整状态转换图
4. **线程模型**：内核级线程 vs 用户级线程（1:1/N:1/M:N）各自的优缺点
5. **Java线程与OS线程的关系**：JVM如何映射到操作系统线程？`,
    solution: `## 深度解析

### 1. 进程 vs 线程

| 维度 | 进程 (Process) | 线程 (Thread) |
|------|--------------|-------------|
| **本质** | 资源分配的基本单位 | CPU调度的基本单位 |
| **地址空间** | 独立（彼此隔离） | 共享所属进程的地址空间 |
| **资源拥有** | 独立拥有（文件描述符、内存等） | 共享进程资源 |
| **通信** | IPC（管道/消息队列/共享内存/Socket） | 直接读写共享变量（需同步） |
| **创建开销** | 大（需要复制整个地址空间） | 小（只需分配栈和寄存器） |
| **切换开销** | 大（TLB刷新、Cache失效） | 相对小（同进程内无需刷新TLB） |
| **健壮性** | 一个进程崩溃不影响其他 | 一个线程崩溃可能导致整个进程崩溃 |
| **典型数量** | 数十~数百 | 数千~数万 |

### 2. 上下文切换详解

**进程上下文切换（Process Context Switch）：**

\`\`\`
CPU运行进程A → 切换到进程B 的完整过程：

1. 保存进程A的上下文（硬件上下文）
   ├── 保存程序计数器(PC)：下一条指令地址
   ├── 保存寄存器值：通用寄存器、浮点寄存器
   └── 保存栈指针(SP)和帧指针(BP)

2. 更新进程控制块(PCB)
   ├── 进程A的状态改为 就绪/阻塞
   ├── 更新调度信息（时间片消耗等）
   └── 选择下一个运行的进程B

3. TLB（Translation Lookaside Buffer）刷新
   └── 这是昂贵的操作！TLB保存虚拟→物理页映射
       不同进程的地址空间完全不同，必须全部失效

4. Cache影响
   └── L1/L2 Cache可能部分失效（Cache污染）

5. 恢复进程B的上下文
   ├── 恢复PC、寄存器、SP/BP
   ├── 加载进程B的页表基地址到CR3寄存器
   └── CPU开始执行进程B

总耗时：几微秒到几十微秒（取决于架构）
\`\`\`

**线程上下文切换（Thread Context Switch）：**

\`\`\`
同进程内的线程切换（轻量级）：

1. 保存线程A的上下文
   ├── PC、寄存器（同进程切换）
   ├── SP（每个线程有自己的栈）
   └── 线程私有变量（Thread Local Storage）

2. 不需要刷新TLB！（共享同一地址空间）
3. Cache大部分命中（共享数据仍在Cache中）
4. 恢复线程B的上下文

总耗时：约100纳秒~1微秒（约为进程切换的1/10~1/50）
\`\`\`

**实测数据参考（Linux x86_64）：**

| 操作 | 耗时 | 说明 |
|------|------|------|
| 进程上下文切换 | ~2-8 μs | 包含TLB刷新 |
| 同进程线程切换 | ~0.1-1 μs | 无TLB刷新 |
| 系统调用（简单） | ~0.1-0.5 μs | trap + 内核处理 |
| 函数调用 | ~1-5 ns | 用户态内 |

### 3. 进程状态完整转换

\`\`\`
                          ┌──────────────┐
                          │   创建(New)   │
                          └──────┬───────┘
                                 │ admit
                                 ▼
┌──────────────┐  调度选中   ┌──────────────┐  时间片用完/被抢占
│  就绪(Ready)  │ ←────────  │  运行(Running)│ ──────────→
│  (等待CPU)    │            │  (正在执行)   │
└──────┬───────┘            └──────┬───────┘
       │ I/O请求/等待事件             │ I/O完成/事件到达
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│  阻塞(Blocked)│──────────────│  运行(Running)│
│  (等待I/O等)  │  I/O完成     │              │
└──────────────┘              └──────┬───────┘
                                      │ exit/终止
                                      ▼
                              ┌──────────────┐
                              │  终止(Exited)  │
                              └──────────────┘

补充状态（Linux特有）：
- 不可中断睡眠(Uninterruptible Sleep): 等待硬件响应，不可被信号唤醒
- 停止(Stopped): 收到SIGSTOP/SIGTSTP信号（调试时常见）
- 僵尸(Zombie): 子进程结束但父进程尚未wait()回收
\`\`\`

### 4. 线程模型

\`\`\`
模型一：用户级线程（N:1）
┌─────────────────────────────┐
│        用户空间              │
│  Thread1 Thread2 Thread3 ... │  ← N个用户线程
│  └──── 线程库调度 ────┘     │
├─────────────────────────────┤
│        内核空间              │
│        1个内核线程            │  ← 映射到1个内核线程
└─────────────────────────────┘
优点：切换快（无需内核介入）、可定制调度策略
缺点：无法利用多核（一个阻塞全部阻塞）、无真正并行

模型二：内核级线程（1:1）
┌─────────────────────────────┐
│        用户空间              │
│  Thread1 Thread2 Thread3     │
├─────────────────────────────┤
│        内核空间              │
│  KThread1 KThread2 KThread3  │  ← 1:1映射
│  └──── OS调度 ────┘         │
└─────────────────────────────┘
优点：真正并行（多核）、一个阻塞不影响其他
缺点：创建开销大、受系统线程数限制

模型三：混合模型（M:N）
┌─────────────────────────────┐
│        用户空间              │
│  T1 T2 T3 T4 T5 T6 ...      │  ← N个用户线程
│  └── 线程库(LWP) ──┘       │  ← M个轻量级进程
├─────────────────────────────┤
│        内核空间              │
│  K1  K2  K3  ...            │  ← M个内核线程
└─────────────────────────────┘
优点：兼得两者之长（前两组的折中）
缺点：实现复杂（Go runtime goroutine采用此模型）
\`\`\`

### 5. Java线程模型演进

\`\`\`
JDK 1.2之前：Green Threads（用户级线程，N:1）
  → 不支持多核，已被淘汰

JDK 1.2之后：Native Threads（1:1模型）
  → 每个Java Thread对应一个OS内核线程
  → Thread.currentThread().getId() ≠ OS thread ID

JDK 21 (2023) Virtual Threads（Project Loom，M:N）
  → 轻量级线程（类似goroutine/coroutine）
  → 由JVM调度，而非OS调度
  → 可以创建百万级虚拟线程

// JDK 21 虚拟线程示例
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            // 百万级并发不再是问题
            handleRequest();
        });
    }
}
// 传统平台线程：10000个就会耗尽资源
// 虚拟线程：1000000个轻松应对（每个只占几KB）
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["操作系统", "进程", "线程", "上下文切换", "并发"]
  },

  {
    title: "死锁产生的四个必要条件与解决方案",
    content: `## 题目描述

死锁是多线程/分布式系统中常见的致命问题：

### 核心问题
1. **必要条件**：Coffman条件的四个条件是什么？缺一不可
2. **预防策略**：如何破坏四个条件中的一个来预防死锁？
3. **检测与恢复**：银行家算法如何避免死锁？如何检测已经发生的死锁？
4. **数据库死锁**：MySQL InnoDB的死锁检测机制是什么？
5. **分布式死锁**：微服务环境下跨服务的死锁如何预防和解决？`,
    solution: `## 深度解析

### 1. 死锁四条件（Coffman Conditions，1971）

\`\`\`
条件一：互斥条件（Mutual Exclusion）
├── 资源在同一时刻只能被一个线程持有
├── 例：打印机、数据库行锁、文件写锁
└── 注意：这是资源的固有属性，通常无法改变

条件二：持有并等待（Hold and Wait）
├── 线程持有至少一个资源的同时，还在等待获取其他资源
├── 例：事务A持有行1的锁，同时想获取行2的锁
└── 可破坏：一次性申请所有资源

条件三：不可抢占（No Preemption）
├── 资源只能由持有者主动释放，不能被强制剥夺
├── 例：CPU不能从一个线程强行夺走给另一个
└── 可破坏：允许抢占（优先级调度）

条件四：循环等待（Circular Wait）
├── 存在一个线程集合 {T1, T2, ..., Tn}，使得：
│   T1等待T2持有的资源
│   T2等待T3持有的资源
│   ...
│   Tn等待T1持有的资源
└── 形成一个闭环！

四个条件必须同时满足才会发生死锁！
打破任何一个即可避免死锁。
\`\`\`

### 2. 经典死锁案例

\`\`\`java
// 转账死锁
public void transfer(Account from, Account to, BigDecimal amount) {
    synchronized (from) {        // ① 锁住转出账户
        sleep(10);              // 故意延迟，增加死锁概率
        synchronized (to) {     // ② 锁住转入账户
            from.debit(amount);
            to.credit(amount);
        }
    }
}

// 并发执行：
// Thread-A: transfer(A, B, 100)  → 先锁A，再想锁B
// Thread-B: transfer(B, A, 200)  → 先锁B，再想锁A
// 结果：A等B，B等A → 死锁！💀
\`\`\`

### 3. 四种解决策略

**策略一：死锁预防（Deadlock Prevention）——破坏条件**

\`\`\`
破坏条件二（持有并等待）：
  → 一次性申请所有资源
  → 要么全拿到，要么都不拿
  → 缺点：资源利用率低，可能饥饿

破坏条件三（不可抢占）：
  → 允许抢占：持有资源A，申请新资源B失败时，
     主动释放A，稍后重新尝试全部
  → 缺点：实现复杂，可能活锁

破坏条件四（循环等待）：
  → 资源排序（加锁顺序固定）：
     所有账户按ID排序，永远先锁小的
  → 或使用 tryLock(timeout) 超时放弃
\`\`\`

**策略二：死锁避免（Deadlock Avoidance）——银行家算法**

\`\`\`
银行家算法核心思想：
  在分配资源前，预先判断这次分配是否会导致系统进入不安全状态
  如果不会，才进行分配

关键概念：
  - 安全状态：存在一种执行序列使所有进程都能完成
  - 不安全状态：可能导致死锁（但不一定会发生）

示例：
  总资源：[10, 5, 7]
  进程P0已持有[0, 1, 0]，还需要[7, 4, 3]
  进程P1已持有[2, 0, 0]，还需要[1, 2, 2]
  进程P2已持有[3, 0, 2]，还需要[6, 0, 0]
  进程P3已持有[2, 1, 1]，还需要[0, 1, 0]
  可用资源：[3, 3, 2]

  P2只需要[6,0,0]，可用[3,3,2]不够 → 跳过
  P3只需要[0,1,0]，可用足够 → 假设分配给P3
  P3完成后释放资源 → 可用增加 → 继续检查...
  最终发现安全序列：P3 → P1 → P2 → P0 → 全部完成 ✓
\`\`\`

**策略三：死锁检测与恢复（Detection & Recovery）**

\`\`\`
检测方法：资源分配图（Resource Allocation Graph）
  - 图中有环 → 可能死锁（对于每种资源只有一个实例的情况，有环=死锁）
  - 定期运行检测算法（O(n²)复杂度）

恢复方法：
  1. 抢占资源：从某些进程中强制剥夺资源
  2. 回滚进程：将死锁进程回滚到之前的检查点
  3. 终止进程：杀死一个或多个死锁进程（最常用！）
     选择牺牲者的依据：
     - 优先级最低的进程
     - 已完成工作量最少的进程
     - 还需要最多资源的进程
\`\`\`

**策略四：鸵鸟策略（Ostrich Algorithm）**

\`\`\`
忽略死锁问题，假装它不会发生
→ Linux内核、大多数操作系统默认采用此策略
→ 理由：死锁发生概率低，检测/预防代价高
→ 但对于关键业务（金融交易），绝不能采用！
\`\`\`

### 4. Java代码层面的最佳实践

\`\`\`java
// 方案一：固定加锁顺序（推荐！）
public void transferSafe(Account from, Account to, BigDecimal amount) {
    Account first = from.getId() < to.getId() ? from : to;
    Account second = from.getId() < to.getId() ? to : from;

    synchronized (first) {
        synchronized (second) {
            first.debit(amount);
            second.credit(amount);
        }
    }
}
// 无论转账方向如何，总是先锁ID小的账户
// 打破了循环等待条件！

// 方案二：tryLock超时机制
public void transferWithTimeout(Account from, Account to, BigDecimal amount) {
    long startTime = System.currentTimeMillis();

    while (true) {
        if (from.getLock().tryLock()) {
            try {
                if (to.getLock().tryLock(100, TimeUnit.MILLISECONDS)) {
                    try {
                        from.debit(amount);
                        to.credit(amount);
                        return;
                    } finally {
                        to.getLock().unlock();
                    }
                }
            } finally {
                from.getLock().unlock();
            }
        }

        // 超时检查
        if (System.currentTimeMillis() - startTime > 5000) {
            throw new RuntimeException("Transfer failed: deadlock or timeout");
        }

        // 随机退避，避免活锁
        Thread.sleep(new Random().nextInt(50));
    }
}

// 方案三：ConcurrentHashMap的分段锁思想
// 不要用synchronized锁大对象，而是细粒度锁定
// 类似：ConcurrentHashMap的分段锁（JDK7）/ CAS + synchronized（JDK8+）
\`\`\`

### 5. MySQL InnoDB死锁检测

\`\`\`sql
-- 开启死锁日志
SET GLOBAL innodb_print_all_deadlocks = ON;
-- 死锁信息输出到MySQL错误日志

-- 手动查看最近的死锁
SHOW ENGINE INNODB STATUS;
-- 在"LATEST DETECTED DEADLOCK"部分可以看到：
-- ① 涉及的事务
-- ② 每个事务持有的锁和等待的锁
-- ③ 导致死锁的SQL语句

-- 死锁检测机制：
-- InnoDB使用 wait-for graph（等待图）检测死锁
-- 当事务T1等待T2持有的锁时，构建一条边 T1 → T2
-- 如果图中出现环，判定为死锁
-- 选择 undo量最小的事务作为受害者（回滚代价最小）

-- 预防措施：
-- 1. 以固定的顺序访问表和行
-- 2. 大事务拆分为小事务（减少持有锁的时间）
-- 3. 降低隔离级别（如READ COMMITTED允许更多并发）
-- 4. 合理设计索引（避免间隙锁冲突）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["操作系统", "死锁", "并发编程", "锁", "数据库"]
  },

  // ==================== 网络协议 (第87-94题) ====================

  {
    title: "TCP三次握手与四次挥手详解",
    content: `## 题目描述

TCP连接建立（三次握手）和释放（四次挥手）是网络面试必考题：

### 核心问题
1. **三次握手详细过程**：SYN/ACK/SEQ/ACK号的含义？为什么不能两次握手？
2. **四次挥手详细过程**：为什么TIME_WAIT状态需要等待2MSL？
3. **TCP状态机**：LISTEN → SYN_SENT → ESTABLISHED → FIN_WAIT_1 → TIME_WAIT 的完整转换
4. **常见攻击**：SYN Flood攻击原理与防御（SYN Cookie）
5. **KeepAlive机制**：TCP Keepalive vs 应用层心跳的区别`,
    solution: `## 深度解析

### 1. 三次握手（Three-Way Handshake）

\`\`\`
客户端(Client)                    服务器(Server)
    │                                 │
    │  ① SYN=1, seq=x               │
    │ ──────────────────────────────→│  SYN_SENT
    │                                 │
    │         ② SYN=1, ACK=1,        │
    │         ack=x+1, seq=y         │
    │ ←──────────────────────────────│  SYN_RCVD
    │                                 │
    │  ③ ACK=1, ack=y+1, seq=x+1    │
    │ ──────────────────────────────→│  ESTABLISHED ✓
    │                                 │  ESTABLISHED ✓

关键字段说明：
├── SYN (Synchronize): 同步标志位，发起连接时置1
├── ACK (Acknowledgment): 确认标志位，确认收到数据后置1
├── seq (Sequence Number): 序列号，标识本报文数据的第一个字节编号
├── ack (Acknowledgment Number): 确认号，期望收到的下一个seq值
│
├── 初始seq是随机的（ISN, Initial Sequence Number）
│   目的：防止历史重复的连接请求数据干扰新连接
│
└── 为什么需要三次？（不能两次）
    ① 防止已失效的连接请求到达服务器（主要理由）
       场景：客户端发的第一个SYN在网络中滞留，
            客户户端超时重发了新的SYN并建立了连接，
            之后旧的SYN到达服务器 → 服务器误以为新连接请求
       三次握手确保双方都有发送和接收能力
    ② 同步双方的初始序列号（双向确认）
\`\`\`

**为什么不能两次握手？**

\`\`\`
假设只有两次握手（Client→SYN, Server→SYN+ACK）：

场景：滞留的历史SYN
Time 1: Client发送SYN(seq=100) → 网络拥堵，滞留
Time 2: Client超时，重新发送SYN(seq=200)
        Server回复SYN+ACK(ack=201) → 连接建立
Time 3: 双方正常通信，然后关闭连接
Time 4: 旧的SYN(seq=100)终于到达Server！
        Server以为是新连接请求，回复SYN+ACK(ack=101)
        Client收到后一脸懵逼："我没发这个啊？" → 丢弃
        但Server已经建立了连接，浪费资源等待数据

如果有第三次握手（Client的ACK）：
Server发出SYN+ACK后处于半连接状态
只有收到Client的ACK才正式建立连接
旧的SYN即使到达，Client也不会回复ACK（因为早已关闭）
Server超时后自动丢弃该半连接
\`\`\`

### 2. 四次挥手（Four-Way Teardown）

\`\`\`
Client                           Server
  │                                │
  │  ① FIN=1, seq=u               │  （我发完了，不再发送数据）
  │ ─────────────────────────────→│  FIN_WAIT_1
  │                                │  CLOSE_WAIT
  │  ② ACK=1, ack=u+1, seq=v      │  （收到了，但我还有数据要发）
  │ ←─────────────────────────────│  FIN_WAIT_2
  │                                │  （Client等待Server也FIN）
  │                                │
  │        ③ FIN=1, seq=w          │  （我也发完了）
  │ ←─────────────────────────────│  LAST_ACK
  │                                │
  │  ④ ACK=1, ack=w+1, seq=u+1    │  （收到，拜拜）
  │ ─────────────────────────────→│  TIME_WAIT
  │                                │  CLOSED
  │  等待2MSL...                   │  CLOSED
  │  CLOSED                         │
  │                                │

为什么四次？（因为TCP是全双工的）
每个方向都需要单独关闭：
- Client→Server方向：Client发FIN（①），Server确认ACK（②）
- Server→Client方向：Server发FIN（③），Client确认ACK（④）
②和③之间可能有延迟（Server还有数据要发给Client）
所以不能合并为三次（除非Server没有数据要发，此时②③可合并）
\`\`\`

### 3. TIME_WAIT 与 2MSL

\`\`\`
TIME_WAIT状态：
├── 持续时间：2MSL（Maximum Segment Lifetime，通常30~60秒×2 = 60~120秒）
├── 存在于：主动关闭连接的一方（通常是Client）
├── 作用：
│   ① 确保最后一个ACK能到达Server
│      如果ACK丢失，Server会重传FIN
│      TIME_WAIT期间收到FIN可以重发ACK
│   ② 确保网络中的旧报文完全消失
│      等待2MSL后，本次连接的所有报文都已消失
│      不会影响后续的新连接（防止旧报文干扰新连接）
│
├── 问题：大量TIME_WAIT会占用端口资源
│   解决方案：
│   ① SO_REUSEADDR：允许端口复用（注意不是 reuse 已建立的连接）
│   ② 快速回收：net.ipv4.tcp_tw_recycle = 1（谨慎使用）
│   ③ 负载均衡：分散TIME_WAIT到多台机器
│   ④ 增加端口范围：net.ipv4.ip_local_port_range
│
└── 生产经验：
    高并发短连接的服务器（如HTTP 1.0无Keep-Alive）
    可能产生大量TIME_WAIT（每秒数千~数万）
    需要特别关注和优化
\`\`\`

### 4. TCP状态机全景图

\`\`\`
                              ┌─────────────┐
                              │   CLOSED    │
                              └──────┬──────┘
                                     │ active open / passive open
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌────────────┐   ┌────────────┐   ┌────────────┐
             │  SYN_SENT  │   │   LISTEN   │   │  SYN_SENT  │
             └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
                   │ rcv SYN        │ rcv SYN         │ rcv SYN+ACK
                   ▼                ▼                 ▼
             ┌────────────┐   ┌────────────┐   ┌────────────┐
             │ESTABLISHED │   │  SYN_RCVD  │   │ESTABLISHED │
             └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
                   │                │ send SYN+ACK      │
                   │                ▼                 │
                   │         ┌────────────┐            │
                   │         │ESTABLISHED │◄───────────┘
                   │         └─────┬──────┘
                   │               │ close / close
                   ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ FIN_WAIT_1 │  │ FIN_WAIT_2 │  │ CLOSE_WAIT │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │ rcv FIN       │ rcv FIN      │ close
      ▼               ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ CLOSING    │  │ TIME_WAIT  │  │ LAST_ACK   │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │ rcv ACK      │ 2MSL超时      │ rcv ACK
      ▼               ▼              ▼
┌──────────────────────────────────────────┐
│               CLOSED                    │
└──────────────────────────────────────────┘

关键状态说明：
CLOSED: 初始/终态，无连接
LISTEN: 服务端监听状态（被动打开）
SYN_SENT: 发送了SYN，等待对方SYN+ACK（客户端）
SYN_RCVD: 收到了SYN，发送了SYN+ACK（服务端）
ESTABLISHED: 连接已建立，可以传输数据
FIN_WAIT_1: 发送了FIN，等待对方ACK
FIN_WAIT_2: 收到了对方ACK，等待对方FIN（半关闭）
TIME_WAIT: 收到了对方的FIN和ACK，等待2MSL
CLOSE_WAIT: 收到了对方FIN，发送了ACK（对方已关闭）
LAST_ACK: 发送了自己的FIN，等待对方最后的ACK
CLOSING: 双方同时关闭的特殊状态
\`\`\`

### 5. SYN Flood攻击与防御

\`\`\`
攻击原理：
攻击者大量发送TCP SYN包（不完成三次握手）
目标服务器为每个SYN分配资源（TCB - Transmission Control Block）
半连接队列（SYN Queue）迅速填满
合法用户的SYN无法被接受 → 服务拒绝

防御方案：
┌─────────────────────────────────────────────┐
│  1. SYN Cookies（推荐）                     │
│     ├── 不直接分配资源存储半连接信息          │
│     ├── 将连接信息编码到ISN（初始序列号）中    │
│     ├── 收到第三次握手的ACK时解码验证        │
│     └── Linux: net.ipv4.tcp_syncookies = 1  │
│                                             │
│  2. 增大队列                               │
│     ├── net.ipv4_tcp_max_syn_backlog = 8192 │
│     ├── net.core_somaxconn = 4096           │
│     └── net.ipv4_tcp_abort_on_overflow = 1  │
│                                             │
│  3. 缩短超时                               │
│     └── net.ipv4_tcp_synack_retries = 2     │
│                                             │
│  4. 防火墙/DDoS清洗                         │
│     └── 云厂商DDoS防护自动过滤SYN Flood     │
└─────────────────────────────────────────────┘
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "TCP", "三次握手", "四次挥手", "TIME_WAIT"]
  },

  {
    title: "HTTP/1.1 vs HTTP/2 vs HTTP/3(QUIC) 协议演进",
    content: `## 题目描述

HTTP协议从1.1到2再到3的演进解决了哪些痛点？

### 核心问题
1. **HTTP/1.1的问题**：Head-of-Line Blocking（队头阻塞）、臃肿的Header、明文传输
2. **HTTP/2的核心改进**：二进制分帧层、多路复用(HPACK)、Header压缩、服务端推送
3. **HTTP/3 QUIC的革命**：基于UDP、0-RTT连接、无队头阻塞、连接迁移
4. **QUIC vs TCP+TLS**：为什么Google要抛弃TCP发明QUIC？
5. **升级策略**：如何平滑地从HTTP/1.1迁移到HTTP/2/3？ALPN协商`,
    solution: `## 深度解析

### HTTP/1.1 的三大问题

\`\`\`
问题一：队头阻塞（Head-of-Line Blocking, HOL）
┌─────────────────────────────────────────────┐
│  浏览器对同一域名建立6个TCP连接（浏览器限制）   │
│                                               │
│  Connection 1: [req1][req2][====waiting=====]  │
│                        ↑ req2被req1阻塞！       │
│  Connection 2: [req3][req4][==waiting======]  │
│  Connection 3: [idle]                        │
│  Connection 4: [idle]                        │
│  Connection 5: [idle]                        │
│  Connection 6: [idle]                        │
│                                               │
│  即使有空闲连接，也无法帮助被阻塞的请求         │
│  因为同一个TCP连接上的请求必须串行处理           │
└─────────────────────────────────────────────┘

问题二：Header冗余
  每次请求都携带完整的Header（Cookie/User-Agent/Accept等）
  典型Header大小：1KB~2KB
  对于小体量的API响应（如JSON < 1KB），Header可能比Body还大！

问题三：建立连接开销大
  TCP三次握手(1 RTT) + TLS握手(1-2 RTT)
  每个新域名都要重新建连接
  HTTP/1.1 Keep-Alive缓解了但不能完全解决
\`\`\`

### HTTP/2 的四大改进

\`\`\`
改进一：二进制分帧层（Binary Framing Layer）
┌─────────────────────────────────────────────┐
│  HTTP/2 Frame 格式：                        │
│  ┌──────┬──────┬──────────────┬──────────┐  │
│  │Length│ Type │    Flags     │Stream ID│  │
│  │(24b) │(8b)  │    (8b)      │  (31b)   │  │
│  ├──────┴──────┴──────────────┴──────────┤  │
│  │           Payload (Frame Data)         │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  Frame Types:                                │
│  DATA(0x0) | HEADERS(0x1) | PRIORITY(0x2)    │
│  RST_STREAM(0x3) | SETTINGS(0x4) | PUSH_PROMISE│
│  PING(0x6) | GOAWAY(0x7) | WINDOW_UPDATE    │
└─────────────────────────────────────────────┘

改进二：多路复用（Multiplexing）
┌─────────────────────────────────────────────┐
│  同一个TCP连接上，多个Stream并行传输：         │
│                                               │
│  Stream 1: ║════════║                       │
│  Stream 2:   ║═════║                        │
│  Stream 3:     ║══════════║                 │
│  Stream 4:       ║═══║                      │
│                                               │
│  各Stream互不阻塞！                           │
│  但：TCP层面仍有队头阻塞（丢包影响所有Stream）  │
└─────────────────────────────────────────────┘

改进三：HPACK Header压缩
┌─────────────────────────────────────────────┐
│  三种技术结合：                               │
│                                               │
│  1. Static Dictionary（静态字典）             │
│     61个常用Header（method/path/status等）     │
│     如: {:method: GET} → 0x82 (1字节!)       │
│                                               │
│  2. Dynamic Dictionary（动态字典）            │
│     连接期间累积的Header                      │
│     后续请求可直接引用（索引号）               │
│                                               │
│  3. Huffman Coding（霍夫曼压缩）              │
│     未命中的Header经Huffman压缩后再传输        │
│                                               │
│  效果：Header体积减少85%-95%                  │
└─────────────────────────────────────────────┘

改进四：服务端推送（Server Push）
  Server可以在Client请求资源之前主动推送
  例：请求index.html → Server同时推送style.css + main.js
  PUSH_PROMISE frame告知Client即将推送的资源
  Client可以拒绝（SETTINGS_ENABLE_PUSH = 0）
\`\`\`

### HTTP/3 QUIC 的革命性改进

\`\`\`
为什么需要HTTP/3？

HTTP/2的多路复用虽然解决了应用层HOL阻塞，
但在TCP层仍然存在问题：
  → 任何丢包都会导致整个TCP连接的所有Stream停顿
  → TCP的丢失重传机制不够精细（无法区分哪个Stream丢包）

QUIC的核心设计：
┌─────────────────────────────────────────────┐
│  QUIC = UDP + 自定义可靠性 + TLS 1.3内置      │
│                                               │
│  架构层次：                                   │
│  ┌─────────────────────────────────────┐     │
│  │         HTTP/3 (Application)        │     │
│  ├─────────────────────────────────────┤     │
│  │         QUIC (Transport)            │     │
│  │  ┌─────────────────────────────┐   │     │
│  │  │ Streams (独立的可靠流)       │   │     │
│  │  ├─────────────────────────────┤   │     │
│  │  │ Connection (连接管理/迁移)   │   │     │
│  │  ├─────────────────────────────┤   │     │
│  │  │ Crypto (TLS 1.3 内置加密)    │   │     │
│  │  └─────────────────────────────┘   │     │
│  ├─────────────────────────────────────┤     │
│  │         UDP (Internet)              │     │
│  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────┘

QUIC vs TCP+TLS 对比：

| 特性 | TCP + TLS 1.3 | QUIC (HTTP/3) |
|------|--------------|---------------|
| **连接建立** | 1-2 RTT (TCP+TLS) | 0-1 RTT (如果复用) |
| **队头阻塞** | ✅ 存在（TCP层） | ❌ 消除（Stream独立） |
| **连接迁移** | ❌ 不支持（4元组绑定） | ✅ 支持（Connection ID） |
| **加密范围** | 仅Payload | Header也加密 |
| **拥塞控制** | 内置于OS | 应用层可控（BBR/Cubic） |
| **丢包恢复** | 整个连接受影响 | 仅受影响的Stream |
| **中间件友好** | ✅ NAT/防火墙兼容 | ❌ 可能被UDP封堵 |
\`\`\`

**QUIC 0-RTT连接恢复：**

\`\`\`
首次连接（1-RTT）：
  Client: Initial(Crypto handshake) →
  Server: Initial + Handshake + 1-RTT keys →
  Client: Handshake finished + [App Data]

后续连接（0-RTT）：
  Client: 0-RTT data (用之前保存的session ticket加密) + Initial
  → Server可以直接读取0-RTT数据！
  → 对于移动端App冷启动体验提升巨大

连接迁移（Connection Migration）：
  WiFi → 4G/5G 切换时：
  TCP: 必须断开重连（IP变了，4元组变了）
  QUIC: 新路径上发送PATH_CHALLENGE，对端PATH_RESPONSE
       Connection ID不变，连接无缝延续
       → 游戏/视频通话/ VoIP 场景福音
\`\`\`

### 升级策略

\`\`\`
1. ALPN (Application-Layer Protocol Negotiation)
   TLS扩展，在ClientHello中声明支持的协议
   h2, http/1.1, h3 (或 h3-29 表示具体draft版本)

2. HTTP Alternative Services (Alt-Svc)
   Server告诉Client："你可以用HTTP/3连我的另一个端口"
   Alt-Svc: h3=":443"; ma=86400

3. 渐进式部署
   - Nginx 1.25+ 原生支持HTTP/3
   - Cloudflare/AWS CDNs自动提供HTTP/3
   - 浏览器Chrome/Firefox/Safari均已支持HTTP/3

4. 降级策略
   - QUIC被防火墙封堵 → 自动降级到TCP+HTTP/2
   - DNS HTTPS记录（SVCB/HTTPS RR）引导QUIC连接
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["网络协议", "HTTP/2", "HTTP/3", "QUIC", "多路复用"]
  },

  // ==================== 设计模式 (第67-76题) ====================

  {
    title: "设计模式：单例模式的七种写法与线程安全",
    content: `## 题目描述

单例模式（Singleton Pattern）是最简单也是最常被面试的设计模式：

### 要求分析以下实现方式
1. **饿汉式**：类加载时初始化，天然线程安全但可能浪费资源
2. **懒汉式（基础版）**：延迟加载但非线程安全
3. **懒汉式（synchronized方法）**：线程安全但性能差
4. **双重检查锁定（DCL）**：经典方案，volatile关键字的作用？
5. **静态内部类**：利用ClassLoader机制保证线程安全
6. **枚举单例**：《Effective Java》推荐的最佳方案
7. **Spring中的单例**：Singleton vs Prototype Scope`,
    solution: `## 深度解析

### 七种实现方式

\`\`\`java
// ========== 方式一：饿汉式 ==========
// 类加载时就创建实例
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton() {}

    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
// ✅ 线程安全（JVM保证类加载的线程安全性）
// ❌ 浪费资源（即使不用也会创建）
// ❌ 无法传参

// ========== 方式二：懒汉式（基础版，非线程安全）==========
public class LazySingletonUnsafe {
    private static LazySingletonUnsafe instance;

    private LazySingletonUnsafe() {}

    public static LazySingletonUnsafe getInstance() {
        if (instance == null) {   // 竞态条件！两个线程同时通过
            instance = new LazySingletonUnsafe();
        }
        return instance;
    }
}
// ❌ 非线程安全！多线程下可能创建多个实例

// ========== 方式三：懒汉式（synchronized方法）==========
public class LazySingletonSync {
    private static LazySingletonSync instance;

    private LazySingletonSync() {}

    // synchronized修饰整个方法 → 性能差
    public static synchronized LazySingletonSync getInstance() {
        if (instance == null) {
            instance = new LazySingletonSync();
        }
        return instance;
    }
}
// ✅ 线程安全
// ❌ 每次调用都需要获取锁，性能开销大

// ========== 方式四：双重检查锁定（DCL，推荐）==========
public class DCLSingleton {
    // volatile 关键字至关重要！
    // 禁止指令重排序，确保instance在所有线程中可见
    private static volatile DCLSingleton instance;

    private DCLSingleton() {}

    public static DCLSingleton getInstance() {
        if (instance == null) {                    // 第一次检查（无锁）
            synchronized (DCLSingleton.class) {     // 加锁
                if (instance == null) {             // 第二次检查（有锁）
                    instance = new DCLSingleton();
                    // 这一行代码实际上分为3步：
                    // 1. memory = allocate()  分配对象内存空间
                    // 2. ctorInstance(memory) 初始化对象
                    // 3. instance = memory 设置instance指向内存地址
                    //
                    // 如果没有volatile，步骤2和3可能重排为1→3→2
                    // 导致其他线程拿到未初始化完成的instance！
                }
            }
        }
        return instance;
    }
}
// ✅ 线程安全 + 懒加载 + 高性能（只在第一次创建时加锁）
// ⚠️ 必须使用volatile！

// ========== 方式五：静态内部类（推荐）==========
public class HolderSingleton {
    private HolderSingleton() {}

    // 静态内部类只有在被引用时才会被加载（实现了懒加载）
    // JVM保证类的初始化是线程安全的
    private static class SingletonHolder {
        private static final HolderSingleton INSTANCE = new HolderSingleton();
    }

    public static HolderSingleton getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
// ✅ 线程安全 + 懒加载 + 无锁（利用ClassLoader机制）
// ✅ 写法简洁优雅

// ========== 方式六：枚举单例（《Effective Java》推荐）==========
public enum EnumSingleton {
    INSTANCE;  // 单例实例

    // 可以添加业务方法
    public void doSomething() { /* ... */ }

    // 天然支持序列化（不会被反序列化破坏单例）
    // 天然防止反射攻击（无法通过反射创建新的枚举实例）
}

// 使用：EnumSingleton.INSTANCE.doSomething();
// ✅ 最佳方案：简洁、线程安全、防反射、防序列化破坏
// ❌ 不支持懒加载（类加载时创建）、不能继承其他类

// ========== 方式七：Spring中的单例 ==========
@Component  // 默认就是singleton scope
// 或 @Scope("singleton")
public class SpringBean {
    // Spring容器管理的单例：
    // - 默认Scope = singleton（整个容器只有一个实例）
    // - 可改为prototype（每次getBean都创建新实例）
    // - singleton不是真正的单例（每个容器一个，多容器则多个）
    // - 循环依赖问题（三级缓存解决）
}
\`\`\`

**对比总结：**

| 方式 | 线程安全 | 懒加载 | 性能 | 防反射 | 推荐度 |
|------|---------|--------|------|-------|-------|
| 饿汉式 | ✅ | ❌ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐ |
| 懒汉基础版 | ❌ | ✅ | ⭐⭐⭐⭐⭐ | ❌ | ❌ |
| 懒汉+synchronized | ✅ | ✅ | ⭐⭐ | ❌ | ⭐⭐ |
| **DCL** | **✅** | **✅** | **⭐⭐⭐⭐** | **❌** | **⭐⭐⭐⭐** |
| **静态内部类** | **✅** | **✅** | **⭐⭐⭐⭐⭐** | **❌** | **⭐⭐⭐⭐⭐** |
| **枚举** | **✅** | **❌** | **⭐⭐⭐⭐⭐** | **✅** | **⭐⭐⭐⭐⭐** |

**生产选择建议：**
- 一般情况：**静态内部类**或**枚举**
- 需要传参/延迟初始化：**DCL**
- Spring环境：直接用 \`@Component\`（默认singleton）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "单例模式", "线程安全", "volatile", "DCL"]
  },

  {
    title: "设计模式：工厂模式与策略模式的实战应用",
    content: `## 题目描述

工厂模式和策略模式是最常用的两种设计模式：

### 工厂模式
1. **简单工厂**：一个工厂类根据参数决定创建哪种产品
2. **工厂方法**：定义创建对象的接口，让子类决定实例化哪个类
3. **抽象工厂**：创建一系列相关或相互依赖的对象的接口
4. **Spring中的工厂**：BeanFactory vs FactoryBean

### 策略模式
5. **核心思想**：定义算法族，分别封装，使它们可以互相替换
6. **与工厂模式的区别**：何时用工厂？何时用策略？
7. **实战案例**：支付方式选择、折扣策略、排序算法选择`,
    codeTemplate: {
      javascript: `/**
 * 工厂模式 + 策略模式 组合实战
 * 场景：电商平台的多种支付方式
 */

// ==================== 策略接口 ====================
class PaymentStrategy {
  pay(amount) { throw new Error('子类必须实现'); }
  refund(orderId, amount) { throw new Error('子类必须实现'); }
}

// ==================== 具体策略 ====================
class AlipayStrategy extends PaymentStrategy {
  pay(amount) {
    console.log(\`支付宝支付 \${amount} 元\`);
    return { success: true, tradeNo: 'ALI_' + Date.now() };
  }
  refund(orderId, amount) {
    console.log(\`支付宝退款 \${amount} 元, 订单=\${orderId}\`);
    return true;
  }
}

class WechatPayStrategy extends PaymentStrategy {
  pay(amount) {
    console.log(\`微信支付 \${amount} 元\`);
    return { success: true, tradeNo: 'WX_' + Date.now() };
  }
}

class CreditCardStrategy extends PaymentStrategy {
  constructor(cardNumber, cvv, expiryDate) {
    super();
    this.cardNumber = cardNumber;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
  }
  pay(amount) {
    console.log(\`信用卡(\${this.cardNumber})支付 \${amount} 元\`);
    return { success: true, tradeNo: 'CC_' + Date.now() };
  }
}

// ==================== 工厂类 ====================
class PaymentFactory {
  // 注册表（策略名称 → 策略类/构造函数）
  static registry = {};

  // 注册策略
  static register(type, StrategyClass) {
    PaymentFactory.registry[type] = StrategyClass;
  }

  // 创建策略（工厂方法）
  static create(type, ...args) {
    const StrategyClass = PaymentFactory.registry[type];
    if (!StrategyClass) {
      throw new Error(\`不支持的支付类型: \${type}\`);
    }
    return new StrategyClass(...args);
  }
}

// ==================== 注册 & 使用 ====================
PaymentFactory.register('alipay', AlipayStrategy);
PaymentFactory.register('wechat', WechatPayStrategy);
PaymentFactory.register('credit_card', CreditCardStrategy);

// 客户端代码
function checkout(paymentType, amount, options = {}) {
  // 通过工厂创建对应的策略
  const strategy = PaymentFactory.create(paymentType, options);

  // 执行策略
  const result = strategy.pay(amount);

  return result;
}

// 使用示例
checkout('alipay', 99.9);           // 支付宝
checkout('wechat', 199.0);         // 微信
checkout('credit_card', 2999, {     // 信用卡
  cardNumber: '6222****1234',
  cvv: '123',
  expiryDate: '12/26'
});`,
      python: `"""
工厂模式 + 策略模式 - Python实现
"""
from abc import ABC, abstractmethod
from typing import Dict, Type, Any

# ==================== 策略接口 ====================
class DiscountStrategy(ABC):
    """折扣策略抽象基类"""

    @abstractmethod
    def calculate(self, original_price: float) -> float:
        pass


# ==================== 具体策略 ====================
class NoDiscount(DiscountStrategy):
    def calculate(self, original_price: float) -> float:
        return original_price


class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: int):
        self.percentage = percentage

    def calculate(self, original_price: float) -> float:
        return original_price * self.percentage / 100


class FixedAmountDiscount(DiscountStrategy):
    def __init__(self, amount: float):
        self.amount = amount

    def calculate(self, original_price: float) -> float:
        return max(0, original_price - self.amount)


class BuyXGetYFree(DiscountStrategy):
    def __init__(self, buy_count: int, free_count: int):
        self.buy_count = buy_count
        self.free_count = free_count

    def calculate(self, original_price: float, quantity: int) -> float:
        # TODO: 实现"买X送Y"逻辑
        pass


# ==================== 工厂类 ====================
class DiscountFactory:
    _registry: Dict[str, Type[DiscountStrategy]] = {}

    @classmethod
    def register(cls, name: str, strategy_class: Type[DiscountStrategy]):
        cls._registry[name] = strategy_class

    @classmethod
    def create(cls, name: str, **kwargs) -> DiscountStrategy:
        strategy_class = cls._registry.get(name)
        if not strategy_class:
            raise ValueError(f"不支持的折扣策略: {name}")
        return strategy_class(**kwargs)


# 注册策略
DiscountFactory.register('none', NoDiscount)
DiscountFactory.register('percentage', PercentageDiscount)
DiscountFactory.register('fixed', FixedAmountDiscount)

# 使用
factory = DiscountFactory()
strategy = factory.create('percentage', percentage=80)  # 打8折
final_price = strategy.calculate(100.0)  # 80.0`,
      java: `import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 工厂模式 + 策略模式 - Java实现
 * 场景：多种日志输出策略
 */

// ==================== 策略接口 ====================
public interface LogStrategy {
    void log(String level, String message, Object... args);
}

// ==================== 具体策略 ====================
public class ConsoleLogStrategy implements LogStrategy {
    @Override
    public void log(String level, String message, Object... args) {
        String formatted = String.format(message, args);
        System.out.printf("[%s] [Console] %s%n", level, formatted);
    }
}

public class FileLogStrategy implements LogStrategy {
    private final String filePath;
    public FileLogStrategy(String filePath) { this.filePath = filePath; }

    @Override
    public void log(String level, String message, Object... args) {
        String formatted = String.format("[%s] %s%n", level,
            String.format(message, args));
        // 写入文件...
        System.out.println("[File:" + filePath + "] " + formatted.trim());
    }
}

public class ElasticSearchLogStrategy implements LogStrategy {
    private final String indexName;
    public ElasticSearchLogStrategy(String indexName) { this.indexName = indexName; }

    @Override
    public void log(String level, String message, Object... args) {
        // 发送到ES集群
        System.out.println("[ES:" + indexName + "] " + level + ": " + message);
    }
}

// ==================== 工厂类 ====================
public class LogFactory {

    private static final Map<String, Class<? extends LogStrategy>> registry =
        new ConcurrentHashMap<>();

    private static final Map<String, Supplier<LogStrategy>> suppliers =
        new ConcurrentHashMap<>();

    public static void register(String type, Class<? extends LogStrategy> clazz) {
        registry.put(type, clazz);
    }

    public static void registerSupplier(String type, Supplier<LogStrategy> supplier) {
        suppliers.put(type, supplier);
    }

    public static LogStrategy create(String type, Object... params) throws Exception {
        // 优先从supplier创建（支持带参数的策略）
        Supplier<LogStrategy> supplier = suppliers.get(type);
        if (supplier != null) {
            return supplier.get();
        }

        // 反射创建
        Class<? extends LogStrategy> clazz = registry.get(type);
        if (clazz == null) {
            throw new IllegalArgumentException("Unknown log type: " + type);
        }

        // 根据参数数量选择构造函数
        if (params.length > 0) {
            Class<?>[] paramTypes = new Class<?>[params.length];
            for (int i = 0; i < params.length; i++) {
                paramTypes[i] = params[i].getClass();
            }
            return clazz.getConstructor(paramTypes).newInstance(params);
        } else {
            return clazz.getDeclaredConstructor().newInstance();
        }
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["设计模式", "工厂模式", "策略模式", "开闭原则", "解耦"]
  },

  {
    title: "设计模式：观察者模式与发布订阅模式对比",
    content: `## 题目描述

观察者模式（Observer）和发布订阅模式（Pub/Sub）容易混淆：

### 核心问题
1. **观察者模式**：Subject（主题）→ Observer（观察者）的直接依赖关系？松耦合还是紧耦合？
2. **发布订阅模式**：Publisher → Event Channel/Broker → Subscriber 的间接关系？
3. **两者本质区别**：同步vs异步、耦合程度、消息过滤能力、广播vs点对点
4. **应用场景**：
   - 观察者：Vue响应式、Java EventListener、DOM事件
   - 发布订阅：Kafka/RabbitMQ消息队列、Redis Pub/Sub
5. **手写实现**：一个简易的事件总线（EventBus）`,
    solution: `## 深度解析

### 架构对比图

\`\`\`
┌───────────────────────────────────────────────────────┐
│              观察者模式（Observer Pattern）              │
│                                                       │
│    Subject（主题）                                     │
│    ┌──────────────────┐                               │
│    │ - observers[]     │ ──直接通知──→ ObserverA       │
│    │ + attach(obs)     │               ObserverB       │
│    │ + detach(obs)     │               ObserverC       │
│    │ + notify()        │                                │
│    └──────────────────┘                                │
│                                                       │
│    特点：                                            │
│    ├── Subject知道Observer的存在（持有引用）           │
│    ├── 同步通知（notify时Observer立即执行）            │
│    ├── 一对多关系                                    │
│    └── 紧耦合（Subject依赖Observer接口）              │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│           发布订阅模式（Publish-Subscribe）             │
│                                                       │
│    Publisher          Broker/EventBus          Subscribers
│    (发布者)           (中间代理)              (订阅者)   │
│       │                   │                        │   │
│       │── publish(event)──→│                        │   │
│       │                   │── push/filter/route ──→│ A │
│       │                   │                       ──→│ B │
│       │                   │                       ──→│ C │
│       │                   │                           │
│       │                   │← subscribe(topic) ───────│   │
│                                                       │
│    特点：                                            │
│    ├── Publisher不知道Subscriber的存在                 │
│    ├── 异步通信（通过Broker缓冲）                     │
│    ├── 支持消息路由/过滤/持久化                      │
│    └── 松耦合（仅依赖Broker/Topic约定）              │
└───────────────────────────────────────────────────────┘
\`\`\`

### 详细对比

| 维度 | 观察者模式 | 发布订阅模式 |
|------|-----------|-------------|
| **耦合方式** | Subject ↔ Observer 直接依赖 | Publisher ↔ Subscriber 通过Broker间接通信 |
| **通信模型** | 同步（阻塞） | 通常异步（非阻塞） |
| **消息路由** | Subject主动推给所有Observer | Broker按Topic/Tag路由给特定Subscriber |
| **消息过滤** | Observer自行判断是否处理 | Broker层面支持过滤（如Kafka的消费者组） |
| **消息存储** | 无（即发即丢） | Broker可持久化（支持离线消费） |
| **扩展性** | 新增Observer需修改Subject | 新增Subscriber只需向Broker注册 |
| **典型实现** | java.util.Observable、Vue reactive | Kafka、RabbitMQ、Redis Pub/Sub |
| **适用范围** | 进程内（同一JVM/进程） | 跨进程/跨机器（分布式系统） |

### 手写EventBus（简化版）

\`\`\`java
import java.util.*;
import java.util.concurrent.*;
import java.lang.reflect.*;

/**
 * 简易事件总线（结合了观察者+发布订阅的特点）
 */
public class EventBus {

    // Topic → 订阅者列表（包含优先级排序）
    private final Map<Class<?>, List<Subscription>> subscriptions = new ConcurrentHashMap<>();

    // 线程池用于异步分发
    private final Executor executor;

    public EventBus(Executor executor) {
        this.executor = executor;
    }

    public EventBus() {
        this(Executors.newCachedThreadPool());
    }

    /**
     * 注册订阅者（扫描@Subscribe注解的方法）
     */
    public void register(Object subscriber) {
        Class<?> clazz = subscriber.getClass();
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Subscribe.class)) {
                Class<?> eventType = method.getParameterTypes()[0];
                int priority = method.getAnnotation(Subscribe.class).priority();

                Subscription sub = new Subscription(subscriber, method, priority);
                subscriptions.computeIfAbsent(eventType, k ->
                    CopyOnWriteArrayList::new).add(sub);

                // 按优先级排序（数值越大越先执行）
                subscriptions.get(eventType).sort((a, b) ->
                    Integer.compare(b.priority, a.priority));
            }
        }
    }

    /**
     * 发布事件（异步分发）
     */
    public void post(Object event) {
        List<Subscription> subs = subscriptions.get(event.getClass());
        if (subs == null || subs.isEmpty()) return;

        for (Subscription sub : subs) {
            // 异步执行每个订阅者的回调
            executor.execute(() -> {
                try {
                    sub.method.setAccessible(true);
                    sub.method.invoke(sub.subscriber, event);
                } catch (Exception e) {
                    e.printStackTrace();  // 生产环境应有异常处理策略
                }
            });
        }
    }

    // 取消注册
    public void unregister(Object subscriber) {
        // 移除该subscriber的所有订阅
        subscriptions.values().forEach(list ->
            list.removeIf(sub -> sub.subscriber == subscriber));
    }

    // 订阅信息封装
    private static class Subscription {
        final Object subscriber;
        final Method method;
        final int priority;

        Subscription(Object subscriber, Method method, int priority) {
            this.subscriber = subscriber;
            this.method = method;
            this.priority = priority;
        }
    }

    // 注解定义
    @java.lang.annotation.Retention(RetentionPolicy.RUNTIME)
    @java.lang.annotation.Target(ElementType.METHOD)
    public @interface Subscribe {
        int priority() default 0;  // 优先级，越大越先执行
    }
}

// ==================== 使用示例 ====================

// 定义事件
class OrderCreatedEvent {
    String orderId;
    BigDecimal amount;
    // ...
}

// 订阅者
class EmailService {
    @Subscribe(priority = 10)  // 高优先级
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("发送邮件确认: " + event.orderId);
    }
}

class InventoryService {
    @Subscribe(priority = 5)
    public void onOrderCreated(OrderCreatedEvent event) {
        System.out.println("扣减库存");
    }
}

// 发布事件
EventBus bus = new EventBus();
bus.register(new EmailService());
bus.register(new InventoryService());

bus.post(new OrderCreatedEvent("ORD-001", new BigDecimal("99.9")));
// 输出:
// 发送邮件确认: ORD-001  （priority=10先执行）
// 扣减库存              （priority=5后执行）
\`\`\`

**生产级EventBus需要考虑的问题：**

- [ ] 异常隔离（一个订阅者异常不影响其他）
- [ ] 死循环检测（A发布事件B处理后又发布A监听的事件）
- [ ] 类型安全（泛型约束）
- [ ] 性能优化（高频事件的特殊处理）
- [ ] 监控指标（分发延迟、消费耗时、积压量）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "观察者模式", "发布订阅", "EventBus", "解耦"]
  },

  {
    title: "设计模式：装饰器模式与代理模式的深度辨析",
    content: `## 题目描述

装饰器模式（Decorator）和代理模式（Proxy）结构相似但意图不同：

### 核心问题
1. **装饰器模式**：动态地给对象添加额外职责？IO流体系中的应用？
2. **代理模式**：控制对对象的访问？静态代理 vs 动态代理（JDK/CGLIB）？
3. **结构对比**：两者都使用了组合/聚合而非继承，有什么本质不同？
4. **Spring AOP**：基于动态代理的实现原理？JoinPoint/Advice/Pointcut？
5. **实际应用**：MyBatis Mapper接口如何生成实现类？RPC框架的Stub层？`,
    solution: `## 深度解析

### 结构对比

\`\`\`
┌─────────────────────────────────────────────────────┐
│              装饰器模式（Decorator）                  │
│                                                      │
│   目的：动态添加职责（增强功能），可叠加多层           │
│                                                      │
│   Component (接口)                                   │
│     ↑                                               │
│   ConcreteComponent (原始对象)                       │
│     ↑                                               │
│   Decorator (抽象装饰器，也实现Component接口)          │
│     ↑         ↑                                     │
│   DecoratorA  DecoratorB  (具体装饰器)                │
│                                                      │
│   使用方式：                                         │
│   Component c = new ConcreteComponent();             │
│   c = new DecoratorA(c);  // 包装第一层              │
│   c = new DecoratorB(c);  // 包装第二层              │
│   c.operation();  // 依次执行 B → A → Original      │
│                                                      │
│   经典案例：Java IO流                                │
│   InputStream is =                                  │
│     new BufferedInputStream(                         │
│       new FileInputStream("test.txt"));               │
│   // BufferedInputStream 装饰了 FileInputStream       │
│   // 添加了缓冲功能                                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│              代理模式（Proxy）                        │
│                                                      │
│   目的：控制访问（权限校验/懒加载/日志/远程代理）      │
│                                                      │
│   Subject (接口)                                     │
│     ↑           ↑                                   │
│   RealSubject  Proxy (代理对象，持有RealSubject引用)    │
│                                                      │
│   使用方式：                                         │
│   Subject proxy = new Proxy(new RealSubject());       │
│   proxy.request();  // 代理控制是否/如何调用RealSubject│
│                                                      │
│   经典案例：                                          │
│   - MyBatis: UserMapper mapper = session.getMapper(  │
│       UserMapper.class);  // 返回代理对象             │
│   - Spring: @Transactional 事务代理                   │
│   - RPC: 远程服务接口的本地Stub代理                    │
│                                                      │
└─────────────────────────────────────────────────────┘
\`\`\`

### 本质区别

| 维度 | 装饰器模式 | 代理模式 |
|------|-----------|---------|
| **目的** | 增强/添加新功能 | 控制访问/隐藏真实对象 |
| **关注点** | 功能增强（透明地添加行为） | 访问控制（限制/转发/记录） |
| **客户端感知** | 知道被装饰了（显式包装） | 不知道是代理（以为操作的是真实对象） |
| **可叠加性** | 强（可无限嵌套） | 一般不叠加（一层即可） |
| **生命周期** | 与原对象一起创建 | 可延迟创建真实对象（虚拟代理） |
| **典型场景** | IO流、UI组件样式、权限链 | 远程代理、保护代理、虚拟代理、智能引用 |

### JDK动态代理源码级分析

\`\`\`java
// JDK动态代理的核心API
Object proxyInstance = Proxy.newProxyInstance(
    target.getClass().getClassLoader(),  // 类加载器
    target.getClass().getInterfaces(),   // 目标对象实现的接口数组
    new InvocationHandler() {            // 调用处理器
        @Override
        public Object invoke(Object proxy, Method method, Object[] args)
                throws Throwable {

            // 前置增强（日志/权限/事务开启等）
            long start = System.currentTimeMillis();
            log.info("Before: {}.{})", method.getName(), Arrays.toString(args));

            // 调用目标方法
            Object result = method.invoke(target, args);

            // 后置增强（提交事务/返回值处理等）
            long cost = System.currentTimeMillis() - start;
            log.info("After: {} cost={}ms", method.getName(), cost);

            return result;
        }
    }
);

// 底层原理：
// 1. Proxy.newProxyInstance 在运行时动态生成一个代理类
//    该类实现了你传入的所有接口
// 2. 生成的代理类大致长这样（伪代码）：
//
// public final class $Proxy0 extends Proxy implements YourInterface {
//     public Object yourMethod(Object[] args) {
//         return this.h.invoke(
//             this,                    // proxy对象本身
//             YourInterface.class.getMethod("yourMethod"),  // 方法对象
//             args                     // 参数
//         );
//     }
// }
//
// 3. 所有方法调用都被转发到InvocationHandler.invoke()
// 4. 你可以在invoke()中做任何事（这就是AOP的本质）

// CGLIB代理（针对无接口的情况）：
// 通过字节码生成技术创建目标类的子类
// 重写所有非final方法，在其中插入拦截逻辑
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(TargetClass.class);
enhancer.setCallback((MethodInterceptor) (obj, method, args, proxy) -> {
    System.out.println("CGLIB Before: " + method.getName());
    Object result = proxy.invokeSuper(obj, args);
    System.out.println("CGLIB After: " + method.getName());
    return result;
});
TargetClass proxy = (TargetClass) enhancer.create();
\`\`\`

### Spring AOP与代理的关系

\`\`\`
Spring AOP = 动态代理 + 统一的编程模型（Pointcut + Advice）

核心概念：
├── Joinpoint（连接点）：程序执行的某个具体点（如方法调用）
├── Pointcut（切点）：匹配Joinpoint的表达式（哪些方法需要增强）
├── Advice（通知）：在Joinpoint处执行的动作
│   ├── Before（前置）：方法执行前
│   ├── AfterReturning（后置正常返回后）
│   ├── AfterThrowing（抛出异常后）
│   ├── After（最终，finally块）
│   └── Around（环绕，最强大，可控制是否调用原方法）
├── Aspect（切面）：Pointcut + Advice 的组合
└── Weaving（织入）：将Aspect应用到Target的过程

代理选择策略：
- 目标对象实现了接口 → JDK动态代理
- 目标对象没实现接口 → CGLIB代理
- Spring Boot 2.x默认强制使用CGLIB（spring.aop.proxy-target-class=true）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["设计模式", "装饰器模式", "代理模式", "AOP", "动态代理"]
  },

  // ==================== 性能优化 (第77-82题) ====================

  {
    title: "JVM性能调优：GC算法选择与参数调优",
    content: `## 题目描述

JVM GC（垃圾回收）调优是后端工程师必备技能：

### 核心问题
1. **GC算法分类**：Serial/Parallel/CMS/G1/ZGC/Shenandoah 各自的特点与适用场景
2. **GC Roots有哪些**：可作为根节点的对象类型
3. **对象分配与晋升**：TLAB、Eden区分配、Survivor复制、老年代晋升阈值
4. **常见OOM原因及排查**：堆溢出/MetaSpace溢出/GC overhead limit exceeded
5. **生产调优流程**：从监控到定位到优化的完整方法论`,
    solution: `## 深度解析

### GC算法全景对比

| 收集器 | 算法 | 线程数 | 停顿时间(STW) | 适用场景 | JDK版本 |
|--------|------|--------|--------------|---------|---------|
| **Serial** | 标记-复制(Young)/标记-整理(Old) | 单线程 | 较长（~100ms+） | 单核/客户端/小内存(<100MB) | 全版本 |
| **Parallel/PS** | 标记-复制/标记-整理 | 多线程 | 中等 | 吞吐量优先（批处理/后台任务） | 默认JDK8 |
| **CMS** | 标记-清除 | 多线程并发 | 最短（低延迟） | 低延迟要求（Web应用） | JDK8(已废弃) |
| **G1** | Region分区+增量回收 | 并发+并行 | 可预测（<200ms目标） | 大堆(4GB+)、均衡吞吐与延迟 | JDK9+默认 |
| **ZGC** | Colored Pointer + Load Barrier | 并发 | <1ms（亚毫秒级） | 超大堆(TB级)、极低延迟要求 | JDK15+(生产就绪) |
| **Shenandoah** | Brooks Pointer + 并发压缩 | 并发 | <10ms | 类似ZGC，替代G1 | JDK12+ |

### GC Roots完整列表

\`\`\`
GC Roots（垃圾收集的起点，从这些节点开始遍历可达性分析）：

1. 虚拟机栈（栈帧中的局部变量表）中引用的对象
2. 本地方法栈（JNI）中引用的对象
3. 方法区中类静态属性引用的对象
4. 方法区中常量引用的对象（如String常量池）
5. Synchronized锁持有的对象
6. JVM内部引用（Class对象、Exception对象、ClassLoader）
7. GC临时添加的引用（如Old->New的跨代引用）

注意：不是所有的GC Root都会被用作Root，
不同的GC算法可能会选择其中一部分作为起始点。
\`\`\`

### 对象生命周期

\`\`\`
对象分配过程：
Thread → TLAB(Thread Local Allocation Buffer)
  → 在Eden区分配（大多数对象在这里消亡）
  → Minor GC时存活 → 复制到 Survivor From/To 区
  → 经过多次Minor GC仍存活（达到年龄阈值）→ 晋升到 Old Gen
  → Major GC / Full GC 时清理 Old Gen

关键参数：
├── -XX:NewRatio=2        Young:Old = 1:2（默认）
├── -XX:SurvivorRatio=8   Eden:S0:S1 = 8:1:1
├── -XX:MaxTenuringThreshold=15  晋升老年代的年龄阈值
├── -XX:+UseTLAB          启用TLAB（默认开启）
├── -XX:TLABSize=         TLAB大小（默认为Eden的1%）
├── -XX:+AlwaysTenureAllocationFailure  大对象直接进Old
└── -XX:PretenureSizeThreshold=3MB   大对象阈值

G1特有的概念：
├── Region（统一大小，通常1-32MB）
├── RSet（Remembered Set，记录跨Region引用）
├── CSet（Collection Set，本次要回收的Region集合）
├── SATB(Snapshot-At-The-Beginning) 并发标记的写屏障
└── Mixed GC（同时回收Young + 部分Old Region）
\`\`\`

### 生产调优标准流程

\`\`\`
Step 1: 明确优化目标
├── 不是"调优"，而是"满足SLA"
├── 目标类型：
│   ├── 低延迟：P99 RT < 200ms（Web API）
│   ├── 高吞吐：TPS > 5000（批处理/计算密集）
│   └── 低内存：< 4GB heap（资源受限）
└── 设定基准线：当前P99/P95/P50是多少？

Step 2: 监控与数据采集
├── GC日志开启：
│   -XX:+PrintGCDetails -XX:+PrintGCDateStamps
│   -Xlog:gc*:file=/var/log/gc.log:time,tags (JDK9+)
│   -XX:+HeapDumpOnOutOfMemoryError
│   -XX:HeapDumpPath=/tmp/
├── 监控工具：
│   ├── Prometheus + Grafana（JVM Exporter）
│   ├── Arthas（阿里在线诊断神器）
│   ├── VisualVM / JConsole（JDK自带）
│   └── GCViewer / GCEasy（日志可视化分析）
└── 关键指标：
    ├── Young GC频率和耗时
    ├── Full GC频率和耗时（Full GC = STW灾难！）
    ├── Heap使用率趋势
    └── 对象分配速率（Allocation Rate）

Step 3: 问题定位
├── OOM → 分析heap dump（MAT/Eclipse Memory Analyzer）
│   ├── Dominator Tree（占用最大的对象）
│   ├── Leak Suspects（疑似泄漏报告）
│   └── Histogram（类实例统计）
├── GC频繁 → 分析GC日志
│   ├── Young GC太频 → 增大Young区或降低对象分配率
│   ├── Full GC太频 → 有内存泄漏或Old区太小
│   └── GC时间太长 → 减少Heap size或换更高效的GC
└── CPU高 → 结合thread dump分析
    ├── 是否有大量线程阻塞在GC上？
    ├── 是否有线程死锁？
    └── 是否有热点方法？

Step 4: 调优方案制定
├── 选型决策树：
│   │
│   Heap < 4GB?
│   ├── 是 → Parallel Scavenge（吞吐量）或 G1（均衡）
│   └── 否（Heap >= 4GB）
│       │
│       延迟敏感？（P99 < 200ms?）
│       ├── 是 → G1（-XX:MaxGCPauseMillis=200）
│       │   还不够？（P99 < 10ms?）
│       │   └── ZGC (-XX:+UseZGC)
│       └── 否 → Parallel（追求最大吞吐量）
│
├── 常用参数模板：
│   # G1推荐配置（4-16GB Heap）
│   -XX:+UseG1GC
│   -XX:MaxGCPauseMillis=200      # 目标停顿200ms
│   -XX:G1HeapRegionSize=16m      # Region大小
│   -XX:InitiatingHeapOccupancyPercent=40  # 并发标记触发阈值
│   -XX:G1ReservePercent=15        # 预留空间防止to-space exhausted
│   -XX:ConcGCThreads=2            # 并发GC线程数
│
└── 调优验证：
    ├── 对比调优前后的各项指标
    ├── 至少观察24小时（覆盖业务周期）
    ├── 压测验证（模拟峰值流量）
    └── 灰度上线（逐步放量）
\`\`\`

**常见OOM场景速查：**

\`\`\`
java.lang.OutOfMemoryError: Java heap space
  → 堆内存不足 → 增大-Xmx 或 内存泄漏

java.lang.OutOfMemoryError: Metaspace / PermGen space
  → 类元数据空间不足 → 增大-XX:MaxMetaspaceSize
  → 或类加载泄漏（如OSGi/Tomcat热部署）

java.lang.OutOfMemoryError: GC overhead limit exceeded
  → 98%的时间在做GC，但回收不到2%的内存
  → 可能是内存泄漏或Heap太小

java.lang.OutOfMemoryError: Direct buffer memory
  → 堆外内存不足 → -XX:MaxDirectMemorySize

java.lang.OutOfMemoryError: unable to create native thread
  → 线程数过多 → 减少-Xss或减少线程创建
  → 检查ulimit -u（用户最大进程数限制）

java.lang.StackOverflowError
  → 栈深度过大（递归过深） → 增大-Xss 或修复递归
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["性能优化", "JVM", "GC调优", "G1", "ZGC"]
  },

  {
    title: "MySQL慢查询定位与SQL优化实战",
    content: `## 题目描述

SQL优化是后端开发中最常见的性能优化工作：

### 核心问题
1. **慢查询发现**：如何开启慢查询日志？如何分析slow log？
2. **执行计划解读**：EXPLAIN各列的含义？type字段从好到差的顺序？
3. **索引优化**：什么情况下索引会失效？如何判断应该加什么索引？
4. **SQL改写技巧**：子查询改JOIN、LIMIT优化、COUNT优化、ORDER BY优化
5. **表结构优化**：数据类型选择、范式与反范式、垂直拆分/水平拆分`,
    solution: `## 深度解析

### 1. 慢查询发现与分析

\`\`\`sql
-- 开启慢查询（运行时设置，无需重启）
SET GLOBAL slow_query_log = ON;
SET GLOBAL slow_query_log_file = '/var/lib/mysql/slow.log';
SET GLOBAL long_query_time = 2.0;        -- 慢查询阈值（秒）
SET GLOBAL log_queries_not_using_indexes = ON;  -- 记录未使用索引的查询

-- 分析慢查询工具
-- mysqldumpslow（MySQL自带）
mysqldumpslow -s t -t 10 slow.log   -- 按耗时排序，取前10条
mysqldumpslow -s c -t 20 slow.log   -- 按出现次数排序

-- pt-query-digest（Percona Toolkit，推荐！）
pt-query-digest slow.log > report.txt
# 输出：响应时间分布、最慢的SQL、锁等待情况等
\`\`\`

### 2. EXPLAIN详解

\`\`\`sql
EXPLAIN SELECT o.id, u.name, o.amount
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.status = 1 AND o.create_time > '2024-01-01'
ORDER BY o.create_time DESC
LIMIT 100;

+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+
| id | select_type | table | partitions | type | possible_keys | key      | key_len | ref  | rows | filtered | Extra                 |
+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+
|  1 | SIMPLE      | o     | NULL       | range| idx_status_time| idx_...  | 9       | NULL | 5000 |   100.00 | Using filesort        |
|  1 | SIMPLE      | u     | NULL       | eq_ref| PRIMARY       | PRIMARY  | 4       | o.id |    1 |   100.00 | NULL                  |
+----+-------------+-------+------------+------+---------------+----------+---------+------+------+----------+-----------------------+

逐列解读：

id: 执行顺序标识（相同id从上到下，不同id数字大的先执行）
select_type: 查询类型
  ├── SIMPLE: 简单查询（无子查询/UNION）
  ├── PRIMARY: 最外层查询（有子查询时）
  ├── SUBQUERY: 子查询（不在FROM子句中）
  ├── DERIVED: FROM子句的子查询（派生表）
  └── UNION: UNION中的第二个及后续查询

table: 正在访问的表名（<derivedN> 表示派生表）

partitions: 匹配的分区信息

type（最重要的一列！表示访问类型，从优到差）：
  system > const > eq_ref > ref > range > index > ALL
  ├── system: 表只有一行（系统表）
  ├── const: 通过索引一次找到（PRIMARY KEY或UNIQUE KEY）
  ├── eq_ref: JOIN时使用PRIMARY KEY或UNIQUE KEY（每行只匹配一行）
  ├── ref: 使用非唯一索引（可能返回多行）
  ├── range: 索引范围扫描(>, <, BETWEEN, IN)
  ├── index: 索引全扫描（遍历整棵索引树）
  └── ALL: 全表扫描（必须优化！）

possible_keys: 可能使用的索引
key: 实际使用的索引（NULL = 未使用索引！）
key_len: 使用的索引长度（越短越好，但需保证唯一性）
rows: 预估扫描的行数（越小越好）
filtered: 符合条件的行百分比（100%最好）
Extra: 额外信息
  ├── Using index: 覆盖索引（最优，无需回表）
  ├── Using where: 使用WHERE过滤
  ├── Using index condition: ICP索引下推
  ├── Using filesort: 文件排序（需优化ORDER BY）
  ├── Using temporary: 使用临时表（需优化GROUP BY）
  ├── Using join buffer: JOIN无法使用索引
  └── Backward index scan: 逆序索引扫描（ORDER BY DESC）
\`\`\`

### 3. SQL优化实战案例

\`\`\`sql
-- 案例1：深分页优化（OFFSET越大越慢）
-- ❌ 慢查询
SELECT * FROM orders ORDER BY id LIMIT 1000000, 10;
-- 扫描1000010行，丢弃前1000000行

-- ✅ 优化方案一：延迟关联（推荐）
SELECT * FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY id LIMIT 1000000, 10
) AS t ON o.id = t.id;
-- 子查询只扫描id（覆盖索引），速度提升10倍+

-- ✅ 优化方案二：游标/书签记录
SELECT * FROM orders WHERE id > last_seen_id ORDER BY id LIMIT 10;
-- 记录上一页最后一条的id，下一页从此id开始

-- 案例2：COUNT优化
-- ❌ COUNT(*) 在InnoDB中很慢（全表扫描）
SELECT COUNT(*) FROM orders WHERE status = 1;
-- 1000万行数据可能需要2-3秒

-- ✅ 优化方案：维护计数器表/Redis缓存
CREATE TABLE order_stats (
    status INT PRIMARY KEY,
    cnt INT NOT NULL DEFAULT 0
);
-- 业务变更时同步更新（MQ异步更新更好）
INSERT INTO order_stats VALUES (1, 1)
ON DUPLICATE KEY UPDATE cnt = cnt + 1;

-- 案例3：IN子查询优化
-- ❌ MySQL 5.6之前IN子查询可能效率低下
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 1000);

-- ✅ 改为JOIN
SELECT DISTINCT u.* FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.amount > 1000;

-- 案例4：OR条件优化
-- ❌ OR导致索引失效（不同列上的OR）
SELECT * FROM users WHERE name = '张三' OR email = 'zhang@test.com';

-- ✅ 改为UNION ALL
(SELECT * FROM users WHERE name = '张三')
UNION ALL
(SELECT * FROM users WHERE email = 'zhang@test.com');

-- 案例5：LIKE前缀通配符优化
-- ❌ LIKE '%keyword' 无法使用索引
SELECT * FROM products WHERE name '%手机';

-- ✅ 方案一：ES全文检索
-- ✅ 方案二：反转存储（特定场景）
-- 存储时反转字符串：'机手' → '机手'
-- 查询时：LIKE '机手%'
-- ✅ 方案三：N-gram分词索引（MySQL 5.7+）
ALTER TABLE products ADD FULLTEXT INDEX ft_name(name) WITH PARSER ngram;
SELECT * FROM products WHERE MATCH(name) AGAINST('手机' IN BOOLEAN MODE);
\`\`\`

### 4. 索引设计最佳实践

\`\`\`
索引设计Checklist：
□ 遵循最左前缀原则（联合索引的第一个字段最重要）
□ 选择性高的列放前面（不同值/总行数 > 80%）
□ 覆盖常用查询（避免回表：SELECT的字段都在索引中）
□ 控制索引数量（单表不超过5个，影响写入性能）
□ 字符串索引使用前缀索引（避免过长）：INDEX idx_email(email(20))
□ 避免在索引列上做运算（函数/计算/类型转换）
□ 避免隐式转换（varchar列不要传数字比较）
□ 定期ANALYZE TABLE更新统计信息
□ 使用FORCE INDEX谨慎提示（仅调试时使用）
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["性能优化", "MySQL", "SQL优化", "EXPLAIN", "索引"]
  },

  // ==================== 场景题 (第83-88题) ====================

  {
    title: "场景题：如何设计一个分布式全局唯一ID生成服务",
    content: `## 题目描述

分布式系统中需要全局唯一的ID（订单号、支付流水号、消息ID等）：

### 要求
1. **全局唯一**：绝对不能重复（哪怕是概率性的也不接受）
2. **趋势递增**：有利于数据库索引性能（B+树的写入特性）
3. **高可用**：任何单点故障不影响ID生成
4. **高性能**：QPS > 10万/秒
5. **可用性**：生成的ID尽量短（节省存储和带宽）

### 常见方案对比
- UUID、数据库自增、Redis INCR、Snowflake雪花算法、号段模式（Leaf）、美团Leaf-segment、百度uid-generator`,
    solution: `## 深度解析

### 方案对比矩阵

| 方案 | 唯一性 | 有序性 | 性能(QPS) | 长度 | 可用性 | 复杂度 |
|------|--------|--------|-----------|------|--------|--------|
| UUID v4 | ✅ | ❌ 随机 | 极高 | 36字符 | ⭐⭐⭐⭐⭐ | 极简 |
| DB自增 | ✅ | ✅ 严格递增 | ~5000 | 8字节(int64) | ⭐⭐ | 简单 |
| Redis INCR | ✅ | ✅ 趋势递增 | ~5万 | 变长 | ⭐⭐⭐ | 简单 |
| Snowflake | ✅ | ✅ 趋势递增 | ~400万 | 18位int64 | ⭐⭐⭐⭐ | 中等 |
| 号段模式 | ✅ | ✅ 趋势递增 | ~千万级 | 18位int64 | ⭐⭐⭐⭐⭐ | 中等 |

### 雪花算法（Snowflake）深度剖析

\`\`\`
Snowflake ID结构（64位long）：

 0 | 0000000 00000000 00000000 00000000 00000000 0 | 0000000000 | 000000000000
  ↑ ├─────────────────────────41位────────────────┤ ←──┼────12位──┼─────10位───┘
  │              时间戳(ms)                          │ 序列号  machineID
符号位                                              (4096/ms) (1024节点)

41位时间戳：
  ├── 可用69年（2^41 ms ≈ 69年，从自定义epoch算起）
  ├── 例：epoch = 2024-01-01 → 可用到2093年
  └── 回拨问题：时钟回拨会导致ID重复！（见下方解决方案）

10位机器ID：
  ├── 支持1024个节点（2^10）
  ├── 可按机房+机器编号分配
  └── 需要外部协调（ZooKeeper/DB/Nacos分配）

12位序列号：
  ├── 每毫秒4096个ID（2^12）
  ├── QPS上限 = 4096 × 1000 = 409.6万/秒
  └── 超过4096则等到下一毫秒

Java实现核心代码：
public class SnowflakeIdWorker {
    private final long twepoch = 1704067200000L;  // 2024-01-01 00:00:00
    private final long workerIdBits = 10L;
    private final long sequenceBits = 12L;
    private final long maxWorkerId = ~(-1L << workerIdBits);  // 1023
    private final long workerIdShift = sequenceBits;          // 12
    private final long timestampLeftShift = sequenceBits + workerIdBits;  // 22

    private long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public synchronized long nextId() {
        long timestamp = timeGen();

        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨！");
        }

        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & ((1 << sequenceBits) - 1);
            if (sequence == 0) {
                timestamp = tilNextMillis(lastTimestamp);  // 等待下一毫秒
            }
        } else {
            sequence = 0L;  // 新毫秒，序列号归零
        }

        lastTimestamp = timestamp;

        return ((timestamp - twepoch) << timestampLeftShift)
             | (workerId << workerIdShift)
             | sequence;
    }
}
\`\`\`

### 时钟回拨解决方案

\`\`\`
问题：NTP时钟同步可能导致服务器时钟回退几毫秒
后果：同一毫秒内生成相同ID（因为timestamp相同+sequence可能重置）

方案一：直接抛异常（简单粗暴）
  → 调用方捕获异常后切换到备用节点

方案二：等待追回（容忍小幅回拨）
  if (timestamp < lastTimestamp) {
      long offset = lastTimestamp - timestamp;
      if (offset <= 5) {  // 回拨不超过5ms，等待
          Thread.sleep(offset << 1);
          timestamp = timeGen();
          if (timestamp >= lastTimestamp) {
              // 追上了，正常生成
          }
      }
      throw new RuntimeException("严重时钟回拨！");
  }

方案三：借用未来时间（美团Leaf方案）
  if (timestamp < lastTimestamp) {
      timestamp = lastTimestamp;  // 使用上次的时间戳
      // 但这样本毫秒的配额会很快耗尽
      // 更好的做法：直接推进到上次时间戳+1ms
  }

方案四：多Worker配合（百度UidGenerator）
  → 使用WorkerID的高位区分"代"
  → 时钟回拨时切换到下一代WorkerID
\`\`\`

### 号段模式（Leaf-segment）架构

\`\`\`
┌─────────────────────────────────────────────────────┐
│                 Leaf Segment 架构                     │
│                                                     │
│  ┌──────────┐                                       │
│  │ Business  │ 请求ID                                │
│  │ Service  │────────→                              │
│  └──────────┘        │                              │
│                       ▼                              │
│              ┌─────────────────┐                     │
│              │  Leaf Server     │                    │
│              │                 │                    │
│              │  ┌───────────┐  │  从DB预取号段       │
│              │  │ Cache     │  │  current: [1001,    │
│              │  │ (内存)    │  │    2000]            │
│              │  │           │  │  next:    [2001,    │
│              │  │ current=1500│  │    3000]            │
│              │  │ next=2000  │  │                     │
│              │  └─────┬─────┘  │  当current即将用完   │
│              │       │        │  → 异步预取下一个号段  │
│              └───────┼────────┘                     │
│                      │                              │
│                      ▼                              │
│              ┌─────────────────┐                     │
│              │  MySQL (号段表)  │                    │
│              │                 │                    │
│              │ biz_tag | max_id │                    │
│              │ order  | 3000   │                    │
│              │ payment| 8000   │                    │
│              └─────────────────┘                     │
│                                                     │
│  优势：                                             │
│  ├── 性能极高（纯内存操作，QPS可达千万级）            │
│  ├── 容灾好（Leaf Server是无状态的，可水平扩展）      │
│  └── ID连续性好（号段内有序）                        │
│                                                     │
│  劣势：                                             │
│  ├── 如果Server重启，当前号段内的ID可能丢失（不连续）  │
│  └── 需要依赖DB（虽然只是预取号段）                   │
└─────────────────────────────────────────────────────┘
\`\`\`

**生产选型建议：**

\`\`\`
你的场景是？
├── 对ID长度不敏感 + 不需要有序 → UUID（最简单）
├── 单机/小规模 → Redis INCR 或 DB自增
├── 分布式中规模（<100万QPS）→ Snowflake（经典可靠）
├── 大规模（>100万QPS）→ 号段模式（Leaf-segment）
├── 需要信息安全（不暴露规律）→ 雪花算法 + 混淆加密
└── 金融/支付领域 → 号段模式 + DB双写保证不丢失
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["场景题", "分布式ID", "Snowflake", "Leaf", "高并发"]
  },

  {
    title: "场景题：分布式事务的一致性方案",
    content: `## 题目描述

微服务架构下，一笔业务涉及多个服务的数据库操作：

### 典型场景
用户下单流程：
1. 订单服务：创建订单（INSERT INTO orders）
2. 库存服务：扣减库存（UPDATE inventory SET stock = stock - 1）
3. 积分服务：增加积分（UPDATE points SET balance = balance + 100）
4. 优惠券服务：核销优惠券（UPDATE coupon SET status = 'used')

### 核心挑战
- 任何一个服务失败，其他服务已经提交的事务如何回滚？
- 如何保证这4个操作要么全部成功，要么全部失败？

### 要求分析以下方案
1. **2PC/3PC两阶段/三阶段提交**：XA协议的原理与缺陷
2. **TCC（Try-Confirm-Cancel）**：补偿型事务的具体实现
3. **Saga模式**：长事务编排（编排式 vs 协作式）
4. **本地消息表（最终一致性）**：可靠消息投递
5. **Seata AT模式**：阿里巴巴开源的分布式事务框架`,
    solution: `## 深度解析

### 方案全景图

\`\`\`
┌────────────────────────────────────────────────────────────┐
│              分布式事务方案选型指南                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  一致性强度（从强到弱）：                                   │
│                                                            │
│  2PC/XA ───────── 强一致性（ACID）                         │
│  ├── 原理：Prepare → Commit/Rollback                      │
│  ├── 缺点：同步阻塞、单点（Coordinator）、锁时间长         │
│  ├── 适用：传统单体/数据库层面的分布式事务                   │
│  └── 代表：Seata XA模式、Atomikos                          │
│                                                            │
│  TCC ────────── 最终一致性（补偿事务）                      │
│  ├── 原理：Try（预留资源）→ Confirm（确认）/ Cancel（取消）  │
│  ├── 缺点：侵入性强（需改造业务代码）、开发成本高            │
│  ├── 适用：金融/支付等对一致性要求极高的场景                │
│  └── 代表：Seata TCC模式、TCC-Transaction                  │
│                                                            │
│  Saga ───────── 最终一致性（长事务分解）                    │
│  ├── 原理：将长事务拆分为多个本地事务，正向补偿/反向回滚    │
│  ├── 优点：无锁、适合长事务                                │
│  ├── 缺点：无读一致性（中间状态可见）、回滚复杂             │
│  └── 适用：旅行预订（机票+酒店+租车）、审批流             │
│                                                            │
│  本地消息表 ──── 最终一致性（异步可靠消息）                 │
│  ├── 原理：业务操作 + 写入消息在同一本地事务               │
│  ├── 定时任务轮询发送消息                                 │
│  ├── 优点：实现简单、最终一致                             │
│  └── 适用：大部分业务场景（订单→积分→通知等）              │
│                                                            │
│  Seata AT ────── 最终一致性（自动补偿，对业务零侵入）       │
│  ├── 原理：一阶段提交 + 二阶段回滚（Undo Log）             │
│  ├── 优点：无侵入、自动化                                 │
│  ├── 缺点：性能损耗（全局锁、多次RPC）                    │
│  └── 适用：Java技术栈的一般业务场景                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
\`\`\`

### Seata AT模式详解（最常用的生产方案）

\`\`\`
Seata AT模式的工作流程：

阶段一（业务执行期）：
┌─────────────────────────────────────────────────────┐
│  TM (Transaction Manager)                            │
│  │                                                   │
│  │  @GlobalTransactional                             │
│  │  public void purchase() {                         │
│  │      // 1. 开启全局事务（向TC注册）                │
│  │                                                  │
│  │      orderService.createOrder();  // RM1          │
│  │      // RM1执行前：TC生成Branch ID                 │
│  │      // RM1执行前：记录Before Image（快照）        │
│  │      // RM1执行SQL：INSERT INTO orders ...         │
│  │      // RM1执行后：记录After Image（快照）         │
│  │      // RM1提交本地事务（一阶段提交！）            │
│  │                                                  │
│  │      inventoryService.deductStock();  // RM2       │
│  │      // 同样的快照机制...                           │
│  │                                                  │
│  │      pointsService.addPoints();  // RM3            │
│  │      // 同样...                                    │
│  │  }                                                 │
│  │                                                   │
│  │  // 如果全部成功 → TC通知全局提交（结束）          │
│  │  // 如果任一失败 → 进入阶段二（回滚）              │
│  └─────────────────────────────────────────────────────┘

阶段二（提交/回滚期）：
┌─────────────────────────────────────────────────────┐
│  提交（全部成功）：                                   │
│  TC通知所有RM删除Undo Log（异步清理）                 │
│  → 结束                                              │
│                                                      │
│  回滚（任一失败）：                                   │
│  TC通知所有RM进行回滚                                 │
│  RM收到回滚指令：                                     │
│  1. 取出Undo Log中的Before Image                    │
│  2. 生成反向SQL                                      │
│     例：原SQL是 INSERT → 反向SQL是 DELETE            │
│     例：原SQL是 UPDATE SET a=1 → 反向SQL UPDATE SET a=旧值│
│  3. 执行反向SQL恢复数据                                │
│  4. 删除Undo Log                                    │
│  → 数据恢复到事务前的状态                              │
└─────────────────────────────────────────────────────┘

AT模式的潜在问题：
├── 脏写问题：两个全局事务修改同一行数据
│   → 解决：全局锁（TC管理，串行化对同一行的操作）
├── Undo Log丢失：回滚时找不到Undo Log
│   → 解决：Undo Log也需要持久化（与业务数据同事务提交）
└── 性能开销：两次RPC（注册分支+上报状态）+ 全局锁竞争
\`\`\`

### TCC模式代码示例

\`\`\`java
// Try阶段：资源预留（必须支持幂等）
@Service
public class InventoryServiceTCC implements TccAction {

    @TwoPhaseBusinessAction(name = "deductInventory",
        commitMethod = "commit", rollbackMethod = "rollback")
    public boolean deduct(@BusinessActionContextParameter(paramName = "productId") Long productId,
                          @BusinessActionContextParameter(paramName = "count") int count) {
        // 冻结库存（不是真正扣减！）
        // INSERT INTO inventory_freeze (product_id, count, txn_id)
        // VALUES (?, ?, ?)
        // UPDATE inventory SET frozen = frozen + ?, version = version + 1
        // WHERE product_id = ? AND stock - frozen >= ?
        return true;
    }

    // Confirm阶段：确认执行（真正扣减）
    public boolean commit(BusinessActionContext ctx) {
        Long productId = (Long) ctx.getActionContext("productId");
        int count = (Integer) ctx.getActionContext("count");

        // 真正扣减冻结的库存
        UPDATE inventory SET stock = stock - ?, frozen = frozen - ?
        WHERE product_id = ?

        // 删除冻结记录
        DELETE FROM inventory_freeze WHERE txn_id = ?
        return true;
    }

    // Cancel阶段：取消（释放冻结的库存）
    public boolean rollback(BusinessActionContext ctx) {
        Long productId = (Long) ctx.getActionContext("productId");
        int count = (Integer) ctx.getActionContext("count");

        // 释放冻结库存
        UPDATE inventory SET frozen = frozen - ?
        WHERE product_id = ?

        // 删除冻结记录
        DELETE FROM inventory_freeze WHERE txn_id = ?
        return true;
    }
}
\`\`\`

### 方案选型建议

\`\`\`
你的场景？
├── 金融转账/支付（强一致性要求）
│   └── TCC（资金操作必须有明确的Confirm/Cancel）
│
├── 一般电商下单（允许短暂不一致）
│   └── Seata AT（开发成本低，对业务代码侵入少）
│
├── 长时间运行的流程（如审批流，可能持续数天）
│   └── Saga（每个步骤独立事务，逐步推进）
│
├── 异步解耦的场景（如下单后发积分/发通知）
│   └── 本地消息表 / RocketMQ事务消息
│
├── 传统单体应用（多个DB）
│   └── 2PC/XA（Seata XA模式或Atomikos）
│
└── 跨语言/异构系统
    └── Saga（通过消息队列编排）或 本地消息表
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["场景题", "分布式事务", "Seata", "TCC", "Saga"]
  },

  // ==================== 算法补充 (第60-68题) ====================

  {
    title: "实现快速排序（Quick Sort）与优化",
    content: `## 题目描述

快速排序是最常用的排序算法之一：

### 要求
1. 实现基础版快速排序（Lomuto分区或Hoare分区）
2. 分析最坏时间复杂度O(n²)的场景及解决方案
3. 实现三数取中(median-of-three)优化 + 小数组插入排序优化
4. 对比快速排序 vs 归并排序 vs 堆排序的优缺点`,
    codeTemplate: {
      javascript: `/**
 * 快速排序 - 多种优化版本
 */

// 基础版：Lomuto分区方案（以最后一个元素为pivot）
function quickSortBasic(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSortBasic(arr, low, pivotIndex - 1);
    quickSortBasic(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];  // 选择最后一个元素作为基准
  let i = low;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }
  [arr[i], arr[high]] = [arr[high], arr[i]];  // 将pivot放到正确位置
  return i;  // 返回pivot的最终索引
}

// TODO: 实现以下优化版本
// 1. 三数取中（median-of-three）选择更好的pivot
// 2. Hoare分区方案（双向指针，减少交换次数）
// 3. 尾递归优化（减少栈空间）
// 4. 小数组切换到插入排序（阈值约10-20）

module.exports = { quickSortBasic };`,
      python: `"""
快速排序 - Python实现（多种优化）
"""
import random
from typing import List

def quick_sort(arr: List[int]) -> List[int]:
    """快速排序入口"""
    if len(arr) <= 1:
        return arr
    _quick_sort(arr, 0, len(arr) - 1)
    return arr

def _quick_sort(arr: List[int], low: int, high: int) -> None:
    # TODO: 实现Hoare分区方案的快速排序
    # 包含：
    # 1. 三数取中优化
    # 2. 小数组插入排序优化
    # 3. 重复元素处理（三分区/Dutch National Flag问题）
    pass

def partition_hoare(arr: List[int], low: int, high: int) -> int:
    """Hoare分区方案"""
    # TODO: 实现
    pass

def median_of_three(arr: List[int], low: int, high: int) -> int:
    """三数取中：选arr[low]、arr[mid]、arr[high]的中位数"""
    mid = (low + high) // 2
    # 对三个元素排序并返回中间值的索引
    if arr[low] > arr[mid]:
        arr[low], arr[mid] = arr[mid], arr[low]
    if arr[low] > arr[high]:
        arr[low], arr[high] = arr[high], arr[low]
    if arr[mid] > arr[high]:
        arr[mid], arr[high] = arr[high], arr[mid]
    return mid  # 返回中位数的索引`,
      java: `/**
 * 快速排序 - Java实现（含完整优化）
 */
public class QuickSort {

    // 切换到插入排序的阈值
    private static final int INSERTION_SORT_THRESHOLD = 16;

    public static void sort(int[] arr) {
        if (arr == null || arr.length <= 1) return;
        quickSort(arr, 0, arr.length - 1);
    }

    private static void quickSort(int[] arr, int low, int high) {
        // TODO: 使用循环+手动栈代替递归（尾递归优化）
        // 或对小数组使用插入排序
        while (low < high) {
            // 小数组优化：切换到插入排序
            if (high - low < INSERTION_SORT_THRESHOLD) {
                insertionSort(arr, low, high);
                return;
            }

            int pivotIndex = partition(arr, low, high);

            // 优先处理较短的子数组（保证栈深度不超过O(log n)）
            if (pivotIndex - low < high - pivotIndex) {
                quickSort(arr, low, pivotIndex - 1);
                low = pivotIndex + 1;  // 尾递归优化
            } else {
                quickSort(arr, pivotIndex + 1, high);
                high = pivotIndex - 1;
            }
        }
    }

    // Lomuto分区
    private static int partition(int[] arr, int low, int high) {
        // TODO: 实现三数取中的pivot选择
        int pivot = arr[high];
        int i = low;
        for (int j = low; j < high; j++) {
            if (arr[j] <= pivot) {
                swap(arr, i++, j);
            }
        }
        swap(arr, i, high);
        return i;
    }

    private static void insertionSort(int[] arr, int low, int high) {
        for (int i = low + 1; i <= high; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= low && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

    private static void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "快速排序", "分治", "排序算法", "时间复杂度"]
  },

  {
    title: "实现二分查找及其变种算法",
    content: `## 题目描述

二分查找是最高效的查找算法之一，但变体众多且容易出错：

### 要求实现
1. **标准二分查找**：在有序数组中查找目标值
2. **查找左边界**：第一个 >= target 的位置（lower_bound）
3. **查找右边界**：最后一个 <= target 的位置（upper_bound）
4. **旋转排序数组查找**：LeetCode 33/81
5. **二维矩阵二分查找**：LeetCode 240（每行每列有序）`,
    codeTemplate: {
      javascript: `/**
 * 二分查找及其变种
 */

// 标准二分查找：找到目标值返回索引，否则返回-1
function binarySearch(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// 查找左边界：第一个 >= target 的位置
function lowerBound(nums, target) {
  // TODO: 实现
  // 如果所有元素都 < target → 返回 nums.length
  // 否则返回第一个 >= target 的索引
}

// 查找右边界：最后一个 <= target 的位置
function upperBound(nums, target) {
  // TODO: 实现
  // 如果所有元素都 > target → 返回 -1
  // 否则返回最后一个 <= target 的索引
}

// 旋转排序数组查找（无重复 LeetCode 33）
function searchRotated(nums, target) {
  // TODO: O(log n) 时间复杂度
  // 提示：先判断哪一半是有序的，再判断target是否在有序范围内
}

// 二维矩阵搜索（每行从左到右升序，每列从上到下升序）
function searchMatrix(matrix, target) {
  // TODO: 从右上角或左下角开始搜索
  // 时间复杂度 O(m+n)
}`,
      python: `"""
二分查找及其变种 - Python实现
"""
from typing import List

def binary_search(nums: List[int], target: int) -> int:
    """标准二分查找"""
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

def lower_bound(nums: List[int], target: int) -> int:
    """查找左边界：第一个 >= target 的位置（bisect_left）"""
    # TODO: 实现
    pass

def upper_bound(nums: List[int], target: int) -> int:
    """查找右边界：最后一个 <= target 的位置（bisect_right）- 1"""
    # TODO: 实现
    pass

def search_rotated_array(nums: List[int], target: int) -> bool:
    """
    搜索旋转排序数组（LeetCode 33）
    例：nums = [4,5,6,7,0,1,2], target = 0 → 返回4
    """
    # TODO: 实现 O(log n) 解法
    pass

def search_2d_matrix(matrix: List[List[int]], target: int) -> bool:
    """
    搜索二维矩阵（LeetCode 240）
    矩阵特性：每行从左到右升序，每列从上到下升序
    要求：O(m+n) 时间复杂度
    """
    # TODO: 实现
    # 提示：从右上角开始，比目标大就向左，比目标小就向下
    pass`,
      java: `/**
 * 二分查找及其变种 - Java实现
 */
public class BinarySearchVariants {

    /**
     * 标准二分查找
     * @return 目标索引，不存在返回-1
     */
    public static int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;  // 防止溢出！
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    /**
     * lower_bound: 第一个 >= target 的位置
     * @return 插入位置（如果target不存在），范围[0, nums.length]
     */
    public static int lowerBound(int[] nums, int target) {
        // TODO: 实现
        return -1;
    }

    /**
     * upper_bound: 最后一个 <= target 的位置
     * @return 范围[-1, nums.length-1]
     */
    public static int upperBound(int[] nums, int target) {
        // TODO: 实现
        return -1;
    }

    /**
     * 搜索旋转排序数组（LeetCode 33）
     * 数组在某个未知点旋转过，如 [0,1,2,4,5,6,7] 可能变成 [4,5,6,7,0,1,2]
     */
    public static int searchRotated(int[] nums, int target) {
        // TODO: O(log n) 解法
        return -1;
    }

    /**
     * 搜索二维矩阵 II（LeetCode 240）
     * 矩阵每行从左到右升序，每列从上到下升序
     * 要求优于O(mn)的解法
     */
    public static boolean searchMatrix(int[][] matrix, int target) {
        // TODO: O(m+n) 解法
        return false;
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "二分查找", "搜索算法", "O(logN)", "边界处理"]
  },

  {
    title: "实现前缀树（Trie/字典树）",
    content: `## 题目描述

前缀树是一种用于高效字符串检索的树形数据结构：

### 功能要求
1. \`insert(word)\`: 插入一个单词
2. \`search(word)\`: 查询单词是否存在（完全匹配）
3. \`startsWith(prefix)\`: 查询是否有以该前缀开头的单词
4. \`delete(word)\`: 删除一个单词（需考虑其他单词是否共享节点）

### 进阶功能
- 统计每个前缀出现的次数（用于自动补全提示）
- 实现模糊搜索（支持通配符'.'）`,
    codeTemplate: {
      javascript: `/**
 * 前缀树（Trie/字典树）
 */
class TrieNode {
  constructor() {
    this.children = {};      // 字符 → TrieNode
    this.isEndOfWord = false; // 标识是否是一个完整单词的结尾
    this.count = 0;           // 经过此节点的单词数量
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    node.count++;
    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }
      node = node.children[ch];
      node.count++;
    }
    node.isEndOfWord = true;
  }

  search(word) {
    // TODO: 查找完整单词是否存在
  }

  startsWith(prefix) {
    // TODO: 查找是否有此前缀
  }

  delete(word) {
    // TODO: 删除单词（注意不能删除被其他单词共享的节点）
  }

  // 进阶：获取指定前缀的所有单词（用于自动补全）
  getWordsWithPrefix(prefix) {
    // TODO: DFS遍历收集所有单词
  }
}`,
      python: `"""
前缀树（Trie）- Python实现
"""

class TrieNode:
    def __init__(self):
        self.children: dict = {}   # char -> TrieNode
        self.is_end_of_word: bool = False
        self.count: int = 0


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        """插入单词"""
        node = self.root
        node.count += 1
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            node.count += 1
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        """查询单词是否存在（完全匹配）"""
        # TODO: 实现
        pass

    def starts_with(self, prefix: str) -> bool:
        """查询是否有此前缀"""
        # TODO: 实现
        pass

    def delete(self, word: str) -> bool:
        """删除单词"""
        # TODO: 实现（需要考虑节点共享问题）
        pass

    def words_with_prefix(self, prefix: str) -> list:
        """获取指定前缀的所有单词（自动补全）"""
        # TODO: DFS遍历
        pass`,
      java: `import java.util.*;

/**
 * 前缀树（Trie）- Java实现
 */
class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;
    int count = 0;  // 经过此节点的单词数
}

public class Trie {
    private final TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    /** 插入单词 */
    public void insert(String word) {
        TrieNode node = root;
        node.count++;
        for (char ch : word.toCharArray()) {
            node.children.putIfAbsent(ch, new TrieNode());
            node = node.children.get(ch);
            node.count++;
        }
        node.isEndOfWord = true;
    }

    /** 查找完整单词 */
    public boolean search(String word) {
        // TODO: 实现
        return false;
    }

    /** 查找前缀 */
    public boolean startsWith(String prefix) {
        // TODO: 实现
        return false;
    }

    /** 删除单词 */
    public void delete(String word) {
        // TODO: 实现（需递归删除无用节点）
    }

    /** 获取指定前缀的所有单词（自动补全用） */
    public List<String> getWordsWithPrefix(String prefix) {
        // TODO: DFS遍历收集
        return Collections.emptyList();
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "数据结构", "前缀树", "Trie", "字符串"]
  },

  // ==================== 操作系统补充 (第69-74题) ====================

  {
    title: "Linux I/O模型：阻塞/非阻塞/多路复用详解",
    content: `## 题目描述

Linux系统的五种I/O模型是后端高并发编程的基础：

### 核心问题
1. **I/O的两个阶段**：等待数据准备（waiting for data）和将数据从内核拷贝到用户空间（copying data from kernel to user space）
2. **五种模型**：Blocking I/O、Non-blocking I/O、I/O Multiplexing (select/poll/epoll)、Signal-driven I/O、Asynchronous I/O
3. **select vs poll vs epoll**：为什么epoll性能最好？水平触发(ET) vs 边缘触发(LT)
4. **Java NIO与Netty**：如何基于epoll实现Reactor模型？
5. **io_uring**：Linux 5.1+的新一代异步I/O接口`,
    solution: `## 深度解析

### I/O的两阶段模型

\`\`\`
一次网络I/O读取操作分为两个阶段：

阶段一：等待数据准备好（Waiting for Data）
├── 数据到达网卡 → 内核将数据复制到内核缓冲区
├── 此阶段：数据可能还没到达（如对方还没发送）
└── 阻塞在此处 = 阻塞I/O；不阻塞 = 非阻塞I/O

阶段二：数据从内核空间复制到用户空间（Copying Data）
├── 内核缓冲区 → 用户态buffer
└── 此阶段总是阻塞的（除非AIO）

时间线示意：
  ┌─────────────────────────────────────────────┐
  │  应用程序          内核                      │
  │                                             │
  │  read() ──→       等待数据...               │
  │         ←──  数据已就绪                    │
  │  (阻塞在copy)      copy to user buffer      │
  │         ←──  copy完成                     │
  │  继续执行                                    │
  │                                             │
  └─────────────────────────────────────────────┘
\`\`\`

### 五种I/O模型对比

\`\`\`
模型一：Blocking I/O（阻塞I/O）
  read()调用后，进程阻塞直到数据完全就绪并复制完成
  最简单的模型，但一个线程只能处理一个连接
  适用：传统BIO、连接数少(<1000)的场景

模型二：Non-Blocking I/O（非阻塞I/O）
  设置socket为NONBLOCKING
  read()立即返回：
    - 如果数据未就绪 → 返回EWOULDBLOCK错误
    - 如果数据已就绪 → 复制到用户空间
  需要应用层不断轮询（busy-wait），浪费CPU
  不推荐直接使用

模型三：I/O Multiplexing（I/O多路复用）⭐ 最常用
  select/poll/epoll：同时监听多个fd
  当任一fd可读/可写时，通知应用程序
  特点：
  - 一个线程可以管理大量连接（C10K/C10M问题的核心解法）
  - 本质还是阻塞的（只是阻塞在select/epoll_wait而非read）
  - Redis/Nginx/Netty/Tomcat都在用

模型四：Signal-Driven I/O（信号驱动I/O）
  注册SIGIO信号处理器
  数据就绪时内核发送SIGIO信号通知进程
  较少使用（信号处理有诸多限制）

模型五：Asynchronous I/O（真正的异步I/O）
  aio_read/aio_write：告诉内核操作完成后通知我
  整个过程（包括copy）都是非阻塞的
  Linux原生AIO支持有限（主要用于文件I/O）
  io_uring是新一代方案
\`\`\`

### select vs poll vs epoll

\`\`\`
┌────────────────────────────────────────────────────────────┐
│              select / poll / epoll 对比                     │
├──────────────┬──────────────┬──────────────┬───────────────┤
│              │    select    │    poll      │    epoll      │
├──────────────┼──────────────┼──────────────┼───────────────┤
│ 数据结构     │ fd_set(位数组)│ pollfd数组  │ 红黑树+链表    │
│ 最大fd数     │ FD_SETSIZE    │ 无限制      │ 无限制         │
│              │ (通常1024)    │             │               │
│ fd拷贝      │ 每次全部拷贝  │ 每次全部拷贝  │ 仅首次注册时   │
│              │ 到内核        │ 到内核       │ 拷贝           │
│ 时间复杂度   │ O(n)         │ O(n)        │ O(1)唤醒      │
│              │ (线性扫描)    │ (线性扫描)    │ (回调机制)     │
│ 触发方式     │ LT(水平触发)  │ LT          │ LT/ET均可     │
│ 实现效率     │ 低            │ 中          │ 高            │
│ 适用平台     │ 全平台        │ 全平台       │ Linux only    │
└──────────────┴──────────────┴──────────────┴───────────────┘

epoll三大核心API：
1. epoll_create(size): 创建epoll实例（size参数现代Linux已忽略）
2. epoll_ctl(epfd, op, fd, event):
   - EPOLL_CTL_ADD: 注册fd
   - EPOLL_CTL_MOD: 修改事件
   - EPOLL_CTL_DEL: 删除fd
3. epoll_wait(epfd, events, maxevents, timeout):
   - 阻塞等待事件就绪
   - 返回就绪的事件列表

LT vs ET：
├── Level Triggered（水平触发，默认）：
│   只要fd处于就绪状态就会一直通知
│   编程简单但可能重复通知同一事件
│
└── Edge Triggered（边缘触发，高效模式）：
    只在状态变化时通知一次
    必须配合非阻塞I/O + 循环read直到EAGAIN
    性能更高但编程更复杂（容易遗漏事件）
\`\`\`

### Netty的Reactor模型

\`\`\`
Netty EventLoop（基于epoll的Reactor线程模型）：

单Reactor单线程：
  所有I/O操作在一个EventLoop线程中完成
  适用于I/O密集型但计算量小的场景（如Redis）

单Reactor多线程（Netty默认）：
  Boss Group（1个EventLoop）：Accept新连接
  Worker Group（多个EventLoop）：处理Read/Write
  一个连接绑定到一个EventLoop（避免锁竞争）
  适用于大多数场景

主从Reactor多线程：
  MainReactor: Accept连接
  SubReactor: I/O读写
  Worker Thread Pool: 业务逻辑处理
  适用于业务计算密集型场景

Netty零拷贝技术：
├── Direct Buffer（堆外内存，避免JVM堆→Native拷贝）
├── Composite ByteBuf（组合Buffer，避免合并拷贝）
├── FileChannel.transferTo（sendfile系统调用）
└── MappedByteBuffer（mmap内存映射）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["操作系统", "I/O模型", "epoll", "Netty", "高并发"]
  },

  {
    title: "虚拟内存与页面置换算法",
    content: `## 题目描述

虚拟内存是操作系统最重要的抽象之一：

### 核心问题
1. **虚拟地址→物理地址转换**：MMU、TLB、页表(Page Table)、多级页表
2. **页面置换算法**：OPT（最优）、FIFO、LRU、Clock（时钟）、LFU的工作原理
3. **缺页中断（Page Fault）的处理流程**
4. **Linux内存管理**：伙伴系统(Buddy System)、slab分配器、vmalloc/kmalloc
5. **Swap机制**：何时换出？换出哪些页面？Thrashing（抖动）如何解决？`,
    solution: `## 深度解析

### 虚拟地址转换过程

\`\`\`
CPU发出虚拟地址(Virtual Address, VA)
        │
        ▼
    ┌──────────┐
    │   MMU    │  （Memory Management Unit，硬件单元）
    │          │
    │ VA拆分为：│
    │ [VPN][Offset]  (Virtual Page Number + Offset)
    │          │
    │ 1. 查TLB  │  (Translation Lookaside Buffer，快表)
    │   ├─ 命中 → 直接得到物理页号(PFN) ✅
    │   └─ 未命中 → 查Page Table（慢表）
    │          │
    │ 2. 查Page Table │
    │   ├─ 有效 → 得到PFN ✅
    │   │   同时更新TLB（利用局部性原理）
    │   └─ 无效 → Page Fault! 缺页异常 ⚠️
    │          │
    └──────────┘
        │
        ▼
    物理地址(PA) = [PFN][Offset]

多级页表（以4级为例，64位系统）：
VA = [PGD索引][PUD索引][PMD索引][PTE索引][Offset]
  ↓       ↓       ↓       ↓       ↓
 PGD →   PUD →   PMD →   PTE →   页面帧
(页全局目录)(页上级目录)(页中间目录)(页表项)

为什么要多级？
→ 64位地址空间的页表会非常大（2^47项 × 8字节 = 128TB！）
→ 多级页表按需分配，只有实际使用的页才分配页表项
→ 代价：多次内存访问（所以TLB命中率至关重要）
\`\`\`

### 页面置换算法

\`\`\`
1. OPT（Optimal，最佳置换算法）—— 理论最优，不可实现
   置换将来最久不被访问的页面
   用作衡量其他算法的标准

2. FIFO（First-In-FirstOut，先进先出）
   最简单的算法，淘汰最先进入内存的页面
   问题：Belady异常（增加物理页数反而缺页率上升！）

3. LRU（Least Recently Used，最近最少使用）
   淘汰最近最长时间未被访问的页面
   利用局部性原理（时间局部性）
   问题：实现成本高（需要维护访问顺序）

4. Clock/Second Chance（时钟/二次机会算法）
   LRU的近似实现（环形队列 + 引用位）
   页面排成环形，指针扫过：
   ├── 引用位=0 → 直接淘汰
   └── 引用位=1 → 清零引用位（给第二次机会），继续下一个

5. LFU（Least Frequently Used，最不经常使用）
   淘汰访问频率最低的页面
   问题：某些页面早期频繁访问后期不再使用（"缓存污染"）
   改进：衰减LFU（随时间降低历史权重）

实际使用：
├── Linux: 近似LRU（双链表 + Active/Inactive两列）
├── MySQL InnoDB: LRU变种（ midpoint insertion strategy）
└── Redis: approximated-LRU（采样 + 淘汰）
\`\`\`

### Linux内存管理架构

\`\`\`
┌─────────────────────────────────────────────────────┐
│                  用户空间请求内存                      │
│                                                     │
│  malloc(100KB)                                      │
│      │                                              │
│      ▼                                              │
│  glibc ptmalloc2 (用户态分配器)                       │
│  ├── < 128KB → brk/sbrk 扩展heap（sbrk）            │
│  ├── ≥ 128KB → mmap匿名映射（mmap）                 │
│  └── 维护：fastbins/unsorted/small/large bins       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              内核空间                          │    │
│  │                                             │    │
│  │  slab分配器（管理小对象 < 8KB）               │    │
│  │  ├── kmalloc: 内核通用内存分配                 │    │
│  │  ├── kmem_cache: 高频对象的专用缓存            │    │
│  │  │   (task_struct, inode, dentry等)          │    │
│  │  └── 减少内存碎片                             │    │
│  │                                             │    │
│  │  伙伴系统(Buddy System)（管理物理页框 4KB）    │    │
│  │  ├── 以2的幂次分配：4K/8K/16K/32K/64K/...     │    │
│  │  ├── 合并：相邻空闲块合并为更大的块             │    │
│  │  └── 解决外部碎片问题                         │    │
│  │                                             │    │
│  │  vmalloc（管理不连续的物理页，用于大块内存）    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["操作系统", "虚拟内存", "页面置换", "MMU", "Linux"]
  },

  // ==================== 网络协议补充 (第75-80题) ====================

  {
    title: "DNS解析完整流程与DNS劫持防护",
    content: `## 题目描述

DNS（域名系统）是互联网的基础设施：

### 核心问题
1. **完整解析流程**：从浏览器输入URL到获得IP的全过程（递归查询vs迭代查询）
2. **记录类型**：A/AAAA/CNAME/MX/TXT/NS/SOA 各自的作用
3. **DNS缓存**：浏览器缓存→OS缓存→Hosts文件→本地DNS服务器→根域名服务器
4. **安全问题**：DNS劫持、DNS污染、DNS放大攻击及防护
5. **DNS预解析与连接复用**：浏览器和移动端的优化策略`,
    solution: `## 深度解析

### DNS解析完整流程

\`\`\`
用户在浏览器输入 www.example.com 并回车

Step 1: 浏览器缓存检查
├── 检查自身DNS缓存（Chrome: chrome://net-internals/#dns）
├── TTL(Time To Live)未过期 → 直接返回IP ✅
└── 过期或不存在 → 进入Step 2

Step 2: 操作系统缓存检查
├── /etc/hosts 文件（Linux/Mac）或 C:\\Windows\\System32\\drivers\\etc\\hosts
├── 有记录 → 返回对应IP ✅
└── 无记录 → Step 3

Step 3: 本地DNS解析器（Local DNS Resolver）
├── 通常是你ISP提供的DNS服务器（如114.114.114.114或8.8.8.8）
├── 或者你手动配置的公共DNS
├── 自身也有缓存 → 命中则返回 ✅
└── 未命中 → 向上游发起查询

Step 4: 递归/迭代查询（核心过程）
┌──────────────────────────────────────────────────┐
│                   DNS层级结构                     │
│                                                   │
│  Root Server (.)                                  │
│  ├── .com TLD Server                              │
│  │   ├── example.com Authoritative Name Server     │
│  │   │   └── 返回 A记录: 93.184.216.34            │
│  │   │                                           │
│  └── .cn TLD Server                               │
│                                                   │
│  查询方式：                                        │
│  递归查询（Recursive）：                           │
│  Local DNS 代表客户端向上逐级查询，最后汇总返回     │
│  → 客户端只需问Local DNS一次                      │
│                                                   │
│  迭代查询（Iterative）：                           │
│  Local DNS 告诉客户端"你去问下一级"，客户端自行去问  │
│  → 客户端需要多次查询（一般由Resolver代劳）         │
└──────────────────────────────────────────────────┘

Step 5: 返回结果并缓存
├── Local DNS收到最终结果
├── 缓存结果（根据TTL值，通常几小时~几天）
├── 返回给OS → 返回给浏览器
└── 浏览器也缓存一份

总耗时：通常 20ms ~ 200ms（取决于缓存情况）
\`\`\`

### DNS记录类型

| 类型 | 全称 | 用途 | 示例 |
|------|------|------|------|
| A | Address | IPv4地址 | www → 93.184.216.34 |
| AAAA | IPv6 Address | IPv6地址 | www → 2606:2800:220:1:... |
| CNAME | Canonical Name | 别名/域名指向 | cdn.example.com → abc.cloudfront.net |
| MX | Mail Exchange | 邮件服务器 | @ → mail.example.com |
| TXT | Text | 验证文本/SPF/DKIM | google-site-verification=xxx |
| NS | Name Server | 授权DNS服务器 | ns1.example.com |
| SOA | Start of Authority | 区域起始授权信息 | 序列号、管理员邮箱等 |
| PTR | Pointer | 反向解析（IP→域名） | 34.216.184.93.in-addr.arpa |
| SRV | Service Location | 服务发现 | _ldap._tcp.example.com |

### 安全威胁与防护

\`\`\`
威胁一：DNS劫持（DNS Hijacking）
  攻击者修改DNS响应，将域名指向恶意IP
  场景：路由器被入侵修改了DNS设置
  防护：
  ├── 使用可信的公共DNS（8.8.8.8 / 114.114.114.114）
  ├── 启用DNS over HTTPS (DoH) 或 DNS over TLS (DoT)
  └── 定期检查/etc/hosts文件

威胁二：DNS污染（DNS Poisoning/Cache Poisoning）
  在DNS响应到达之前注入伪造的响应
  常见于GFW对特定域名的干扰
  防护：
  ├── DoH/DoT加密DNS查询
  ├── EDNS Client Subnet（ECS）绕过部分污染
  └── 国外VPS自建DNS

威胁三：DNS放大攻击（DNS Amplification DDoS）
  利用DNS的UDP协议+开放解析器放大流量
  攻击：53字节查询 → 4000字节响应（放大78倍！）
  防护：
  ├── 关闭DNS服务器的开放解析（Recursion Disabled）
  ├── 限制响应速率（RRL, Response Rate Limiting）
  └── 启用源地址验证（RPKI）
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "DNS", "域名解析", "网络安全", "CDN"]
  },

  {
    title: "HTTPS/TLS握手过程与证书链验证",
    content: `## 题目描述

HTTPS是互联网安全的基石：

### 核心问题
1. **TLS握手完整流程**：TLS 1.2 vs TLS 1.3 的握手区别？1-RTT vs 2-RTT？
2. **对称加密与非对称加密**：为什么两者结合使用？密钥交换算法（RSA vs ECDHE）的区别
3. **数字证书与CA体系**：证书包含什么？证书链是如何验证的？
4. **中间人攻击（MITM）**：如何防止？证书固定(Certificate Pinning)是什么？
5. **HTTP Strict Transport Security (HSTS)**：作用与配置`,
    solution: `## 深度解析

### TLS 1.2 握手流程（2-RTT）

\`\`\`
Client                                          Server
  │                                                │
  │  ① ClientHello                                │
  │  ──────────────────────────────────────────→   │
  │  支持的TLS版本、密码套件列表(Cipher Suites)、    │
  │  支持的压缩方法、随机数(Client Random)           │
  │                                                │
  │        ② ServerHello                           │
  │        ←────────────────────────────────────   │
  │        选定的密码套件、TLS版本、                   │
  │        服务器随机数(Server Random)               │
  │                                                │
  │        ③ Certificate（服务器证书）               │
  │        ←────────────────────────────────────   │
  │        证书链：Server Cert → Intermediate CA →  │
  │        Root CA                                   │
  │                                                │
  │        ④ ServerKeyExchange / ServerHelloDone     │
  │        ←────────────────────────────────────   │
  │        (仅ECDHE/RSA_DHE需要ServerKeyExchange)    │
  │        包含服务器的公钥/临时DH参数                 │
  │                                                │
  │  ⑤ ClientKeyExchange + ChangeCipherSpec         │
  │  ──────────────────────────────────────────→   │
  │  用服务器公钥加密Pre-Master Secret（或ECDHE算出）  │
  │                                                │
  │  ⑥ Finished (加密 handshake消息)               │
  │  ──────────────────────────────────────────→   │
  │  用协商出的密钥加密                              │
  │                                                │
  │        ⑦ ChangeCipherSpec + Finished            │
  │        ←────────────────────────────────────   │
  │        双方此后通信加密                            │
  │                                                │
  总计：2个RTT（往返延迟）                           │
  密钥推导：                                         │
  master_secret = PRF(pre_master_secret,            │
                    "master secret",                 │
                    ClientRandom + ServerRandom)      │
  → 从master_secret推导出：加密密钥、MAC密钥、IV      │
\`\`\`

### TLS 1.3 握手优化（1-RTT / 0-RTT）

\`\`\`
TLS 1.3的重大改进：

1. 握手从2-RTT缩短为1-RTT（首次连接）
   ClientHello中就携带KeyShare（密钥共享材料）
   减少了一个往返

2. 支持0-RTT恢复（Session Resumption）
   复用之前的session → 第一个数据包就可以携带应用数据
   但有重放攻击风险（仅用于幂等的GET请求）

3. 移除了不安全的算法
   ❌ 移除：RC4、DES、3DES、CBC模式、SHA-1
   ❌ 移除：静态RSA/DH密钥交换
   ✅ 强制：ECDHE（前向安全Forward Secrecy）
   ✅ 强制：AEAD加密（AES-GCM / ChaCha20-Poly1305）

4. 加密Server Certificate
   TLS 1.2中证书明文传输（可被窥探域名）
   TLS 1.3中扩展加密（Encrypted Server Name Indication）
\`\`\`

### 证书链验证

\`\`\`
证书验证流程（当浏览器访问 https://www.example.com 时）：

1. 服务器发送证书链：
   ┌─────────────────────────────┐
   │  Leaf Cert (www.example.com)  │  ← 你的网站证书
   │  Subject: CN=*.example.com    │
   │  Issuer:  CA-Intermediate     │
   │  Signature: [用Intermediate  │
   │            的私钥签名]        │
   ├─────────────────────────────┤
   │  Intermediate CA Cert         │  ← 中间CA证书
   │  Subject: CN=CA-Intermediate  │
   │  Issuer:  Root-CA            │
   │  Signature: [用Root CA私钥签名]│
   ├─────────────────────────────┤
   │  Root CA Cert (可选)          │  ← 根CA证书
   │  Subject: CN=Root-CA          │
   │  Issuer:  Root-CA (自签名)    │
   └─────────────────────────────┘

2. 验证步骤：
   ① 检查Leaf Cert的有效期（NotBefore ≤ Now ≤ NotAfter）
   ② 检查Leaf Cert的域名是否匹配（SAN/CN字段）
   ③ 验证Leaf Cert的签名：
      → 取出Issuer指定的公钥（来自Intermediate Cert）
      → 验证数字签名是否有效 ✓
   ④ 同样验证Intermediate Cert的签名（用Root CA公钥）
   ⑤ 验证Root CA是否在信任锚点列表中（OS/浏览器的CA存储）
   ⑥ 检查证书撤销状态（CRL/OCSP Stapling）

3. 信任锚点（Trust Anchors）：
   ├── Windows: certmgr.msc → 受信任的根证书颁发机构
   ├── macOS: Keychain Access → System Roots
   ├── Linux: /etc/ssl/certs/
   ├── Mozilla NSS: 内置150+根CA
   └── 中国：CNNIC根证书、CFCA根证书等
\`\`\`

### HSTS配置

\`\`\`nginx
# HSTS: 强制浏览器只使用HTTPS访问
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# 参数说明：
# max-age=31536000  → 365天内只允许HTTPS（单位秒）
# includeSubDomains → 所有子域名也强制HTTPS
# preload           → 加入浏览器预加载列表（提交到 hstspreload.org）
# always            → 即使内部重定向也添加此头

# 注意：一旦启用HSTS且max-age很长，
# 如果你的SSL证书出了问题，用户在过期前无法访问你的网站！
# 所以测试环境不要启用HSTS。
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["网络协议", "HTTPS", "TLS", "SSL证书", "网络安全"]
  },

  // ==================== 设计模式补充 (第81-84题) ====================

  {
    title: "设计模式：责任链模式与过滤器链",
    content: `## 题目描述

责任链模式（Chain of Responsibility）在实际框架中有广泛应用：

### 核心问题
1. **模式定义**：将请求沿着处理者链传递，直到有一个处理者处理它
2. **经典案例**：Servlet Filter Chain、Spring Interceptor、Netty ChannelPipeline
3. **与策略模式的区别**：责任链是多个处理者依次尝试；策略是选择一个执行
4. **动态增删节点**：如何在运行时添加/移除/调整处理器的顺序？
5. **手写实现**：一个可插拔的请求处理管道（类似中间件/middleware）`,
    solution: `## 深度解析

### 经典应用对比

\`\`\`
┌──────────────────────────────────────────────────────────┐
│              责任链模式的三大经典应用                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Servlet Filter Chain（Java Web）                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  request → [Filter1] → [Filter2] → [Filter3] → Servlet│   │
│  │                                                  │   │
│  │  Filter1: CharacterEncodingFilter (UTF-8编码)     │   │
│  │  Filter2: CorsFilter (跨域处理)                   │   │
│  │  Filter3: JwtAuthFilter (JWT认证)                │   │
│  │                                                  │   │
│  │  每个Filter可以选择：                              │   │
│  │  - chain.doFilter(request, response) → 传递给下一个│   │
│  │  - 直接return → 截断后续Filter                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  2. Spring MVC Interceptor                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  HandlerInterceptor接口：                          │   │
│  │  preHandle()  → Controller执行前                   │   │
│  │  postHandle() → Controller执行后，视图渲染前        │   │
│  │  afterCompletion() → 视图渲染后（无论成功失败）     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  3. Netty ChannelPipeline                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ChannelPipeline pipeline = ch.pipeline();          │   │
│  │  pipeline.addLast("decoder", new HttpServerCodec());│   │
│  │  pipeline.addLast("compressor", new HttpContentCompressor());│
│  │  pipeline.addLast("handler", new BizHandler());    │   │
│  │                                                  │   │
│  │  Inbound: decoder → handler (入站方向)           │   │
│  │  Outbound: compressor (出站方向)                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
\`\`\`

### 手写简易中间件管道

\`\`\`java
/**
 * 可插拔的责任链（类似Express/Koa middleware）
 */
@FunctionalComponent
public interface Middleware {
    void handle(Context ctx, MiddlewareChain chain) throws Exception;
}

public class Context {
    private Map<String, Object> attributes = new HashMap<>();
    private HttpServletRequest request;
    private HttpServletResponse response;

    public Object get(String key) { return attributes.get(key); }
    public void set(String key, Object value) { attributes.put(key, value); }
}

public class MiddlewareChain {
    private final List<Middleware> middlewares;
    private final int index;

    public MiddlewareChain(List<Middleware> middlewares, int index) {
        this.middlewares = middlewares;
        this.index = index;
    }

    public void proceed(Context ctx) throws Exception {
        if (index < middlewares.size()) {
            // 创建下一个链条节点
            MiddlewareChain next = new MiddlewareChain(middlewares, index + 1);
            middlewares.get(index).handle(ctx, next);
        }
        // index == size 表示所有middleware都已执行完毕
    }
}

// ========== 具体Middleware实现 ==========

@Component
public class AuthMiddleware implements Middleware {
    @Override
    public void handle(Context ctx, MiddlewareChain chain) throws Exception {
        String token = ctx.request.getHeader("Authorization");
        if (token == null || !JwtUtil.verify(token)) {
            ctx.response.sendError(401, "Unauthorized");
            return;  // 不调用chain.proceed() → 截断！
        }
        ctx.set("userId", JwtUtil.getUserId(token));
        chain.proceed(ctx);  // 放行给下一个middleware
    }
}

@Component
public class LoggingMiddleware implements Middleware {
    @Override
    public void handle(Context ctx, MiddlewareChain chain) throws Exception {
        long start = System.currentTimeMillis();
        System.out.println("[START] " + ctx.request.getRequestURI());
        try {
            chain.proceed(ctx);
        } finally {
            long cost = System.currentTimeMillis() - start;
            System.out.println("[END] cost=" + cost + "ms");
        }
    }
}

@Component
public class RateLimitMiddleware implements Middleware {
    @Override
    public void handle(Context ctx, MiddlewareChain chain) throws Exception {
        String ip = ctx.request.getRemoteAddr();
        if (!rateLimiter.tryAcquire(ip)) {
            ctx.response.sendError(429, "Too Many Requests");
            return;
        }
        chain.proceed(ctx);
    }
}
\`\`\`

**责任链 vs 其他模式的区别：**

| 模式 | 决策方式 | 处理者数量 | 关系 |
|------|---------|-----------|------|
| **责任链** | 依次尝试，谁处理谁负责 | 多个 | 链式 |
| **策略** | 选择其中一个执行 | 一个（选中） | 替代关系 |
| **装饰器** | 全部执行，层层包装 | 多个 | 包装关系 |
| **观察者** | 发布后所有订阅者执行 | 多个（并行） | 广播关系 |`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "责任链", "过滤器链", "中间件", "Servlet"]
  },

  // ==================== 更多综合题目 (第85-110题) ====================

  {
    title: "Redis高性能数据结构与底层实现",
    content: `## 题目描述

Redis之所以快，与其精心设计的数据结构密不可分：

### 核心问题
1. **五种基本类型的底层数据结构**：String(SDS)、List(quicklist/ziplist)、Set(intset/hashtable)、Hash(ziplist/listpack+hashtable)、ZSet(skiplist+hashtable)
2. **SDS（Simple Dynamic String）**：为什么不用C语言原生的char*？SDS的优势
3. **跳表（skiplist）**：为什么ZSet选择跳表而不是红黑树/B+树？
4. **HyperLogLog**：用12KB内存统计亿级UV的原理（基数估计算法）
5. **Stream类型**：Redis 5.0新增的消息队列类型，与List/Pub/Sub/Kafka的对比`,
    solution: `## 深度解析

### SDS vs C字符串

\`\`\`
struct sdshdr {
    int len;        // 已使用长度（O(1)获取长度，无需遍历！）
    int alloc;      // 分配的总空间（预分配，减少realloc）
    unsigned char flags;  // 标志位（标识SDS类型：sdshdr8/16/32/64）
    char buf[];     //柔性数组，存储实际字符串内容
};

SDS优势：
├── O(1)获取字符串长度（C字符串需要strlen遍历到\\0）
├── 杜绝缓冲区溢出（SDS检查alloc空间不足时自动扩容）
├── 减少内存重分配次数（空间预分配 + 惰性释放）
├── 二进制安全（不依赖\\0判断结束，可存储任意二进制数据）
└── 兼容部分C字符串函数（末尾仍然保留\\0）
\`\`\`

### ZSet跳表 vs 红黑树的选择理由

\`\`\`
Redis作者antirez的解释（为什么ZSet用skiplist而非rbtree）：

1. 内存占用
   ├── skiplist: 每个节点平均1.33个指针（概率决定层数）
   └── rbtree: 每个节点需要2个指针(left/right) + 1个color位
   → 跳表内存略省

2. 实现复杂度
   ├── skiplist: 代码简洁易懂，调试方便
   └── rbtree: 旋转/着色逻辑复杂，边界条件多
   → 跳表更容易正确实现和维护

3. 范围查询性能
   ├── skiplist: 范围查询O(logN + K)，K为范围大小，天然有序链表
   └── rbtree: 需要中序遍历，虽然也是O(logN + K)，但有常数开销
   → 跳表的顺序访问对CPU缓存更友好

4. 并发友好性
   └── skiplist局部性更好（插入/删除影响范围小）

结论：在Redis这种内存数据库场景下，跳表的综合表现更优。
但在通用场景（如STL map/set），红黑树仍然是首选。
\`\`\`

### HyperLogLog原理

\`\`\`
问题：统计一个集合中不同元素的基数（Cardinality，即去重后的元素个数）
朴素方案：HashSet存储所有元素 → 内存爆炸（1亿UV ≈ 3GB+）

HyperLogLog方案：仅需12KB内存，误差率约0.81%

核心思想：伯努利试验（Bit Observation）

算法流程：
1. 对于集合中的每个元素element：
   a. 计算hash(element) → 得到一个很长的二进制串（如64bit）
   b. 找到该二进制串中第一个出现1的位置（从低位开始计数）
      例：hash = ...00101000 → 第一个1在第4位（从0开始）
   c. 记录这个位置值（称为rank）

2. 对所有元素的rank值，取最大值：R = max(rank_1, rank_2, ..., rank_n)

3. 估算基数：Cardinality ≈ 2^R / constant

直觉理解：
├── 如果基数为1万，那么hash后出现很长的连续0的概率很低
├── 一旦出现了很长的连续0（比如前20位都是0），说明基数很大
└── 通过最大连续0的位数来反推基数大小

误差控制：
├── 分桶（m个桶，默认16384个）→ 每个桶独立估算 → 取调和平均值
├── 12KB = 16384 buckets × 6 bits/bucket
└── 标准误差 ≈ 1.04 / √m ≈ 0.81%

Redis命令：
PFADD hll:user:20240101 uid1 uid2 uid3 ...
PFCOUNT hll:user:20240101    → 返回估算的UV数
PFMERGE hll:week hll:mon hll:tue hll:wed ...  → 合并多个HLL
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Redis", "数据结构", "SDS", "跳表"]
  },

  {
    title: "MySQL Binlog主从复制与GTID原理",
    content: `## 题目描述

MySQL主从复制是高可用架构的核心：

### 核心问题
1. **三种Binlog格式**：STATEMENT（基于SQL）、ROW（基于行）、MIXED（混合）的优劣
2. **主从复制流程**：Dump Thread、I/O Thread、SQL Thread三个线程的协作
3. **GTID（Global Transaction Identifier）**：解决了传统position复制的什么痛点？
4. **主从延迟的原因与监控**：Seconds_Behind_Master的含义？如何解决？
5. **半同步复制（Semi-Sync）**：如何平衡数据一致性与可用性？`,
    solution: `## 深度解析

### 三种Binlog格式对比

| 维度 | STATEMENT | ROW | MIXED |
|------|----------|-----|-------|
| **记录内容** | SQL语句原文 | 行级别的变更（before/after image） | 自动选择 |
| **日志量** | 小（一条SQL） | 大（受影响的每一行） | 中等 |
| **安全性** | ⚠️ 不确定性的函数可能导致主从不一致 | ✅ 保证主从一致 | ⚠️ 部分场景不一致 |
| **可读性** | ✅ 人眼可读 | ❌ 二进制编码 | 部分 |
| ** flashback** | ❌ 不支持 | ✅ 可以逆向回滚 | 部分 |
| **推荐场景** | 已废弃 | ✅ 生产首选 | 已废弃 |

### 主从复制完整流程

\`\`\`
┌──────────────────┐         ┌──────────────────┐
│    Master 主库    │         │    Slave 从库     │
│                  │         │                  │
│  Client写入      │         │                  │
│  ┌──────────┐    │         │                  │
│  │ Binlog   │    │ binlog dump │ I/O Thread     │
│  │ (binary  │◄───┼────────────│► Relay Log      │
│  │  log)    │    │            │ (中继日志)       │
│  └──────────┘    │            └──────┬─────────┘
│                  │                   │
│  Binlog写入磁盘  │            SQL Thread
│  (sync_binlog=1) │                   │
│                  │                   ▼
│                  │            重放Relay Log中的SQL
│                  │            更新Slave的数据
│                  │
└──────────────────┘         └──────────────────┘

详细步骤：
1. Master上的事务提交时：
   ├── 写入InnoDB Redo Log（保证持久化）
   ├── 写入Binlog（记录变更）
   ├── commit（向Slave返回ACK）
   └── sync_binlog=1确保每次commit都fsync到磁盘

2. Slave端的I/O Thread：
   ├── 连接Master的Binlog（通过CHANGE MASTER TO配置）
   ├── 读取Master推送的Binlog事件
   └── 写入本地的Relay Log（中继日志）

3. Slave端的SQL Thread：
   ├── 读取Relay Log
   ├── 重放其中的事件（执行相同的SQL/应用相同的行变更）
   └── 更新Slave的数据使其与Master一致

关键点：Slave是单线程重放的！（MySQL 5.6之前）
→ 如果Master上有大事务/长时间DDL，会导致Slave严重延迟
→ MySQL 5.6引入MTS（Multi-Threaded Slave）支持并行重放
\`\`\`

### GTID原理

\`\`\`
传统Position复制的痛点：
├── 需要手动指定binlog file name + position
├── 主从切换时容易出错（找错position导致数据丢失或重复）
├── 无法直观地知道哪些事务已被执行
└── 从库故障修复困难

GTID（Global Transaction Identifier）解决方案：

GTID格式：UUID:TransactionID
例：3E11FA47-71CA-11E1-9E33-C80AA9429562:23

├── UUID：MySQL Server实例的唯一标识（首次启动时生成）
└── TransactionID：该实例上执行的事务序号（递增）

优势：
├── 不需要关心具体的binlog position
├── 主从切换简单：CHANGE MASTER TO MASTER_AUTO_POSITION=1
├── GTID保证事务只被执行一次（幂等性）
└── 方便追踪事务在集群中的传播路径

配置示例：
# Master
gtid_mode = ON
enforce_gtid_consistency = ON
binlog_format = ROW

# Slave
CHANGE MASTER TO
  MASTER_HOST='master_ip',
  MASTER_AUTO_POSITION=1;  # 自动找GTID位点
\`\`\`

### 主从延迟解决方案

\`\`\`
原因分析：
├── Slave单线程重放跟不上Master写入速度（最常见）
├── 大事务/长事务（如大批量DELETE/UPDATE）
├── 网络延迟（跨机房部署）
├── Slave机器硬件性能差
└── DDL语句阻塞（ALTER TABLE加元数据锁）

监控指标：
SHOW SLAVE STATUS\\G
  Seconds_Behind_Master: 0  -- 延迟秒数（0表示无延迟）
  Executed_Gtid_Set: xxx     -- 已执行的GTID集合
  Retrieved_Gtid_Set: xxx    -- 已接收的GTID集合

解决方案：
├── MTS（Multi-Threaded Slave）：并行重放（按库/表分组）
├── 避免大事务：拆分为小批次（每次<1000行）
├── 读写分离：写走Master，读走Slave（减轻Slave压力）
├── 半同步复制：Master等待至少一个Slave确认后才返回成功
├── MGR（MySQL Group Replication）：基于Paxos的多主复制
└── 极端方案：并行复制（pt-slave-delay-check / Ghost克隆）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "MySQL", "主从复制", "Binlog", "GTID"]
  },

  // ==================== 最后一批补充 (第70-110题) ====================

  {
    title: "实现并查集（Union-Find）数据结构",
    content: `## 题目描述

并查集（Disjoint Set Union, DSU）是一种用于处理不相交集合合并与查询的数据结构：

### 要求
1. 实现 \`find(x)\`：查找x所在集合的代表元（根节点）
2. 实现 \`union(x, y)\`：合并x和y所在的集合
3. **路径压缩**（Path Compression）：在find时将节点直接指向根
4. **按秩合并**（Union by Rank）：将矮树接到高树下面
5. 应用场景：连通分量检测、Kruskal最小生成树、等式方程的可满足性`,
    codeTemplate: {
      javascript: `/**
 * 并查集（Union-Find）- 带路径压缩和按秩合并
 */
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);  // 初始每个元素自成一个集合
    this.rank = new Array(n).fill(0);  // 秩（树的近似高度）
    this.count = n;  // 连通分量数
  }

  find(x) {
    // TODO: 实现带路径压缩的查找（递归或迭代均可）
    // 路径压缩：将x的父节点直接设为根节点
  }

  union(x, y) {
    // TODO: 实现按秩合并
    // 找到两个根节点，如果不同则合并
    // 秩小的树挂到秩大的树下
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  getCount() { return this.count; }
}

// 应用：Kruskal最小生成树
function kruskal(n, edges) {
  // edges: [[weight, u, v], ...]
  const uf = new UnionFind(n);
  edges.sort((a, b) => a[0] - b[0]);  // 按权值排序
  let mst = [];
  let totalWeight = 0;

  for (const [w, u, v] of edges) {
    if (!uf.connected(u, v)) {
      uf.union(u, v);
      mst.push([w, u, v]);
      totalWeight += w;
      if (mst.length === n - 1) break;
    }
  }
  return { mst, totalWeight };
}`,
      python: `"""
并查集（Disjoint Set Union）
"""

class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, x: int) -> int:
        # TODO: 实现带路径压缩的查找
        # 递归版本或迭代版本都可以
        pass

    def union(self, x: int, y: int) -> None:
        # TODO: 按秩合并
        pass

    def is_connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)


# 应用：判断无向图是否有环
def has_cycle(n: int, edges: list) -> bool:
    """
    :param n: 节点数
    :param edges: 边列表 [(u, v), ...]
    :return: 是否有环
    """
    # TODO: 使用并查集检测环
    pass`,
      java: `/**
 * 并查集 - Java实现（泛型支持）
 */
public class UnionFind {

    private final int[] parent;
    private final int[] rank;
    private int count;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;  // 可选：按size合并时用size数组代替rank
        }
    }

    /** 带路径压缩的查找 */
    public int find(int x) {
        // TODO: 实现路径压缩（递归/迭代）
        return -1;
    }

    /** 按秩合并 */
    public void union(int x, int y) {
        // TODO: 实现
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getCount() { return count; }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "数据结构", "并查集", "图论", "Kruskal"]
  },

  {
    title: "Java反射机制原理与应用场景",
    content: `## 题目描述

Java反射是框架设计的基石：

### 核心问题
1. **反射API**：Class对象获取方式、Constructor/Field/Method的使用
2. **性能开销**：反射比直接调用慢多少？为什么？如何优化？
3. **破坏封装性**：如何访问private字段/方法？setAccessible(true)的安全影响
4. **实际应用**：Spring IoC依赖注入、Jackson序列化、JDBC驱动加载、动态代理
5. **反射 vs 编译期类型检查**：何时该用反射？何时不该用？`,
    solution: `## 深度解析

### 反射核心API速查

\`\`\`java
// ========== 获取Class对象的四种方式 ==========
// 方式一：类名.class（编译期已知类名，最安全）
Class<String> clazz1 = String.class;

// 方式二：对象.getClass()（运行时已知对象）
String str = "hello";
Class<?> clazz2 = str.getClass();

// 方式三：Class.forName()（运行时动态加载，最灵活）
Class<?> clazz3 = Class.forName("java.lang.String");

// 方式四：ClassLoader.loadClass()
Class<?> clazz4 = getClass().getClassLoader().loadClass("java.lang.String");

// ========== 创建实例 ==========
// 无参构造
Object obj1 = clazz.getDeclaredConstructor().newInstance();

// 有参构造
Constructor<BigDecimal> ctor = BigDecimal.class.getConstructor(String.class);
BigDecimal bd = ctor.newInstance("123.456");

// ========== 访问字段 ==========
Field nameField = Person.class.getDeclaredField("name");
nameField.setAccessible(true);  // 突破private限制！
String value = (String) nameField.get(personObj);

// ========== 调用方法 ==========
Method method = Math.class.getMethod("max", int.class, int.class);
int result = (int) method.invoke(null, 10, 20);

// ========== 数组操作 ==========
int[] arr = (int[]) Array.newInstance(int.class, 10);
Array.set(arr, 5, 42);
int val = Array.getInt(arr, 5);

// ========== 泽型擦除后的类型信息 ==========
Type type = List.class.getMethod("add", Object.class)
    .getGenericParameterTypes()[0];  // E → Object（擦除后）
\`\`\`

### 性能分析

\`\`\`
反射 vs 直接调用 性能对比（JDK 8 / HotSpot C2编译后）：

操作              直接调用     反射调用      差异倍数
─────────────   ─────────   ──────────   ─────────
方法调用           ~5ns       ~50-100ns     10-20x
字段访问           ~2ns       ~30-50ns     15-25x
创建实例          ~10ns      ~100-200ns    10-20x

慢的原因：
├── 方法内联失效（JIT无法内联虚分发的方法）
├── 参数装箱/拆箱（需要构造Object数组传参）
├── 安全检查（每次调用都检查setAccessible等）
├── 无法利用JVM优化（如逃逸分析、标量替换）
└── 可能触发自动装箱（基本类型→包装类型）

优化方案：
├── 缓存Method/Field/Constructor对象（避免重复查找）
├── MethodHandle（Java 7+，比反射快但不如直接调用）
│   MethodHandles.lookup().findVirtual(...)
├── Code Generation（ASM/ByteBuddy动态生成字节码）
└── 如果确实需要高频反射调用，考虑生成适配代码

注意：JDK 17+ 对反射做了大量优化，
部分场景下 MethodHandle 已经接近直接调用的性能。
\`\`\`

### Spring中的反射应用

\`\`\`
Spring IoC容器使用反射的核心流程：

1. 解析Bean定义（XML/注解/Java Config）
2. 通过反射创建Bean实例：
   Constructor<?> ctor = beanClass.getDeclaredConstructor();
   Object instance = ctor.newInstance();

3. 注入依赖（字段注入/Setter注入）：
   for (Field field : dependencyFields) {
       field.setAccessible(true);
       Object dep = applicationContext.getBean(field.getType());
       field.set(instance, dep);  // 反射赋值！
   }

4. 处理@PostConstruct/@PreDestroy注解：
   for (Method method : declaredMethods) {
       if (method.isAnnotationPresent(PostConstruct.class)) {
           method.setAccessible(true);
           method.invoke(beanInstance);  // 反射调用！
       }
   }

5. AOP代理创建：
   Proxy.newProxyInstance(classLoader, interfaces, invocationHandler)
   // 或 Enhancer.create() for CGLIB proxy
\`\`\`

**使用建议：**
- ✅ 框架开发、工具类、序列化/反序列化、插件系统
- ❌ 业务逻辑中避免过度使用（破坏类型安全、降低可读性）
- ⚠️ 安全敏感场景需谨慎（setAccessible可能被SecurityManager拦截）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java核心", "反射", "框架设计", "Spring", "性能"]
  },

  {
    title: "Nginx高可用架构与性能调优",
    content: `## 题目描述

Nginx是互联网公司最常用的反向代理服务器：

### 核心问题
1. **高可用架构**：Keepalived + VIP实现主备切换的完整配置？
2. **负载均衡策略**：轮询/加权/IP哈希/最少连接/一致性哈希的选择
3. **性能优化参数**：worker_processes/worker_connections/sendfile/tcp_nopush等关键配置
4. **限流与防护**：连接数限制、请求速率限制（limit_req_zone）、带宽限制
5. **HTTPS配置**：SSL/TLS优化（Session复用、OCSP Stapling、HSTS）`,
    solution: `## 深度解析

### 高可用架构（Keepalived + Nginx）

\`\`\`
                    ┌─────────────────────┐
                    │   VIP: 192.168.1.100 │  （虚拟IP，漂移在两台机器间）
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────────┐
    │  Nginx Master   │ │  Nginx Backup   │
    │  192.168.1.101  │ │  192.168.1.102  │
    │                 │ │                 │
    │  Keepalived     │ │  Keepalived     │
    │  state MASTER   │ │  state BACKUP   │
    │  priority 100   │ │  priority 90    │
    │  vrrp_script:   │ │                 │
    │  check_nginx   │ │                 │
    └────────┬────────┘ └────────┬────────┘
             │                   │
             └─────────┬─────────┘
                       ▼
              ┌─────────────────┐
              │  Upstream Servers│
              │  App1  App2  App3│
              └─────────────────┘

Keepalived配置（Master端）：
! Configuration File for keepalived
global_defs {
   router_id NGINX_MASTER
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass your_secret
    }
    virtual_ipaddress {
        192.168.1.100/24
    }
    track_script {
        check_nginx  # 健康检查脚本
    }
}
vrrp_script check_nginx {
    script "/usr/local/bin/check_nginx.sh"  # 检测Nginx是否存活
    interval 2
    weight -20  # 检测失败优先级减20（低于Backup则切换）
}
\`\`\`

### 核心性能配置

\`\`\`nginx
# nginx.conf 生产环境推荐配置

# Worker进程数（通常等于CPU核数）
worker_processes auto;  # 自动检测CPU核心数
worker_rlimit_nofile 65535;  # 最大文件描述符数

events {
    worker_connections 65535;  # 每个Worker最大连接数
    use epoll;               # Linux下使用epoll
    multi_accept on;         # 一次接受多个连接
}

http {
    # ====== 高效数据传输 ======
    sendfile on;             # 零拷贝技术（内核态直接发送文件）
    tcp_nopush on;          # 优化sendfile的数据包发送
    tcp_nodelay on;         # 禁用Nagle算法（减少小包延迟）

    # ====== Gzip压缩 ======
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # ====== 缓存控制 ======
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;

    # ====== 日志优化 ======
    access_log /var/log/nginx/access.log main buffer=32k flush=5s;

    # ====== 超时设置 ======
    client_body_timeout 30s;
    client_header_timeout 30s;
    keepalive_timeout 65;
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;

    # ====== Buffer设置 ======
    client_max_body_size 50m;
    proxy_buffering on;
    proxy_buffer_size 16k;
    proxy_buffers 8 16k;

    upstream backend {
        least_conn;  # 最少连接负载均衡
        server 10.0.0.1:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.0.2:8080 weight=3 backup;  # 备用节点
        server 10.0.0.3:8080 weight=2 down;     # 维护中
        keepalive 32;  # 长连接池大小
    }

    # ====== 限流配置 ======
    limit_req_zone $binary_remote_addr zone=ip_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 443 ssl http2;
        server_name example.com;

        # SSL优化
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;  # 减少TLS握手开销
        ssl_stapling on;          # OCSP Stapling
        ssl_stapling_verify on;

        location /api/ {
            limit_req zone=ip_limit burst=20 nodelay;
            limit_conn conn_limit 10;
            proxy_pass http://backend;
        }

        location /static/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
\`\`\`

**QPS估算公式：**
\`\`\`
最大QPS = worker_processes × worker_connections / (平均请求耗时)

例：8核CPU, 8 workers, 65535 connections, 平均响应时间100ms
最大QPS ≈ 8 × 65535 / 0.1 ≈ 524万 QPS（理论极限）

实际瓶颈通常在网络带宽和后端服务能力上。
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["DevOps", "Nginx", "高可用", "Keepalived", "负载均衡"]
  },

  {
    title: "消息队列选型：Kafka vs RocketMQ vs RabbitMQ",
    content: `## 题目描述

消息队列(MQ)是分布式系统的核心组件之一：

### 对比维度
1. **架构模型**：点对点(P2P) vs 发布订阅(Pub/Sub)、集中式Broker vs 去中心化
2. **消息可靠性**：ACK机制、持久化、副本同步、事务消息
3. **吞吐量与时延**：百万级QPS vs 毫秒级延迟的权衡
4. **消费模式**：拉取(Pull) vs 推送(Push)、消费组(Consumer Group)
5. **消息顺序性**：全局有序 vs 分区有序 vs 无序
6. **回溯消费**：是否支持重置offset重新消费历史消息？`,
    solution: `## 深度对比矩阵

| 维度 | Kafka | RocketMQ | RabbitMQ |
|------|-------|-----------|----------|
| **语言** | Scala/Java | Java | Erlang |
| **协议** | 自定义TCP | 自定义TCP | AMQP |
| **吞吐量** | ⭐⭐⭐⭐⭐ 百万级 | ⭐⭐⭐⭐ 十万级 | ⭐⭐ 万级 |
| **延迟** | ms级 | ms级 | μs级 |
| **可靠性** | 多副本同步 | 同步/异步刷盘 | 镜像队列/确认模式 |
| **顺序性** | 分区内有序 | 全局/分区有序 | 无保证 |
| **回溯消费** | ✅ 支持任意offset | ✅ 支持时间戳/offset | ❌ 不支持 |
| **事务消息** | ❌ 不支持 | ✅ 支持（半消息） | ✅ Publisher Confirms |
| **定时消息** | ❌ 不支持 | ✅ 支持 | ⚠️ 插件支持 |
| **死信队列** | ❌ 需自行实现 | ✅ 内置DLQ | ✅ DLX |
| **消息轨迹** | ⚠️ 社区方案 | ✅ 原生TraceMsg | ⚠️ Firehose |
| **运维复杂度** | 中（ZooKeeper依赖） | 中（NameServer+Broker） | 低 |
| **适用场景** | 大数据/日志/用户行为 | 金融/电商/订单 | 传统企业集成 |

### 选型决策树

\`\`\`
你的场景？
├── 吞吐量要求极高（日志收集/用户行为追踪/实时计算）
│   └── Kafka（首选，生态完善，Spark/Flink/Kafka Streams原生支持）
│
├── 业务消息（订单/支付/通知），对可靠性要求极高
│   ├── 需要事务消息/定时消息/顺序消息？
│   │   └── RocketMQ（阿里系，功能全面，国内生态成熟）
│   └── 团队熟悉AMQP协议，中小规模？
│       └── RabbitMQ（管理界面友好，社区活跃）
│
├── IoT/边缘计算场景（设备资源受限）
│   └── MQTT协议 → EMQ X / Mosquitto
│
├── 云原生/Kubernetes环境
│   └── NATS（轻量级云原生消息系统）
│
└── 极致低延迟需求（高频交易/游戏）
    └── ZeroMQ / gRPC streaming（不是传统MQ）
\`\`\`

### Kafka深度架构

\`\`\`
┌─────────────────────────────────────────────────────┐
│                  Kafka Cluster                      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Broker-0 │  │ Broker-1 │  │ Broker-2 │         │
│  │          │  │          │  │          │         │
│  │ Topic-A  │  │ Topic-A  │  │ Topic-A  │         │
│  │ P0 P1 P2 │  │ P3 P4 P5 │  │ P6 P7 P8 │  ← 分区 │
│  │ Leader   │  │ Leader   │  │ Leader   │         │
│  │ Follower │  │ Follower │  │ Follower │  ← ISR  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │              │              │               │
│       └──────────────┼──────────────┘               │
│                      ▼                              │
│              ZooKeeper Cluster                     │
│              (元数据存储/Controller选举)             │
└─────────────────────────────────────────────────────┘

Producer → 选择Partition → Leader写入 → ISR副本同步 → ACK
Consumer Group → Group协调者(Coordinator) → Rebalance → 消费分配

ISR(In-Sync Replicas)：同步副本列表
├── min.insync.replicas = 2（至少2个副本确认才算成功）
├── unclean.leader.election.enable = false（不允许非ISR成员当选Leader）
└── acks=all（Producer等待所有ISR确认）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "消息队列", "Kafka", "RocketMQ", "RabbitMQ", "选型"]
  },

  {
    title: "设计一个分布式配置中心",
    content: `## 题目描述

配置中心是微服务基础设施的重要组件：

### 功能需求
1. **配置管理**：增删改查配置项、版本管理、灰度发布
2. **实时推送**：配置变更后毫秒级推送到所有客户端
3. **多环境支持**：dev/test/staging/prod环境隔离
4. **权限控制**：谁可以修改哪些配置？审计日志
5. **高可用**：任何单点故障不影响配置读取

### 参考产品
Apollo（携程开源）、Nacos（阿里巴巴）、Spring Cloud Config、Consul KV、etcd`,
    solution: `## 深度解析

### 整体架构

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    配置中心架构                          │
│                                                         │
│  ┌──────────┐    HTTP/gRPC     ┌────────────────────┐  │
│  │ Admin UI │ ◄──────────────► │   Config Server     │  │
│  │ (管理后台)│                 │   (集群部署)         │  │
│  └──────────┘                 │  ┌─────┬─────┬─────┐  │  │
│                                │  │ Srv1│ Srv2│ Srv3│  │  │
│  ┌──────────┐                 │  └──┬──┴──┬──┴──┘  │  │
│  │ Client   │ ◄── LongPolling ─┤     │     │        │  │
│  │ SDK      │                 └─────┼─────┼────────┘  │  │
│  └──────────┘                       │     │           │
│                                      ▼     ▼           │
│                              ┌──────────┐           │
│                              │   MySQL   │           │
│                              │ (配置存储) │           │
│                              └──────────┘           │
│                                                         │
│  核心机制：                                            │
│  1. 配置变更 → 写入DB → 版本号+1                        │
│  2. 通知Config Server集群（消息队列/DB轮询）           │
│  3. Server比对客户端当前版本号                            │
│  4. 有新版本 → 推送变更给Client                         │
│  5. Client应用配置 → 触发回调/刷新上下文                  │
└─────────────────────────────────────────────────────────┘
\`\`\`

### 关键技术：长轮询（Long Polling）

\`\`\`
为什么不用短轮询或WebSocket？

├── 短轮询：每秒请求一次 → 浪费资源，延迟最高1秒
├── WebSocket：双向实时但维护成本高，Server需维护大量连接
└── 长轮询：兼顾实时性和资源效率（Nacos/Apollo均采用此方案）

长轮询流程：
Client                          Server
  │                               │
  │  GET /config/v2/namespaces/   │
  │  app?appId=test&cluster=default │
  │  &dataId=user-service&         │
  │  group=DEFAULT_GROUP&          │
  │  clientVersion=15              │
  │  longPullTimeout=30000         │  ← 等待30秒
  │ ──────────────────────────────→│
  │                               │
  │                    (Server挂起请求)
  │                               │  ① 检查是否有新配置
  │                               │  ├─ 没有 → hold住请求最多30秒
  │                               │  └─ 有新配置 → 立即返回
  │                               │
  │  ←── 200 OK (新配置JSON) ──────│  ② 返回结果
  │                               │
  │  应用新配置                     │
  │  立即发起下一次长轮询            │
  │ ──────────────────────────────→│
  │                               │
  │  ←── 304 Not Modified ────────│  ③ 30秒超时无变化
  │  (立即重新发起请求)             │
  │                               │
优势：
├── 服务端主动推送感（客户端感知为"即时"）
├── 无需维持长连接（HTTP请求即可）
├── 服务端hold请求不消耗线程（异步Servlet/NIO）
└── 客户端实现简单（标准HTTP + 定时器）
\`\`\`

### 灰度发布实现

\`\`\`
场景：user-service的新配置只想让10%的用户生效验证

实现方式：
1. 基于IP Hash的灰度
   → 将客户端IP取模，0-9分到10个bucket
   → 只更新bucket 0的配置
   → 问题：不够精确，无法按用户ID灰度

2. 基于标签(Tag)的灰度（推荐）
   → Client注册时携带标签：env=gray, version=v2.0
   → 服务端根据标签匹配规则返回不同配置
   → Apollo: namespace隔离 + 灰度发布规则
   → Nacos: beta发布 + IP白名单/标签选择

3. Feature Flag（功能开关）
   → 配置中嵌入开关：feature.new_checkout.enabled=true
   → 结合用户ID/百分比/白名单做细粒度控制
   → 开关关闭时立即回滚，无需重启
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["系统设计", "配置中心", "Apollo", "Nacos", "微服务"]
  },

  {
    title: "Java类加载机制与双亲委派模型",
    content: `## 题目描述

Java类加载机制是理解JVM运行原理的关键：

### 核心问题
1. **类加载过程**：加载(Linking) → 验证(Verification) → 准备(Preparation) → 解析(Resolution) → 初始化(Initialization)
2. **双亲委派模型（Parent Delegation Model）**：为什么需要？如何打破？
3. **三类加载器**：Bootstrap ClassLoader / Extension ClassLoader / Application ClassLoader
4. **自定义类加载器**：热部署、OSGi模块化、加密类加载的场景
5. **ClassNotFoundException vs NoClassDefFoundError**的区别`,
    solution: `## 深度解析

### 类加载完整生命周期

\`\`\`
┌────────────────────────────────────────────────────────────┐
│                   类的生命周期                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Loading（加载）                                          │
│  ├── 通过类的全限定名获取其二进制字节流                    │
│  ├── 将字节流转化为方法区的运行时数据结构（Class对象）        │
│  └── 在堆中生成代表这个类的 java.lang.Class 对象           │
│                                                            │
│  Linking（链接）                                           │
│  ├── Verification（验证）：                                 │
│  │   ├── 文件格式验证（魔术数0xCAFEBABE等）               │
│  │   ├── 元数据验证（继承关系正确性、final类不被继承等）     │
│  │   ├── 字节码验证（类型安全、栈映射、符号引用合法性）     │
│  │   └── 符号引用验证（后续阶段，非必需）                  │
│  │                                                          │
│  ├── Preparation（准备）：                                  │
│  │   ├── 为静态变量分配内存（方法区中）                     │
│  │   └── 设置初始值（基本类型为0/false/null，引用为null）   │
│  │                                                          │
│  └── Resolution（解析）：                                   │
│      ├── 将常量池内的符号引用转换为直接引用                 │
│      ├── 类/接口解析、字段解析、方法解析                    │
│      └── 可延迟到首次使用时解析（懒解析）                   │
│                                                            │
│  Initialization（初始化）← 类加载的最后一步，也是程序员可控的一步 │
│  ├── 执行<clinit>方法（类构造器）                           │
│  │   ├── 为静态变量赋真正的初值（如 static int x = 10）      │
│  │   └── 执行静态代码块（static {} 块）                    │
│  ├── 仅在首次主动使用时触发（懒加载）                       │
│  └── 触发条件：new/getfield/putfield/invokestatic/main方法   │
│                                                            │
│  Using（使用）→ Unloading（卸载）                          │
│  条件极其严格（ClassLoader可回收 + 该类所有实例已GC +       │
│  该Class对象不再被引用）                                    │
└────────────────────────────────────────────────────────────┘
\`\`\`

### 双亲委派模型

\`\`\`
委派流程（以加载 java.lang.String 为例）：

Application ClassLoader
  ↓ 请求加载 java.lang.String
Extension ClassLoader
  ↓ 请求加载 java.lang.String
Bootstrap ClassLoader（rt.jar）
  ↓ 找到了！返回 Class<String>
  ↑
  ↑ 如果Bootstrap没找到，Extension尝试
  ↑ 如果Extension也没找到，Application自己尝试
  ↑ 如果Application还没找到，抛出 ClassNotFoundException

为什么要双亲委派？
├── 安全性：防止核心类被篡改
│   例：自己写一个 java.lang.String 包含恶意代码
│   如果没有委派，Application ClassLoader会优先加载你的String
│   有了委派，Bootstrap永远先加载标准库的String → 你的不会被加载
│
├── 避免重复加载：同一个类只被加载一次（由顶层ClassLoader负责）
│   例：A和B都依赖C库，如果没有委派，C可能被加载两次（不同的Class对象）
│   有了委派，C只会被一个ClassLoader加载一次
│
└── 层次清晰：Java类库层次分明（JDK基础类 → 扩展类 → 应用类）

如何打破双亲委派？
├── SPI机制（Service Provider Interface）
│   如 JDBC: java.sql.DriverManager 加载第三方Driver
│   DriverManager在Bootstrap层，但需要加载应用层的mysql-connector-java
│   → 使用 Thread.currentThread().getContextClassLoader()
│   → 获取Application ClassLoader来打破委派
│
├── OSGi框架
│   每个Bundle有自己的ClassLoader
│   可以加载同一类的不同版本
│
├── Tomcat/WebLogic
│   各WebApp独立ClassLoader
│   允许不同WebApp使用同一库的不同版本
│
└── JDK 9+ Module System（JPMS）
    取代了部分ClassLoader的功能，模块化更彻底
\`\`\`

### ClassNotFoundException vs NoClassDefFoundError

\`\`\`
ClassNotFoundException（异常）：
├── 发生时机：类加载阶段（Loading/Resolution）
├── 原因：Class.forName() / ClassLoader.loadClass() 找不到指定的类
├── 常见场景：
│   ├── JDBC驱动未引入：Class.forName("com.mysql.cj.jdbc.Driver")
│   ├── 反射时类名拼写错误
│   └── 动态代理生成的类不存在
└── 解决：检查classpath/依赖是否齐全

NoClassDefFoundError（错误）：
├── 发生时机：链接阶段（Linking）或初始化之后使用时
├── 原因：编译时有这个类，运行时找不到（class文件丢失/版本不兼容）
├── 常见场景：
│   ├── 打包时遗漏了传递依赖（Maven provided scope未包含）
│   ├── Jar包冲突（不同版本的同类名类）
│   └── 类加载器隔离问题（Tomcat WebApp间共享库冲突）
└── 解决：检查运行时classpath完整性
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java核心", "类加载器", "双亲委派", "JVM", "ClassLoader"]
  },

  {
    title: "Dijkstra最短路径算法的实现与应用",
    content: `## 题目描述

Dijkstra算法是图论中最经典的算法之一：

### 要求
1. 实现标准版Dijkstra算法（邻接表 + 优先队列优化）
2. 分析时间复杂度：朴素O(V²) vs 优先队列O((V+E)logV)
3. 适用条件：不能处理负权边（为什么？什么算法可以？）
4. 实际应用：地图导航（GPS路由）、网络路由协议(OSPF）、社交网络（六度人空间）`,
    codeTemplate: {
      javascript: `/**
 * Dijkstra最短路径算法 - 优先队列优化版
 * 时间复杂度: O((V+E)logV)
 */

class PriorityQueue {
  constructor() { this.heap = []; }
  enqueue(node, priority) { /* TODO */ }
  dequeue() { /* TODO */ 返回priority最小的node */ }
  isEmpty() { return this.heap.length === 0; }
}

function dijkstra(graph, startNode) {
  /**
   * @param {Object} graph 邻接表 { node: [{neighbor, weight}, ...] }
   * @param {string} startNode 起点
   * @returns {{ distances: Map, previous: Map }}
   */
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const pq = new PriorityQueue();

  // 初始化
  for (const node of Object.keys(graph)) {
    distances.set(node, node === startNode ? 0 : Infinity);
    previous.set(node, null);
  }
  pq.enqueue(startNode, 0);

  while (!pq.isEmpty()) {
    const { node: current } = pq.dequeue();

    if (visited.has(current)) continue;
    visited.add(current);

    for (const { neighbor, weight } of graph[current] || []) {
      if (visited.has(neighbor)) continue;

      const alt = distances.get(current) + weight;
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
        pq.enqueue(neighbor, alt);  // 更新优先队列
      }
    }
  }

  return { distances, previous };
}

// 重构路径
function reconstructPath(previous, target) {
  const path = [];
  let curr = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr);
  }
  return path;
}`,
      python: `"""
Dijkstra最短路径算法 - Python实现
"""
import heapq
from typing import Dict, List, Tuple, Optional


def dijkstra(
    graph: Dict[str, List[Tuple[str, float]]],
    start: str,
    end: Optional[str] = None
) -> Tuple[Dict[str, float], Dict[str, Optional[str]]]:
    """
    Dijkstra算法（优先队列优化）

    :param graph: 邻接表 {node: [(neighbor, weight), ...]}
    :param start: 起始节点
    :param end: 终止节点（可选，提前终止优化）
    :return: (distances字典, previous字典用于重构路径)
    """
    # TODO: 实现完整的Dijkstra算法
    # 包含：
    # 1. 优先队列（heapq模块）
    # 2. 提前终止优化（到达end时即可停止）
    # 3. 路径重构函数
    pass


def shortest_path(
    graph: Dict[str, List[Tuple[str, float]]],
    start: str,
    end: str
) -> List[str]:
    """返回从start到end的最短路径（节点列表）"""
    # TODO: 调用dijkstra并重构路径
    pass`,
      java: `import java.util.*;

/**
 * Dijkstra最短路径算法 - Java实现
 */
public class Dijkstra {

    /**
     * 计算从起点到所有其他节点的最短距离
     * @param graph 邻接表 Map<Node, List<Edge>>
     * @param start 起始节点
     * @return 包含距离和前驱节点的结果
     */
    public static Result dijkstra(Map<String, List<Edge>> graph, String start) {
        // distances: 节点 → 最短距离
        Map<String, Double> distances = new HashMap<>();
        // previous: 节点 → 前驱节点（用于重构路径）
        Map<String, String> previous = new HashMap<>();
        // 已访问节点
        Set<String> visited = new HashSet<>();

        // 优先队列：(distance, node)
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(
            Comparator.comparingDouble(nd -> nd.distance)
        );

        // 初始化
        for (String node : graph.keySet()) {
            distances.put(node, node.equals(start) ? 0.0 : Double.POSITIVE_INFINITY);
            previous.put(node, null);
        }
        pq.offer(new NodeDistance(start, 0.0));

        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            String u = current.node;

            if (visited.contains(u)) continue;
            visited.add(u);

            for (Edge edge : graph.getOrDefault(u, Collections.emptyList())) {
                if (visited.contains(edge.to)) continue;

                double alt = distances.get(u) + edge.weight;
                if (alt < distances.get(edge.to)) {
                    distances.put(edge.to, alt);
                    previous.put(edge.to, u);
                    pq.offer(new NodeDistance(edge.to, alt));
                }
            }
        }

        return new Result(distances, previous);
    }

    // 辅助类
    static class Edge {
        String to;
        double weight;
        Edge(String to, double weight) { this.to = to; this.weight = weight; }
    }

    static class NodeDistance {
        String node;
        double distance;
        NodeDistance(String node, double distance) {
            this.node = node; this.distance = distance;
        }
    }

    static class Result {
        final Map<String, Double> distances;
        final Map<String, String> previous;
        Result(Map<String, Double> d, Map<String, String> p) {
            this.distances = d; this.previous = p;
        }
    }
}`
    },
    difficulty: "medium",
    questionType: "code",
    tags: ["算法", "图论", "Dijkstra", "最短路径", "优先队列"]
  },

  // ==================== 补充至110道 (快速填充高质量题目) ====================
  // 以下题目为精简版（保持高质量但控制篇幅以确保全部写入）

  {
    title: "DFS/BFS遍历算法及典型应用",
    content: `## 题目描述
DFS（深度优先搜索）和BFS（广度优先搜索）是图/树遍历的基础：

### 要求
1. 分别实现递归和非递归版的DFS/BFS
2. BFS求无权图的最短路径（按边数计）
3. DFS的应用：拓扑排序、连通分量、检测环、迷宫求解
4. BFS的应用：层级遍历、最短路径（无权图）、二叉树层序遍历`,
    codeTemplate: {
      javascript: `// DFS递归 + 非递归 + BFS
function dfsRecursive(graph, node, visited = new Set()) {
  visited.add(node);
  console.log(node);
  for (const neighbor of graph[node] || []) {
    if (!visited.has neighbor)) dfsRecursive(graph, neighbor, visited);
  }
}
function dfsIterative(graph, start) { /* TODO: 用Stack实现 */ }
function bfs(graph, start) { /* TODO: 用Queue实现 */ }`,
      python: `# DFS/BFS Python实现
from collections import deque
def dfs_recursive(graph, node, visited=None): pass
def dfs_iterative(graph, start): pass
def bfs(graph, start): pass`,
      java: `// DFS/BFS Java实现
import java.util.*;
public class GraphTraversal {
    public static void dfsRecursive(Map<Integer, List<Integer>> graph, int node, Set<Integer> visited) {}
    public static void dfsIterative(Map<Integer, List<Integer>> graph, int start) {}
    public static void bfs(Map<Integer, List<Integer>> graph, int start) {}
}`
    },
    difficulty: "easy",
    questionType: "code",
    tags: ["算法", "DFS", "BFS", "图遍历", "树遍历"]
  },

  {
    title: "操作系统：进程间通信(IPC)机制详解",
    content: `## 题目描述
进程间通信是多任务操作系统的核心机制：
### 核心内容
1. **管道(Pipe)**：匿名管道vs命名管道(FIFO)，单向通信，父子进程
2. **消息队列(Message Queue)**：内核维护的消息链表，有界/无界
3. **共享内存(Shared Memory)**：最快的IPC方式，需要同步机制
4. **信号量(Semaphore)**：计数信号量vs二值信号量，PV操作
5. **Socket**：跨网络IPC，TCP/UDP/Unix Domain Socket
6. **Linux特有**：Signal(信号)、Eventfd、Signalfd`,
    solution: `## IPC机制对比

| 机制 | 方向 | 速度 | 容量 | 适用场景 |
|------|------|------|------|---------|
| **管道** | 单向(半双工) | 快 | 小(PIPE_BUF=4KB) | 父子进程简单通信 |
| **FIFO** | 单向 | 快 | 小 | 无亲缘关系进程 |
| **消息队列** | 双向 | 中 | 大(受系统限制) | 异步解耦 |
| **共享内存** | 双向 | **最快** | 大(受物理内存) | 大批量数据交换 |
| **信号量** | N/A | 极快 | N/A | 进程同步原语 |
| **Socket** | 双向 | 慢(跨网络) | 无限 | 跨机器/跨网络 |

**共享内存注意事项：**
- 必须配合信号量/互斥锁使用（否则产生竞态条件）
- Linux API: shmget/shmat/shmdt
- 注意内存对齐和缓存一致性问题

**生产选型建议：**
- 同机同语言进程 → 共享内存 + 信号量（最高性能）
- 同机异语言/解耦需求 → Unix Domain Socket（比TCP Loopback快30%）
- 跨机器 → TCP Socket / gRPC / 消息中间件`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["操作系统", "IPC", "进程通信", "管道", "共享内存"]
  },

  {
    title: "计算机网络：TCP粘包/拆包问题与解决方案",
    content: `## 题目描述
TCP是面向字节流的协议，没有"消息边界"的概念：

### 核心问题
1. **什么是粘包/拆包**：为什么TCP会出现这个问题？（UDP不会）
2. **解决方案**：固定长度、分隔符、长度字段（TLV）三种方案的优劣
3. **Netty中的解码器**：LengthFieldBasedFrameDecoder、DelimiterBasedFrameDecoder
4. **应用层协议设计**：自定义二进制协议 vs JSON vs Protobuf/gRPC`,
    solution: `## 解决方案详解

\`\`\`
方案一：固定长度消息头
┌──────────────┐──────────────────────┐
│ Length(4B)  │ Body(N bytes)         │
│ 0x00000100   │ {"cmd":"login",...}  │
└──────────────┴──────────────────────┘
优点：简单；缺点：浪费空间（短消息也要补齐）

方案二：分隔符
{"cmd":"login"}\\n{"cmd":"query"}\\n
优点：人类可读；缺点：body中不能包含分隔符（需转义）

方案三：长度前缀（TLV, Type-Length-Value）⭐ 推荐
┌──────┬──────┬────────────────────┐
│ Magic │ Len  │ Payload            │
│ 2B    │ 4B   │ Variable           │
└──────┴──────┴────────────────────┘
优点：精确、高效、可扩展；缺点：需要编解码

Netty配置示例：
pipeline.addLast(new LengthFieldPrepender(4));        // 发送时加长度头
pipeline.addLast(new LengthFieldBasedFrameDecoder(
    1048576,  // maxFrameLength
    0,        // lengthOffset
    4,        // lengthAdjustment
    4,        // initialBytesToStrip
    false));  // failFast
\`\`\`

**Protobuf/gRPC方案：**
gRPC使用HTTP/2帧 + Protobuf二进制编码，天然解决粘包问题。
Protobuf的varint编码也具有很好的压缩效率。`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "TCP", "粘包", "Netty", "协议设计"]
  },

  {
    title: "设计模式：适配器模式与外观模式的实战",
    content: `## 题目描述
适配器和外观都是结构型设计模式，但解决的问题不同：

### 适配器模式(Adapter)
1. 将一个接口转换成客户希望的另一个接口（接口不兼容→兼容）
2. 对象适配器（组合）vs 类适配器（多重继承）
3. 案例：旧系统对接新接口、第三方SDK包装、日志框架统一

### 外观模式(Facade)
1. 为子系统提供统一的简化接口（降低复杂度）
2. 与适配器的区别：外观不改接口，只是简化调用
3. 案例：HomeController聚合多个Service、JDBC DriverManager`,
    solution: `## 核心区别

\`\`\`
适配器模式：解决"接口不兼容"的问题
┌──────────┐     适配器     ┌──────────┐
│ Target   │ ◄──────────── │ Adaptee  │
│ (期望接口) │              (已有接口) │
└──────────┘              └──────────┘
目的：让Adaptee看起来像Target

外观模式：解决"子系统太复杂"的问题
┌──────────┐
│  Facade  │ ──→ SubSystemA
│ (统一入口)│ ──→ SubSystemB
│          │ ──→ SubSystemC
└──────────┘
目的：隐藏内部复杂性，提供简洁API

实际案例：
- 适配器：Slf4j → Log4j/Logback 的桥接（slf4j-log4j适配器）
- 外观：Spring Data JPA 的Repository（隐藏EntityManager复杂性）
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "适配器模式", "外观模式", "结构型模式"]
  },

  {
    title: "Linux常用命令与Shell脚本实战",
    content: `## 题目描述
后端工程师必须掌握的Linux运维技能：

### 必知命令
1. **文本处理**：grep/sed/awk/head/tail/wc/sort/uniq
2. **系统监控**：top/htop/vmstat/iostat/netstat/ss/free -h/df -h
3. **网络诊断**：curl/telnet/nslookup/dig/traceroute/tcpdump
4. **进程管理**：ps/jobs/kill/nohup/screen/tmux
5. **磁盘操作**：du -sh/find/ln/tar/gzip/cpio/dd
6. **权限管理**：chmod/chown/chmod/setfacl/getfacl
7. **crontab定时任务**

### Shell脚本编写
变量、条件判断、循环、函数、trap信号处理`,
    solution: `## 高频命令速查

\`\`\bash
# ======= 文本搜索 =======
grep -rn "pattern" --include="*.java" src/  # 递归搜索
grep -E "error|exception|fail" app.log        # 正则搜索
awk '{print $1, $NF}' file.txt              # 打印第1和最后一列
sed -i 's/foo/bar/g' *.txt                  # 行内替换
sort -t',' -k2 -nr data.csv                  # 按第2列数值倒序
uniq -c sorted.txt                           # 统计重复行

# ======= 系统监控 =======
top -bn1 | head -20                          # CPU/内存概览（批处理模式）
free -h                                       # 内存使用
df -hT                                        # 磁盘使用（显示文件系统类型）
iostat -xz 1 5                                # I/O统计（每秒刷新5次）
ss -tlnp                                     # 监听端口（替代netstat -tlnp）
netstat -an | awk 'NR>2 {print $6}' | sort | uniq -c | sort -rn  # TCP状态分布

# ======= 网络诊断 =======
curl -v -o /dev/null -w "DNS: %{time_namelookup}s\\nConnect: %{time_connect}s\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\n" https://example.com
tcpdump -i eth0 port 80 -nnA  # 抓包（-n不解析主机名，-A打印ASCII）
dig example.com ANY +trace    # DNS完整追踪
traceroute -n -I google.com   # ICMP路由跟踪

# ======= 进程排查 =======
ps aux --sort=-%mem | head -10  # 内存占用Top 10
jps -lvm                          # Java进程列表
kill -9 $(lsof -ti:8080)       # 杀掉占用8080端口的进程
strace -c -p <PID>              # 系统调用统计

# ======= 磁盘操作 =======
du -sh * | sort -rh | head -10   # 当前目录各文件夹大小
find . -type f -name "*.log" -mtime +30 -delete  # 删除30天前的日志
tar czf backup.tar.gz folder/     # 打包压缩
dd if=/dev/zero of=test bs=1M count=100  # 创建100MB测试文件

# ======= Crontab =======
# 分 时 日 月 周 命令
*/5 * * * * /usr/bin/python3 /app/check_health.py  # 每5分钟
0 2 * * * /usr/bin/mysqldump -u root -p'xxx' db > /backup/db_$(date +\\%Y%m%d).sql  # 每天凌晨2点备份
\`\`\`

**Shell脚本模板：**
\`\`\`bash
#!/bin/bash
set -euo pipefail  # 严格模式：未定义变量报错/管道失败报错

LOG_FILE="/var/log/myapp/script.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

cleanup() {
    log "Script interrupted, cleaning up..."
    rm -f /tmp/myapp_$$*.tmp
    exit 1
}
trap cleanup INT TERM

main() {
    log "Starting script..."
    # 你的逻辑
}

main "\$@"
\`\`\``,
    difficulty: "easy",
    questionType: "qa",
    tags: ["DevOps", "Linux", "Shell", "运维", "命令行"]
  },

  {
    title: "数据库连接池原理与Druid/HikariCP对比",
    content: `## 题目描述
数据库连接是昂贵的资源（TCP三次握手+认证+分配内存）：

### 核心问题
1. **连接池工作原理**：初始化、借用、归还、空闲连接回收、泄漏检测
2. **关键参数**：initialSize/minIdle/maxActive/maxWait/testOnBorrow/testWhileIdle
3. **Druid vs HikariCP**：为什么Spring Boot 2.x默认切换到HikariCP？
4. **连接泄漏检测**：activeConnections超时强制回收
5. **连接有效性验证**：ping查询、异常连接剔除`,
    solution: `## Druid vs HikariCP

| 维度 | Druid (Alibaba) | HikariCP (Spring Boot默认) |
|------|------------------|---------------------------|
| **性能** | 功能丰富但较重 | **极轻量，性能最优** |
| **监控** | ✅ 内置SQL监控、慢SQL统计、Spring监控 | ⚠️ 需外部集成micrometer |
| **防SQL注入** | ✅ 内置WallFilter | ❌ 不涉及 |
| **连接泄漏检测** | ✅ removeAbandoned | ✅ leakDetectionThreshold |
| **扩展功能** | 加密、缓存、统计、防火墙 | 纯粹专注连接池 |
| **依赖** | 较多（log4j/druid-parser等） | 极少（仅javassist/HikariCP） |
| **适用** | 需要监控/审计的生产环境 | 追求极致性能的场景 |

**HikariCP为何快？**
1. 无锁（ConcurrentBag替代BlockingQueue）
2. 字段级volatile（而非方法级synchronized）
3. 自定义FastList（避免Arrays.asList产生的不可变列表）
4. 微优化：Javassist字节码增强（ProxyConnection）

**最佳实践配置：**
\`\`\`yaml
spring:
  datasource:
    hikari:
      pool-name: AppHikariCP
      maximum-pool-size: 20          # 最大连接数（根据DB并发能力设定）
      minimum-idle: 10              # 最小空闲连接
      idle-timeout: 300000           # 空闲连接超时回收（5分钟）
      max-lifetime: 1800000          # 连接最大存活时间（30分钟）
      connection-timeout: 30000      # 获取连接超时（30秒）
      validation-timeout: 5000      # 连接有效性检测超时
      leak-detection-threshold: 60000  # 泄漏检测阈值（60秒未归还则报警）
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["数据库", "连接池", "HikariCP", "Druid", "性能优化"]
  },

  {
    title: "前端性能优化：从输入URL到页面渲染的全过程",
    content: `## 题目描述
前端性能直接影响用户体验和SEO排名：

### 核心过程
1. **URL解析**：协议/域名/端口/路径/查询参数/Fragment
2. **DNS查询**：浏览器缓存 → OS缓存 → Hosts → DNS服务器
3. **TCP连接**：三次握手 → TLS握手（HTTPS）
4. **HTTP请求/响应**：Request/Response Headers、Body
5. **渲染管线**：Parse HTML → DOM Tree → CSSOM → Render Tree → Layout → Paint → Composite
6. **关键指标**：FCP/LCP/TTI/CLS/TBT`,
    solution: `## 渲染管线详解

\`\`\`
1. URL Parsing (解析URL)
   输入: https://www.example.com/path?query=value#fragment
   → protocol=https, host=www.example.com, path=/path, query=query=value, fragment=fragment

2. DNS Lookup (域名解析)
   chrome://net-internals/#dns → 查看浏览器DNS缓存
   通常耗时: 0ms(缓存命中) ~ 200ms(未命中)

3. TCP Connection (建立连接)
   三次握手: SYN → SYN-ACK → ACK (~40-100ms)
   HTTPS额外: TLS握手 (~50-150ms)
   总建连时间: ~100-250ms

4. HTTP Request & Response
   Request: GET /path HTTP/1.1\\r\\nHost: www.example.com...
   Response: HTTP/1.1 200 OK\\r\\nContent-Type: text/html...

5. Rendering Pipeline (渲染管线)
   ┌──────────────────────────────────────────────┐
   │  Parse HTML → DOM Tree                      │
   │  Parse CSS   → CSSOM (CSS Object Model)     │
   │  Execute JS → 可能修改DOM/CSSOM             │
   │                                              │
   │  DOM + CSSOM → Render Tree (布局树)          │
   │  Layout (回流/Reflow): 计算位置和尺寸          │
   │  Paint (重绘/Repaint): 像素绘制到图层         │
   │  Composite (合成): 图层合并输出到屏幕          │
   └──────────────────────────────────────────────┘

6. Core Web Vitals (核心Web指标)
   ├── LCP (Largest Contentful Paint): 最大内容绘制 ≤ 2.5s
   ├── FID (First Input Delay): 首次输入延迟 ≤ 100ms
   ├── CLS (Cumulative Layout Shift): 累积布局偏移 ≤ 0.1
   ├── TTFB (Time To First Byte): 首字节时间 ≤ 200ms
   └── TTI (Time To Interactive): 可交互时间 ≤ 3.8s
\`\`\`

**优化Checklist：**
- [ ] 启用Gzip/Brotli压缩（体积减少60-80%）
- [ ] 图片优化（WebP格式、lazy loading、srcset响应式）
- [ ] CDN加速（静态资源就近访问）
- [ ] 减少HTTP请求数（合并CSS/JS、Sprite图、内联关键CSS）
- [ ] 利用浏览器缓存（Cache-Control/ETag）
- [ ] 预加载关键资源（<link rel="preload"> / <link rel="dns-prefetch">）
- [ ] 代码分割（Webpack code splitting / dynamic import）
- [ ] 首屏渲染优化（SSR/SSG、骨架屏）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["前端性能", "浏览器渲染", "Core Web Vitals", "CDN", "优化"]
  },

  // ==================== 快速补充剩余题目至110道 ====================

  {
    title: "设计模式：模板方法模式与策略模式的组合使用",
    content: `模板方法(Template Method)在算法骨架确定、步骤可变时非常有效。结合策略模式可以实现开闭原则。`,
    solution: `模板方法定义算法骨架（抽象类），具体步骤延迟到子类实现。策略模式封装可变的步骤（多种实现可互换）。Spring JdbcTemplate、AbstractApplicationContext.refresh() 都是经典案例。\n\n关键点：\n1. 抽象类定义templateMethod(final)调用primitiveOperation1/2\n2. 子类覆写primitiveOperation\n3. primitiveOperation中可注入Strategy\n4. 钩子方法(hook)提供可选的扩展点`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "模板方法", "策略模式", "组合模式"]
  },

  {
    title: "设计模式：状态模式与有限状态机FSM实现",
    content: `状态模式(State Pattern)允许对象在其内部状态改变时改变其行为。适用于对象的行为依赖于其状态的场景。`,
    solution: `状态模式三要素：Context(上下文，持有State引用)、State(状态接口/抽象类)、ConcreteState(具体状态)。状态转移发生在ConcreteState中通过context.setState()。\n\n与策略模式区别：策略模式各策略独立可选；状态模式的状态之间有明确的转移关系。\n\n实现方式：1. if-else/switch（简单但不扩展）2. 状态表/状态机框架（Spring Statemachine）3. 状态模式（面向对象）。推荐中等复杂度用状态模式，复杂用状态机框架。`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["设计模式", "状态模式", "状态机", "FSM"]
  },

  {
    title: "Redis哨兵(Sentinel)与集群(Cluster)模式详解",
    content: `Redis高可用方案：Sentinel（主从自动故障转移）vs Cluster（数据分片+高可用）`,
    solution: `**Sentinel模式：**\n- 1主多从 + Sentinel节点监控\n- Sentinel通过PING检测Master健康\n- 主观下线(sdown) + 客观下线(odown) → 故障转移\n- 自动完成：选举新Slave→提升为新Master→重新配置其他Slave\n- 客户端通过Sentinel地址获取当前Master地址\n\n**Cluster模式：**\n- 16384个槽位(slot)分布在多个Master节点\n- 每个Master有1-N个Slave\n- 使用MOVED/ASK重定向客户端到正确的节点\n- 节点间通过Gossip协议传播配置信息\n\n选型：< 16GB内存用Sentinel + 分片客户端；≥16GB或需要水平扩展用Cluster`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Redis", "Sentinel", "Redis Cluster", "高可用"]
  },

  {
    title: "ElasticSearch Deep Paging深度分页问题与解决方案",
    content: `ES的from+size分页在深页（from>10000）时存在严重性能问题和默认限制。`,
    solution: `**问题原因：**\nfrom+size分页需要from+size条文档在协调节点排序后再截取，深页时内存和CPU开销巨大。\n默认max_result_window=10000保护集群。\n\n**解决方案：**\n1. Search After（推荐）：使用上一页最后一条文档的sort值作为游标\n   - POST /index/_search {\"search_after\": [last_sort_value], \"size\": 10, \"sort\": [{\"id\":\"asc\"}]}\n   - 优点：性能恒定（不受深度影响）；缺点：不支持跳页\n\n2. Scroll API：建立快照上下文，多次滚动查询\n   - 适合导出全量数据的离线场景\n   - 缺点：资源消耗大，不适合实时请求\n\n3. Point In Time (PIT)：ES 7.10+\n   - 对某个时间点的数据建立快照视图\n   - 配合search_after实现一致的深分页\n\n4. 业务规避：限制翻页深度（Google风格："约XX万条结果，仅显示前100页"）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["中间件", "ElasticSearch", "Deep Paging", "Search After", "性能优化"]
  },

  {
    title: "ClickHouse列式存储原理与查询优化技巧",
    content: `ClickHouse是俄罗斯Yandex开源的OLAP列式数据库，适合PB级数据的实时分析查询。`,
    solution: `**列式存储优势：**\n- 分析查询通常只需少量列 → 列存只读取需要的列（I/O减少10-100倍）\n- 高压缩率（同列数据类型相似，压缩比行存高5-10倍）\n- 向量化执行（SIMD指令并行处理多个值）\n\n**MergeTree引擎：**\n- 数据按主键排序存储（Sort Key决定物理顺序）\n- 每个分区(partition)对应一个目录\n- 每批数据形成一个数据段(data part)\n- 后台合并(Merge)将小part合并为大part\n\n**查询优化技巧：**\n1. 使用正确的表引擎：MergeTree(主表)/ReplacingMergeTree(去重)/CollapsingTree(折叠)\n2. 合理设计排序键（WHERE/GROUP BY/ORDER BY的高基数列放在前面）\n3. 使用LowCardinality字典编码低基数字符串列\n4. 物化视图预聚合（CREATE MATERIALIZED VIEW）\n5. 避免SELECT *（列存反模式）\n6. 使用PREWHERE子句（在读取数据前过滤）\n7. 合理设置max_threads/max_memory_usage\n\n**与ES对比：** ClickHouse适合聚合分析（GROUP BY/JOIN）；ES适合全文检索和文档检索`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "ClickHouse", "OLAP", "列式存储", "数据分析"]
  },

  {
    title: "Flink Exactly-Once语义与Checkpoint机制",
    content: `Apache Flink是新一代大数据流处理引擎，其Exactly-Once语义是核心卖点。`,
    solution: `**Flink状态管理：**\n- Keyed State: 按Key分区存储在StateBackend中\n- Operator State: 广播状态/列表状态\n- StateBackend: MemoryStateBackend(测试) / FsStateBackend(文件) / RocksDBStateBackend(生产首选)\n\n**Checkpoint机制（轻量级全局一致性快照）：**\n1. Barrier对齐：JobManager周期性地向Source注入Barrier标记\n2. 当收到Barrier时：开始做Checkpoint\n3. State Backend将状态异步持久化到外部存储(HDFS/S3)\n4. 所有Operator的Checkpoint完成后，JobManager确认本次Checkpoint成功\n5. 出错时从最近成功的Checkpoint恢复\n\n**Exactly-Once两阶段提交(2PC)：**\n1. Phase 1: Pre-commit（预提交）：Flink将数据写入外部系统的临时表/事务\n2. Phase 2: Commit（正式提交）：Checkpoint成功后通知外部系统提交\n3. 若Phase 1后崩溃：恢复后Abort未提交的事务\n\n**Sink幂等保证：**\n- 最终兜底：即使2PC失败，Sink必须支持幂等写入（唯一约束/去重表）\n- Kafka Sink: transactional producer（Kafka 0.11+ exactly-once semantics）\n- DB Sink: UPSERT (ON CONFLICT DO UPDATE)\n\n**与Spark Streaming对比：** Spark Micro-batch本质是At-Least-Once（批处理级别）；Flink是真正的事件级Exactly-Once`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Flink", "流计算", "Exactly-Once", "Checkpoint"]
  },

  {
    title: "Tomcat架构与性能调优实战",
    content: `Tomcat是最常用的Java Servlet容器，深入理解其架构有助于性能调优和问题排查。`,
    solution: `**Tomcat架构分层：**\n├── Server（整个Tomcat实例）\n│   └── Service（逻辑服务分组，如Catalina）\n│       └── Engine（执行引擎）\n│           ├── Host（虚拟主机，如localhost）\n│           │   └── Context（Web应用，如/myapp）\n│           │       └── Wrapper（Servlet封装）\n│           │           └── Servlet（业务代码）\n│           └── Connector（连接器，接收请求）\n│               ├── NIO Connector（推荐，非阻塞）\n│               └── APR Connector（Native，最高性能）\n\n**Connector选择：**\n- BIO: 一线程一连接（旧版默认，性能差，仅用于低并发）\n- NIO: 非阻塞IO + 少量线程处理大量连接（Tomcat 9默认，推荐）\n- NIO2: 异步IO（Tomcat 8+支持，实验性质）\n- APR: 调用本地Native库（OpenSSL/OpenSSL），性能最好但配置复杂\n\n**关键调优参数（server.xml）：**\n\`\`xml\n<!-- Connector N2优化 -->\n<Connector port=\"8080\" protocol=\"org.apache.coyote.http11.Http11NioProtocol\"\n    maxThreads=\"500\"          # 最大线程数（根据CPU*250~500设定）\n    minSpareThreads=\"50\"      # 最小空闲线程\n    acceptCount=\"300\"         # 接收队列长度（超过则拒绝）\n    maxConnections=\"1000\"    # 最大并发连接数\n    connectionTimeout=\"20000\" # 连接超时(ms)\n    keepAliveTimeout=\"60000\"  # 长连接超时\n    enableLookups=\"false\"     # 禁用DNS反向解析（重要！）\n    compression=\"on\"         # 开启Gzip压缩\n    compressableMimeType=\"text/html,text/xml,text/css,application/json\"\n    URIEncoding=\"UTF-8\"       <!-- 重要！防止中文乱码 -->\n/>\n\`\`\`\n\n**JVM调优（setenv.sh）：**\nJAVA_OPTS="-server -Xms2g -Xmx2g \\n  -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \\n  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ \\n  -Djava.security.egd=file:/dev/./urandom"\n\n**性能基准参考（单机8核16G）：**\n- 静态HTML: 20000+ QPS\n- Spring MVC JSON API: 5000-10000 QPS\n- JSP动态页面: 1000-3000 QPS`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Tomcat", "性能调优", "NIO", "JVM"]
  },

  {
    title: "ZooKeeper原理与应用：分布式协调服务的瑞士军刀",
    content: `ZooKeeper是分布式系统的"协调员"，用于配置管理、命名服务、分布式锁、领导者选举。`,
    solution: `**核心数据模型：**\n- ZNode树形结构（类似文件系统）\n- 每个ZNode存储数据和元数据（version/czxid/children）\n- 四种节点：持久(PERSISTENT)、持久顺序(PERSISTENT_SEQUENTIAL)、临时(EPHEMERAL)、临时顺序(EPHEMERAL_SEQUENTIAL)\n- Watcher机制：监听ZNode变化事件（一次性触发）\n\n**ZAB协议（Zookeeper Atomic Broadcast）：**\n- 保证数据的一致性和原子广播\n- 消息广播（Leader将Proposal广播给所有Follower）\n- 崩溃恢复（基于事务ID(ZXID)的两阶段提交）\n- Leader选举（基于myid和ZXID的投票算法）\n\n**典型应用场景：**\n1. 分布式锁（临时顺序节点 + Watcher）\n2. 配置中心（Nacos/Apollo底层依赖ZK）\n3. 服务注册发现（Dubbo/ZK Registry）\n4. 领导者选举（Kafka Controller、HBase HMaster）\n5. 分布式Barrier（Flink Checkpoint协调）\n\n**Curator客户端（推荐）：**\n- InterProcessMutex（可重入锁）\n- SharedCount（计数器）\n- LeaderLatch（领导权竞争）\n- TreeCache（监听子树变化）\n\n**与etcd对比：**\n- ZK: CP（强一致性），ZAB协议，Watcher模型复杂，Java生态\n- etcd: CP（强一致性），Raft协议，gRPC API，Go/Cloud Native生态\n- K8s使用etcd；Hadoop生态使用ZK`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "ZooKeeper", "分布式协调", "ZAB协议", "分布式锁"]
  },

  {
    title: "gRPC vs RESTful API：何时选择哪个？",
    content: `gRPC是Google开源的高性能RPC框架，基于Protocol Buffers和HTTP/2。`,
    solution: `**技术对比：**\n\n| 维度 | REST (JSON over HTTP/1.1) | gRPC (Protobuf over HTTP/2) |\n|------|---------------------------|------------------------------|\n| 协议 | HTTP/1.1 | HTTP/2 |\n| 序列化 | JSON/Text | Protobuf Binary |\n| 传输效率 | 低（文本冗余大） | **高（二进制紧凑，小3-10倍）** |\n| 序列化速度 | 慢（反射/字符串解析） | **快（预编译代码，零拷贝）** |\n| 接口定义 | OpenAPI/Swagger（可选） | **.proto IDL（强契约）** |\n| 代码生成 | 手写或工具辅助 | **protoc自动生成多语言Stub** |\n| 流式通信 | ❌ 不支持 | **✅ Server/Bidirectional Streaming** |\n| 浏览器支持 | ✅ 原生支持 | ❌ 需grpc-web网关 |\n| 缓存友好 | ✅ 可被CDN/代理缓存 | ❌ 不可缓存 |\n| 调试友好 | ✅ curl/浏览器直接看 | ❌ 需grpcurl等工具 |\n\n**选型建议：**\n- ✅ gRPC：微服务间内部通信（多语言团队）、需要高性能/低延迟、流式数据传输（实时语音/视频/文件）、严格接口契约\n- ✅ REST：对外公开API（浏览器/第三方接入）、需要CDN缓存、简单CRUD、前端直连\n- ✅ GraphQL：复杂查询需求（客户端自定义返回字段）、聚合多个REST API\n\n**生产实践：**\n- 内部微服务间：gRPC（性能 + 类型安全）\n- BFF/API Gateway对外：REST/GraphQL（兼容性好）\n- 移动端：gRPC + Protobuf（省流量、快）\n- Web端：REST + JSON（简单直接）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "gRPC", "REST", "Protobuf", "HTTP/2"]
  },

  {
    title: "WebSocket协议原理与实时通信方案",
    content: `WebSocket提供了全双工的实时通信能力，是聊天、协同编辑、实时推送的首选方案。`,
    solution: `**握手过程（HTTP Upgrade）：**\n\`\`\`\nClient → Server:\nGET /chat HTTP/1.1\nHost: server.example.com\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Key: dGhlIHNhbXBsZub25jZQ==\nSec-WebSocket-Version: 13\n\nServer → Client:\nHTTP/1.1 101 Switching Protocols\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\n\`\`\`\n握手成功后，协议升级为WebSocket（基于TCP的长连接）。\n\n**帧格式（Opcode区分）：**\n- 0x1: Text Frame（UTF-8文本）\n- 0x2: Binary Frame（二进制数据）\n- 0x8: Close（关闭连接）\n- 0x9: Ping（心跳）\n- 0xA: Pong（心跳响应）\n\n**心跳保活机制：**\n- WebSocket层面：Ping/Pong帧\n- 应用层：定期发送心跳消息\n- Nginx代理：proxy_read_timeout 需要足够长\n\n**与SSE(Server-Sent Events)对比：**\n- WS：全双工（双向通信），二进制支持，需特殊代理支持\n- SSE：服务器→客户端单向，基于HTTP，简单易用，自动重连\n\n**与长轮询对比：**\n- 长轮询：客户端不断发HTTP请求（Header开销大，延迟高）\n- WS：一次握手后持续通信（Header开销仅一次，延迟低）\n\n**生产架构：**\n\`\`\`\nClient ←WS→ Nginx(Proxy) ←WS→ WebSocket Server(Netty/Tomcat/Jetty)\n                                         ↓\n                                   Redis Pub/Sub (广播消息)\n                                         ↓\n                              其他WebSocket Server Instances\n\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "WebSocket", "实时通信", "Socket.io", "聊天系统"]
  },

  {
    title: "CDN内容分发网络原理与缓存策略",
    content: `CDN(Content Delivery Network)通过将内容缓存到离用户最近的边缘节点，大幅提升访问速度。`,
    solution: `**CDN工作原理：**\n1. 用户请求 → DNS解析到CNAME → CDN权威DNS → 返回边缘节点IP\n2. 用户连接到最近的边缘节点（基于Geo-DNS或Anycast）\n3. 边缘节点检查缓存：\n   - Hit（命中）→ 直接返回缓存内容\n   - Miss（未命中）→ 回源站获取 → 缓存 → 返回用户\n\n**缓存策略（Cache-Control头）：**\n- public, max-age=31536000: 公共缓存1年（适合静态资源）\n- no-cache, must-revalidate: 每次使用前必须验证（适合动态内容）\n- no-store: 不允许缓存（敏感数据）\n- private: 仅浏览器缓存（不经过CDN/代理缓存）\n- s-maxage: CDN专用缓存时间（覆盖max-age）\n- stale-while-revalidate: 过期期间返回旧内容同时后台刷新\n- stale-if-error: 源站出错时返回过期内容\n\n**CDN预热与刷新：**\n- 预热(Prewarm)：活动开始前主动将热门资源推送到边缘节点\n- 刷新(Purge/Invalidate)：内容更新后清除CDN缓存（URL刷新/正则刷新/全量刷新）\n\n**选型考虑：**\n- 国内：阿里云CDN / 腾讯云CDN / 七牛云（备案合规、节点覆盖广）\n- 国际：Cloudflare（免费套餐够用）/ AWS CloudFront / Fastly\n- 视频：专门的视频CDN（支持HLS/DASH自适应码率）\n- 大文件：OSS + CDN（对象存储原生集成CDN加速）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["网络协议", "CDN", "缓存策略", "DNS", "性能优化"]
  },

  {
    title: "OAuth 2.0授权码模式完整流程与安全实践",
    content: `OAuth 2.0是目前最主流的授权委托框架，授权码模式(Authorization Code)是最安全的流程。`,
    solution: `**授权码模式四步流程：**\n\nStep 1: 用户授权（Authorization Request）\n\`\`\`\nGET /authorize?response_type=code&client_id=APP_ID&redirect_uri=CALLBACK_URL&scope=read write&state=RANDOM_STATE\n→ 用户登录并同意授权\n→ 重定向到: CALLBACK_URL?code=AUTH_CODE&state=RANDOM_STATE\n\`\`\`\n\nStep 2: 应用换取Token（Token Exchange）\n\`\`\`\nPOST /token\ngrant_type=authorization_code&code=AUTH_CODE&client_id=APP_ID&client_secret=SECRET&redirect_uri=CALLBACK_URL\n→ 返回: {\n    "access_token": "eyJ...",\n    "refresh_token": "dEF...",\n    "token_type": "Bearer",\n    "expires_in": 3600,\n    "scope": "read write"\n  }\n\`\`\`\n\nStep 3: 使用Access Token访问资源\n\`\`\`\nGET /api/user\nAuthorization: Bearer eyj...\n→ 返回用户资源\n\`\`\`\n\nStep 4: Refresh Token刷新\n\`\`\`\nPOST /token\ngrant_type=refresh_token&refresh_token=dEF...&client_id=APP_ID&client_secret=SECRET\n→ 返回新的access_token和refresh_token\n\`\`\`\n\n**PKCE增强（推荐用于SPA/移动端）：**\n- 问题：授权码可能被截获（SPA无法安全保存client_secret）\n- 解决：code_verifier + code_challenge（SHA256）\n- 流程：客户端生成随机code_verifier → hash后作为code_challenge发送 → Authorization Server校验\n\n**安全最佳实践：**\n- state参数防CSRF（必须验证state与发送时一致）\n- short-lived access_token（1小时）+ long-lived refresh_token（30天）\n- refresh_token单次使用（用完作废，发放新的）\n- Scope最小权限原则\n- Token签名使用RS256（非对称加密）便于多服务验签\n- HTTPS全程加密传输`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "OAuth 2.0", "授权", "JWT", "PKCE"]
  },

  {
    title: "JWT(JSON Web Token)原理、攻击面与安全实践",
    content: `JWT是无状态的认证令牌，广泛用于前后端分离架构和微服务间鉴权。`,
    solution: `**JWT结构（三部分Base64Url编码，用.分隔）：**\n\`\`\`\neyhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\neyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gR29vZ2xlIiwiaWF0IjoxNTE0MjkwMDIwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQsswc5\n└── Header ──┘  └── Payload ──┘  └── Signature ──┘\nHeader: {alg: HS256, typ: JWT}\nPayload: {sub: \"1234567890\", name: \"John Doe\", iat: 1516239022, exp: 1516242622}\nSignature: HMACSHA256(base64UrlEncode(header) + \".\" + base64UrlEncode(payload), secret)\n\`\`\`\n\n**常见攻击与防御：**\n\n1. **算法混淆攻击（alg: none）**\n   - 攻击：将alg改为none，移除signature字段\n   - 防御：服务端白名单算法（仅允许HS256/RS256）\n\n2. **密钥弱/泄露**\n   - 攻击：暴力破解HS256密钥或泄露后伪造任意token\n   - 防御：使用高强度随机密钥（>=256bit）；RS256私钥严格保管\n\n3. **信息泄露（Payload明文）**\n   - 攻击：Base64解码即可看到payload（虽然不可篡改）\n   - 防御：不在payload中放敏感信息（密码/手机号）；必要时加密payload（JWE）\n\n4. **Token未过期被盗用**\n   - 攻击：窃取有效期内token冒充身份\n   - 防御：短期有效期（access_token≤1h）；黑名单机制（Redis记录已注销token）；绑定设备指纹\n\n5. **重放攻击（Replay）**\n   - 攻击：截获token重复使用\n   - 防御：添加jti(JWT ID) + exp + nonce；服务端去重\n\n**最佳实践：**\n- Access Token: 短期（15min-1h），Bearer方式放入Authorization头\n- Refresh Token: 长期（7-30天），HttpOnly Cookie存储\n- 签名算法：RS256（非对称，认证服务签，各服务验）\n- 敏感接口二次验证（结合IP/User-Agent/设备指纹）\n- 登出时将token加入黑名单（Redis SETEX直到过期）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "JWT", "认证", "Token", "Web安全"]
  },

  // ==================== 第97-110题：最终补充（安全/中间件/DevOps/场景/系统设计）====================

  {
    title: "SQL注入攻击原理与全方位防御方案",
    content: `SQL注入是OWASP Top 1的Web安全漏洞，攻击者通过恶意构造输入篡改SQL语句逻辑。请分析SQL注入的各类变体和完整防御体系。`,
    solution: `**SQL注入类型与示例：**

1. **经典注入（Union-based）**
\`\`\`sql
-- 正常查询
SELECT * FROM users WHERE id = '1'
-- 注入后
SELECT * FROM users WHERE id = '1' UNION SELECT username,password,'3' FROM admin--
\`\`\`

2. **布尔盲注（Boolean-based Blind）**
\`\`\`sql
-- 通过条件判断逐位推测数据
id = 1 AND (SELECT SUBSTRING(password,1,1) FROM admin LIMIT 1) = 'a'
-- 返回正常页面 → 第一位是'a'，否则不是
\`\`\`

3. **时间盲注（Time-based Blind）**
\`\`\`sql
-- 通过响应时间判断条件真假
id = 1; IF((SELECT COUNT(*) FROM admin) > 0, SLEEP(5), 0)
-- 响应慢5秒 → 条件为真
\`\`\`

4. **报错注入（Error-based）**
\`\`\`sql
-- 利用数据库报错信息泄露数据（MySQL）
id = 1 AND extractvalue(1,concat(0x7e,(SELECT password FROM admin LIMIT 1)))
\`\`\`

5. **二次注入（Second-order）**
- 恶意数据先存入数据库，后被其他查询取出执行
- 例：用户名存为 \`admin'--\`，后续更新时触发注入

6. **堆叠查询（Stacked Queries）**
\`\`\`sql
id = 1; DROP TABLE users; --
-- 需要数据库支持多语句执行（PHP+mysqli_multi_query可触发）
\`\`\`

**全方位防御方案：**

| 层级 | 方案 | 说明 |
|------|------|------|
| 代码层 | 参数化查询（Prepared Statement） | 最有效！参数与SQL分离，无法注入 |
| ORM层 | 绑定参数（QueryDSL/JPA Criteria） | Hibernate/MyBatis使用#{param}非\${param} |
| 输入层 | 白名单校验 | ID仅允许数字、名字限制字符集长度 |
| WAF层 | 规则引擎检测 | ModSecurity/云WAF识别SQL特征关键词 |
| 数据库层 | 最小权限原则 | 应用账号禁止DROP/ALTER/TRUNCATE |
| 输出层 | 错误信息脱敏 | 生产环境关闭详细错误栈，返回通用错误 |

**MyB特别注意：**
\`\`\`xml
<!-- ❌ 危险：\${}直接拼接，可被注入 -->
<select> SELECT * FROM user WHERE name = '\${name}' </select>

<!-- ✅ 安全：#{}预编译参数 -->
<select> SELECT * FROM user WHERE name = #{name} </select>

<!-- ⚠️ 特殊情况：LIKE/ORDER BY必须用\${}时，手动过滤 -->
<select> SELECT * FROM user ORDER BY \${orderByColumn} </select>
<!-- 必须在Java层白名单校验orderByColumn -->
\`\`\`

**NoSQL注入（MongoDB）：**
\`\`\`javascript
// ❌ 字符串拼接（易受注入）
db.users.find({username: req.body.username, password: req.body.password})
// 攻击: {"username": {"$ne": ""}, "password": {"$ne": ""}} → 绕过认证

// ✅ 使用操作符白名单 + 类型检查
if (typeof req.body.username !== 'string') throw new Error('Invalid input')
db.users.find({username: req.body.username, password: req.body.password})
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "SQL注入", "Web安全", "防御", "WAF"]
  },

  {
    title: "SSRF服务端请求伪造攻击与防御",
    content: `SSRF(Server-Side Request Forgery)允许攻击者迫使服务器向内部网络发起请求。这是近年来高发的云原生安全漏洞。`,
    solution: `**SSRF攻击场景：**

1. **图片URL加载**
\`\`\`
POST /api/avatar?url=http://internal-admin:8080/admin/delete?id=1
→ 服务器 fetch(url) → 攻击内网管理接口
\`\`\`

2. **Webhook回调**
\`\`\`
POST /api/webhook?url=http://169.254.169.254/latest/meta-data/
→ 读取云平台元数据（AWS/GCP/Aliyun凭证）
\`\`\`

3. **PDF生成/URL预览**
\`\`\`
POST /api/generate-pdf?url=file:///etc/passwd
→ 读取服务器本地文件
\`\`\`

**常见内网目标：**
| 目标 | 用途 |
|------|------|
| 169.254.169.254 | 云元数据（AK/SK/角色Token） |
| 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 | 内网服务扫描 |
| localhost, 127.0.0.1, [::1] | 本地服务（Redis/MySQL/Admin） |
| file://, dict://, gopher:// | 协议利用（读文件/探测端口/发送数据） |

**绕过技术：**
- IP地址变形：八进制(0177.0.0.1)、十进制(2130706433)、十六进制(0x7f000001)
- DNS Rebinding：TTL=0 → 第一次解析为合法IP通过校验，第二次解析为内网IP
- URL编码：%68%74%74%70%3a%2f%2f → http://
- 特殊域名：localtest.me / vcap.me / local.dev → 都解析到127.0.0.1

**防御方案（多层防御）：**

1. **URL白名单（最严格）**
\`\`\`javascript
const ALLOWED_DOMAINS = ['cdn.example.com', 'images.example.com']
const urlObj = new URL(userInput)
if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
  throw new Error('Domain not allowed')
}
\`\`\`

2. **黑名单过滤（宽松场景）**
\`\`\`javascript
// 禁止的内网IP段
const blockedPatterns = [
  /^(10|172\\.(1[6-9]|2[0-9]|3[01])|192\\.168)\\./,
  /^127\\./, /^0\\./, /^::$/,
  /^169\\.254\\.169\\.254$/,
  /^file:\\/\\//i, /^dict:\\/\\//i, /^gopher:\\/\\//i
]
\`\`\`

3. **DNS解析二次验证**
\`\`\`javascript
// 先DNS解析获取真实IP，再校验是否为内网
const resolvedIP = await dns.resolve4(urlObj.hostname)
if (isPrivateIP(resolvedIP)) throw new Error('Private IP not allowed')
// 使用解析后的IP发起请求（防止DNS Rebinding）
\`\`\`

4. **禁用危险协议**
\`\`\`javascript
// 仅允许http/https协议
if (!['http:', 'https:'].includes(urlObj.protocol)) {
  throw new Error('Protocol not allowed')
}
\`\`\`

5. **网络层隔离**
- 应用容器禁止出站访问内网（Security Group/Network Policy）
- 使用代理服务器控制出站流量
- 云函数/FaaS禁用对元数据服务的访问`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["安全", "SSRF", "云安全", "内网渗透", "防御"]
  },

  {
    title: "Redis分布式锁的正确实现（Redlock算法）",
    content: `在分布式系统中，Redis常被用于实现分布式锁。请从简单实现到Redlock算法，分析各种方案的优劣和正确实现方式。`,
    solution: `**阶段一：基础实现（有问题！）**

\`\`\`java
// ❌ 问题版本
public void lock() {
    while (true) {
        Boolean acquired = redis.setnx("lock:order", "1");
        if (acquired) {
            redis.expire("lock:order", 30); // ⚠️ setnx和expire非原子！可能死锁
            break;
        }
        Thread.sleep(100);
    }
}

// ✅ 改进：SET NX EX 原子命令
public boolean tryLock(String key, String value, int expireSeconds) {
    // SET key value NX EX seconds （原子操作）
    return "OK".equals(redis.set(key, value, SetOption.setNX().ex(expireSeconds)));
}
\`\`\`

**阶段二：解决锁释放问题**

问题：业务执行超时，锁自动过期 → 其他线程获得锁 → 原线程释放了别人的锁！

\`\`\`java
// ✅ 加value标识锁持有者
public void unlock(String key, String value) {
    String currentValue = redis.get(key);
    if (value.equals(currentValue)) {  // ⚠️ get + del 非原子！
        redis.del(key);
    }
}

// ✅✅ Lua脚本保证原子释放
public boolean unlock(String key, String value) {
    String script =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    return redis.eval(script, Collections.singletonList(key), Collections.singletonList(value));
}
\`\`\`

**阶段三：WatchDog自动续期（Redisson实现）**

\`\`\`java
RLock lock = redisson.getLock("order-lock");
try {
    lock.lock();  // 默认30s过期，WatchDog每10s续期（续到30s）
    // 业务代码...
} finally {
    lock.unlock();
}

// WatchDog原理：
// 1. 加锁成功后启动后台定时任务（delay = expireTime/3）
// 2. 定时任务检查：如果锁还持有且业务还在运行 → 重新设置过期时间
// 3. 业务完成或锁释放 → 取消续期任务
\`\`\`

**阶段四：Redlock算法（多节点高可用）**

单节点Redis故障时锁丢失的问题 → Redlock在N个独立Redis节点上加锁：

\`\`\`
算法流程（N=5， majority=3）：
1. 获取当前时间戳 T1
2. 按顺序向5个Redis节点申请加锁（SET NX PX value）
   - 每个节点设置相同的过期时间和唯一value
   - 节点不可用时快速跳过（不阻塞等待）
3. 计算耗时：current_time - T1
4. 如果在多数节点(≥3)加锁成功 且 总耗时 < 锁有效期 → 获得锁
5. 否则：向所有节点发送解锁指令（Lua脚本）

解锁：向所有节点发送DEL（仅匹配自己的value）
\`\`\`

**Redlock争议与替代方案：**
- Martin Kleppmann质疑：GC暂停导致锁过期 → 时钟漂移问题
- Antirez回应：实际影响极小，工程上可用
- 替代方案：ZooKeeper临时有序节点（CP模型，更可靠但性能低）、etcd（Raft一致性）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Redis", "分布式锁", "Redlock", "并发", "一致性"]
  },

  {
    title: "消息队列消息丢失与重复消费解决方案",
    content: `在使用Kafka/RocketMQ/RabbitMQ等消息队列时，如何保证消息不丢失？如何处理重复消费？如何保证消息有序？`,
    solution: `**一、消息不丢失（三阶段保障）**

┌─────────┐    ┌──────────┐    ┌─────────┐
│ Producer │───▶│   MQ     │───▶│Consumer │
└─────────┘    └──────────┘    └─────────┘
    │                │               │
    ▼                ▼               ▼
 发送确认         持久化          手动ACK
 同步/异步       磁盘刷写        幂等处理

**Producer端：**
\`\`\`java
// Kafka: acks=all + retries
properties.put(ProducerConfig.ACKS_CONFIG, "all");  // ISR所有副本确认
properties.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
properties.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);  // 幂等生产者

// RocketMQ: 同步发送 + 重试
SendResult result = producer.send(msg, timeout);  // 同步等待Broker确认
// 返回SEND_OK表示Broker持久化成功
\`\`\`

**Broker端：**
\`\`\`
Kafka:
- log.flush.interval.messages = 1  (每条消息flush)
- log.flush.interval.ms = 1000    (或定时flush)
- replication.factor ≥ 3           (多副本)
- min.insync.replicas = 2          (至少2个副本同步)

RabbitMQ:
- queue_declare(durable=True)      (持久化队列)
- delivery_mode = 2                 (持久化消息)
- publisher confirms               (发布确认机制)
\`\`\`

**Consumer端：**
\`\`\`java
// 关闭自动ACK，业务完成后手动ACK
@KafkaListener(topics = "order-topic")
public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
    try {
        processOrder(record.value());  // 处理业务
        ack.acknowledge();             // 手动确认
    } catch (Exception e) {
        // 不ACK → 消息重新投递
        log.error("消费失败", e);
    }
}
\`\`\`

**二、重复消费（幂等性设计）**

产生原因：网络抖动导致ACK失败 → Broker重新投递 → Consumer收到重复消息

| 方案 | 适用场景 | 实现复杂度 |
|------|----------|-----------|
| 数据库唯一约束 | 写操作 | 低 |
| Redis SETNX | 简单去重 | 低 |
| 乐观锁(version) | 更新操作 | 中 |
| 分布式锁 | 复杂业务 | 高 |
| 状态机(已处理跳过) | 流程类 | 中 |

\`\`\`java
// 方案1：数据库唯一约束
INSERT INTO order_log (order_id, msg_id, status) VALUES (?, ?, 'PROCESSING')
ON CONFLICT (msg_id) DO NOTHING;  -- 重复消息插入失败，忽略

// 方案2：Redis去重
String key = "dedupe:" + msgId;
if (redis.setnx(key, "1", 24*3600)) {  // 24小时过期
    processMessage(msg);
}
// 已存在 → 跳过（幂等）
\`\`\`

**三、消息有序性**

**全局有序（性能差）：**
- Partition/Queue数量 = 1
- 所有消息串行消费
- 仅适用于低吞吐场景

**局部有序（推荐）：**
\`\`\`java
// Kafka: 相同orderId的消息发到同一Partition
producer.send(new ProducerRecord<>("order-topic", orderId.toString(), message));
// orderId作为Partition Key → Hash取模决定Partition
// 同一订单的消息有序，不同订单并行

// RocketMQ: MessageQueueSelector
producer.send(msg, new MessageQueueSelector() {
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        int index = Math.abs(arg.hashCode()) % mqs.size();
        return mqs.get(index);
    }
}, orderId);
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["消息队列", "可靠性", "幂等性", "Kafka", "RocketMQ"]
  },

  {
    title: "分布式限流六种算法与多级架构实现",
    content: `在高并发系统中，限流是保护系统的核心手段。请详解六种限流算法及其适用场景，以及如何构建多级限流架构。`,
    solution: `**六种限流算法对比：**

| 算法 | 核心思想 | 优点 | 缺点 | 适用场景 |
|------|----------|------|------|----------|
| 固定窗口 | 时间窗口内计数器 | 简单 | 窗口边界突发2倍流量 | 基础限流 |
| 滑动窗口 | 细分小格子滑动计数 | 平滑 | 内存占用略高 | API网关 |
| 漏桶 | 固定速率流出 | 平滑输出 | 不能应对突发 | 流量整形 |
| 令牌桶 | 令牌积累可突发 | 允许突发 | 初始可能有大量令牌 | Google Guava/RateLimiter |
| 滑动日志 | 精确记录每次请求时间 | 最精确 | 内存消耗大 | 高精度要求 |
| 令牌桶+漏桶组合 | 兼顾突发和平滑 | 灵活 | 实现复杂 | 复杂场景 |

**算法实现（令牌桶 - 最常用）：**

\`\`\`java
// Guava RateLimiter底层就是令牌桶
RateLimiter limiter = RateLimiter.create(100);  // QPS=100

public void handleRequest() {
    if (limiter.tryAcquire()) {  // 非阻塞尝试获取
        process();
    } else {
        reject("限流中，稍后重试");
    }

    // 或阻塞等待
    // double waitTime = limiter.acquire();  // 获取一个令牌（必要时等待）
}
\`\`\`

**Redis Lua实现滑动窗口限流：**
\`\`\`lua
-- KEY = limit:{userId}, ARGV = {windowSeconds, maxRequests}
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
if current > tonumber(ARGV[2]) then
    return 0  -- 限流
else
    return 1  -- 通过
end
\`\`\`

**Sentinel滑动窗口（阿里开源）：**
\`\`\`java
// Sentinel基于LeapArray实现高性能滑动窗口统计
// 支持QPS/线程数/并发数/响应时间/异常比例多维限流
Entry entry = SphU.entry("order-api", ResourceType.COMMON, EntryType.IN);

try {
    createOrder();
} catch (BlockException e) {
    // 被限流
    fallback();
} finally {
    entry.exit();
}

// 规则配置：资源名 / 阈值 / 模式(QPS/线程) / 控制行为(快速失败/WarmUp/排队等待)
\`\`\`

**多级限流架构：**

\`\`\`
                    ┌──────────────┐
                    │   CDN/WAF层   │  L1: IP/QPS限流（万级QPS）
                    │  CloudFlare  │  基于IP的黑/白名单
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  API Gateway  │  L2: 路由级限流（千级QPS）
                    │ Spring Cloud  │  令牌桶/漏桶 + 用户维度的限流
                    │   Gateway    │  热点参数限流（某个商品ID访问过高）
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼────┐ ┌────▼─────┐ ┌───▼──────┐
       │  Service A │ │Service B │ │ Service C │  L3: 应用级限流
       │  Sentinel  │ │Guava    │ │ 自定义    │  方法/接口粒度
       └───────────┘ └──────────┘ └──────────┘
              │            │            │
       ┌──────▼────┐ ┌────▼─────┐ ┌───▼──────┐
       │   MySQL    │ │  Redis   │ │  MQ      │  L4: 资源层保护
       │ 连接池限制  │ │连接池    │ │ 消费速率  │  数据库/缓存/MQ自身
       └───────────┘ └──────────┘ └──────────┘
\`\`\`

**限流维度：**
- IP维度：防爬虫/DDoS
- 用户维度：公平使用
- 接口维度：核心与非核心差异化
- 热点参数维度：防止热门商品拖垮系统（Sentinel热点限流）
- 系统维度：整体负载保护（CPU/内存/RT超阈值自动降级）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["限流", "高并发", "Sentinel", "Redis", "架构"]
  },

  {
    title: "服务熔断降级实战（Sentinel/Hystrix）",
    content: `当依赖的服务出现故障时，如何通过熔断降级保护系统？对比Hystrix和Sentinel的实现差异。`,
    solution: `**熔断器三态模型：**

    Closed（关闭态）          Open（打开态）         Half-Open（半开态）
    ┌──────────┐          ┌──────────┐         ┌──────────┐
    │ 正常放行  │  失败率  │ 快速失败  │  过期   │ 放行少量  │
    │ 请求到达  │ 超阈值  │ 直接拒绝  │──────▶ │ 探测恢复  │
    │ 统计指标  │──────▶  │ 进入冷却  │         │ 成功→Closed│
    └──────────┘          └──────────┘         │ 失败→Open │
                                              └──────────┘

**关键参数：**
| 参数 | 说明 | 推荐值 |
|------|------|--------|
| failureThreshold | 触发熔断的错误率阈值 | 50% |
| volumeThreshold | 最小请求数（避免偶然） | 20 |
| sleepWindow | 半开状态的持续时间 | 5-10s |
| halfOpenRequests | 半开状态放行的请求数 | 3-5 |

**Hystrix vs Sentinel对比：**

| 维度 | Hystrix（已停更） | Sentinel（阿里） |
|------|-------------------|-----------------|
| 状态 | 2018年停止维护 | 活跃维护 |
| 限流算法 | 令牌桶 | 滑动窗口(LeapArray) |
| 熔断策略 | 基于错误率/异常数 | 错误率/异常数/慢调用比例 |
| 流量控制 | 仅熔断 | QPS/线程数/并发数 |
| 热点限流 | 不支持 | 支持（精确到参数值） |
| 权重规则 | 不支持 | 支持（链路/来源） |
| 实时监控 | Dashboard（RxJava） | 控制台 + 实时推送 |
| 扩展性 | 低（继承） | 高（SPI扩展） |

**Sentinel实战：**
\`\`\`java
// 1. 定义资源
@GetMapping("/order/{id}")
public Order getOrder(@PathVariable Long id) {
    Entry entry = null;
    try {
        entry = SphU.entry("getOrder");  // 定义资源名
        return orderService.getById(id);
    } catch (BlockException e) {
        // 被限流/熔断 → 降级处理
        return Order.fallback(id);
    } finally {
        if (entry != null) entry.exit();
    }
}

// 2. 定义降级方法（注解方式更简洁）
@SentinelResource(value = "queryOrder",
    fallbackClass = OrderFallback.class, fallbackMethod = "queryFallback",
    blockHandlerClass = OrderBlockHandler.class, blockHandlerMethod = "handleBlock")
public Order queryOrder(Long id) {
    return orderService.getById(id);
}

// 3. 熔断规则配置（慢调用比例熔断）
DegradeRule rule = new DegradeRule();
rule.setResource("queryOrder");
rule.setGrade(RuleConstant.DEGRADE_GRADE_RT);  // 慢调用模式
rule.setCount(500);  // RT > 500ms视为慢调用
rule.setSlowRatioThreshold(0.6);  // 慢调用比例 > 60%
rule.setTimeWindow(10);  // 熔断持续10秒
rule.setMinRequestAmount(10);  // 最小请求数
\`\`\`

**降级策略：**
1. **默认值返回**：列表页返回空数组、详情页返回默认数据
2. **缓存兜底**：降级到本地缓存或Redis旧数据
3. **静态页面**：降级到预渲染的静态HTML
4. **排队等待**：非核心功能进入队列延迟处理
5. **友好提示**："当前排队人数较多，请稍后再试"`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "熔断", "降级", "Sentinel", "Hystrix"]
  },

  {
    title: "Docker容器化基础与Compose编排实战",
    content: `Docker已成为应用交付的标准格式。请详解Docker核心概念、镜像优化技巧，以及如何用Docker Compose编排多容器应用。`,
    solution: `**Docker核心概念：**

\`\`\`
Image（镜像）        Container（容器）        Registry（仓库）
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 只读分层文件  │───▶│ 可写层+运行  │    │ 存储和分发  │
│ Dockerfile   │    │ 独立进程空间  │    │ Docker Hub  │
│ layer1-base  │    │ 独立网络栈   │    │ 私有Registry│
│ layer2-runtime│   │ 独立文件系统  │    │ Aliyun ACR  │
│ layer3-app   │    │ Namespace   │    │ Harbor      │
└─────────────┘    │ Cgroups     │    └─────────────┘
                   └─────────────┘

镜像分层（Copy-on-Write）：
├── app:latest (可写容器层)
├── layer3: COPY target/app.jar (应用层)
├── layer2: RUN apt-get install openjdk-17 (运行时)
├── layer1: FROM eclipse-temurin:17-jre (基础镜像)
└── (共享只读层，多个容器复用节省磁盘)
\`\`\`

**Dockerfile最佳实践：**
\`\`\`dockerfile
# ✅ 多阶段构建（减小镜像体积）
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine  # Alpine基础镜像（~50MB vs Debian ~150MB）
WORKDIR /app
COPY --from=builder /app/target/app.jar ./app.jar
RUN adduser -D appuser  # 非root用户运行
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Xmx256m", "app.jar"]

# 优化要点：
# 1. .dockerfileignore 排除 .git/node_modules/target
# 2. RUN指令合并（减少层数）
# 3. 变化的COPY放后面（利用缓存）
# 4. 生产用确定性的TAG（不用latest）
# 5. HEALTHCHECK健康检查
\`\`\`

**Docker Compose编排（Spring Boot + MySQL + Redis）：**
\`\`\`yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mydb?useSSL=false
      - SPRING_REDIS_HOST=redis
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: mydb
    volumes:
      - mysql_data:/var/lib/mysql  # 数据持久化
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # 初始化脚本
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes  # 开启AOF持久化
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - backend

volumes:
  mysql_data:
  redis_data:

networks:
  backend:
    driver: bridge

# 启动: docker compose up -d
# 查看: docker compose ps
# 日志: docker compose logs -f app
# 停止: docker compose down
\`\`\`

**常用排查命令：**
\`\`\`bash
docker stats                    # 容器实时资源占用
docker inspect <container>      # 详细配置信息
docker logs -f --tail 100 <id>  # 查看日志
docker exec -it <id> sh         # 进入容器调试
docker top <id>                 # 查看容器内进程
docker port <id>                # 端口映射关系
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["DevOps", "Docker", "容器化", "Compose", "运维"]
  },

  {
    title: "CI/CD流水线设计与GitHub Actions实战",
    content: `现代开发团队都采用CI/CD实现自动化交付。请设计一套完整的CI/CD流水线，涵盖代码质量、自动化测试、构建部署全流程。`,
    solution: `**CI/CD流水线架构：**

\`\`\`
Code Commit → Build → Test → Security Scan → Package → Deploy to Staging → E2E Test → Deploy to Prod
     │          │       │         │            │              │              │
     ▼          ▼       ▼         ▼            ▼              ▼              ▼
  Push Trigger  Maven   Unit      SonarQube    Docker         K8s Deploy     K8s Deploy
  PR Trigger   Compile  Test      Trivy Scan   Image Push     Canary Release  RollingUpdate
                     Integ     Dependency   Helm Chart     Smoke Test     Health Check
                     Test      Check(Snyk)   Artifact
\`\`\`

**GitHub Actions工作流示例：**
\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  # Job 1: 代码质量与单元测试
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Run unit tests
        run: mvn test -Dsurefire.skip=false
        # 覆盖率报告

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # Job 2: 安全扫描
  security:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'

      - name: Check dependencies (OWASP Dependency-Check)
        run: mvn org.owasp:dependency-check-maven:check

  # Job 3: 构建并推送镜像
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Job 4: 部署到测试环境
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/app \
            app=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \
            -n staging

      - name: Smoke test
        run: |
          kubectl rollout status deployment/app -n staging --timeout=120s
          curl -f https://staging.example.com/api/health || exit 1

  # Job 5: 部署到生产环境（手动审批）
  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # 配置required reviewers
    steps:
      - name: Deploy to production (Rolling Update)
        run: |
          kubectl set image deployment/app \
            app=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \
            -n production

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/app -n production --timeout=300s
\`\`\`

**关键实践：**
- **分支策略**：main(生产) ← develop(测试) ← feature/*(开发)
- **环境隔离**：dev/staging/prod独立命名空间，配置通过ConfigMap/Secret管理
- **灰度发布**：Canary Deployment（先10%流量验证，再逐步扩大）
- **回滚机制**：\`kubectl rollout undo deployment/app\` 一键回滚到上一版本
- **基础设施即代码**：K8s清单/Terraform/Helm Chart全部版本管理`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["DevOps", "CI/CD", "GitHub Actions", "自动化部署", "Kubernetes"]
  },

  {
    title: "ELK日志收集与分析平台搭建",
    content: `在生产环境中，如何搭建完整的ELK(Elasticsearch+Logstash+Kibana)日志平台？如何进行结构化日志采集、索引生命周期管理和告警？`,
    solution: `**ELK架构全景：**

\`\`\`
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│App Pod 1 │  │App Pod 2 │  │App Pod N │  │System    │  │Nginx    │
│(Filebeat)│  │(Filebeat)│  │(Filebeat)│  │(Journal) │  │(Filebeat)│
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │             │
     └─────────────┴──────┬──────┴─────────────┴─────────────┘
                        │
                 ┌──────▼──────┐
                 │  Logstash    │  ← 收集、解析、过滤、缓冲
                 │  (Buffer:    │
                 │   Kafka/Redis)│
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │Elasticsearch │  ← 存储 + 搜索 + 分析
                 │ (3 Master   │
                 │  + Data节点) │
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │   Kibana     │  ← 可视化 + 告警 + Dashboard
                 └─────────────┘
\`\`\`

**Filebeat配置（应用侧日志采集）：**
\`\`\`yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  json.keys_under_root: true
  json.add_error_key: true
  json.message_key: message
  multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
  multiline.negate: true
  multiline.match: after
  fields:
    env: production
    service: order-service
    team: backend

output.logstash:
  hosts: ["logstash:5044"]
  loadbalance: true

# 结构化日志格式（应用端输出JSON）
// Logback JSON配置或自定义JSON layout
{"timestamp":"2024-01-15T10:23:45","level":"INFO","logger":"OrderService",
 "message":"订单创建成功","traceId":"abc123","userId":"u1001","orderId":"O20240115001","cost":125}
\`\`\`

**Logstash管道配置：**
\`\`\`ruby
# logstash pipeline.conf
input {
  beats {
    port => 5044
  }
}

filter {
  # 解析JSON日志
  json {
    source => "message"
  }

  # 提取时间字段
  date {
    match => ["timestamp", "ISO8601"]
  }

  # User-Agent解析
  useragent {
    source => "user_agent"
    target => "ua"
  }

  # GeoIP定位
  geoip {
    source => "client_ip"
    target => "geoip"
  }

  # 删除冗余字段
  mutate {
    remove_field => ["agent", "ecs", "log", "input", "@version"]
  }

  # 添加环境标签
  mutate {
    add_field => { "cluster" => "prod-beijing" }
  }
}

output {
  elasticsearch {
    hosts => ["es-node1:9200", "es-node2:9200"]
    index => "app-%{[fields.service]}-%{+YYYY.MM.dd}"
    template => "/etc/logstash/template.json"
    template_name => "app-template"
    template_overwrite => true
  }
}
\`\`\`

**Elasticsearch Index Lifecycle Management（ILM）：**
\`\`\`json
// ILM策略：Hot(7天) → Warm(30天) → Cold(60天) → Delete
PUT _ilm/policy/app-log-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {"max_size": "50gb", "max_age": "7d"},
          "set_priority": {"priority": 100}
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {"number_of_shards": 1},
          "forcemerge": {"max_num_segments": 1},
          "set_priority": {"priority": 50}
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "allocate": {"number_of_replicas": 0},
          "set_priority": {"priority": 0}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
\`\`\`

**Kibana告警配置：**
\`\`\`
告警规则示例：
- 错误日志激增：最近5分钟ERROR级别日志 > 100条 → 发送钉钉/Slack通知
- 响应时间异常：P99 RT > 3s 持续2分钟 → 触发PagerDuty
- 异常状态码：5xx错误率 > 1% → 立即通知on-call人员
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["DevOps", "ELK", "Elasticsearch", "日志", "监控"]
  },

  {
    title: "数据库读写分离架构设计与实现",
    content: `随着业务增长，单库无法承载读写压力。请详述数据库读写分离的架构设计、主从复制原理、路由策略和一致性问题解决方案。`,
    solution: `**读写分离架构：**

\`\`\`
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  数据源路由  │  ShardingSphere / MyCat / 自研中间件
                    │  (Proxy层)  │  SQL解析 → 读写判断 → 路由分发
                    └──┬───────┬──┘
                       │       │
                  写操作    读操作
                       │       │
              ┌──────▼──┐ ┌──▼────────┐ ┌──────────┐
              │ Master  │ │ Slave-1   │ │ Slave-2  │
              │ (主库)  │ │ (从库RO)  │ │ (从库RO) │
              │  Write  │ │  Read     │ │  Read    │
              └────┬─────┘ └─────┬────┘ └────┬─────┘
                   │             │           │
                   └──────┬──────┘           │
                          │  Binlog异步复制   │
                          ▼                  │
                   ┌─────────────────────────┘
                   │  主从复制流程：
                   │  1. Master写入Binlog
                   │  2. Slave IO Thread拉取Binlog → Relay Log
                   │  3. Slave SQL Thread执行Relay Log
                   └───────────────────────────
\`\`\`

**主从复制三种模式：**

| 模式 | 延迟 | 一致性 | 数据安全性 | 适用场景 |
|------|------|--------|-----------|---------|
| 异步复制(Async) | ~ms级 | 最终一致 | Master崩溃可能丢数据 | 读多写少，容忍少量不一致 |
| 半同步(Semi-Sync) | ~10ms | 强一致 | 至少一个Slave确认 | 金融/支付 |
| 组复制(MGR/Galera) | ~ms级 | 强一致 | 多数派写入 | 高可用要求 |

**路由策略实现：**
\`\`\`java
// 方式1：ShardingSphere-JDBC（客户端路由）
spring.shardingsphere.datasource.names=master,slave0,slave1
spring.shardingsphere.rules.readwrite-split.data-sources.myds.write-data-source-name=master
spring.shardingsphere.rules.readwrite-split.data-sources.myds.read-data-source-names=slave0,slave1
spring.shardingsphere.rules.readwrite-split.load-balancers.round-robin.type=ROUND_ROBIN

// 方式2：动态数据源（AOP切换）
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadOnly {}

@Aspect
@Component
public class DataSourceAspect {
    @Around("@annotation(readOnly)")
    public Object around(ProceedingJoinPoint pjp, ReadOnly readOnly) {
        try {
            DynamicDataSourceContextHolder.setSlave();
            return pjp.proceed();
        } finally {
            DynamicDataSourceContextHolder.clear();
        }
    }
}

// 使用
@ReadOnly
public List<Order> queryOrders() { ... }  // 自动走从库
public void createOrder() { ... }         // 默认走主库
\`\`\`

**主从延迟问题及解决方案：**

问题：刚写入的数据立即查询可能查不到（从库还没同步完）

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 强制主库读 | 写后短时间内读主库 | 简单可靠 | 主库压力大 |
| 延迟监控 | 监控Seconds_Behind_Master | 可感知 | 无法完全避免 |
| Cache补偿 | 写入时同步写缓存，读优先读缓存 | 性能好 | 缓存一致性复杂 |
| 消息队列补偿 | 写后发MQ延迟查询 | 最终一致 | 架构复杂 |
| Cauchy策略 | 随机选择主库概率(如5%) | 简单 | 不确定性 |

**半同步复制配置（MySQL）：**
\`\`\`sql
-- Master安装插件
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 1000;  -- 1s超时退化为异步

-- Slave安装插件
INSTALL PLUGIN rpl_semi_sync_slave SONAME 'semisync_slave.so';
SET GLOBAL rpl_semi_sync_slave_enabled = 1;
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["数据库", "读写分离", "主从复制", "MySQL", "架构"]
  },

  {
    title: "缓存穿透/击穿/雪崩原因分析与解决方案",
    content: `Redis缓存的三大经典问题——穿透、击穿、雪崩，是每个后端工程师必掌握的知识点。请深入分析每种问题的根因和解决方案。`,
    solution: `**三大问题对比：**

\`\`\`
场景描述：

缓存穿透：查询一个【不存在】的数据
→ Redis没有 → DB也没有 → 每次都穿透到DB
→ 恶意攻击：大量请求不存在的ID → DB被打死

缓存击穿：某个【热点Key】突然过期
→ 大量并发请求同时打到DB
→ 类似"千军万马过独木桥"

缓存雪崩：大批量Key【同时过期】或Redis宕机
→ 所有请求瞬间打到DB
→ DB压力暴增 → 雪崩效应
\`\`\`

**一、缓存穿透解决方案：**

\`\`\`java
// 方案1：布隆过滤器（Bloom Filter）— 预判数据是否存在
// Guava BloomFilter（本地）
BloomFilter<String> filter = BloomFilter.create(Funnels.stringFunnel(), 1000000, 0.01);
// 初始化：将所有合法ID加入过滤器
allValidIds.forEach(id -> filter.put(id));

public Object query(String id) {
    if (!filter.mightContain(id)) {  // 一定不存在
        return null;  // 直接返回，不查DB
    }
    // 可能存在 → 正常查缓存/DB
}

// 方案2：Redis Bitmap / RedisBloom（Redis布隆过滤器）
BF.ADD user:filter "user:1001"
BF.EXISTS user:filter "user:9999"  → 0（不存在）

// 方案3：空值缓存（短过期时间）
public Object query(String id) {
    Object val = redis.get(key);
    if (val != null) {
        return "NULL".equals(val) ? null : val;  // 空值标记
    }
    val = db.query(id);
    if (val == null) {
        redis.setex(key, 60, "NULL");  // 缓存空值60秒
    } else {
        redis.setex(key, 3600, val);
    }
    return val;
}
\`\`\`

**二、缓存击穿解决方案：**

\`\`\`java
// 方案1：互斥锁（最常用）
public Object queryWithLock(String key) {
    Object val = redis.get(key);
    if (val != null) return val;

    String lockKey = "lock:" + key;
    try {
        // 尝试获取分布式锁（SET NX EX）
        if (redis.setnx(lockKey, "1", 10)) {  // 锁10秒自动释放
            val = db.query(key);  // 只有获得锁的线程查DB
            redis.setex(key, 3600, val);
            return val;
        } else {
            // 获取锁失败 → 短暂休眠后重试（或返回降级数据）
            Thread.sleep(50);
            return queryWithLock(key);  // 递归重试
        }
    } finally {
        redis.del(lockKey);
    }
}

// 方案2：逻辑过期（不设物理TTL，异步重建）
@Data
public class CacheData {
    private Object data;
    private LocalDateTime expireTime;  // 逻辑过期时间
}

public Object queryLogicalExpire(String key) {
    CacheData cacheData = redis.get(key);
    if (cacheData == null) return null;
    if (!cacheData.isExpired()) return cacheData.getData();

    // 已逻辑过期 → 尝试重建缓存（互斥锁防止重复重建）
    String lockKey = "lock:rebuild:" + key;
    if (redis.setnx(lockKey, "1", 10)) {
        executor.submit(() -> {
            try {
                Object newVal = db.query(key);
                redis.set(key, new CacheData(newVal, now.plusHours(1)));
            } finally {
                redis.del(lockKey);
            }
        });
    }
    // 返回旧数据（逻辑过期但物理存在）
    return cacheData.getData();
}
\`\`\`

**三、缓存雪崩解决方案：**

\`\`\`
方案1：过期时间随机打散
redis.setex(key, 3600 + Random.nextInt(600), value)  // 3600~4200秒随机

方案2：多级缓存架构
L1: 本地缓存(Caffeine/Guava) → TTL短(1min) → 抗住大部分读
L2: Redis缓存 → TTL长(1h) → 作为二级
L3: DB → 最终兜底

方案3：Redis高可用（防止单点故障）
Redis Sentinel (哨兵) 或 Redis Cluster (集群)
自动故障转移，RPO ≈ 秒级

方案4：熔断降级
DB压力过大时 → 降级到默认值/静态页面/友好提示
限流 + 熔断双重保护

方案5：预热机制
定时任务或启动时将热点数据加载到缓存
活动开始前主动预热（如双11前预热商品信息）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Redis", "缓存", "高并发", "性能优化", "架构"]
  },

  {
    title: "接口幂等性设计方案",
    content: `在网络不稳定或用户重复点击的情况下，如何保证接口的幂等性（多次请求结果与一次请求相同）？请给出多种场景下的解决方案。`,
    solution: `**幂等性核心：** f(f(x)) = f(x)，同一操作执行一次与多次效果相同。

**需要幂等的场景：**
- 支付回调（商户可能重复通知）
- 订单创建（用户重复点击提交）
- 库扣减（消息重复消费）
- 表单提交（网络超时用户重试）

**方案一：唯一约束（数据库层 — 最可靠）**

\`\`\`sql
-- 订单表增加唯一键（业务号唯一）
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(64) NOT NULL,
    amount DECIMAL(10,2),
    status VARCHAR(20),
    created_at DATETIME,
    UNIQUE KEY uk_order_no (order_no)  -- 唯一约束保证幂等
);

-- 插入时冲突则忽略（幂等插入）
INSERT INTO orders (order_no, amount, status) VALUES ('ORD20240115001', 99.00, 'PENDING')
ON DUPLICATE KEY UPDATE status = status;  -- 冲突时不做任何修改

-- 或者先查后改（乐观锁）
UPDATE inventory SET count = count - 1, version = version + 1
WHERE product_id = 1001 AND version = 5;  -- version匹配才更新
\`\`\`

**方案二：Token令牌（前端配合 — 防重复提交）**

\`\`\`java
// Step 1: 前端进入表单页时获取Token
@GetMapping("/token")
public String getToken() {
    String token = UUID.randomUUID().toString();
    redis.setex("idempotent:" + token, 300, "1");  // 5分钟有效
    return token;
}

// Step 2: 提交表单时携带Token（Header或Parameter）
@PostMapping("/order")
public Result createOrder(@RequestHeader("Idempotency-Key") String token, @RequestBody OrderDTO dto) {
    // Step 3: 删除Token（原子操作 Lua脚本）
    String script =
        "if redis.call('exists', KEYS[1]) == 1 then " +
        "    return redis.call('del', KEYS[1]) " +  // Token存在 → 删除并放行
        "else " +
        "    return 0 " +                            // Token不存在 → 重复提交
        "end";

    Long result = redis.eval(script, "idempotent:" + token);
    if (result == 0) {
        return Result.fail("请勿重复提交");
    }

    // 正常创建订单...
    return Result.success(order);
}
\`\`\`

**方案三：状态机（流程类操作 — 防止乱序）**

\`\`\`java
// 订单状态流转（只能按指定路径转换）
public enum OrderStatus {
    PENDING(1), PAID(2), SHIPPED(3), COMPLETED(4), CANCELLED(5);

    // 允许的状态转换
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
        PENDING, Set.of(PAID, CANCELLED),
        PAID, Set.of(SHIPPED),
        SHIPPED, Set.of(COMPLETED)
    );

    public boolean canTransitionTo(OrderStatus next) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }
}

@Transactional
public void payOrder(Long orderId) {
    Order order = orderRepo.findById(orderId);
    // 校验当前状态是否允许支付
    if (!order.getStatus().canTransitionTo(OrderStatus.PAID)) {
        throw new BizException("订单状态不允许支付（可能已支付）");
    }
    order.setStatus(OrderStatus.PAID);
    orderRepo.save(order);
    // UPDATE orders SET status='PAID' WHERE id=? AND status='PENDING' (CAS)
}
\`\`\`

**方案四：去重表（通用方案）**

\`\`\`sql
CREATE TABLE idempotent_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    biz_key VARCHAR(128) NOT NULL,     -- 业务唯一标识（如orderId + operation）
    result VARCHAR(1000),              -- 缓存上次执行结果
    expire_at DATETIME,                -- 过期时间
    UNIQUE KEY uk_biz_key (biz_key)
);

-- 执行前先查去重表
SELECT result FROM idempotent_table WHERE biz_key = 'ORDER:1001:PAY' AND expire_at > NOW();
-- 有结果 → 直接返回（幂等）
-- 无结果 → 执行业务 → 写入去重表
\`\`\`

**各方案选型指南：**

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 创建订单（有唯一业务号） | 数据库唯一约束 | 最简单可靠 |
| 表单防重复提交 | Token机制 | 前后端配合 |
| 状态变更（支付/发货） | 状态机 + CAS更新 | 天然防重复 |
| 通用场景（无唯一标识） | Redis去重 + 去重表 | 灵活通用 |
| MQ消费者 | 消息唯一ID + 去重表 | 保证消费幂等 |`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["架构", "幂等性", "分布式", "设计", "高可用"]
  },

  {
    title: "灰度发布（金丝雀发布）策略与实现",
    content: `如何安全地将新版本发布到生产环境？请详述灰度发布的多种策略、技术实现和回滚机制。`,
    solution: `**灰度发布策略对比：**

| 策略 | 原理 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|----------|
| 按比例灰度 | 按权重分配流量（如5%→20%→50%→100%） | 简单可控 | 随机性可能导致体验不一致 | 通用场景 |
| 按用户灰度 | 白名单用户/特定群体优先体验 | 定向验证 | 需要用户标识体系 | 内部测试/Beta用户 |
| 按标签灰度 | Header/Cookie携带灰度标签 | 精细控制 | 需要客户端配合 | Feature Flag |
| 按地域灰度 | 特定地区/机房先行 | 隔离风险 | 地域覆盖不均 | 多地域部署 |
| 全链路灰度 | 从网关到DB整条调用链路灰度 | 彻底隔离 | 实现复杂 | 微服务架构 |

**技术实现（Spring Cloud Gateway + Header标签）：**

\`\`\`java
// 1. 网关层灰度路由
@Component
public class GrayRoutePredicateFactory extends AbstractRoutePredicateFactory<GrayRouteConfig> {

    public Predicate<ServerWebExchange> apply(GrayRouteConfig config) {
        return exchange -> {
            String grayTag = exchange.getRequest().getHeaders().getFirst("X-Gray-Tag");
            if ("true".equals(grayTag)) {
                // 灰度流量路由到灰度服务实例
                return true;  // 匹配灰度路由
            }
            return false;  // 走正常路由
        };
    }
}

// application.yml 灰度路由配置
spring:
  cloud:
    gateway:
      routes:
        - id: order-service-gray
          uri: lb://order-service
          predicates:
            - Path=/api/order/**
            - Gray=true  # 自定义谓词
          metadata:
            version: gray
        - id: order-service-normal
          uri: lb://order-service
          predicates:
            - Path=/api/order/**
          metadata:
            version: stable

// 2. 负载均衡层面：Nacos元数据路由
// 灰度实例注册时带metadata: {version: gray}
// Ribbon/NacosLoadBalancer根据version选择对应实例
\`\`\`

**Feature Flag（功能开关）实现：**
\`\`\`java
// 功能开关服务
@Service
public class FeatureFlagService {

    @Autowired
    private RedisTemplate redisTemplate;

    // 检查功能是否开启（支持用户维度）
    public boolean isEnabled(String featureKey, String userId) {
        // 1. 全局开关
        Boolean globalEnabled = redisTemplate.opsForValue().get("ff:" + featureKey + ":global");
        if (Boolean.FALSE.equals(globalEnabled)) return false;

        // 2. 百分比灰度（用户ID哈希）
        String percentStr = redisTemplate.opsForValue().get("ff:" + featureKey + ":percent");
        if (percentStr != null) {
            int percent = Integer.parseInt(percentStr);
            int hash = Math.abs(userId.hashCode() % 100);
            if (hash >= percent) return false;
        }

        // 3. 用户白名单
        Boolean inWhitelist = redisTemplate.opsForSet().isMember(
            "ff:" + featureKey + ":whitelist", userId);
        return Boolean.TRUE.equals(inWhitelist);
    }
}

// 业务代码中使用
@GetMapping("/api/v2/orders")
public Result getOrdersV2(@RequestHeader("X-User-Id") String userId) {
    if (!featureFlagService.isEnabled("new-order-api", userId)) {
        // 未命中灰度 → 走旧接口
        return getOrdersV1(userId);
    }
    // 命中灰度 → 新逻辑
    return orderServiceV2.query(userId);
}
\`\`\`

**灰度发布流程：**

\`\`\`
1. 准备阶段
   ├── 代码Review + 自动化测试通过
   ├── 灰度配置就绪（比例/白名单/Feature Flag）
   ├── 监控大盘就绪（新旧版本对比指标）
   └── 回滚预案准备（一键回滚按钮）

2. 灰度执行（逐步放量）
   ├── Phase 1: 1-5% 流量（内部用户/测试账号）
   │   ├── 观察5-30分钟
   │   ├── 检查：错误率、RT、CPU/内存、业务指标
   │   └── 异常 → 立即回滚
   ├── Phase 2: 20% 流量（扩大范围）
   │   ├── 观察1-2小时
   │   └── 对比新旧版本核心指标
   ├── Phase 3: 50% 流量
   │   ├── 观察2-4小时
   │   └── 全量监控
   └── Phase 4: 100% 流量（全量发布）
       ├── 清理灰度配置
       └── 下线旧版本

3. 回滚机制
   ├── K8s: kubectl rollout undo deployment/app
   ├── 网关：切掉灰度路由规则
   ├── Feature Flag：关闭开关（立即切回旧逻辑）
   └── 数据库：如有Schema变更需考虑回滚兼容
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["微服务", "灰度发布", "DevOps", "架构", "高可用"]
  },

  {
    title: "短链接系统设计（类似bit.ly/t.cn）",
    content: `设计一个高可用的短链接生成系统，支持亿级流量、低延迟、高可用。请给出完整的架构设计和核心算法。`,
    solution: `**需求分析：**

| 指标 | 要求 |
|------|------|
| QPS | 写 10,000，读 100,000 |
| 延迟 | P99 < 50ms |
| 可用性 | 99.99% |
| 短码长度 | 6-7位（62^6 = 568亿，62^7 = 3.5万亿） |
| 字符集 | a-z A-Z 0-9（共62个字符） |

**核心算法：自增ID + Base62编码**

\`\`\`java
public class ShortUrlGenerator {
    private static final String BASE62_CHARS =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // ID → 短码（Base62编码）
    public static String encode(long id) {
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(BASE62_CHARS.charAt((int)(id % 62)));
            id /= 62;
        }
        // 左补零到固定长度
        while (sb.length() < 6) {
            sb.append('0');
        }
        return sb.reverse().toString();  // 反转（低位在后）
    }

    // 短码 → ID（Base62解码）
    public static long decode(String shortCode) {
        long id = 0;
        for (int i = 0; i < shortCode.length(); i++) {
            id = id * 62 + BASE62_CHARS.indexOf(shortCode.charAt(i));
        }
        return id;
    }

    // 示例：id=1000000000 → "15jcwVc"（7位短码）
}

// ID生成：Snowflake（前面已详述）或号段模式
\`\`\`

**防碰撞策略（可选MD6/hash方案）：**
\`\`\`java
// 如果不想暴露自增ID规律，可以用hash+前缀
public static String generateByHash(String longUrl) {
    // MD5取前7字节 → Base62编码
    byte[] md5 = DigestUtils.md5(longUrl + System.currentTimeMillis());
    long num = ByteBuffer.wrap(Arrays.copyOf(md5, 7)).getLong();
    return Base62.encode(Math.abs(num) % (long)Math.pow(62, 7));
}
// 碰撞时递增后缀重试
\`\`\`

**系统架构：**

\`\`\`
                          ┌─────────────┐
                          │   用户浏览器   │
                          └──────┬──────┘
                                 │
                    ┌────────────▼────────────┐
                    │       CDN 层             │  短链接301/302缓存
                    │     (Cache Hit率高)      │  TTL=1h
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    API Gateway (K8s)     │  限流/鉴权/路由
                    │   Spring Cloud Gateway   │
                    └──────┬─────────────┬────┘
                           │             │
                    写操作 │             │ 读操作
                           ▼             ▼
              ┌────────────────┐  ┌──────────────────┐
              │  写入服务集群    │  │   读取服务集群    │
              │  (Generate)    │  │   (Redirect)     │
              │  3 Node        │  │   10 Node        │
              └───────┬────────┘  └──────┬───────────┘
                      │                   │
              ┌───────▼────────┐  ┌──────▼───────────┐
              │   MySQL Cluster │  │   Redis Cluster  │
              │   (分库分表)    │  │   (短码→长URL)   │
              │   16 shards × 2 │  │   6主6从         │
              └────────────────┘  └──────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   异步预热CDN    │
                          │   (新短链写入后)  │
                          └─────────────────┘
\`\`\`

**核心流程：**

**1. 生成短链（写路径）：**
\`\`\`java
@PostMapping("/shorten")
public Result shorten(@RequestBody ShortenRequest req) {
    // 1. 参数校验 + 黑名单过滤（钓鱼/违法URL）
    if (isBlacklisted(req.getLongUrl())) {
        return Result.fail("URL不允许");
    }

    // 2. 查重（同一长URL返回已有的短码）
    String existingCode = redis.hget("url:hash", hash(req.getLongUrl()));
    if (existingCode != null) {
        return Result.success(domain + "/" + existingCode);
    }

    // 3. 生成全局唯一ID
    long id = snowflake.nextId();

    // 4. Base62编码
    String shortCode = Base62.encode(id);

    // 5. 双写：DB + Redis
    urlMappingRepository.insert(id, shortCode, req.getLongUrl());
    redis.hset("url:map", shortCode, req.getLongUrl());

    // 6. 异步预热CDN
    mq.send("cdn-prewarm", shortCode);

    return Result.success(domain + "/" + shortCode);
}
\`\`\`

**2. 302跳转（读路径）：**
\`\`\`java
@GetMapping("/{shortCode:[a-zA-Z0-9]{6,7}}")
public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
    // 1. 查Redis（L1缓存）
    String longUrl = redis.hget("url:map", shortCode);
    if (longUrl != null) {
        return ResponseEntity.status(302).location(URI.create(longUrl)).build();
    }

    // 2. Redis Miss → 查DB
    UrlMapping mapping = urlMappingRepository.findByShortCode(shortCode);
    if (mapping == null) {
        return ResponseEntity.status(404).build();
    }

    // 3. 回填Redis
    redis.hset("url:map", shortCode, mapping.getLongUrl());

    // 4. 302跳转（利于统计分析；301省带宽但不便统计）
    return ResponseEntity.status(302).location(URI.create(mapping.getLongUrl())).build();
}
\`\`\`

**扩展优化：**
- **自定义短码**：用户指定有意义的短码（如 t.cn/spring → 需要唯一性校验）
- **有效期**：部分短码有过期时间（活动链接）
- **访问统计**：PV/UV/地区/设备/Referer（点击事件发MQ异步聚合）
- **安全防护**：防刷限流（同一IP每分钟最多生成N个）、反钓鱼`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["系统设计", "短链接", "Base62", "高并发", "架构"]
  }
];