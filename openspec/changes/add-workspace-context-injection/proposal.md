# Change: Add Workspace Context Injection

## Why

Users working in Obsidian have multiple notes open that provide context for their AI interactions. Currently, OpenCode has no awareness of which notes are open in Obsidian or what text the user has selected, requiring users to manually reference files and copy/paste selections. By automatically injecting the list of open notes and the currently selected text into OpenCode sessions, the AI gains valuable context about the user's current focus, improving response relevance without manual effort.

## What Changes

- Add integration with OpenCode SDK (`@opencode-ai/sdk`) to communicate with the server
- Collect currently open note paths from Obsidian's workspace API
- Collect currently selected text from the active editor (if any)
- Inject open notes and selected text as context into the current OpenCode session using `session.prompt({ noReply: true })`
- Use revert + re-inject pattern to prevent context accumulation (each update replaces previous context)
- Debounce workspace change events to avoid flooding the server
- Add settings to enable/disable the feature (enabled by default) and limit the number of notes included

## Impact

- Affected specs: `001-mvp-opencode-embed`
- Affected code:
  - `package.json` - new SDK dependency
  - `src/types.ts` - new settings fields
  - `src/main.ts` - workspace event registration, context injection orchestration
  - `src/SettingsTab.ts` - new settings UI
  - `src/OpenCodeClient.ts` - **new file** for SDK wrapper
  - `src/WorkspaceContext.ts` - **new file** for workspace data collection (open notes + selection)
