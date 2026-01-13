# Design: Workspace Context Injection

## Context

The plugin embeds OpenCode in an iframe and spawns a local server. OpenCode has an SDK and HTTP API that allows programmatic interaction with sessions. Obsidian's Workspace API provides access to open files, emits events when the workspace changes, and provides access to the active editor's selection.

**Stakeholders:** Users who want AI to be aware of their open notes and selected text without manual input.

**Constraints:**
- Must not overload the context window with repeated injections
- Must work with the existing ProcessManager and view lifecycle
- Desktop-only (uses Node.js APIs)

## Goals / Non-Goals

**Goals:**
- Automatically provide OpenCode with awareness of open notes
- Include currently selected text for immediate context
- Keep context window clean (no accumulation of stale context)
- Minimal performance impact (debounced updates)
- User control via settings (enabled by default)

**Non-Goals:**
- Injecting full file contents (only paths + selection)
- Real-time synchronization with every keystroke
- Mobile support

## Decisions

### Decision 1: Use OpenCode SDK for API communication
**What:** Add `@opencode-ai/sdk` as a dependency and use `createOpencodeClient()` to interact with the server.

**Why:** Type-safe API, officially supported, handles serialization and error handling.

**Alternatives considered:**
- Direct fetch calls: Simpler but no type safety, more error-prone
- postMessage to iframe: Not supported by OpenCode web UI

### Decision 2: Revert + Re-inject pattern for context updates
**What:** Track the message ID of injected context. Before injecting new context, revert the previous message using `session.revert()`, then inject fresh context.

**Why:** Prevents accumulation of stale context messages that would bloat the context window and confuse the AI.

**Alternatives considered:**
- Append only: Would accumulate redundant messages
- System prompt field: Unclear if it replaces or appends
- One-time injection: Context becomes stale if user opens/closes files

### Decision 3: Debounce workspace events (2 seconds)
**What:** Use Obsidian's `debounce()` utility with a 2-second delay before sending context updates.

**Why:** Rapid file switching (e.g., using Cmd+Tab or closing multiple tabs) would otherwise flood the server with API calls.

### Decision 4: Inject paths + selected text, not full content
**What:** Send file paths (e.g., `Notes/Project.md`) and the currently selected text (if any), but not full file contents.

**Why:** 
- Keeps context concise and within token limits
- Users control what's "in scope" by opening/closing files
- Selected text provides immediate, relevant context without overwhelming
- Full content injection could easily exceed context limits

### Decision 5: Track context per session
**What:** Maintain a `Map<sessionId, messageId>` to track injected context for each session.

**Why:** OpenCode may have multiple sessions. Each session needs its own context tracking to properly revert previous injections.

### Decision 6: Include selection source file
**What:** When including selected text, also indicate which file it's from.

**Why:** Helps the AI understand the context of the selection (e.g., "Selected from Daily/2026-01-12.md").

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Obsidian Plugin                                             │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │ WorkspaceContext│    │   OpenCodeClient │               │
│  │                 │    │                  │               │
│  │ - getOpenPaths()│    │ - updateContext()│               │
│  │ - getSelection()│    │ - revert + inject│               │
│  │ - formatContext │    │                  │               │
│  └────────┬────────┘    └────────┬─────────┘               │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      │                                      │
│           ┌──────────▼──────────┐                          │
│           │     main.ts         │                          │
│           │                     │                          │
│           │ - workspace events  │                          │
│           │ - editor-change     │                          │
│           │ - debounced updates │                          │
│           └──────────┬──────────┘                          │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP (SDK)
              ┌────────▼────────┐
              │ OpenCode Server │
              │                 │
              │ - session.prompt│
              │ - session.revert│
              └─────────────────┘
```

## Data Flow

1. User opens/closes files or changes selection in Obsidian
2. Workspace emits `active-leaf-change`, `layout-change`, or `editor-change` event
3. Debouncer waits 2 seconds for activity to settle
4. `WorkspaceContext` collects:
   a. `getOpenNotePaths()` - current open files
   b. `getSelectedText()` - current selection (if any)
5. `OpenCodeClient.updateContext()`:
   a. Gets current session ID from server
   b. Reverts previous context message (if tracked)
   c. Injects new context with `noReply: true`
   d. Stores new message ID for future revert
6. OpenCode AI now has updated context for next interaction

## Context Format

```
<system-reminder>
Currently open notes in Obsidian:
- Daily/2026-01-12.md
- Projects/Feature-Spec.md
- Reference/API-Docs.md

Selected text (from Projects/Feature-Spec.md):
"""
The plugin SHALL inject workspace context into OpenCode sessions.
This includes both open file paths and selected text.
"""
</system-reminder>
```

When no text is selected, the "Selected text" section is omitted.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Revert fails (message already gone) | Catch error, continue with fresh inject |
| Session changes between revert and inject | Track per-session, clear tracking on session change |
| Server not running when events fire | Check `getProcessState() === "running"` before attempting |
| SDK adds bundle size | SDK is lightweight; alternative (fetch) adds complexity |
| Message ID tracking lost on plugin reload | Acceptable - next update injects fresh context, old message becomes orphaned but harmless |
| Large selection could bloat context | Truncate selection to reasonable limit (e.g., 2000 chars) |

## Migration Plan

No migration needed. New feature enabled by default but can be disabled in settings.

## Open Questions

1. ~~Should we also inject the active file distinctly (e.g., "Currently editing: X.md")?~~
   - Resolved: The selected text section includes the source file, which serves this purpose.

2. Should context be injected on view open or only on workspace changes?
   - Decision: Both. Initial injection when view opens, then updates on changes.

3. Should selection changes trigger immediate updates or use the same debounce?
   - Decision: Use same 2-second debounce to avoid excessive updates during text selection.
