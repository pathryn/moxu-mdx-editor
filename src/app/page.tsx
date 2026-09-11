"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppBar, Box, Button, Drawer, IconButton, Snackbar, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import { Check, ChevronRight, Clipboard, Code2, Download, Eye, Feather, FileText, LoaderCircle, X } from "lucide-react";
import { MdxEditor, sampleDocument, toMdx } from "@/components/mdx-editor";

const MdxPreview = dynamic(() => import("@/components/mdx-runtime").then((module) => module.MdxPreview), {
  ssr: false,
  loading: () => <Box sx={{ p: 4, color: "text.secondary" }}>正在载入预览器…</Box>,
});

export default function Home() {
  const [title, setTitle] = useState("把复杂内容写得更清楚");
  const [mdx, setMdx] = useState(() => toMdx(sampleDocument));
  const [sourceOpen, setSourceOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncState, setSyncState] = useState<"syncing" | "synced">("synced");
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); }, []);

  function updateMdx(value: string) {
    setMdx(value);
    setSyncState("syncing");
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncState("synced"), 500);
  }

  async function copyMdx() {
    await navigator.clipboard.writeText(mdx);
    setCopied(true);
  }

  function downloadMdx() {
    const safeTitle = title.replaceAll('"', '\\"');
    const blob = new Blob([`---\ntitle: "${safeTitle}"\nlocale: "zh-CN"\n---\n\n${mdx}`], { type: "text/mdx;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "moxu-article.mdx";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <Box sx={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#F6F8FB" }}>
    <AppBar position="static" elevation={0} color="inherit" sx={{ flex: "0 0 auto", borderBottom: 1, borderColor: "divider", bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(20px)" }}>
      <Toolbar sx={{ minHeight: "56px !important", px: { xs: 1.5, md: 2.5 }, gap: 1 }}>
        <Box sx={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 1.2, bgcolor: "primary.main", color: "primary.contrastText" }}><Feather size={17}/></Box>
        <Typography variant="subtitle2" fontWeight={820} sx={{ display: { xs: "none", sm: "block" } }}>墨序 MDX</Typography>
        <Box sx={{ width: "1px", height: 20, bgcolor: "divider", mx: .5 }}/>
        <Stack direction="row" alignItems="center" spacing={.7} sx={{ minWidth: 0, color: "text.secondary" }}><FileText size={16}/><Typography variant="body2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: { xs: 130, sm: 280 } }}>{title || "未命名文档"}</Typography><ChevronRight size={14}/><Typography variant="caption" sx={{ display: { xs: "none", md: "block" } }}>中文写作</Typography></Stack>
        <Box flex={1}/>
        <Stack direction="row" alignItems="center" spacing={.55} sx={{ display: { xs: "none", sm: "flex" }, color: syncState === "synced" ? "success.main" : "text.secondary", minWidth: 76 }}>{syncState === "synced" ? <Check size={15}/> : <LoaderCircle size={15} className="sync-spinner"/>}<Typography variant="caption">{syncState === "synced" ? "同步完成" : "同步中"}</Typography></Stack>
        <Tooltip title="实时预览"><IconButton aria-label="实时预览" onClick={() => setPreviewOpen(true)}><Eye size={18}/></IconButton></Tooltip>
        <Tooltip title="查看 MDX"><IconButton aria-label="查看 MDX" onClick={() => setSourceOpen(true)}><Code2 size={18}/></IconButton></Tooltip>
        <Button variant="outlined" color="inherit" startIcon={<Clipboard size={16}/>} onClick={copyMdx} sx={{ display: { xs: "none", sm: "inline-flex" } }}>复制</Button>
        <Button variant="contained" startIcon={<Download size={16}/>} onClick={downloadMdx}>导出</Button>
      </Toolbar>
    </AppBar>

    <Box component="main" sx={{ width: "100%", maxWidth: 1680, mx: "auto", flex: 1, minHeight: 0, overflow: { xs: "auto", lg: "hidden" }, p: { xs: 1, md: 2 }, display: "flex" }}>
      <MdxEditor title={title} onTitleChange={setTitle} initialContent={sampleDocument} onChange={(value) => updateMdx(value.mdx)} sx={{ flex: 1 }}/>
    </Box>

    <Drawer anchor="right" open={sourceOpen} onClose={() => setSourceOpen(false)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 540 } } } }}><Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}><Box><Typography variant="subtitle1" fontWeight={800}>MDX 输出</Typography><Typography variant="caption" color="text.secondary">与当前文稿实时同步</Typography></Box><Box flex={1}/><IconButton aria-label="关闭 MDX 输出" onClick={() => setSourceOpen(false)}><X size={18}/></IconButton></Stack><Box component="pre" sx={{ m: 0, p: 2.5, flex: 1, overflow: "auto", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, bgcolor: "#101828", color: "#D0D5DD" }}>{mdx}</Box></Drawer>
    <Drawer anchor="right" open={previewOpen} onClose={() => setPreviewOpen(false)} slotProps={{ paper: { sx: { width: { xs: "100%", md: "min(920px, 72vw)" } } } }}><Stack direction="row" alignItems="center" sx={{ minHeight: 64, px: 2.5, borderBottom: 1, borderColor: "divider" }}><Box><Typography variant="subtitle1" fontWeight={800}>文章预览</Typography><Typography variant="caption" color="text.secondary">服务端编译 · 白名单组件渲染</Typography></Box><Box flex={1}/><IconButton aria-label="关闭文章预览" onClick={() => setPreviewOpen(false)}><X size={18}/></IconButton></Stack><Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", bgcolor: "background.paper" }}>{previewOpen && <MdxPreview source={mdx} title={title}/>}</Box></Drawer>
    <Snackbar open={copied} autoHideDuration={1800} onClose={() => setCopied(false)} message="MDX 已复制"/>
  </Box>;
}
