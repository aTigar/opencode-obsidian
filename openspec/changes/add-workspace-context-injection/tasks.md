# Tasks: Add Workspace Context Injection

## 1. Dependencies

- [ ] 1.1 Add `@opencode-ai/sdk` to package.json dependencies
- [ ] 1.2 Run `bun install` to install the SDK

## 2. Types and Settings

- [ ] 2.1 Add `injectWorkspaceContext: boolean` to `OpenCodeSettings` interface (default: `true`)
- [ ] 2.2 Add `maxNotesInContext: number` to `OpenCodeSettings` interface (default: `20`)
- [ ] 2.3 Add `maxSelectionLength: number` to `OpenCodeSettings` interface (default: `2000`)
- [ ] 2.4 Update `DEFAULT_SETTINGS` with new values

## 3. OpenCode Client Module

- [ ] 3.1 Create `src/OpenCodeClient.ts` with SDK client wrapper
- [ ] 3.2 Implement `getCurrentSessionId()` method to get active session
- [ ] 3.3 Implement `updateContext()` method with revert + inject logic
- [ ] 3.4 Add `contextMessageIds` Map for tracking injected messages per session
- [ ] 3.5 Add error handling for API failures (silent catch, log to console)

## 4. Workspace Context Module

- [ ] 4.1 Create `src/WorkspaceContext.ts` for collecting workspace context
- [ ] 4.2 Implement `getOpenNotePaths()` using `getLeavesOfType("markdown")`
- [ ] 4.3 Implement `getSelectedText()` to get current editor selection with source file
- [ ] 4.4 Implement `formatContext()` to generate the combined context string
- [ ] 4.5 Add deduplication for files open in multiple panes
- [ ] 4.6 Add truncation for selections exceeding `maxSelectionLength`

## 5. Main Plugin Integration

- [ ] 5.1 Import `OpenCodeClient` and `WorkspaceContext` in main.ts
- [ ] 5.2 Initialize `WorkspaceContext` in `onload()`
- [ ] 5.3 Create debounced `updateOpenCodeContext()` method (2 second delay)
- [ ] 5.4 Register `active-leaf-change` event listener (conditional on setting)
- [ ] 5.5 Register `layout-change` event listener (conditional on setting)
- [ ] 5.6 Register `editor-change` event listener for selection changes (conditional on setting)
- [ ] 5.7 Initialize `OpenCodeClient` lazily when first needed
- [ ] 5.8 Add server running check before attempting context updates
- [ ] 5.9 Trigger initial context injection when server reaches running state

## 6. Settings UI

- [ ] 6.1 Add toggle for "Inject workspace context" in SettingsTab
- [ ] 6.2 Add slider for "Max notes in context" (1-50 range)
- [ ] 6.3 Add slider or input for "Max selection length" (500-5000 range)
- [ ] 6.4 Add descriptive text explaining the feature includes open notes and selected text

## 7. Testing

- [ ] 7.1 Manual test: Open multiple notes, verify context appears in OpenCode
- [ ] 7.2 Manual test: Select text, verify selection appears in context with source file
- [ ] 7.3 Manual test: Close notes, verify context updates (old reverted, new injected)
- [ ] 7.4 Manual test: Clear selection, verify selection section is removed
- [ ] 7.5 Manual test: Disable setting, verify no context injection
- [ ] 7.6 Manual test: Server not running, verify no errors thrown
- [ ] 7.7 Manual test: Large selection, verify truncation works
- [ ] 7.8 Build and verify no TypeScript errors
