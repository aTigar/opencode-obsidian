import { addIcon } from "obsidian";

export const OPENCODE_ICON_NAME = "opencode-logo";

// Monochrome OpenCode "O" logo mark derived from the official brand assets
// Uses currentColor for theme compatibility
const OPENCODE_LOGO_SVG = `<svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 24H6V12H18V24Z" fill="currentColor" opacity="0.4"/>
  <path d="M18 6H6V24H18V6ZM24 30H0V0H24V30Z" fill="currentColor"/>
</svg>`;

export function registerOpenCodeIcons(): void {
  addIcon(OPENCODE_ICON_NAME, OPENCODE_LOGO_SVG);
}
