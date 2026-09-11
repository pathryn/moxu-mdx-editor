import type { LucideIcon } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { BarChart3, Braces, Columns3, FileAudio, FileCode2, GalleryHorizontal, Heading1, Heading2, Heading3, Highlighter, Image, LayoutPanelTop, Link, List, ListChecks, ListOrdered, Minus, PanelsTopLeft, Paperclip, Quote, Table2, Tag, Type, Video, Workflow } from "lucide-react";
import { insertMdxContent } from "./insert-content";

export type EditorCommand = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  run: (editor: Editor) => boolean;
};

export type EditorCommandGroup = { id: string; label: string; commands: EditorCommand[] };

const command = (id: string, label: string, description: string, icon: LucideIcon, keywords: string[], run: (editor: Editor) => boolean): EditorCommand => ({ id, label, description, icon, keywords, run });

export const editorCommandGroups: EditorCommandGroup[] = [
  { id: "basic", label: "基础", commands: [
    command("paragraph", "正文", "普通文本段落", Type, ["text", "wenben"], (editor) => editor.chain().focus().setParagraph().run()),
    command("heading-1", "一级标题", "页面主标题", Heading1, ["h1", "title"], (editor) => editor.chain().focus().setHeading({ level: 1 }).run()),
    command("heading-2", "二级标题", "章节标题", Heading2, ["h2", "title"], (editor) => editor.chain().focus().setHeading({ level: 2 }).run()),
    command("heading-3", "三级标题", "小节标题", Heading3, ["h3", "title"], (editor) => editor.chain().focus().setHeading({ level: 3 }).run()),
    command("bullet-list", "符号列表", "无序列表", List, ["bullet", "list"], (editor) => editor.chain().focus().toggleBulletList().run()),
    command("ordered-list", "编号列表", "有序列表", ListOrdered, ["number", "list"], (editor) => editor.chain().focus().toggleOrderedList().run()),
    command("task-list", "任务列表", "可勾选待办事项", ListChecks, ["todo", "task"], (editor) => editor.chain().focus().toggleTaskList().run()),
    command("quote", "引用", "强调引用内容", Quote, ["blockquote", "yinyong"], (editor) => editor.chain().focus().toggleBlockquote().run()),
    command("code-block", "代码块", "多行代码内容", FileCode2, ["code", "daima"], (editor) => editor.chain().focus().toggleCodeBlock().run()),
  ] },
  { id: "structure", label: "结构", commands: [
    command("tabs", "标签页 Tabs", "Tabs / Tab 可切换内容", PanelsTopLeft, ["tabs", "tab", "标签页", "biaoqian"], (editor) => insertMdxContent(editor, "tabs")),
    command("table", "表格", "插入 3 × 3 表格", Table2, ["table", "biaoge"], (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()),
    command("columns", "双栏", "并排组织两组内容", Columns3, ["column", "fenlan"], (editor) => insertMdxContent(editor, "columns")),
    command("card", "卡片", "带标题的内容容器", LayoutPanelTop, ["card", "kapian"], (editor) => insertMdxContent(editor, "card")),
    command("details", "折叠块", "可展开的补充内容", Braces, ["details", "accordion"], (editor) => insertMdxContent(editor, "details")),
    command("callout", "提示框", "提示、注意或说明", Quote, ["callout", "notice"], (editor) => insertMdxContent(editor, "callout")),
    command("highlight", "高亮块", "突出重要段落", Highlighter, ["highlight", "gaoliang"], (editor) => insertMdxContent(editor, "highlight")),
    command("metrics", "指标组", "展示关键数据", BarChart3, ["metric", "data"], (editor) => insertMdxContent(editor, "metrics")),
  ] },
  { id: "media", label: "媒体", commands: [
    command("figure", "图片", "带说明的文章图片", Image, ["image", "figure"], (editor) => insertMdxContent(editor, "figure")),
    command("gallery", "图库", "多图并列展示", GalleryHorizontal, ["gallery", "tuku"], (editor) => insertMdxContent(editor, "gallery")),
    command("audio", "音频", "插入音频播放器", FileAudio, ["audio", "yinpin"], (editor) => insertMdxContent(editor, "audio")),
    command("video", "视频", "插入视频播放器", Video, ["video", "shipin"], (editor) => insertMdxContent(editor, "video")),
    command("attachment", "附件", "插入下载附件", Paperclip, ["file", "attachment"], (editor) => insertMdxContent(editor, "attachment")),
    command("embed", "网页嵌入", "嵌入外部页面", Link, ["iframe", "embed"], (editor) => insertMdxContent(editor, "embed")),
  ] },
  { id: "advanced", label: "扩展", commands: [
    command("kanban", "看板", "三列内容看板", LayoutPanelTop, ["kanban"], (editor) => insertMdxContent(editor, "kanban")),
    command("diagram", "流程图", "结构化流程内容", Workflow, ["flowchart", "diagram"], (editor) => insertMdxContent(editor, "diagram")),
    command("badge", "徽章", "行内状态标签", Tag, ["badge", "tag"], (editor) => insertMdxContent(editor, "badge")),
    command("divider", "分割线", "分隔内容章节", Minus, ["divider", "line"], (editor) => insertMdxContent(editor, "divider")),
  ] },
];

export const allEditorCommands = editorCommandGroups.flatMap((group) => group.commands);
export const getEditorCommand = (id: string) => allEditorCommands.find((item) => item.id === id);

export function filterEditorCommandGroups(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return editorCommandGroups;
  return editorCommandGroups.map((group) => ({ ...group, commands: group.commands.filter((item) => [item.label, item.description, ...item.keywords].some((value) => value.toLowerCase().includes(normalized))) })).filter((group) => group.commands.length);
}
