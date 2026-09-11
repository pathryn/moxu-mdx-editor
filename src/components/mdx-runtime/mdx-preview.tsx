"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import { MDXClient } from "next-mdx-remote-client/csr";
import { mdxComponents } from "./components";

type PreviewState = { status: "idle" | "loading" | "ready" | "error"; compiledSource?: string; error?: string };

export function MdxPreview({ source, title }: { source: string; title?: string }) {
  const [state, setState] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch("/api/mdx/compile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source }), signal: controller.signal });
        const data = await response.json() as { compiledSource?: string; error?: string };
        if (!response.ok || !data.compiledSource) throw new Error(data.error || "预览编译失败。");
        setState({ status: "ready", compiledSource: data.compiledSource });
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: "error", error: error instanceof Error ? error.message : "预览编译失败。" });
      }
    }, 280);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [source]);

  return <Box sx={{ width: 1, maxWidth: 760, mx: "auto", px: { xs: 2.5, md: 3.25 }, pt: 3, pb: 8, color: "text.primary" }}>
    {title && <Typography component="h1" sx={{ mb: 3, fontSize: { xs: 25, md: 31 }, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-.03em" }}>{title}</Typography>}
    {(state.status === "idle" || state.status === "loading") && !state.compiledSource && <Stack spacing={1.5}><Skeleton variant="text" width="72%" height={42}/><Skeleton variant="text"/><Skeleton variant="text" width="92%"/><Skeleton variant="rounded" height={160}/></Stack>}
    {state.status === "loading" && state.compiledSource && <CircularProgress size={18} sx={{ position: "fixed", top: 72, right: 24 }}/>} 
    {state.status === "error" && <Alert severity="error">{state.error}</Alert>}
    {state.compiledSource && <MDXClient compiledSource={state.compiledSource} components={mdxComponents} onError={({ error }) => <Alert severity="error">{error.message}</Alert>}/>} 
  </Box>;
}
