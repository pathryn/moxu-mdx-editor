"use client";

import { useEffect, useMemo, useRef } from "react";
import { Box, ListItemButton, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { EditorCommand } from "./command-registry";
import { editorCommandGroups } from "./command-registry";

type Props = { items: EditorCommand[]; selected: number; onSelect: (item: EditorCommand) => void; onHover: (index: number) => void };

export function SlashCommandMenu({ items, selected, onSelect, onHover }: Props) {
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const grouped = useMemo(() => editorCommandGroups.map((group) => ({ ...group, commands: group.commands.filter((command) => items.some((item) => item.id === command.id)) })).filter((group) => group.commands.length), [items]);
  useEffect(() => { itemRefs.current[selected]?.scrollIntoView({ block: "nearest" }); }, [selected]);

  if (!items.length) return <Paper elevation={12} sx={{ width: 280, p: 2, border: 1, borderColor: "divider" }}><Typography variant="body2" color="text.secondary">没有匹配的命令</Typography></Paper>;

  return <Paper elevation={16} sx={{ width: 300, maxHeight: 420, overflowY: "auto", p: .75, border: 1, borderColor: "divider", borderRadius: 2, scrollbarGutter: "stable" }}>
    {grouped.map((group) => <Box key={group.id} sx={{ "& + &": { mt: .75 } }}><Typography variant="caption" color="text.disabled" fontWeight={750} sx={{ display: "block", px: 1.25, py: .75 }}>{group.label}</Typography>{group.commands.map((item) => { const index = items.findIndex((candidate) => candidate.id === item.id); const Icon = item.icon; return <ListItemButton key={item.id} ref={(element) => { itemRefs.current[index] = element; }} selected={index === selected} onMouseEnter={() => onHover(index)} onClick={() => onSelect(item)} sx={{ minHeight: 52, px: 1, py: .65, gap: 1.25, borderRadius: 1.25, "&.Mui-selected": { bgcolor: (theme) => alpha(theme.palette.primary.main, .1) } }}><Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", flexShrink: 0, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", color: index === selected ? "primary.main" : "text.secondary" }}><Icon size={18}/></Box><Stack spacing={0} sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={750}>{item.label}</Typography><Typography variant="caption" color="text.secondary" noWrap>{item.description}</Typography></Stack></ListItemButton>; })}</Box>)}
  </Paper>;
}
