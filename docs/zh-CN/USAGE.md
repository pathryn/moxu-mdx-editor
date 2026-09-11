# 墨序 MDX 使用文档

## 组件属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `initialContent` | `JSONContent` | Tiptap JSON 初始文档；未传入时使用中文示例内容 |
| `placeholder` | `string` | 空文档提示语 |
| `minHeight` | `number` | 非全屏状态下的最小编辑高度 |
| `fullToolbar` | `boolean` | 是否显示完整工具栏，默认 `true` |
| `onChange` | `(value) => void` | 内容更新回调，返回 `{ json, mdx }` |
| `sx` | `SxProps<Theme>` | 传给编辑器外壳的 MUI 样式 |

## 内容保存

推荐同时保存两种格式：

```ts
type ArticleDraft = {
  editorState: JSONContent;
  mdxSource: string;
};
```

- `editorState` 用于重新进入编辑器时还原节点、选区语义和组件属性。
- `mdxSource` 用于构建、发布、搜索索引或提交到 Git。

如果 MDX 是唯一数据源，需要另行实现 MDX AST 到 Tiptap JSON 的解析层。不要用已序列化的 MDX 覆盖编辑状态，否则自定义节点的属性可能丢失。

## 内置 MDX 组件

### 斜杠命令

在空段落中输入 `/` 可打开组件和格式命令。继续输入“表格”“双栏”“音频”等名称可筛选，使用方向键选择并按 Enter 插入。右侧“插入”面板与该菜单共用命令定义。

### 布局与媒体

编辑器提供双栏、标签页、图库、音频、视频和附件节点，分别输出为 `<Columns>`、`<Tabs>`、`<Gallery>`、`<Audio>`、`<Video>` 与 `<Attachment>`。选中节点后可在属性面板编辑资源地址、标题、说明和替代文本；视频额外支持封面图片，图库支持列数、图注与图片增删。

右侧“插入”面板按以下层级组织：

- 快速插入：文本、表格、卡片、图片
- 常用：引用、代码块、实线、虚线
- 区块：提示框、指标组、徽章、折叠块、高亮块、网页、看板、流程图
- 列表：有序列表、无序列表、任务列表
- 分割符：实线、虚线、点线、双实线、渐隐线、装饰线
- 文本样式：标题 1–6

公式、附件和画板保留了明确的禁用入口，等待后续接入公式引擎、对象存储和画布运行时。

### Callout

工具栏的“组件”菜单可插入提示块。标题与正文均可直接在画布中编辑，输出格式为：

```mdx
<Callout title="内容提示" tone="info">
  直接编辑这段说明。
</Callout>
```

### Figure

通过图片按钮填写图片地址、替代文本和图注，输出为自闭合组件：

```mdx
<Figure src="/images/example.jpg" alt="图片说明" caption="图注" />
```

### MetricGrid

指标组在编辑器内显示为卡片网格，发布时输出 `MetricGrid` 与多个 `Metric`：

```mdx
<MetricGrid>
  <Metric value="68%" label="完成进度" />
</MetricGrid>
```

### Badge

徽标是行内节点，可在当前光标位置插入并继续输入：

```mdx
<Badge tone="success">MDX 组件</Badge>
```

### Card、Details 与 Highlight

这三个组件的正文可以直接在画布内编辑：

```mdx
<Card title="内容卡片">
  直接编辑卡片正文。
</Card>

<Details summary="展开查看详情">
  这里是折叠区域的详细内容。
</Details>

<Highlight tone="yellow">
  需要读者重点关注的内容。
</Highlight>
```

### Tabs

插入“标签页”后，可直接切换标签并编辑当前面板正文。选中整个组件后，在右侧属性面板修改标签名，或在 2–6 个标签之间增删：

```mdx
<Tabs defaultValue="tab-1">
  <Tab value="tab-1" label="概览">
    概览正文
  </Tab>
  <Tab value="tab-2" label="详情">
    详细内容
  </Tab>
</Tabs>
```

### Embed、Kanban 与 Flowchart

复杂组件在编辑器内以不可拆分的可视化节点呈现。网页嵌入可以设置显示比例，看板可以编辑 2–5 个列名，流程图使用 Mermaid 源码，输出为受控 MDX：

```mdx
<Embed title="网页嵌入" url="https://example.com" aspectRatio="16/9" />
<Kanban title="内容看板">
  <KanbanColumn title="待处理">
    整理文章结构
  </KanbanColumn>
  <KanbanColumn title="进行中">
    编写主要内容
  </KanbanColumn>
</Kanban>
<Flowchart title="内容流程" source={"graph LR\n  A[开始] --> B[编辑] --> C[发布]"} />
```

### Gallery、Audio、Video 与 Attachment

```mdx
<Gallery items={[{"src":"/images/a.jpg","alt":"山间清晨"}]} columns={3} caption="旅途记录" />
<Audio title="访谈录音" src="/media/interview.mp3" description="第 12 期" />
<Video title="功能演示" src="/media/demo.mp4" poster="/images/demo-cover.jpg" />
<Attachment title="资料下载" src="/files/guide.pdf" description="PDF 文档" />
```

## 接入内容系统

1. 在客户端页面引入 `MdxEditor`。
2. 从接口加载 `editorState` 并传给 `initialContent`。
3. 在 `onChange` 中缓存最新的 JSON 与 MDX。
4. 用户保存时将两者提交到后端。
5. 发布端将 MDX 交给受控的组件映射表渲染，避免允许未知组件执行。

## 实时预览

点击 Header 的眼睛图标打开文章预览。`MdxPreview` 会在内容停止变化 280ms 后请求 `POST /api/mdx/compile`，服务端执行 rehype 标题锚点和 Shiki 代码高亮，然后由 `mdxComponents` 白名单渲染。

独立页面也可直接使用：

```tsx
import { MdxPreview } from "@/components/mdx-runtime";

<MdxPreview title="文章标题" source={mdxSource} />
```

新增 MDX 组件必须同时注册编辑态 NodeView、序列化规则和 `src/components/mdx-runtime/components.tsx` 中的发布态实现，否则编译可以成功，但预览会报告未知组件。

## 扩展新组件

新增组件需要同步完成四处工作：

1. 在 `extensions.tsx` 定义节点 schema、属性和 MUI NodeView。
2. 在 `serializer.ts` 增加该节点到 MDX 的序列化规则。
3. 在命令注册表与属性面板增加插入、配置入口，并由 `mdx-editor.tsx` 注册节点。
4. 在 `mdx-runtime/components.tsx` 增加白名单发布组件。

同时必须在 `src/lib/mdx-security.ts` 为新组件登记允许的属性；属性表达式只能包含字符串、数字、布尔值、数组或普通对象等数据字面量。

建议为复杂组件增加独立属性面板，不要把所有配置暴露为原始标签文本。
