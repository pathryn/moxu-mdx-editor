import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";

export type InsertKind = "callout" | "figure" | "metrics" | "badge" | "card" | "details" | "highlight" | "embed" | "kanban" | "diagram" | "divider" | "columns" | "tabs" | "gallery" | "audio" | "video" | "attachment";

function insertAndSelect(editor: Editor, content: JSONContent | JSONContent[], nodeType: string) {
  const origin = editor.state.selection.from;
  const inserted = editor.chain().focus().insertContent(content).run();
  if (!inserted) return false;

  let nearest = -1;
  let distance = Number.POSITIVE_INFINITY;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== nodeType) return;
    const nextDistance = Math.abs(pos - origin);
    if (nextDistance < distance) {
      nearest = pos;
      distance = nextDistance;
    }
  });
  if (nearest >= 0) editor.commands.setNodeSelection(nearest);
  return true;
}

function insertAndFocusFirstText(editor: Editor, content: JSONContent, nodeType: string) {
  const origin = editor.state.selection.from;
  const inserted = editor.chain().focus().insertContent(content).run();
  if (!inserted) return false;

  let nearest = -1;
  let distance = Number.POSITIVE_INFINITY;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== nodeType) return;
    const nextDistance = Math.abs(pos - origin);
    if (nextDistance < distance) {
      nearest = pos;
      distance = nextDistance;
    }
  });

  // tabsBlock → tabPanel → paragraph → text cursor
  if (nearest >= 0) editor.chain().focus().setTextSelection(nearest + 3).run();
  return true;
}

export function insertMdxContent(editor: Editor, kind: InsertKind, attributes: Record<string, unknown> = {}) {
  if (kind === "callout") return insertAndSelect(editor, { type: "calloutBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "内容提示" }] }, { type: "paragraph", content: [{ type: "text", text: "直接编辑这段说明。" }] }] }, "calloutBlock");
  if (kind === "figure") return insertAndSelect(editor, { type: "figureBlock", attrs: attributes }, "figureBlock");
  if (kind === "metrics") return insertAndSelect(editor, { type: "metricsBlock", attrs: { metrics: [{ value: "68%", label: "完成进度" }, { value: "24", label: "内容模块" }, { value: "4.9", label: "编辑体验" }] } }, "metricsBlock");
  if (kind === "card") return insertAndSelect(editor, { type: "cardBlock", attrs: { variant: "default" }, content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "卡片标题" }] }, { type: "paragraph", content: [{ type: "text", text: "卡片内容" }] }] }, "cardBlock");
  if (kind === "details") return insertAndSelect(editor, { type: "detailsBlock", attrs: { summary: "折叠标题", defaultOpen: false }, content: [{ type: "paragraph", content: [{ type: "text", text: "折叠内容" }] }] }, "detailsBlock");
  if (kind === "highlight") return insertAndSelect(editor, { type: "highlightBlock", attrs: { tone: "yellow" }, content: [{ type: "paragraph", content: [{ type: "text", text: "需要读者重点关注的内容。" }] }] }, "highlightBlock");
  if (["embed", "diagram"].includes(kind)) return insertAndSelect(editor, { type: "widgetBlock", attrs: { kind, title: kind === "embed" ? "网页嵌入" : "内容流程", source: kind === "diagram" ? "graph LR\n  A[开始] --> B[编辑] --> C[发布]" : "", aspectRatio: "16/9" } }, "widgetBlock");
  if (kind === "kanban") return insertAndSelect(editor, { type: "kanbanBlock", attrs: { title: "内容看板" }, content: ["待处理", "进行中", "已完成"].map((title) => ({ type: "kanbanColumn", content: [{ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: title }] }, { type: "paragraph" }] })) }, "kanbanBlock");
  if (kind === "divider") return insertAndSelect(editor, { type: "styledDivider", attrs: { variant: attributes.variant ?? "solid" } }, "styledDivider");
  if (kind === "columns") return insertAndSelect(editor, { type: "columnsBlock", content: [{ type: "columnBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "左栏内容" }] }] }, { type: "columnBlock", content: [{ type: "paragraph", content: [{ type: "text", text: "右栏内容" }] }] }] }, "columnsBlock");
  if (kind === "tabs") return insertAndFocusFirstText(editor, { type: "tabsBlock", content: [{ type: "tabPanel", attrs: { label: "概览", value: "tab-1" }, content: [{ type: "paragraph", content: [{ type: "text", text: "在这里编辑概览内容。" }] }] }, { type: "tabPanel", attrs: { label: "详情", value: "tab-2" }, content: [{ type: "paragraph", content: [{ type: "text", text: "在这里编辑详细内容。" }] }] }] }, "tabsBlock");
  if (kind === "gallery") return insertAndSelect(editor, { type: "galleryBlock", attrs: { items: [{ alt: "", src: "" }, { alt: "", src: "" }, { alt: "", src: "" }], columns: 3, caption: "" } }, "galleryBlock");
  if (["audio", "video", "attachment"].includes(kind)) return insertAndSelect(editor, { type: "mediaBlock", attrs: { kind, title: kind === "audio" ? "音频标题" : kind === "video" ? "视频标题" : "附件名称", src: "", description: "", poster: "" } }, "mediaBlock");
  if (kind === "badge") {
    const position = editor.state.selection.to;
    const resolved = editor.state.doc.resolve(position);
    const badge = [{ type: "badgeNode", attrs: { text: "状态", tone: "success" } }, { type: "text", text: " " }];
    if (resolved.parent.inlineContent) return insertAndSelect(editor, badge, "badgeNode");
    const inserted = editor.chain().focus().insertContentAt(position, { type: "paragraph", content: badge }, { updateSelection: true }).run();
    if (inserted) {
      const badgePosition = Math.max(0, editor.state.selection.from - 2);
      editor.state.doc.nodesBetween(badgePosition, editor.state.selection.from, (node, pos) => { if (node.type.name === "badgeNode") editor.commands.setNodeSelection(pos); });
    }
    return inserted;
  }
  return false;
}
