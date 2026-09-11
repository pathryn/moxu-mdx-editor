# 墨序 MDX

[English](README.en.md) · 中文

> 发布状态：社区预览版，采用 [MIT License](LICENSE)。

墨序 MDX 是一个面向中文内容创作的可视化 MDX 编辑器。它把 Tiptap 的结构化文档模型、MUI 的界面组件与 MDX 序列化组合在一起：作者在接近富文本的画布中写作，业务组件以可编辑内容块呈现，保存时同时获得 JSON 与 MDX。

## 核心特点

- Header + 响应式双栏工作区：宽屏使用 760px 文稿版心与 328px 工具轨道，窄屏自动切换工具抽屉
- MUI 风格的浮动工具条、弹出设置面板与全屏写作
- 标题、列表、引用、代码、链接、图片、对齐等常用排版能力
- 输入 `/` 打开跟随光标的命令菜单，支持搜索、方向键、Enter 执行与 Esc 关闭
- 右侧插入面板与斜杠菜单共用同一个命令注册表，新增组件无需维护两套入口
- Callout、Figure、Gallery、Columns、Tabs、Audio、Video、Attachment、MetricGrid、Badge、Card、Details、Highlight、Embed、Kanban、Flowchart 等可视化 MDX 组件
- Markdown 表格、任务列表、六级标题与六种分隔符
- 组件标签默认不进入创作视野，画布内直接呈现组件效果
- 编辑器状态输出为 Tiptap JSON，并同步序列化为可持久化的 MDX
- Header 一键打开实时发布预览，支持标题锚点、Shiki 代码高亮和组件白名单
- 独立的 `MdxEditor` 组件，可嵌入 Next.js 客户端页面

## 启动项目

```bash
pnpm install --frozen-lockfile
pnpm dev
```

访问 `http://localhost:3000`。生产环境可执行：

```bash
pnpm build
pnpm start
```

## 基本用法

```tsx
"use client";

import { MdxEditor, sampleDocument } from "@/components/mdx-editor";

export default function WritingPage() {
  return (
    <MdxEditor
      initialContent={sampleDocument}
      minHeight={620}
      onChange={({ json, mdx }) => {
        // json 适合恢复编辑现场，mdx 适合发布与版本管理。
        console.log(json, mdx);
      }}
    />
  );
}
```

组件 API、自定义节点方法与数据流说明见：

- [使用文档](docs/zh-CN/USAGE.md)
- [架构文档](docs/zh-CN/ARCHITECTURE.md)
- [安全政策](SECURITY.md)
- [参与贡献](CONTRIBUTING.md)
- [发布决策](docs/OPEN_SOURCE_DECISIONS.md)

## 项目结构

```text
src/
├── app/                         # 产品演示工作台
│   └── api/mdx/compile/         # 受控 MDX 服务端编译接口
├── components/mdx-editor/
│   ├── mdx-editor.tsx           # 编辑器入口与状态管理
│   ├── toolbar.tsx              # MUI 工具栏与弹层
│   ├── command-registry.ts      # 右栏与斜杠菜单共用的命令注册表
│   ├── slash-command-controller.tsx # 监听选区并控制斜杠菜单
│   ├── slash-command-menu.tsx   # 跟随光标的 MUI 命令菜单
│   ├── insert-content.ts        # 统一的光标位置插入命令
│   ├── extensions.tsx           # MDX 自定义节点及 NodeView
│   ├── serializer.ts            # Tiptap JSON → MDX
│   ├── editor-styles.tsx        # 编辑画布视觉系统
│   └── types.ts                 # 公共类型
├── components/mdx-runtime/      # 发布态组件注册表与实时预览
├── lib/mdx-security.ts          # MDX 预览输入安全约束
└── theme/                       # MUI 主题
```

## 当前边界

- 当前以结构化 JSON 作为可恢复编辑的源数据，暂未提供任意 MDX 文本的反向解析。
- 图片组件目前接受 URL；接入对象存储后可将上传结果写入节点属性。
- 演示工作台只在浏览器内维护草稿，未绑定数据库、鉴权或发布接口。
- 实时预览只接受编辑器产生的受控 MDX；开放任意 MDX 上传前仍需部署隔离沙箱。

## 外部嵌入与安全

外部 iframe 默认关闭。复制 `.env.example` 并通过 `NEXT_PUBLIC_MDX_EMBED_HOSTS` 明确配置已审核的 HTTPS 域名。生产环境还应在网关实施分布式限流，并隔离 MDX 编译进程。完整边界见 [SECURITY.md](SECURITY.md)。

## 质量检查

```bash
pnpm check
pnpm audit --prod
```

项目使用 MIT License、语义化版本、Keep a Changelog、DCO 签署和 GitHub Actions 检查。当前仓库按演示应用维护，仍保留 `private: true`；是否拆分并发布 npm 包见[发布决策](docs/OPEN_SOURCE_DECISIONS.md)。
