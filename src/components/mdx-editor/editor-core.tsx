"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { IconButton, Paper, Tooltip } from "@mui/material";
import { Bold, Code2, Highlighter, Italic, Link2, Strikethrough, Underline } from "lucide-react";
import { EditorCanvas } from "./editor-styles";
import { editorClasses } from "./editor-classes";
import { TableActionBar } from "./table-action-bar";
import { ContentItemMenu } from "./content-item-menu";
import { SlashCommandController } from "./slash-command-controller";

type Props = { editor: Editor; minHeight: number; fullscreen: boolean };

export function EditorCore({ editor, minHeight, fullscreen }: Props) {
  const state = useEditorState({ editor, selector: ({ editor: current }) => ({ bold: current.isActive("bold"), italic: current.isActive("italic"), underline: current.isActive("underline"), strike: current.isActive("strike"), code: current.isActive("code"), highlight: current.isActive("highlight") }) });
  const items = [
    { title: "粗体", active: state.bold, icon: <Bold size={17}/>, action: () => editor.chain().focus().toggleBold().run() },
    { title: "斜体", active: state.italic, icon: <Italic size={17}/>, action: () => editor.chain().focus().toggleItalic().run() },
    { title: "下划线", active: state.underline, icon: <Underline size={17}/>, action: () => editor.chain().focus().toggleUnderline().run() },
    { title: "删除线", active: state.strike, icon: <Strikethrough size={17}/>, action: () => editor.chain().focus().toggleStrike().run() },
    { title: "高亮", active: state.highlight, icon: <Highlighter size={17}/>, action: () => editor.chain().focus().toggleHighlight({ color: "#FFF3A3" }).run() },
    { title: "行内代码", active: state.code, icon: <Code2 size={17}/>, action: () => editor.chain().focus().toggleCode().run() },
    { title: "链接", active: false, icon: <Link2 size={17}/>, action: () => editor.chain().focus().setLink({ href: "https://" }).run() },
  ];

  return <EditorCanvas className={editorClasses.root} sx={{ height: "100%", minHeight: fullscreen ? 0 : Math.max(420, minHeight - 142), display: "flex", flexDirection: "column" }}>
    <BubbleMenu editor={editor} options={{ placement: "top" }}><Paper elevation={8} sx={{ display: "flex", gap: .5, p: .5, border: 1, borderColor: "divider" }}>{items.map((item) => <Tooltip title={item.title} key={item.title}><IconButton aria-label={item.title} size="small" onMouseDown={(event) => event.preventDefault()} onClick={item.action} sx={{ width: 28, height: 28, borderRadius: .75, bgcolor: item.active ? "action.selected" : "transparent", color: item.active ? "primary.main" : "text.secondary" }}>{item.icon}</IconButton></Tooltip>)}</Paper></BubbleMenu>
    <EditorContent editor={editor} spellCheck={false} autoComplete="off" autoCapitalize="off" className={editorClasses.content.root} style={{ minHeight: "inherit", flex: 1 }}/>
    <ContentItemMenu editor={editor}/>
    <SlashCommandController editor={editor}/>
    <TableActionBar editor={editor}/>
  </EditorCanvas>;
}
