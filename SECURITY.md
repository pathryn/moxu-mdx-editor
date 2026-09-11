# Security Policy / 安全政策

## Supported versions

安全修复目前只提供给最新发布版本。项目进入稳定期后将在此维护版本支持矩阵。

## Reporting a vulnerability

请勿创建公开 Issue。请通过 [GitHub Private Vulnerability Reporting](https://github.com/pathryn/moxu-mdx-editor/security/advisories/new) 提交复现步骤、影响范围和建议缓解方式。维护者目标是在 3 个工作日内确认收到，并在评估后协调披露时间。

Do not disclose vulnerabilities in public issues. Use the private security advisory link above.

## Security boundary

The preview endpoint accepts only the editor's controlled MDX dialect. AST validation rejects arbitrary expressions, imports, exports, spread attributes, unknown components and unknown props. This is defense in depth, not a general-purpose sandbox for untrusted MDX.

External embeds are disabled by default. Configure `NEXT_PUBLIC_MDX_EMBED_HOSTS` only with reviewed HTTPS hosts. Production deployments should enforce rate limits at the gateway and isolate compilation with CPU and memory limits.
