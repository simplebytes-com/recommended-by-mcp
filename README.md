# recommended-by-mcp

Stdio MCP server for managing your recommended.by lists from agents like OpenClaw, Codex, Claude Desktop, Claude Code, Cursor, and Windsurf.

The package talks to the recommended.by REST API and exposes MCP tools over stdio. This is useful for clients that do not support remote HTTP MCP headers consistently: the agent launches this package locally, and the package handles recommended.by authentication.

## Quick Start

Create an API key in `Dashboard -> Profile & URL -> API Keys`, then authenticate the package once:

```bash
npx recommended-by-mcp@latest login rb_live_your_key_here
```

Then configure your MCP client to run:

```bash
npx -y recommended-by-mcp@latest
```

You can also avoid local storage and pass the key through an environment variable:

```bash
RECOMMENDED_BY_API_KEY=rb_live_your_key_here npx -y recommended-by-mcp@latest
```

## Authentication

The server resolves auth in this order:

1. `--api-key rb_live_...`
2. `RECOMMENDED_BY_API_KEY`
3. saved config from `recommended-by-mcp login`

The saved config lives at:

- macOS: `~/Library/Application Support/recommended-by-mcp/config.json`
- Linux: `~/.config/recommended-by-mcp/config.json`
- Windows: `%APPDATA%\recommended-by-mcp\config.json`

Remove the saved key with:

```bash
npx recommended-by-mcp@latest logout
```

Check which account the key can access:

```bash
npx recommended-by-mcp@latest whoami
```

## MCP Tools

- `recommended_list_lists`
- `recommended_create_list`
- `recommended_get_list`
- `recommended_update_list`
- `recommended_delete_list`
- `recommended_list_items`
- `recommended_add_item`
- `recommended_update_item`
- `recommended_delete_item`

## Client Examples

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.recommended_by]
command = "npx"
args = ["-y", "recommended-by-mcp@latest"]
env = { RECOMMENDED_BY_API_KEY = "rb_live_your_key_here" }
```

### OpenClaw

```bash
openclaw mcp add recommended-by \
  --command npx \
  --arg -y \
  --arg recommended-by-mcp@latest \
  --env RECOMMENDED_BY_API_KEY=rb_live_your_key_here

openclaw mcp doctor recommended-by --probe
```

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "recommended-by": {
      "command": "npx",
      "args": ["-y", "recommended-by-mcp@latest"],
      "env": {
        "RECOMMENDED_BY_API_KEY": "rb_live_your_key_here"
      }
    }
  }
}
```

## Development

```bash
pnpm install
pnpm --filter recommended-by-mcp build
pnpm --filter recommended-by-mcp test
```
