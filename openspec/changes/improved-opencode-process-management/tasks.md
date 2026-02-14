## 1. Settings Schema Updates

- [ ] 1.1 Add `customCommand` field to `OpenCodeSettings` interface in `src/types.ts`
- [ ] 1.2 Add `useCustomCommand` boolean field to `OpenCodeSettings` interface
- [ ] 1.3 Update `DEFAULT_SETTINGS` with new fields (empty string and false)

## 2. Executable Resolver Module

- [ ] 2.1 Create `src/server/ExecutableResolver.ts` with cross-platform detection logic
- [ ] 2.2 Implement `resolveFromPath()` to check PATH for 'opencode' executable
- [ ] 2.3 Implement `resolve()` method with proper precedence:
  - Check if configured path is absolute and exists → return it
  - Extract basename from configured path (handle both "opencode" and "/path/to/opencode")
- [ ] 2.4 Implement platform-specific directory search:
  - Linux: ~/.local/bin/, ~/.opencode/bin/, ~/.bun/bin/, ~/.npm-global/bin/, ~/.nvm/versions/node/*/bin/, /usr/local/bin/, /usr/bin/
  - macOS: ~/.local/bin/, /opt/homebrew/bin/, /usr/local/bin/
  - Windows: %LOCALAPPDATA%\opencode\bin\, %USERPROFILE%\.bun\bin\, %USERPROFILE%\.local\bin\
- [ ] 2.5 Implement nvm wildcard expansion for ~/.nvm/versions/node/*/bin/
- [ ] 2.6 Ensure fallback: return configured path if search fails
- [ ] 2.4 Implement main `resolve()` method that tries PATH first, then platform locations
- [ ] 2.5 Add helper to expand Windows environment variables (%LOCALAPPDATA%, %USERPROFILE%)

## 3. ServerManager Updates

- [ ] 3.1 Modify `ServerManager.start()` to check `useCustomCommand` setting
- [ ] 3.2 Implement path mode spawning (direct spawn with default args)
- [ ] 3.3 Implement custom command mode spawning (shell: true, no args appended)
- [ ] 3.4 Ensure working directory is set correctly for both modes
- [ ] 3.5 Add support for verifying path mode executable with `opencode --version`

## 4. Main Plugin Integration

- [ ] 4.1 Add autodetect logic in `main.ts` `onload()` method
- [ ] 4.2 Implement autodetect trigger: when `opencodePath` is empty and `useCustomCommand` is false
- [ ] 4.3 On successful autodetect: save path to settings, show success Notice
- [ ] 4.4 On failed autodetect: show error Notice "Could not find opencode. Please check Settings"
- [ ] 4.5 Import and use `ExecutableResolver` from main plugin

## 5. Settings UI Updates

- [ ] 5.1 Add toggle switch "Use custom command" in `SettingsTab.ts`
- [ ] 5.2 Conditionally show path input field when toggle is off
- [ ] 5.3 Conditionally show custom command textarea when toggle is on
- [ ] 5.4 Add "Autodetect" button next to path input
- [ ] 5.5 Implement autodetect button click handler that:
  - Calls `ExecutableResolver.resolve()`
  - Updates path input if found
  - Shows success/error Notice
- [ ] 5.6 Add descriptive text explaining custom command mode behavior
- [ ] 5.7 Ensure settings are saved when toggling between modes

## 6. Testing & Validation

- [ ] 6.1 Test autodetect finds opencode in PATH
- [ ] 6.2 Test autodetect finds opencode in platform-specific location
- [ ] 6.3 Test autodetect shows error when not found
- [ ] 6.4 Test path mode spawns correctly with default args
- [ ] 6.5 Test custom command mode spawns via shell without extra args
- [ ] 6.6 Test custom command with environment variables works
- [ ] 6.7 Verify backward compatibility: existing opencodePath values still work
- [ ] 6.8 Test manual autodetect button in Settings
- [ ] 6.9 Test toggle saves and restores correctly

## 7. Documentation

- [ ] 7.1 Update README.md with new settings options
- [ ] 7.2 Document autodetect behavior and common installation locations
- [ ] 7.3 Add examples of custom command usage
