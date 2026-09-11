import type { JSONContent } from "@tiptap/core";
import type { SxProps, Theme } from "@mui/material/styles";

export type MdxEditorValue = {
  json: JSONContent;
  mdx: string;
};

export type MdxEditorProps = {
  initialContent?: JSONContent;
  title?: string;
  onTitleChange?: (title: string) => void;
  placeholder?: string;
  minHeight?: number;
  fullToolbar?: boolean;
  sx?: SxProps<Theme>;
  onChange?: (value: MdxEditorValue) => void;
};

export type MetricItem = {
  value: string;
  label: string;
  detail?: string;
};
