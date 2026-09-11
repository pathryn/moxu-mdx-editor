# Moxu MDX architecture

## Data flow

```text
Tiptap JSON → deterministic serializer → controlled MDX
                                      ↓
AST allowlist → server compilation → registered runtime components → preview
```

Tiptap JSON is the recoverable editing model. MDX is derived output for review, versioning and publishing. This avoids lossy round trips through arbitrary MDX.

## Modules

- `src/components/mdx-editor`: editor shell, extensions, commands, controls and serializer
- `src/components/mdx-runtime`: preview client and publishing component registry
- `src/lib/mdx-security.ts`: AST component, attribute and literal-expression policy
- `src/app/api/mdx/compile`: bounded same-origin preview compilation endpoint
- `src/app`: demonstration workspace

## Security model

The compiler accepts only registered JSX names and attributes. Attribute expressions must be inert literal data; executable expressions and spread attributes are rejected. Runtime URL checks provide an additional layer. External iframe hosts are opt-in and iframe permissions exclude same-origin access.

The in-memory request limiter is suitable only as local defense in depth. Distributed deployments must use gateway or shared-store rate limiting and apply CPU, memory and execution-time isolation to compilation.

The MDX client runtime currently requires `unsafe-eval`, reflected in the CSP. A future isolated preview origin or non-evaluating renderer should remove that requirement.

## Package direction

The current root is a Next.js demo application. A future npm release should move editor code into a package with explicit exports, generated declarations, peer dependencies and a separate demo app. This separation is intentionally deferred until the publishing model is confirmed.
