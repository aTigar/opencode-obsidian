import { App, SuggestModal } from "obsidian";
import { ProjectEntry } from "../types";

export class ProjectPickerModal extends SuggestModal<ProjectEntry> {
  private projects: ProjectEntry[];
  private activeProjectName: string;
  private onChoose: (project: ProjectEntry) => void;

  constructor(
    app: App,
    projects: ProjectEntry[],
    activeProjectName: string,
    onChoose: (project: ProjectEntry) => void
  ) {
    super(app);
    this.projects = projects;
    this.activeProjectName = activeProjectName;
    this.onChoose = onChoose;
    this.setPlaceholder("Switch OpenCode project...");
  }

  getSuggestions(query: string): ProjectEntry[] {
    const lower = query.toLowerCase();
    return this.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.path.toLowerCase().includes(lower)
    );
  }

  renderSuggestion(project: ProjectEntry, el: HTMLElement): void {
    const isActive = project.name === this.activeProjectName;
    const container = el.createDiv({ cls: "opencode-project-suggestion" });

    const nameEl = container.createDiv({ cls: "opencode-project-name" });
    nameEl.setText(project.name);
    if (isActive) {
      nameEl.createSpan({
        text: " (active)",
        cls: "opencode-project-active-badge",
      });
    }

    container.createDiv({
      cls: "opencode-project-path",
      text: project.path,
    });
  }

  onChooseSuggestion(project: ProjectEntry): void {
    this.onChoose(project);
  }
}
