"use client";

import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { JSONContent } from "@tiptap/core";
import { Box, Button, ButtonBase, Collapse, Divider, IconButton, InputAdornment, InputBase, MenuItem, Paper, Popover, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, ChevronDown, ChevronRight, Code2, Copy, Eraser, Italic, List, ListChecks, ListOrdered, Link2, Maximize2, Minimize2, Minus, Palette, PanelRightClose, PanelRightOpen, Plus, Quote, Redo2, RotateCcw, Search, SlidersHorizontal, Strikethrough, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Trash2, Underline, Undo2, Unlink2 } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { editorCommandGroups, getEditorCommand } from "./command-registry";
import type { MetricItem } from "./types";

type PanelTab = "properties" | "insert";
type Props = { editor: Editor; fullToolbar: boolean; fullscreen: boolean; onToggleFullscreen: () => void; collapsed?: boolean; onToggleCollapsed?: () => void };
type EditorContext = { type: string; label: string; attrs: Record<string, unknown>; pos: number; nodeSize: number; component: boolean };

const contextLabels: Record<string, string> = {
  paragraph: "正文", heading: "标题", bulletList: "符号列表", orderedList: "编号列表", taskList: "任务列表", blockquote: "引用", codeBlock: "代码块", table: "表格",
  calloutBlock: "提示框", figureBlock: "图片", metricsBlock: "指标组", badgeNode: "徽章", cardBlock: "卡片", detailsBlock: "折叠块", highlightBlock: "高亮块",
  widgetBlock: "嵌入组件", kanbanBlock: "看板", styledDivider: "分割线", columnsBlock: "分栏", tabsBlock: "标签页", galleryBlock: "图库", mediaBlock: "媒体",
};
const componentTypes = new Set(["calloutBlock", "figureBlock", "metricsBlock", "badgeNode", "cardBlock", "detailsBlock", "highlightBlock", "widgetBlock", "kanbanBlock", "styledDivider", "columnsBlock", "tabsBlock", "galleryBlock", "mediaBlock", "table"]);
const textColors = ["", "#101828", "#475467", "#7F56D9", "#2563EB", "#0284C7", "#0891B2", "#059669", "#65A30D", "#D97706", "#DC2626", "#DB2777"];
const highlightColors = ["", "#FEF08A", "#FED7AA", "#FECACA", "#FBCFE8", "#E9D5FF", "#DBEAFE", "#CFFAFE", "#D1FAE5", "#ECFCCB"];

const ToolButton = styled(IconButton, { shouldForwardProp: (prop) => prop !== "active" })<{ active?: boolean }>(({ theme, active }) => ({
  width: 36, height: 36, borderRadius: 9, border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider}`,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary, background: active ? alpha(theme.palette.primary.main, 0.09) : theme.palette.background.paper,
  "&:hover": { background: alpha(theme.palette.grey[500], 0.09), color: theme.palette.text.primary },
}));

function Tool({ title, active, disabled, onClick, children }: { title: string; active?: boolean; disabled?: boolean; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }) {
  return <Tooltip title={title}><span><ToolButton aria-label={title} active={active} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</ToolButton></span></Tooltip>;
}

function PanelSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <Box><Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="subtitle2" fontWeight={780} color="text.primary">{title}</Typography>{hint && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{hint}</Typography>}</Stack>{children}</Box>;
}

function ColorSwatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (color: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(value || colors.find(Boolean) || "#2563EB");
  useEffect(() => { if (value) queueMicrotask(() => setDraft(value)); }, [value]);
  const applyHex = (next: string) => {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    setDraft(normalized);
    if (/^#[0-9a-f]{6}$/i.test(normalized)) onChange(normalized.toUpperCase());
  };

  return <Stack spacing={.75}><Typography variant="caption" color="text.secondary" fontWeight={650}>{label}</Typography><Box display="flex" flexWrap="wrap" gap={.75}>{colors.map((color) => <Tooltip title={color || "默认"} key={color || "default"}><ButtonBase aria-label={`${label}：${color || "默认"}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onChange(color)} sx={{ width: 27, height: 27, borderRadius: "50%", bgcolor: color || "background.paper", border: 1, borderColor: value === color ? "primary.main" : "divider", boxShadow: value === color ? (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, .15)}` : "none", position: "relative", "&::after": !color ? { content: '""', position: "absolute", width: 18, height: 1.5, bgcolor: "error.main", transform: "rotate(-45deg)", borderRadius: 9 } : undefined }}/></Tooltip>)}<Tooltip title="自定义颜色"><ButtonBase aria-label={`${label}：自定义颜色`} onMouseDown={(event) => event.preventDefault()} onClick={(event) => { setDraft(value || colors.find(Boolean) || "#2563EB"); setAnchor(event.currentTarget); }} sx={{ width: 27, height: 27, borderRadius: "50%", color: "text.secondary", background: value && !colors.includes(value) ? value : "conic-gradient(from 45deg, #F04438, #F79009, #12B76A, #2E90FA, #7F56D9, #F04438)", boxShadow: value && !colors.includes(value) ? (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, .2)}` : "none", "&:hover": { transform: "scale(1.08)" } }}>{(!value || colors.includes(value)) && <Palette size={13} color="white"/>}</ButtonBase></Tooltip></Box><Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { mt: .8, width: 258, p: 1.5, borderRadius: 2, boxShadow: "0 16px 40px rgba(15,23,42,.18)" } } }}><Stack spacing={1.25}><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="subtitle2" fontWeight={800}>自定义{label}</Typography><Typography variant="caption" color="text.secondary">拖动选择，内容实时更新</Typography></Box><Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: draft, border: 1, borderColor: "divider" }}/></Stack><Box sx={{ "& .react-colorful": { width: "100%", height: 174 }, "& .react-colorful__saturation": { borderRadius: "10px 10px 4px 4px" }, "& .react-colorful__hue": { height: 14, mt: 1, borderRadius: 99 }, "& .react-colorful__pointer": { width: 18, height: 18 } }}><HexColorPicker color={draft} onChange={applyHex}/></Box><Stack direction="row" spacing={1} alignItems="center"><Stack direction="row" alignItems="center" sx={{ flex: 1, height: 36, px: 1, border: 1, borderColor: "divider", borderRadius: 1, "&:focus-within": { borderColor: "primary.main" } }}><Typography variant="body2" color="text.secondary">#</Typography><InputBase value={draft.replace("#", "")} inputProps={{ "aria-label": `${label} HEX 值`, maxLength: 6 }} onChange={(event) => applyHex(event.target.value.replace(/[^0-9a-f]/gi, ""))} sx={{ ml: .5, flex: 1, "& input": { p: 0, fontSize: 13, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" } }}/></Stack><Button color="inherit" size="small" onClick={() => { onChange(""); setAnchor(null); }}>恢复默认</Button></Stack></Stack></Popover></Stack>;
}

function NumericStepper({ label, value, min, max, step, defaultValue, suffix, onChange }: { label: string; value: string; min: number; max: number; step: number; defaultValue: number; suffix?: string; onChange: (value: string) => void }) {
  const numericValue = Number.parseFloat(value);
  const [draft, setDraft] = useState(value ? String(numericValue) : "");
  useEffect(() => { queueMicrotask(() => setDraft(value ? String(Number.parseFloat(value)) : "")); }, [value]);

  const normalize = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    const precision = step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
    return Number((Math.round(clamped / step) * step).toFixed(precision));
  };
  const apply = (raw: string) => {
    if (!raw.trim()) { setDraft(""); onChange(""); return; }
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) { setDraft(value ? String(numericValue) : ""); return; }
    const next = normalize(parsed);
    setDraft(String(next));
    onChange(`${next}${suffix ?? ""}`);
  };
  const adjust = (direction: -1 | 1) => apply(String(normalize((Number.isNaN(numericValue) ? defaultValue : numericValue) + direction * step)));
  const atMin = !Number.isNaN(numericValue) && numericValue <= min;
  const atMax = !Number.isNaN(numericValue) && numericValue >= max;

  return <Box sx={{ minHeight: 56, px: 1.1, display: "grid", gridTemplateColumns: "minmax(58px, 1fr) 30px 72px 30px 28px", alignItems: "center", columnGap: .35 }}><Box minWidth={0}><Typography variant="body2" color="text.primary" fontWeight={720}>{label}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .1, fontSize: 10.5 }}>{min}–{max}{suffix ?? ""}</Typography></Box><Tooltip title={`减小${label}`}><span><IconButton aria-label={`减小${label}`} disabled={atMin} onMouseDown={(event) => event.preventDefault()} onClick={() => adjust(-1)} size="small" sx={{ width: 30, height: 30, color: "text.secondary" }}><Minus size={15}/></IconButton></span></Tooltip><Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: 34, px: .6, border: 1, borderColor: (theme) => alpha(theme.palette.text.primary, .18), borderRadius: 1, bgcolor: "background.paper", "&:focus-within": { borderColor: "primary.main", boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, .1)}` } }}><InputBase value={draft} placeholder="默认" inputProps={{ "aria-label": `${label}数值`, inputMode: "decimal", min, max, step }} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value.replace(/[^0-9.]/g, ""))} onBlur={() => apply(draft)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); apply(draft); event.currentTarget.blur(); } if (event.key === "Escape") { setDraft(value ? String(numericValue) : ""); event.currentTarget.blur(); } }} sx={{ width: suffix ? 42 : 54, color: "text.primary", "& input": { p: 0, textAlign: "center", fontSize: 13, fontWeight: 760 }, "& input::placeholder": { color: "text.secondary", opacity: 1, fontSize: 11, fontWeight: 650 } }}/>{suffix && <Typography variant="caption" color="text.secondary" sx={{ ml: .15, fontSize: 10.5, fontWeight: 650 }}>{suffix}</Typography>}</Stack><Tooltip title={`增大${label}`}><span><IconButton aria-label={`增大${label}`} disabled={atMax} onMouseDown={(event) => event.preventDefault()} onClick={() => adjust(1)} size="small" sx={{ width: 30, height: 30, color: "text.secondary" }}><Plus size={15}/></IconButton></span></Tooltip><Tooltip title={value ? "恢复主题默认值" : "当前为主题默认值"}><span><IconButton aria-label={`重置${label}`} disabled={!value} onMouseDown={(event) => event.preventDefault()} onClick={() => apply("")} size="small" sx={{ width: 28, height: 28, color: "text.secondary" }}><RotateCcw size={14}/></IconButton></span></Tooltip></Box>;
}

function PropertyChoice({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return <ButtonBase aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onClick={onClick} sx={{ minHeight: 34, px: .75, border: 1, borderColor: active ? "primary.main" : "divider", borderRadius: 1.1, bgcolor: active ? (theme) => alpha(theme.palette.primary.main, .09) : "background.paper", color: active ? "primary.main" : "text.secondary", fontSize: 12, fontWeight: active ? 800 : 650, "&:hover": { borderColor: active ? "primary.main" : "text.disabled", bgcolor: active ? (theme) => alpha(theme.palette.primary.main, .12) : "action.hover" } }}>{label}</ButtonBase>;
}

function InsertCard({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick: (event: React.MouseEvent<HTMLElement>) => void }) {
  return <ButtonBase onMouseDown={(event) => event.preventDefault()} onClick={onClick} sx={{ minWidth: 0, minHeight: 58, px: .85, py: .7, gap: .75, alignItems: "center", justifyContent: "flex-start", textAlign: "left", border: 1, borderColor: "divider", borderRadius: 1.35, bgcolor: "background.paper", transition: "border-color .15s ease, background-color .15s ease, transform .15s ease", "&:hover": { transform: "translateY(-1px)", borderColor: "primary.light", bgcolor: (theme) => alpha(theme.palette.primary.main, .04) } }}><Box sx={{ width: 27, height: 27, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: .9, color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, .08), "& svg": { width: 16, height: 16 } }}>{icon}</Box><Box minWidth={0}><Typography variant="caption" fontWeight={800} noWrap display="block" lineHeight={1.3}>{title}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: .15, fontSize: 10.5, lineHeight: 1.3 }}>{description}</Typography></Box></ButtonBase>;
}

function TablePreview({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });
  return <Stack spacing={1}><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary" aria-live="polite">{hovered.rows ? `${hovered.cols} 列 × ${hovered.rows} 行` : "移动或使用 Tab 键选择表格尺寸"}</Typography><Typography variant="caption" color="primary.main" fontWeight={700}>首行为表头</Typography></Stack><Box onMouseLeave={() => setHovered({ rows: 0, cols: 0 })} sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: .5 }}>{Array.from({ length: 40 }).map((_, index) => { const row = Math.floor(index / 8) + 1; const col = index % 8 + 1; const active = row <= hovered.rows && col <= hovered.cols; return <ButtonBase key={`${row}-${col}`} aria-label={`插入 ${col} 列 ${row} 行表格`} onMouseEnter={() => setHovered({ rows: row, cols: col })} onFocus={() => setHovered({ rows: row, cols: col })} onClick={() => onSelect(row, col)} sx={{ width: 24, height: 24, border: 1, borderColor: active ? "primary.main" : row === 1 ? "primary.light" : "divider", borderRadius: .5, bgcolor: active ? (theme) => alpha(theme.palette.primary.main, row === 1 ? .2 : .1) : row === 1 ? (theme) => alpha(theme.palette.primary.main, .07) : "transparent", cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 1 } }}/>; })}</Box></Stack>;
}

function inspectContext(editor: Editor): EditorContext {
  const { selection } = editor.state;
  const selectedNode = selection instanceof NodeSelection ? selection.node : null;
  if (selectedNode) return { type: selectedNode.type.name, label: contextLabels[selectedNode.type.name] ?? "内容块", attrs: { ...selectedNode.attrs }, pos: selection.from, nodeSize: selectedNode.nodeSize, component: componentTypes.has(selectedNode.type.name) };
  const $from = selection.$from;
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (contextLabels[node.type.name]) {
      const pos = depth === 0 ? 0 : $from.before(depth);
      return { type: node.type.name, label: contextLabels[node.type.name], attrs: { ...node.attrs }, pos, nodeSize: node.nodeSize, component: componentTypes.has(node.type.name) };
    }
  }
  return { type: "paragraph", label: "正文", attrs: {}, pos: selection.from, nodeSize: 0, component: false };
}

export function EditorToolbar({ editor, fullToolbar, fullscreen, onToggleFullscreen, collapsed = false, onToggleCollapsed }: Props) {
  const [tab, setTab] = useState<PanelTab>("properties");
  const [linkAnchor, setLinkAnchor] = useState<HTMLElement | null>(null);
  const [tableAnchor, setTableAnchor] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [openGroup, setOpenGroup] = useState("structure");
  const [deleted, setDeleted] = useState<{ node: JSONContent; pos: number } | null>(null);

  const state = useEditorState({ editor, selector: ({ editor: current }) => ({
    context: inspectContext(current), bold: current.isActive("bold"), italic: current.isActive("italic"), underline: current.isActive("underline"), strike: current.isActive("strike"), code: current.isActive("code"),
    subscript: current.isActive("subscript"), superscript: current.isActive("superscript"), bulletList: current.isActive("bulletList"), orderedList: current.isActive("orderedList"), taskList: current.isActive("taskList"), blockquote: current.isActive("blockquote"),
    color: String(current.getAttributes("textStyle").color ?? ""), fontSize: String(current.getAttributes("textStyle").fontSize ?? ""), highlightColor: String(current.getAttributes("highlight").color ?? ""),
    alignLeft: current.isActive({ textAlign: "left" }), alignCenter: current.isActive({ textAlign: "center" }), alignRight: current.isActive({ textAlign: "right" }), alignJustify: current.isActive({ textAlign: "justify" }),
    canUndo: current.can().undo(), canRedo: current.can().redo(),
  }) });

  const { context } = state;
  const chain = () => editor.chain().focus();
  const headingLevel = ([1, 2, 3, 4, 5, 6] as const).find((level) => editor.isActive("heading", { level }));
  const selectHeading = (level: number | null) => { if (level) chain().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run(); else chain().setParagraph().run(); };
  const updateAttrs = (attrs: Record<string, unknown>) => {
    const preserveMarks = editor.state.selection.empty && editor.state.selection.$from.parent.inlineContent;
    const activeMarks = preserveMarks ? (editor.state.storedMarks ?? editor.state.selection.$from.marks()) : null;
    const updated = editor.commands.updateAttributes(context.type, attrs);
    if (updated && activeMarks?.length && !editor.isDestroyed) editor.view.dispatch(editor.state.tr.setStoredMarks(activeMarks));
    return updated;
  };

  useEffect(() => { if (context.component) queueMicrotask(() => setTab("properties")); }, [context.component, context.pos, context.type]);

  const insertGroups = useMemo(() => editorCommandGroups.filter((group) => group.id !== "basic").map((group) => ({ ...group, commands: group.commands.filter((command) => [command.label, command.description, ...command.keywords].some((text) => text.toLowerCase().includes(query.trim().toLowerCase()))) })).filter((group) => group.commands.length), [query]);
  const recentCommands = recent.map((id) => getEditorCommand(id)).filter((command): command is NonNullable<ReturnType<typeof getEditorCommand>> => Boolean(command));
  const runInsert = (id: string, anchor?: HTMLElement) => {
    if (id === "table" && anchor) { setTableAnchor(anchor); return; }
    const command = getEditorCommand(id);
    if (!command) return;
    command.run(editor);
    setRecent((current) => [id, ...current.filter((item) => item !== id)].slice(0, 4));
  };

  const duplicateContext = () => { const node = editor.state.doc.nodeAt(context.pos); if (node) editor.chain().focus().insertContentAt(context.pos + node.nodeSize, node.toJSON()).run(); };
  const deleteContext = () => {
    const node = editor.state.doc.nodeAt(context.pos);
    if (!node) return;
    setDeleted({ node: node.toJSON(), pos: context.pos });
    editor.chain().focus().deleteRange({ from: context.pos, to: context.pos + node.nodeSize }).run();
  };
  const addKanbanColumn = () => {
    const board = editor.state.doc.nodeAt(context.pos);
    if (!board || board.type.name !== "kanbanBlock" || board.childCount >= 5) return;
    editor.chain().focus().insertContentAt(context.pos + board.nodeSize - 1, { type: "kanbanColumn", content: [{ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "新列" }] }, { type: "paragraph" }] }).run();
  };
  const removeKanbanColumn = () => {
    const board = editor.state.doc.nodeAt(context.pos);
    if (!board || board.type.name !== "kanbanBlock" || board.childCount <= 2) return;
    let lastColumnPos = context.pos + 1;
    for (let index = 0; index < board.childCount - 1; index += 1) lastColumnPos += board.child(index).nodeSize;
    editor.chain().focus().deleteRange({ from: lastColumnPos, to: lastColumnPos + board.lastChild!.nodeSize }).run();
  };
  const updateTabLabel = (index: number, label: string) => {
    const tabs = editor.state.doc.nodeAt(context.pos);
    if (!tabs || tabs.type.name !== "tabsBlock" || index >= tabs.childCount) return;
    let panelPos = context.pos + 1;
    for (let item = 0; item < index; item += 1) panelPos += tabs.child(item).nodeSize;
    const panel = tabs.child(index);
    editor.view.dispatch(editor.state.tr.setNodeMarkup(panelPos, undefined, { ...panel.attrs, label }));
  };
  const addTabPanel = () => {
    const tabs = editor.state.doc.nodeAt(context.pos);
    if (!tabs || tabs.type.name !== "tabsBlock" || tabs.childCount >= 6) return;
    const index = tabs.childCount + 1;
    editor.chain().focus().insertContentAt(context.pos + tabs.nodeSize - 1, { type: "tabPanel", attrs: { label: `标签 ${index}`, value: `tab-${index}` }, content: [{ type: "paragraph", content: [{ type: "text", text: "在这里编辑标签页内容。" }] }] }).run();
  };
  const removeTabPanel = () => {
    const tabs = editor.state.doc.nodeAt(context.pos);
    if (!tabs || tabs.type.name !== "tabsBlock" || tabs.childCount <= 2) return;
    let panelPos = context.pos + 1;
    for (let index = 0; index < tabs.childCount - 1; index += 1) panelPos += tabs.child(index).nodeSize;
    editor.chain().focus().deleteRange({ from: panelPos, to: panelPos + tabs.lastChild!.nodeSize }).run();
  };
  const restoreDeleted = () => {
    if (!deleted) return;
    editor.chain().focus().insertContentAt(Math.min(deleted.pos, editor.state.doc.content.size), deleted.node).run();
    setDeleted(null);
  };

  const textProperties = <>
    <PanelSection title="段落样式"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: .65 }}><PropertyChoice label="正文" active={!headingLevel} onClick={() => selectHeading(null)}/>{([1, 2, 3, 4, 5, 6] as const).map((level) => <PropertyChoice key={level} label={`H${level}`} active={headingLevel === level} onClick={() => selectHeading(level)}/>)}</Box></PanelSection>
    <PanelSection title="排版"><Box><NumericStepper label="字号" value={state.fontSize} min={8} max={96} step={1} defaultValue={16} suffix="px" onChange={(value) => value ? chain().setFontSize(value).run() : chain().unsetFontSize().run()}/><Divider sx={{ mx: 1.1 }}/><NumericStepper label="行高" value={String(context.attrs.lineHeight ?? "")} min={.8} max={3} step={.05} defaultValue={1.6} onChange={(value) => updateAttrs({ lineHeight: value || null })}/></Box></PanelSection>
    <PanelSection title="文字"><Box display="flex" flexWrap="wrap" gap={.75}><Tool title="粗体 ⌘B" active={state.bold} onClick={() => chain().toggleBold().run()}><Bold size={17}/></Tool><Tool title="斜体 ⌘I" active={state.italic} onClick={() => chain().toggleItalic().run()}><Italic size={17}/></Tool><Tool title="下划线 ⌘U" active={state.underline} onClick={() => chain().toggleUnderline().run()}><Underline size={17}/></Tool><Tool title="删除线" active={state.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough size={17}/></Tool><Tool title="行内代码" active={state.code} onClick={() => chain().toggleCode().run()}><Code2 size={17}/></Tool><Tool title="下标" active={state.subscript} onClick={() => chain().toggleSubscript().run()}><SubscriptIcon size={17}/></Tool><Tool title="上标" active={state.superscript} onClick={() => chain().toggleSuperscript().run()}><SuperscriptIcon size={17}/></Tool></Box></PanelSection>
    <PanelSection title="颜色"><Stack spacing={1.25}><ColorSwatches label="文字颜色" colors={textColors} value={state.color} onChange={(color) => color ? chain().setColor(color).run() : chain().unsetColor().run()}/><ColorSwatches label="背景高亮" colors={highlightColors} value={state.highlightColor} onChange={(color) => color ? chain().setHighlight({ color }).run() : chain().unsetHighlight().run()}/></Stack></PanelSection>
    <PanelSection title="段落结构"><Box display="flex" flexWrap="wrap" gap={.75}><Tool title="符号列表" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}><List size={17}/></Tool><Tool title="编号列表" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={17}/></Tool><Tool title="任务列表" active={state.taskList} onClick={() => chain().toggleTaskList().run()}><ListChecks size={17}/></Tool><Tool title="引用" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}><Quote size={17}/></Tool></Box></PanelSection>
    {fullToolbar && <PanelSection title="对齐"><Box display="flex" flexWrap="wrap" gap={.75}><Tool title="左对齐" active={state.alignLeft} onClick={() => chain().setTextAlign("left").run()}><AlignLeft size={17}/></Tool><Tool title="居中" active={state.alignCenter} onClick={() => chain().setTextAlign("center").run()}><AlignCenter size={17}/></Tool><Tool title="右对齐" active={state.alignRight} onClick={() => chain().setTextAlign("right").run()}><AlignRight size={17}/></Tool><Tool title="两端对齐" active={state.alignJustify} onClick={() => chain().setTextAlign("justify").run()}><AlignJustify size={17}/></Tool></Box></PanelSection>}
    <PanelSection title="链接与清理"><Box display="flex" gap={.75}><Tool title="添加链接" onClick={(event) => { setLinkUrl(editor.getAttributes("link").href ?? ""); setLinkAnchor(event.currentTarget); }}><Link2 size={17}/></Tool><Tool title="移除链接" disabled={!editor.isActive("link")} onClick={() => chain().unsetLink().run()}><Unlink2 size={17}/></Tool><Tool title="清除格式" onClick={() => { updateAttrs({ lineHeight: null }); chain().clearNodes().unsetAllMarks().run(); }}><Eraser size={17}/></Tool></Box></PanelSection>
  </>;

  const componentProperties = <>
    {context.type === "figureBlock" && <Stack spacing={1.5}><TextField size="small" label="图片地址" value={String(context.attrs.src ?? "")} onChange={(event) => updateAttrs({ src: event.target.value })}/><TextField size="small" label="替代文本" value={String(context.attrs.alt ?? "")} onChange={(event) => updateAttrs({ alt: event.target.value })}/><TextField size="small" label="图片说明" value={String(context.attrs.caption ?? "")} onChange={(event) => updateAttrs({ caption: event.target.value })}/></Stack>}
    {context.type === "cardBlock" && <PanelSection title="卡片外观"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: .65 }}><PropertyChoice label="标准" active={String(context.attrs.variant ?? "default") === "default"} onClick={() => updateAttrs({ variant: "default" })}/><PropertyChoice label="强调" active={context.attrs.variant === "accent"} onClick={() => updateAttrs({ variant: "accent" })}/><PropertyChoice label="简洁" active={context.attrs.variant === "minimal"} onClick={() => updateAttrs({ variant: "minimal" })}/></Box></PanelSection>}
    {context.type === "detailsBlock" && <PanelSection title="默认状态"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .65 }}><PropertyChoice label="收起" active={!context.attrs.defaultOpen} onClick={() => updateAttrs({ defaultOpen: false })}/><PropertyChoice label="展开" active={Boolean(context.attrs.defaultOpen)} onClick={() => updateAttrs({ defaultOpen: true })}/></Box></PanelSection>}
    {context.type === "highlightBlock" && <TextField select size="small" fullWidth label="高亮色调" value={String(context.attrs.tone ?? "yellow")} onChange={(event) => updateAttrs({ tone: event.target.value })}><MenuItem value="yellow">黄色</MenuItem><MenuItem value="blue">蓝色</MenuItem><MenuItem value="green">绿色</MenuItem></TextField>}
    {context.type === "widgetBlock" && <Stack spacing={1.5}>
      <TextField size="small" label="标题" value={String(context.attrs.title ?? "")} onChange={(event) => updateAttrs({ title: event.target.value })}/>
      {context.attrs.kind === "embed" && <><TextField size="small" label="网页地址" placeholder="https://" value={String(context.attrs.source ?? "")} onChange={(event) => updateAttrs({ source: event.target.value })}/><PanelSection title="显示比例"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: .65 }}>{["16/9", "4/3", "1/1"].map((value) => <PropertyChoice key={value} label={value} active={String(context.attrs.aspectRatio ?? "16/9") === value} onClick={() => updateAttrs({ aspectRatio: value })}/>)}</Box></PanelSection></>}
      {context.attrs.kind === "diagram" && <TextField size="small" multiline minRows={6} label="Mermaid 源码" value={String(context.attrs.source ?? "")} onChange={(event) => updateAttrs({ source: event.target.value })}/>} 
      {context.attrs.kind === "kanban" && <PanelSection title="列名称"><Stack spacing={.75}>{((context.attrs.columns as string[]) ?? []).map((column, index, columns) => <Stack key={index} direction="row" spacing={.5}><TextField fullWidth size="small" label={`第 ${index + 1} 列`} value={column} onChange={(event) => updateAttrs({ columns: columns.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })}/><Tooltip title="删除此列"><span><IconButton size="small" disabled={columns.length <= 2} onMouseDown={(event) => event.preventDefault()} onClick={() => updateAttrs({ columns: columns.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15}/></IconButton></span></Tooltip></Stack>)}<Button size="small" color="inherit" startIcon={<Plus size={15}/>} disabled={((context.attrs.columns as string[]) ?? []).length >= 5} onClick={() => updateAttrs({ columns: [...((context.attrs.columns as string[]) ?? []), "新列"] })}>添加列</Button></Stack></PanelSection>}
    </Stack>}
    {context.type === "kanbanBlock" && <Stack spacing={1.5}><TextField size="small" label="看板标题" value={String(context.attrs.title ?? "")} onChange={(event) => updateAttrs({ title: event.target.value })}/><PanelSection title="看板列"><Stack direction="row" spacing={.75}><Button fullWidth size="small" color="inherit" variant="outlined" startIcon={<Plus size={15}/>} disabled={(editor.state.doc.nodeAt(context.pos)?.childCount ?? 0) >= 5} onMouseDown={(event) => event.preventDefault()} onClick={addKanbanColumn}>添加列</Button><Button fullWidth size="small" color="inherit" variant="outlined" startIcon={<Minus size={15}/>} disabled={(editor.state.doc.nodeAt(context.pos)?.childCount ?? 0) <= 2} onMouseDown={(event) => event.preventDefault()} onClick={removeKanbanColumn}>删除末列</Button></Stack></PanelSection></Stack>}
    {context.type === "tabsBlock" && <Stack spacing={1.5}><PanelSection title="标签名称"><Stack spacing={.75}>{Array.from({ length: editor.state.doc.nodeAt(context.pos)?.childCount ?? 0 }, (_, index) => { const panel = editor.state.doc.nodeAt(context.pos)?.child(index); return <TextField key={index} size="small" label={`标签 ${index + 1}`} value={String(panel?.attrs.label ?? "")} onChange={(event) => updateTabLabel(index, event.target.value)}/>; })}</Stack></PanelSection><Stack direction="row" spacing={.75}><Button fullWidth size="small" color="inherit" variant="outlined" startIcon={<Plus size={15}/>} disabled={(editor.state.doc.nodeAt(context.pos)?.childCount ?? 0) >= 6} onMouseDown={(event) => event.preventDefault()} onClick={addTabPanel}>添加标签</Button><Button fullWidth size="small" color="inherit" variant="outlined" startIcon={<Minus size={15}/>} disabled={(editor.state.doc.nodeAt(context.pos)?.childCount ?? 0) <= 2} onMouseDown={(event) => event.preventDefault()} onClick={removeTabPanel}>删除末项</Button></Stack></Stack>}
    {context.type === "mediaBlock" && <Stack spacing={1.5}><TextField size="small" label="标题" value={String(context.attrs.title ?? "")} onChange={(event) => updateAttrs({ title: event.target.value })}/><TextField size="small" label="资源地址" placeholder="https://" value={String(context.attrs.src ?? "")} onChange={(event) => updateAttrs({ src: event.target.value })}/>{context.attrs.kind === "video" && <TextField size="small" label="封面图片" placeholder="https://" value={String(context.attrs.poster ?? "")} onChange={(event) => updateAttrs({ poster: event.target.value })}/>}<TextField size="small" label="说明" value={String(context.attrs.description ?? "")} onChange={(event) => updateAttrs({ description: event.target.value })}/></Stack>}
    {context.type === "badgeNode" && <Stack spacing={1.5}><TextField size="small" label="徽章文字" value={String(context.attrs.text ?? "")} onChange={(event) => updateAttrs({ text: event.target.value })}/><PanelSection title="色调"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .65 }}><PropertyChoice label="成功" active={String(context.attrs.tone ?? "success") === "success"} onClick={() => updateAttrs({ tone: "success" })}/><PropertyChoice label="信息" active={context.attrs.tone === "info"} onClick={() => updateAttrs({ tone: "info" })}/></Box></PanelSection></Stack>}
    {context.type === "styledDivider" && <PanelSection title="分割线样式"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .65 }}>{[["solid", "实线"], ["dashed", "虚线"], ["dotted", "点线"], ["double", "双线"], ["gradient", "渐变"], ["ornament", "装饰"]].map(([value, label]) => <PropertyChoice key={value} label={label} active={String(context.attrs.variant ?? "solid") === value} onClick={() => updateAttrs({ variant: value })}/>)}</Box></PanelSection>}
    {context.type === "galleryBlock" && <Stack spacing={1.5}><TextField size="small" label="图库说明" value={String(context.attrs.caption ?? "")} onChange={(event) => updateAttrs({ caption: event.target.value })}/><PanelSection title="每行图片"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: .65 }}>{[2, 3, 4].map((value) => <PropertyChoice key={value} label={`${value} 张`} active={Number(context.attrs.columns ?? 3) === value} onClick={() => updateAttrs({ columns: value })}/>)}</Box></PanelSection><PanelSection title="图片"><Stack spacing={1}>{((context.attrs.items as Array<{ src: string; alt: string }>) ?? []).map((item, index, items) => <Paper key={index} variant="outlined" sx={{ p: 1, borderRadius: 1.25 }}><Stack spacing={.75}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="caption" fontWeight={760}>图片 {index + 1}</Typography><Tooltip title="移除图片"><IconButton size="small" onMouseDown={(event) => event.preventDefault()} onClick={() => updateAttrs({ items: items.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={14}/></IconButton></Tooltip></Stack><TextField size="small" label="地址" value={item.src} onChange={(event) => updateAttrs({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, src: event.target.value } : entry) })}/><TextField size="small" label="替代文本" value={item.alt} onChange={(event) => updateAttrs({ items: items.map((entry, itemIndex) => itemIndex === index ? { ...entry, alt: event.target.value } : entry) })}/></Stack></Paper>)}<Button size="small" color="inherit" startIcon={<Plus size={15}/>} onClick={() => updateAttrs({ items: [...(((context.attrs.items as Array<{ src: string; alt: string }>) ?? [])), { src: "", alt: "" }] })}>添加图片</Button></Stack></PanelSection></Stack>}
    {context.type === "metricsBlock" && <Stack spacing={1.5}>{((context.attrs.metrics as MetricItem[]) ?? []).map((metric, index, metrics) => <Stack direction="row" spacing={1} key={index}><TextField size="small" label="数值" value={metric.value} sx={{ width: 92 }} onChange={(event) => updateAttrs({ metrics: metrics.map((entry, itemIndex) => itemIndex === index ? { ...entry, value: event.target.value } : entry) })}/><TextField size="small" label="说明" value={metric.label} onChange={(event) => updateAttrs({ metrics: metrics.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry) })}/></Stack>)}</Stack>}
    {context.type === "table" && <Stack spacing={1}><Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => chain().addRowAfter().run()}>添加行</Button><Button size="small" variant="outlined" onClick={() => chain().addColumnAfter().run()}>添加列</Button></Stack><Stack direction="row" spacing={1}><Button size="small" color="inherit" onClick={() => chain().deleteRow().run()}>删除行</Button><Button size="small" color="inherit" onClick={() => chain().deleteColumn().run()}>删除列</Button></Stack></Stack>}
    {["calloutBlock", "columnsBlock"].includes(context.type) && <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}><Typography variant="body2" color="text.secondary">这个组件的正文可以直接在画布中编辑。选中内部文字即可继续排版。</Typography></Paper>}
    <PanelSection title="区块操作"><Stack direction="row" spacing={.75}><Button fullWidth size="small" color="inherit" variant="outlined" startIcon={<Copy size={15}/>} onMouseDown={(event) => event.preventDefault()} onClick={duplicateContext} sx={{ minHeight: 36, borderColor: "divider" }}>复制</Button><Button fullWidth size="small" color="error" variant="outlined" startIcon={<Trash2 size={15}/>} onMouseDown={(event) => event.preventDefault()} onClick={deleteContext} sx={{ minHeight: 36 }}>删除</Button></Stack></PanelSection>
  </>;

  if (collapsed) return <Paper square elevation={0} sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", py: 1, gap: .75, bgcolor: "transparent" }}><Tooltip title="展开工具栏" placement="left"><IconButton aria-label="展开工具栏" onClick={onToggleCollapsed}><PanelRightOpen size={18}/></IconButton></Tooltip><Divider flexItem sx={{ mx: 1 }}/><Tooltip title="属性" placement="left"><IconButton aria-label="打开属性" color={tab === "properties" ? "primary" : "default"} onClick={() => { setTab("properties"); onToggleCollapsed?.(); }}><SlidersHorizontal size={18}/></IconButton></Tooltip><Tooltip title="插入组件" placement="left"><IconButton aria-label="插入组件" color={tab === "insert" ? "primary" : "default"} onClick={() => { setTab("insert"); onToggleCollapsed?.(); }}><Plus size={19}/></IconButton></Tooltip><Box flex={1}/><Tooltip title={fullscreen ? "退出专注模式" : "进入专注模式"} placement="left"><IconButton aria-label={fullscreen ? "退出专注模式" : "进入专注模式"} onClick={onToggleFullscreen}>{fullscreen ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</IconButton></Tooltip></Paper>;

  return <Paper variant="outlined" sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", borderRadius: 0, border: 0, bgcolor: "transparent", overflow: "hidden" }}>
    <Stack spacing={1} sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: 1, borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between"><Box minWidth={0}><Typography variant="subtitle2" fontWeight={800}>编辑工具</Typography><Stack direction="row" spacing={.6} alignItems="center"><Typography variant="caption" color="text.secondary">当前</Typography><ChevronRight size={12}/><Typography variant="caption" color="primary.main" fontWeight={750} noWrap>{context.label}</Typography></Stack></Box><Tooltip title="收起工具栏"><IconButton aria-label="收起工具栏" size="small" onClick={onToggleCollapsed}><PanelRightClose size={17}/></IconButton></Tooltip></Stack>
      <Tabs value={tab} onMouseDown={(event) => event.preventDefault()} onChange={(_, value: PanelTab) => setTab(value)} variant="fullWidth" sx={{ minHeight: 40, p: .4, borderRadius: 1.5, bgcolor: (theme) => alpha(theme.palette.grey[500], .07), "& .MuiTabs-indicator": { height: "100%", borderRadius: 1.1, bgcolor: "background.paper", boxShadow: "0 1px 3px rgba(15,23,42,.12)", zIndex: 0 }, "& .MuiTab-root": { minWidth: 0, minHeight: 34, p: 0, zIndex: 1, fontSize: 12, color: "text.secondary", "&.Mui-selected": { color: "text.primary", fontWeight: 800 } } }}><Tab value="properties" label="属性"/><Tab value="insert" label="插入"/></Tabs>
    </Stack>
    <Stack spacing={2.2} sx={{ p: 1.5, flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", scrollbarWidth: "thin", scrollbarColor: "transparent transparent", "&:hover": { scrollbarColor: (theme) => `${alpha(theme.palette.text.disabled, .38)} transparent` }, "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-track": { background: "transparent" }, "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: 99 }, "&:hover::-webkit-scrollbar-thumb": { background: (theme) => alpha(theme.palette.text.disabled, .32) } }}>
      {tab === "properties" && (context.component ? componentProperties : textProperties)}
      {tab === "insert" && <><TextField size="small" fullWidth value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组件" inputProps={{ "aria-label": "搜索组件" }} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16}/></InputAdornment> }}/>{!query && recentCommands.length > 0 && <PanelSection title="最近使用"><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .75 }}>{recentCommands.map((command) => { const Icon = command.icon; return <InsertCard key={command.id} title={command.label} description={command.description} icon={<Icon size={19}/>} onClick={(event) => runInsert(command.id, event.currentTarget)}/>; })}</Box></PanelSection>}{insertGroups.map((group) => { const expanded = Boolean(query) || openGroup === group.id; return <Box key={group.id}><ButtonBase aria-expanded={expanded} onClick={() => setOpenGroup((current) => current === group.id ? "" : group.id)} sx={{ width: "100%", py: .5, justifyContent: "space-between", borderRadius: 1 }}><Stack direction="row" spacing={.75} alignItems="center"><Typography variant="subtitle2" fontWeight={760}>{group.id === "structure" ? "内容结构" : group.id === "media" ? "媒体" : "高级组件"}</Typography><Typography variant="caption" color="text.disabled">{group.commands.length}</Typography></Stack><ChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}/></ButtonBase><Collapse in={expanded} timeout={160} unmountOnExit><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: .75, pt: 1 }}>{group.commands.map((command) => { const Icon = command.icon; return <InsertCard key={command.id} title={command.label} description={command.description} icon={<Icon size={19}/>} onClick={(event) => runInsert(command.id, event.currentTarget)}/>; })}</Box></Collapse></Box>; })}{insertGroups.length === 0 && <Box sx={{ py: 5, textAlign: "center" }}><Search size={24} color="#98A2B3"/><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>没有找到相关组件</Typography></Box>}</>}
    </Stack>
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={.5} sx={{ px: 1.25, py: .75, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}><Tool title="撤销" disabled={!state.canUndo} onClick={() => chain().undo().run()}><Undo2 size={16}/></Tool><Tool title="重做" disabled={!state.canRedo} onClick={() => chain().redo().run()}><Redo2 size={16}/></Tool><Tool title={fullscreen ? "退出专注模式" : "进入专注模式"} onClick={onToggleFullscreen}>{fullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</Tool></Stack>
    <Popover open={Boolean(linkAnchor)} anchorEl={linkAnchor} onClose={() => setLinkAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}><Stack spacing={1.25} sx={{ p: 2.5, width: 320 }}><Typography variant="subtitle2">链接地址</Typography><TextField size="small" fullWidth placeholder="https://" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)}/><Button variant="contained" disabled={!linkUrl} onClick={() => { setLinkAnchor(null); chain().extendMarkRange("link").setLink({ href: linkUrl }).run(); }}>应用链接</Button></Stack></Popover>
    <Popover open={Boolean(tableAnchor)} anchorEl={tableAnchor} onClose={() => setTableAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}><Box sx={{ p: 2 }}><TablePreview onSelect={(rows, cols) => { setTableAnchor(null); chain().insertTable({ rows, cols, withHeaderRow: true }).run(); }}/></Box></Popover>
    <Snackbar open={Boolean(deleted)} autoHideDuration={4000} onClose={() => setDeleted(null)} message="区块已删除" action={<Button color="primary" size="small" onClick={restoreDeleted}>撤销</Button>}/>
  </Paper>;
}
