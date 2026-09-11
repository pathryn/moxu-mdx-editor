# Contributing / 参与贡献

感谢你改进墨序 MDX。提交代码前，请先搜索现有 Issue；安全问题不要公开提交，请按照 [SECURITY.md](SECURITY.md) 报告。

## Development

Requirements: Node.js 20.9 or newer and pnpm 11.1.2.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm check
```

请为行为变更补充测试，并同步更新中英文文档。Pull Request 应保持范围单一，说明动机、验证方式和界面变化截图。所有提交须通过 CI。

By contributing, you certify the Developer Certificate of Origin in [DCO.md](DCO.md). Add a `Signed-off-by` line with `git commit -s`.

## Pull request checklist

- Tests cover the change and `pnpm check` passes.
- Public APIs and security boundaries are documented.
- No secrets, generated build output, or unlicensed assets are included.
- UI changes are keyboard accessible and respect reduced motion.
