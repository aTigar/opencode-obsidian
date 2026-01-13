## ADDED Requirements

### Requirement: Workspace Context Collection
The plugin SHALL collect the file paths of all currently open markdown notes in the Obsidian workspace.

#### Scenario: Collect open note paths
- **WHEN** the plugin needs to gather workspace context
- **THEN** it retrieves all leaves of type "markdown" from the workspace
- **AND** extracts the file path from each leaf's view
- **AND** deduplicates paths (same file may be open in multiple panes)

### Requirement: Selected Text Collection
The plugin SHALL collect the currently selected text from the active editor, if any selection exists.

#### Scenario: Collect selected text with source
- **WHEN** the plugin needs to gather workspace context
- **AND** text is selected in the active editor
- **THEN** it retrieves the selected text content
- **AND** identifies the source file path of the selection

#### Scenario: No selection present
- **WHEN** the plugin needs to gather workspace context
- **AND** no text is selected in the active editor
- **THEN** the selected text portion of the context is omitted

#### Scenario: Selection truncation
- **WHEN** the selected text exceeds `maxSelectionLength` characters
- **THEN** the selection is truncated to the configured limit
- **AND** an indicator is added showing truncation occurred

### Requirement: Context Injection to OpenCode
The plugin SHALL inject the workspace context (open notes and selected text) into the current OpenCode session.

#### Scenario: Inject context on workspace change
- **WHEN** the user opens, closes, or switches between notes
- **AND** the setting "Inject workspace context" is enabled
- **AND** the OpenCode server is running
- **THEN** the plugin sends the workspace context to the current OpenCode session
- **AND** the context is injected using the SDK with `noReply: true` (no AI response triggered)

#### Scenario: Inject context on selection change
- **WHEN** the user changes their text selection in an editor
- **AND** the setting is enabled
- **AND** the OpenCode server is running
- **THEN** the plugin updates the workspace context (debounced)

#### Scenario: Initial context injection
- **WHEN** the OpenCode server transitions to running state
- **AND** the setting is enabled
- **THEN** the plugin injects the current workspace context

### Requirement: Context Replacement via Revert
The plugin SHALL replace previous context injections rather than accumulating them.

#### Scenario: Revert before re-inject
- **WHEN** the plugin injects new context
- **AND** a previous context message exists for the session
- **THEN** the plugin reverts the previous context message using `session.revert()`
- **AND** then injects the new context
- **AND** stores the new message ID for future revert

#### Scenario: Revert failure handling
- **WHEN** the revert operation fails (message already gone or session changed)
- **THEN** the plugin continues with fresh context injection
- **AND** logs the error to console for debugging

### Requirement: Debounced Context Updates
The plugin SHALL debounce workspace change events to prevent excessive API calls.

#### Scenario: Rapid file switching
- **WHEN** the user rapidly opens or closes multiple files
- **THEN** the plugin waits 2 seconds after the last change before sending context update
- **AND** only one API call is made for the batch of changes

#### Scenario: Rapid selection changes
- **WHEN** the user is actively selecting text (dragging)
- **THEN** the plugin waits 2 seconds after selection stabilizes before updating context

### Requirement: Context Injection Settings
The plugin SHALL provide settings to control workspace context injection behavior.

#### Scenario: Enable/disable toggle
- **WHEN** the user disables "Inject workspace context"
- **THEN** the plugin does not register workspace event listeners
- **AND** no context is injected into OpenCode sessions

#### Scenario: Enabled by default
- **WHEN** the plugin is installed fresh
- **THEN** the "Inject workspace context" setting defaults to enabled

#### Scenario: Limit number of notes
- **WHEN** more than `maxNotesInContext` notes are open
- **THEN** the plugin includes only the first N paths
- **AND** the default limit is 20 notes

#### Scenario: Limit selection length
- **WHEN** the selected text exceeds `maxSelectionLength` characters
- **THEN** the plugin truncates the selection
- **AND** the default limit is 2000 characters

### Requirement: Context Format
The plugin SHALL format the context as a system reminder containing file paths and optional selected text.

#### Scenario: Context message format with selection
- **WHEN** context is injected
- **AND** text is selected
- **THEN** the message is wrapped in `<system-reminder>` tags
- **AND** includes a header "Currently open notes in Obsidian:"
- **AND** lists each file path as a bullet point
- **AND** includes a "Selected text (from <filepath>):" section
- **AND** wraps the selected text in triple quotes

#### Scenario: Context message format without selection
- **WHEN** context is injected
- **AND** no text is selected
- **THEN** the message contains only the open notes section
- **AND** the selected text section is omitted

#### Scenario: Empty context
- **WHEN** no markdown files are open
- **AND** no text is selected
- **THEN** no context message is injected
- **AND** any previous context message is reverted
