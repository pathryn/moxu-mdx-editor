# Moxu MDX

English · [中文](README.md)

> Release status: community preview, licensed under the [MIT License](LICENSE).

Moxu MDX is a structured visual MDX editor built with Tiptap, MUI and Next.js. Authors edit rich content and controlled product components while applications receive both recoverable Tiptap JSON and publishable MDX.

## Highlights

- Responsive writing workspace, slash commands and focused editing mode
- Headings, lists, tasks, tables, code, media and structured product components
- One command registry shared by the insert panel and slash menu
- Tiptap JSON as the editing source of truth with deterministic MDX serialization
- Server-side preview compilation with AST component and property allowlists
- Keyboard-accessible controls and reduced-motion support

## Quick start

Requirements: Node.js 20.9+ and pnpm 11.1.2.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Verify a production change with:

```bash
pnpm check
pnpm audit --prod
```

## Basic use

```tsx
"use client";

import { MdxEditor, sampleDocument } from "@/components/mdx-editor";

export default function WritingPage() {
  return <MdxEditor initialContent={sampleDocument} onChange={({ json, mdx }) => {
    // Persist JSON for editing and MDX for controlled publishing.
    console.log(json, mdx);
  }} />;
}
```

## Documentation

- [Usage](docs/en/USAGE.md)
- [Architecture](docs/en/ARCHITECTURE.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Release decisions](docs/OPEN_SOURCE_DECISIONS.md)

## Scope and trust boundary

This repository is currently a demo application, not an npm library. It does not include authentication, database persistence, publishing or arbitrary MDX import. Preview accepts only the controlled dialect emitted by the editor. It must not be treated as a general sandbox for untrusted MDX.

External iframe embeds are disabled by default. Review and configure HTTPS hostnames with `NEXT_PUBLIC_MDX_EMBED_HOSTS`; production deployments should also enforce gateway rate limits and isolate compilation resources.
