## MODIFIED Requirements

### Requirement: Server Process Spawning (Modified)
The plugin SHALL spawn the OpenCode server process using either a configured executable path with default arguments OR a user-defined custom shell command.

**FROM:** 
The plugin SHALL spawn the OpenCode server process using the configured executable path, port, and hostname when the user initiates server start.

**TO:**
The plugin SHALL support two execution modes for spawning the OpenCode server process based on the `useCustomCommand` setting.

#### Scenario: Path mode spawn (Modified)
- **GIVEN** useCustomCommand is false
- **WHEN** the user starts the server
- **THEN** the plugin spawns the executable at `opencodePath` with arguments `["serve", "--port", <port>, "--hostname", <hostname>, "--cors", "app://obsidian.md"]`
- **AND** the process runs with the vault directory as the working directory
- **AND** the spawn uses `shell: false`

#### Scenario: Custom command mode spawn (New)
- **GIVEN** useCustomCommand is true
- **WHEN** the user starts the server
- **THEN** the plugin spawns `customCommand` as a shell command
- **AND** the spawn uses `shell: true`
- **AND** NO additional arguments are appended to the command
- **AND** the process runs with the vault directory as the working directory

## ADDED Requirements

### Requirement: Command mode selection
The system SHALL support toggling between path mode and custom command mode via settings.

#### Scenario: Path mode configuration
- **GIVEN** useCustomCommand is false (default)
- **WHEN** the server starts
- **THEN** the system uses the configured opencodePath executable
- **AND** appends default arguments for port, hostname, and CORS

#### Scenario: Custom command mode configuration
- **GIVEN** useCustomCommand is true
- **WHEN** the server starts
- **THEN** the system uses the configured customCommand string
- **AND** executes it via shell with no argument manipulation

### Requirement: Executable verification
The system SHALL verify the executable exists in path mode before attempting to spawn.

#### Scenario: Verify path mode executable
- **GIVEN** useCustomCommand is false
- **AND** opencodePath is set to an absolute path
- **WHEN** the server is about to start
- **THEN** the system SHALL verify the file exists and is executable
- **AND** if verification fails, return an error before spawning

#### Scenario: Skip verification for custom command
- **GIVEN** useCustomCommand is true
- **WHEN** the server is about to start
- **THEN** the system SHALL NOT verify the command before spawning
- **AND** let execution fail naturally if the command is invalid

### Requirement: Settings backward compatibility
The system SHALL maintain backward compatibility with existing opencodePath configurations.

#### Scenario: Existing path setting works
- **GIVEN** a configuration from a previous plugin version
- **AND** opencodePath is set to "/usr/local/bin/opencode"
- **AND** useCustomCommand is not set (defaults to false)
- **WHEN** the plugin loads
- **THEN** the system SHALL use the existing opencodePath
- **AND** continue working in path mode with default arguments
