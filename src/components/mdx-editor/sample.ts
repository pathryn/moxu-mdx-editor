import type { JSONContent } from "@tiptap/core";

export const sampleDocument: JSONContent = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "墨序把 Markdown 的轻便与结构化内容组件结合在同一个写作界面中。" }] },
    { type: "calloutBlock", content: [
      { type: "paragraph", content: [{ type: "text", text: "编辑提示" }] },
      { type: "paragraph", content: [{ type: "text", text: "正文与组件都可以直接编辑，MDX 标记只在导出时生成。" }] },
    ] },
    { type: "paragraph", content: [{ type: "text", text: "选择文字可以使用浮动工具栏，也可以从右侧工具栏插入新的结构。" }] },
    { type: "metricsBlock", attrs: { metrics: [
      { value: "100%", label: "结构化输出" },
      { value: "0", label: "可见 JSX 标签" },
      { value: "1 个", label: "统一写作画布" },
    ] } },
    { type: "tabsBlock", content: [
      { type: "tabPanel", attrs: { label: "写作体验", value: "tab-1" }, content: [{ type: "paragraph", content: [{ type: "text", text: "组件在编辑器中以内容块呈现，正文可直接修改。" }] }] },
      { type: "tabPanel", attrs: { label: "发布结果", value: "tab-2" }, content: [{ type: "paragraph", content: [{ type: "text", text: "导出时生成结构清晰、可维护的 Tabs 与 Tab 标记。" }] }] },
    ] },
    { type: "paragraph", content: [{ type: "badgeNode", attrs: { text: "MDX 就绪", tone: "success" } }, { type: "text", text: " 现在可以继续补充你的文章。" }] },
  ],
};
