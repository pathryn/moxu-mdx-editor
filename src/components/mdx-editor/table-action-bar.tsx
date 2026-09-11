"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { CellSelection } from "@tiptap/pm/tables";
import { Box, Divider, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PanelLeft, PanelTop, Square, TableCellsMerge, TableCellsSplit, Trash2 } from "lucide-react";

type Props = { editor: Editor };
type SelectionInfo = { count: number; header: boolean; multiple: boolean };
type TableOperation = { title: string; axis: "column" | "row"; placement: "before" | "after" | "remove"; run: (editor: Editor) => boolean };

const columnActions: TableOperation[] = [
  { title: "在当前列左侧新增一列", axis: "column", placement: "before", run: (editor) => editor.chain().focus().addColumnBefore().run() },
  { title: "在当前列右侧新增一列", axis: "column", placement: "after", run: (editor) => editor.chain().focus().addColumnAfter().run() },
  { title: "删除当前列", axis: "column", placement: "remove", run: (editor) => editor.chain().focus().deleteColumn().run() },
];
const rowActions: TableOperation[] = [
  { title: "在当前行上方新增一行", axis: "row", placement: "before", run: (editor) => editor.chain().focus().addRowBefore().run() },
  { title: "在当前行下方新增一行", axis: "row", placement: "after", run: (editor) => editor.chain().focus().addRowAfter().run() },
  { title: "删除当前行", axis: "row", placement: "remove", run: (editor) => editor.chain().focus().deleteRow().run() },
];

function TableOperationIcon({ axis, placement }: Pick<TableOperation, "axis" | "placement">) {
  const before = placement === "before";
  const remove = placement === "remove";
  if (axis === "column") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x={before ? 8 : 4} y="4" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d={before ? "M14 4v16M8 12h12" : "M10 4v16M4 12h12"} stroke="currentColor" strokeWidth="1.4"/>{remove ? <path d="M19 12h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/> : before ? <path d="M1 12h6M4 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> : <path d="M17 12h6M20 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}</svg>;
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y={before ? 8 : 4} width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d={before ? "M4 14h16M12 8v12" : "M4 10h16M12 4v12"} stroke="currentColor" strokeWidth="1.4"/>{remove ? <path d="M9 21h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/> : before ? <path d="M9 4h6M12 1v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> : <path d="M9 20h6M12 17v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}</svg>;
}

export function TableActionBar({ editor }: Props) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>({ count: 1, header: false, multiple: false });

  const clearActiveCell = useCallback(() => {
    editor.view.dom.querySelectorAll("[data-active-table-cell]").forEach((cell) => cell.removeAttribute("data-active-table-cell"));
  }, [editor]);

  const update = useCallback(() => {
    clearActiveCell();
    if (!editor.isEditable || !editor.isActive("table")) { setAnchor(null); return; }
    const selection = editor.state.selection;
    const domAtPos = editor.view.domAtPos(selection.from).node;
    const element = domAtPos instanceof HTMLElement ? domAtPos : domAtPos.parentElement;
    const wrapper = element?.closest(".tableWrapper");
    const cell = element?.closest("td, th") as HTMLElement | null;
    if (!wrapper) { setAnchor(null); return; }

    const multiple = selection instanceof CellSelection;
    let count = 1;
    if (multiple) { count = 0; selection.forEachCell(() => { count += 1; }); }
    if (!multiple) cell?.setAttribute("data-active-table-cell", "true");
    setSelectionInfo({ count, header: cell?.tagName === "TH", multiple });
    setAnchor(wrapper.getBoundingClientRect());
  }, [clearActiveCell, editor]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(update);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      clearActiveCell();
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [clearActiveCell, editor, update]);

  if (!anchor) return null;
  const canMerge = editor.can().mergeCells();
  const canSplit = editor.can().splitCell();
  const left = Math.max(16, Math.min(anchor.left + 4, window.innerWidth - 690));
  const top = Math.min(window.innerHeight - 54, anchor.bottom + 8);
  const iconButtonSx = { width: 30, height: 30, borderRadius: .8, color: "text.secondary" };
  const renderOperation = (item: TableOperation) => <Tooltip key={item.title} title={item.title}><IconButton aria-label={item.title} onMouseDown={(event) => { event.preventDefault(); item.run(editor); }} sx={{ ...iconButtonSx, width: 34, color: item.placement === "remove" ? "error.main" : "text.secondary", "&:hover": { color: item.placement === "remove" ? "error.dark" : "primary.main", bgcolor: item.placement === "remove" ? (theme) => alpha(theme.palette.error.main, .07) : (theme) => alpha(theme.palette.primary.main, .07) } }}><TableOperationIcon axis={item.axis} placement={item.placement}/></IconButton></Tooltip>;

  return <Box sx={{ position: "fixed", left, top, zIndex: 2400, maxWidth: "calc(100vw - 32px)" }}><Paper elevation={12} sx={{ display: "flex", alignItems: "center", px: .65, py: .5, border: 1, borderColor: "divider", borderRadius: 1.5, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}><Stack direction="row" spacing={.25} alignItems="center" sx={{ flexShrink: 0 }}><Box sx={{ minWidth: 92, px: 1, py: .45, mr: .4, borderRadius: 1, bgcolor: selectionInfo.multiple ? (theme) => alpha(theme.palette.primary.main, .1) : "action.hover" }}><Typography variant="caption" display="block" fontWeight={800} color={selectionInfo.multiple ? "primary.main" : "text.primary"}>{selectionInfo.multiple ? `已选 ${selectionInfo.count} 格` : selectionInfo.header ? "表头单元格" : "表体单元格"}</Typography><Typography variant="caption" display="block" color="text.secondary" fontSize={9.5}>{selectionInfo.multiple ? (canMerge ? "可以合并" : "选择需为矩形区域") : "拖动可选择多格"}</Typography></Box>{columnActions.map(renderOperation)}<Divider orientation="vertical" flexItem sx={{ mx: .35 }}/>{rowActions.map(renderOperation)}<Divider orientation="vertical" flexItem sx={{ mx: .35 }}/><Tooltip title="切换首行表头"><IconButton aria-label="切换首行表头" onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().toggleHeaderRow().run(); }} sx={iconButtonSx}><PanelTop size={16}/></IconButton></Tooltip><Tooltip title="切换首列表头"><IconButton aria-label="切换首列表头" onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().toggleHeaderColumn().run(); }} sx={iconButtonSx}><PanelLeft size={16}/></IconButton></Tooltip><Tooltip title="切换当前单元格为表头或表体"><IconButton aria-label="切换当前单元格表头状态" onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().toggleHeaderCell().run(); }} sx={{ ...iconButtonSx, color: selectionInfo.header ? "primary.main" : "text.secondary", bgcolor: selectionInfo.header ? (theme) => alpha(theme.palette.primary.main, .1) : "transparent" }}><Square size={15}/></IconButton></Tooltip><Divider orientation="vertical" flexItem sx={{ mx: .35 }}/><Tooltip title={canMerge ? "合并选中的单元格" : "请拖动选择两个或更多相邻单元格"}><span><IconButton aria-label="合并单元格" disabled={!canMerge} onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().mergeCells().run(); }} sx={iconButtonSx}><TableCellsMerge size={17}/></IconButton></span></Tooltip><Tooltip title={canSplit ? "拆分当前合并单元格" : "当前单元格未合并"}><span><IconButton aria-label="拆分单元格" disabled={!canSplit} onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().splitCell().run(); }} sx={iconButtonSx}><TableCellsSplit size={17}/></IconButton></span></Tooltip><Divider orientation="vertical" flexItem sx={{ mx: .35 }}/><Tooltip title="删除整个表格"><IconButton aria-label="删除整个表格" onMouseDown={(event) => { event.preventDefault(); editor.chain().focus().deleteTable().run(); }} sx={{ ...iconButtonSx, color: "error.main", "&:hover": { bgcolor: (theme) => alpha(theme.palette.error.main, .08) } }}><Trash2 size={16}/></IconButton></Tooltip></Stack></Paper></Box>;
}
