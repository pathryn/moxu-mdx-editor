"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { Box, ButtonBase, Divider, IconButton, ListSubheader, Menu, MenuItem, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Copy, FileText, GripVertical, Heading2, Image, List as ListIcon, MessageSquareText, Plus, Quote, RemoveFormatting, Table2, Trash2 } from "lucide-react";
import { getEditorCommand } from "./command-registry";

const quickInsertions = [
  { id: "paragraph", label: "正文", hint: "继续书写", icon: FileText },
  { id: "heading-2", label: "二级标题", hint: "新建章节", icon: Heading2 },
  { id: "bullet-list", label: "符号列表", hint: "整理要点", icon: ListIcon },
  { id: "quote", label: "引用", hint: "突出原文", icon: Quote },
  { id: "callout", label: "提示框", hint: "补充说明", icon: MessageSquareText },
  { id: "figure", label: "图片", hint: "图文内容", icon: Image },
  { id: "table", label: "表格", hint: "结构化数据", icon: Table2 },
];

export function ContentItemMenu({ editor }: { editor: Editor }) {
  const nodeRef = useRef<ProseMirrorNode | null>(null);
  const posRef = useRef(-1);
  const draggingRef = useRef(false);
  const [insertAnchor, setInsertAnchor] = useState<HTMLElement | null>(null);
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);

  const finishDragging = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    editor.view.dom.closest(".moxu-editor-root")?.classList.remove("is-block-dragging");
    if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta("hideDragHandle", true));
  }, [editor]);

  useEffect(() => {
    editor.commands.setMeta("lockDragHandle", Boolean(insertAnchor || actionAnchor));
    return () => { if (!editor.isDestroyed) editor.commands.setMeta("lockDragHandle", false); };
  }, [actionAnchor, editor, insertAnchor]);

  useEffect(() => {
    const scroller = editor.view.dom.closest(".moxu-editor-content");
    const root = editor.view.dom.closest(".moxu-editor-root");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      root?.classList.add("is-content-scrolling");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => root?.classList.remove("is-content-scrolling"), 140);
    };
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    return () => { scroller?.removeEventListener("scroll", onScroll); root?.classList.remove("is-content-scrolling"); if (timer) clearTimeout(timer); };
  }, [editor]);

  useEffect(() => {
    const finish = () => finishDragging();
    document.addEventListener("drop", finish, true);
    document.addEventListener("dragend", finish, true);
    window.addEventListener("pointerup", finish, true);
    window.addEventListener("blur", finish);
    return () => {
      document.removeEventListener("drop", finish, true);
      document.removeEventListener("dragend", finish, true);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("blur", finish);
      editor.view.dom.closest(".moxu-editor-root")?.classList.remove("is-block-dragging");
    };
  }, [editor, finishDragging]);

  const closeMenus = () => { setInsertAnchor(null); setActionAnchor(null); };
  const prepareParagraphAfter = () => {
    const node = nodeRef.current;
    if (!node || posRef.current < 0) return false;
    const position = posRef.current + node.nodeSize;
    return editor.chain().focus().insertContentAt(position, { type: "paragraph" }).setTextSelection(position + 1).run();
  };
  const addAfter = (commandId = "paragraph") => {
    if (!prepareParagraphAfter()) return;
    if (commandId !== "paragraph") getEditorCommand(commandId)?.run(editor);
    closeMenus();
  };
  const duplicate = () => {
    const node = nodeRef.current;
    if (!node || posRef.current < 0) return;
    editor.chain().focus().insertContentAt(posRef.current + node.nodeSize, node.toJSON()).run();
    closeMenus();
  };
  const clearFormatting = () => {
    const node = nodeRef.current;
    if (!node || posRef.current < 0) return;
    if (["paragraph", "heading"].includes(node.type.name) && node.attrs.lineHeight) editor.view.dispatch(editor.state.tr.setNodeMarkup(posRef.current, undefined, { ...node.attrs, lineHeight: null }));
    editor.chain().focus().setTextSelection({ from: posRef.current + 1, to: Math.max(posRef.current + 1, posRef.current + node.nodeSize - 1) }).unsetAllMarks().clearNodes().run();
    closeMenus();
  };
  const remove = () => {
    const node = nodeRef.current;
    if (!node || posRef.current < 0) return;
    editor.chain().focus().deleteRange({ from: posRef.current, to: posRef.current + node.nodeSize }).run();
    closeMenus();
  };

  return <>
    <DragHandle editor={editor} pluginKey="contentItemMenu" onNodeChange={({ node, pos }) => { nodeRef.current = node; posRef.current = pos; }} onElementDragStart={() => { draggingRef.current = true; editor.view.dom.closest(".moxu-editor-root")?.classList.add("is-block-dragging"); }} onElementDragEnd={finishDragging} computePositionConfig={{ placement: "left" }}>
      <Box data-block-control sx={{ display: "flex", alignItems: "center", gap: .15, opacity: insertAnchor || actionAnchor ? 1 : .48, transition: "opacity .15s ease", "&:hover, &:focus-within": { opacity: 1 } }}>
        <Tooltip title="在此块后插入"><IconButton aria-label="在此块后插入" size="small" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => setInsertAnchor(event.currentTarget)} sx={{ width: 30, height: 30, color: insertAnchor ? "primary.main" : "text.secondary", bgcolor: insertAnchor ? (theme) => alpha(theme.palette.primary.main, .12) : "transparent", "&:hover": { color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, .1) } }}><Plus size={18}/></IconButton></Tooltip>
        <Tooltip title="拖动排序；单击打开块操作"><IconButton aria-label="拖动排序或打开块操作" size="small" onClick={(event) => setActionAnchor(event.currentTarget)} sx={{ width: 30, height: 30, cursor: "grab", color: actionAnchor ? "text.primary" : "text.secondary", bgcolor: actionAnchor ? "action.selected" : "transparent", "&:active": { cursor: "grabbing" }, "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}><GripVertical size={18}/></IconButton></Tooltip>
      </Box>
    </DragHandle>

    <Popover anchorEl={insertAnchor} open={Boolean(insertAnchor)} onClose={closeMenus} anchorOrigin={{ vertical: "center", horizontal: "right" }} transformOrigin={{ vertical: "center", horizontal: "left" }} slotProps={{ paper: { sx: { ml: 1, width: 286, borderRadius: 2.25, boxShadow: "0 16px 40px rgba(15,23,42,.16)", overflow: "hidden" } } }}>
      <Box sx={{ p: 1.4 }}><Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ px: .35, mb: 1 }}><Typography variant="subtitle2" fontWeight={800}>在下方插入</Typography><Typography variant="caption" color="text.secondary">常用内容</Typography></Stack><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .6 }}>{quickInsertions.map(({ id, label, hint, icon: Icon }) => <ButtonBase key={id} onClick={() => addAfter(id)} sx={{ minWidth: 0, minHeight: 52, px: .9, py: .65, gap: .8, justifyContent: "flex-start", textAlign: "left", borderRadius: 1.25, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}><Box sx={{ width: 27, height: 27, flex: "0 0 auto", borderRadius: .9, display: "grid", placeItems: "center", bgcolor: "action.hover" }}><Icon size={15}/></Box><Box minWidth={0}><Typography variant="caption" display="block" fontWeight={760} color="text.primary" noWrap>{label}</Typography><Typography variant="caption" display="block" color="text.secondary" fontSize={10.5} noWrap>{hint}</Typography></Box></ButtonBase>)}</Box><Divider sx={{ my: 1 }}/><ButtonBase onClick={() => { addAfter(); editor.commands.insertContent("/"); }} sx={{ width: "100%", minHeight: 38, px: 1, gap: .9, justifyContent: "flex-start", borderRadius: 1.25, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}><Plus size={16}/><Typography variant="body2" fontWeight={680}>浏览全部组件</Typography><Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>/</Typography></ButtonBase></Box>
    </Popover>

    <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={closeMenus} anchorOrigin={{ vertical: "center", horizontal: "right" }} transformOrigin={{ vertical: "center", horizontal: "left" }} slotProps={{ paper: { sx: { ml: 1, width: 188, borderRadius: 2, boxShadow: "0 14px 36px rgba(15,23,42,.16)" } } }}>
      <ListSubheader sx={{ pt: .5, lineHeight: 2.5, fontSize: 11, fontWeight: 800, color: "text.disabled" }}>当前内容块</ListSubheader>
      <MenuItem onClick={duplicate}><Copy size={16}/>复制区块</MenuItem><MenuItem onClick={clearFormatting}><RemoveFormatting size={16}/>清除格式</MenuItem><Divider sx={{ my: .5 }}/><MenuItem onClick={remove} sx={{ color: "error.main" }}><Trash2 size={16}/>删除区块</MenuItem>
    </Menu>
  </>;
}
