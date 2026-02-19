import { Plugin, WorkspaceLeaf, Notice, EventRef, MarkdownView } from "obsidian";
import { OpenCodeSettings, DEFAULT_SETTINGS, OPENCODE_VIEW_TYPE, ProjectEntry } from "./types";
import { OpenCodeView } from "./ui/OpenCodeView";
import { ViewManager } from "./ui/ViewManager";
import { OpenCodeSettingTab } from "./settings/SettingsTab";
import { ServerManager, ServerState } from "./server/ServerManager";
import { registerOpenCodeIcons, OPENCODE_ICON_NAME } from "./icons";
import { OpenCodeClient } from "./client/OpenCodeClient";
import { ContextManager } from "./context/ContextManager";
import { ExecutableResolver } from "./server/ExecutableResolver";
import { ProjectPickerModal } from "./ui/ProjectPickerModal";
import { execSync } from "child_process";

export default class OpenCodePlugin extends Plugin {
  settings: OpenCodeSettings = DEFAULT_SETTINGS;
  private processManager: ServerManager;
  private stateChangeCallbacks: Array<(state: ServerState) => void> = [];
  private openCodeClient: OpenCodeClient;
  private contextManager: ContextManager;
  private viewManager: ViewManager;
  private cachedIframeUrl: string | null = null;
  private lastBaseUrl: string | null = null;

  async onload(): Promise<void> {
    console.log("Loading OpenCode plugin");

    registerOpenCodeIcons();

    await this.loadSettings();

    // Attempt autodetect if opencodePath is empty and not using custom command
    await this.attemptAutodetect();

    const projectDirectory = this.getProjectDirectory();

    this.processManager = new ServerManager(this.settings, projectDirectory);
    this.processManager.on("stateChange", (state: ServerState) => {
      this.notifyStateChange(state);
    });

    // Listen for project directory changes and coordinate response
    this.processManager.on("projectDirectoryChanged", async (newDirectory: string) => {
      this.settings.projectDirectory = newDirectory;
      await this.saveData(this.settings);
      this.refreshClientState();
      if (this.getServerState() === "running") {
        await this.stopServer();
        await this.startServer();
      }
    });

    this.openCodeClient = new OpenCodeClient(
      this.getApiBaseUrl(),
      this.getServerUrl(),
      projectDirectory
    );
    this.lastBaseUrl = this.getServerUrl();

    this.contextManager = new ContextManager({
      app: this.app,
      settings: this.settings,
      client: this.openCodeClient,
      getServerState: () => this.getServerState(),
      getCachedIframeUrl: () => this.cachedIframeUrl,
      setCachedIframeUrl: (url) => {
        this.cachedIframeUrl = url;
      },
      registerEvent: (ref) => this.registerEvent(ref),
    });

    this.viewManager = new ViewManager({
      app: this.app,
      settings: this.settings,
      client: this.openCodeClient,
      contextManager: this.contextManager,
      getCachedIframeUrl: () => this.cachedIframeUrl,
      setCachedIframeUrl: (url) => {
        this.cachedIframeUrl = url;
      },
      getServerState: () => this.getServerState(),
    });

    console.log(
      "[OpenCode] Configured with project directory:",
      projectDirectory
    );

    this.registerView(
      OPENCODE_VIEW_TYPE,
      (leaf) => new OpenCodeView(leaf, this)
    );
    this.addSettingTab(new OpenCodeSettingTab(
      this.app,
      this,
      this.settings,
      this.processManager,
      () => this.saveSettings()
    ));

    this.addRibbonIcon(OPENCODE_ICON_NAME, "OpenCode", () => {
      void this.viewManager.activateView();
    });

    this.addCommand({
      id: "toggle-opencode-view",
      name: "Toggle OpenCode panel",
      callback: () => {
        void this.viewManager.toggleView();
      },
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "o",
        },
      ],
    });

    this.addCommand({
      id: "start-opencode-server",
      name: "Start OpenCode server",
      callback: () => {
        this.startServer();
      },
    });

    this.addCommand({
      id: "stop-opencode-server",
      name: "Stop OpenCode server",
      callback: () => {
        this.stopServer();
      },
    });

    this.addCommand({
      id: "switch-opencode-project",
      name: "Switch OpenCode project",
      callback: () => {
        this.openProjectPicker();
      },
    });

    if (this.settings.autoStart) {
      this.app.workspace.onLayoutReady(async () => {
        await this.startServer();
      });
    }

    this.contextManager.updateSettings(this.settings);
    this.processManager.on("stateChange", (state: ServerState) => {
      if (state === "running") {
        void this.contextManager.handleServerRunning();
      }
    });

    this.registerCleanupHandlers();

    console.log("OpenCode plugin loaded");
  }

  async onunload(): Promise<void> {
    this.contextManager.destroy();
    await this.stopServer();
    this.app.workspace.detachLeavesOfType(OPENCODE_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Attempt to autodetect opencode executable on startup
   * Triggers when opencodePath is empty and useCustomCommand is false
   */
  private async attemptAutodetect(): Promise<void> {
    // Only autodetect if path is empty and not using custom command mode
    if (this.settings.opencodePath || this.settings.useCustomCommand) {
      return;
    }

    console.log("[OpenCode] Attempting to autodetect opencode executable...");

    const detectedPath = ExecutableResolver.resolve("opencode");
    
    // Check if a different path was found (not the fallback)
    if (detectedPath && detectedPath !== "opencode") {
      console.log("[OpenCode] Autodetected opencode at:", detectedPath);
      this.settings.opencodePath = detectedPath;
      await this.saveData(this.settings);
      new Notice(`OpenCode executable found at ${detectedPath}`);
    } else {
      console.log("[OpenCode] Could not autodetect opencode executable");
      new Notice("Could not find opencode. Please check Settings");
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.processManager.updateSettings(this.settings);
    this.refreshClientState();
    this.contextManager.updateSettings(this.settings);
    this.viewManager.updateSettings(this.settings);
  }

  async startServer(): Promise<boolean> {
    const success = await this.processManager.start();
    if (success) {
      new Notice("OpenCode server started");
    } else {
      const error = this.processManager.getLastError();
      if (error) {
        new Notice(`OpenCode failed to start: ${error}`, 10000); // Show for 10 seconds
      } else {
        new Notice("OpenCode failed to start. Check Settings for details.", 5000);
      }
    }
    return success;
  }

  async stopServer(): Promise<void> {
    await this.processManager.stop();
    new Notice("OpenCode server stopped");
  }

  getServerState(): ServerState {
    return this.processManager.getState() ?? "stopped";
  }

  getLastError(): string | null {
    return this.processManager.getLastError() ?? null;
  }

  getServerUrl(): string {
    return this.processManager.getUrl();
  }

  getApiBaseUrl(): string {
    return `http://${this.settings.hostname}:${this.settings.port}`;
  }

  getStoredIframeUrl(): string | null {
    return this.cachedIframeUrl;
  }

  setCachedIframeUrl(url: string | null): void {
    this.cachedIframeUrl = url;
  }

  onServerStateChange(callback: (state: ServerState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyStateChange(state: ServerState): void {
    for (const callback of this.stateChangeCallbacks) {
      callback(state);
    }
  }

  private refreshClientState(): void {
    const nextUiBaseUrl = this.getServerUrl();
    const nextApiBaseUrl = this.getApiBaseUrl();
    const projectDirectory = this.getProjectDirectory();
    this.openCodeClient.updateBaseUrl(nextApiBaseUrl, nextUiBaseUrl, projectDirectory);

    if (this.lastBaseUrl && this.lastBaseUrl !== nextUiBaseUrl) {
      this.cachedIframeUrl = null;
    }

    this.lastBaseUrl = nextUiBaseUrl;
  }

  refreshContextForView(view: OpenCodeView): void {
    void this.contextManager.refreshContextForView(view);
  }

  async ensureSessionUrl(view: OpenCodeView): Promise<void> {
    await this.viewManager.ensureSessionUrl(view);
  }

  getProjectDirectory(): string {
    // 1. Check named projects: if activeProjectName matches, use that path
    if (this.settings.activeProjectName && this.settings.projects.length > 0) {
      const active = this.settings.projects.find(
        (p) => p.name === this.settings.activeProjectName
      );
      if (active?.path) {
        console.log("[OpenCode] Using named project directory:", active.name, "->", active.path);
        return active.path;
      }
    }

    // 2. Fall back to legacy projectDirectory setting
    if (this.settings.projectDirectory) {
      console.log("[OpenCode] Using project directory from settings:", this.settings.projectDirectory);
      return this.settings.projectDirectory;
    }

    // 3. Fall back to vault root
    const adapter = this.app.vault.adapter as any;
    const vaultPath = adapter.basePath || "";
    if (!vaultPath) {
      console.warn("[OpenCode] Warning: Could not determine vault path");
    }
    console.log("[OpenCode] Using vault path as project directory:", vaultPath);
    return vaultPath;
  }

  getActiveProjectName(): string {
    if (this.settings.activeProjectName && this.settings.projects.length > 0) {
      const active = this.settings.projects.find(
        (p) => p.name === this.settings.activeProjectName
      );
      if (active) return active.name;
    }
    return "";
  }

  openProjectPicker(): void {
    if (this.settings.projects.length === 0) {
      new Notice("No projects configured. Add projects in OpenCode settings.");
      return;
    }

    new ProjectPickerModal(
      this.app,
      this.settings.projects,
      this.settings.activeProjectName,
      (project: ProjectEntry) => {
        void this.switchProject(project);
      }
    ).open();
  }

  async switchProject(project: ProjectEntry): Promise<void> {
    if (project.name === this.settings.activeProjectName) {
      new Notice(`Already on project: ${project.name}`);
      return;
    }

    new Notice(`Switching to project: ${project.name}...`);

    // Run git pull if enabled
    if (this.settings.gitPullOnSwitch) {
      try {
        console.log("[OpenCode] Running git pull in:", project.path);
        execSync("git pull", {
          cwd: project.path,
          timeout: 15000,
          stdio: "pipe",
        });
        console.log("[OpenCode] Git pull completed");
      } catch (error) {
        const msg = (error as Error).message;
        console.warn("[OpenCode] Git pull failed (continuing anyway):", msg);
        new Notice(`Git pull warning: ${msg.substring(0, 100)}`, 5000);
      }
    }

    // Update active project
    this.settings.activeProjectName = project.name;
    this.settings.projectDirectory = project.path;
    await this.saveData(this.settings);

    // Trigger server restart via existing mechanism
    this.processManager.updateProjectDirectory(project.path);

    new Notice(`Switched to: ${project.name}`);
  }

  private registerCleanupHandlers(): void {
    this.registerEvent(
      this.app.workspace.on("quit", () => {
        console.log("[OpenCode] Obsidian quitting - performing sync cleanup");
        this.stopServer();
      })
    );
  }
}
