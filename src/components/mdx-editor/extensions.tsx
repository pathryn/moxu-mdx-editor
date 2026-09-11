"use client";

import { useState, type CSSProperties } from "react";
import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Box, ButtonBase, IconButton, InputBase, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { ChevronRight, FileAudio, FileText, Globe2, Image as ImageIcon, LayoutPanelTop, SlidersHorizontal, Video, Workflow } from "lucide-react";
import type { MetricItem } from "./types";

export const CalloutBlock = Node.create({
  name: "calloutBlock",
  group: "block",
  content: "paragraph{2,}",
  defining: true,
  isolating: true,
  parseHTML: () => [{ tag: "aside[data-mdx-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["aside", mergeAttributes(HTMLAttributes, { "data-mdx-callout": "" }), 0],
});

function FigureView({ node, selected }: NodeViewProps) {
  return <NodeViewWrapper data-drag-handle>
    <Box component="figure" sx={{ m: "28px 0", position: "relative" }}>
      {node.attrs.src ? <Box component="img" src={node.attrs.src as string} alt={node.attrs.alt as string} sx={{ width: 1, display: "block", borderRadius: 1.5, outline: selected ? "2px solid" : "none", outlineColor: "primary.main", outlineOffset: 2 }}/> : <Box sx={{ minHeight: 180, display: "grid", placeItems: "center", border: "1px dashed", borderColor: selected ? "primary.main" : "divider", borderRadius: 1.5, bgcolor: "action.hover", color: "text.disabled" }}><ImageIcon size={28}/></Box>}
      {Boolean(node.attrs.caption) && <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>{node.attrs.caption as string}</Typography>}
    </Box>
  </NodeViewWrapper>;
}

export const FigureBlock = Node.create({
  name: "figureBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: "" }, alt: { default: "" }, caption: { default: "" } }),
  parseHTML: () => [{ tag: "figure[data-mdx-figure]" }],
  renderHTML: ({ HTMLAttributes }) => ["figure", mergeAttributes(HTMLAttributes, { "data-mdx-figure": "" })],
  addNodeView: () => ReactNodeViewRenderer(FigureView),
});

function MetricsView({ node, selected }: NodeViewProps) {
  const metrics = node.attrs.metrics as MetricItem[];
  return <NodeViewWrapper data-drag-handle>
    <Paper variant="outlined" sx={{ p: 1.5, my: 3, borderRadius: 1.5, borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {metrics.map((metric, index) => <Box key={`${metric.label}-${index}`} sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}><Typography variant="h5" color="primary.main" fontWeight={750}>{metric.value}</Typography><Typography variant="subtitle2">{metric.label}</Typography>{metric.detail && <Typography variant="caption" color="text.secondary">{metric.detail}</Typography>}</Box>)}
      </Stack>
    </Paper>
  </NodeViewWrapper>;
}

export const MetricsBlock = Node.create({
  name: "metricsBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ metrics: { default: [] } }),
  parseHTML: () => [{ tag: "div[data-mdx-metrics]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-mdx-metrics": "" })],
  addNodeView: () => ReactNodeViewRenderer(MetricsView),
});

export const BadgeNode = Node.create({
  name: "badgeNode",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes: () => ({ text: { default: "MDX" }, tone: { default: "success" } }),
  parseHTML: () => [{ tag: "span[data-mdx-badge]" }],
  renderHTML: ({ HTMLAttributes }) => {
    const { text, tone, ...attributes } = HTMLAttributes;
    return ["span", mergeAttributes(attributes, { "data-mdx-badge": "", "data-tone": tone }), text];
  },
});

function CardView({ node, selected, editor, getPos }: NodeViewProps) {
  const variant = String(node.attrs.variant ?? "default");
  const accent = variant === "accent";
  const minimal = variant === "minimal";

  return <NodeViewWrapper data-drag-handle>
    <Box
      component="section"
      data-mdx-card=""
      data-variant={variant}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        const clickedEmptyArea = target === event.currentTarget || target.matches(".card-content, [data-node-view-content-react]");
        const pos = getPos();
        if (clickedEmptyArea && typeof pos === "number") {
          event.preventDefault();
          editor.commands.setNodeSelection(pos);
        }
      }}
      sx={{
        my: 3,
        position: "relative",
        border: "1px solid",
        borderColor: selected ? "primary.main" : minimal ? "transparent" : accent ? (theme) => alpha(theme.palette.primary.main, .3) : "divider",
        borderRadius: minimal ? 1.25 : 2,
        background: accent ? (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, .075)} 0%, ${alpha(theme.palette.primary.main, .025)} 58%, ${theme.palette.background.paper} 100%)` : minimal ? (theme) => alpha(theme.palette.grey[500], .055) : "background.paper",
        boxShadow: selected
          ? (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, .1)}${accent ? `, 0 6px 18px ${alpha(theme.palette.primary.main, .1)}` : ""}`
          : minimal ? "none" : accent ? (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, .1)}` : "0 3px 12px rgba(15,23,42,.06)",
        transition: "border-color .15s ease, box-shadow .15s ease, background-color .15s ease",
      }}
    >
      <NodeViewContent className="card-content"/>
    </Box>
  </NodeViewWrapper>;
}

export const CardBlock = Node.create({
  name: "cardBlock",
  group: "block",
  content: "heading paragraph+",
  defining: true,
  isolating: true,
  draggable: true,
  addAttributes: () => ({
    variant: {
      default: "default",
      parseHTML: (element) => element.getAttribute("data-variant") ?? "default",
      renderHTML: (attributes) => ({ "data-variant": attributes.variant }),
    },
  }),
  parseHTML: () => [{ tag: "section[data-mdx-card]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-card": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(CardView),
});

function DetailsView({ node, selected, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(true);
  const summary = String(node.attrs.summary ?? "展开查看详情");

  return <NodeViewWrapper data-drag-handle>
    <Box
      component="section"
      data-mdx-details-editor=""
      sx={{
        my: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 1.75,
        bgcolor: "background.paper",
        boxShadow: selected ? (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, .1)}` : "none",
        transition: "border-color .15s ease, box-shadow .15s ease",
      }}
    >
      <Stack contentEditable={false} direction="row" alignItems="center" spacing={1} sx={{ minHeight: 48, px: 1.5, bgcolor: open ? (theme) => alpha(theme.palette.grey[500], .045) : "transparent" }}>
        <ButtonBase
          aria-label={open ? "收起内容" : "展开内容"}
          aria-expanded={open}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => setOpen((current) => !current)}
          sx={{ width: 28, height: 28, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: .8, color: "text.secondary", "&:hover": { bgcolor: (theme) => alpha(theme.palette.grey[500], .1) } }}
        >
          <ChevronRight size={15} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease" }}/>
        </ButtonBase>
        <InputBase
          fullWidth
          value={summary}
          placeholder="输入折叠标题"
          inputProps={{ "aria-label": "折叠标题" }}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => updateAttributes({ summary: event.target.value })}
          sx={{ color: "text.primary", "& input": { p: 0, fontSize: 14, lineHeight: 1.5, fontWeight: 760 }, "& input::placeholder": { color: "text.disabled", opacity: 1 } }}
        />
      </Stack>
      <Box sx={{ display: open ? "block" : "none", px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <NodeViewContent className="details-content"/>
      </Box>
    </Box>
  </NodeViewWrapper>;
}

export const DetailsBlock = Node.create({
  name: "detailsBlock",
  group: "block",
  content: "paragraph+",
  defining: true,
  isolating: true,
  draggable: true,
  addAttributes: () => ({
    summary: { default: "展开查看详情" },
    defaultOpen: {
      default: false,
      parseHTML: (element) => element.hasAttribute("open"),
      renderHTML: (attributes) => attributes.defaultOpen ? { open: "open" } : {},
    },
  }),
  parseHTML: () => [{ tag: "details[data-mdx-details]" }],
  renderHTML: ({ HTMLAttributes }) => {
    const { summary, ...attrs } = HTMLAttributes;
    return ["details", mergeAttributes(attrs, { "data-mdx-details": "" }), ["summary", summary], ["div", 0]];
  },
  addNodeView: () => ReactNodeViewRenderer(DetailsView),
});

export const HighlightBlock = Node.create({
  name: "highlightBlock",
  group: "block",
  content: "paragraph+",
  defining: true,
  isolating: true,
  addAttributes: () => ({ tone: { default: "yellow" } }),
  parseHTML: () => [{ tag: "section[data-mdx-highlight]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-highlight": "" }), 0],
});

function WidgetView({ node, selected }: NodeViewProps) {
  const kind = node.attrs.kind as string;
  const title = node.attrs.title as string;
  const columns = (node.attrs.columns ?? ["待处理", "进行中", "已完成"]) as string[];
  const Icon = kind === "embed" ? Globe2 : kind === "kanban" ? LayoutPanelTop : Workflow;
  return <NodeViewWrapper data-drag-handle>
    <Paper variant="outlined" sx={{ my: 2.5, overflow: "hidden", borderRadius: 1.75, borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1, bgcolor: "background.paper" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.15, borderBottom: 1, borderColor: "divider" }}><Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: .9, color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, .08) }}><Icon size={15}/></Box><Typography variant="subtitle2" fontWeight={760}>{title}</Typography></Stack>
      <Box sx={{ p: 1.5 }}>{kind === "kanban" ? <Stack direction="row" spacing={1}>{columns.map((label, index) => <Box key={`${label}-${index}`} sx={{ flex: 1, minWidth: 0, p: 1, borderRadius: 1, bgcolor: "action.hover" }}><Typography variant="caption" fontWeight={750} noWrap>{label}</Typography><Box sx={{ mt: .75, height: 30, borderRadius: .75, bgcolor: "background.paper", border: 1, borderColor: "divider" }}/></Box>)}</Stack> : kind === "diagram" ? <Box component="pre" sx={{ m: 0, p: 1.25, minHeight: 54, whiteSpace: "pre-wrap", borderRadius: 1, bgcolor: "#101828", color: "#D0D5DD", fontFamily: "monospace", fontSize: 12 }}>{String(node.attrs.source ?? "")}</Box> : <Box sx={{ aspectRatio: String(node.attrs.aspectRatio ?? "16/9").replace("/", " / "), display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "action.hover", color: "text.disabled" }}><Globe2 size={26}/></Box>}</Box>
    </Paper>
  </NodeViewWrapper>;
}

export const WidgetBlock = Node.create({
  name: "widgetBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ kind: { default: "embed" }, title: { default: "嵌入内容" }, source: { default: "" }, columns: { default: ["待处理", "进行中", "已完成"] }, aspectRatio: { default: "16/9" } }),
  parseHTML: () => [{ tag: "div[data-mdx-widget]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-mdx-widget": "" })],
  addNodeView: () => ReactNodeViewRenderer(WidgetView),
});

const KanbanContent = styled(NodeViewContent)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(var(--kanban-columns, 3), minmax(0, 1fr))",
  gap: theme.spacing(1),
  padding: theme.spacing(1.25),
  overflowX: "auto",
  "& > [data-node-view-content-react]": { display: "contents" },
  "& > [data-mdx-kanban-column], & > [data-node-view-content-react] > [data-mdx-kanban-column]": {
    minWidth: 150,
    minHeight: 150,
    padding: theme.spacing(1.25),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    background: alpha(theme.palette.grey[500], .045),
    "&:focus-within": { borderColor: alpha(theme.palette.primary.main, .5), background: alpha(theme.palette.primary.main, .025) },
    "h1, h2, h3, h4, h5, h6": { margin: 0, paddingBottom: theme.spacing(1), borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 13, lineHeight: 1.45, fontWeight: 800 },
    "p": { margin: theme.spacing(1, 0), fontSize: 13, lineHeight: 1.55 },
    "p:last-child": { marginBottom: 0 },
  },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

function KanbanView({ node, selected, updateAttributes, editor, getPos }: NodeViewProps) {
  const selectBoard = () => {
    const pos = getPos();
    if (typeof pos === "number") editor.chain().focus().setNodeSelection(pos).run();
  };

  return <NodeViewWrapper>
    <Paper component="section" data-mdx-kanban="" variant="outlined" sx={{ my: 3, overflow: "hidden", borderRadius: 1.75, borderColor: selected ? "primary.main" : "divider", boxShadow: selected ? (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, .1)}` : "none" }}>
      <Stack contentEditable={false} direction="row" alignItems="center" spacing={.5} sx={{ px: 1.5, py: .75, borderBottom: 1, borderColor: "divider", "&:hover .kanban-settings": { opacity: 1 } }}>
        <InputBase
          fullWidth
          value={String(node.attrs.title ?? "内容看板")}
          placeholder="输入看板标题"
          inputProps={{ "aria-label": "看板标题" }}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => updateAttributes({ title: event.target.value })}
          sx={{ "& input": { p: 0, fontSize: 14, fontWeight: 780 }, "& input::placeholder": { color: "text.disabled", opacity: 1 } }}
        />
        <Tooltip title="看板设置">
          <IconButton className="kanban-settings" aria-label="打开看板设置" size="small" onMouseDown={(event) => event.preventDefault()} onClick={selectBoard} sx={{ width: 30, height: 30, flex: "0 0 auto", opacity: selected ? 1 : .45, color: selected ? "primary.main" : "text.secondary", bgcolor: selected ? (theme) => alpha(theme.palette.primary.main, .08) : "transparent", transition: "opacity .15s ease, color .15s ease, background-color .15s ease" }}><SlidersHorizontal size={15}/></IconButton>
        </Tooltip>
      </Stack>
      <KanbanContent style={{ "--kanban-columns": node.childCount } as CSSProperties}/>
    </Paper>
  </NodeViewWrapper>;
}

export const KanbanColumn = Node.create({
  name: "kanbanColumn",
  group: "block",
  content: "heading block+",
  defining: true,
  parseHTML: () => [{ tag: "section[data-mdx-kanban-column]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-kanban-column": "" }), 0],
});

export const KanbanBlock = Node.create({
  name: "kanbanBlock",
  group: "block",
  content: "kanbanColumn{2,5}",
  defining: true,
  isolating: true,
  draggable: true,
  addAttributes: () => ({ title: { default: "内容看板" } }),
  parseHTML: () => [{ tag: "section[data-mdx-kanban]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-kanban": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(KanbanView),
});

export const StyledDivider = Node.create({
  name: "styledDivider",
  group: "block",
  atom: true,
  addAttributes: () => ({ variant: { default: "solid" } }),
  parseHTML: () => [{ tag: "hr[data-mdx-divider]" }],
  renderHTML: ({ HTMLAttributes }) => ["hr", mergeAttributes(HTMLAttributes, { "data-mdx-divider": "" })],
});

const ColumnsContent = styled(NodeViewContent, { shouldForwardProp: (prop) => prop !== "columns" })<{ columns: number }>(({ theme, columns }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  gap: theme.spacing(1.25),
  alignItems: "stretch",
  "& > [data-node-view-content-react]": { display: "contents" },
  "& > [data-mdx-column], & > [data-node-view-content-react] > [data-mdx-column]": {
    minWidth: 0,
    minHeight: 112,
    position: "relative",
    padding: theme.spacing(3.5, 1.5, 1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    background: alpha(theme.palette.grey[500], .035),
    "&::before": { position: "absolute", top: 9, left: 12, color: theme.palette.text.disabled, fontSize: 10, fontWeight: 750, letterSpacing: ".04em", pointerEvents: "none" },
    "&:nth-of-type(1)::before": { content: '"左栏"' },
    "&:nth-of-type(2)::before": { content: '"右栏"' },
    "&:focus-within": { borderColor: alpha(theme.palette.primary.main, .55), background: alpha(theme.palette.primary.main, .025) },
    "p:first-of-type": { marginTop: 0 },
    "p:last-child": { marginBottom: 0 },
  },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

function ColumnsView({ node, selected }: NodeViewProps) {
  return <NodeViewWrapper data-drag-handle><Box component="section" data-mdx-columns="" sx={{ my: 3, p: 1.25, border: "1px solid", borderColor: selected ? "primary.main" : "transparent", bgcolor: selected ? (theme) => alpha(theme.palette.primary.main, .025) : "transparent", borderRadius: 1.75, transition: "border-color .15s ease, background-color .15s ease" }}><ColumnsContent columns={node.childCount}/></Box></NodeViewWrapper>;
}

export const ColumnBlock = Node.create({
  name: "columnBlock",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML: () => [{ tag: "div[data-mdx-column]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-mdx-column": "" }), 0],
});

export const ColumnsBlock = Node.create({
  name: "columnsBlock",
  group: "block",
  content: "columnBlock{2,4}",
  defining: true,
  isolating: true,
  draggable: true,
  parseHTML: () => [{ tag: "section[data-mdx-columns]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-columns": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(ColumnsView),
});

const TabsContent = styled(NodeViewContent, { shouldForwardProp: (prop) => prop !== "activeIndex" })<{ activeIndex: number }>(({ theme, activeIndex }) => ({
  padding: theme.spacing(1.5),
  "& > [data-node-view-content-react] > [data-mdx-tab-panel]": { display: "none" },
  [`& > [data-node-view-content-react] > [data-mdx-tab-panel]:nth-of-type(${activeIndex + 1})`]: { display: "block" },
  "& [data-mdx-tab-panel] > p:first-of-type": { marginTop: 0 },
  "& [data-mdx-tab-panel] > p:last-child": { marginBottom: 0 },
}));

function TabsView({ node, selected, editor, getPos }: NodeViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const labels = Array.from({ length: node.childCount }, (_, index) => String(node.child(index).attrs.label || `标签 ${index + 1}`));
  const safeIndex = Math.min(activeIndex, Math.max(0, labels.length - 1));
  const selectTabs = () => {
    const pos = getPos();
    if (typeof pos === "number") editor.commands.setNodeSelection(pos);
  };

  return <NodeViewWrapper>
    <Paper component="section" data-mdx-tabs="" variant="outlined" sx={{ my: 3, overflow: "hidden", borderRadius: 1.75, borderColor: selected ? "primary.main" : "divider", boxShadow: selected ? (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, .1)}` : "none" }}>
      <Stack contentEditable={false} direction="row" alignItems="stretch" sx={{ minHeight: 42, px: 1, gap: .25, borderBottom: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.grey[500], .035) }} onMouseDown={(event) => event.stopPropagation()}>
        {labels.map((label, index) => <ButtonBase key={index} onClick={() => setActiveIndex(index)} sx={{ px: 1.25, borderBottom: "2px solid", borderColor: index === safeIndex ? "primary.main" : "transparent", color: index === safeIndex ? "primary.main" : "text.secondary", fontSize: 13, fontWeight: index === safeIndex ? 800 : 650 }}>{label}</ButtonBase>)}
        <Box flex={1} onClick={selectTabs}/>
        <Tooltip title="标签页设置"><IconButton aria-label="打开标签页设置" size="small" onClick={selectTabs} sx={{ alignSelf: "center", color: selected ? "primary.main" : "text.secondary" }}><SlidersHorizontal size={15}/></IconButton></Tooltip>
      </Stack>
      <TabsContent activeIndex={safeIndex}/>
    </Paper>
  </NodeViewWrapper>;
}

export const TabPanel = Node.create({
  name: "tabPanel",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({ label: { default: "标签" }, value: { default: "tab" } }),
  parseHTML: () => [{ tag: "section[data-mdx-tab-panel]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-tab-panel": "" }), 0],
});

export const TabsBlock = Node.create({
  name: "tabsBlock",
  group: "block",
  content: "tabPanel{2,6}",
  defining: true,
  isolating: true,
  draggable: true,
  parseHTML: () => [{ tag: "section[data-mdx-tabs]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-tabs": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(TabsView),
});

function GalleryView({ node, selected }: NodeViewProps) {
  const items = (node.attrs.items ?? []) as Array<{ src: string; alt: string }>;
  const columns = Math.max(1, Math.min(Number(node.attrs.columns ?? 3), 4));
  return <NodeViewWrapper data-drag-handle><Box component="figure" data-mdx-gallery="" sx={{ my: 3, mInline: 0, p: 1, border: "1px solid", borderColor: selected ? "primary.main" : "divider", borderRadius: 1.5 }}><Box sx={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length || 1, columns)}, minmax(0, 1fr))`, gap: 1 }}>{items.map((item, index) => item.src ? <Box component="img" key={`${item.src}-${index}`} src={item.src} alt={item.alt} sx={{ width: 1, aspectRatio: "4/3", objectFit: "cover", borderRadius: 1 }}/> : <Box key={index} sx={{ aspectRatio: "4/3", display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "action.hover", color: "text.disabled" }}><ImageIcon size={22}/></Box>)}</Box>{Boolean(node.attrs.caption) && <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", pt: 1, textAlign: "center" }}>{String(node.attrs.caption)}</Typography>}</Box></NodeViewWrapper>;
}

export const GalleryBlock = Node.create({
  name: "galleryBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ items: { default: [] }, columns: { default: 3 }, caption: { default: "" } }),
  parseHTML: () => [{ tag: "section[data-mdx-gallery]" }],
  renderHTML: ({ HTMLAttributes }) => ["section", mergeAttributes(HTMLAttributes, { "data-mdx-gallery": "" })],
  addNodeView: () => ReactNodeViewRenderer(GalleryView),
});

function MediaView({ node, selected }: NodeViewProps) {
  const kind = node.attrs.kind as "audio" | "video" | "attachment";
  const src = node.attrs.src as string;
  const title = node.attrs.title as string;
  const Icon = kind === "audio" ? FileAudio : kind === "video" ? Video : FileText;
  return <NodeViewWrapper data-drag-handle data-mdx-media={kind}><Paper variant="outlined" sx={{ my: 2.5, p: 1.5, borderRadius: 1.5, borderColor: selected ? "primary.main" : "divider" }}><Stack spacing={1.25}><Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 1, color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, .08) }}><Icon size={16}/></Box><Box minWidth={0}><Typography variant="subtitle2" fontWeight={750} noWrap>{title}</Typography>{Boolean(node.attrs.description) && <Typography variant="caption" color="text.secondary" noWrap>{String(node.attrs.description)}</Typography>}</Box></Stack>{src && kind === "audio" && <audio controls src={src} style={{ width: "100%" }}/>} {src && kind === "video" && <video controls src={src} poster={String(node.attrs.poster ?? "") || undefined} style={{ width: "100%", borderRadius: 8 }}/>} {src && kind === "attachment" && <Typography component="a" href={src} variant="body2" color="primary" onClick={(event) => event.preventDefault()}>下载附件</Typography>} {!src && <Box sx={{ py: 2.5, display: "grid", placeItems: "center", borderRadius: 1, bgcolor: "action.hover", color: "text.disabled" }}><Icon size={24}/></Box>}</Stack></Paper></NodeViewWrapper>;
}

export const MediaBlock = Node.create({
  name: "mediaBlock",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ kind: { default: "attachment" }, title: { default: "附件" }, src: { default: "" }, description: { default: "" }, poster: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-mdx-media]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-mdx-media": "" })],
  addNodeView: () => ReactNodeViewRenderer(MediaView),
});
