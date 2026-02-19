export type ViewLocation = "sidebar" | "main";

export interface ProjectEntry {
  name: string;
  path: string;
}

export interface OpenCodeSettings {
  port: number;
  hostname: string;
  autoStart: boolean;
  opencodePath: string;
  projectDirectory: string;
  startupTimeout: number;
  defaultViewLocation: ViewLocation;
  injectWorkspaceContext: boolean;
  maxNotesInContext: number;
  maxSelectionLength: number;
  customCommand: string;
  useCustomCommand: boolean;
  projects: ProjectEntry[];
  activeProjectName: string;
  gitPullOnSwitch: boolean;
}

export const DEFAULT_SETTINGS: OpenCodeSettings = {
  port: 14096,
  hostname: "127.0.0.1",
  autoStart: false,
  opencodePath: "opencode",
  projectDirectory: "",
  startupTimeout: 15000,
  defaultViewLocation: "sidebar",
  injectWorkspaceContext: false,
  maxNotesInContext: 20,
  maxSelectionLength: 2000,
  customCommand: "",
  useCustomCommand: false,
  projects: [],
  activeProjectName: "",
  gitPullOnSwitch: true,
};

export const OPENCODE_VIEW_TYPE = "opencode-view";
