# Obsidian OpenCode

Embed [OpenCode](https://opencode.ai) AI assistant directly in Obsidian's sidebar.

## Requirements

- Desktop only (uses Node.js child processes)
- [OpenCode CLI](https://opencode.ai) installed and in your PATH

## Installation

1. Clone to `.obsidian/plugins/obsidian-opencode`
2. `bun install && bun run build`
3. Enable in Obsidian Settings > Community plugins

## Usage

- Click the terminal icon in the ribbon, or
- `Cmd/Ctrl+Shift+O` to toggle the panel
- Server starts automatically when you open the panel

### Commands

| Command | Description |
|---------|-------------|
| Toggle OpenCode panel | Show/hide sidebar |
| Start OpenCode server | Manual start |
| Stop OpenCode server | Manual stop |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 14096 | Server port |
| Hostname | 127.0.0.1 | Bind address |
| OpenCode path | opencode | Path to executable |
| Auto-start | off | Start server on Obsidian launch |

## Development

```bash
bun run dev    # Watch mode
bun run build  # Production build
```

## License

MIT
