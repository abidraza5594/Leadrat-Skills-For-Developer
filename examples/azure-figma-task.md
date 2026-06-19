# Azure DevOps And Figma Task Brief

Use this when a developer wants an AI assistant to implement one Azure DevOps requirement and optionally match a Figma design.

## Environment

Never commit credentials. Set them only in the local shell:

```powershell
$env:AZURE_DEVOPS_PAT="your-azure-devops-pat"
$env:AZURE_DEVOPS_ORG="your-organization"
$env:FIGMA_ACCESS_TOKEN="your-figma-token"
```

## From A Work Item Number

```powershell
leadrat-ai task --azure 12345
```

## From A Work Item URL

```powershell
leadrat-ai task --azure "https://dev.azure.com/org/project/_workitems/edit/12345"
```

## With Figma

```powershell
leadrat-ai task `
  --azure "https://dev.azure.com/org/project/_workitems/edit/12345" `
  --figma "https://www.figma.com/design/FILE_KEY/Page?node-id=1-2"
```

## Output

The generated markdown file is written under:

```text
.ai-dev-assistant/tasks/
```

Ask the AI assistant:

```text
Read .ai-dev-assistant/tasks/<task-file>.md and implement it. Follow AGENTS.md first.
```
