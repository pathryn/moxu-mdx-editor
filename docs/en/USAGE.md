# Moxu MDX usage

## Editor contract

`MdxEditor` accepts `initialContent`, `title`, `onTitleChange`, `placeholder`, `minHeight`, `fullToolbar`, `sx` and `onChange`. The change callback returns `{ json, mdx }`.

Persist JSON as the editable source of truth. MDX is a publishing artifact and should not overwrite JSON unless a dedicated MDX-to-Tiptap importer is implemented.

```tsx
<MdxEditor
  initialContent={documentJson}
  title={title}
  onTitleChange={setTitle}
  onChange={({ json, mdx }) => saveDraft({ title, json, mdx })}
/>
```

## Controlled components

The runtime supports Callout, Figure, MetricGrid, Metric, Badge, Card, Details, Highlight, Columns, Column, Tabs, Tab, Embed, Kanban, KanbanColumn, Flowchart, Gallery, Audio, Video, Attachment, Divider and PullQuote.

Adding a component requires four synchronized changes:

1. Define its schema and NodeView in the editor extensions.
2. Add deterministic serialization to MDX.
3. Register insertion and property controls.
4. Add its publishing implementation and security allowlist entry.

## Preview

`MdxPreview` debounces edits and posts controlled MDX to `/api/mdx/compile`. The API applies AST allowlists before compiling headings and code highlighting. Imports, exports, free expressions, spread props, unknown components and unknown attributes are rejected.

External embeds require a comma-separated `NEXT_PUBLIC_MDX_EMBED_HOSTS` list. Use HTTPS hostnames only.

## Production integration

Add authentication, authorization, durable storage, content versioning and a publishing workflow in the host application. Enforce request limits at the gateway and isolate MDX compilation from the main application process when accepting content from multiple tenants.
