export interface BackendQuestion {
  title: string;
  content: string;
  solution?: string;
  codeTemplate?: Record<string, string>;
  difficulty: "easy" | "medium" | "hard";
  questionType: "code" | "qa";
  tags: string[];
}

export const backendQuestions: BackendQuestion[] = [
  // ==================== Java 深入 (1-25) ====================
  {
    title: "Java反射机制原理与性能优化",
    content: `## 题目描述

请深入分析Java反射机制的实现原理，包括：

1. 反射API的核心类及其关系（Class、Field、Method、Constructor）
2. 反射调用方法的底层实现机制（Method.invoke的执行流程）
3. 反射的性能开销来源及优化方案
4. 反射在框架中的典型应用场景

### 考察点

- JVM内部表示
- 方法分派机制
- 安全管理器
- 内联缓存失效`,
    solution: `## 反射机制深度解析

### 一、核心类关系图

\`\`\`
java.lang.Class (类的元信息)
├── Field (字段信息)
│   ├── getType() - 字段类型
│   ├── get() / set() - 读写操作
│   └── getModifiers() - 访问修饰符
├── Method (方法信息)
│   ├── invoke() - 方法调用
│   ├── getParameterTypes() - 参数类型
│   └── getReturnType() - 返回类型
└── Constructor (构造器)
    ├── newInstance() - 创建实例
    └── getParameterTypes() - 参数类型
\`\`\`

### 二、Method.invoke执行流程

\`\`\`java
// 伪代码展示invoke的核心逻辑
public Object invoke(Object obj, Object... args) {
    // 1. 权限检查
    if (!override) {
        checkAccess(obj, modifiers);
    }

    // 2. 获取MethodAccessor（有缓存机制）
    MethodAccessor ma = methodAccessor;
    if (ma == null) {
        ma = acquireMethodAccessor();  // 委托给NativeMethodAccessorImpl
    }

    // 3. 执行方法调用
    return ma.invoke(obj, args);
}
\`\`\`

**三层委派架构**：
- \`Method\` → \`MethodAccessor\`（接口）
- \`NativeMethodAccessorImpl\`（JNI调用，前15次）
- \`GeneratedMethodAccessor1\`（字节码生成，第16次起）

**为什么有阈值？** JNI启动慢但长期快，字节码生成快但有类加载开销。默认15次是经验值。

### 三、性能优化方案

| 方案 | 性能提升 | 适用场景 |
|------|---------|---------|
| Method.setAccessible(true) | 2-3x | 绕过安全检查 |
| 缓存Method对象 | 5-10x | 避免重复查找 |
| MethodHandle | 接近直接调用 | Java 7+ |
| Code Generation (ASM) | 等同直接调用 | 高性能框架 |

\`\`\`java
// 优化示例：使用MethodHandle替代反射
public class ReflectionOptimization {
    private static final MethodHandle HANDLE;

    static {
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        Method method = TargetClass.class.getDeclaredMethod("targetMethod", String.class);
        method.setAccessible(true);
        HANDLE = lookup.unreflect(method);
    }

    public Object invoke(Object target, String arg) throws Throwable {
        return HANDLE.invoke(target, arg);  // 性能接近直接调用
    }
}
\`\`\`

### 四、典型应用场景

1. **Spring IOC**：依赖注入时通过反射创建Bean
2. **Jackson/Gson**：JSON序列化反序列化
3. **JDBC驱动加载**：Class.forName("com.mysql.cj.jdbc.Driver")
4. **动态代理**：Proxy.newProxyInstance()
5. **单元测试框架**：JUnit/TestNG访问私有方法`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java深入", "反射", "JVM"]
  },

  {
    title: "Java注解处理器(APT)实战开发",
    content: `## 题目描述

请设计并实现一个基于注解处理器(APT)的代码生成工具，要求：

1. 自定义注解 @Builder，用于自动生成Builder模式代码
2. 实现注解处理器，在编译期生成对应的XXXBuilder类
3. 处理嵌套对象和集合类型的字段
4. 支持必填字段校验（通过@Required注解）

### 示例输入

\`\`\`java
@Builder
public class User {
    @Required
    private String name;
    private int age;
    private List<String> hobbies;
}
\`\`\`

### 期望输出

编译期自动生成 UserBuilder 类。

### 考察点

- AbstractProcessor API
- javax.lang.model API
- Filer文件生成
- Element/TypeMirror处理`,
    solution: `## 注解处理器完整实现

### 一、定义注解

\`\`\`java
import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface Builder {}

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.SOURCE)
public @interface Required {}
\`\`\`

### 二、实现处理器

\`\`\`java
@SupportedAnnotationTypes("com.example.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_11)
public class BuilderProcessor extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                           RoundEnvironment roundEnv) {

        for (Element element : roundEnv.getElementsAnnotatedWith(Builder.class)) {
            TypeElement typeElement = (TypeElement) element;
            generateBuilderClass(typeElement);
        }
        return true;
    }

    private void generateBuilderClass(TypeElement typeElement) {
        String className = typeElement.getSimpleName().toString();
        String builderClassName = className + "Builder";
        String packageName = processingEnv.getElementUtils()
            .getPackageOf(typeElement).getQualifiedName().toString();

        try (Writer writer = processingEnv.getFiler()
                .createSourceFile(packageName + "." + builderClassName)
                .openWriter()) {

            writer.write(generateCode(typeElement, className, builderClassName));
        } catch (IOException e) {
            processingEnv.getMessager().printMessage(
                Diagnostic.Kind.ERROR, e.getMessage());
        }
    }

    private String generateCode(TypeElement typeElement,
                                String className,
                                String builderClassName) {
        StringBuilder sb = new StringBuilder();
        List<? extends Element> fields = typeElement.getEnclosedElements().stream()
            .filter(e -> e.getKind() == ElementKind.FIELD)
            .collect(Collectors.toList());

        sb.append("package ").append(getPackage(typeElement)).append(";\\n\\n");
        sb.append("import java.util.*;\\n\\n");
        sb.append("public class ").append(builderClassName).append(" {\\n");

        // 字段声明
        for (Element field : fields) {
            VariableElement var = (VariableElement) field;
            sb.append("    private ")
              .append(var.asType()).append(" ")
              .append(var.getSimpleName()).append(";\\n");
        }

        // setter方法
        for (Element field : fields) {
            VariableElement var = (VariableElement) field;
            String name = var.getSimpleName().toString();
            String type = var.asType().toString();
            sb.append("\\n    public ").append(builderClassName)
              .append(" ").append(name).append("(").append(type).append(" ")
              .append(name).append(") {\\n")
              .append("        this.").append(name).append(" = ")
              .append(name).append(";\\n")
              .append("        return this;\\n")
              .append("    }\\n");
        }

        // build方法（含必填校验）
        sb.append("\\n    public ").append(className).append(" build() {\\n");
        for (Element field : fields) {
            if (field.getAnnotation(Required.class) != null) {
                String name = field.getSimpleName().toString();
                sb.append("        if (this.").append(name)
                  .append(" == null) throw new IllegalStateException(\\"")
                  .append(name).append(" is required\\");\\n");
            }
        }
        sb.append("        return new ").append(className).append("(this);\\n");
        sb.append("    }\\n}");

        return sb.toString();
    }
}
\`\`\`

### 三、注册处理器

在 resources/META-INF/services 下创建：
\`\`\`
javax.annotation.processing.Processor
com.example.BuilderProcessor
\`\`\`

### 四、使用方式

\`\`\`java
User user = UserBuilder.builder()
    .name("张三")           // 必填，不设置会抛异常
    .age(25)
    .hobbies(Arrays.asList("编程", "阅读"))
    .build();
\`\`\`

**核心要点**：
- 使用javax.lang.model而非java.lang.reflect（编译期无class文件）
- 通过Filer生成源码，IDE可识别
- RoundEnvironment处理多轮编译`,
    difficulty: "hard",
    questionType: "code",
    tags: ["Java深入", "注解处理器", "编译器"],
    codeTemplate: {
      java: `import javax.annotation.processing.*;\nimport javax.lang.model.*;\nimport javax.lang.model.element.*;\nimport java.io.*;\nimport java.util.*;\n\n@SupportedAnnotationTypes("com.example.Builder")\n@SupportedSourceVersion(SourceVersion.RELEASE_11)\npublic class BuilderProcessor extends AbstractProcessor {\n\n    @Override\n    public boolean process(Set<? extends TypeElement> annotations,\n                           RoundEnvironment roundEnv) {\n        // TODO: 实现注解处理器逻辑\n        return true;\n    }\n}`
    }
  },

  {
    title: "Java NIO核心组件与Reactor模式实现",
    content: `## 题目描述

请深入分析Java NIO的核心组件，并实现一个基于Reactor模式的非阻塞IO服务器：

1. 分析Buffer、Channel、Selector三大核心组件的工作原理
2. 对比BIO/NIO/AIO的区别与适用场景
3. 实现单线程Reactor模式的服务器框架
4. 解决常见的NIO问题（Selector空轮询、内存泄漏、半包/粘包）

### 考察点

- Buffer的操作细节（flip/clear/compact/rewind）
- Selector的多路复用机制
- Reactor模式的三种变体
- Netty对NIO的封装改进`,
    solution: `## Java NIO深度解析与Reactor实现

### 一、三大核心组件

#### 1. Buffer（缓冲区）

\`\`\`java
ByteBuffer buffer = ByteBuffer.allocate(1024);

// 写入模式 -> 读 取 模式
buffer.put(data);          // 写入数据
buffer.flip();             // 切换到读取模式
byte[] result = new byte[buffer.remaining()];
buffer.get(result);        // 读取数据
buffer.clear();            // 清空缓冲区（或用compact保留未读数据）
\`\`\`

**状态变量说明**：
- position：当前读写位置
- limit：读写限制位置
- capacity：容量上限
- mark：标记位置

**关键方法对比**：

| 方法 | position | limit | 用途 |
|------|----------|-------|------|
| flip() | 0 | 原position | 写→读切换 |
| clear() | 0 | capacity | 清空重置 |
| compact() | remaining | capacity | 保留未读数据 |
| rewind() | 0 | 不变 | 重读数据 |

#### 2. Channel（通道）

\`\`\`
SocketChannel (TCP客户端)
ServerSocketChannel (TCP服务端)
DatagramChannel (UDP)
FileChannel (文件IO)
\`\`\`

**关键特性**：
- 双向读写（FileChannel除外）
- 非阻塞模式（configureBlocking(false)）
- 与Buffer配合使用

#### 3. Selector（选择器）

\`\`\`java
Selector selector = Selector.open();
serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    int readyCount = selector.select();  // 阻塞等待事件
    Set<SelectionKey> selectedKeys = selector.selectedKeys();

    for (SelectionKey key : selectedKeys) {
        if (key.isAcceptable()) handleAccept(key);
        if (key.isReadable()) handleRead(key);
        if (key.isWritable()) handleWrite(key);
    }
    selectedKeys.clear();  // 必须手动清除！
}
\`\`\`

**事件类型**：
- OP_ACCEPT：新连接到达
- OP_CONNECT：连接完成
- OP_READ：可读数据
- OP_WRITE：可写数据

### 二、单线程Reactor实现

\`\`\`java
public class ReactorServer implements Runnable {
    private final Selector selector;
    private final ServerSocketChannel serverSocket;

    public ReactorServer(int port) throws IOException {
        selector = Selector.open();
        serverSocket = ServerSocketChannel.open();
        serverSocket.bind(new InetSocketAddress(port));
        serverSocket.configureBlocking(false);
        serverSocket.register(selector, SelectionKey.OP_ACCEPT, new Acceptor());
    }

    @Override
    public void run() {
        while (!Thread.interrupted()) {
            selector.select();
            Set<SelectionKey> selected = selector.selectedKeys();
            for (SelectionKey key : selected) {
                dispatch(key);  // 分发事件
            }
            selected.clear();
        }
    }

    void dispatch(SelectionKey key) {
        Runnable r = (Runnable) key.attachment();
        if (r != null) r.run();
    }

    // 连接接受器
    class Acceptor implements Runnable {
        @Override
        public void run() {
            try {
                SocketChannel channel = serverSocket.accept();
                if (channel != null) {
                    new Handler(selector, channel);  // 为新连接创建Handler
                }
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }
}

// 连接处理器
final class Handler implements Runnable {
    private final SocketChannel channel;
    private final SelectionKey key;
    private ByteBuffer input = ByteBuffer.allocate(1024);
    private ByteBuffer output = ByteBuffer.allocate(1024);

    Handler(Selector sel, SocketChannel c) throws IOException {
        channel = c;
        c.configureBlocking(false);
        key = c.register(sel, SelectionKey.OP_READ, this);
    }

    @Override
    public void run() {
        try {
            if (key.isReadable()) read();
            else if (key.isWritable()) write();
        } catch (IOException ex) {
            key.cancel();
            try { channel.close(); } catch (IOException e) { /* ignore */ }
        }
    }

    synchronized void read() throws IOException {
        input.clear();
        int bytesRead = channel.read(input);
        if (bytesRead == -1) {
            channel.close();
            key.cancel();
            return;
        }
        process();  // 处理业务逻辑
    }

    synchronized void process() {
        // 业务处理...
        key.interestOps(SelectionKey.OP_WRITE);  // 切换为写事件
    }

    synchronized void write() throws IOException {
        output.flip();
        channel.write(output);
        if (!output.hasRemaining()) {
            key.interestOps(SelectionKey.OP_READ);  // 切换回读事件
        }
        output.compact();
    }
}
\`\`\`

### 三、常见问题解决方案

#### 1. Selector空轮询（Bug JDK-6403933）

\`\`\`java
// 问题：selector.select()立即返回0，CPU 100%
// 原因：epoll的bug，已取消的key未被正确移除

// 解决方案：重建Selector
private void rebuildSelector() {
    Selector newSelector = Selector.open();
    for (SelectionKey key : selector.keys()) {
        key.channel().register(newSelector, key.interestOps(), key.attachment());
    }
    selector.close();
    selector = newSelector;
}

// 或使用Netty的实现（检测到空轮询次数超过阈值时重建）
\`\`\`

#### 2. 半包/粘包问题

\`\`\`java
// 方案一：固定长度
ByteBuffer buffer = ByteBuffer.allocate(4);
channel.read(buffer);

// 方案二：分隔符
// 以\\n作为消息边界

// 方案三：长度字段（推荐）
// [4字节长度][消息体]
public class FrameDecoder {
    private ByteBuffer lengthBuffer = ByteBuffer.allocate(4);
    private ByteBuffer dataBuffer;

    public byte[] decode(ByteBuffer in) {
        if (dataBuffer == null) {
            // 先读取长度
            if (in.remaining() < 4) return null;
            int length = in.getInt();
            dataBuffer = ByteBuffer.allocate(length);
        }

        // 读取数据
        if (in.remaining() < dataBuffer.remaining()) {
            dataBuffer.put(in);
            return null;  // 数据不全
        }

        int limit = in.limit();
        in.limit(in.position() + dataBuffer.remaining());
        dataBuffer.put(in);
        in.limit(limit);

        byte[] result = new byte[dataBuffer.position()];
        dataBuffer.flip();
        dataBuffer.get(result);
        dataBuffer = null;
        return result;
    }
}
\`\`\`

### 四、BIO/NIO/AIO对比

| 特性 | BIO | NIO | AIO |
|------|-----|-----|-----|
| IO模型 | 同步阻塞 | 同步非阻塞 | 异步非阻塞 |
| API复杂度 | 低 | 中 | 高 |
| 并发能力 | 一连接一线程 | 单线程多连接 | 回调机制 |
| 适用场景 | 连接数少 | 高并发 | Linux内核支持差 |

**生产环境建议**：使用Netty（基于NIO优化），避免直接使用原生NIO API`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java深入", "NIO", "网络编程", "Reactor模式"]
  },

  {
    title: "ClassLoader双亲委派模型与自定义类加载器",
    content: `## 题目描述

请详细分析Java类加载机制：

1. 解释双亲委派模型的原理及存在的意义
2. 列举破坏双亲委派模型的场景及原因
3. 实现一个自定义ClassLoader，支持从数据库加载类
4. 分析Tomcat为何需要打破双亲委派

### 考察点

- 类加载的生命周期
- 加载、链接、初始化三个阶段
- 命名空间隔离
- OSGi模块化思想`,
    solution: `## ClassLoader深度解析

### 一、双亲委派模型

\`\`\`
Bootstrap ClassLoader (JRE/lib/rt.jar)
       ↕
Extension ClassLoader (jre/lib/ext)
       ↕
Application ClassLoader (classpath)
       ↕
Custom ClassLoader
\`\`\`

**工作流程**：
1. 收到类加载请求
2. 委派给父加载器加载
3. 父加载器无法完成，自己尝试加载

**源码分析**（JDK8）：
\`\`\`java
protected Class<?> loadClass(String name, boolean resolve) {
    // 1. 检查是否已加载
    Class<?> c = findLoadedClass(name);
    if (c == null) {
        try {
            if (parent != null) {
                c = parent.loadClass(name, false);  // 委派父加载器
            } else {
                c = findBootstrapClassOrNull(name);  // Bootstrap
            }
        } catch (ClassNotFoundException e) {}

        if (c == null) {
            c = findClass(name);  // 自己加载
        }
    }
    return c;
}
\`\`\`

**双亲委派的意义**：
1. **安全性**：防止核心类被篡改（如自定义java.lang.String）
2. **唯一性**：避免重复加载，保证类的全局唯一性
3. **层次性**：基础类优先由高层加载器加载

### 二、打破双亲委派的场景

#### 场景1：SPI机制（Service Provider Interface）

\`\`\`java
// JDBC Driver加载
// DriverManager在rt.jar中（Bootstrap加载）
// 但MySQL Driver在classpath中（AppClassLoader加载）

// Thread.currentThread().getContextClassLoader()
// 使用线程上下文类加载器打破双亲委派
Connection conn = DriverManager.getConnection(url, user, password);
\`\`\`

#### 场景2：Tomcat类加载

**Web应用隔离需求**：
- 不同Web应用可能依赖同一库的不同版本
- Web应用的类不应影响Tomcat本身
- Tomcat的类不应被Web应用访问

**Tomcat类加载结构**：
\`\`\`
CommonClassLoader (tomcat/common)
       ↕
CatalinaClassLoader (tomcat/server)
       ↕
SharedClassLoader (tomcat/shared)
       ↕
WebappClassLoader1 (webapp1)  ← 各自独立
WebappClassLoader2 (webapp2)
\`\`\`

**关键点**：WebappClassLoader先自己加载，找不到再委派给父加载器（逆序）。

### 三、自定义ClassLoader实现

\`\`\`java
public class DatabaseClassLoader extends ClassLoader {
    private DataSource dataSource;

    public DatabaseClassLoader(ClassLoader parent, DataSource ds) {
        super(parent);
        this.dataSource = ds;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] classBytes = loadClassFromDatabase(name);
        if (classBytes == null) {
            throw new ClassNotFoundException(name);
        }
        return defineClass(name, classBytes, 0, classBytes.length);
    }

    private byte[] loadClassFromDatabase(String className) {
        String sql = "SELECT class_bytes FROM loaded_classes WHERE class_name = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, className);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getBytes("class_bytes");
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    // 动态重载类（热部署）
    public Class<?> reloadClass(String name) throws ClassNotFoundException {
        // 先卸载旧类（需确保没有实例引用）
        // 注意：JVM不支持真正卸载类，只能重新创建ClassLoader实例
        return findClass(name);
    }
}

// 使用示例
public class DynamicLoaderDemo {
    public static void main(String[] args) throws Exception {
        DataSource ds = createDataSource();
        DatabaseClassLoader loader =
            new DatabaseClassLoader(DynamicLoaderDemo.class.getClassLoader(), ds);

        // 从数据库加载类
        Class<?> clazz = loader.loadClass("com.example.DynamicService");

        // 创建实例并调用方法
        Object instance = clazz.getDeclaredConstructor().newInstance();
        Method method = clazz.getMethod("execute", String.class);
        Object result = method.invoke(instance, "Hello");
    }
}
\`\`\`

### 四、类加载生命周期详解

\`\`\`
加载 Loading
  ↓ （通过全限定名获取二进制字节流）
链接 Linking
  ↓
  ├─ 验证 Verification（文件格式、元数据、字节码、符号引用）
  ├─ 准备 Preparation（静态变量赋默认值，非初始值）
  └─ 解析 Resolution（符号引用替换为直接引用）
      ↓
初始化 Initialization
  ↓ （执行<clinit>方法，静态变量赋值+静态代码块）
使用 Using
  ↓
卸载 Unloading（ClassLoader被回收 + 无实例引用 + 无活跃引用）
\`\`\`

**准备vs初始化的区别**：
\`\`\`java
public class Test {
    static int a = 10;     // 准备阶段 a=0, 初始化阶段 a=10
    static final int b = 20;  // 准备阶段 b=20（ConstantValue属性）
    static Object obj = new Object();  // 准备阶段 obj=null, 初始化阶段创建对象
}
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java深入", "ClassLoader", "JVM"]
  },

  {
    title: "ASM字节码操作与动态代理增强",
    content: `## 题目描述

请使用ASM库实现以下功能：

1. 编写字节码增强工具，为所有方法添加耗时统计
2. 实现方法参数校验的自动插入（基于注解@NotNull/@NotEmpty）
3. 对比ASM与CGLIB/Javassist的性能差异
4. 分析Java Agent与Byte Buddy的使用场景

### 考察点

- JVM指令集
- ClassVisitor/MethodVisitor API
- 字节码插桩技术
- 运行时代理 vs 编译时代理`,
    solution: `## ASM字节码操作实战

### 一、ASM核心概念

**访问者模式**：
\`\`\`
ClassReader (读取字节码)
    ↓ visit()
ClassVisitor (访问类结构)
    ↓ visitMethod()
MethodVisitor (访问方法体)
    ↓ visitCode()/visitInsn()
MethodWriter (写入新字节码)
\`\`\`

### 二、方法耗时统计增强

\`\`\`java
public class TimeCostClassVisitor extends ClassVisitor {
    private String owner;

    public TimeCostClassVisitor(ClassVisitor cv) {
        super(Opcodes.ASM9, cv);
    }

    @Override
    public void visit(int version, int access, String name,
                     String signature, String superName, String[] interfaces) {
        this.owner = name;
        cv.visit(version, access, name, signature, superName, interfaces);
    }

    @Override
    public MethodVisitor visitMethod(int access, String name, String desc,
                                    String signature, String[] exceptions) {
        MethodVisitor mv = cv.visitMethod(access, name, desc, signature, exceptions);

        // 跳过构造方法和抽象方法
        if ("<init>".equals(name) || "<clinit>".equals(name) ||
            (access & Opcodes.ACC_ABSTRACT) != 0) {
            return mv;
        }

        return new TimeCostMethodVisitor(mv, owner, name, desc);
    }
}

class TimeCostMethodVisitor extends MethodVisitor {
    private String owner;
    private String methodName;

    public TimeCostMethodVisitor(MethodVisitor mv, String owner,
                                 String methodName, String desc) {
        super(Opcodes.ASM9, mv);
        this.owner = owner;
        this.methodName = name;
    }

    @Override
    public void visitCode() {
        // 方法开始前：记录开始时间
        mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/System",
                         "currentTimeMillis", "()J");
        mv.visitVarInsn(Opcodes.LSTORE, getNextLocalIndex());

        super.visitCode();
    }

    @Override
    public void visitInsn(int opcode) {
        // 在RETURN之前插入耗时打印
        if (opcode >= Opcodes.IRETURN && opcode <= Opcodes.RETURN) {
            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/System",
                             "currentTimeMillis", "()J");
            mv.visitVarInsn(Opcodes.LLOAD, getNextLocalIndex());
            mv.visitInsn(Opcodes.LSUB);
            mv.visitVarInsn(Opcodes.LSTORE, getNextLocalIndex() + 2);

            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/System", "out",
                             "Ljava/io/PrintStream;");
            mv.visitTypeInsn(Opcodes.NEW, "java/lang/StringBuilder");
            mv.visitInsn(Opcodes.DUP);
            mv.visitMethodInsn(Opcodes.INVOKESPECIAL,
                              "java/lang/StringBuilder", "<init>", "()V", false);
            mv.visitLdcInsn("Method " + owner + "." + methodName +
                           " cost: ");
            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                              "java/lang/StringBuilder", "append",
                              "(Ljava/lang/String;)Ljava/lang/StringBuilder;", false);
            mv.visitVarInsn(Opcodes.LLOAD, getNextLocalIndex() + 2);
            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                              "java/lang/StringBuilder", "append",
                              "(J)Ljava/lang/StringBuilder;", false);
            mv.visitLdcInsn("ms");
            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                              "java/lang/StringBuilder", "append",
                              "(Ljava/lang/String;)Ljava/lang/StringBuilder;", false);
            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                              "java/lang/StringBuilder", "toString",
                              "()Ljava/lang/String;", false);
            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL,
                              "java/io/PrintStream", "println",
                              "(Ljava/lang/String;)V", false);
        }
        mv.visitInsn(opcode);
    }

    private int getNextLocalIndex() {
        // 根据方法签名计算局部变量表索引
        return 100; // 简化处理，实际应解析desc
    }
}

// 使用方式
public class ASMTransformDemo {
    public static void main(String[] args) throws IOException {
        // 读取原始类
        ClassReader cr = new ClassReader("com/example/TargetClass");

        // 创建ClassWriter，自动计算栈帧和局部变量大小
        ClassWriter cw = new ClassWriter(cr, ClassWriter.COMPUTE_FRAMES |
                                               ClassWriter.COMPUTE_MAXS);

        // 应用转换器
        cr.accept(new TimeCostClassVisitor(cw), ClassReader.EXPAND_FRAMES);

        // 输出增强后的字节码
        Files.write(Path.of("TargetClassEnhanced.class"), cw.toByteArray());
    }
}
\`\`\`

**增强前后对比**：

原始字节码：
\`\`\`
public void doSomething() {
    // 业务逻辑
}
\`\`\`

增强后：
\`\`\`
public void doSomething() {
    long time1 = System.currentTimeMillis();
    // 业务逻辑
    long time2 = System.currentTimeMillis();
    System.out.println(new StringBuilder()
        .append("Method com.example.TargetClass.doSomething cost: ")
        .append(time2 - time1).append("ms").toString());
}
\`\`\`

### 三、参数校验增强

\`\`\`java
public class ValidationClassVisitor extends ClassVisitor {

    @Override
    public MethodVisitor visitMethod(int access, String name, String desc,
                                    String signature, String[] exceptions) {
        MethodVisitor mv = super.visitMethod(access, name, desc, signature, exceptions);

        // 解析方法参数上的注解
        Type methodType = Type.getMethodType(desc);
        Type[] argTypes = methodType.getArgumentTypes();

        return new ValidationMethodVisitor(mv, argTypes, access);
    }
}

class ValidationMethodVisitor extends MethodVisitor {
    private Type[] argTypes;

    @Override
    public void visitParameter(String name, int access) {
        // 检查参数是否有@NotNull等注解
        // 如果有，在方法入口插入校验逻辑
        /*
         * 伪代码生成的字节码：
         * if (arg1 == null) throw new IllegalArgumentException("arg1 cannot be null");
         */
    }
}
\`\`\`

### 四、字节码操作框架对比

| 特性 | ASM | CGLIB | Javassist | Byte Buddy |
|------|-----|-------|-----------|------------|
| 抽象层级 | 字节码指令 | 字节码 | 源码级别 | 高级API |
| 学习曲线 | 陡峭 | 中等 | 平缓 | 平缓 |
| 性能 | 最高 | 高 | 较低 | 高 |
| 调试难度 | 困难 | 中等 | 容易 | 容易 |
| 典型应用 | Spring/CGLIB底层 | Spring AOP | Struts/Hibernate | Mockito/PowerMock |

### 五、Java Agent运行时增强

\`\`\`java
// premain方式（JVM启动时加载）
public class MyAgent {
    public static void premain(String agentArgs, Instrumentation inst) {
        inst.addTransformer((loader, className, classBeingRedefined,
                            protectionDomain, classfileBuffer) -> {
            if (className.startsWith("com/example/target")) {
                ClassReader cr = new ClassReader(classfileBuffer);
                ClassWriter cw = new ClassWriter(cr, 0);
                cr.accept(new TimeCostClassVisitor(cw), 0);
                return cw.toByteArray();
            }
            return classfileBuffer;
        });
    }
}

// MANIFEST.MF配置
// Premain-Class: com.example.MyAgent
// Can-Redefine-Classes: true
// Boot-Class-Path: asm.jar

// 启动命令
// java -javaagent:my-agent.jar -jar app.jar
\`\`\`

**Agent使用场景**：
- APM监控（SkyWalking、Pinpoint）
- 性能分析工具（Arthas）
- 热部署（IntelliJ HotSwap）
- 覆盖率测试（JaCoCo）`,
    difficulty: "hard",
    questionType: "code",
    tags: ["Java深入", "字节码", "ASM"],
    codeTemplate: {
      java: `import org.objectweb.asm.*;\n\npublic class MethodTimerTransformer extends ClassVisitor {\n\n    public MethodTimerTransformer(ClassVisitor cv) {\n        super(Opcodes.ASM9, cv);\n    }\n\n    @Override\n    public MethodVisitor visitMethod(int access, String name, String desc,\n                                      String signature, String[] exceptions) {\n        MethodVisitor mv = super.visitMethod(access, name, desc, signature, exceptions);\n        // TODO: 返回包装后的MethodVisitor，添加计时逻辑\n        return mv;\n    }\n}`
    }
  },

  {
    title: "JIT即时编译器工作原理与调优",
    content: `## 题目描述

请深入分析HotSpot JVM的JIT编译器：

1. 解释分层编译(Tiered Compilation)的各层含义
2. C1和C2编译器的区别及适用场景
3. JIT的优化技术（内联、逃逸分析、标量替换、锁消除）
4. 如何通过JVM参数控制JIT行为，以及如何排查编译问题

### 考察点

- 解释器 vs 编译器协作
- Profile-guided optimization
- OSR (On-Stack Replacement)
- Code Cache管理`,
    solution: `## JIT编译器深度解析

### 一、分层编译架构

HotSpot采用分层编译（JDK7+默认开启）：

\`\`\`
Layer 0: Interpreter (解释执行)
    ↓ 采集热点信息（调用计数器、回边计数器）
Layer 1: C1 Compiler (简单优化，带Profiling)
    ↓ 进一步收集Profile数据
Layer 2: C1 Compiler (有限优化，带Profiling)
    ↓
Layer 3: C1 Compiler (完全优化，不带Profiling)
    ↓
Layer 4: C2 Compiler (全部优化，基于Layer 2/3的Profile)
\`\`\`

**触发条件**：
- **方法调用计数器**：默认阈值 CompileThreshold=10000
- **回边计数器**（循环）：默认阈值 = CompileThreshold * OSR Ratio (95%)

**计数器衰减**：方法进入栈时不递增，防止一次性执行触发不必要的编译。

### 二、C1 vs C2对比

| 特性 | Client Compiler (C1) | Server Compiler (C2) |
|------|---------------------|---------------------|
| 编译时间 | 快 | 慢 |
| 优化程度 | 轻量级 | 重量级 |
| 启动速度 | 快 | 慢 |
| 峰值性能 | 一般 | 最优 |
| 内存占用 | 少 | 多 |
| 适用场景 | 客户端应用 | 服务端长运行应用 |

**Graal编译器**（JDK10+实验性）：
- 用Java编写的JIT编译器（C2是用C++写的）
- 更好的优化潜力（高级逃逸分析、部分逃逸）
- 可通过AOT提前编译

### 三、核心优化技术

#### 1. 方法内联 (Inlining)

\`\`\`java
// 内联前
public int add(int a, int b) { return a + b; }
public int compute(int x, int y) { return add(x, y); }

// 内联后（C2会展开）
public int compute(int x, int y) { return x + y; }
\`\`\`

**内联条件**：
- 热点方法（频繁调用）
- 方法体不太大（MaxInlineSize=325字节，频繁调用可达35字节）
- 非虚方法或可确定的虚方法（CHA分析）

**内联的价值**：是其他优化的前提（常量传播、死代码消除都依赖内联）。

#### 2. 逃逸分析 (Escape Analysis)

\`\`\`java
public class EscapeAnalysisDemo {
    public int sum() {
        // point对象不会逃逸出sum方法
        Point point = new Point(1, 2);
        return point.x + point.y;
    }
}
\`\`\`

**逃逸分析结论**：
- **不逃逸**：对象只在方法内使用
- **方法逃逸**：对象作为参数传递或返回
- **线程逃逸**：对象被赋值给可被其他线程访问的变量

**基于逃逸分析的优化**：
1. **标量替换**：将对象拆解为成员变量（消除对象创建）
2. **栈上分配**：对象分配在栈上（随栈帧销毁，无GC压力）
3. **同步消除**：对象不逃逸则synchronized块无用

\`\`\`java
// 标量替换后
public int sum() {
    int x = 1;  // 原point.x
    int y = 2;  // 原point.y
    return x + y;
}
// 完全消除了Point对象的分配！
\`\`\`

#### 3. 锁消除 (Lock Elision)

\`\`\`java
public String concat(String s1, String s2) {
    // StringBuffer是线程安全的，但如果只在本方法使用
    // JIT会消除内部的同步块
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb.toString();
}
\`\`\`

#### 4. 循环优化

\`\`\`java
// 循环展开 (Loop Unrolling)
for (int i = 0; i < 4; i++) {
    arr[i] = i;
}
// 展开后
arr[0] = 0; arr[1] = 1; arr[2] = 2; arr[3] = 3;

// 范围检查消除 (Range Check Elimination)
for (int i = 0; i < arr.length; i++) {
    // JIT证明i始终在合法范围，消除每次迭代的边界检查
    arr[i] = i;
}
\`\`\`

### 四、JIT调优参数

\`\`\`bash
# 开启分层编译（默认开启）
-XX:+TieredCompilation

# 设置编译线程数
-XX:CICompilerCount=2

# 调整编译阈值
-XX:CompileThreshold=10000

# 打印编译日志
-XX:+PrintCompilation

# 只使用C1（快速启动）
-XX:TieredStopAtLevel=1

# 只使用C2（最大性能）
-XX:-TieredCompilation

# Code Cache大小（存放编译后的本地代码）
-XX:ReservedCodeCacheSize=256m

# OSR编译阈值比例
-XX:OnStackReplacePercentage=140

# 内联限制
-XX:MaxInlineSize=325
-XX:FreqInlineSize=325
\`\`\`

### 五、排查编译问题

\`\`\`bash
# 1. 查看编译日志
java -XX:+PrintCompilation -jar app.jar

# 日志格式示例：
#   123    1       3       java.lang.String::hashCode (55 bytes)
#   ↑      ↑       ↑       ↑
# 编译序号  层次    是否OSR  方法名

# 2. 查看反编译结果（HSDB/jhsdb）
java -XX:+PrintAssembly -jar app.jar  # 需要hsdis插件

# 3. 查看Code Cache使用情况
jstat -compiler <pid>
# 输出：Compiled Failed Invalid Time   FailedType FailedMethod
#       12543   12     34     245.67  1       java/net/URL::openStream

# 4. 查看内联决策
-XX:+PrintInlining
\`\`\`

**常见问题**：
1. **Code Cache满**：导致退化为解释执行，性能骤降
   - 症状：大量CompileQueue满警告
   - 解决：增大ReservedCodeCacheSize

2. **去优化（Deoptimization）**：假设失效导致编译代码不可用
   - 触发条件：类型变更、类层次变化
   - 表现：突然变慢后又恢复

3. **编译抖动**：频繁编译-去优化循环
   - 原因：Profile不稳定
   - 解决：稳定负载或调整阈值`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "JIT编译", "性能优化"]
  },

  {
    title: "Java泛型擦除与桥接方法",
    content: `## 题目描述

请深入分析Java泛型的实现机制：

1. 为什么Java泛型是"伪泛型"？类型擦除发生在哪个阶段？
2. 泛型擦除带来的问题及解决方式（桥接方法、类型转换）
3. 泛型通配符?、extends T、super T的区别和使用原则（PECS原则）
4. 泛型数组为什么不能创建？如何绕过？

### 考察点

- 类型系统理论
- JVM规范对泛型的支持
- 类型安全与向后兼容
- reifiable types概念`,
    solution: `## Java泛型深度解析

### 一、类型擦除机制

**擦除时机**：编译阶段（不是运行时！）

\`\`\`java
// 编译前
public class Box<T> {
    private T value;
    public T getValue() { return value; }
    public void setValue(T value) { this.value = value; }
}

// 编译后（反编译查看）
public class Box {
    private Object value;  // T被擦除为Object
    public Object getValue() { return value; }
    public void setValue(Object value) { this.value = value; }
}
\`\`\`

**有界类型的情况**：
\`\`\`java
// 编译前
public class NumberBox<T extends Number> {
    private T value;
}

// 编译后（T被擦除为Number，第一个边界）
public class NumberBox {
    private Number value;
}
\`\`\`

**为什么这样设计？**
1. 向后兼容：泛型代码可以与非泛型代码互操作
2. 简化JVM：不需要修改虚拟机规范
3. 迁移成本：已有代码无需修改即可使用泛型

### 二、桥接方法 (Bridge Methods)

当泛型涉及方法覆盖时，编译器会自动生成桥接方法：

\`\`\`java
// 定义接口
public interface Comparable<T> {
    int compareTo(T o);
}

// 实现
public class MyClass implements Comparable<MyClass> {
    @Override
    public int compareTo(MyClass o) {
        return 0;
    }
}

// 编译后实际生成了两个方法：
public class MyClass implements Comparable {
    // 我们写的方法
    public int compareTo(MyClass o) { return 0; }

    // 桥接方法（编译器自动生成）
    public int compareTo(Object o) {  // 擦除后的签名
        return compareTo((MyClass) o);  // 强制转型并委托
    }
}
\`\`\`

**桥接方法的作用**：
- 维护多态性：确保方法覆盖关系在擦除后仍然成立
- JVM通过bridge标志识别这些方法

**验证桥接方法**：
\`\`\`java
for (Method m : MyClass.class.getMethods()) {
    if (m.isBridge()) {
        System.out.println("Bridge: " + m);
    }
}
\`\`\`

### 三、通配符与PECS原则

\`\`\`java
// ? extends T（上界通配符）- 生产者
List<? extends Number> list1 = new ArrayList<Integer>();
list1.add(null);  // OK
list1.add(1);     // 编译错误！不知道具体类型
Number n = list1.get(0);  // OK，取出一定是Number或子类

// ? super T（下界通配符）- 消费者
List<? super Integer> list2 = new ArrayList<Number>();
list2.add(1);     // OK，Integer或子类都可以放入
Object o = list2.get(0);  // 只能确定是Object
Integer i = list2.get(0); // 编译错误！

// PECS原则：Producer Extends, Consumer Super
public <T> void copy(List<? extends T> src, List<? super T> dest) {
    for (T item : src) {
        dest.add(item);
    }
}
\`\`\`

**PECS记忆法**：
- 如果只需要从集合中取数据（生产者），用extends
- 如果只需要向集合中放数据（消费者），用super
- 如果既要取又要放，不用通配符

### 四、泛型数组问题

\`\`\`java
// 编译错误！
List<String>[] array = new List<String>[10];  // ❌

// 原因分析：
Object[] objArray = new List<String>[10];  // 假设允许
objArray[0] = new ArrayList<Integer>();     // 运行时能成功（擦除后都是List）
String s = ((List<String>) objArray[0]).get(0);  // ClassCastException！

// 正确做法：
List<String>[] array = (List<String>[]) new List<?>[10];  // 强转（unchecked warning）

// 或者使用ArrayList
List<List<String>> list = new ArrayList<>();
\`\`\`

### 五、泛型的高级用法

#### 1. 类型令牌 (TypeToken)

\`\`\`java
// 由于擦除，运行时无法获取T的实际类型
public class GenericDao<T> {
    // 错误：T.class不存在
    // Class<T> clazz = T.class;

    // 解决方案：通过构造函数传入
    private Class<T> entityClass;
    public GenericDao(Class<T> entityClass) {
        this.entityClass = entityClass;
    }

    // 或者使用匿名内部类（Gson/Spring常用技巧）
    public static <T> T fromJson(String json, TypeToken<T> token) {
        // 通过匿名子类保留类型信息
    }
}
\`\`\`

#### 2. 泛型与反射结合

\`\`\`java
// 通过反射获取泛型参数的实际类型
public class BaseRepository<T> {
    private Class<T> entityType;

    public BaseRepository() {
        // 获取父类的泛型参数
        ParameterizedType superclass =
            (ParameterizedType) getClass().getGenericSuperclass();
        this.entityType = (Class<T>) superclass.getActualTypeArguments()[0];
    }
}

// 使用
class UserRepository extends BaseRepository<User> {
    // entityType自动推断为User.class
}
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java深入", "泛型", "类型系统"]
  },

  {
    title: "Java动态代理与CGLIB原理对比",
    content: `## 题目描述

请对比分析Java动态代理和CGLIB代理的实现原理：

1. JDK动态代理的实现机制（InvocationHandler + Proxy）
2. CGLIB的字节码生成原理（MethodInterceptor + Enhancer）
3. 两者的性能差异及选择策略
4. Spring AOP如何选择代理方式？

### 考察点

- 接口代理 vs 类代理
- 字节码生成技术
- 设计模式应用
- Spring AOP内部机制`,
    solution: `## 动态代理深度对比

### 一、JDK动态代理

**核心原理**：基于接口的代理，运行时动态生成接口的实现类

\`\`\`java
// 1. 定义接口
public interface UserService {
    void addUser(String name);
    User getUser(Long id);
}

// 2. 实现InvocationHandler
public class LogInvocationHandler implements InvocationHandler {
    private Object target;

    public LogInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("[Before] " + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("[After] " + method.getName());
        return result;
    }
}

// 3. 创建代理对象
UserService realService = new UserServiceImpl();
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    new LogInvocationHandler(realService)
);

proxy.addUser("张三");  // 会输出日志
\`\`\`

**Proxy生成的字节码特征**（简化）：
\`\`\`java
// Proxy动态生成的类（$Proxy0）
public final class $Proxy0 extends Proxy implements UserService {
    private static Method m1;  // addUser
    private static Method m2;  // getUser

    static {
        m1 = Class.forName("UserService").getMethod("addUser", String.class);
        m2 = Class.forName("UserService").getMethod("getUser", Long.class);
    }

    public final void addUser(String name) {
        // 委托给InvocationHandler
        super.h.invoke(this, m1, new Object[]{name});
    }
}
\`\`\`

**局限性**：
- 只能代理接口（必须实现至少一个接口）
- 无法代理final类和方法
- 无法代理非public的方法

### 二、CGLIB代理

**核心原理**：通过继承目标类，重写其方法来实现代理（基于ASM字节码生成）

\`\`\`java
// 1. 目标类（无需接口）
public class OrderService {
    public void createOrder(String orderNo) {
        System.out.println("创建订单：" + orderNo);
    }
}

// 2. 实现MethodInterceptor
public class TransactionInterceptor implements MethodInterceptor {
    @Override
    public Object intercept(Object obj, Method method, Object[] args,
                           MethodProxy proxy) throws Throwable {
        System.out.println("[Transaction Begin]");
        Object result = proxy.invokeSuper(obj, args);  // 注意：调用父类方法
        System.out.println("[Transaction Commit]");
        return result;
    }
}

// 3. 创建代理
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(OrderService.class);
enhancer.setCallback(new TransactionInterceptor());

OrderService proxy = (OrderService) enhancer.create();
proxy.createOrder("ORD-20240001");
\`\`\`

**CGLIB生成的字节码特征**：
\`\`\`java
// CGLIB动态生成的类（OrderService$$EnhancerByCGLIB$$xxx）
public class OrderService$$EnhancerByCGLIB$$xxx extends OrderService {
    private MethodInterceptor callback;

    // CGLIB$CREATE_ORDER$0 是原始方法的副本
    private final void CGLIB$CREATE_ORDER$0(String orderNo) {
        super.createOrder(orderNo);  // 调用真正的父类方法
    }

    // 重写的方法
    public final void createOrder(String orderNo) {
        MethodInterceptor var10000 = this.callback;
        if (var10000 == null) {
            CGLIB$CREATE_ORDER$0(orderNo);  // 无callback时直接调用
        } else {
            // 委托给拦截器
            var10000.intercept(this,
                CGLIB$createOrder$0$Method,  // Method对象
                new Object[]{orderNo},         // 参数
                CGLIB$createOrder$0$Proxy      // MethodProxy（快速调用）
            );
        }
    }
}
\`\`\`

**MethodProxy的作用**：
- \`proxy.invoke(obj, args)\`：相当于method.invoke()，会再次经过拦截器（可能死循环）
- \`proxy.invokeSuper(obj, args)\`：直接调用父类方法（正确用法）

### 三、两者对比

| 特性 | JDK动态代理 | CGLIB代理 |
|------|------------|----------|
| 实现原理 | 实现接口 | 继承目标类 |
| 要求 | 必须有接口 | 不能是final类 |
| 代理范围 | 接口方法 | 非final/non-private方法 |
| 性能 | Jdk8后接近 | 略低（首次生成慢） |
| 依赖 | JDK自带 | 需要cglib库 |
| 方法调用 | method.invoke() | methodProxy.invokeSuper() |

### 四、Spring AOP的选择策略

\`\`\`java
// Spring AOP创建代理的逻辑（简化）
public class AopProxyFactory {
    public AopProxy createAopProxy(AdvisedSupport config) {
        // 条件1：目标是接口 || 配置了强制使用JDK代理
        if (!config.isOptimize() && config.isProxyTargetClass() == false &&
            hasNoUserSuppliedProxyInterfaces(config)) {
            return new JdkDynamicAopProxy(config);  // JDK代理
        }
        return new CglibAopProxy(config);  // CGLIB代理
    }
}
\`\`\`

**选择规则**：
1. 目标对象实现了接口 → 默认使用JDK动态代理
2. 目标对象没有实现接口 → 使用CGLIB
3. 设置了proxy-target-class=true → 强制使用CGLIB
4. Spring Boot 2.x默认使用CGLIB（即使实现了接口）

**注意事项**：
- CGLIB无法代理private/static/final方法
- 循环依赖：两个Bean互相注入时，Spring会用CGLIB提前暴露引用
- 构造器中的this指向的是原始对象，不是代理对象（导致@Transactional失效）`,
    difficulty: "medium",
    questionType: "qa",
    tags: ["Java深入", "动态代理", "设计模式"]
  },

  {
    title: "Netty线程模型与零拷贝实现",
    content: `## 题目描述

请深入分析Netty的高性能设计：

1. Netty的Reactor线程模型详解（EventLoopGroup架构）
2. Netty的零拷贝实现（CompositeByteBuf、FileRegion、sendfile）
3. Netty的内存池设计与ByteBuf管理
4. Netty如何解决TCP粘包/拆包问题（内置解码器）

### 考察点

- Reactor主从多线程模型
- PooledByteBufAllocator
- ChannelPipeline与Handler链
- 心跳检测与空闲处理`,
    solution: `## Netty高性能架构深度解析

### 一、Reactor线程模型

Netty支持三种Reactor模型：

#### 模型1：单线程模型

\`\`\`
EventLoopGroup group = new NioEventLoopGroup(1);
ServerBootstrap.group(group);  // boss和worker共用同一个group
\`\`\`

所有IO操作都在同一个线程，适合简单场景。

#### 模型2：主从多线程模型（推荐）

\`\`\`
EventLoopGroup bossGroup = new NioEventLoopGroup(1);   // 接受连接
EventLoopGroup workerGroup = new NioEventLoopGroup();   // 处理IO

ServerBootstrap bootstrap = new ServerBootstrap();
bootstrap.group(bossGroup, workerGroup)  // 主从分离
        .channel(NioServerSocketChannel.class)
        .childHandler(new ChannelInitializer<SocketChannel>() {
            @Override
            protected void initChannel(SocketChannel ch) {
                ch.pipeline()
                   .addLast("decoder", new LengthFieldBasedFrameDecoder(...))
                   .addLast("handler", new BusinessHandler());
            }
        });
\`\`\`

**线程分工**：
\`\`\`
bossGroup (1个线程)
└── EventLoop (绑定ServerSocketChannel)
    └── 注册OP_ACCEPT事件
        │
        ▼ 新连接到来
workerGroup (默认CPU核数*2个线程)
├── EventLoop-0 ── SocketChannel-A
├── EventLoop-1 ── SocketChannel-B
├── EventLoop-2 ── SocketChannel-C
└── ...
\`\`\`

**关键特性**：
- 一个EventLoop负责多个Channel（多路复用）
- 一个Channel在其生命周期内绑定到固定的EventLoop（线程无锁）
- ChannelPipeline中的Handler都在同一个EventLoop线程执行（串行化，无线程安全问题）

#### 模型3：业务线程池分离

\`\`\`java
// IO线程只做协议解码，业务逻辑交给独立线程池
ch.pipeline()
   .addLast("decoder", new ProtocolDecoder())
   .addLast("executor", new DefaultEventExecutorGroup(bizThreads))
   .addLast("handler", new BusinessHandler());  // 在bizThreads执行
\`\`\`

### 二、零拷贝实现

#### 1. CompositeByteBuf（逻辑组合，无数据复制）

\`\`\`java
// 传统方式：需要合并两次复制
byte[] header = "HEADER".getBytes();
byte[] body = "BODY".getBytes();
byte[] merged = new byte[header.length + body.length];
System.arraycopy(header, 0, merged, 0, header.length);
System.arraycopy(body, 0, merged, header.length, body.length);

// Netty CompositeByteBuf：零拷贝组合
CompositeByteBuf composite = Unpooled.compositeBuffer();
composite.addComponent(true, Unpooled.wrappedBuffer(header));  // true表示自动更新writerIndex
composite.addComponent(true, Unpooled.wrappedBuffer(body));
// 底层只是维护了一个数组索引，没有实际的数据拷贝
\`\`\`

#### 2. FileRegion（sendfile系统调用）

\`\`\`java
// 文件传输场景：服务端发送文件给客户端
File file = new File("large_file.dat");
FileRegion region = new DefaultFileRegion(
    file.getChannel(), 0, file.length());

channel.writeAndFlush(region);
// 底层调用Linux sendfile()，数据不经过用户空间
\`\`\`

**传统IO vs sendfile**：
\`\`\`
传统IO（4次拷贝，2次上下文切换）：
磁盘 → 内核缓冲区 → 用户缓冲区 → socket缓冲区 → 网卡

sendfile（2次拷贝，1次上下文切换）：
磁盘 → 内核缓冲区 → 网卡（DMA直接传输）
\`\`\`

#### 3. ByteBuf.slice()（共享底层数组）

\`\`\`java
ByteBuf buf = Unpooled.buffer(10);
buf.writeBytes(new byte[10]);

ByteBuf sliced = buf.slice(1, 5);  // 截取[1,5)，不拷贝数据
// sliced和buf共享同一块内存，只是readerIndex/writerIndex不同
\`\`\`

### 三、ByteBuf内存管理

\`\`\`java
// 1. PooledByteBufAllocator（池化，推荐用于服务器）
ByteBufAllocator pooled = PooledByteBufAllocator.DEFAULT;
ByteBuf buf = pooled.directBuffer(1024);  // 直接内存（堆外）
try {
    buf.writeBytes(data);
    channel.writeAndFlush(buf);
} finally {
    buf.release();  // 必须手动释放！引用计数机制
}

// 2. UnpooledByteBufAllocator（非池化，适合短生命周期的Buffer）
ByteBuf unpooled = Unpooled.buffer(1024);

// 3. 引用计数（Reference Counted）
buf.retain();   // 引用+1
buf.release();  // 引用-1，为0时回收
buf.refCnt();   // 当前引用数
\`\`\`

**内存泄漏检测**（开发环境启用）：
\`\`\`bash
-Dio.netty.leakDetection.level=paranoid  # 最严格级别
# 可选值：disabled/simple/advanced/paranoid
\`\`\`

### 四、粘包/拆包解决方案

Netty提供多种内置解码器：

\`\`\`java
// 1. 固定长度
ch.pipeline().addLast(new FixedLengthFrameDecoder(1024));

// 2. 分隔符
ch.pipeline().addLast(new DelimiterBasedFrameDecoder(
    8192, Unpooled.copiedBuffer("\\n", CharsetUtil.UTF_8)));

// 3. 长度字段（最常用）
ch.pipeline().addLast(new LengthFieldBasedFrameDecoder(
    64 * 1024,   // maxFrameLength
    0,           // lengthFieldOffset
    4,           // lengthFieldLength
    0,           // lengthAdjustment
    4            // initialBytesToStrip（跳过长度字段本身）
));

// 4. 自定义协议
ch.pipeline()
   .addLast("frameDecoder", new LengthFieldBasedFrameDecoder(...))
   .addLast("protocolDecoder", new ProtocolDecoder())
   .addLast("protocolEncoder", new ProtocolEncoder())
   .addLast("idleStateHandler", new IdleStateHandler(60, 30, 0))
   .addLast("heartbeatHandler", new HeartbeatHandler())
   .addLast("businessHandler", new BusinessHandler());
\`\`\`

### 五、心跳与空闲检测

\`\`\`java
// 读空闲60秒 / 写空闲30秒 / 全部空闲0秒
ch.pipeline().addLast(new IdleStateHandler(60, 30, 0));

@Sharable
public class HeartbeatHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent event = (IdleStateEvent) evt;
            if (event.state() == IdleState.READER_IDLE) {
                // 读空闲：可能客户端断开
                ctx.close();
            } else if (event.state() == IdleState.WRITER_IDLE) {
                // 写空闲：主动发心跳
                ctx.writeAndFlush(new PingMessage());
            }
        }
    }
}
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Java深入", "Netty", "高性能", "网络编程"]
  },

  // ==================== JVM 调优 (26-45) ====================
  {
    title: "GC算法深度对比与选型指南",
    content: `## 题目描述

请全面对比JVM的各种垃圾收集算法：

1. 标记-清除、标记-复制、标记-整理算法的原理与优缺点
2. 分代收集理论依据（弱分代假说、跨代引用假说）
3. 各代GC算法的选择策略（Young Gen用什么、Old Gen用什么）
4. G1/ZGC/Shenandoah新一代收集器的特点与适用场景

### 考察点

- Stop-The-World (STW) 时间
- 吞吐量 vs 延迟权衡
- 卡表(Card Table)与写屏障
- GC Roots枚举`,
    solution: `## GC算法深度解析

### 一、基础算法对比

#### 1. 标记-清除 (Mark-Sweep)

\`\`\`
[存活][垃圾][存活][垃圾][存活]
  ↓ 标记存活对象
[存活✓][垃圾][存活✓][垃圾][存活✓]
  ↓ 清除垃圾
[存活][  ][存活][  ][存活]

优点：无需移动对象
缺点：产生内存碎片
\`\`\`

**适用场景**：Old Gen（CMS Old Gen阶段）

#### 2. 标记-复制 (Mark-Copying)

\`\`\`
Eden + Survivor (From)
[A][B][C][D][E][F][G][H]  (8份)
  ↓ 复制存活对象到To
Eden + Survivor (To)
[ ][ ][ ][ ][A][B][C][D]  (只有一半空间)

优点：无碎片、分配高效（指针碰撞）
缺点：可用空间减半、存活率高时复制代价大

适用场景：Young Gen（HotSpot默认8:1:1）
\`\`\`

**为什么是8:1:1而不是1:1？**
- 98%的对象是"朝生夕死"的（IBM研究数据）
-Survivor区预留10%应对极端情况
- HandlePromotionFailure允许From survivor空间不足时直接进Old Gen

#### 3. 标记-整理 (Mark-Compact)

\`\`\`
[存活][  垃圾  ][存活][  垃圾  ][存活]
  ↓ 标记 + 整理（向一端移动）
[存活][存活][存活][                    ]

优点：无碎片
缺点：移动对象成本高、需要STW

适用场景：Old Gen（Serial Old、Parallel Old、G1 Mixed GC）
\`\`\`

### 二、分代收集理论

**弱分代假说**（Weak Generational Hypothesis）：
- 绝大多数对象都是朝生夕死的
- 熬过越多次垃圾收集的对象越难死亡

**跨代引用假说**：
- 跨代引用相比同代引用仅占极少数

**卡表 (Card Table)**：解决跨代引用问题

\`\`\`
Old Gen:
[Card0][Card1][Card2][Card3]...  (每512字节一张卡)

Young Gen引用Old Gen时：
→ 修改Card Table对应卡片为Dirty Card
→ Young GC时只需扫描Dirty Card区域

写屏障（Write Barrier）：
// 每次引用字段赋值时执行
void pre_write_barrier(oop* field, oop new_value) {
    if (*field != null && is_in_young_gen(new_value)) {
        card_table[address(field)] = DIRTY;  // 标记脏卡
    }
    *field = new_value;
}
\`\`\`

### 三、各代GC选择策略

| 区域 | 算法 | 收集器选项 |
|------|------|-----------|
| Young Gen | 复制算法 | Copy/ParNew/PSScavenge/G1 Young |
| Old Gen | 标记-清除/整理 | MarkSweep-Compact/ConcurrentMarkSweep/G1 Mixed |

### 四、现代收集器对比

#### G1 (Garbage First) — JDK9默认

\`\`\`
分区模型（取代物理分代）：
┌─────┬─────┬─────┬─────┐
│  E  │  E  │  S  │  O  │  ← Region（每个2048KB~32MB可选）
├─────┼─────┼─────┼─────┤
│  E  │  O  │  O  │  H  │
└─────┴─────┴─────┴─────┘

特点：
- 可预测停顿时间（-XX:MaxGCPauseMillis=200）
- 并发标记 + 增量整理
- Remembered Set + Collection Set

适用场景：大堆(6GB+)、延迟敏感的应用
\`\`\`

#### ZGC (Z Garbage Collector) — JDK15生产就绪

\`\`\`
核心技术：
- Colored Pointer（染色指针）
  - Finalizable(0)、Remapped(1)、Marked1(2)、Marked0(3)
  - 42-44位存储GC状态（压缩了地址空间到42位）
- Load Barrier（读屏障）
  - 每次加载引用时检查颜色
  - 发现坏指针时触发修正（并发修正，无需STW）

停顿时间：< 1ms（与堆大小无关！）

适用场景：超低延迟要求、超大堆（TB级）
限制：Linux/x86_64、不支持压缩指针
\`\`\`

#### Shenandoah — JDK12引入

\`\`\`
与ZGC类似，但使用 Brooks Forwarding Pointer：
- 每个对象有一个额外的forwarding pointer字段
- 移动对象时更新此指针，无需染色指针

优势：平台无关（不仅限于Linux）
劣势：额外内存开销（每个对象多8字节）
\`\`\`

### 五、GC选型决策树

\`\`\`
你的应用是什么类型？
│
├─ 延迟敏感（交易、实时系统）
│  ├─ 堆 < 4GB → G1 (-XX:MaxGCPauseMillis=target)
│  └─ 堆 > 4GB → ZGC 或 Shenandoah
│
├─ 吞吐量优先（批处理、离线计算）
│  └─ Parallel GC (默认)
│
└─ 特殊需求
   ├─ CMS（已废弃，勿用）
   └─ Serial（单核、客户端应用）
\`\`\`

**生产环境推荐**（2024年）：
- 新项目：G1（通用）、ZGC（低延迟）
- 已有项目：评估迁移成本后再决定`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "GC算法", "性能调优"]
  },

  {
    title: "JVM内存模型(JMM)与可见性问题",
    content: `## 题目描述

请深入分析Java内存模型(JMM)：

1. JMM定义了哪些抽象？主内存 vs 工作内存的关系
2. happens-before原则有哪些？volatile如何实现可见性？
3. 指令重排序的类型及DCL双重检查锁定为何需要volatile
4. MESI缓存一致性协议与JMM的关系

### 考察点

- 内存屏障 (Memory Barrier)
- volatile语义（可见性 + 有序性）
- as-if-serial语义
- CPU缓存架构`,
    solution: `## JMM深度解析

### 一、JMM抽象结构

\`\`\`
┌─────────────────────────────────────┐
│           主内存 (Main Memory)       │
│  共享变量：instance, count, flag...  │
└──────────┬──────────┬───────────────┘
           │ lock/unlock │ read/write
    ┌──────▼──────┐ ┌──▼──────────┐
    │  线程A工作内存 │ │ 线程B工作内存 │
    │  (本地副本)   │ │  (本地副本)   │
    │  instance=... │ │  instance=... │
    └──────────────┘ └─────────────┘
\`\`\`

**8种原子操作**：
1. lock（锁定主内存变量）
2. unlock（解锁）
3. read（从主内存读取到工作内存）
4. load（将read的值放入工作内存变量）
5. use（将工作内存变量传给执行引擎）
6 assign（执行引擎赋值给工作内存变量）
7 store（工作内存变量传到主内存）
8 write（将store的值写入主内存变量）

### 二、Happens-Before原则

**HB规则列表**：
1. **程序顺序规则**：同一线程中，前面的操作HB后面的操作
2. **监视器锁规则**：unlock操作lock操作（同一把锁）
3. **volatile规则**：写操作HB后续的读操作（同一变量）
4. **线程启动规则**：Thread.start() HB该线程的所有操作
5. **线程终止规则**：线程中的所有操作HB Thread.join()返回
6. **线程中断规则**：interrupt() HB检测到中断
7. **对象终结规则**：构造函数HB finalize()
8. **传递性**：A HB B, B HB C ⇒ A HB C

**示例分析**：
\`\`\`java
// 以下代码在JMM下一定正确吗？
int x = 1;     // ①
int y = 2;     // ②
// 另一个线程能否看到 y=2 但 x=0？
// 答：不能！根据程序顺序规则，① HB ②
// 所以如果看到y=2，一定能看到x=1
\`\`\`

### 三、Volatile实现原理

**两层语义**：
1. **可见性**：对一个volatile变量的写，对所有线程立即可见
2. **有序性**：禁止指令重排序

**内存屏障插入策略**（StoreLoad屏障最贵）：

\`\`\`java
volatile变量写操作：
StoreStore屏障  // 确保之前的写已完成
volatile写
StoreLoad屏障   // 确保写完成后才能读

volatile变量读操作：
LoadLoad屏障    // 确保读完成后再读
LoadStore屏障   // 确保读完成后再写
\`\`\`

**汇编层面验证**（HotSpot）：
\`\`\`assembly
// volatile写
0x01b3d641: mov %eax,0x150(%esi)  ; 写入volatile变量
0x01b3d647: lock addl $0x0,(%esp)  ; Memory Barrier（Lock前缀指令）
\`\`\`

**Lock前缀指令的作用**：
1. 将当前处理器缓存行写回内存
2. 使其他处理器缓存行无效（MESI协议Invalid状态）

### 四、DCL双重检查锁定

\`\`\`java
// 错误版本（无volatile）
public class Singleton {
    private static Singleton instance;  // ❌ 缺少volatile

    public static Singleton getInstance() {
        if (instance == null) {              // 第一次检查（无锁）
            synchronized (Singleton.class) {
                if (instance == null) {      // 第二次检查（有锁）
                    instance = new Singleton();  // ⚠️ 非原子操作！
                }
            }
        }
        return instance;
    }
}
\`\`\`

**new Singleton() 实际上是3步**：
\`\`\`
① memory = allocate();    // 分配内存空间
② ctorInstance(memory);   // 初始化对象
③ instance = memory;      // 设置instance指向刚分配的地址

可能的重排序：① → ③ → ②（步骤②③可能互换！）
\`\`\`

**问题场景**：
\`\`\`
线程A执行：① → ③（此时instance!=null但对象未初始化）
线程B执行：第一次检查发现instance != null
线程B返回了一个未初始化完成的实例！❌
\`\`\`

**正确版本**：
\`\`\`java
private static volatile Singleton instance;  // ✅ 添加volatile禁止重排序
\`\`\`

### 五、MESI缓存一致性协议

\`\`\`
CPU缓存行的四种状态：
M (Modified):    已修改，与内存不一致，仅本Cache有效
E (Exclusive):   未修改，与其他Cache一致，仅本Cache有效
S (Shared):      未修改，与其他Cache一致，多个Cache有效
I (Invalid):     无效

状态转换：
M ← 写命中 → E ← 读缺失 → S ← 读命中 → I
\`\`\`

**JMM与MESI的关系**：
- JMM是语言层面的内存模型
- MESI是硬件层面的缓存一致性协议
- volatile的Lock前缀指令利用了MESI协议来保证可见性
- 但MESI并不等同于JMM的happens-before（存在Store Buffer导致的可见性延迟）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "并发编程", "内存模型"]
  },

  {
    title: "OOM排查实战与MAT工具使用",
    content: `## 题目描述

请分享一次完整的OOM排查过程：

1. 常见的OOM类型及触发原因（Heap/MetaSpace/DirectMemory/GC overhead/StackOverflow）
2. 如何配置JVM参数捕获OOM时的堆转储
3. 使用MAT(Eclipse Memory Analyzer)分析dump文件的完整流程
4. 一次真实的OOM案例：HashMap无限增长导致OOM

### 考察点

- 堆转储分析
- 泄漏 vs 溢出的区分
- 引用链分析
- 常规OOM模式识别`,
    solution: `## OOM排查完整指南

### 一、OOM类型分类

| OOM类型 | 触发条件 | 典型原因 |
|---------|---------|---------|
| java.lang.OutOfMemoryError: Java heap space | 堆内存耗尽 | 内存泄漏/对象过大/堆太小 |
| Metaspace | 元空间耗尽 | 动态生成大量类/CGlib代理过多 |
| Direct buffer memory | 直接内存耗尽 | Netty/ByteBuffer.allocateDirect |
| GC overhead limit exceeded | GC耗时超过98% | 对象创建速度 > GC回收速度 |
| Requested array size exceeds VM limit | 数组过大 | 试图分配超大数组 |
| StackOverflowError | 栈溢出 | 递归过深/无限递归 |
| Unable to create new native thread | 线程数过多 | 线程泄漏/ulimit限制 |

### 二、JVM参数配置

\`\`\`bash
# OOM时自动Dump（推荐）
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof

# 元空间相关
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# 直接内存限制
-XX:MaxDirectMemorySize=512m

# GC overhead阈值调整
-XX:GCTimeLimit=98
-XX:GCHeapFreeLimit=2
\`\`\`

### 三、MAT使用实战

#### 案例：HashMap导致的OOM

**现象**：线上服务每隔几天OOM重启

**Step 1: 获取Dump文件**

\`\`\`bash
# 方式1：自动dump（配置了HeapDumpOnOutOfMemoryError）
ls -lh /tmp/heapdump.hprof

# 方式2：手动触发
jcmd <pid> GC.heap_dump /tmp/heapdump.hprof

# 方式3：Arthas在线生成
heapdump /tmp/heapdump.hprof
\`\`\`

**Step 2: MAT打开分析**

\`\`\`
1. 打开 .hprof 文件
2. 选择 Leak Suspects Report（疑似泄漏报告）
   或 Dominator Tree（支配树）
\`\`\`

**Step 3: 分析Dominator Tree**

\`\`\`
Retained Heap（支配堆）= 该对象被GC后能释放的总内存

Class Name                          | Objects | Shallow Heap | Retained Heap
------------------------------------|---------|-------------|-------------
byte[][]                            | 1       | 32           | 1,234,567,890  ← 最大
  └─ HashMap$Node[]                 | 1       | 32           | 1,234,567,800
       └─ HashMap$Node              | 5000000 | 24           | 1,200,000,000
            └─ Entry (value)        | ...     | ...          | ...

关键发现：
- HashMap包含500万个Node
- 每个Node的value占用约240字节
- 总计约1.2GB内存被一个HashMap持有
\`\`\`

**Step 4: 找到GC Root**

\`\`\`
Right-click on suspicious object →
Path to GC Roots → exclude all phantom/weak/soft etc.

结果：
HashMap → StaticField → CacheManager.cache  ← GC ROOT!
\`\`\`

**Step 5: 定位源码**

\`\`\`java
// 问题代码
@Component
public class CacheManager {
    private static Map<String, Object> cache = new HashMap<>();  // 无限增长！

    public void put(String key, Object value) {
        cache.put(key, value);  // 只有put没有remove/expire
    }
}
\`\`\`

**修复方案**：
\`\`\`java
// 方案1：使用Guava Cache（LRU淘汰）
private Cache<String, Object> cache = CacheBuilder.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(30, TimeUnit.MINUTES)
    .removalListener(notification -> {
        log.info("Cache evicted: {}", notification.getKey());
    })
    .build();

// 方案2：使用Caffeine（更高性能）
private Cache<String, Object> cache = Caffeine.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(30, TimeUnit.MINUTES)
    .build();
\`\`\`

### 四、常见OOM模式速查

#### 模式1：Context泄漏（经典Web应用）

\`\`\`
症状：每次请求后内存持续增长
原因：ThreadLocal未remove + 线程池复用
定位：MAT中搜索ThreadLocalMap，检查Entry

修复：
try {
    threadLocal.set(value);
    // do work
} finally {
    threadLocal.remove();  // 必须！
}
\`\`\`

#### 模式2：连接池泄漏

\`\`\`
症状：java.lang.OutOfMemoryError: unable to create new native thread
原因：获取Connection后未close，连接池耗尽
定位：jstack查看大量BLOCKED在getConnection()

修复：使用try-with-resources
\`\`\`

#### 模式3：Metaspace爆炸

\`\`\`
症状：Metaspace持续增长直到OOM
原因：动态代理类/Cglib/ASM不断生成新类
定位：-XX:+TraceClassLoading + -XX:+TraceClassUnloading

修复：
- 升级到JDK8u40+（类卸载bug修复）
- 限制代理类数量
- 使用MetaspaceSize限制
\`\`\`

### 五、预防措施

\`\`\`bash
# 监控脚本（定期采集）
while true; do
    jstat -gcutil <pid> 1000 >> gc.log &
    jmap -histo <pid> >> histo.log &
    sleep 300
done

# 告警阈值
- Heap Usage > 85% 持续5分钟 → 告警
- Full GC频率 > 1次/小时 → 告警
- GC Pause > 2秒 → 告警
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "OOM排查", "性能调优", "线上排查"]
  },

  {
    title: "类加载机制与热部署实现",
    content: `## 题目描述

请深入分析Java类加载机制并实现热部署：

1. 详细描述类加载的五个阶段（加载、验证、准备、解析、初始化）
2. 何时触发类的初始化？（6种主动引用 vs 被动引用）
3. 实现一个简单的热部署ClassLoader（支持类文件修改后重新加载）
4. 分析主流热部署工具（JRebel、Spring DevTools、HotSwap）的原理差异

### 考察点

- 类加载生命周期
- 初始化触发条件
- ClassLoader隔离机制
- JVM TI (Tool Interface)`,
    solution: `## 类加载机制与热部署实战

### 一、类加载五阶段详解

#### Phase 1: 加载 (Loading)

\`\`\`
任务：
1. 通过全限定名获取类的二进制字节流（来源：文件/JAR/网络/运行时生成）
2. 将字节流转化为方法区的运行时数据结构
3. 在堆中生成Class对象作为入口

实现方式：ClassLoader.loadClass() → findClass() → defineClass()
\`\`\`

#### Phase 2: 验证 (Verification)

\`\`\`
四阶段验证：
1. 文件格式验证（魔数0xCAFEBABE、版本号、常量池标签）
2. 元数据验证（语义分析：是否有父类、是否继承final类）
3. 字节码验证（数据流分析：类型匹配、跳转指令合法）
4. 符号引用验证（全限定名是否能找到对应的类）

-Xverify:none 可以关闭大部分验证（加速启动）
\`\`\`

#### Phase 3: 准备 (Preparation)

\`\`\`
为静态变量分配内存并设置默认值（注意：不是初始值！）

public static int value = 123;
// 准备阶段：value = 0（int默认值）
// 初始化阶段：value = 123（用户赋值）

public static final int VALUE = 123;
// 准备阶段：VALUE = 123（ConstantValue属性，编译时常量）
\`\`\`

#### Phase 4: 解析 (Resolution)

\`\`\`
将符号引用替换为直接引用：
- 符号引用：org/example/User（字符串形式）
- 直接引用：内存地址偏移量

解析时机：
- 可在初始化之后（惰性解析，HotSpot默认）
- 可在初始化之前（ eagerly解析）

常量池解析：
CONSTANT_Class_info → Class对象
CONSTANT_Fieldref → Field对象+offset
CONSTANT_Methodref → Method对象+offset
\`\`\`

#### Phase 5: 初始化 (Initialization)

\`\`\`
执行<clinit>方法（类构造器）：
1. 收集所有类变量的赋值语句
2. 按源码顺序收集static{}代码块
3. 合并生成<clinit>方法

特点：
- 不需要显式定义，javac自动生成
- 父类的<clinit>先于子类执行
- 接口的<clinit>不需要先执行父接口
- <clinit>对类加锁（多线程安全）
\`\`\`

### 二、初始化触发条件（重点！）

#### 6种主动引用（一定会初始化）：

1. **new/getstatic/putstatic/invokestatic**：遇到这4条字节码指令
2. **反射调用**：Class.forName("com.xxx.Xxx")
3. **初始化子类**：父类未初始化则先初始化父类
4. **main方法所在类**：JVM启动时
5. **JDK 7+动态语言支持**：MethodHandle实例解析
6. **接口新增default方法**：接口实现类初始化（JDK8）

#### 被动引用（不会初始化）：

\`\`\`java
// 1. 通过子类引用父类静态字段（只初始化父类）
System.out.println(SubClass.staticParentField);  // Parent init, Sub NOT init

// 2. 数组定义（不初始化元素类）
SuperClass[] array = new SuperClass[10];  // SuperClass NOT init

// 3. 常量引用（编译期常量，存入调用方常量池）
System.out.println(ConstClass.CONST_VALUE);  // ConstClass NOT init
\`\`\`

### 三、热部署ClassLoader实现

\`\`\`java
public class HotSwapClassLoader extends URLClassLoader {
    // 记录类最后修改时间
    private final Map<String, Long> lastModifiedMap = new ConcurrentHashMap<>();

    public HotSwapClassLoader(URL[] urls) {
        super(urls, getSystemClassLoader().getParent());  // 打破双亲委派
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve)
            throws ClassNotFoundException {

        // 1. 只热部署特定包下的类
        if (!name.startsWith("com.example.hotswap")) {
            return super.loadClass(name, resolve);  // 其他类走双亲委派
        }

        // 2. 检查类文件是否被修改
        String resourcePath = name.replace('.', '/') + ".class";
        URL resource = findResource(resourcePath);
        if (resource != null) {
            File file = new File(resource.getFile());
            Long lastModified = lastModifiedMap.get(name);

            if (lastModified == null ||
                file.lastModified() > lastModified) {
                // 文件已修改，需要重新加载
                synchronized (getClassLoadingLock(name)) {
                    // 再次检查（double-check）
                    lastModified = lastModifiedMap.get(name);
                    if (lastModified == null ||
                        file.lastModified() > lastModified) {

                        // 移除旧的类定义（让GC回收）
                        try {
                            Class<?> existing = findLoadedClass(name);
                            if (existing != null) {
                                resolveClass(existing);  // 触发卸载
                            }
                        } catch (Exception e) { /* ignore */ }

                        lastModifiedMap.put(name, file.lastModified());
                        return findClass(name);  // 重新加载
                    }
                }
            }
        }

        // 3. 已加载且未修改
        Class<?> loaded = findLoadedClass(name);
        if (loaded != null) {
            return resolve ? resolveClass(loaded) : loaded;
        }

        return super.loadClass(name, resolve);
    }
}

// 使用示例
public class HotSwapDemo {
    public static void main(String[] args) throws Exception {
        URL[] urls = {new File("target/classes").toURI().toURL()};
        HotSwapClassLoader loader = new HotSwapClassLoader(urls);

        while (true) {
            // 每次创建新的ClassLoader实例
            Class<?> clazz = loader.loadClass("com.example.hotswap.HotService");
            Object service = clazz.getDeclaredConstructor().newInstance();
            Method method = clazz.getMethod("execute");
            method.invoke(service);

            Thread.sleep(5000);  // 每5秒检测一次
        }
    }
}
\`\`\`

**重要限制**：
- 无法卸载还在使用的类（需要所有实例都被GC）
- 不同ClassLoader加载的同名类不兼容（ClassCastException）
- 类型转换只能在同一个ClassLoader内进行

### 四、热部署工具对比

| 工具 | 原理 | 限制 | 成本 |
|------|------|------|------|
| **JRebel** | JVM TI + 字节码替换 | 几乎无 | 付费（昂贵） |
| **Spring DevTools** | 两个ClassLoader（Base + Restart） | 不能改方法签名 | 免费 |
| **HotSwap (JPDA)** | JVM TI RedefineClasses | 只能改方法体 | 免费 |
| **DCEVM** | 增强版HotSwap | 支持增删方法 | 免费（需安装agent） |

**Spring DevTools原理**：
\`\`\`
BaseClassLoader（不变的部分）
├── 第三方Jar包
├── Spring Framework
└── 应用基础类

RestartClassLoader（经常变的部分）
├── 应用代码（src/main/java）
├── application.properties
└── 静态资源

修改代码后 → 关闭RestartClassLoader → 创建新的 → 瞬间重启
（比完整重启快很多，因为BaseClassLoader不需要重新加载）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "ClassLoader", "热部署"]
  },

  {
    title: "直接内存(Direct Memory)管理与堆外内存泄漏排查",
    content: `## 题目描述

请深入分析JVM的直接内存（堆外内存）：

1. 直接内存与堆内存的区别、各自适用场景
2. ByteBuffer.allocateDirect()的底层实现原理
3. 直接内存的分配与释放机制（Cleaner + PhantomReference）
4. 排查直接内存泄漏的工具与方法（NMT、perf-map-agent）

### 考察点

- Unsafe API
- 虚引用与清理机制
- mmap/sendfile系统调用
- Netty堆外内存管理`,
    solution: `## 直接内存深度解析

### 一、堆内 vs 堆外内存对比

\`\`\`
┌──────────────────────────────────────────────┐
│                 JVM进程内存                   │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │   堆内存     │  │     堆外内存          │   │
│  │  (Heap)     │  │  (Direct Memory)     │   │
│  │             │  │                      │   │
│  │  Young/Old  │  │  DirectByteBuffer    │   │
│  │  MetaSpace  │  │  MappedByteBuffer    │   │
│  │             │  │  Native Code         │   │
│  │  受GC管理   │  │  不受GC管理          │   │
│  └─────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────┘
\`\`\`

| 特性 | 堆内存 | 直接内存 |
|------|--------|---------|
| 分配位置 | Java堆 | 本地内存（非堆） |
| 分配/释放 | GC自动管理 | 手动释放（或Cleaner） |
| GC影响 | 受GC影响（STW） | 不受GC影响 |
| 分配速度 | 快（指针碰撞） | 慢（系统调用） |
| IO效率 | 需要拷贝到本地缓冲区 | 零拷贝（DMA直接传输） |
| 大小限制 | -Xmx | -XX:MaxDirectMemorySize |
| 使用场景 | 普通对象 | NIO、Netty、大型文件 |

### 二、DirectByteBuffer底层实现

\`\`\`java
// ByteBuffer.allocateDirect(1024) 的调用链
public static ByteBuffer allocateDirect(int capacity) {
    return new DirectByteBuffer(capacity);
}

DirectByteBuffer(int cap) {
    super(-1, 0, cap, cap);
    // ★ 核心调用Unsafe分配内存
    long address = Unsafe.instance.allocateMemory(cap);
    // ★ 注册Cleaner（虚引用），用于GC时释放内存
    cleaner = Cleaner.create(this, new Deallocator(address, cap));
}

// Deallocator：实际释放内存的Runnable
private static class Deallocator implements Runnable {
    private long address;
    private int capacity;

    public void run() {
        if (address == 0) return;
        Unsafe.instance.freeMemory(address);  // 释放本地内存
        address = 0;
    }
}
\`\`\`

**释放机制详解**：
\`\`\`
DirectByteBuffer对象
    ↓ 被GC判定为PhantomReachable
PhantomReference (Cleaner)
    ↓ ReferenceHandler线程检测到
Deallocator.run()
    ↓ Unsafe.freeMemory()
操作系统回收物理内存
\`\`\`

**⚠️ 致命问题**：如果DirectByteBuffer对象本身还活着（有强引用），但已经不需要这块内存了，Cleaner不会触发！这就是**堆外内存泄漏**的根本原因。

### 三、Netty的堆外内存管理

\`\`\`java
// Netty的PooledByteBufAllocator解决了这个问题
PooledByteBufAllocator allocator = PooledByteBufAllocator.DEFAULT;

ByteBuf buf = allocator.directBuffer(1024);
try {
    // 使用buf...
} finally {
    buf.release();  // ★ 显式释放！引用计数归零时归还内存池
}
\`\`\`

**Netty内存池架构**：
\`\`\`
PoolArena（竞技场，按用途分为HeapArena/DirectArena）
├── PoolChunk（16MB内存块）
│   ├── PoolSubPage（小于8KB的小块）
│   └── PoolSubPage
├── PoolChunkList（管理不同使用率的Chunk）
│   ├── qInit (0-25%)
│   ├── q000 (1-50%)
│   ├── q025 (25-75%)
│   ├── q050 (50-100%)
│   └── q075 (75-100%)
└── PoolThreadLocalCache（线程本地缓存，减少竞争）
\`\`\`

**引用计数机制**：
\`\`\`java
buf.retain();   // refCnt: 1 → 2
buf.retain();   // refCnt: 2 → 3
buf.release();  // refCnt: 3 → 2
buf.release();  // refCnt: 2 → 1
buf.release();  // refCnt: 1 → 0 → 归还内存池！
\`\`\`

### 四、堆外内存泄漏排查

#### 工具1：Native Memory Tracking (NMT)

\`\`\`bash
# 启动时开启NMT（有2-10%性能损耗）
-XX:NativeMemoryTracking=summary

# 查看NMT报告
jcmd <pid> VM.native_memory summary

# 输出示例：
Native Memory Tracking:

Total: reserved=4096MB, committed=2048MB
-                 Java Heap (reserved=1536MB, committed=1536MB)
-                     Class (reserved=1024MB, committed=512MB)
-                    Thread (reserved=256MB, committed=256MB)
-                      Code (reserved=256MB, committed=128MB)
-                        GC (reserved=128MB, committed=128MB)
-                  Internal (reserved=64MB, committed=64MB)
-                      Symbol (committed=32MB)
-              Native Memory Tracking (committed=48MB)
-                       Arena (committed=32MB)  ← 这里看直接内存
-                    Tracing (committed=16MB)
-                   Logging (committed=8MB)
-                       Arguments (committed=4MB)
-                       Module (committed=2MB)
-            Unknown (committed=1MB)
\`\`\`

**detail级别查看更详细信息**：
\`\`\`bash
jcmd <pid> VM.native_memory detail scale=MB
\`\`\`

#### 工具2：Arthas

\`\`\`bash
# 查看 DirectByteBuffer 信息
dashboard  # 总览
memory     # 堆外内存统计
\`\`\`

#### 工具3：perf-map-agent（高级）

\`\`\`bash
# 生成Native内存分配调用栈
perf record -g -p <pid> --call-graph fp
perf report
\`\`\`

### 五、最佳实践

\`\`\`java
// ✅ 正确做法：使用try-finally确保释放
public void writeToChannel(ByteBuf data, Channel channel) {
    try {
        channel.writeAndFlush(data.retains());  // retain因为writeAndFlush会异步release
    } finally {
        data.release();  // 释放原始引用
    }
}

// ✅ 使用SimpleReferenceCountedUtil简化
ReferenceCountUtil.releaseLater(buf);

// ❌ 常见错误：忘记释放
public void badExample() {
    ByteBuf buf = Unpooled.directBuffer(1024);
    channel.write(buf);  // buf永远不会被释放！
    // 应该用 channel.writeAndFlush(buf) 或手动 release
}

// ❌ 另一个错误：重复释放
buf.release();
buf.release();  // IllegalReferenceCountException!
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["JVM", "直接内存", "内存管理", "Netty"]
  },

  {
    title: "实现一个简易的JVM内存监控工具",
    content: `## 题目描述

请实现一个JVM内存监控工具，具备以下功能：

1. 实时监控堆内存使用情况（Eden/Survivor/Old/Metaspace）
2. 监控GC次数和GC停顿时间
3. 当内存使用率超过阈值时发出告警
4. 支持历史数据查询和趋势图表输出

### 功能要求

- 使用JMX (ManagementFactory) 获取JVM指标
- 支持配置告警阈值
- 输出格式化的监控报告
- 提供命令行交互界面

### 考察点

- JMX API
- MemoryPoolMXBean / GarbageCollectorMXBean
- MemoryUsage对象
- 告警机制设计`,
    solution: `## JVM内存监控工具实现

### 完整代码实现

\`\`\`java
import java.lang.management.*;
import java.util.*;
import java.util.concurrent.*;
import java.text.SimpleDateFormat;

public class JVMMonitor {
    private final ScheduledExecutorService scheduler;
    private final List<MemorySnapshot> history = new CopyOnWriteArrayList<>();
    private final double heapWarningThreshold;
    private final double heapCriticalThreshold;
    private final AlertCallback alertCallback;

    public interface AlertCallback {
        void onAlert(String level, String message);
    }

    public JVMMonitor(double warningThreshold, double criticalThreshold,
                      AlertCallback callback) {
        this.heapWarningThreshold = warningThreshold;
        this.heapCriticalThreshold = criticalThreshold;
        this.alertCallback = callback;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "JVM-Monitor");
            t.setDaemon(true);
            return t;
        });
    }

    public void start(long intervalSeconds) {
        scheduler.scheduleAtFixedRate(this::collectMetrics,
                                       0, intervalSeconds, TimeUnit.SECONDS);
    }

    public void stop() {
        scheduler.shutdown();
    }

    private void collectMetrics() {
        MemorySnapshot snapshot = new MemorySnapshot(System.currentTimeMillis());

        // 1. 收集各内存池信息
        List<MemoryPoolMXBean> pools = ManagementFactory.getMemoryPoolMXBeans();
        for (MemoryPoolMXBean pool : pools) {
            snapshot.addPoolInfo(pool.getName(), pool.getUsage(),
                               pool.getPeakUsage(), pool.getCollectionUsage());
        }

        // 2. 收集GC信息
        List<GarbageCollectorMXBean> gcs = ManagementFactory.getGarbageCollectorMXBeans();
        for (GarbageCollectorMXBean gc : gcs) {
            snapshot.addGCInfo(gc.getName(), gc.getCollectionCount(),
                             gc.getCollectionTime());
        }

        // 3. 收集堆总览
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        snapshot.setHeapUsage(memoryBean.getHeapMemoryUsage());
        snapshot.setNonHeapUsage(memoryBean.getNonHeapMemoryUsage());

        history.add(snapshot);

        // 4. 检查告警
        checkAlerts(snapshot);

        // 5. 输出当前状态
        printStatus(snapshot);
    }

    private void checkAlerts(MemorySnapshot snapshot) {
        MemoryUsage heap = snapshot.getHeapUsage();
        double usedPercent = (double) heap.getUsed() / heap.getMax() * 100;

        if (usedPercent >= heapCriticalThreshold) {
            alertCallback.onAlert("CRITICAL",
                String.format("堆内存使用率 %.1f%% (已用%s/%s)",
                    usedPercent, formatBytes(heap.getUsed()), formatBytes(heap.getMax())));
        } else if (usedPercent >= heapWarningThreshold) {
            alertCallback.onAlert("WARNING",
                String.format("堆内存使用率 %.1f%% (已用%s/%s)",
                    usedPercent, formatBytes(heap.getUsed()), formatBytes(heap.getMax())));
        }
    }

    private void printStatus(MemorySnapshot snapshot) {
        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm:ss");
        System.out.println("\\n=== " + sdf.format(new Date(snapshot.getTimestamp())) + " ===");

        // 堆概览
        MemoryUsage heap = snapshot.getHeapUsage();
        System.out.printf("Heap: %s/%s (%.1f%%)\\n",
            formatBytes(heap.getUsed()), formatBytes(heap.getMax()),
            (double) heap.getUsed() / heap.getMax() * 100);

        // 各区域详情
        System.out.println("\\nMemory Pools:");
        System.out.printf("%-25s %-12s %-12s %-8s\\n",
            "Name", "Used", "Committed", "%Used");
        for (PoolInfo pool : snapshot.getPools()) {
            long committed = pool.usage.getCommitted();
            long max = pool.usage.getMax() > 0 ? pool.usage.getMax() : committed;
            System.out.printf("%-25s %-12s %-12s %.1f%%\\n",
                pool.name,
                formatBytes(pool.usage.getUsed()),
                formatBytes(committed),
                (double) pool.usage.getUsed() / max * 100);
        }

        // GC统计
        System.out.println("\\nGC Statistics:");
        for (GCInfo gc : snapshot.getGcStats()) {
            System.out.printf("  %-20s Collections: %d, Total Time: %dms\\n",
                gc.name, gc.collectionCount, gc.collectionTime);
        }
    }

    public List<MemorySnapshot> getHistory() {
        return new ArrayList<>(history);
    }

    public String generateReport() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== JVM Monitor Report ===\\n\\n");

        if (history.isEmpty()) {
            sb.append("No data collected yet.\\n");
            return sb.toString();
        }

        // 汇总统计
        MemorySnapshot first = history.get(0);
        MemorySnapshot last = history.get(history.size() - 1);

        sb.append(String.format("Monitoring Period: %s ~ %s\\n",
            new Date(first.getTimestamp()), new Date(last.getTimestamp())));
        sb.append(String.format("Total Snapshots: %d\\n\\n", history.size()));

        // GC汇总
        sb.append("GC Summary:\\n");
        Set<String> gcNames = new HashSet<>();
        for (MemorySnapshot snap : history) {
            for (GCInfo gc : snap.getGcStats()) gcNames.add(gc.name);
        }
        for (String gcName : gcNames) {
            long totalCount = 0, totalTime = 0;
            for (MemorySnapshot snap : history) {
                for (GCInfo gc : snap.getGcStats()) {
                    if (gc.name.equals(gcName)) {
                        totalCount += gc.collectionCount;
                        totalTime += gc.collectionTime;
                    }
                }
            }
            sb.append(String.format("  %s: %d collections, %dms total\\n",
                gcName, totalCount, totalTime));
        }

        return sb.toString();
    }

    private static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / 1024.0 / 1024);
        return String.format("%.2f GB", bytes / 1024.0 / 1024 / 1024);
    }

    // ========== 数据模型 ==========

    static class MemorySnapshot {
        private final long timestamp;
        private final List<PoolInfo> pools = new ArrayList<>();
        private final List<GCInfo> gcStats = new ArrayList<>();
        private MemoryUsage heapUsage;
        private MemoryUsage nonHeapUsage;

        MemorySnapshot(long timestamp) { this.timestamp = timestamp; }

        // getters and setters...
    }

    static class PoolInfo {
        String name;
        MemoryUsage usage;
        MemoryUsage peakUsage;
        MemoryUsage collectionUsage;
    }

    static class GCInfo {
        String name;
        long collectionCount;
        long collectionTime;
    }

    // ========== Main ==========

    public static void main(String[] args) {
        JVMMonitor monitor = new JVMMonitor(80.0, 95.0, (level, msg) -> {
            System.err.println("[" + level + " ALERT] " + msg);
        });

        monitor.start(5);  // 每5秒采集一次

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            monitor.stop();
            System.out.println("\\n" + monitor.generateReport());
        }));

        // 保持运行
        try { Thread.sleep(Long.MAX_VALUE); } catch (InterruptedException e) {}
    }
}
\`\`\`

### 使用示例

\`\`\`bash
# 编译运行
javac JVMMonitor.java
java JVMMonitor

# 输出示例：
# === 14:30:05 ===
# Heap: 256M/1024M (25.0%)
#
# Memory Pools:
# Name                      Used         Committed    %Used
# Eden Space               67.1 MB       136.0 MB     49.3%
# Survivor Space           1.0 MB        1.7 MB       58.8%
# Tenured Gen              45.2 MB       272.0 MB     16.6%
# Metaspace               58.3 MB        64.0 MB       91.1%
#
# GC Statistics:
#   G1 Young Generation Collections: 152, Total Time: 340ms
#   G1 Old Generation Collections: 3, Total Time: 120ms
#
# [WARNING ALERT] 堆内存使用率 85.2% (已用873M/1024M)
\`\`\`

### 扩展方向

1. **集成Prometheus**：导出metrics供Grafana展示
2. **历史持久化**：将snapshot存入数据库或文件
3. **智能告警**：基于趋势预测（如预计10分钟内OOM）
4. **GC日志关联**：关联GC日志与内存快照`,
    difficulty: "medium",
    questionType: "code",
    tags: ["JVM", "监控", "JMX", "工具开发"],
    codeTemplate: {
      java: `import java.lang.management.*;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic class JVMMonitor {\n    private final ScheduledExecutorService scheduler;\n    private final List<MemorySnapshot> history = new ArrayList<>();\n\n    public void start(long intervalSeconds) {\n        scheduler = Executors.newSingleThreadScheduledExecutor();\n        scheduler.scheduleAtFixedRate(this::collectMetrics, 0, intervalSeconds, TimeUnit.SECONDS);\n    }\n\n    private void collectMetrics() {\n        // TODO: 收集JVM内存和GC指标\n    }\n\n    // TODO: 完善告警和报告功能\n}`
    }
  },

  // ==================== 并发编程 (46-70) ====================
  {
    title: "ThreadLocal源码分析与内存泄漏问题",
    content: `## 题目描述

请深入分析ThreadLocal的实现原理：

1. ThreadLocal的内部数据结构（ThreadLocalMap的Hash冲突解决）
2. ThreadLocal.get()/set()的完整执行流程
3. ThreadLocal内存泄漏的原因及解决方案（弱引用 + remove()）
4. InheritableThreadLocal的原理与局限

### 考察点

- 开放寻址法（线性探测）
- 弱引用 (WeakReference)
- Entry的key设计
- 线程池复用问题`,
    solution: `## ThreadLocal深度源码分析

### 一、数据结构

\`\`\`
Thread对象
└── threadLocals: ThreadLocalMap  ← 每个线程有自己的Map
    ├── Entry[] table (初始容量16)
    │   ├── [index] Entry(ThreadLocal<A>, valueA)  // key是弱引用！
    │   ├── [index+1] Entry(ThreadLocal<B>, valueB)
    │   └── ...
    └── size, threshold, etc.

ThreadLocalMap.Entry:
    extends WeakReference<ThreadLocal<?>>  // key是弱引用
    Object value;  // value是强引用
\`\`\`

**为什么key用弱引用？**
- ThreadLocal外部不再使用时，key可以被GC回收
- 但value仍然是强引用，可能导致内存泄漏

### 二、get()源码逐行分析

\`\`\`java
public T get() {
    // 1. 获取当前线程
    Thread t = Thread.currentThread();

    // 2. 获取线程的ThreadLocalMap
    ThreadLocalMap map = getMap(t);

    if (map != null) {
        // 3. 在Map中查找当前ThreadLocal对应的Entry
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            // 4. 找到了，返回value
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }

    // 5. 没找到，执行初始化
    return setInitialValue();
}

// setInitialValue
private T setInitialValue() {
    T value = initialValue();  // 调用子类重写的方法（默认null）
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        map.set(this, value);  // 存入Map
    } else {
        createMap(t, value);   // 创建新Map
    }
    return value;
}
\`\`\`

### 三、set()源码分析（开放寻址法）

\`\`\`java
private void set(ThreadLocal<?> key, Object value) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len - 1);  // 计算初始hash槽位

    // 线性探测解决冲突
    for (Entry e = tab[i]; e != null; e = tab[i = nextIndex(i, len)]) {
        ThreadLocal<?> k = e.get();

        // Case 1: 找到相同的key，直接更新value
        if (k == key) {
            e.value = value;
            return;
        }

        // Case 2: key为null（弱引用已被GC），说明发生了内存泄漏
        if (k == null) {
            replaceStaleEntry(key, value, i);  // 替换过期Entry
            return;
        }
    }

    // Case 3: 找到空槽，创建新Entry
    tab[i] = new Entry(key, value);
    int sz = ++size;
    if (!cleanSomeSlots(i, sz) && sz >= threshold)  // 清理过期条目
        rehash();  // 扩容
}
\`\`\`

**threadLocalHashCode生成**：
\`\`\`java
// 每个ThreadLocal实例的唯一哈希码
private final int threadLocalHashCode = nextHashCode();

// AtomicInteger保证多线程下的唯一性
private static AtomicInteger nextHashCode = new AtomicInteger();
private static final int HASH_INCREMENT = 0x61c88647;  // 黄金分割数

private static int nextHashCode() {
    return nextHashCode.getAndAdd(HASH_INCREMENT);
}
\`\`\`

**为什么用0x61c88647？**
- 这是黄金比例相关的哈希增量
- 能让哈希值在2的幂次大小的表中均匀分布
- 类似于HashMap的扰动函数效果

### 四、内存泄漏分析

\`\`\`
正常情况：
ThreadLocal (强引用) → Entry.key (弱引用) → ThreadLocal对象
                                   ↓
                              Entry.value (强引用) → Value对象

ThreadLocal外部引用消失后：
ThreadLocal (null) → Entry.key (null，被GC回收)
                                   ↓
                              Entry.value (强引用) → Value对象  ← 泄漏！
\`\`\`

**为什么value不会被回收？**
- Entry.value是强引用
- Entry本身被ThreadLocalMap.table数组强引用
- ThreadLocalMap被Thread对象强引用
- Thread还活着（比如线程池中的线程），所以整个链路都不会被回收

**解决方案**：

\`\`\`java
// ✅ 最佳实践：必须在finally中remove
try {
    threadLocal.set(someValue);
    // 使用threadLocal...
} finally {
    threadLocal.remove();  // ★ 关键！切断value的强引用
}
\`\`\`

**ThreadLocalMap自身的清理机制**（但不完全可靠）：
\`\`\`java
// set()时：replaceStaleEntry() 清理连续的过期Entry
// get()时：expungeStaleEntry() 清理遇到的过期Entry
// 但如果从不调用get/set，就不会触发清理
\`\`\`

### 五、线程池复用问题

\`\`\`java
// ⚠️ 危险！线程池中ThreadLocal会泄漏到下一个任务
ExecutorService executor = Executors.newFixedThreadPool(4);

executor.submit(() -> {
    threadLocal.set("task1-data");  // 任务1设置
});

executor.submit(() -> {
    // 任务2可能读到任务1遗留的数据！
    Object data = threadLocal.get();  // 可能拿到 "task1-data"
});

// 解决方案：每次任务结束后清理
executor.submit(() -> {
    try {
        threadLocal.set("task-data");
        // do work
    } finally {
        threadLocal.remove();  // 必须清理！
    }
});
\`\`\`

### 六、InheritableThreadLocal

\`\`\`java
// 子线程自动继承父线程的ThreadLocal值
public class InheritableThreadLocal<T> extends ThreadLocal<T> {
    // 重写childValue方法
    protected T childValue(T parentValue) {
        return parentValue;  // 默认直接继承
    }
}

// 继承时机：Thread.init()时复制inheritableThreadLocals
// 局限性：只在创建子线程时继承一次，后续修改不会同步
\`\`\`

**TransmittableThreadLibrary (TTL)**：
- 解决线程池场景下ThreadLocal值的传递问题
- 支持任务提交时自动capture/restore/replay`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["并发编程", "ThreadLocal", "内存泄漏"]
  },

  {
    title: "CompletableFuture异步编程实战",
    content: `## 题目描述

请使用CompletableFuture实现以下复杂的异步编排场景：

1. 同时发起3个独立的HTTP请求，任意一个失败不影响其他
2. 等待其中最快的2个返回结果
3. 将前两步的结果组合后调用第4个服务
4. 整个过程设置超时控制（5秒）
5. 实现优雅的异常处理和降级方案

### 考察点

- thenCompose vs thenCombine的区别
- allof/anyof的使用
- exceptionally/handle异常处理
- orTimeout/completeOnTimeout超时控制`,
    solution: `## CompletableFuture异步编排实战

### 完整实现

\`\`\`java
import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;

public class AsyncOrchestration {

    // 模拟HTTP客户端
    static class HttpClient {
        public CompletableFuture<String> get(String url, int delayMs) {
            return CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(delayMs);
                    if (url.contains("fail")) {
                        throw new RuntimeException("Service unavailable: " + url);
                    }
                    return "Response from " + url;
                } catch (InterruptedException e) {
                    throw new CompletionException(e);
                }
            });
        }
    }

    public CompletableFuture<ResultDTO> executeComplexFlow(HttpClient client) {
        // ===== Step 1: 并行发起3个请求 =====
        CompletableFuture<String> future1 = client.get("/api/service-a", 1000)
            .exceptionally(ex -> {
                log.warn("Service A failed: " + ex.getMessage());
                return "DEFAULT_A";  // 降级值
            });

        CompletableFuture<String> future2 = client.get("/api/service-b", 2000)
            .exceptionally(ex -> {
                log.warn("Service B failed: " + ex.getMessage());
                return "DEFAULT_B";
            });

        CompletableFuture<String> future3 = client.get("/api/service-c/fail", 1500)
            .exceptionally(ex -> {
                log.warn("Service C failed: " + ex.getMessage());
                return "DEFAULT_C";  // Service C会失败，走降级
            });

        // ===== Step 2: 等待最快返回的2个 =====
        // 使用CompletableFuture.anyOf无法精确控制"最快N个"
        // 需要自定义实现
        CompletableFuture<List<String>> fastestTwo = waitForFastest(
            Arrays.asList(future1, future2, future3), 2);

        // ===== Step 3: 组合结果调用第4个服务 =====
        CompletableFuture<ResultDTO> finalResult = fastestTwo.thenCompose(results -> {
            String combined = String.join("|", results);
            log.info("Combined results: " + combined);

            return client.get("/api/service-d?data=" + combined, 500)
                .thenApply(response -> {
                    ResultDTO dto = new ResultDTO();
                    dto.setIntermediateResults(results);
                    dto.setFinalResponse(response);
                    dto.setTimestamp(System.currentTimeMillis());
                    return dto;
                })
                .orTimeout(3, TimeUnit.SECONDS)  // 第4个服务的超时
                .exceptionally(ex -> {
                    log.error("Service D timeout or failed");
                    ResultDTO fallback = new ResultDTO();
                    fallback.setIntermediateResults(results);
                    fallback.setFinalResponse("FALLBACK_RESPONSE");
                    return fallback;
                });
        });

        // ===== Step 4: 整体超时控制 =====
        return finalResult
            .orTimeout(5, TimeUnit.SECONDS)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Overall flow failed: " + ex.getMessage());
                } else {
                    log.info("Flow completed successfully");
                }
            });
    }

    /**
     * 等待N个Future中最快的count个完成
     */
    private <T> CompletableFuture<List<T>> waitForFastest(
            List<CompletableFuture<T>> futures, int count) {

        CompletableFuture<List<T>> result = new CompletableFuture<>();
        AtomicInteger completedCount = new AtomicInteger(0);
        List<T> results = Collections.synchronizedList(new ArrayList<>());
        AtomicBoolean done = new AtomicBoolean(false);

        for (CompletableFuture<T> future : futures) {
            future.whenComplete((value, ex) -> {
                if (done.get()) return;

                if (ex == null) {
                    results.add(value);
                    int current = completedCount.incrementAndGet();

                    if (current >= count) {
                        done.set(true);
                        result.complete(new ArrayList<>(results));
                    }
                } else {
                    // 这个future失败了，不计入completed
                    // 但如果失败的太多导致无法凑齐count个，需要处理
                    int remaining = futures.size() - completedCount.get();
                    if (remaining < count - completedCount.get()) {
                        done.set(true);
                        result.complete(new ArrayList<>(results));  // 返回已有的
                    }
                }
            });
        }

        return result;
    }

    // ===== DTO =====
    static class ResultDTO {
        private List<String> intermediateResults;
        private String finalResponse;
        private long timestamp;
        // getters and setters...
    }
}
\`\`\`

### 核心API对比

| API | 说明 | 场景 |
|-----|------|------|
| thenApply | 转换结果 | A→B的一对一映射 |
| thenAccept | 消费结果 | 只消费不返回 |
| thenRun | 执行动作 | 不关心前一步结果 |
| thenCompose | 扁平化链式调用 | 依赖上一个CF的结果再异步调用 |
| thenCombine | 合并两个CF | 两个独立CF都完成后合并 |
| thenAcceptBoth | 消费两个CF结果 | 两个都完成后消费 |
| applyToEither | 取更快的一个 | 竞争场景，谁快用谁 |
| allof | 等待所有完成 | 并行任务汇聚 |
| anyof | 等待任一完成 | 只要一个成功就行 |
| exceptionally | 异常时降级 | 类似catch |
| handle | 无论成败都处理 | 类似finally |
| orTimeout | 超时自动异常 | 超时控制 |
| completeOnTimeout | 超时给默认值 | 超时降级 |

### 异常处理最佳实践

\`\`\`java
public CompletableFuture<String> robustAsyncCall() {
    return doSomething()
        // 1. 转换异常类型
        .handle((result, ex) -> {
            if (ex != null) {
                if (ex.getCause() instanceof TimeoutException) {
                    return "TIMEOUT_FALLBACK";
                }
                return "GENERIC_FALLBACK";
            }
            return result;
        })

        // 2. 或者用exceptionally（只能处理CompletionException）
        .exceptionally(ex -> {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof BusinessException) {
                return "BUSINESS_FALLBACK";
            }
            throw new CompletionException(cause);  // 重新抛出不认识的异常
        })

        // 3. 重试机制
        .thenCompose(result -> retryIfNeeded(result))

        // 4. 最终兜底
        .exceptionally(ex -> {
            log.error("All retries exhausted", ex);
            return "ULTIMATE_FALLBACK";
        });
}

// 带重试的异步调用
private <T> CompletableFuture<T> withRetry(
        Supplier<CompletableFuture<T>> supplier,
        int maxRetries, long delayMs) {

    CompletableFuture<T> result = new CompletableFuture<>();
    attempt(supplier, result, maxRetries, delayMs, 0);
    return result;
}

private <T> void attempt(Supplier<CompletableFuture<T>> supplier,
                        CompletableFuture<T> result,
                        int retriesLeft, long delayMs, int attempt) {
    supplier.get().whenComplete((value, ex) -> {
        if (ex == null) {
            result.complete(value);
        } else if (retriesLeft > 0) {
            log.info("Retry #" + (attempt + 1) + " after " + delayMs + "ms");
            ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
            executor.schedule(() ->
                attempt(supplier, result, retriesLeft - 1, delayMs, attempt + 1),
                delayMs, TimeUnit.MILLISECONDS);
            executor.shutdown();
        } else {
            result.completeExceptionally(ex);
        }
    });
}
\`\`\``,
    difficulty: "hard",
    questionType: "code",
    tags: ["并发编程", "CompletableFuture", "异步编程"],
    codeTemplate: {
      java: `import java.util.*;\nimport java.util.concurrent.*;\n\npublic class AsyncOrchestration {\n\n    /**\n     * 并行调用多个服务，聚合结果\n     */\n    public CompletableFuture<Map<String, Object>> parallelCall() {\n        // TODO: 实现并行调用逻辑\n        // 1. 同时调用serviceA, serviceB, serviceC\n        // 2. 等待所有返回\n        // 3. 聚合结果\n        // 4. 超时控制和异常处理\n        return null;\n    }\n}`
    }
  },

  {
    title: "ForkJoinPool工作窃取算法原理",
    content: `## 题目描述

请深入分析ForkJoinPool的工作原理：

1. ForkJoinPool与普通ThreadPoolExecutor的本质区别
2. 工作窃取(Work Stealing)算法的具体实现
3. ForkJoinTask的三种类型（RecursiveTask/RecursiveAction/CountedCompleter）
4. 并行流Parallel Stream底层就是ForkJoinPool，如何自定义线程池？

### 考察点

- 双端队列 (Deque)
- 分治算法并行化
- commonPool陷阱
- 任务粒度控制`,
    solution: `## ForkJoinPool深度解析

### 一、与传统线程池的本质区别

\`\`\`
ThreadPoolExecutor（传统线程池）：
┌─────────┐ ┌─────────┐ ┌─────────┐
│ BlockingQueue │ ← 共享任务队列
└─────────┘ └─────────┘ └─────────┘
    Worker-1    Worker-2    Worker-3
  所有线程竞争同一个队列

ForkJoinPool（工作窃取）：
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Deque-1 │ │ Deque-2 │ │ Deque-3 │  ← 每个线程自己的双端队列
│ [head]  │ │ [head]  │ │ [head]  │
│ task-1  │ │ task-4  │ │ task-7  │
│ task-2  │ │ task-5  │ │ task-8  │
│ task-3  │ │ task-6  │ │         │
│  [tail] │ │  [tail] │ │  [tail] │
└────┬────┘ └────┬────┘ └────┬────┘
     │ 窃取      │ 窃取      │
     └──────────→└──────────→
\`\`\`

**核心区别**：
| 特性 | ThreadPoolExecutor | ForkJoinPool |
|------|-------------------|-------------|
| 任务队列 | 共享BlockingQueue | 每线程独立Deque |
| 任务获取 | 竞争共享队列 | LIFO取自己的/FIFO偷别人的 |
| 适用场景 | IO密集型 | CPU密集型（分治任务） |
| 任务类型 | 相互独立 | 可分解为子任务(Fork/Join) |
| 空闲策略 | 阻塞等待 | 窃取其他线程的任务 |

### 二、工作窃取算法详解

\`\`\`java
// ForkJoinWorkerThread.run() 简化版
protected void run() {
    ForkJoinPool.WorkQueue queue = workQueue;

    while (queue.task != null || (queue.task = scan(queue)) != null) {
        queue.forkAndExec(queue.task);  // 执行任务
        queue.task = null;
    }
}

// 扫描任务（工作窃取核心）
final ForkJoinTask<?> scan(WorkQueue q) {
    WorkQueue[] queues; int n;
    if ((queues = queues) != null && (n = queues.length) > 0) {
        // 1. 先尝试从自己的队列尾部取任务（LIFO，缓存友好）
        ForkJoinTask<?> t;
        if (q != null && (t = q.pop()) != null) {
            return t;
        }

        // 2. 自己没任务，随机窃取别人的队列头部（FIFO，减少竞争）
        int r = ThreadLocalRandom.probe;  // 随机种子
        for (int i = 0; i < n; i += 2) {
            WorkQueue q2;
            int m = n - 1;
            // 随机选择一个队列
            int j = ((r <<= 1) | (r >>> 31)) & m;
            if (j < 0) j += n;
            if ((q2 = queues[j]) != null && q2.base - q2.top < 0) {
                ForkJoinTask<?> t = q2.poll();  // 从头部窃取（FIFO）
                if (t != null) return t;
            }
        }
    }
    return null;  // 没有任务可做
}
\`\`\`

**为什么LIFO取自己的，FIFO偷别人的？**

1. **LIFO取自己的**：
   - 最近fork的任务大概率还在CPU缓存中（缓存局部性）
   - 减少缓存miss
   - 适合分治任务的"递归展开"特性

2. **FIFO偷别人的**：
   - 偷取的是最早放入的任务（通常是大任务）
   - 大任务可以继续分解（fork更多小任务）
   - 减少与原线程在同一位置的竞争

### 三、ForkJoinTask使用示例

#### 1. RecursiveTask（有返回值）

\`\`\`java
// 归并排序的并行实现
public class MergeSortTask extends RecursiveTask<int[]> {
    private final int[] array;
    private final int left, right;
    private static final int THRESHOLD = 10000;  // 任务粒度阈值

    public MergeSortTask(int[] array, int left, int right) {
        this.array = array;
        this.left = left;
        this.right = right;
    }

    @Override
    protected int[] compute() {
        int size = right - left + 1;

        // 小规模任务直接顺序执行
        if (size <= THRESHOLD) {
            int[] subArray = Arrays.copyOfRange(array, left, right + 1);
            Arrays.sort(subArray);
            return subArray;
        }

        // 分割任务
        int mid = left + (right - left) / 2;

        // Fork两个子任务
        MergeSortTask leftTask = new MergeSortTask(array, left, mid);
        MergeSortTask rightTask = new MergeSortTask(array, mid + 1, right);

        // fork一个，compute另一个（工作窃取优化）
        leftTask.fork();
        int[] rightResult = rightTask.compute();  // 当前线程执行右半部分
        int[] leftResult = leftTask.join();       // 等待左半部分完成

        // 合并结果
        return merge(leftResult, rightResult);
    }

    private int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            result[k++] = left[i] <= right[j] ? left[i++] : right[j++];
        }
        while (i < left.length) result[k++] = left[i++];
        while (j < right.length) result[k++] = right[j++];
        return result;
    }
}

// 使用
ForkJoinPool pool = new ForkJoinPool();
MergeSortTask task = new MergeSortTask(unsortedArray, 0, unsortedArray.length - 1);
int[] sorted = pool.invoke(task);
\`\`\`

#### 2. CountedCompleter（无阻塞join）

\`\`\`java
// 更高效的并行实现（不需要阻塞等待）
public class ParallelSum extends CountedCompleter<Long> {
    private final int[] array;
    private final int lo, hi;
    private Long result;

    public ParallelSum(CountedCompleter<?> parent, int[] array, int lo, int hi) {
        super(parent);
        this.array = array;
        this.lo = lo;
        this.hi = hi;
    }

    @Override
    public void compute() {
        if (hi - lo < THRESHOLD) {
            long sum = 0;
            for (int i = lo; i <= hi; i++) sum += array[i];
            setResult(sum);
            propagateCompletion();  // 通知父任务
        } else {
            int mid = (lo + hi) >>> 1;
            // pending计数=2，表示有2个子任务
            setPendingCount(1);  // 先设为1，下面fork会increment
            new ParallelSum(this, array, lo, mid).fork();  // pending=2
            new ParallelSum(this, array, mid + 1, hi).compute();  // 直接执行
        }
    }

    @Override
    public Long getRawResult() { return result; }

    public void setResult(Long v) { result = v; }
}
\`\`\`

### 四、Parallel Stream的commonPool陷阱

\`\`\`java
// ⚠️ 陷阱：Parallel Stream默认使用commonPool
// commonPool是全局共享的，所有Parallel Stream共用！

List<Integer> data = IntStream.range(0, 1000000).boxed().collect(Collectors.toList());

// 问题1：commonPool默认线程数 = CPU核心数 - 1
// 如果已经有其他任务占用了commonPool，这里会饿死
data.parallelStream().forEach(i -> heavyComputation(i));

// 问题2：commonPool中的任务是ForkJoinTask，不支持阻塞操作
// 如果在parallelStream中做IO操作，会阻塞commonPool
data.parallelStream().forEach(i -> {
    httpClient.get("/api/" + i);  // ❌ 阻塞IO，会拖垮整个commonPool
});

// ✅ 解决方案：自定义ForkJoinPool
ForkJoinPool customPool = new ForkJoinPool(4);  // 指定线程数
customPool.submit(() ->
    data.parallelStream().forEach(i -> heavyComputation(i))
).get();
\`\`\`

### 五、性能调优建议

\`\`\`java
// 1. 选择合适的并行度
int processors = Runtime.getRuntime().availableProcessors();
ForkJoinPool pool = new ForkJoinPool(processors);  // CPU密集型

// 2. 控制任务粒度（太细会增加调度开销，太粗会降低并行度）
// 经验值：单个任务执行时间应在 10~100 微秒之间
private static final int THRESHOLD = 10000;

// 3. 避免共享可变状态（否则需要额外的同步开销）
// 4. 避免在ForkJoinTask中进行阻塞操作
// 5. 使用ManagedBlocker处理必要的阻塞
ForkJoinPool.managedBlock(new ManagedBlocker() {
    @Override
    public boolean block() throws InterruptedException {
        // 阻塞操作
        lock.lockInterruptibly();
        return true;
    }
    @Override
    public boolean isReleasable() {
        return !lock.isLocked();
    }
});
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["并发编程", "ForkJoinPool", "算法"]
  },

  {
    title: "StampedLock乐观读与写锁实现",
    content: `## 题目描述

请深入分析StampedLock的特性与使用：

1. StampedLock与ReadWriteLock的区别和优势
2. 乐观读(Optimistic Reading)的原理与实现
3. 实现一个基于StampedLock的高性能缓存
4. StampedLock的三个陷阱（不可重入、不支持Condition、 stamped失效）

### 考察点

- CLH队列变体
- 版本戳(stamp)机制
- 乐观读 vs 悲观读
-ABA问题`,
    solution: `## StampedLock深度解析

### 一、与ReadWriteLock对比

\`\`\`
ReadWriteLock (ReentrantReadWriteLock):
- 读读共享
- 写写互斥
- 读写互斥
- 支持重入
- 支持Condition
- 写锁饥饿问题（读多写少时，写锁可能一直拿不到）

StampedLock:
- 上述所有特性 +
- 乐观读（无锁读！）
- 不可重入
- 不支持Condition
- 所有方法返回stamp（版本戳）
\`\`\`

**性能对比**（读多写少场景）：

| 操作 | ReentrantReadWriteLock | StampedLock (乐观读) |
|------|----------------------|---------------------|
| 读操作 | 需要获取读锁 | 无锁！（CAS验证stamp） |
| 读吞吐量 | 1x基准 | 4-10x提升 |
| 写操作 | 类似 | 类似 |
| 内存消耗 | 较高（每个线程一个Node） | 较低 |

### 二、三种锁模式

\`\`\`java
StampedLock sl = new StampedLock();

// 1. 写锁（独占/排他）
long stamp = sl.writeLock();   // 获取写锁，返回stamp
try {
    // 修改共享变量
    map.put(key, value);
} finally {
    sl.unlockWrite(stamp);     // 用stamp解锁
}

// 2. 悲观读（类似RRWL的读锁）
long stamp = sl.readLock();
try {
    // 读取共享变量
    Object val = map.get(key);
} finally {
    sl.unlockRead(stamp);
}

// 3. 乐观读（StampedLock的核心优势！）
long stamp = sl.tryOptimisticRead();  // 获取乐观读stamp（几乎无开销）
// 读取共享变量
double currentX = x;
double currentY = y;

// 验证stamp是否有效（期间有没有写操作）
if (!sl.validate(stamp)) {
    // 乐观读失败，升级为悲观读
    stamp = sl.readLock();
    try {
        currentX = x;
        currentY = y;
    } finally {
        sl.unlockRead(stamp);
    }
}
// 使用currentX, currentY...
\`\`\`

### 三、乐观读原理

\`\`\`
乐观读的本质：
1. 获取当前版本号（stamp），不加任何锁
2. 读取数据（可能有写线程同时修改）
3. 读取完毕后验证版本号是否变化
   - stamp相同 → 期间没有写操作，数据有效 ✓
   - stamp不同 → 期间有写操作，数据可能不一致 ✗

为什么叫"乐观"？
- 乐观地认为读的过程中不会有写操作
- 如果猜对了，性能极高（无锁）
- 如果猜错了，退化成悲观读（代价是重读一次）

类比：CAS（Compare And Swap）的思想
\`\`\`

### 四、高性能缓存实现

\`\`\`java
public class OptimisticCache<K, V> {
    private final Map<K, V> map = new HashMap<>();
    private final StampedLock sl = new StampedLock();

    // 读操作（使用乐观读）
    public V get(K key) {
        long stamp = sl.tryOptimisticRead();  // ① 获取乐观读stamp
        V value = map.get(key);               // ② 读取数据（第一次）

        if (!sl.validate(stamp)) {             // ③ 验证stamp
            // 乐观读失败，升级为悲观读
            stamp = sl.readLock();             // ④ 获取悲观读锁
            try {
                value = map.get(key);          // ⑤ 重新读取
            } finally {
                sl.unlockRead(stamp);          // ⑥ 释放读锁
            }
        }
        return value;                          // ⑦ 返回结果
    }

    // 写操作
    public V put(K key, V value) {
        long stamp = sl.writeLock();           // 获取写锁
        try {
            return map.put(key, value);
        } finally {
            sl.unlockWrite(stamp);            // 释放写锁
        }
    }

    // 读后可能跟写的复合操作
    public V putIfAbsent(K key, Function<K, V> mappingFunction) {
        // 先乐观读
        long stamp = sl.tryOptimisticRead();
        V value = map.get(key);

        if (value != null && sl.validate(stamp)) {
            return value;  // 已存在且验证通过
        }

        // 需要写，先尝试升级为写锁
        long ws = sl.tryConvertToWriteLock(stamp);
        if (ws != 0L) {
            // 成功升级（stamp有效且无竞争）
            stamp = ws;
        } else {
            // 升级失败，先释放乐观读再获取写锁
            sl.unlockRead(stamp);
            stamp = sl.writeLock();
        }
        try {
            value = map.get(key);
            if (value == null) {
                value = mappingFunction.apply(key);
                map.put(key, value);
            }
            return value;
        } finally {
            sl.unlockWrite(stamp);
        }
    }
}
\`\`\`

### 五、三大陷阱

#### 陷阱1：不可重入

\`\`\`java
StampedLock sl = new StampedLock();

// ❌ 死锁！
public void methodA() {
    long stamp = sl.writeLock();
    try {
        methodB();  // methodB也尝试获取写锁 → 死锁！
    } finally {
        sl.unlockWrite(stamp);
    }
}

public void methodB() {
    long stamp = sl.writeLock();  // 同一线程再次获取写锁 → 死锁
    try {
        // ...
    } finally {
        sl.unlockWrite(stamp);
    }
}

// ✅ ReentrantReadWriteLock可以重入
\`\`\`

#### 陷阱2：不支持Condition

\`\`\`java
// ❌ StampedLock没有newCondition()
// sl.writeLock().newCondition();  // 编译错误！

// 如果需要条件变量，使用ReentrantReadWriteLock
// 或自行实现wait/notify机制
\`\`\`

#### 陷阱3：Stamp失效

\`\`\`java
// ❌ 危险：stamp可能失效
long stamp = sl.tryOptimisticRead();
// ... 很长的读操作 ...
if (!sl.validate(stamp)) {
    // 此时升级为悲观读
    stamp = sl.readLock();  // 这里的stamp是新值
}
sl.unlockRead(stamp);  // ✅ 正确：使用最新的stamp

// ❌ 错误：使用旧stamp解锁
long oldStamp = sl.tryOptimisticRead();
long newStamp = sl.readLock();  // 获取悲观读锁
sl.unlockRead(oldStamp);  // 💥 用oldStamp解锁newStamp获取的锁！
\`\`\`

### 六、使用建议

\`\`\`
适用场景：
✅ 读远多于写（如配置缓存、元数据缓存）
✅ 对读延迟敏感
✅ 数据一致性容忍短暂的不一致（最终一致即可）

不适用场景：
❌ 需要重入锁的场景
❌ 需要Condition变量的场景
❌ 写操作频繁（乐观读的优势体现不出来）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["并发编程", "锁", "高性能"]
  },

  {
    title: "Disruptor高性能队列原理与实现",
    content: `## 题目描述

请深入分析LMAX Disruptor的高性能设计：

1. Disruptor为什么比ArrayBlockingQueue快10倍以上？
2. Ring Buffer环形数组结构与伪共享(False Sharing)解决方案
3. 序列栅栏(SequenceBarrier)与等待策略(WaitStrategy)
4. 实现一个简易版的Disruptor核心组件

### 考察点

- CPU缓存行(Cache Line)机制
- 内存屏障(Memory Barrier)
- 无锁设计(Lock-free)
- 生产者-消费者模式`,
    solution: `## Disruptor高性能原理深度解析

### 一、性能差距的根源

\`\`\`
ArrayBlockingQueue的性能瓶颈：
1. 锁竞争（ReentrantLock）
2. 伪共享（False Sharing）导致缓存行失效
3. GC压力（每个Event是一个对象）

Disruptor的优化：
1. 无锁设计（CAS + 序列栅栏）
2. 解决伪共享（缓存行填充 @Contended）
3. 预分配内存（Ring Buffer + 对象池）
4. 内存屏障优化
\`\`\`

### 二、Ring Buffer核心结构

\`\`\`java
// 环形数组（大小必须是2的幂，便于取模优化为位运算）
public class RingBuffer<E> {
    private final Object[] entries;      // 环形数组
    private final int bufferSize;        // 必须是2^n
    private final long indexMask;        // bufferSize - 1

    // 生产者序列号
    private volatile long cursor = INITIAL_CURSOR_VALUE;  // -1
    // 消费者序列号（最慢的那个）
    private Sequence[] gatingSequences;

    public long next() {
        return cursor.get() + 1;  // CAS获取下一个位置
    }

    public E get(long sequence) {
        return (E) entries[(int) (sequence & indexMask)];
    }
}
\`\`\`

### 三、伪共享解决方案

\`\`\`java
// ❌ 伪共享问题：多个变量在同一缓存行(64字节)
class SharedVariables {
    volatile long p1Cursor;   // 8 bytes
    volatile long c1Sequence; // 8 bytes → 可能同一缓存行！
}

// ✅ 解决方案1：JDK8+ @Contended注解
@Contended
class DisruptorSequences {
    volatile long cursor;
}

// ✅ 解决方案2：手动填充（JDK6/7兼容）
public class Padding {
    public volatile long p1, p2, p3, p4, p5, p6, p7;
    public volatile long cursor;
    public volatile long p9, p10, p11, p12, p13, p14, p15;
}
// 每个long 8字节，前后各7个 = 56字节 + cursor 8字节 = 64字节（一个完整缓存行）
\`\`\`

**伪共享原理**：
- CPU缓存行通常64字节
- 不同线程修改同一缓存行的不同变量
- 导致缓存行在CPU间来回传递（缓存一致性协议开销）

### 四、等待策略对比

| 策略 | CPU使用 | 延迟 | 适用场景 |
|------|---------|------|---------|
| BlockingWait | 低 | 高 | 低延迟不敏感 |
| SleepingWait | 中 | 中 | 平衡选择 |
| YieldingWait | 高 | 低 | 实时系统 |
| BusySpinWait | 极高 | 极低 | 超低延迟`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["并发编程", "高性能", "队列"]
  },

  // ==================== Spring 全家桶 (71-100) ====================
  {
    title: "Spring Boot自动配置原理深度分析",
    content: `## 题目描述

请深入分析Spring Boot自动配置(Auto Configuration)机制：

1. @SpringBootApplication注解的组合原理
2. spring.factories与AutoConfigurationImportSelector的工作流程
3. @Conditional系列条件注解的实现原理
4. 如何自定义Starter？分析spring-boot-starter-data-redis的设计模式

### 考察点

- SPI扩展机制
- 配置类加载顺序
- 条件评估
- Starter规范`,
    solution: `## Spring Boot自动配置深度解析

### 一、@SpringBootApplication组合注解

\`\`\`java
@SpringBootApplication
= @SpringBootConfiguration     // 标记这是配置类
+ @EnableAutoConfiguration      // ★ 核心启用自动配置
+ @ComponentScan               // 组件扫描
+ @ConfigurationPropertiesScan  // 配置属性扫描
\`\`\`

**@EnableAutoConfiguration的核心**：
\`\`\`java
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration { ... }
\`\`\`

### 二、自动配置加载流程

\`\`\`
启动 → 创建ApplicationContext
  ↓
SpringApplication.run()
  ↓
refresh() → invokeBeanFactoryPostProcessors()
  ↓
ConfigurationClassPostProcessor.processConfigBeanDefinitions()
  ↓
@Import(AutoConfigurationImportSelector.class) 触发
  ↓
AutoConfigurationImportSelector.selectImports()
  ├── 读取 META-INF/spring.factories
  │   key = org.springframework.boot.autoconfigure.EnableAutoConfiguration
  │   value = [127个自动配置类列表]
  ├── 过滤排除的类 (@EnableAutoConfiguration.exclude / excludeName)
  └── 应用过滤器 (OnClassCondition / OnWebCondition / OnPropertyCondition)
      ↓
返回最终生效的自动配置类列表
\`\`\`

**spring.factories示例**（spring-boot-autoconfigure）：
\`\`\`
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\\
  org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration,\\
  org.springframework.boot.autoconfigure.aop.AopAutoConfiguration,\\
  org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration,\\
  org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,\\
  ... (共127个)
\`\`\`

### 三、@Conditional条件注解体系

\`\`\`
@Conditional(OnClassCondition.class)       → @ConditionalOnClass
@Conditional(OnMissingClassCondition.class)→ @ConditionalOnMissingClass
@Conditional(OnBeanCondition.class)         → @ConditionalOnBean
@Conditional(OnMissingBeanCondition.class)  → @ConditionalOnMissingBean
@ConditionalOnProperty                      → 属性存在且匹配
@ConditionalOnResource                     → 资源存在
@ConditionalOnWebApplication              → Web环境
@ConditionalOnNotWebApplication           → 非Web环境
@ConditionalOnExpression                   → SpEL表达式
\`\`\`

**Redis自动配置的条件判断**：
\`\`\`java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(RedisOperations.class)  // classpath有Redis依赖
@EnableConfigurationProperties(RedisProperties.class)
@Import({ LettuceConnectionConfiguration.class, JedisConnectionConfiguration.class })
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")  // 用户没自定义时才创建
    public RedisTemplate<Object, Object> redisTemplate(
            RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<Object, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }
}
\`\`\`

### 四、自定义Starter开发规范

**命名规则**：
- 官方：spring-boot-starter-{name}（如spring-boot-starter-web）
- 第三方：{name}-spring-boot-starter（如mybatis-spring-boot-starter）

**标准结构**：
\`\`\`
my-spring-boot-starter/
├── pom.xml
└── src/main/java/
    └── com/example/
        ├── autoconfigure/
        │   └── MyServiceAutoConfiguration.java
        ├── MyProperties.java
        └── MyService.java
└── src/main/resources/
    └── META-INF/
        └── spring.factories          ← 注册自动配置类
        └── spring-configuration-metadata.json  ← IDE提示
\`\`\`

**核心代码**：
\`\`\`java
// 1. 配置属性类
@ConfigurationProperties(prefix = "my.service")
public class MyProperties {
    private String name = "default";
    private boolean enabled = true;
    // getters & setters
}

// 2. 自动配置类
@Configuration
@EnableConfigurationProperties(MyProperties.class)
@ConditionalOnClass(MyService.class)
@ConditionalOnProperty(prefix = "my.service", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyProperties props) {
        return new MyService(props.getName());
    }
}

// 3. spring.factories注册
org.springframework.boot.autoconfigure.AutoConfigurationImporter.AutoConfiguration=\\
com.example.autoconfigure.MyServiceAutoConfiguration
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Spring全家桶", "Spring Boot", "自动配置"]
  },

  {
    title: "Spring AOP实现原理与动态代理源码",
    content: `## 题目描述

请深入分析Spring AOP的实现原理：

1. AOP核心概念（JoinPoint/Pointcut/Advice/Aspect/Weaving）
2. Spring AOP如何通过动态代理实现AOP（JDK vs CGLIB选择策略）
3. @Around/@Before/@After通知的执行顺序与异常处理
4. 分析AOP在事务管理(@Transactional)、权限控制中的实际应用

### 考察点

- 代理模式
- 切面编程范式
- 方法拦截链
- 循环依赖与AOP的关系`,
    solution: `## Spring AOP深度解析

### 一、核心概念图解

\`\`\`
Target（目标对象）
    ↓ Proxy（代理对象）
        ↓ method invocation
    Interceptor Chain（拦截器链）
    ├── @Before Advice
    ├── Target Method（目标方法执行）
    ├── @AfterReturning / @AfterThrowing
    └── @After (finally块)
\`\`\`

### 二、代理创建流程

\`\`\`java
// AbstractAutoProxyCreator.createProxy()
protected Object createProxy(Class<?> beanClass, String beanName,
                              Object[] specificInterceptors, TargetSource targetSource) {
    // 1. 创建ProxyFactory
    ProxyFactory proxyFactory = new ProxyFactory();
    proxyFactory.copyFrom(this);
    proxyFactory.setTargetSource(targetSource);
    
    // 2. 设置Advisor（增强器）
    if (!ArrayUtils.isEmpty(specificInterceptors)) {
        for (Object interceptor : specificInterceptors) {
            if (interceptor instanceof Advisor) {
                proxyFactory.addAdvisor((Advisor) interceptor);
            } else if (interceptor instanceof MethodInterceptor) {
                proxyFactory.addAdvisor(new DefaultPointcutAdvisor(interceptor));
            }
        }
    }

    // 3. 创建代理对象
    return proxyFactory.getProxy(getProxyClassLoader());
}

// ProxyFactory.getProxy() 内部逻辑：
// 判断是否需要接口代理还是类代理
if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
    return JdkDynamicAopProxy.newInstance(...);  // JDK代理
} else {
    return ObjenesisCglibAopProxy.newInstance(...);  // CGLIB代理
}
\`\`\`

### 三、通知执行顺序

\`\`\`java
// MethodInterceptor链式调用（ReflectiveMethodInvocation）
public Object proceed() throws Throwable {
    // 从 -1 开始递增到 interceptorList.size()
    currentInterceptorIndex++;

    if (currentInterceptorIndex == interceptors.length) {
        // 所有拦截器都执行完了，调用目标方法
        return invokeJoinpoint();  // method.invoke(target, args)
    }

    // 获取当前拦截器并执行
    MethodInterceptor interceptor = interceptors[currentInterceptorIndex];
    return interceptor.invoke(this);  // 传入this以便继续proceed()
}
\`\`\`

**各种Advice的转换**：

| 注解 | 转换后的拦截器 | 执行时机 |
|------|--------------|---------|
| @Before | MethodBeforeAdviceInterceptor | 目标方法前 |
| @AfterReturning | AfterReturningAdviceInterceptor | 目标方法成功返回后 |
| @AfterThrowing | AspectJAfterThrowingAdvice | 目标方法抛出异常后 |
| @After | AspectJAfterAdvice | finally块中（无论成败） |
| @Around | 直接作为MethodInterceptor | 包裹整个目标方法 |

**执行顺序示例**：
\`\`\`
@Around("pointcut()")
public Object around(ProceedingJoinPoint pjp) throws Throwable {
    System.out.println("1. Around Before");
    try {
        Object result = pjp.proceed();  // 触发@Before → target → @AfterReturning/@AfterThrowing → @After
        System.out.println("5. Around After Returning");
        return result;
    } catch (Exception e) {
        System.out.println("5. Around After Throwing");
        throw e;
    } finally {
        System.out.println("6. Around Finally");
    }
}

实际输出顺序：
1. Around Before
2. Before
3. Target Method
4. AfterReturning / AfterThrowing
5. After
6. Around After Returning/Throwing
7. Around Finally
\`\`\`

### 四、AOP与循环依赖的关系

\`\`\`java
// Spring解决循环依赖时，如果涉及AOP代理
// 会提前暴露一个代理对象的引用（而不是原始对象）

// getEarlyBeanReference() 在三级缓存中处理
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
    Object exposedObject = bean;
    if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
        for (SmartInstantiationAwareBeanPostProcessor bp : getBeanPostProcessors()) {
            // 如果是AOP相关的BeanPostProcessor，会在这里创建代理
            if (bp instanceof AbstractAutoProxyCreator) {
                exposedObject = ((AbstractAutoProxyCreator) bp).getEarlyBeanReference(exposedObject, beanName);
            }
        }
    }
    return exposedObject;  // 返回的是代理对象！
}
\`\`\`

**为什么构造器注入会循环依赖失败？**
- 构造器注入需要在实例化阶段就拿到完整的Bean引用
- 但此时Bean还未放入三级缓存（还没到属性赋值阶段）
- 所以无法提前暴露代理对象，只能抛出BeanCurrentlyInCreationException`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Spring全家桶", "AOP", "设计模式"]
  },

  {
    title: "Spring事务传播行为与嵌套事务实战",
    content: `## 题目描述

请深入分析Spring事务管理的传播行为：

1. 7种传播行为的含义及实际效果（REQUIRED/REQUIRES_NEW/NESTED等）
2. 同一类中事务方法互相调用的@Transactional失效问题及解决方案
3. 编程式事务(TransactionTemplate)与声明式事务的选择场景
4. 分析一个复杂的事务嵌套场景：主事务+子事务+独立事务的混合使用

### 考察点

- PlatformTransactionManager
- TransactionStatus
- TransactionSynchronizationManager
- 连接绑定线程`,
    solution: `## Spring事务传播行为深度解析

### 一、7种传播行为详解

| 传播行为 | 已有事务 | 无事务 | 典型场景 |
|---------|--------|-------|---------|
| REQUIRED | 加入当前事务 | 创建新事务 | **默认**，大多数场景 |
| SUPPORTS | 加入当前事务 | 以非事务运行 | 查询操作 |
| MANDATORY | 加入当前事务 | 抛异常 | 必须在事务内调用 |
| REQUIRES_NEW | **挂起当前事务，创建新事务** | 创建新事务 | 独立事务（如日志记录） |
| NOT_SUPPORTED | **挂起当前事务，非事务运行** | 非事务运行 | 不需要事务的操作 |
| NEVER | 抛异常 | 非事务运行 | 禁止在事务中调用 |
| NESTED | 嵌套事务（Savepoint） | 创建新事务 | 部分回滚 |

### 二、REQUIRES_NEW vs NESTED（重点！）

\`\`\`java
@Service
public class OrderService {

    @Transactional(propagation = Propagation.REQUIRED)
    public void createOrder(Order order) {
        orderDao.insert(order);  // ① 主事务

        try {
            logService.recordLog(order.getId());  // ② REQUIRES_NEW
        } catch (Exception e) {
            // ②失败不影响①
        }

        inventoryService.deductStock(order.getItems());  // ③ NESTED
        // 如果③失败，①和③都回滚（但②不受影响）
    }
}

@Service
public class LogService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLog(Long orderId) {
        logDao.insert(new Log(orderId));  // 独立事务！
        throw new RuntimeException("log fail");  // 只回滚日志
    }
}

@Service
public class InventoryService {
    @Transactional(propagation = Propagation.NESTED)
    public void deductStock(List<Item> items) {
        for (Item item : items) {
            stockDao.deduct(item);  // 嵌套在主事务中
            if (item.getQty() < 0) throw new RuntimeException("库存不足");
        }
        // 回滚时只回滚到savepoint，不影响之前的主事务操作
    }
}
\`\`\`

**关键区别**：

| 特性 | REQUIRES_NEW | NESTED |
|------|-------------|--------|
| 事务隔离 | 完全独立的新事务 | 嵌套子事务（Savepoint） |
| 回滚影响 | 子事务回滚不影响父事务 | 子事务回滚导致父事务也回滚 |
| 提交影响 | 子事务先于父事务提交 | 随父事务一起提交 |
| 数据库支持 | 所有数据库 | 需要Savepoint支持 |

### 三、同类方法调用失效问题

\`\`\`java
// ⚠️ 失效！
@Service
public class UserService {

    public void methodA() {
        this.methodB();  // 直接调用，不走代理！@Transactional无效
    }

    @Transactional
    public void methodB() {
        userDao.insert(new User());  // 不会在事务中执行
    }
}

// ✅ 解决方案1：自我注入
@Service
public class UserService {
    @Autowired
    private UserService self;  // Spring会注入代理对象

    public void methodA() {
        self.methodB();  // 通过代理调用，@Transactional生效
    }
}

// ✅ 解决方案2：AopContext
public void methodA() {
    ((UserService) AopContext.currentProxy()).methodB();
}
// 需要开启：@EnableAspectJAutoProxy(exposeProxy = true)

// ✅ 解决方案3：TransactionTemplate（推荐用于内部调用）
@Autowired
private TransactionTemplate transactionTemplate;

public void methodA() {
    transactionTemplate.execute(status -> {
        methodB();
        return null;
    });
}
\`\`\`

### 四、编程式事务模板

\`\`\`java
@Service
public class PaymentService {

    @Autowired
    private TransactionTemplate txTemplate;

    public PaymentResult processPayment(PaymentRequest request) {
        return txTemplate.execute(status -> {
            // 1. 扣款
            accountService.debit(request.getAccountId(), request.getAmount());

            // 2. 创建订单
            Order order = orderService.create(request);

            // 3. 条件性回滚
            if (order.getStatus() == FAILED) {
                status.setRollbackOnly();  // 标记回滚
                return PaymentResult.failed(order);
            }

            return PaymentResult.success(order);
        });
    }

    // 带超时的独立事务
    public void asyncLog(String message) {
        TransactionTemplate isolatedTx = new TransactionTemplate(transactionManager);
        isolatedTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        isolatedTx.setTimeout(30);  // 30秒超时

        isolatedTx.execute(status -> {
            logRepository.save(new LogEntry(message));
            return null;
        });
    }
}
\`\`\`

### 五、事务与连接绑定的底层原理

\`\`\`
ThreadLocal<TransactionInfo>
  └── TransactionSynchronizationManager.resources
      └── Map<DataSource, ConnectionHolder>
          └── Connection（数据库连接绑定到当前线程）

事务开始时：
1. 从DataSource获取Connection
2. 将Connection存入ThreadLocal（key=DataSource）
3. 关闭autoCommit
4. 后续同一个事务内的所有SQL复用这个Connection

事务提交/回滚时：
1. 从ThreadLocal取出Connection
2. commit()/rollback()
3. 恢复autoCommit
4. 归还连接池（如果有的话）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Spring全家桶", "事务", "数据库"]
  },

  {
    title: "Spring Cloud核心组件架构设计",
    content: `## 题目描述

请全面分析Spring Cloud微服务架构的核心组件：

1. 服务发现（Eureka/Nacos/Consul）的CAP权衡与选型
2. 负载均衡（Ribbon/Spring Cloud LoadBalancer）的策略算法
3. 熔断降级（Resilience4j/Sentinel/Hystrix已废弃）的原理与配置
4. 分布式配置中心（Nacos Config/Apollo/Spring Cloud Config）的热更新机制
5. API网关（Spring Cloud Gateway）的路由与过滤链

### 考察点

- CAP定理实践
- 服务治理
- 链路追踪
- 微服务通信模式`,
    solution: `## Spring Cloud架构深度解析

### 一、服务发现选型对比

| 特性 | Eureka | Nacos | Consul |
|------|-------|-------|--------|
| CAP | AP | CP/AP可切换 | CP |
| 协议 | 自研 | Raft/Distro | Raft |
| 健康检查 | Client心跳 | TCP/HTTP/gRPC | TCP/HTTP/gRPC |
| 配置中心 | ❌ | ✅ | ✅ |
| 多数据中心 | 弱支持 | ✅ | ✅ |
| 国产化 | ❌ | ✅（阿里） | ❌ |

**Nacos AP/CP切换**：
\`\`\`bash
# AP模式（默认）：保证可用性和分区容错性
nacos.serverMode=ap

# CP模式：保证一致性和分区容错性（Raft协议）
nacos.serverMode=cp
\`\`\`

### 二、负载均衡策略

\`\`\`java
// Spring Cloud LoadBalancer（替代Ribbon）
@Bean
public ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(
        LoadBalancerClientFactory factory) {
    return new RandomLoadBalancer(factory, "random");  // 随机
    // 其他选项：
    // RoundRobinLoadBalancer  轮询
    // WeightedLoadBalancer    加权
}

// 自定义负载均衡策略
@Component
public class TagBasedLoadBalancer implements ReactiveLoadBalancer<ServiceInstance> {
    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        ServiceInstances instances = getInstance(request);
        // 根据请求Header中的tag筛选实例
        String tag = (String) request.getContext().get("tag");
        return Mono.fromSupplier(() -> {
            List<ServiceInstance> matched = instances.stream()
                .filter(i -> tag.equals(i.getMetadata().get("tag")))
                .collect(Collectors.toList());
            return new Response<>(matched.get(ThreadLocalRandom.nextInt(matched.size())));
        });
    }
}
\`\`\`

### 三、熔断器配置（Resilience4j）

\`\`\`java
// 1. CircuitBreaker（熔断器）
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)           // 失败率超过50%触发熔断
    .slowCallRateThreshold(100)         // 慢调用率100%触发熔断
    .slowCallDurationThreshold(2000)    // 超过2秒算慢调用
    .waitDurationInOpenState(Duration.ofSeconds(10))  // 熔断持续10秒
    .permittedNumberOfCallsInHalfOpenState(5)  // 半开状态允许5次试探
    .slidingWindowType(SlidingWindowType.COUNT_BASED)  // 滑动窗口类型
    .slidingWindowSize(20)             // 窗口大小（最近20次调用）
    .build();

// 2. RateLimiter（限流）
RateLimiterConfig rateLimitConfig = RateLimiterConfig.custom()
    .limitForPeriod(100)                // 每100ms
    .limitRefreshPeriod(Duration.ofMillis(100))
    .timeoutDuration(Duration.ofMillis(50))  // 排队等待时间
    .build();

// 3. Bulkhead（舱壁隔离）
BulkheadConfig bulkheadConfig = BulkheadConfig.custom()
    .maxConcurrentCalls(10)             // 最大并发数
    .maxWaitDuration(Duration.ofSeconds(5))  // 排队等待时间
    .build();

// 4. Retry（重试）
RetryConfig retryConfig = RetryConfig.custom()
    .maxAttempts(3)                    // 最大重试次数
    .waitDuration(Duration.ofMillis(500))  // 重试间隔
    .retryOnResult(response -> response.getStatus() == 503)  // 条件重试
    .retryExceptions(IOException.class, TimeoutException.class)
    .build();

// 使用注解方式
@CircuitBreaker(name = "paymentService", fallbackMethod = "fallback")
@RateLimiter(name = "apiRateLimit")
@Retry(name = "retryPolicy")
public PaymentResult pay(PaymentRequest req) {
    // 业务逻辑
}

public PaymentResult fallback(PaymentRequest req, Exception ex) {
    return PaymentResult.fallback("服务暂时不可用");
}
\`\`\`

### 四、Nacos配置热更新

\`\`\`java
// 1. 引入依赖
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>

// 2. bootstrap.yml（注意是bootstrap不是application）
spring:
  application:
    name: user-service
  cloud:
    nacos:
      server-addr: localhost:8848
      config:
        file-extension: yaml
        shared-configs:
          - data-id: common.yaml
            refresh: true

// 3. 使用@RefreshScope实现热更新
@RestController
@RefreshScope  // ★ 关键注解
public class ConfigController {

    @Value("\${app.timeout:3000}")
    private int timeout;  // 修改Nacos配置后会自动刷新

    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of("timeout", timeout);
    }
}

// 4. 手动监听配置变更
@NacosConfigListener(dataId = "user-service.yaml", groupId = "DEFAULT_GROUP")
public void onConfigChange(ConfigChangeEvent event) {
    String newValue = event.getConfigChange("app.timeout");
    log.info("timeout changed to: {}", newValue);
    // 可以在这里做一些额外的处理逻辑
}
\`\`\`

### 五、Gateway路由配置

\`\`\`yaml
spring:
  cloud:
    gateway:
      routes:
        # 路由到用户服务
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/user/**
            - Header=X-Request-Id, \\d+
            - Method=GET,POST
            - Query=version,1.*
          filters:
            - StripPrefix=2
            - AddRequestHeader=X-Source, Gateway
            - RequestTime=true
            - Retry=3

        # 路由到订单服务（带限流）
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/order/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100
                redis-rate-limiter.burstCapacity: 200
\`\`\`

**自定义全局过滤器**：
\`\`\`java
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (token == null || !jwtUtil.validate(token)) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            DataBuffer buffer = response.bufferFactory().wrap(
                "{\"code\":401,\"msg\":\"未授权\"}".getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }

        // 解析用户信息并传递给下游服务
        UserInfo userInfo = jwtUtil.parse(token);
        exchange.getRequest().mutate()
            .header("X-User-Id", userInfo.getUserId())
            .header("X-User-Role", userInfo.getRole())
            .build();

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -100;  // 优先级最高
    }
}
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Spring全家桶", "微服务", "Spring Cloud"]
  },

  {
    title: "实现简易版IOC容器",
    content: `## 题目描述

请手写一个简化版的Spring IOC容器，要求具备以下功能：

1. 支持@Component、@Autowired、@Value注解
2. 实现单例Bean的生命周期管理
3. 支持简单的依赖注入（构造器注入和字段注入）
4. 解决循环依赖问题（至少支持单例setter注入的循环依赖）

### 功能要求

- Bean定义扫描（指定包路径）
- Bean工厂与ApplicationContext分离
- 支持懒加载
- 输出Bean创建日志

### 考察点

- 反射API
- 设计模式（工厂、单例、观察者）
- 图算法（检测循环依赖）
- 三级缓存思想`,
    solution: `## 简易IOC容器实现

### 完整代码

\`\`\`java
import java.io.File;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// ========== 注解定义 ==========

@interface Component { String value() default ""; }
@interface Autowired { }
@interface Value { String value(); }

// ========== Bean定义 ==========

class BeanDefinition {
    Class<?> clazz;
    String name;
    boolean lazyInit = false;
    Scope scope = Scope.SINGLETON;
    enum Scope { SINGLETON, PROTOTYPE }
}

// ========== IOC容器核心 ==========

public class MiniContainer {
    // 单例池（一级缓存）
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>();

    // 早期Bean引用（二级缓存，解决循环依赖）
    private final Map<String, Object> earlySingletonObjects = new HashMap<>();

    // BeanDefinition注册表
    private final Map<String, BeanDefinition> beanDefinitions = new ConcurrentHashMap<>();

    // 扫描并注册Bean
    public void scan(String basePackage) {
        String path = basePackage.replace('.', '/');
        File dir = new File(getClass().getClassLoader().getResource(path).getFile());

        for (File file : dir.listFiles(f -> f.getName().endsWith(".class"))) {
            String className = basePackage + "." + file.getName().replace(".class", "");
            try {
                Class<?> clazz = Class.forName(className);
                if (clazz.isAnnotationPresent(Component.class)) {
                    Component comp = clazz.getAnnotation(Component.class);
                    String beanName = comp.value().isEmpty() ?
                        lowerFirst(clazz.getSimpleName()) : comp.value();

                    BeanDefinition def = new BeanDefinition();
                    def.clazz = clazz;
                    def.name = beanName;
                    beanDefinitions.put(beanName, def);
                    System.out.println("[SCAN] Registered bean: " + beanName);
                }
            } catch (ClassNotFoundException e) {}
        }
    }

    // 获取Bean（对外入口）
    public <T> T getBean(Class<T> type) {
        String beanName = findBeanName(type);
        return (T) doGetBean(beanName);
    }

    public Object getBean(String name) {
        return doGetBean(name);
    }

    // 核心创建逻辑
    private Object doGetBean(String beanName) {
        // 1. 先查单例池
        Object singleton = singletonObjects.get(beanName);
        if (singleton != null) return singleton;

        // 2. 查早期引用（循环依赖时其他Bean可能从这里取到未完成的Bean）
        if (earlySingletonObjects.containsKey(beanName)) {
            return earlySingletonObjects.get(beanName);
        }

        // 3. 创建Bean
        BeanDefinition def = beanDefinitions.get(beanName);
        if (def == null) throw new RuntimeException("No such bean: " + beanName);

        return createBean(def);
    }

    private Object createBean(BeanDefinition def) {
        Class<?> clazz = def.clazz;

        try {
            // 1. 实例化（通过无参构造器）
            Object instance = clazz.getDeclaredConstructor().newInstance();
            System.out.println("[CREATE] Instance created: " + def.name);

            // 2. 放入早期引用（解决循环依赖的关键！）
            earlySingletonObjects.put(def.name, instance);

            // 3. 属性注入（@Autowired字段注入）
            autowireFields(instance);

            // 4. 移入单例池
            singletonObjects.put(def.name, instance);
            earlySingletonObjects.remove(def.name);

            System.out.println("[READY] Bean initialized: " + def.name);
            return instance;

        } catch (Exception e) {
            throw new RuntimeException("Failed to create bean: " + def.name, e);
        }
    }

    private void autowireFields(Object instance) {
        Class<?> clazz = instance.getClass();
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                field.setAccessible(true);
                Object dependency = getBean(field.getType());  // 递归获取依赖
                try {
                    field.set(instance, dependency);
                    System.out.println("[INJECT] " + clazz.getSimpleName()
                        + "." + field.getName() + " <- "
                        + field.getType().getSimpleName());
                } catch (IllegalAccessException e) {}
            }
            else if (field.isAnnotationPresent(Value.class)) {
                Value valueAnno = field.getAnnotation(Value.class);
                field.setAccessible(true);
                try {
                    // 简化处理：直接设置字符串值
                    Object val = convert(valueAnno.value(), field.getType());
                    field.set(instance, val);
                } catch (IllegalAccessException e) {}
            }
        }
    }

    private Object convert(String value, Class<?> type) {
        if (type == String.class) return value;
        if (type == int.class || type == Integer.class) return Integer.parseInt(value);
        if (type == long.class || type == Long.class) return Long.parseLong(value);
        if (type == boolean.class || type == Boolean.class) return Boolean.parseBoolean(value);
        return value;
    }

    private String findBeanName(Class<?> type) {
        return beanDefinitions.values().stream()
            .filter(d -> d.clazz == type)
            .findFirst()
            .map(d -> d.name)
            .orElseThrow(() -> new RuntimeException("No bean of type: " + type));
    }

    private String lowerFirst(String str) {
        return Character.toLowerCase(str.charAt(0)) + str.substring(1);
    }

    // 打印所有Bean
    public void printBeans() {
        System.out.println("\\n=== Container Beans ===");
        singletonObjects.forEach((k, v) ->
            System.out.println(k + " : " + v.getClass().getName()));
    }
}

// ========== 测试 ==========

// 定义测试Bean
@Component
class Repository {
    public String query() { return "data from DB"; }
}

@Component
class Service {
    @Autowired
    private Repository repo;

    @Value("\${app.name:MiniApp}")
    private String appName;

    public String doBusiness() {
        return appName + ": " + repo.query();
    }
}

@Component
class Controller {
    @Autowired
    private Service service;

    public String handle() {
        return service.doBusiness();
    }
}

// 主程序
public class MiniIocDemo {
    public static void main(String[] args) {
        MiniContainer container = new MiniContainer();
        container.scan("com.example.demo.beans");

        Controller controller = container.getBean(Controller.class);
        System.out.println("\\nResult: " + controller.handle());

        container.printBeans();
    }
}
\`\`\`

**输出结果**：
\`\`\`
[SCAN] Registered bean: repository
[SCAN] Registered bean: service
[SCAN] Registered bean: controller
[CREATE] Instance created: controller
[CREATE] Instance created: service
[CREATE] Instance created: repository
[INJECT] Service.repo <- Repository
[INJECT] Controller.service <- Service
[READY] Bean initialized: repository
[READY] Bean initialized: service
[READY] Bean initialized: controller

Result: MiniApp: data from DB

=== Container Beans ===
controller : com.example.demo.beans.Controller
service : com.example.demo.beans.Service
repository : com.example.demo.beans.Repository
\`\`\``,
    difficulty: "hard",
    questionType: "code",
    tags: ["Spring全家桶", "IOC", "设计模式"],
    codeTemplate: {
      java: `import java.io.*;\nimport java.lang.reflect.*;\nimport java.util.*;\n\npublic class MiniContainer {\n    private final Map<String, Object> beans = new ConcurrentHashMap<>();\n    private final Map<String, Class<?>> definitions = new ConcurrentHashMap<>();\n\n    /**\n     * 扫描指定包下的组件\n     */\n    public void scan(String basePackage) {\n        // TODO: 扫描.class文件，识别@Component注解\n    }\n\n    /**\n     * 获取Bean实例\n     */\n    public <T> T getBean(Class<T> type) {\n        // TODO: 实现依赖注入逻辑\n        return null;\n    }\n}`
    }
  },

  // ==================== MySQL 深入 (101-125) ====================
  {
    title: "InnoDB存储引擎架构与B+树索引实现",
    content: `## 题目描述

请深入分析InnoDB存储引擎的内部架构：

1. InnoDB的内存架构（Buffer Pool、Change Buffer、Log Buffer等）
2. InnoDB的磁盘架构（表空间、段、区、页）
3. B+树索引的数据结构及在MySQL中的具体实现
4. 聚簇索引与非聚簇索引(二级索引)的区别与回表操作
5. 分析一条SQL查询从客户端到存储引擎的完整执行路径`,
    solution: `## InnoDB架构深度解析

### 一、内存架构

\`\`\`
┌─────────────────────────────────────────────┐
│                InnoDB 内存                   │
│  ┌───────────┐ ┌──────────────┐ ┌─────────┐ │
│  │Buffer Pool │ │ Change Buffer│ │Log Buf  │ │
│  │ (数据页缓存)│ │ (变更缓冲)   │ │(Redo Log)│ │
│  │  默认物理内存│ │ 非唯一索引   │ │         │ │
│  │  的25%-75% │ │ 的DML操作   │ │         │ │
│  └─────┬─────┘ └──────┬───────┘ └────┬────┘ │
│        │              │               │       │
│  ┌─────▼──────────────▼───────────────▼─────┐ │
│  │           Adaptive Hash Index          │ │
│  │          (自适应哈希索引)               │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
\`\`\`

**Buffer Pool详解**：
- 数据页大小：16KB（默认）
- LRU算法：改进版LRU（区分young区和old区，避免预读污染）
- Flush List：脏页链表（Checkpoint时刷盘）

### 二、磁盘架构

\`\`\`
Tablespace (表空间)
├── Segment (段) - 如数据段、索引段
│   └── Extent (区) - 1MB = 64个连续页
│       └── Page (页) - 16KB
│           ├── Data Page (数据页)
│           ├── Index Page (索引页)
│           ├── Undo Page (Undo日志页)
│           ├── Insert Buffer Page
│           └── System Page (系统信息)
\`\`\`

### 三、B+树索引结构

\`\`\`
                    [50, 100]
                   /    |      \\
            [10,30]  [60,80] [120,150]
           / | \\     / | \\      / | \\
        [1][5][15] [55][65][85] [110][130][140]

特点：
1. 所有数据都在叶子节点
2. 叶子节点通过双向链表连接（范围查询高效）
3. 非叶子节点只存索引键值和子节点指针
4. 叶子节点存完整行数据（聚簇索引）或主键值（二级索引）
\`\`\`

**MySQL中B+树的参数**：
- 页大小：16KB
- 非叶子节点：一个指针6字节 + 键8字节 = 14字节
- 一页可存：16KB/14B ≈ 1170个指针 → 1170叉树
- 3层B+树可存：1170^3 ≈ **16亿**条记录！
- 所以通常B+树高度为**3-4层**

### 四、聚簇索引 vs 二级索引

\`\`\`
CREATE TABLE user (
    id INT PRIMARY KEY,        ← 聚簇索引（按id排序存储）
    name VARCHAR(32),
    age INT,
    INDEX idx_name (name)     ← 二级索引
);

-- 聚簇索引B+树（叶子节点存完整行数据）
[id=1, name='张三', age=25]
[id=2, name='李四', age=30]

-- 二级索引idx_name B+树（叶子节点存主键值）
[name='张三'] → id=1
[name='李四'] → id=2
\`\`\`

**回表过程**：
\`\`\`sql
SELECT * FROM user WHERE name = '张三';
-- 1. 在idx_name索引树上查找 '张三'
-- 2. 找到叶子节点：[name='张三', id=1]
-- 3. 根据id=1回表到聚簇索引
-- 4. 在聚簇索引上找到完整行数据
-- 共2次索引查找！

-- 覆盖索引优化（避免回表）
SELECT id, name FROM user WHERE name = '张三';
-- idx_name已包含id和name，无需回表！
\`\`\`

### 五、SQL执行路径

\`\`\`
Client → Connector → SQL Interface
  ↓
Parser (词法分析+语法分析)
  ↓
Preprocessor (语义检查 + 权限验证)
  ↓
Query Optimizer (查询优化器)
  ├── 逻辑优化：谓词下推、子查询优化、外连接消除
  └── 物理优化：选择索引、决定JOIN顺序
  ↓
Query Execution Engine
  ↓
Storage Engine (InnoDB)
  ├── 检查缓存(Buffer Pool)
  ├── 若未命中则读取磁盘
  └── 返回结果
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["MySQL深入", "索引", "存储引擎"]
  },

  {
    title: "MVCC多版本并发控制实现原理",
    content: `## 题目描述

请深入分析MySQL InnoDB的MVCC机制：

1. MVCC的核心思想：如何实现读写不阻塞？
2. Undo Log版本链的构建过程
3. Read View（读视图）的可见性判断算法
4. RC（Read Committed）和RR（Repeatable Read）隔离级别的MVCC差异
5. 当前读 vs 快照读的实现区别

### 考察点

- 事务ID分配
- 隐藏字段(DB_TRX_ID, DB_ROLL_PTR)
- 版本链遍历
- 幻读问题`,
    solution: `## MVCC深度解析

### 一、核心思想

MVCC (Multi-Version Concurrency Control)：通过维护数据的多个版本，使得读写操作没有冲突。

**解决的问题**：
- 读操作不加锁（提高并发度）
- 写操作不影响读（非阻塞读）
- 不同事务看到不同版本的数据

### 二、隐藏字段

每行记录除了用户定义的字段外，还有隐藏字段：

\`\`\`
DB_ROW_ID: 行ID（无主键时自动生成）
DB_TRX_ID: 最后修改该行的事务ID
DB_ROLL_PTR: 回滚指针（指向上一个版本）
DB_FIELD_ID: 动态长度列表偏移量
\`\`\`

### 三、Undo Log版本链示例

\`\`\`
初始状态：
| id | name | DB_TRX_ID | DB_ROLL_PTR |
|----|------|-----------|-------------|
| 1  | A    | NULL      | NULL        |

事务1(TxID=100): UPDATE SET name='B' WHERE id=1
→ 将原版本拷贝到Undo Log
→ 更新当前行的TRX_ID=100, ROLL_PTR指向Undo Log

状态变化：
当前行: [1, 'B', TRX_ID=100, ROLL_PTR→Undo1]
Undo1:  [1, 'A', TRX_ID=NULL, ROLL_PTR=NULL]  ← 原始版本

事务2(TxID=200): UPDATE SET name='C' WHERE id=1
→ 再拷贝当前版本到Undo Log
→ 更新当前行

最终状态：
当前行: [1, 'C', TRX_ID=200, ROLL_PTR→Undo2]
Undo2:  [1, 'B', TRX_ID=100, ROLL_PTR→Undo1]
Undo1:  [1, 'A', TRX_ID=NULL, ROLL_PTR=NULL]

这就是**版本链**！通过ROLL_PTR可以找到历史所有版本。
\`\`\`

### 四、Read View（读视图）

当事务发起快照读时，会创建一个Read View：

\`\`\`java
class ReadView {
    long m_ids[];      // 活跃事务ID列表（生成RV时未提交的事务）
    long min_trx_id;   // 最小活跃事务ID
    long max_trx_id;   // 下一个将被分配的事务ID（即m_ids中的最大值+1）
    long creator_trx_id; // 创建该Read View的事务ID
}
\`\`\`

### 五、可见性判断算法

对于某一行数据，判断其对当前事务是否可见：

\`\`\`
可见性判断规则：
1. 如果 DB_TRX_ID < min_trx_id → 可见（事务在RV创建前已提交）
2. 如果 DB_TRX_ID == creator_trx_id → 可见（自己修改的）
3. 如果 DB_TRX_ID ∈ m_ids → 不可见（事务仍在运行）
4. 如果 DB_TRX_ID >= max_trx_id → 不可见（事务在RV创建后开始）
5. 其他情况 → 通过Undo Log版本链逐个检查历史版本
\`\`\`

### 六、RC vs RR的差异

| 特性 | RC (Read Committed) | RR (Repeatable Read) |
|------|-------------------|---------------------|
| 快照时机 | **每次SELECT都生成新的Read View** | 只在**第一次SELECT**时生成Read View |
| 读一致性 | 语句级别 | 事务级别 |
| 幻读问题 | 可能出现幻读 | 通过Next-Key Lock防止幻读 |

**RC示例**：
\`\`\`sql
-- T1: SELECT * FROM t WHERE id > 1;  -- RV1: [2,3]
-- T2: INSERT INTO t VALUES(4); COMMIT;
-- T1: SELECT * FROM t WHERE id > 1;  -- RV2: [2,3,4] ← 看到了新插入的行！

-- RR示例：
-- T1: BEGIN; SELECT * FROM t WHERE id > 1;  -- RV: [2,3]
-- T2: INSERT INTO t VALUES(4); COMMIT;
-- T1: SELECT * FROM t WHERE id > 1;  -- 还是[2,3]! 使用同一个RV
\`\`\`

### 七、当前读 vs 快照读

\`\`\`
快照读(Snapshot Read):
- 普通SELECT（不加锁）
- 基于MVCC + Read View + Undo Log
- 不加锁，可能读到历史版本

当前读(Current Read):
- SELECT ... LOCK IN SHARE MODE
- SELECT ... FOR UPDATE
- 加锁读取最新数据（会等待其他事务释放锁）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["MySQL深入", "MVCC", "事务"]
  },

  {
    title: "MySQL锁机制与死锁检测分析",
    content: `## 题目描述

请全面分析MySQL InnoDB的锁机制：

1. 全局锁、表级锁、行级锁的类型与使用场景
2. 共享锁(S锁)、排他锁(X锁)、意向锁(IS/IX)的兼容矩阵
3. Record Lock、Gap Lock、Next-Key Lock的区别与应用
4. 如何分析死锁？给出一个典型的死锁案例及解决方案
5. MySQL 8.0的SKIP LOCKED和NOWAIT特性

### 考察点

- 锁粒度权衡
- 间隙锁与幻读
- 死锁预防策略
- 锁升级问题`,
    solution: `## MySQL锁机制深度解析

### 一、锁的分类

\`\`\`
全局锁:
  FLUSH TABLES WITH READ LOCK (FTWRL)
  → 整个数据库实例只读
  → 用于全库备份（mysqldump --single-transaction更好）

表级锁:
  表共享读锁 (READ LOCAL)
  表独占写锁 (WRITE)
  → MyISAM引擎主要用表锁
  → InnoDB很少用表锁（除非显式LOCK TABLES）

行级锁 (InnoDB):
  Record Lock (记录锁)
  Gap Lock (间隙锁)
  Next-Key Lock (记录+间隙)
  → 粒度最小，并发度最高
\`\`\`

### 二、锁兼容矩阵

\`\`\`
        X      IX     S      IS     -
X(排他)  ✗      ✗      ✗      ✗     ✓
IX(意向排他)✗     ✓      ✗      ✓     ✓
S(共享)   ✗      ✗      ✓      ✓     ✓
IS(意向共享)✗     ✓      ✓      ✓     ✓
-(无锁)   ✓      ✓      ✓      ✓     ✓
\`\`\`

**意向锁的作用**：快速判断表中是否有行锁被持有，无需逐行检查。

### 三、行锁的三种类型

#### 1. Record Lock（记录锁）

锁定索引记录本身。

\`\`\`sql
-- id是主键索引
SELECT * FROM t WHERE id = 7 FOR UPDATE;
-- 只对 id=7 这一条记录加X锁
\`\`\`

#### 2. Gap Lock（间隙锁）

锁定索引记录之间的间隙，防止其他事务在此间隙插入新记录。

\`\`\`sql
-- id有值 1, 5, 10
SELECT * FROM t WHERE id = 7 FOR UPDATE;
-- id=7不存在！但会对 (5, 10) 这个间隙加Gap Lock
-- 其他事务无法INSERT id=6,7,8,9
\`\`\`

#### 3. Next-Key Lock（临键锁）

Record Lock + Gap Lock的组合，锁定记录及其前方的间隙。

\`\`\`sql
-- 默认情况下，RR隔离级别使用Next-Key Lock
SELECT * FROM t WHERE id >= 7 AND id <= 10 FOR UPDATE;
-- 对以下范围加锁：
-- [7的Record Lock] + [(7,10)的Gap Lock] + [10的Record Lock] + [(10,+∞)的Gap Lock]
\`\`\`

**锁降级规则**（MySQL 8.0优化）：
- 唯一索引上的等值查询 → 退化为Record Lock（不需要Gap Lock）
- 非唯一索引上的等值查询 → Next-Key Lock
- 范围查询 → 始终使用Next-Key Lock

### 四、死锁案例与分析

**经典死锁场景**：

\`\`\`sql
-- 表结构：t(id PK, name, idx_name(name))

-- 事务1:                          -- 事务2:
BEGIN;                              BEGIN;
UPDATE t SET name='A' WHERE id=1;  UPDATE t SET name='B' WHERE id=2;
-- 持有id=1的X锁                   -- 持有id=2的X锁
UPDATE t SET name='C' WHERE id=2;  UPDATE t SET name='D' WHERE id=1;
-- 等待id=2的X锁 ← 死锁！         -- 等待id=1的X锁

-- MySQL检测到死锁，回滚"代价较小"的事务
\`\`\`

**死锁日志分析**：
\`\`\`
LATEST DETECTED DEADLOCK
------------------------
2024-01-15 10:30:00 0x7f123456
*** (1) TRANSACTION:
TRANSACTION 1000, ACTIVE 5 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 3 lock struct(s), heap size 1160, 2 row lock(s)
MySQL thread id 50, OS thread handle 0xabc, query id 200
UPDATE t SET name='C' WHERE id=2
*** (1) HOLDING LOCKS:
RECORD LOCKS space id 58 page no 3 n bits 72 idx PRIMARY of table \`test\`.\`t\`
trx id 1000 lock_mode X locks rec but not gap
Record lock, heap no 2 PHYSICAL RECORD: n_fields 3; ...

*** (2) TRANSACTION:
TRANSACTION 1001, ACTIVE 3 sec
UPDATE t SET name='D' WHERE id=1
*** (2) HOLDING LOCKS:
...

WE ROLL BACK TRANSACTION (1)
\`\`\`

**解决方案**：

\`\`\`sql
-- 方案1：固定访问顺序（所有事务按相同顺序获取锁）
-- 方案2：降低隔离级别为RC（减少Gap Lock）
-- 方案3：缩短事务长度，尽快提交
-- 方案4：添加合理索引（避免全表扫描导致大量锁）
-- 方案5：设置innodb_lock_wait_timeout超时时间
\`\`\`

### 五、MySQL 8.0新特性

\`\`\`sql
-- SKIP LOCKED: 跳过被锁定的行
SELECT * FROM orders FOR UPDATE SKIP LOCKED;

-- NOWAIT: 不等待锁，立即返回错误
SELECT * FROM orders FOR UPDATE NOWAIT;

-- 应用场景：队列消费（多个消费者竞争同一批消息时，
-- SKIP LOCKED让不同消费者处理不同的消息）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["MySQL深入", "锁", "并发"]
  },

  {
    title: "实现简易版数据库连接池",
    content: `## 题目描述

请手写一个数据库连接池，要求具备以下功能：

1. 初始化指定数量的连接（最小连接数/最大连接数）
2. 获取连接（borrow）与归还连接（return）
3. 连接有效性检测与自动回收
4. 空闲连接超时回收机制
5. 等待超时策略（阻塞等待/立即返回null）

### 功能要求

- 线程安全（多线程并发获取连接）
- 支持配置参数（minPoolSize/maxPoolSize/connectionTimeout等）
- 统计信息（活跃连接数/空闲连接数/总请求数）
- 异常连接自动剔除

### 考察点

- 对象池模式
- CountDownLatch/Semaphore
- 守护线程设计
- Proxy代理模式`,
    solution: `## 数据库连接池完整实现

### 核心代码

\`\`\`java
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ConnectionPool {
    private final BlockingQueue<PooledConnection> idleConnections;
    private final Set<PooledConnection> activeConnections = ConcurrentHashMap.newKeySet();
    private final AtomicInteger totalCreated = new AtomicInteger(0);

    // 配置参数
    private final int minPoolSize;
    private final int maxPoolSize;
    private final long connectionTimeoutMs;
    private final long idleTimeoutMs;
    private final String jdbcUrl;
    private final String username;
    private final String password;

    // 守护线程
    private ScheduledExecutorService cleaner;

    public ConnectionPool(String url, String user, String pass,
                           int minSize, int maxSize) {
        this.jdbcUrl = url;
        this.username = user;
        this.password = pass;
        this.minPoolSize = minSize;
        this.maxPoolSize = maxSize;
        this.connectionTimeoutMs = 30000;
        this.idleTimeoutMs = 300000; // 5分钟
        this.idleConnections = new LinkedBlockingQueue<>(maxSize);

        // 初始化最小连接数
        for (int i = 0; i < minPoolSize; i++) {
            try {
                PooledConnection conn = createConnection();
                idleConnections.offer(conn);
            } catch (SQLException e) {}
        }

        // 启动守护线程
        startCleaner();
    }

    public Connection getConnection() throws SQLException {
        // 1. 尝试从空闲队列获取
        PooledConnection conn = idleConnections.poll();

        if (conn != null) {
            if (conn.isValid(1)) {  // 快速验证
                activeConnections.add(conn);
                return conn.getProxyConnection();
            } else {
                // 无效连接，递归重试
                return getConnection();
            }
        }

        // 2. 空闲队列为空，检查是否可以创建新连接
        if (totalCreated.get() < maxPoolSize) {
            synchronized (this) {
                if (totalCreated.get() < maxPoolSize) {
                    try {
                        conn = createConnection();
                        activeConnections.add(conn);
                        return conn.getProxyConnection();
                    } catch (SQLException e) {}
                }
            }
        }

        // 3. 等待其他连接归还
        try {
            conn = idleConnections.poll(connectionTimeoutMs, TimeUnit.MILLISECONDS);
            if (conn != null && conn.isValid(1)) {
                activeConnections.add(conn);
                return conn.getProxyConnection();
            }
        } catch (InterruptedException e) {}

        throw new SQLException("Connection pool exhausted");
    }

    public void returnConnection(PooledConnection conn) {
        if (conn == null) return;

        activeConnections.remove(conn);

        if (conn.isClosed() || !conn.isValid(1)) {
            totalCreated.decrementAndGet();  // 无效连接不归还
        } else {
            conn.setLastUsedTime(System.currentTimeMillis());
            if (!idleConnections.offer(conn)) {
                // 队列已满，直接关闭
                closeConnection(conn);
                totalCreated.decrementAndGet();
            }
        }
    }

    private PooledConnection createConnection() throws SQLException {
        Connection rawConn = DriverManager.getConnection(jdbcUrl, username, password);
        totalCreated.incrementAndGet();
        return new PooledConnection(rawConn);
    }

    private void closeConnection(PooledConnection conn) {
        try { conn.close(); } catch (SQLException e) {}
    }

    private void startCleaner() {
        cleaner = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "ConnectionCleaner");
            t.setDaemon(true);
            return t;
        });

        cleaner.scheduleAtFixedRate(() -> evictIdleConnections(),
            60000, 60000, TimeUnit.MILLISECONDS);  // 每60秒检查一次
    }

    private void evictIdleConnections() {
        List<PooledConnection> toEvict = new ArrayList<>();

        for (PooledConnection conn : idleConnections) {
            if (System.currentTimeMillis() - conn.getLastUsedTime() > idleTimeoutMs) {
                toEvict.add(conn);
            }
        }

        for (PooledConnection conn : toEvict) {
            if (idleConnections.remove(conn)) {
                closeConnection(conn);
                totalCreated.decrementAndGet();
            }
        }

        // 补充到最小连接数
        while (totalCreated.get() < minPoolSize + idleConnections.size()) {
            try {
                idleConnections.offer(createConnection());
            } catch (SQLException e) { break; }
        }
    }

    // ========== 统计信息 ==========
    public int getActiveCount() { return activeConnections.size(); }
    public int getIdleCount() { return idleConnections.size(); }
    public int getTotalCreated() { return totalCreated.get(); }

    // ========== 内部类 ==========
    class PooledConnection implements InvocationHandler {
        private final Connection realConnection;
        private volatile long lastUsedTime = System.currentTimeMillis();

        PooledConnection(Connection real) { this.realConnection = real; }

        Connection getProxyConnection() {
            return (Connection) Proxy.newProxyInstance(
                realConnection.getClass().getClassLoader(),
                new Class[]{Connection.class},
                this);
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args)
                throws Throwable {
            if (method.getName().equals("close")) {
                // close()不是真正关闭，而是归还连接池
                returnConnection(this);
                return null;  // Connection.close()返回void
            }
            if (method.getName().equals("isClosed")) {
                return false;  // 对外始终是"未关闭"
            }
            return method.invoke(realConnection, args);
        }

        boolean isClosed() throws SQLException { return realConnection.isClosed(); }
        boolean isValid(int timeout) throws SQLException { return realConnection.isValid(timeout); }
        void close() throws SQLException { realConnection.close(); }
        long getLastUsedTime() { return lastUsedTime; }
        void setLastUsedTime(long time) { this.lastUsedTime = time; }
    }
}
\`\`\`

### 使用示例

\`\`\`java
public class PoolDemo {
    public static void main(String[] args) throws Exception {
        ConnectionPool pool = new ConnectionPool(
            "jdbc:mysql://localhost:3306/test", "root", "password",
            5, 20);  // 最小5个，最大20个

        // 多线程测试
        ExecutorService executor = Executors.newFixedThreadPool(10);
        for (int i = 0; i < 50; i++) {
            executor.submit(() -> {
                try (Connection conn = pool.getConnection()) {
                    Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery("SELECT 1");
                    rs.next();
                    System.out.println(Thread.currentThread().getName()
                        + ": active=" + pool.getActiveCount()
                        + ", idle=" + pool.getIdleCount());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
\`\`\``,
    difficulty: "medium",
    questionType: "code",
    tags: ["MySQL深入", "连接池", "设计模式"],
    codeTemplate: {
      java: `import java.sql.*;\nimport java.util.*;\nimport java.util.concurrent.*;\n\npublic class ConnectionPool {\n    private final Queue<Connection> idlePool;\n    private final Set<Connection> activePool;\n\n    /**\n     * 从连接池获取连接\n     */\n    public Connection getConnection(long timeoutMs) throws SQLException {\n        // TODO: 实现连接获取逻辑\n        return null;\n    }\n\n    /**\n     * 归还连接到连接池\n     */\n    public void releaseConnection(Connection conn) {\n        // TODO: 实现连接归还逻辑\n    }\n}`
    }
  },

  // ==================== Redis 深入 (126-150) ====================
  {
    title: "Redis持久化RDB与AOF原理及数据恢复",
    content: `## 题目描述

请深入分析Redis的两种持久化机制：

1. RDB快照的工作原理、触发方式、文件格式
2. AOF日志的写入流程、刷盘策略（always/everysec/no）
3. RDB vs AOF的性能影响与恢复速度对比
4. Redis 4.0+的混合持久化(RDB+AOF)原理与配置
5. 数据损坏时的修复工具redis-check-aof的使用方法

### 考察点

- fork() COW机制
- bgrewriteaof重写
- AOF重写优化
- 数据一致性权衡`,
    solution: `## Redis持久化深度解析

### 一、RDB快照

**触发方式**：

\`\`\`bash
# 1. 手动触发
SAVE          # 同步阻塞（不推荐）
BGSAVE        # 异步fork子进程（推荐）

# 2. 自动触发（满足任一条件）
save 900 1    # 900秒内至少1次修改
save 300 10   # 300秒内至少10次修改
save 60 10000 # 60秒内至少10000次修改
\`\`\`

**执行流程**：
\`\`\`
Redis主进程 fork() 子进程
    ↓ (COW写时复制)
子进程遍历内存，写入临时文件 (.rdb)
    ↓ 写入完成
替换旧的.rdb文件
    ↓
子进程退出
\`\`\`

**RDB文件格式**（二进制格式）：
\`\`\`
REDIS0009           # 魔数 + 版本号
FE00                 # FE表示数据库开始，00表示db0
FD$length            # 字典长度
key1
value1              # 字符串类型
...
FF                   # 文件结束标记
8-byte checksum       # CRC64校验和
\`\`\`

**优点**：文件紧凑、恢复速度快
**缺点**：可能丢失最后一次快照后的数据、fork时内存翻倍

### 二、AOF日志

**工作原理**：记录每个写操作命令（类似binlog）

\`\`\`bash
# 配置项
appendonly yes                  # 开启AOF
appendfilename "appendonly.aof" # 文件名
appendfsync everysec           # 刷盘策略

# 三种刷盘策略：
appendfsync always    # 每条命令都fsync → 最安全但最慢
appendfsync everysec  # 每秒fsync一次 → 折中（推荐）
appendfsync no        # 由OS决定 → 最快但可能丢失1s数据
\`\`\`

**AOF文件内容示例**：
\`\`\`
*2                     # 参数数量=2
$6                     # 第一个参数长度=6
SELECT                 # 命令
$1                     # 第二个参数长度=1
0                      # 参数值

*3
$3
SET
$4
name
$6
zhangsan
\`\`\`

### 三、AOF重写（bgrewriteaof）

**问题**：AOF文件会越来越大（包含冗余命令）

**解决**：bgrewriteaof压缩AOF文件

\`\`\`
原始AOF（500MB）：
SET name zhangsan
SET name lisi
SET name wangwu
INCR age
INCR age
INCR age
... (很多中间状态)

重写后AOF（50MB）：只保留最终状态
SET name wangwu
SET age 3
\`\`\`

**重写流程**：
\`\`\`
1. Redis fork() 子进程
2. 子进程遍历当前内存数据，生成新的AOF命令序列
3. 重写期间的新写操作追加到AOF重写缓冲区
4. 子进程完成后，将缓冲区内容追加到新AOF文件
5. 原子性地替换旧AOF文件
\`\`\`

### 四、混合持久化（Redis 4.0+）

\`\`\`bash
aof-use-rdb-preamble yes  # 开启混合持久化
\`\`\`

**原理**：
\`\`\`
混合AOF文件结构：
┌─────────────┬──────────────────┐
│ RDB 格式部分 │ AOF 增量部分     │
│ (全量数据)   │ (重写期间新增命令) │
└─────────────┴──────────────────┘

优点：
- RDB部分加载快（二进制格式紧凑）
- AOF部分保证最新数据不丢失
- 结合两者优势
\`\`\`

### 五、三种方案对比

| 特性 | RDB | AOF | 混合持久化 |
|------|-----|-----|----------|
| 文件大小 | 小 | 大 | 中 |
| 恢复速度 | 快 | 慢 | 较快 |
| 数据安全性 | 可能丢数据 | 最好（always） | 好 |
| CPU开销 | fork时高 | always时高 | 中等 |
| IO压力 | 低 | 高 | 中 |

### 六、AOF修复

\`\`\`bash
# 当AOF文件损坏时
redis-check-aof appendonly.aof --fix
# 会提示是否修复，选择y进行修复
# 修复原理：尝试识别并跳过无效的命令
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Redis深入", "持久化", "数据恢复"]
  },

  {
    title: "Redis Cluster数据分布与故障转移",
    content: `## 题目描述

请深入分析Redis Cluster的架构设计：

1. Redis Cluster的槽位(Slot)分配机制（16384个槽的原因）
2. 数据分片算法与MOVED/ASK重定向机制
3. 主从复制与故障检测(Gossip协议)和自动故障转移
4. 集群扩容/缩容的流程（resharding）
5. 与Sentinel哨兵模式的区别及选型建议

### 考察点

- 一致性哈希
- Gossip协议
- Raft/Paxos简化版
- CAP权衡`,
    solution: `## Redis Cluster深度解析

### 一、槽位分配机制

\`\`\`
Redis Cluster将数据分散到16384个槽位(slot)
每个节点负责一部分slot
key通过CRC16(key) % 16384 计算所属slot

为什么是16384？
1. 槽位信息通过Gossip协议传播，每个节点需要存储所有slot→node的映射
   - 16384个slot × 1字节/slot = 2KB（心跳包中携带）
   - 如果用65536个slot = 8KB，心跳包太大
2. 一个集群最多1000个主节点（官方推荐上限）
3. 16384是个折中值：既不太大（通信开销）也不太小（数据分布均匀）

槽位分布示例：
Node A: slot 0-5460    (5461个)
Node B: slot 5461-10922 (5462个)
Node C: slot 10923-16383(5461个)
\`\`\`

### 二、重定向机制

**MOVED重定向**：
\`\`\`bash
# 客户端向Node-A请求key="name"
# Node-A计算 CRC16("name")%16384 = 5798 → 属于Node-B
> GET name
-> MOVED 5798 127.0.0.1:6381  # 告诉客户端：这个slot在Node-B

# 客户端需要缓存slot→node映射，后续直接访问正确的节点
\`\`\`

**ASK重定向**：
\`\`\`bash
# 正在迁移过程中时使用
> GET name
-> ASK 5798 127.0.0.1:6381

# 区别：MOVED表示永久迁移完成，客户端应更新本地缓存
#       ASK表示临时重定向，客户端只对本次请求重定向
\`\`\`

### 三、故障检测与转移

**Gossip协议传播状态**：

\`\`\`
每个节点定期(ping_interval=1s)随机选择几个节点发送PING
收到PONG后更新对方的状态信息
通过多个周期的信息交换，最终所有节点都知道整个集群的状态

故障判定：
1. Node-A发现Node-B无响应(PFAIL - 可能下线)
2. Node-A将PFAIL状态通过Gossip传播给其他节点
3. 当半数以上主节点认为Node-B下线 → 标记为FAIL
4. 触发故障转移：从Node-B的从节点中选举新的主节点
\`\`\`

**故障转移流程**：
\`\`\`
1. 从节点发现主节点FAIL
2. 各从节点发起选举（类似Raft）
3. 获得多数票的从节点成为新主节点
4. 新主节点撤销旧主节点的slot负责权
5. 通知全集群拓扑变更
\`\`\`

### 四、集群扩容流程

\`\`\`bash
# 1. 添加新节点
redis-cli --cluster add-node new_node_ip:port existing_node_ip:port

# 2. 迁移槽位（resharding）
redis-cli --cluster reshard target_node_ip:port
# 输入要迁移的slot数量（如4096个）
# 输入接收slot的目标节点ID
# 输入来源节点ID（all表示从所有节点均匀抽取）

# 迁移过程：
# a. 源节点对目标slot执行MIGRATE命令（原子操作）
# b. 将slot中的key逐一迁移到目标节点
# c. 迁移完成后更新slot→node映射
# d. 客户端收到MOVED重定向后更新本地缓存
\`\`\`

### 五、Cluster vs Sentinel对比

| 特性 | Redis Cluster | Sentinel |
|------|--------------|----------|
| 架构 | 去中心化（P2P） | 中心化（Sentinel监控） |
| 数据分片 | ✅ 自动分片 | ❌ 单机 |
| 容量扩展 | ✅ 水平扩展 | ❌ 垂直扩展 |
| 最大内存 | TB级（取决于节点数） | 单机限制 |
| 复杂度 | 高（运维复杂） | 低 |
| 适用场景 | 大数据量、高并发 | 小规模、高可用`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Redis深入", "Cluster", "高可用"]
  },

  // ==================== 分布式系统 (151-180) ====================
  {
    title: "CAP定理与BASE理论在分布式系统中的应用",
    content: `## 题目描述

请深入分析分布式系统的一致性理论：

1. CAP定理的严格定义：一致性(C)、可用性(A)、分区容错性(P)的含义
2. 为什么CP和AP是真正的权衡？BASE理论如何弥补CAP的不足？
3. 分析以下系统的CAP取舍：ZooKeeper(CP)、Eureka(AP)、Etcd(CP)、Nacos(CP/AP切换)
4. 最终一致性(Eventual Consistency)的实现方案（向量时钟、CRDT、版本向量）
5. 设计一个支持最终一致性的分布式计数器

### 考察点

- 分布式系统理论
- 一致性模型分类
- 网络分区场景处理
- 工程实践权衡`,
    solution: `## CAP与BASE理论深度解析

### 一、CAP定理详解

**C (Consistency) 强一致性**：
- 所有节点在同一时间看到相同的数据
- 类似于单机的ACID事务语义
- 要求：写操作完成后，任何后续读操作都能读到最新值

**A (Availability) 高可用性**：
- 每个请求都能收到（成功或失败的）响应
- 不保证响应的是最新数据
- 但保证服务不挂（不无限等待）

**P (Partition Tolerance) 分区容错性**：
- 系统在网络分区的情况下仍能继续运行
- 分布式系统中P是必须面对的现实（网络不可靠）

**核心结论**：在发生网络分区时，只能在C和A之间二选一！

\`\`\`
正常情况（无分区）：可以同时满足C、A、P
网络分区发生时：
├─ 选择CP：牺牲可用性，拒绝部分请求以保证一致性
│  例：ZooKeeper leader宕机期间，集群不可用
└─ 选择AP：牺牲一致性，接受可能读到旧数据
   例：Eureka节点间网络不通时，仍返回本地注册表
\`\`\`

### 二、BASE理论

\`\`\`
BASE = Basically Available + Soft state + Eventually consistent

Basically Available（基本可用）：允许部分失败
Soft State（软状态）：数据可能在一段时间内不一致
Eventually Consistent（最终一致）：经过一段时间后达到一致

ACID vs BASE:
ACID: 强一致性、强隔离性 → 传统数据库
BASE: 弱一致性、最终一致 → NoSQL/分布式系统
\`\`\`

### 三、主流系统的CAP分析

#### ZooKeeper — CP系统

\`\`\`
- 使用ZAB协议（类Paxos）
- Leader节点负责写操作，必须过半节点确认
- 当Leader不可用时，会进行重新选举（期间不可用）
- 保证强一致性，但牺牲了部分可用性

适用场景：配置管理、分布式锁、命名服务
\`\`\`

#### Eureka — AP系统

\`\`\`
- 客户端有本地注册表缓存
- 节点间异步复制（不要求强一致）
- 网络分区时各节点独立工作
- 允许读取到过期数据（但最终会同步）

适用场景：服务发现（短暂的不一致可接受）
\`\`\`

#### Etcd — CP系统

\`\`\`
- 使用Raft协议保证强一致性
- 写操作必须Leader确认并复制到多数节点
- 读操作默认走Leader（保证线性一致性）
- 可配置为从Follower读（牺牲一致性换取性能）

适用场景：Kubernetes控制面、分布式协调
\`\`\`

### 四、最终一致性实现方案

#### 方案1：向量时钟(Vector Clock)

\`\`\`java
public class VectorClock {
    private Map<String, Long> clock = new ConcurrentHashMap<>();

    // 更新事件
    public synchronized void update(String nodeId) {
        clock.put(nodeId, getCurrentTime(nodeId) + 1);
    }

    // 合并两个向量时钟（取各维度的最大值）
    public synchronized void merge(VectorClock other) {
        for (Map.Entry<String, Long> entry : other.clock.entrySet()) {
            String key = entry.getKey();
            long maxVal = Math.max(getCurrentTime(key), entry.getValue());
            clock.put(key, maxVal);
        }
    }

    // 判断因果关系
    public Order compare(VectorClock other) {
        boolean allGreaterOrEqual = true;
        boolean anyLess = false;

        for (String node : getAllNodes()) {
            long thisVal = getCurrentTime(node);
            long otherVal = other.getCurrentTime(node);

            if (thisVal < otherVal) anyLess = true;
            if (thisVal > otherVal) allGreaterOrEqual = false;
        }

        if (anyLess && allGreaterOrEqual) return Order.BEFORE;      // this < other
        if (!anyLess && !allGreaterOrEqual) return Order.AFTER;     // this > other
        if (allGreaterOrEqual) return Order.EQUAL;                  // this == other
        return Order.CONCURRENT;                                     // 并发（无法确定顺序）
    }
}
\`\`\`

#### 方案2：CRDT（无冲突 replicated data type）

\`\`\`java
// G-Counter（增长计数器）：只增不减，天然无冲突
public class GCounter {
    private Map<String, Integer> counters = new HashMap<>();

    public void increment(String nodeId) {
        counters.merge(nodeId, 1, Integer::sum);
    }

    public int value() {
        return counters.values().stream().mapToInt(Integer::intValue).sum();
    }

    // 合并两个G-Counter（取各节点计数的最大值）
    public void merge(GCounter other) {
        for (Map.Entry<String, Integer> e : other.counters.entrySet()) {
            counters.merge(e.getKey(), e.getValue(), Math::max);
        }
    }
}
\`\`\`

### 五、分布式计数器设计

\`\`\`java
@Service
public class DistributedCounter {
    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 方案1：Redis INCR（单线程原子操作）
     * 优点：简单高效
     * 缺点：单点（可通过Cluster解决）
     */
    public long incrementSimple(String key) {
        return redisTemplate.opsForValue().increment(key);
    }

    /**
     * 方案2：分段计数+定时合并（高并发优化）
     * 将计数分散到多个key，减少热点
     */
    private static final int SHARD_COUNT = 10;

    public long incrementSharded(String baseKey) {
        int shard = ThreadLocalRandom.current().nextInt(SHARD_COUNT);
        String shardKey = baseKey + ":shard:" + shard;
        return redisTemplate.opsForValue().increment(shardKey);
    }

    // 定时任务合并所有分片
    @Scheduled(fixedRate = 60000)
    public void mergeShards(String baseKey) {
        long total = 0;
        for (int i = 0; i < SHARD_COUNT; i++) {
            String shardKey = baseKey + ":shard:" + i;
            String countStr = redisTemplate.opsForValue().getAndDelete(shardKey);
            if (countStr != null) {
                total += Long.parseLong(countStr);
            }
        }
        redisTemplate.opsForValue().set(baseKey, String.valueOf(total));
    }

    /**
     * 方案3：基于CRDT的计数器（多数据中心）
     */
    public void incrementCRDT(String key, String dcId) {
        String dcKey = key + ":" + dcId;
        redisTemplate.opsForValue().increment(dcKey);
    }

    public long getValueCRDT(String key) {
        Set<String> keys = redisTemplate.keys(key + ":*");
        AtomicLong total = new AtomicLong(0);
        keys.forEach(k -> total.addAndGet(
            Long.parseLong(redisTemplate.opsForValue().get(k))));
        return total.get();
    }
}
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["分布式系统", "CAP理论", "一致性"]
  },

  {
    title: "实现简易版分布式锁(Redisson原理)",
    content: `## 题目描述

请基于Redis实现一个生产级分布式锁，要求具备以下功能：

1. 互斥性（同一时刻只有一个客户端能持有锁）
2. 防死锁（自动过期释放 + 续期机制Watchdog）
3. 可重入性（同一线程可多次获取锁）
4. 高可用（Redis Cluster环境下的可靠性）
5. 支持阻塞等待与非阻塞获取两种模式

### 功能要求

- Lua脚本保证原子操作
- Redisson的可重入锁续期原理
- RedLock算法的多实例加锁
- 异常情况下的锁释放安全

### 考察点

- Redis Lua脚本
- Watchdog看门狗机制
- RedLock算法
- 安全释放锁`,
    solution: `## 分布式锁完整实现

### 核心代码

\`\`\`java
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class RedisDistributedLock {
    private final StringRedisTemplate redisTemplate;
    private final String lockKey;
    private final String lockValue;  // UUID，用于识别锁持有者
    private volatile long expireTimeMs;
    private ScheduledFuture<?> watchdogTask;

    // Lua脚本：原子性的获取锁
    private static final String LOCK_SCRIPT =
        "if redis.call('exists', KEYS[1]) == 0 or " +
        "   redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    redis.call('set', KEYS[1], ARGV[1], 'PX', ARGV[2]); " +
        "    return 1; " +
        "end; " +
        "return 0;";

    // Lua脚本：安全的释放锁（只有持有者才能释放）
    private static final String UNLOCK_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]); " +
        "end; " +
        "return 0;";

    // Lua脚本：可重入锁续期
    private static final String RENEW_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('pexpire', KEYS[1], ARGV[2]); " +
        "end; " +
        "return 0;";

    public RedisDistributedLock(StringRedisTemplate redisTemplate, String lockKey) {
        this.redisTemplate = redisTemplate;
        this.lockKey = "lock:" + lockKey;
        this.lockValue = UUID.randomUUID().toString();
    }

    /**
     * 获取锁（非阻塞）
     */
    public boolean tryLock(long leaseTimeMs) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(LOCK_SCRIPT, Long.class);
        Long result = redisTemplate.execute(script,
            Collections.singletonList(lockKey),
            lockValue,
            String.valueOf(leaseTimeMs));

        if (result != null && result == 1L) {
            this.expireTimeMs = leaseTimeMs;
            startWatchdog(leaseTimeMs);  // 启动看门狗续期
            return true;
        }
        return false;
    }

    /**
     * 获取锁（阻塞等待）
     */
    public boolean lock(long leaseTimeMs, long waitTimeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + waitTimeoutMs;

        while (System.currentTimeMillis() < deadline) {
            if (tryLock(leaseTimeMs)) {
                return true;
            }
            // 自旋等待50ms再试
            Thread.sleep(50);
        }
        return false;  // 超时未获取到锁
    }

    /**
     * 释放锁
     */
    public void unlock() {
        stopWatchdog();  // 停止看门狗

        DefaultRedisScript<Long> script = new DefaultRedisScript<>(UNLOCK_SCRIPT, Long.class);
        redisTemplate.execute(script,
            Collections.singletonList(lockKey),
            lockValue);
    }

    // ========== Watchdog看门狗机制 ==========

    private void startWatchdog(long leaseTimeMs) {
        // 锁过期时间的1/3时间后开始续期
        long renewInterval = leaseTimeMs / 3;

        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "lock-watchdog-" + lockKey);
            t.setDaemon(true);
            return t;
        });

        watchdogTask = scheduler.scheduleAtFixedRate(() -> {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>(RENEW_SCRIPT, Long.class);
            Long result = redisTemplate.execute(script,
                Collections.singletonList(lockKey),
                lockValue,
                String.valueOf(expireTimeMs));

            if (result == null || result != 1L) {
                // 续期失败（锁可能已释放或被其他持有者获取）
                stopWatchdog();
            }
        }, renewInterval, renewInterval, TimeUnit.MILLISECONDS);
    }

    private void stopWatchdog() {
        if (watchdogTask != null && !watchdogTask.isCancelled()) {
            watchdogTask.cancel(false);
            watchdogTask = null;
        }
    }

    // ========== 使用示例 ==========

    public static void main(String[] args) throws Exception {
        StringRedisTemplate template = getRedisTemplate();  // 注入或创建
        RedisDistributedLock lock = new RedisDistributedLock(template, "order:12345");

        try {
            if (lock.lock(30000, 5000)) {  // 30秒过期，最多等5秒
                try {
                    // 执行业务逻辑
                    doBusinessLogic();
                } finally {
                    lock.unlock();
                }
            } else {
                System.out.println("获取锁超时");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

// ========== RedLock多实例实现 ==========

class RedLock {
    private final List<RedisDistributedLock> locks;
    private final int quorum;  // 多数派阈值

    public RedLock(List<StringRedisTemplate> templates, String lockKey) {
        this.locks = templates.stream()
            .map(t -> new RedisDistributedLock(t, lockKey))
            .collect(Collectors.toList());
        this.quorum = locks.size() / 2 + 1;  // N/2+1
    }

    public boolean tryRedLock(long leaseTimeMs) {
        int successCount = 0;
        long startTime = System.currentTimeMillis();

        for (RedisDistributedLock lock : locks) {
            if (lock.tryLock(leaseTimeMs)) {
                successCount++;
            }
            // 快速失败：如果剩余时间不够，提前终止
            if (System.currentTimeMillis() - startTime > leaseTimeMs) break;
        }

        if (successCount >= quorum) {
            return true;  // 获得多数锁
        }

        // 未获得足够多的锁，全部释放
        locks.forEach(RedisDistributedLock::unlock);
        return false;
    }
}
\`\`\`

### 关键设计要点

1. **Lua脚本保证原子性**：判断+设置在一个原子操作中完成
2. **唯一标识防误删**：只有锁的持有者才能释放自己的锁
3. **Watchdog自动续期**：防止业务未执行完就过期
4. **RedLock提高可靠性**：即使单个Redis故障也不影响`,
    difficulty: "hard",
    questionType: "code",
    tags: ["分布式系统", "分布式锁", "Redis"],
    codeTemplate: {
      java: `import org.springframework.data.redis.core.StringRedisTemplate;\nimport java.util.*;\nimport java.util.concurrent.*;\n\n/**\n * 基于Redis的分布式锁\n */\npublic class RedisDistributedLock {\n    private final StringRedisTemplate redisTemplate;\n    private final String lockKey;\n    private final String ownerId;  // 锁持有者标识\n\n    /**\n     * 尝试获取锁（非阻塞）\n     */\n    public boolean tryLock(long leaseTimeMs) {\n        // TODO: 使用Lua脚本原子性地获取锁\n        return false;\n    }\n\n    /**\n     * 释放锁（仅持有者能释放）\n     */\n    public void unlock() {\n        // TODO: 使用Lua脚本安全地释放锁\n    }\n}`
    }
  },

  // ==================== 消息队列 (181-200) ====================
  {
    title: "Kafka存储架构与高性能设计原理",
    content: `## 题目描述

请深入分析Kafka的高性能架构设计：

1. Kafka的存储架构：Topic/Partition/Segment/Offset的组织方式
2. 零拷贝技术(sendfile)在Kafka中的应用
3. 顺序写盘 + 页缓存(Page Cache)如何实现高吞吐
4. ISR机制(In-Sync Replicas)与数据可靠性保证
5. Kafka为什么比RabbitMQ快？对比分析两者的适用场景

### 考察点

- 磁盘顺序IO vs 随机IO
- 操作系统Page Cache
- 副本同步机制
- 消息队列选型`,
    solution: `## Kafka高性能架构深度解析

### 一、存储架构

\`\`\`
Topic（主题）
├── Partition 0（分区，有序的消息队列）
│   ├── Segment 0（段文件）
│   │   ├── 00000000000000000000.log  （消息日志）
│   │   ├── 00000000000000000000.index （稀疏索引）
│   │   └── 00000000000000000000.timeindex（时间索引）
│   ├── Segment 1
│   └── Segment N
├── Partition 1
└── Partition 2

每个Partition是一个有序的、不可变的消息序列
每个Partition可以有多个副本（Leader + Followers）
Consumer Group内每个Consumer负责消费不同的Partition
\`\`\`

**文件结构详解**：

1. **.log文件**：实际的消息数据（二进制格式）
2. **.index文件**：偏移量索引（稀疏索引，每4KB一条记录）
3. **.timeindex文件**：时间戳索引（按时间查找消息）

**消息查找过程**：
\`\`\`
1. 通过.index文件定位到.log文件的近似位置
2. 从该位置开始顺序扫描找到精确的消息
3. 利用时间索引可以按时间范围查询
\`\`\`

### 二、零拷贝技术

\`\`\`java
// 传统IO（4次拷贝，2次上下文切换）
磁盘 → 内核缓冲区 → 用户缓冲区 → socket缓冲区 → 网卡

// Kafka使用sendfile（2次拷贝，1次上下文切换）
磁盘 → 内核缓冲区 → 网卡（DMA直接传输）

// Java中的实现
FileChannel channel = new FileInputStream(file).getChannel();
channel.transferTo(position, count, socketChannel);
\`\`\`

**性能提升**：
- 减少数据拷贝次数：4次→2次
- 减少上下文切换：4次→2次
- CPU不参与数据搬运（DMA直接传输）

### 三、顺序写盘 + Page Cache

\`\`\`
Kafka的设计哲学：
1. 所有写入都是顺序追加（Append-Only Log）
2. 充分利用操作系统的Page Cache
3. 不维护复杂的内存索引结构

为什么顺序写快？
- 机械硬盘：磁头不需要频繁寻道（随机写需要10ms+，顺序写可达100MB/s+）
- SSD：减少GC磨损，延长寿命

Page Cache的作用：
- 写入时：先写入Page Cache（内存），由OS异步刷盘
- 读取时：优先从Page Cache读取（命中则无需读磁盘）
- Kafka自己不维护缓存，完全依赖OS的Page Cache！
\`\`\`

### 四、ISR机制

\`\`\`
ISR (In-Sync Replicas)：同步副本集合

Leader维护一个ISR列表：
- 包含Leader本身 + 所有与Leader保持同步的Follower
- 同步标准：lag.time.max.ms（默认10秒）内的Follower

数据提交流程：
1. Producer发送消息到Leader
2. Leader写入本地Log
3. Leader等待ISR中所有副本确认（根据acks配置）
4. Leader向Producer返回ACK

acks参数配置：
- acks=0：Producer不等确认（最快，可能丢数据）
- acks=1：Leader写入成功即确认（可能丢数据）
- acks=all/-1：ISR中所有副本都确认（最安全，但延迟较高）
\`\`\`

**Unclean Leader Election**（脏选举）：
\`\`\`bash
# 当ISR中所有副本都不可用时
unclean.leader.election.enable=true  # 允许非ISR成员成为新Leader
# 可能丢失数据，但保证可用性
unclean.leader.election.enable=false # 拒绝选举，集群不可用但保证一致性
\`\`\`

### 五、Kafka vs RabbitMQ对比

| 特性 | Kafka | RabbitMQ |
|------|-------|----------|
| 吞吐量 | 百万级/秒 | 万级/秒 |
| 延迟 | 毫秒级 | 微秒级 |
| 消息模型 | Pull（消费者主动拉取） | Push（Broker推送给消费者） |
| 消息顺序 | Partition内有序 | Queue内有序 |
| 消息路由 | Partitioner（可自定义） | Routing Key + Exchange |
| 消息确认 | 手动提交offset | ACK机制 |
| 消息保留 | 基于时间/大小 | 消费后删除（默认） |
| 适用场景 | 日志收集、流处理、事件溯源 | 业务解耦、任务队列、RPC |

**选型建议**：
- 高吞吐、大数据场景 → Kafka
- 复杂路由、业务解耦 → RabbitMQ
- 低延迟要求 → RocketMQ/Pulsar`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["消息队列", "Kafka", "高性能"]
  },

  {
    title: "RocketMQ事务消息原理与实现",
    content: `## 题目描述

请深入分析RocketMQ的事务消息机制：

1. 事务消息解决什么问题？（分布式事务的最终一致方案）
2. 半消息(Half Message)的发送与二次确认流程
3. Broker端的消息回查(Check)机制设计
4. 完整的事务消息生命周期图解
5. 对比TCC、本地消息表、RocketMQ事务消息三种方案的优劣

### 考察点

- 两阶段提交(2PC)
- 消息可靠性保证
- 幂等性设计
- 分布式事务模式`,
    solution: `## RocketMQ事务消息深度解析

### 一、解决的问题

**典型场景**：电商下单
\`\`\`
用户下单 → 创建订单(DB1) → 扣减库存(DB2)

问题：如果订单创建成功但库存扣减失败怎么办？
方案：使用事务消息保证最终一致性
\`\`\`

### 二、核心流程（两阶段提交）

#### 阶段一：发送半消息

\`\`\`
Producer → Broker: 发送半消息(Half Message)
             ↓
Broker: 写入半消息（对Consumer不可见！）
       返回发送成功
             ↓
Producer: 执行本地事务（如创建订单）
       ↓
情况A: 本地事务成功 → 发送Commit/Broker确认消息可见
情况B: 本地事务失败 → 发送Rollback/Broker删除半消息
情况C: 网络断开/超时 → 进入回查流程
\`\`\`

#### 阶段二：消息回查

\`\`\`
Broker检测到半消息超过指定时间未确认
        ↓
Broker回调Producer的checkLocalTransaction()
        ↓
Producer检查本地事务状态
        ↓
返回COMMIT → Broker将消息标记为可消费
返回ROLLBACK → Broker删除半消息
返回UNKNOWN → 下次继续回查
\`\`\`

### 三、完整代码示例

\`\`\`java
public class TransactionProducer {
    public static void main(String[] args) throws MQClientException {
        TransactionMQ producer = new TransactionMQ("tx_group");
        producer.setNamesrvAddr("localhost:9876");

        // 设置事务回查监听器
        producer.setTransactionListener(new TransactionListener() {
            @Override
            public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
                try {
                    // ★ 执行本地事务（创建订单）
                    Order order = JSON.parseObject(new String(msg.getBody()), Order.class);
                    orderService.createOrder(order);

                    System.out.println("本地事务执行成功");
                    return LocalTransactionState.COMMIT_MESSAGE;
                } catch (Exception e) {
                    System.err.println("本地事务执行失败: " + e.getMessage());
                    return LocalTransactionState.ROLLBACK_MESSAGE;
                }
            }

            @Override
            public LocalTransactionState checkLocalTransaction(MessageExt msg) {
                // ★ 回查逻辑：检查订单是否已创建
                String orderId = msg.getKeys();
                Order order = orderService.getOrderById(orderId);

                if (order != null && "PAID".equals(order.getStatus())) {
                    return LocalTransactionState.COMMIT_MESSAGE;  // 订单已存在且已支付
                } else if (order != null) {
                    return LocalTransactionState.ROLLBACK_MESSAGE; // 订单存在但异常
                } else {
                    return LocalTransactionState.UNKNOWN;          // 还不确定，下次再查
                }
            }
        });

        producer.start();

        // 发送事务消息
        Message msg = new Message("OrderTopic", "TagA", "ORDER_12345",
            orderJson.getBytes(StandardCharsets.UTF_8));
        SendResult result = producer.sendMessageInTransaction(msg, null);

        System.out.println("发送结果: " + result);
        producer.shutdown();
    }
}

// Consumer端（库存服务）
@RocketMQMessageListener(topic = "OrderTopic", consumerGroup = "inventory_group")
public class InventoryConsumer implements RocketMQListener<MessageExt> {
    @Autowired
    private InventoryService inventoryService;

    @Override
    public void onMessage(MessageExt message) {
        Order order = JSON.parseObject(new String(message.getBody()), Order.class);

        // ★ 保证幂等性（防止重复消费）
        if (!messageIdempotentChecker.hasProcessed(message.getMsgId())) {
            inventoryService.deductStock(order.getItems());
            messageIdempotentChecker.markAsProcessed(message.getMsgId());
        }
    }
}
\`\`\`

### 四、消息状态流转图

\`\`\`
                    发送Half Message
                           ↓
                   [HALF状态 - 对Consumer不可见]
                      /         \\
               本地事务成功    本地事务失败 / 超时
                  ↓              ↓
              COMMIT         ROLLBACK / UNKNOWN
                  ↓              ↓
           [可消费]        [回查Check]
                              ↓
                        checkLocalTransaction()
                         /      |      \\
                     COMMIT   ROLLBACK  UNKNOWN
                       ↓        ↓         ↓
                    可消费    删除      继续回查...
\`\`\`

### 五、三种分布式事务方案对比

| 方案 | 一致性 | 复杂度 | 性能 | 适用场景 |
|------|--------|--------|------|---------|
| TCC (Try-Confirm-Cancel) | 强一致 | 高（3个接口） | 一般 | 金融转账 |
| 本地消息表 | 最终一致 | 中 | 好 | 异步通知 |
| **RocketMQ事务消息** | 最终一致 | 中 | **好** | **主流推荐** |

**RocketMQ事务消息优势**：
1. 与业务代码解耦（通过回查接口）
2. 不侵入原有业务逻辑
3. 天然异步化（提高系统吞吐量）
4. 消息可靠性强（持久化存储）

**注意事项**：
1. 回查接口必须实现幂等性
2. 设置合理的回查间隔和最大回查次数
3. Consumer端也要做幂等处理`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["消息队列", "RocketMQ", "分布式事务"]
  },

  // ==================== 微服务 (201-220) ====================
  {
    title: "微服务网关设计与限流算法实现",
    content: `## 题目描述

请设计并实现一个微服务API网关的核心功能：

1. 网关的核心功能（路由转发、负载均衡、认证鉴权、熔断降级、限流）
2. 实现四种限流算法：固定窗口、滑动窗口、令牌桶、漏桶
3. 设计基于Redis的分布式限流器
4. 网关的高可用部署方案（多活/热备）

### 功能要求

- 支持动态路由规则配置
- 支持IP黑名单/白名单
- 请求日志记录与分析
- 性能指标监控暴露

### 考察点

- 令牌桶/漏桶算法
- Redis Lua脚本
- 负载均衡策略
- 高可用架构`,
    solution: `## API网关核心实现

### 一、限流算法实现

\`\`\`java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

// ========== 1. 固定窗口计数器 ==========
public class FixedWindowRateLimiter {
    private final long maxRequests;
    private final AtomicLong counter = new AtomicLong(0);
    private volatile long windowStart;

    public synchronized boolean allowRequest(long windowSizeMs) {
        long now = System.currentTimeMillis();
        if (now - windowStart > windowSizeMs) {
            windowStart = now;
            counter.set(0);  // 重置计数器
        }
        return counter.incrementAndGet() <= maxRequests;
    }

    // 问题：边界突发（窗口交界处可能双倍流量）
}

// ========== 2. 滑动窗口计数器（改进版）==========
public class SlidingWindowRateLimiter {
    private final long maxRequests;
    private final ConcurrentLinkedDeque<Long> requestTimes = new ConcurrentLinkedDeque<>();

    public synchronized boolean allowRequest(long windowSizeMs) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSizeMs;

        // 清除过期请求记录
        while (!requestTimes.isEmpty() && requestTimes.peekFirst() < windowStart) {
            requestTimes.pollFirst();
        }

        if (requestTimes.size() < maxRequests) {
            requestTimes.addLast(now);
            return true;
        }
        return false;
    }
}

// ========== 3. 令牌桶（允许一定程度的突发）==========
public class TokenBucketRateLimiter {
    private final long capacity;        // 桶容量
    private final double refillRate;    // 每秒填充速率
    private double tokens;              // 当前令牌数
    private long lastRefillTime;

    public TokenBucketRateLimiter(long capacity, double refillRatePerSec) {
        this.capacity = capacity;
        this.refillRate = refillRatePerSec;
        this.tokens = capacity;
        this.lastRefillTime = System.nanoTime();
    }

    public synchronized boolean allowRequest(int tokensRequired) {
        refill();  // 先填充令牌
        if (tokens >= tokensRequired) {
            tokens -= tokensRequired;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsed = (now - lastRefillTime) / 1e9;  // 转换为秒
        tokens = Math.min(capacity, tokens + elapsed * refillRate);
        lastRefillTime = now;
    }
}

// ========== 4. 漏桶（匀速处理，拒绝溢出）==========
public class LeakyBucketRateLimiter {
    private final BlockingQueue<Runnable> queue;
    private final ExecutorService executor;

    public LeakyBucketRateLimiter(int capacity, int leakRate) {
        this.queue = new LinkedBlockingQueue<>(capacity);
        this.executor = Executors.newFixedThreadPool(leakRate);

        // 以固定速率"漏水"（处理请求）
        for (int i = 0; i < leakRate; i++) {
            executor.submit(() -> {
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        Runnable task = queue.take();  // 阻塞等待
                        task.run();
                    } catch (InterruptedException e) {
                        break;
                    }
                }
            });
        }
    }

    public boolean submit(Runnable task) {
        return queue.offer(task);  // 桶满则拒绝
    }
}
\`\`\`

### 二、基于Redis的分布式限流器

\`\`\`java
@Service
public class DistributedRateLimiter {

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 滑动窗口限流（Redis + Lua脚本）
     * @param key 限流key（如 user:123:api:/order）
     * @param limit 最大请求数
     * @param windowMs 时间窗口（毫秒）
     */
    public boolean isAllowed(String key, int limit, long windowMs) {
        String script =
            "local current = redis.call('incr', KEYS[1]) " +
            "if current == 1 then " +
            "    redis.call('pexpire', KEYS[1], ARGV[1]) " +
            "end " +
            "if current > tonumber(ARGV[2]) then " +
            "    return 0 " +
            "else " +
            "    return 1 " +
            "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
        Long result = redisTemplate.execute(redisScript,
            Collections.singletonList(key),
            String.valueOf(windowMs),
            String.valueOf(limit));

        return result != null && result == 1L;
    }

    /**
     * 令牌桶限流（Redis + Lua脚本）
     */
    public boolean acquireToken(String key, double rate, int capacity) {
        String script =
            "local rate = tonumber(ARGV[1]) " +
            "local capacity = tonumber(ARGV[2]) " +
            "local now = tonumber(ARGV[3]) " +
            "local requested = tonumber(ARGV[4]) " +

            "local info = redis.call('hmget', KEYS[1], 'tokens', 'last_refill') " +
            "local tokens = tonumber(info[1]) " +
            "local last_refill = tonumber(info[2]) " +

            "if tokens == nil then " +
            "    tokens = capacity " +
            "    last_refill = now " +
            "end " +

            "-- 填充令牌 " +
            "local elapsed = math.max(0, now - last_refill) " +
            "tokens = math.min(capacity, tokens + elapsed * rate) " +

            "if tokens >= requested then " +
            "    tokens = tokens - requested " +
            "    redis.call('hmset', KEYS[1], 'tokens', tokens, 'last_refill', now) " +
            "    redis.call('pexpire', KEYS[1], math.ceil((capacity - tokens) / rate * 1000)) " +
            "    return 1 " +
            "else " +
            "    redis.call('hmset', KEYS[1], 'tokens', tokens, 'last_refill', last_refill) " +
            "    return 0 " +
            "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
        Long result = redisTemplate.execute(redisScript,
            Collections.singletonList(key),
            String.valueOf(rate), String.valueOf(capacity),
            String.valueOf(System.currentTimeMillis()), "1");

        return result != null && result == 1L;
    }
}
\`\`\`

### 三、网关核心路由

\`\`\`java
@RestController
@RequestMapping("/api/gateway")
public class GatewayController {

    @Autowired
    private RouteLocator routeLocator;

    @Autowired
    private DistributedRateLimiter rateLimiter;

    @RequestMapping("/{service}/**")
    public ResponseEntity<Object> route(
            @PathVariable String service,
            HttpServletRequest request) {

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        // 1. IP黑名单检查
        if (blacklistService.isBlocked(clientIp)) {
            return ResponseEntity.status(403).body("IP blocked");
        }

        // 2. 限流检查
        if (!rateLimiter.isAllowed("rate:" + clientIp + ":" + path, 100, 60000)) {
            return ResponseEntity.status(429).body("Too Many Requests");
        }

        // 3. 认证鉴权
        String token = request.getHeader("Authorization");
        if (!authService.validateToken(token)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        // 4. 路由转发
        Route route = routeLocator.getRoute(service);
        String targetUrl = route.getUrl() + extractSubPath(path, service);

        // 5. 负载均衡选择实例
        ServiceInstance instance = loadBalancer.choose(service);
        targetUrl = instance.getUri().toString() + extractSubPath(path, service);

        // 6. 转发请求并返回响应
        ResponseEntity<Object> response = proxyService.forward(request, targetUrl);

        // 7. 记录访问日志
        logAccess(service, clientIp, path, response.getStatusCode());

        return response;
    }
}
\`\`\`

### 四、高可用部署方案

\`\`\`
方案1：多实例 + DNS负载均衡
  [DNS]
    ↓
  [Gateway-1] [Gateway-2] [Gateway-3]
    ↓         ↓         ↓
  [Service Cluster]

方案2：Keepalived + VIP（虚拟IP）
  [VIP: 192.168.1.100]
    ↓ (主)
  [Gateway-Master] ←── 心跳检测 ──→ [Gateway-Backup]

方案3：K8s Service + Ingress（云原生）
  [Ingress Controller]
    ↓
  [Pod: gateway-1] [Pod: gateway-2] [Pod: gateway-3]
    ↓
  [Internal Service]
\`\`\``,
    difficulty: "hard",
    questionType: "code",
    tags: ["微服务", "网关", "限流", "高可用"],
    codeTemplate: {
      java: `import java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\n\n/**\n * 令牌桶限流器\n */\npublic class TokenBucketRateLimiter {\n    private final long capacity;        // 桶容量\n    private final double refillRate;    // 每秒填充速率\n    private double tokens;              // 当前令牌数\n    private long lastRefillTime;\n\n    /**\n     * 尝试获取令牌\n     */\n    public boolean tryAcquire(int tokens) {\n        // TODO: 实现令牌桶算法\n        return false;\n    }\n}`
    }
  },

  // ==================== Go语言 (221-240) ====================
  {
    title: "Go语言GMP调度模型与协程泄漏排查",
    content: `## 题目描述

请深入分析Go语言的并发调度机制：

1. GMP模型的详细解释（G/M/P各自职责及数量关系）
2. Goroutine的调度时机（系统调用、channel操作、GC等）
3. 工作窃取(Work Stealing)与Hand Off机制
4. Goroutine泄漏的场景及排查方法(pprof/runtime.NumGoroutine)
5. 如何合理设置GOMAXPROCS？Go调度器的演进历史

### 考察点

- 协程 vs 线程 vs 进程
- 抢占式调度 vs 协作式调度
- 系统调用优化
- 性能调优`,
    solution: `## Go GMP调度模型深度解析

### 一、GMP模型详解

\`\`\`
G (Goroutine): 协程
  - 用户态轻量级线程
  - 初始栈大小: 2KB（可动态增长）
  - 调度成本极低（约200ns，比线程低一个数量级）

M (Machine/Thread): OS线程
  - 真正执行G的载体
  - 由Go runtime管理（不直接绑定P）
  - 数量可变（默认最大10000个）

P (Processor): 逻辑处理器
  - M运行G所需的资源
  - 维护本地运行队列（runq）
  - 数量默认=CPU核数（可通过GOMAXPROCS调整）

关系图：
[P1]────[P2]────[P3]  (P的数量=GOMAXPROCS)
  │       │       │
[M1]    [M2]    [M3]  (M绑定到P)
  │       │       │
[G1][G2][G3][G4][G5][G6]  (G在P的本地队列)
\`\`\`

**关键数据结构**：

\`\`\`go
type G struct {
    stack     stack      // 栈空间
    goid      int64      // goroutine ID
    gopc      uintptr    // 创建该goroutine的PC
    startpc   uintptr    // goroutine函数入口
    sched     gobuf      // 保存调度信息(SP/IP等)
    atomicstatus uint32  // 状态(_Gidle/_Grunnable/_Grunning...)
}

type P struct {
    runq     [256]guintptr  // 本地运行队列（环形数组）
    runnext  guintptr       // 下一个运行的G（优先级最高）
    mcache   *mcache        // 内存分配缓存
    // ...
}

type M struct {
    g0      *g     // 特殊goroutine（用于调度）
    curg    *g     // 当前正在运行的G
    p       *p     // 绑定的P
    nextp   *p     // 即将绑定的P（唤醒时）
    spinning bool   // 是否正在自旋寻找可运行的G
}
\`\`\`

### 二、调度时机

**主动调度**：
\`\`\`go
runtime.Gosched()  // 让出CPU，放回runq尾部
\`\`\`

**被动调度**（常见触发点）：
1. **Channel操作**：ch <- data 或 data := <-ch 导致阻塞
2. **网络IO**：netpoll（基于epoll/kqueue）
3. **系统调用**：syscall时M会脱离P（避免阻塞其他G）
4. **GC**：STW期间所有M停止
5. **时间片用完**：默认10ms（由sched.tick决定）

**系统调用优化**（Sysmon监控）：
\`\`\`
M发起系统调用（如read文件）
  ↓
P发现M阻塞超过20μs（sysmon检测）
  ↓
P脱离M，绑定新的M'继续执行其他G
  ↓
系统调用完成
  ↓
M尝试重新获取P（或放入全局空闲列表）
\`\`\`

### 三、工作窃取与Hand Off

**工作窃取(Work Stealing)**：
\`\`\`
当P的本地队列为空时：
1. 全局队列(global runq)偷取（每次偷取一半）
2. 从其他P的本地队列偷取（从tail开始偷，减少竞争）
3. 如果还找不到，进入自旋状态(spinning)

伪代码：
func runqsteal(p, victim *p) *g {
    // 从victim的runq后半部分偷取一半G
    n := victim.runqsize/2
    for i := 0; i < n; i++ {
        gp := victim.runq[victim.runqtail+i]
        p.runq[p.runqhead+p.runqsize+i] = gp
    }
    victim.runqtail += n
    p.runqsize += n
    victim.runqsize -= n
}
\`\`\`

**Hand Off机制**：
\`\`\`
当P上有大量G待运行，而其他P空闲时：
- 将部分G转移到空闲P的队列
- 平衡负载，避免单个P过载
\`\`\`

### 四、Goroutine泄漏排查

**常见泄漏场景**：
\`\`\`go
// 场景1: Channel永远接收不到数据
func leakyGoroutine() {
    ch := make(chan string)
    go func() {
        result := <-ch  // 永远阻塞在这里！
        fmt.Println(result)
    }()
    // 忘记向ch发送数据
}

// 场景2: select没有default分支
func leakySelect() {
    ch := make(chan int)
    go func() {
        select {
        case <-ch:  // 无default，永远阻塞
            process()
        }
    }()
}

// 场景3: sync.WaitGroup使用错误
func leakyWaitGroup(wg *sync.WaitGroup) {
    go func() {
        wg.Add(1)  // ❌ 应该在外部Add
        defer wg.Done()
        doWork()
    }()
}
\`\`\`

**排查工具**：

\`\`\`bash
# 1. 查看当前Goroutine数量
curl http://localhost:6060/debug/pprof/goroutine?debug=1

# 2. 使用pprof分析
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 3. 代码中监控
func monitorGoroutines() {
    ticker := time.NewTicker(5 * time.Second)
    for range ticker.C {
        count := runtime.NumGoroutine()
        if count > threshold {
            log.Printf("WARNING: goroutine count=%d", count)
            // 输出stack trace
            buf := make([]byte, 1<<20)  // 1MB buffer
            n := runtime.Stack(buf, true)
            log.Printf("Stack:\\n%s", buf[:n])
        }
    }
}

# 4. 使用dlv调试器
dlv connect localhost:2345
(goroutines)  # 列出所有goroutine
(goroutine <id>)  # 查看某个goroutine的堆栈
\`\`\`

### 五、GOMAXPROCS设置

\`\`\`bash
# 默认值 = CPU逻辑核数
# 查看：runtime.NumCPU()

# 设置方式
export GOMAXPROCS=4  # 环境变量
runtime.GOMAXPROCS(4) # 代码中设置

# 建议：
# CPU密集型：GOMAXPROCS = CPU核数
# IO密集型：GOMAXPROCS = CPU核数 × 2（甚至更高）
# 但不要设太大（会导致频繁上下文切换）
\`\`\`

**调度器演进**：
- Go 1.0: GM模型（无P），全局锁严重
- Go 1.1: 引入P，大幅减少锁竞争
- Go 1.5: 抢占式调度（基于函数调用）
- Go 1.14: 基于信号的异步抢占（真正解决了无限循环无法抢占的问题）`,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Go语言", "并发编程", "性能调优"]
  },

  {
    title: "Go Channel底层实现与并发模式",
    content: `## 题目描述

请深入分析Go语言Channel的实现原理：

1. Channel的数据结构(hchan)及底层实现
2. 有缓冲vs无缓冲Channel的区别与使用场景
3. Channel相关的经典并发模式（Fan-In/Fan-Out/Pipeline/Cancel）
4. Channel泄漏的原因及预防措施
5. 实现一个带超时的Worker Pool

### 考察点

- ring buffer环形队列
- goroutine阻塞/唤醒机制
- select多路复用
- context取消传播`,
    solution: `## Go Channel深度解析

### 一、hchan数据结构

\`\`\`go
type hchan struct {
    qcount   uint           // 当前队列中的元素个数
    dataqsiz uint           // 环形队列大小（容量）
    buf      unsafe.Pointer // 环形队列指针（数组起始地址）
    elemsize uint16         // 元素大小
    closed   uint32         // 是否已关闭
    sendx    uint           // 发送索引（写到buf的哪个位置）
    recvx    uint           // 接收索引（从buf的哪个位置读）
    recvq    waitq          // 等待接收的goroutine队列（sudog链表）
    sendq    waitq          // 等待发送的goroutine队列（sudog链表）
    lock     mutex          // 互斥锁（保护所有字段）
}
\`\`\`

**内存布局**：
\`\`\`
无缓冲Channel (make(chan T)):
  buf=nil, dataqsiz=0
  发送方必须等到接收方就绪（同步通信）

有缓冲Channel (make(chan T, N)):
  buf指向大小为N的数组
  sendx和recvx构成环形队列的读写指针
  未满时可发送，非空时可接收（异步通信）
\`\`\`

### 二、发送/接收流程

**发送(ch <- value)**：
\`\`\`
1. 加锁
2. 如果recvq不为空（有等待的接收者）
   → 直接将value复制给接收者，唤醒接收者goroutine
3. 如果qcount < dataqsiz（队列未满）
   → 将value放入buf[sendx]，sendx++，qcount++
4. 如果队列已满
   → 将当前goroutine打包成sudog加入sendq
   → gopark挂起当前goroutine（解锁后被唤醒时继续）
5. 解锁
\`\`\`

**接收(value := <-ch)**：
\`\`\`
1. 加锁
2. 如果sendq不为空（有等待的发送者）且队列为空
   → 直接从发送者复制值，唤醒发送者
3. 如果qcount > 0（队列非空）
   → 从buf[recvx]取出值，recvx++，qcount--
4. 如果队列为空且Channel未关闭
   → 将当前goroutine打包成sudog加入recvq
   → gopark挂起（直到被发送者唤醒）
5. 如果队列为空且Channel已关闭
   → 返回零值（不会阻塞）
6. 解锁
\`\`\`

### 三、经典并发模式

#### 1. Fan-In（合并多个输入）

\`\`\`go
// 合并多个channel到一个输出channel
func fanIn(channels ...<-chan interface{}) <-chan interface{} {
    var wg sync.WaitGroup
    out := make(chan interface{})

    output := func(c <-chan interface{}) {
        for v := range c {
            out <- v
        }
        wg.Done()
    }

    wg.Add(len(channels))
    for _, c := range channels {
        go output(c)
    }

    // 启动goroutine在所有input关闭后关闭output
    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

// 使用
ch1 := generateData(source1)
ch2 := generateData(source2)
merged := fanIn(ch1, ch2)
for v := range merged {
    fmt.Println(v)
}
\`\`\`

#### 2. Fan-Out（分发到多个worker）

\`\`\`go
func fanOut(input <-chan Task, workerCount int, workerFunc func(Task) Result) []<-chan Result {
    outputs := make([]<-chan Result, workerCount)

    for i := 0; i < workerCount; i++ {
        outputs[i] = worker(input, workerFunc)
    }

    return outputs
}

func worker(input <-chan Task, fn func(Task) Result) <-chan Result {
    out := make(chan Result)
    go func() {
        for task := range input {
            out <- fn(task)  // 处理任务
        }
        close(out)
    }()
    return out
}
\`\`\`

#### 3. Pipeline（流水线模式）

\`\`\`go
// 三阶段Pipeline: 生成 → 处理 → 汇总
func pipeline() {
    // Stage 1: 生成数据
    generator := func() <-chan int {
        out := make(chan int)
        go func() {
            for i := 0; i < 100; i++ {
                out <- i
            }
            close(out)
        }()
        return out
    }

    // Stage 2: 处理数据（平方）
    square := func(in <-chan int) <-chan int {
        out := make(chan int)
        go func() {
            for v := range in {
                out <- v * v
            }
            close(out)
        }()
        return out
    }

    // Stage 3: 过滤偶数
    filterEven := func(in <-chan int) <-chan int {
        out := make(chan int)
        go func() {
            for v := range in {
                if v%2 == 0 {
                    out <- v
                }
            }
            close(out)
        }()
        return out
    }

    // 组装Pipeline
    for v := range filterEven(square(generator())) {
        fmt.Println(v)
    }
}
\`\`\`

#### 4. Context取消传播

\`\`\`go
func withTimeout(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    resultCh := make(chan Result, 1)
    errCh := make(chan error, 1)

    go func() {
        result, err := slowOperation(ctx)
        if err != nil {
            errCh <- err
            return
        }
        resultCh <- result
    }()

    select {
    case result := <-resultCh:
        fmt.Println("Success:", result)
        return nil
    case err := <-errCh:
        return err
    case <-ctx.Done():
        return ctx.Err()  // 超时取消
    }
}
\`\`\`

### 四、带超时的Worker Pool

\`\`\`go
type WorkerPool struct {
    taskChan   chan Task
    results    chan Result
    workerCount int
    ctx        context.Context
    cancel     context.CancelFunc
}

func NewWorkerPool(workerCount int, bufferSize int) *WorkerPool {
    ctx, cancel := context.WithCancel(context.Background())
    return &WorkerPool{
        taskChan:   make(chan Task, bufferSize),
        results:    make(chan Result, bufferSize),
        workerCount: workerCount,
        ctx:        ctx,
        cancel:     cancel,
    }
}

func (wp *WorkerPool) Start() {
    for i := 0; i < wp.workerCount; i++ {
        go wp.worker(i)
    }
}

func (wp *WorkerPool) worker(id int) {
    for {
        select {
        case task, ok := <-wp.taskChan:
            if !ok {  // channel已关闭
                return
            }
            // 执行任务（支持context取消）
            result := wp.executeWithTimeout(task, 30*time.Second)
            wp.results <- result

        case <-wp.ctx.Done():
            fmt.Printf("Worker %d shutting down\\n", id)
            return
        }
    }
}

func (wp *WorkerPool) executeWithTimeout(task Task, timeout time.Duration) Result {
    ctx, cancel := context.WithTimeout(wp.ctx, timeout)
    defer cancel()

    resultCh := make(chan Result, 1)
    go func() {
        resultCh <- task.Execute()
    }()

    select {
    case result := <-resultCh:
        return result
    case <-ctx.Done():
        return Result{Error: fmt.Errorf("task %s timeout", task.ID)}
    }
}

func (wp *WorkerPool) Submit(task Task) error {
    select {
    case wp.taskChan <- task:
        return nil
    default:
        return errors.New("pool full")
    }
}

func (wp *WorkerPool) Stop() {
    wp.cancel()  // 通知所有worker退出
    close(wp.taskChan)
}

// 使用示例
func main() {
    pool := NewWorkerPool(10, 1000)  // 10个worker，buffer=1000
    pool.Start()
    defer pool.Stop()

    // 提交任务
    for i := 0; i < 100; i++ {
        pool.Submit(Task{ID: fmt.Sprintf("task-%d", i)})
    }

    // 收集结果
    for i := 0; i < 100; i++ {
        result := <-pool.results
        fmt.Printf("Task %s completed\\n", result.TaskID)
    }
}
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Go语言", "Channel", "并发模式"]
  },

  // ==================== Python后端 (241-255) ====================
  {
    title: "Python GIL对多线程的影响与解决方案",
    content: `## 题目描述

请深入分析Python的全局解释器锁(GIL)：

1. GIL是什么？为什么Python需要GIL？
2. GIL对CPU密集型和IO密集型程序的不同影响
3. 绕过GIL的方案：multiprocessing/ctypes/C扩展/asyncio
4. Python 3.12+的PEP 684（Per-Interpreter GIL）改进
5. 在Web框架(Django/FastAPI)中如何选择并发策略？

### 考察点

- CPython解释器内部
- 引用计数垃圾回收
- 多进程 vs 多线程 vs 协程
- Web服务器架构（ASGI/WSGI）`,
    solution: `## Python GIL深度解析

### 一、GIL的本质

\`\`\`python
# GIL (Global Interpreter Lock) 是CPython解释器级别的互斥锁
# 它确保同一时刻只有一个线程执行Python字节码

# 为什么需要GIL？
# 1. CPython使用引用计数进行内存管理
#    ref_count = obj->ob_refcnt  # 不是原子操作！
#    如果两个线程同时修改ref_count → 内存泄漏或double-free
# 2. 大量C扩展库不是线程安全的
# 3. 历史遗留（最早的单线程解释器设计）

# GIL的工作方式：
# - 每个Python线程在执行前必须获取GIL
# - 执行一定数量的字节码指令后释放GIL（让其他线程有机会执行）
# - IO操作期间会自动释放GIL
\`\`\`

**GIL的释放时机**：
\`\`\`c
// CPython源码 ceval.c
for (;;) {
    if (--_Py_Ticker < 0) {  // 每执行1000条字节码指令检查一次
        if (_Py_CheckInterval >= 0) {
            _Py_Ticker = _Py_CheckInterval;
            // 释放GIL，给其他线程机会
            if (PyEval_MergePendingCalls()) continue;
            DROP_GIL();
            // 其他线程运行...
            ACQUIRE_GIL();
        }
    }
    // 执行字节码指令
    opcode = *next_instr++;
    switch (opcode) { ... }
}
\`\`\`

### 二、对不同类型程序的影响

**CPU密集型**（受GIL严重影响）：
\`\`\`python
import threading
import time

def cpu_bound_task(n):
    while n > 0:
        n -= 1

# 单线程
start = time.time()
cpu_bound_task(100_000_000)  # 约2.3秒
print(f"Single thread: {time.time()-start:.2f}s")

# 多线程（4个线程）
start = time.time()
threads = []
for _ in range(4):
    t = threading.Thread(target=cpu_bound_task, args=(25_000_000,))
    threads.append(t)
    t.start()
for t in threads: t.join()
print(f"Multi-thread (4): {time.time()-start:.2f}s")
# 结果：几乎一样慢！（因为GIL导致同一时刻只有1个线程执行）
# 甚至更慢（线程切换开销）
\`\`\`

**IO密集型**（影响较小）：
\`\`\`python
import threading
import requests
import time

urls = ["https://api.example.com/data"] * 10

def io_task(url):
    requests.get(url)  # 网络IO期间会释放GIL！

# 多线程IO密集型任务：接近线性加速
# 因为大部分时间在等待IO，GIL会被释放
\`\`\`

### 三、绕过GIL的方案

#### 方案1：multiprocessing（多进程）

\`\`\`python
from multiprocessing import Pool
import time

def cpu_heavy(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

if __name__ == '__main__':
    # 单进程
    start = time.time()
    result = cpu_heavy(50_000_000)
    print(f"Single process: {time.time()-start:.2f}s")

    # 多进程（真正并行）
    start = time.time()
    with Pool(processes=4) as pool:
        results = pool.map(cpu_heavy, [12_500_000]*4)
    print(f"Multi-process (4): {time.time()-start:.2f}s")
    # 结果：接近4倍加速！
\`\`\`

**优缺点**：
- ✅ 绕过GIL，真正的多核并行
- ✅ 进程间隔离（一个崩溃不影响其他）
- ❌ 进程间通信开销大（需要pickle序列化）
- ❌ 内存占用大（每个进程独立内存空间）

#### 方案2：asyncio（协程）

\`\`\`python
import asyncio
import aiohttp
import time

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

# 单线程 + 事件循环
# 适合大量IO并发（数千连接）
# 不受GIL影响（单线程，不存在竞争）
\`\`\`

#### 方案3：Cython释放GIL

\`\`\`cython
# compute.pyx
from libc.stdlib cimport malloc, free

def heavy_computation(int n):
    cdef int i
    cdef double total = 0.0

    with nogil:  # ★ 关键：在此块中释放GIL！
        for i in range(n):
            total += i * i

    return total

# 编译后可以在多线程中真正并行执行
\`\`\`

### 四、Web框架的并发策略

\`\`\`
Django (WSGI):
- 每个请求一个线程（受GIL限制）
- 生产环境用Gunicorn + gthread/workers
- 配置: gunicorn -w 4 -k gthread --threads 40 myapp:wsgi
- workers=4（4个进程绕GIL）× threads=40（每进程40线程处理IO）

FastAPI (ASGI):
- 原生支持async/await
- 使用uvicorn运行
- 配置: uvicorn main:app --workers 4
- IO密集型用async，CPU密集型用多进程workers

选择建议：
- IO密集型 → FastAPI + asyncio（单进程即可处理万级并发）
- CPU密集型 → Django/FastAPI + 多进程workers
- 混合型 → FastAPI + async + 多进程 + 任务队列(Celery)
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["Python后端", "GIL", "并发编程"]
  },

  // ==================== 容器化 (256-270) ====================
  {
    title: "Docker镜像分层与构建优化实战",
    content: `## 题目描述

请深入分析Docker镜像的分层机制与优化策略：

1. Docker镜像的分层存储驱动（OverlayFS/AUFS）原理
2. Dockerfile最佳实践（层缓存利用、多阶段构建、.dockerignore）
3. 分析一个Docker镜像的大小优化案例（从1GB优化到100MB）
4. Docker BuildKit的高级特性（缓存挂载、Secret注入、并行构建）
5. 容器安全加固（最小权限原则、只读文件系统、seccomp/AppArmor）

### 考察点

- Union File System
- Copy-on-Write
- 构建缓存失效条件
- 安全基线`,
    solution: `## Docker镜像深度优化指南

### 一、分层存储原理

\`\`\`
Docker镜像 = 只读层(ReadOnly Layers) + 可读写容器层(Container Layer)

┌─────────────────────────┐
│ Container Layer (RW)    │ ← 容器运行时的修改
├─────────────────────────┤
│ Layer 4: CMD /app/bin   │
├─────────────────────────┤
│ Layer 3: COPY . /app    │
├─────────────────────────┤
│ Layer 2: RUN pip install│
├─────────────────────────┤
│ Layer 1: FROM python:3.9│
└─────────────────────────┘
        ↑
   OverlayFS合并视图（容器看到的统一文件系统）

Copy-on-Write:
- 读文件：如果上层没有，向下层查找
- 写文件：先复制到Container Layer，再修改（Copy-Up）
- 删除文件：在Container Layer创建whiteout文件
\`\`\`

### 二、Dockerfile优化前后对比

**❌ 优化前（1.2GB）**：
\`\`\`dockerfile
FROM ubuntu:20.04

RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install numpy pandas scikit-learn flask

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY src/ /app/src/
WORKDIR /app/src

CMD ["python3", "app.py"]
\`\`\`

**✅ 优化后（180MB）**：
\`\`\`dockerfile
# ===== 第一阶段：构建 =====
FROM python:3.11-slim AS builder

WORKDIR /build
COPY requirements.txt .

# ★ 利用Docker层缓存：不变的部分先执行
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ===== 第二阶段：运行 =====
FROM python:3.11-slim

# ★ 安装必要的系统依赖（合并为单层）
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 gcc && \\
    rm -rf /var/lib/apt/lists/* && \\
    apt-get clean

# ★ 从builder阶段复制安装好的包
COPY --from=builder /install /usr/local

WORKDIR /app

# ★ 最后复制经常变化的源代码（充分利用缓存）
COPY src/ ./src/

# ★ 非root用户运行（安全加固）
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

EXPOSE 8000

# ★ 使用exec形式（PID 1正确接收信号）
CMD ["python3", "-m", "src.app"]
\`\`\`

**优化要点总结**：

| 优化项 | 效果 | 说明 |
|--------|------|------|
| slim基础镜像 | -500MB | 去掉不必要的工具 |
| 多阶段构建 | -400MB | 构建依赖不进入最终镜像 |
| 合并RUN命令 | -50MB | 减少层数 |
| 清理apt缓存 | -30MB | 减小每层大小 |
| .dockerignore | -20MB | 排除无用文件 |
| 非root用户 | 安全 | 最小权限原则 |

### 三、.dockerignore配置

\`\`\`
# .dockerignore
.git
.github
__pycache__
*.pyc
.env
*.md
docs/
tests/
.idea/
.vscode/
node_modules/
coverage/
htmlcov/
.dockerignore
Dockerfile*
docker-compose*
\`\`\`

### 四、BuildKit高级特性

\`\`\`bash
# 启用BuildKit
export DOCKER_BUILDKIT=1

# ===== 缓存挂载（加速pip/npm安装）=====
# syntax=docker/dockerfile:1
FROM python:3.11-slim

RUN --mount=type=cache,target=/root/.cache/pip \\
    pip install -r requirements.txt

# 效果：即使requirements.txt没变，pip下载的包也会被缓存
# 后续构建无需重新下载

# ===== Secret注入（安全传递密钥）=====
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \\
    npm install

# 构建: docker build --secret id=npmrc,src=./.npmrc .

# ===== 并行构建多个阶段 =====
FROM alpine AS base
RUN apk add ...

FROM base AS frontend
RUN npm install && npm run build

FROM base AS backend
RUN pip install ...

FROM nginx:alpine
COPY --from=frontend /dist /usr/share/nginx/html
COPY --from=backend /app /opt/app
\`\`\`

### 五、安全加固清单

\`\`\`dockerfile
# 1. 使用具体版本标签（避免latest带来的不可预测更新）
FROM python:3.11.4-slim-bookworm

# 2. 最小权限用户
RUN groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin appuser
USER appuser

# 3. 只读根文件系统（运行时参数）
# docker run --read-only --tmpfs /tmp --tmpfs /var/run image

# 4. 移除不必要的工具
RUN apt-get purge -y gcc make && rm -rf /var/lib/apt/*

# 5. 健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# 6. 信号处理（使用tini作为PID 1）
ENTRYPOINT ["tini", "--"]

# 7. seccomp/AppArmor限制系统调用
# docker run --security-opt seccomp=default.json image
\`\`\``,
    difficulty: "medium",
    questionType: "qa",
    tags: ["容器化", "Docker", "DevOps"]
  },

  // ==================== 中间件 (271-285) ====================
  {
    title: "Elasticsearch索引原理与查询优化",
    content: `## 颜目描述

请深入分析Elasticsearch的核心原理：

1. 倒排索引(Inverted Index)的结构与实现
2. 分片(Shard)、副本(Replica)与数据分布策略
3. 写入流程（Refresh/Flush/Translog/Merge）全链路分析
4. 查询执行过程（Query Phase + Fetch Phase）
5. Elasticsearch性能优化实践（索引设计、查询调优、JVM调优）

### 考察点

- LSM Tree思想
- 近实时搜索(NRT)
- 分布式协调
- 集群规划`,
    solution: `## Elasticsearch深度解析

### 一、倒排索引结构

\`\`\`
原始文档：
Doc1: "Google MapReduce"
Doc2: "Elasticsearch Search"
Doc3: "Hadoop MapReduce"

倒排索引：
Term          | Posting List (文档ID + 位置信息)
--------------|-----------------------------------
Google         | Doc1:[0]
MapReduce      | Doc1:[1], Doc3:[1]
Elasticsearch  | Doc2:[0]
Search         | Doc2:[1]
Hadoop         | Doc3:[0]

倒排索引组成：
┌─────────────────────────────────────┐
│ Term Dictionary (词典)              │
│  → FST (Finite State Transducer)    │
│  → 内存中，快速查找term是否存在     │
├─────────────────────────────────────┤
│ Postings List (倒排表)              │
│  → 磁盘上（压缩存储）               │
│  → 包含doc_id, term_freq, positions │
│  → Frame of Reference + Roaring    │
│    Bitmaps 压缩算法                 │
└─────────────────────────────────────┘
\`\`\`

### 二、分片与数据分布

\`\`\`
Index = Logical namespace
├── Primary Shard 0 (主分片)
│   └── Replica Shard 0 (副本)
├── Primary Shard 1
│   └── Replica Shard 1
└── Primary Shard 2
    └── Replica Shard 2

路由公式：
shard_num = hash(routing) % num_primary_shards

routing默认 = _id（文档ID）
也可以自定义：PUT /index/_doc/1?routing=user_123
\`\`\`

**分片策略**：
- 单分片上限：官方建议不超过50GB
- 分片总数：建议每GB数据1个分片（过多会导致overhead）
- 副本数：生产环境至少1（高可用）

### 三、写入全链路

\`\`\`
Client → Coordinator Node
    ↓
Routing (计算目标shard)
    ↓
Primary Shard (接收写入)
    ├─ 1. 写入Translog（WAL预写日志，防宕机丢数据）
    ├─ 2. 写入Memory Buffer（内存缓冲区）
    └─ 3. 同步到Replica Shards
        ↓
    Refresh（默认1秒）
    ├─ Memory Buffer → 新Segment（Lucene Index）
    ├─ 此时可以被搜索到（NRT近实时）
    └─ Translog未清空（用于故障恢复）

    Flush（默认30分钟或Translog>512MB）
    ├─ Memory Buffer清空
    ├─ 新Segment写入磁盘
    ├─ Translog清空
    └─ 提交Point（commit point）

    Merge（后台异步）
    ├─ 小Segment合并为大Segment
    ├─ 删除已标记删除的文档
    └─ 释放空间
\`\`\`

**Translog策略**：
\`\`\`yaml
index.translog.durability: async    # 异步（可能丢1s数据，性能好）
index.translog.durability: request  # 每次请求fsync（最安全，性能差）
index.translog.sync_interval: 5s     # 异步刷新间隔
\`\`\`

### 四、查询执行过程

**Query Phase（查询阶段）**：
\`\`\`
1. Client发送搜索请求到任意Node（Coordinator）
2. Coordinator广播请求到所有相关Shard（Primary或Replica）
3. 每个Shard本地执行查询（Lucene）
4. 返回：doc_id + _score + 排序值（注意：不含原文！）
5. Coordinator汇总结果，排序，取Top N

Fetch Phase（获取阶段）：
1. Coordinator根据Top N的doc_id，向对应Shard请求原文
2. Shard读取_source字段返回
3. Coordinator组装最终结果返回Client
\`\`\`

**深度分页问题**（from+size）：
\`\`\`
GET /index/_search
{
  "from": 10000,
  "size": 10
}
# 问题：每个shard都要查询10010条，然后丢弃前10000条
# from越大，内存消耗越大，性能越差

# 解决方案1：Search After（游标查询）
GET /index/_search
{
  "size": 10,
  "sort": [{"timestamp": "asc"}],
  "search_after": ["last_timestamp_value"]  # 上一次最后一条的sort值
}

# 解决方案2：Scroll（大量数据导出）
POST /index/_search?scroll=1m
{
  "size": 1000,
  "query": { "match_all": {} }
}
# 后续请求：POST /_search/scroll {"scroll":"1m", "scroll_id":"xxx"}
\`\`\`

### 五、性能优化实践

**索引设计优化**：
\`\`\`json
// 1. 映射优化
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",    // 中文分词
        "search_analyzer": "ik_smart",
        "fields": {
          "keyword": { "type": "keyword" }  // 精确匹配
        }
      },
      "status": {
        "type": "keyword",            // 枚举值用keyword
        "doc_values": false           // 不需要聚合时关闭
      },
      "content": {
        "type": "text",
        "index": false                 // 不需要搜索的字段不建索引
      },
      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      }
    }
  },

  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "30s",        // 非实时场景增大refresh间隔
    "translog.durability": "async"
  }
}
\`\`\`

**查询优化**：
\`\`\`json
// 1. 使用filter代替query（不计算评分，可缓存）
{
  "bool": {
    "filter": [
      { "term": { "status": "published" } },  // 可缓存
      { "range": { "created_at": { "gte": "2024-01-01" } } }
    ],
    "must": [
      { "match": { "title": "elasticsearch" } }  // 只有这部分算分
    ]
  }
}

// 2. 避免通配符前缀查询
{ "wildcard": { "name": "*abc" } }  // OK（后缀通配）
{ "wildcard": { "name": "abc*" } }  // ⚠️ 可能很慢（遍历所有term）

// 3. 使用preference减少缓存抖动
GET /index/_search?preference=_local

// 4. 强制只读副本（分担Primary压力）
GET /index/_search?preference=_only_nodes:data-node-2,data-node-3
\`\`\`

**JVM调优**：
\`\`\`bash
# elasticsearch.yml
bootstrap.memory_lock: true  # 锁定内存，防止swap

# jvm.options
-Xms16g                    # Heap = 物理内存的50%（最大30GB）
-Xmx16g                    # Xms == Xms（避免resize）
-XX:+UseG1GC               # G1 GC（ES默认）
-XX:MaxGCPauseMillis=200   # 目标停顿200ms
-XX:InitiatingHeapOccupancyPercent=30  # 触发并发标记阈值

# 监控指标
# - GC频率和时间（jstat）
# - Segment Memory（fielddata cache + request cache）
# - Thread Pool Rejections（队列满时拒绝请求）
\`\`\``,
    difficulty: "hard",
    questionType: "qa",
    tags: ["中间件", "Elasticsearch", "搜索引擎"]
  },
];
