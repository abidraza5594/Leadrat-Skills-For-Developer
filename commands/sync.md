# sync

Synchronizes knowledge documents from a GitHub repository path.

Example:

```bash
npx @leadrat/dev-assistant sync --repo LeadRat/internal-ai-docs --ref main --path .ai-dev-assistant/docs
```

Private repositories can use the `GITHUB_TOKEN` environment variable or `--token`.
