"use client";

import { Children, isValidElement, useId, useMemo, useState, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from "react";
import { Box, Button, Link, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Copy, Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";

const safeUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch { return ""; }
};

const allowedEmbedHosts = new Set((process.env.NEXT_PUBLIC_MDX_EMBED_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean));
const safeEmbedUrl = (value?: string) => {
  if (!value || allowedEmbedHosts.size === 0) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedEmbedHosts.has(url.hostname.toLowerCase()) ? url.toString() : "";
  } catch { return ""; }
};

function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const [copied, setCopied] = useState(false);
  const text = typeof props.children === "string" ? props.children : "";
  return <Box sx={{ position: "relative", my: 2.5, "&:hover .copy-code": { opacity: 1 } }}>
    <Box component="pre" {...props} sx={{ m: 0, px: 2, py: 1.75, overflowX: "auto", borderRadius: 1.5, bgcolor: "#0D1117", color: "#E6EDF3", fontSize: 13, lineHeight: 1.7, "& code": { fontFamily: "var(--font-geist-mono), monospace" }, "& [data-line]": { display: "inline-block", width: "100%" } }}/>
    <Button className="copy-code" size="small" color="inherit" startIcon={<Copy size={13}/>} onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} sx={{ position: "absolute", top: 8, right: 8, minWidth: 0, opacity: .25, bgcolor: "rgba(255,255,255,.1)", color: "#E6EDF3", "&:hover": { bgcolor: "rgba(255,255,255,.18)" } }}>{copied ? "已复制" : "复制"}</Button>
  </Box>;
}

function Callout({ title = "提示", tone = "info", children }: { title?: string; tone?: "info" | "success" | "warning" | "error"; children?: ReactNode }) {
  return <Box component="aside" data-tone={tone} sx={{ my: "28px", px: 2.5, py: 2.25, border: "1px solid", borderColor: (theme) => alpha(theme.palette.primary.main, .2), borderLeft: "4px solid", borderLeftColor: "primary.main", borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, .06), "& p:first-of-type": { mt: 0 }, "& p:last-child": { mb: 0 } }}><Typography component="div" color="primary.main" fontSize={13} fontWeight={750} sx={{ mb: .75 }}>{title}</Typography>{children}</Box>;
}

function Figure({ src, alt = "", caption }: { src?: string; alt?: string; caption?: string }) {
  const url = safeUrl(src);
  return <Box component="figure" sx={{ m: "28px 0" }}>{url ? <Box component="img" src={url} alt={alt} sx={{ width: 1, display: "block", borderRadius: 2 }}/>: <Box sx={{ minHeight: 180, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "action.hover", color: "text.disabled" }}><ImageIcon/></Box>}{caption && <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>{caption}</Typography>}</Box>;
}

function MetricGrid({ children }: { children?: ReactNode }) { return <Paper variant="outlined" sx={{ p: 1.5, my: 3, borderRadius: 1.5 }}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.max(1, Children.count(children))},minmax(0,1fr))` }, gap: 1 }}>{children}</Box></Paper>; }
function Metric({ value, label, detail }: { value?: string; label?: string; detail?: string }) { return <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}><Typography variant="h5" fontWeight={750} color="primary.main">{value}</Typography><Typography variant="subtitle2">{label}</Typography>{detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}</Box>; }

function Card({ title, variant = "default", children }: { title?: string; variant?: "default" | "accent" | "minimal"; children?: ReactNode }) {
  return <Paper elevation={0} sx={{ my: 3, px: 2.25, py: 2, border: "1px solid", borderColor: variant === "minimal" ? "transparent" : variant === "accent" ? (theme) => alpha(theme.palette.primary.main, .3) : "divider", borderRadius: variant === "minimal" ? 1.25 : 2, bgcolor: variant === "minimal" ? (theme) => alpha(theme.palette.grey[500], .055) : "background.paper", backgroundImage: variant === "accent" ? (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, .075)} 0%, ${alpha(theme.palette.primary.main, .025)} 58%, transparent 100%)` : "none", boxShadow: variant === "minimal" ? "none" : variant === "accent" ? (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, .1)}` : "0 3px 12px rgba(15,23,42,.06)", "& p:last-child": { mb: 0 } }}><Typography component="div" sx={{ mb: 1.25, fontSize: "1.1rem", lineHeight: 1.45, fontWeight: 800 }}>{title}</Typography>{children}</Paper>;
}
function Details({ summary = "展开查看详情", defaultOpen = false, children }: { summary?: string; defaultOpen?: boolean; children?: ReactNode }) { return <Box component="details" open={defaultOpen || undefined} sx={{ my: 3, border: 1, borderColor: "divider", borderRadius: 1.75, overflow: "hidden", bgcolor: "background.paper", "& summary": { cursor: "pointer", px: 2, py: 1.5, listStyle: "none", fontWeight: 750, bgcolor: (theme) => alpha(theme.palette.grey[500], .045), "&::-webkit-details-marker": { display: "none" }, "&::before": { content: '"›"', display: "inline-block", mr: 1.25, color: "text.secondary", transition: "transform .15s ease" } }, "&[open] summary::before": { transform: "rotate(90deg)" }, "& > div": { px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }, "& p:first-of-type": { mt: 0 }, "& p:last-child": { mb: 0 } }}><Box component="summary">{summary}</Box><Box>{children}</Box></Box>; }
function Highlight({ tone = "yellow", children }: { tone?: string; children?: ReactNode }) { const colors: Record<string,{bg:string;border:string}> = { yellow: { bg: "#FFF8DF", border: "#F5D67B" }, blue: { bg: "#EFF4FF", border: "#B2CCFF" }, green: { bg: "#ECFDF3", border: "#A9EFC5" }, pink: { bg: "#FFF0F4", border: "#FECDD6" } }; const color = colors[tone] ?? colors.yellow; return <Box sx={{ my: 3, p: 2, border: "1px solid", borderColor: color.border, borderRadius: 1.5, bgcolor: color.bg, "& p:first-of-type": { mt: 0 }, "& p:last-child": { mb: 0 } }}>{children}</Box>; }
function Columns({ children }: { children?: ReactNode }) { return <Box sx={{ my: 3, p: 1.25, display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.max(1, Children.count(children))},minmax(0,1fr))` }, gap: 1.25 }}>{children}</Box>; }
function Column({ children }: { children?: ReactNode }) { return <Box sx={{ minWidth: 0, minHeight: 112, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.25, bgcolor: (theme) => alpha(theme.palette.grey[500], .035), "& p:first-of-type": { mt: 0 }, "& p:last-child": { mb: 0 } }}>{children}</Box>; }

type GalleryItem = { src: string; alt?: string };
function Gallery({ items = [], columns = 3, caption }: { items?: GalleryItem[]; columns?: number; caption?: string }) { return <Box component="figure" sx={{ m: "28px 0" }}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.max(1, Math.min(4, columns))},minmax(0,1fr))` }, gap: 1 }}>{items.map((item, index) => <Box component="img" key={`${item.src}-${index}`} src={safeUrl(item.src)} alt={item.alt ?? ""} sx={{ width: 1, aspectRatio: "4/3", objectFit: "cover", borderRadius: 1.5, bgcolor: "action.hover" }}/>)}</Box>{caption && <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>{caption}</Typography>}</Box>; }

function Audio({ title, src, description }: { title?: string; src?: string; description?: string }) { const url = safeUrl(src); return <Paper variant="outlined" sx={{ my: 2.5, p: 2, borderRadius: 1.5 }}><Typography fontWeight={750}>{title}</Typography>{description && <Typography variant="body2" color="text.secondary">{description}</Typography>}{url && <Box component="audio" controls src={url} sx={{ width: 1, mt: 1.5 }}/>}</Paper>; }
function Video({ title, src, description, poster }: { title?: string; src?: string; description?: string; poster?: string }) { const url = safeUrl(src); return <Box sx={{ my: 2.5 }}><Typography fontWeight={750}>{title}</Typography>{description && <Typography variant="body2" color="text.secondary">{description}</Typography>}{url && <Box component="video" controls src={url} poster={safeUrl(poster) || undefined} sx={{ width: 1, mt: 1, borderRadius: 1.5, bgcolor: "#101828" }}/>}</Box>; }
function Attachment({ title = "附件", src, description }: { title?: string; src?: string; description?: string }) { const url = safeUrl(src); return <Paper variant="outlined" sx={{ my: 2.5, p: 1.5, borderRadius: 1.5 }}><Stack direction="row" spacing={1.25} alignItems="center"><FileText size={20}/><Box flex={1} minWidth={0}><Typography fontWeight={750}>{title}</Typography>{description && <Typography variant="caption" color="text.secondary">{description}</Typography>}</Box>{url && <Button component="a" href={url} download startIcon={<Download size={15}/>}>下载</Button>}</Stack></Paper>; }
function Embed({ title, url, aspectRatio = "16/9" }: { title?: string; url?: string; aspectRatio?: string }) { const src = safeEmbedUrl(url); return <Box sx={{ my: 2.5 }}><Stack direction="row" alignItems="center" sx={{ mb: 1 }}><Typography fontWeight={750}>{title}</Typography><Box flex={1}/>{src && <Link href={src} target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开"><ExternalLink size={15}/></Link>}</Stack>{src ? <Box component="iframe" title={title || "嵌入内容"} src={src} sandbox="allow-scripts allow-presentation" referrerPolicy="no-referrer" loading="lazy" sx={{ width: 1, border: 1, borderColor: "divider", borderRadius: 1.5, aspectRatio: aspectRatio.replace("/", " / ") }}/> : <Paper variant="outlined" sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>嵌入地址未获允许，请配置域名白名单</Paper>}</Box>; }

function Kanban({ title, children }: { title?: string; children?: ReactNode }) { return <Paper variant="outlined" sx={{ my: 3, overflow: "hidden", borderRadius: 1.75 }}><Box sx={{ px: 1.5, py: 1.25, borderBottom: 1, borderColor: "divider" }}><Typography variant="subtitle2" fontWeight={780}>{title}</Typography></Box><Box sx={{ p: 1.25, display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.max(1, Children.count(children))},minmax(0,1fr))` }, gap: 1 }}>{children}</Box></Paper>; }
function KanbanColumn({ title, children }: { title?: string; children?: ReactNode }) { return <Box sx={{ p: 1.25, minWidth: 0, minHeight: 150, border: 1, borderColor: "divider", borderRadius: 1.25, bgcolor: (theme) => alpha(theme.palette.grey[500], .045), "& p:last-child": { mb: 0 } }}><Typography variant="subtitle2" fontWeight={800} sx={{ pb: 1, borderBottom: 1, borderColor: "divider" }}>{title}</Typography>{children}</Box>; }
function Flowchart({ title, source = "" }: { title?: string; source?: string }) { return <Box sx={{ my: 2.5 }}><Typography fontWeight={750} sx={{ mb: 1 }}>{title}</Typography><Box component="pre" sx={{ m: 0, p: 2, overflowX: "auto", borderRadius: 1.5, bgcolor: "#0D1117", color: "#E6EDF3", fontSize: 13 }}>{source}</Box></Box>; }
function Badge({ tone = "success", children }: { tone?: "success" | "info" | "warning" | "error"; children?: ReactNode }) { const success = tone === "success"; return <Box component="span" sx={{ display: "inline-flex", px: 1, py: .25, mx: .35, borderRadius: 99, verticalAlign: "middle", color: success ? "#187A55" : "primary.main", bgcolor: success ? "#DCF5E8" : (theme) => alpha(theme.palette.primary.main, .12), fontSize: ".75em", fontWeight: 750 }}>{children}</Box>; }
function Divider({ variant = "solid" }: { variant?: "solid" | "dashed" | "dotted" }) { return <Box component="hr" sx={{ my: "30px", border: 0, borderTop: variant === "solid" ? 0 : "2px solid", borderStyle: variant, borderColor: (theme) => alpha(theme.palette.grey[500], .35), height: variant === "solid" ? 2 : 0, bgcolor: variant === "solid" ? (theme) => alpha(theme.palette.grey[500], .3) : "transparent" }}/>; }
function PullQuote({ children }: { children?: ReactNode }) { return <Box component="blockquote" sx={{ width: 1, maxWidth: 680, position: "relative", my: 3, mx: "auto", py: 3, pr: 3, pl: 8, borderLeft: "8px solid", borderColor: (theme) => alpha(theme.palette.grey[500], .12), color: "text.secondary", fontFamily: "Georgia, serif", fontSize: "1.35em", lineHeight: 1.55, "&::before": { content: '"“"', position: "absolute", left: 16, top: -8, color: "text.disabled", fontSize: "3em" }, "& p": { m: 0, font: "inherit" } }}>{children}</Box>; }

type TabProps = { value: string; label: string; children?: ReactNode };
function Tab({ children }: TabProps) { return <>{children}</>; }
function Tabs({ defaultValue, children }: { defaultValue?: string; children?: ReactNode }) {
  const tabs = useMemo(() => Children.toArray(children).filter(isValidElement) as ReactElement<TabProps>[], [children]);
  const initial = defaultValue && tabs.some((tab) => tab.props.value === defaultValue) ? defaultValue : tabs[0]?.props.value ?? "";
  const [active, setActive] = useState(initial);
  const id = useId();
  const current = tabs.find((tab) => tab.props.value === active) ?? tabs[0];
  return <Paper variant="outlined" sx={{ my: 3, overflow: "hidden", borderRadius: 1.75 }}><Stack role="tablist" direction="row" spacing={.25} onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const currentIndex = Math.max(0, tabs.findIndex((tab) => tab.props.value === active)); const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length : (currentIndex - 1 + tabs.length) % tabs.length; setActive(tabs[nextIndex].props.value); (event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex])?.focus(); }} sx={{ minHeight: 42, px: 1, borderBottom: 1, borderColor: "divider", bgcolor: (theme) => alpha(theme.palette.grey[500], .035), overflowX: "auto" }}>{tabs.map((tab) => { const selected = tab.props.value === active; const tabId = `${id}-${tab.props.value}`; return <Button key={tab.props.value} role="tab" id={`${tabId}-tab`} aria-selected={selected} aria-controls={`${tabId}-panel`} tabIndex={selected ? 0 : -1} color={selected ? "primary" : "inherit"} onClick={() => setActive(tab.props.value)} sx={{ minWidth: 0, px: 1.25, borderRadius: 0, borderBottom: "2px solid", borderColor: selected ? "primary.main" : "transparent", fontSize: 13, fontWeight: selected ? 800 : 650 }}>{tab.props.label}</Button>; })}</Stack>{current && <Box role="tabpanel" id={`${id}-${current.props.value}-panel`} aria-labelledby={`${id}-${current.props.value}-tab`} sx={{ p: 1.5, "& p:first-of-type": { mt: 0 }, "& p:last-child": { mb: 0 } }}>{current}</Box>}</Paper>;
}

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => <Typography component="h1" sx={{ mt: 6, mb: 0, fontSize: "1.875rem", lineHeight: 1.25, fontWeight: 800 }} {...props}/>,
  h2: (props: ComponentPropsWithoutRef<"h2">) => <Typography component="h2" sx={{ mt: 6, mb: 0, fontSize: "1.5rem", lineHeight: 1.3, fontWeight: 800 }} {...props}/>,
  h3: (props: ComponentPropsWithoutRef<"h3">) => <Typography component="h3" sx={{ mt: 6, mb: 0, fontSize: "1.25rem", lineHeight: 1.35, fontWeight: 800 }} {...props}/>,
  h4: (props: ComponentPropsWithoutRef<"h4">) => <Typography component="h4" sx={{ mt: 4, mb: 0, fontSize: "1.125rem", lineHeight: 1.4, fontWeight: 800 }} {...props}/>,
  h5: (props: ComponentPropsWithoutRef<"h5">) => <Typography component="h5" sx={{ mt: 4, mb: 0, fontSize: "1rem", lineHeight: 1.5, fontWeight: 800 }} {...props}/>,
  h6: (props: ComponentPropsWithoutRef<"h6">) => <Typography component="h6" sx={{ mt: 4, mb: 0, fontSize: ".875rem", lineHeight: 1.5, fontWeight: 800 }} {...props}/>,
  p: (props: ComponentPropsWithoutRef<"p">) => <Typography component="p" sx={{ my: 1.5, lineHeight: 1.625 }} {...props}/>,
  a: ({ href, ...props }: ComponentPropsWithoutRef<"a">) => <Link href={safeUrl(href) || "#"} target="_blank" rel="noopener noreferrer" {...props}/>,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <Box component="ul" sx={{ my: 3, px: 4, "& li": { lineHeight: 1.9 }, "& li > p": { m: 0 } }} {...props}/>,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <Box component="ol" sx={{ my: 3, px: 4, "& li": { lineHeight: 1.9 }, "& li > p": { m: 0 } }} {...props}/>,
  code: (props: ComponentPropsWithoutRef<"code">) => <Box component="code" sx={{ px: .5, py: .25, borderRadius: .6, color: "text.secondary", bgcolor: (theme) => alpha(theme.palette.grey[500], .18), fontSize: "body2.fontSize", "pre &": { p: 0, color: "inherit", bgcolor: "transparent", fontSize: "inherit" } }} {...props}/>,
  hr: (props: ComponentPropsWithoutRef<"hr">) => <Box component="hr" sx={{ my: 4, border: 0, borderBottom: 1, borderColor: "divider" }} {...props}/>,
  pre: CodeBlock,
  table: (props: ComponentPropsWithoutRef<"table">) => <Box sx={{ my: 2.5, overflowX: "auto" }}><Box component="table" sx={{ width: 1, tableLayout: "fixed", borderCollapse: "collapse", "th,td": { minWidth: 100, px: 1.25, py: 1, border: 1, borderColor: (theme) => alpha(theme.palette.common.black, .12), textAlign: "left", verticalAlign: "top" }, th: { bgcolor: (theme) => alpha(theme.palette.primary.main, .075), borderBottomColor: (theme) => alpha(theme.palette.primary.main, .24), fontWeight: 800 }, "tr:nth-of-type(even) td": { bgcolor: (theme) => alpha(theme.palette.grey[500], .025) } }} {...props}/></Box>,
  Callout, Figure, MetricGrid, Metric, Card, Details, Highlight, Columns, Column, Gallery, Audio, Video, Attachment, Embed, Kanban, KanbanColumn, Flowchart, Badge, Divider, PullQuote, Tabs, Tab,
};
