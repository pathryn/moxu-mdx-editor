"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop, Box, Button, Chip, Divider, Drawer, InputBase, Paper, Portal, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Placeholder } from "@tiptap/extensions";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { useEditor, useEditorState } from "@tiptap/react";
import { BadgeNode, CalloutBlock, CardBlock, ColumnBlock, ColumnsBlock, DetailsBlock, FigureBlock, GalleryBlock, HighlightBlock, KanbanBlock, KanbanColumn, MediaBlock, MetricsBlock, StyledDivider, TabPanel, TabsBlock, WidgetBlock } from "./extensions";
import { EditorShell } from "./editor-styles";
import { editorClasses } from "./editor-classes";
import { EditorCore } from "./editor-core";
import { EditorToolbar } from "./toolbar";
import { sampleDocument } from "./sample";
import { toMdx } from "./serializer";
import type { MdxEditorProps } from "./types";
import { SlidersHorizontal, X } from "lucide-react";

export function MdxEditor({ initialContent = sampleDocument, title = "把复杂内容写得更清楚", onTitleChange, placeholder = "输入 / 显示命令", minHeight = 620, fullToolbar = true, onChange, sx }: MdxEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    content: initialContent,
    editorProps: { attributes: { autocomplete: "off", autocorrect: "off", autocapitalize: "off", spellcheck: "false" } },
    extensions: [
      StarterKit.configure({
        dropcursor: { class: "moxu-editor-dropcursor", color: "#5865F2", width: 2 },
        code: { HTMLAttributes: { class: editorClasses.content.codeInline } },
        heading: { levels: [1, 2, 3, 4, 5, 6], HTMLAttributes: { class: editorClasses.content.heading } },
        horizontalRule: { HTMLAttributes: { class: editorClasses.content.hr } },
        listItem: { HTMLAttributes: { class: editorClasses.content.listItem } },
        blockquote: { HTMLAttributes: { class: editorClasses.content.blockquote } },
        bulletList: { HTMLAttributes: { class: editorClasses.content.bulletList } },
        orderedList: { HTMLAttributes: { class: editorClasses.content.orderedList } },
        link: { autolink: true, openOnClick: false, linkOnPaste: true, HTMLAttributes: { class: editorClasses.content.link, rel: "noopener noreferrer", target: "_blank" } },
      }),
      TextStyle,
      Color,
      FontSize,
      LineHeight.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ includeChildren: true, placeholder, emptyEditorClass: "is-editor-empty", emptyNodeClass: "is-empty" }),
      CalloutBlock,
      FigureBlock,
      MetricsBlock,
      BadgeNode,
      CardBlock,
      DetailsBlock,
      HighlightBlock,
      WidgetBlock,
      KanbanColumn,
      KanbanBlock,
      StyledDivider,
      ColumnBlock,
      ColumnsBlock,
      TabPanel,
      TabsBlock,
      GalleryBlock,
      MediaBlock,
      Table.configure({ resizable: true, HTMLAttributes: { class: editorClasses.content.table } }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({ HTMLAttributes: { class: editorClasses.content.taskList } }),
      TaskItem.configure({ nested: true }),
    ],
    onUpdate: ({ editor: current }) => {
      const json = current.getJSON();
      onChangeRef.current?.({ json, mdx: toMdx(json) });
    },
  });

  const editorStats = useEditorState({ editor, selector: ({ editor: current }) => ({ chars: current?.getText().replace(/\s/g, "").length ?? 0 }) });
  const toggleFullscreen = useCallback(() => setFullscreen((current) => !current), []);
  const toggleToolsCollapsed = useCallback(() => setToolsCollapsed((current) => {
    const next = !current;
    window.localStorage.setItem("moxu-tools-collapsed", String(next));
    return next;
  }), []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setToolsCollapsed(window.localStorage.getItem("moxu-tools-collapsed") === "true"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [fullscreen]);

  if (!editor) return <Paper sx={{ minHeight, borderRadius: 3, display: "grid", placeItems: "center", color: "text.secondary", ...sx }}><Typography variant="body2">正在准备编辑器…</Typography></Paper>;

  const workspace = <Box sx={{ width: "100%", flex: 1, display: "grid", alignItems: "stretch", gridTemplateColumns: "minmax(0, 1fr)", minHeight: { xs: minHeight, lg: 0 }, height: { xs: "auto", lg: "100%" }, overflow: "hidden", bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, boxShadow: "0 8px 28px rgba(16,24,40,.06)", "@media (min-width:1200px)": { gridTemplateColumns: `minmax(720px, 1fr) ${toolsCollapsed ? 56 : 336}px`, transition: "grid-template-columns .18s ease" }, ...(fullscreen && { position: "fixed", inset: 16, zIndex: (theme) => theme.zIndex.modal, minHeight: 0, height: "auto", gridTemplateColumns: `minmax(720px, 1fr) ${toolsCollapsed ? 56 : 336}px !important` }) }}>
    <EditorShell fullscreen={fullscreen} sx={{ minWidth: 0, height: fullscreen ? "100%" : { xs: "auto", lg: "100%" }, minHeight, ...sx }}>
      <Box sx={{ px: { xs: 2.5, md: 3.25 }, pt: { xs: 2.5, md: 3 }, pb: 1.75 }}><Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ width: "100%", maxWidth: 760, mx: "auto" }}><InputBase fullWidth multiline value={title} placeholder="输入标题…" inputProps={{ "aria-label": "文章标题" }} onChange={(event) => onTitleChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} sx={{ "& .MuiInputBase-input": { fontSize: { xs: 25, md: 31 }, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-.03em", "&::placeholder": { color: "text.disabled", opacity: 1 } } }}/><Button color="inherit" variant="outlined" startIcon={<SlidersHorizontal size={16}/>} onClick={() => setToolsOpen(true)} sx={{ display: { xs: "inline-flex", lg: "none" }, flexShrink: 0 }}>工具</Button></Stack></Box>
      <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}><EditorCore editor={editor} minHeight={minHeight} fullscreen={fullscreen}/></Box>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, py: .9, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}><Chip size="small" label="MDX 就绪" color="success" variant="outlined" sx={{ height: 22, fontSize: 10 }}/><Typography variant="caption" color="text.secondary">{editorStats?.chars || editor.getText().replace(/\s/g, "").length} 字</Typography><Divider orientation="vertical" flexItem/><Typography variant="caption" color="text.secondary">结构化 JSON → MDX</Typography><Box flex={1}/><Typography variant="caption" color="text.disabled">{fullscreen ? "Esc 退出专注模式" : "编辑内容实时转换"}</Typography></Stack>
    </EditorShell>

    <Box sx={{ width: toolsCollapsed ? 56 : 336, height: "100%", minHeight: 0, overflow: "hidden", borderLeft: 1, borderColor: "divider", bgcolor: "#FAFBFC", display: { xs: "none", lg: "block" }, transition: "width .18s ease" }}><EditorToolbar editor={editor} fullToolbar={fullToolbar} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} collapsed={toolsCollapsed} onToggleCollapsed={toggleToolsCollapsed}/></Box>
    <Drawer anchor="right" open={toolsOpen} onClose={() => setToolsOpen(false)} slotProps={{ paper: { sx: { width: { xs: "min(92vw, 360px)", sm: 360 }, p: 1.5 } } }}><Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, pb: 1 }}><Typography variant="subtitle1" fontWeight={800}>编辑工具</Typography><Button color="inherit" startIcon={<X size={16}/>} onClick={() => setToolsOpen(false)}>关闭</Button></Stack><Box sx={{ flex: 1, minHeight: 0 }}><EditorToolbar editor={editor} fullToolbar={fullToolbar} fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen}/></Box></Drawer>
  </Box>;

  return <Portal disablePortal={!fullscreen}>{fullscreen && <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal - 1, bgcolor: alpha("#101828", .62) }}/>} {workspace}</Portal>;
}
