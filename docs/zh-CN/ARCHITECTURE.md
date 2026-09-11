# 墨序 MDX 架构文档

## 设计目标

编辑时保留所见即所得的连贯体验，发布时仍得到可审阅、可版本管理的 MDX。组件的开始与结束标签不显示在正文中，而是由 NodeView 呈现为语义化内容块。

## 技术组成

- **Next.js App Router**：承载演示工作台与后续内容管理页面。
- **React + TypeScript**：组件实现和公共 API 类型约束。
- **MUI + Emotion**：主题、工具栏、菜单、弹层、抽屉与编辑器容器。
- **Tiptap / ProseMirror**：文档 schema、选区、光标命令、历史记录及自定义节点。
- **MDX Serializer**：将受控的 Tiptap JSON 递归转换为 Markdown 与 MDX。
- **next-mdx-remote-client**：在服务端编译编辑器生成的 MDX，在客户端装配 React 组件。
- **rehype + Shiki**：生成标题锚点，并为代码块执行构建级语法高亮。

## 数据流

```text
工具栏或键盘输入
        ↓
Tiptap Transaction
        ↓
ProseMirror JSON ──→ 编辑现场持久化
        ↓
MDX Serializer
        ↓
MDX 文本 ─────────→ 预览、发布、Git 或搜索索引
        ↓ POST /api/mdx/compile
安全校验 → MDX 编译 → 白名单组件注册表 → 实时预览
```

编辑器以 JSON 为主状态，MDX 是确定性的派生产物。这样可以避免在每次输入时反复解析 JSX 标签，也能让光标、撤销历史和自定义块保持稳定。

## 工作区布局

页面采用两层结构：顶部 64px Header 承载文档定位、保存状态与导出动作；1200px 以上的 Content 使用两列网格，左侧至少保留 720px，右侧使用 328px 工具轨道。更窄的视口只保留文稿，工具面板进入右侧 Drawer。桌面工作区高度受视口约束，正文和工具内容分别滚动，页面本身不再形成第三层滚动。

## 模块职责

| 模块 | 职责 |
| --- | --- |
| `mdx-editor.tsx` | 创建 Editor、注册扩展，连接工作区、标题、状态栏与变更回调 |
| `editor-core.tsx` | 承载可滚动内容区、文本浮动菜单与表格上下文工具 |
| `editor-classes.ts` | 集中声明 ProseMirror 节点类名，供扩展和样式层共同使用 |
| `table-action-bar.tsx` | 跟随当前表格定位，提供行列、表头、合并、拆分和删除命令 |
| `toolbar.tsx` | 将 MUI 交互转换为 Tiptap chain 命令 |
| `command-registry.ts` | 声明全部可发现命令，作为右侧面板与斜杠菜单的单一数据源 |
| `slash-command-controller.tsx` | 监听行首 `/` 与选区变化，过滤命令并将菜单锚定在当前光标 |
| `slash-command-menu.tsx` | 提供分类、键盘导航、搜索结果和选中反馈 |
| `insert-content.ts` | 统一执行自定义节点的 selection-aware 插入 |
| `extensions.tsx` | 定义 Callout、Figure、MetricGrid、Badge、Card、Details、Highlight 和复杂 Widget 的 schema 与 NodeView |
| `serializer.ts` | 递归输出受控 MDX，执行属性转义 |
| `editor-styles.tsx` | 提供编辑外壳、排版规则、块组件视觉状态 |
| `mdx-runtime/components.tsx` | 注册原生标签和全部产品 MDX 组件的发布态实现 |
| `mdx-runtime/mdx-preview.tsx` | 防抖请求编译接口并呈现最近一次有效结果 |
| `app/api/mdx/compile/route.ts` | 服务端校验、编译、标题锚点与代码高亮管线 |
| `lib/mdx-security.ts` | 预览源长度、导入导出、脚本与事件属性约束 |
| `page.tsx` | 组合编辑器、源码抽屉和文章预览抽屉 |

## 光标与组件插入

插入命令读取 ProseMirror 当前 selection，并通过 `editor.chain().focus().insertContent(...)` 在该位置执行。块级组件进入当前块边界，行内 Badge 在文本父节点内插入；当选区不在行内容器中时，会先创建段落，避免节点落到无效位置。

在空段落行首输入 `/` 会启动命令控制器。输入文字可过滤命令，方向键改变选中项，Enter 执行并删除命令文本，Esc 关闭。右侧插入面板调用完全相同的命令对象，因此两种入口具有一致的节点结构和光标语义。

## 编辑器内核与表格

编辑器内核与外层产品界面解耦。`EditorCore` 只负责文档内容、选区反馈和上下文操作；右侧组件面板、标题、保存状态与 MDX 导出由外层组合。当前提供可编辑双栏、标签页、看板，以及图库、音频、视频、附件等节点。标签页正文是 ProseMirror 子文档，可直接编辑；标签名称和增删操作集中在属性面板。

表格使用独立 schema，并开启列宽调整。光标进入表格后，操作条根据 `.tableWrapper` 的实时位置显示，可增加或删除行列、切换表头、合并或拆分单元格，以及删除整张表。表格正文采用稳定的最小列宽、单元格边框、选中态和 resize handle，避免编辑态与最终文章排版脱节。

## 安全与发布

序列化器只输出已注册节点和受控属性，并对组件属性进行转义。编译接口限制 200 KB，AST 校验会拒绝 import/export、任意代码表达式、展开属性、未知组件和未知属性；属性表达式仅允许无执行能力的数据字面量。运行时只暴露 `mdxComponents` 白名单，并再次校验链接和媒体协议。

外部 iframe 默认关闭，仅允许 `NEXT_PUBLIC_MDX_EMBED_HOSTS` 明确配置的 HTTPS 域名。接口内置同源校验与单实例限流；生产集群仍应在网关实施分布式限流，并在受限进程中执行编译。由于当前 MDX 客户端运行时需要动态求值，CSP 暂时保留 `unsafe-eval`，后续应通过独立预览域或无求值渲染器移除。

实时预览面向编辑器产生的受控 MDX，而不是多租户场景下的任意不可信代码。若未来允许直接粘贴或上传任意 MDX，应将编译与执行迁移到隔离进程或沙箱域，并增加 AST 级表达式策略、CSP 和资源域名白名单。

## 后续演进

- 基于 MDX AST 的双向导入
- MDX AST 双向导入后的表达式级安全策略
- 图片/附件上传、资源库、公式引擎与白板运行时
- 自动保存、草稿版本、协作光标和评论
- Mermaid 图形运行时与独立沙箱域
