"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Box, Portal } from "@mui/material";
import { filterEditorCommandGroups, type EditorCommand } from "./command-registry";
import { SlashCommandMenu } from "./slash-command-menu";

type MenuState = { from: number; to: number; left: number; top: number; items: EditorCommand[] };

export function SlashCommandController({ editor }: { editor: Editor }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [selected, setSelected] = useState(0);
  const menuRef = useRef(menu);
  const selectedRef = useRef(selected);
  useEffect(() => { menuRef.current = menu; }, [menu]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const refresh = useCallback(() => {
    const { selection } = editor.state;
    const { $from } = selection;
    if (!selection.empty || $from.parent.type.name !== "paragraph") { setMenu(null); return; }
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
    const match = textBefore.match(/^\/([^\s/]*)$/);
    if (!match) { setMenu(null); return; }
    const rect = editor.view.coordsAtPos(selection.from);
    const items = filterEditorCommandGroups(match[1]).flatMap((group) => group.commands);
    setMenu({ from: $from.start(), to: selection.from, left: Math.max(12, Math.min(rect.left, window.innerWidth - 312)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 432)), items });
    setSelected((value) => Math.min(value, Math.max(0, items.length - 1)));
  }, [editor]);

  const execute = useCallback((item: EditorCommand) => {
    const current = menuRef.current;
    if (!current) return;
    editor.chain().focus().deleteRange({ from: current.from, to: current.to }).run();
    item.run(editor);
    setMenu(null);
  }, [editor]);

  useEffect(() => {
    editor.on("transaction", refresh);
    editor.on("selectionUpdate", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    const onKeyDown = (event: KeyboardEvent) => {
      const current = menuRef.current;
      if (!current) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const next = current.items.length ? (selectedRef.current + delta + current.items.length) % current.items.length : 0;
        selectedRef.current = next;
        setSelected(next);
      } else if (event.key === "Enter" && current.items[selectedRef.current]) {
        event.preventDefault();
        execute(current.items[selectedRef.current]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setMenu(null);
      }
    };
    editor.view.dom.addEventListener("keydown", onKeyDown, true);
    return () => { editor.off("transaction", refresh); editor.off("selectionUpdate", refresh); window.removeEventListener("resize", refresh); window.removeEventListener("scroll", refresh, true); editor.view.dom.removeEventListener("keydown", onKeyDown, true); };
  }, [editor, execute, refresh]);

  if (!menu) return null;
  return <Portal><Box data-slash-command="" sx={{ position: "fixed", left: menu.left, top: menu.top, zIndex: 2600 }}><SlashCommandMenu items={menu.items} selected={selected} onHover={setSelected} onSelect={execute}/></Box></Portal>;
}
