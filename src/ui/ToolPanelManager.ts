import { WorkspaceLeaf } from "obsidian";
import DoobEngine from "../main";
import { DoobToolPanel } from "../views/DoobToolPanel";

export const VIEW_TYPE_DOOB_PANEL = "doob-tool-panel";

export class ToolPanelManager {

	constructor(
		private plugin: DoobEngine
	) {}

	initialize(): void {

		this.plugin.registerView(
			VIEW_TYPE_DOOB_PANEL,
			(leaf: WorkspaceLeaf) =>
				new DoobToolPanel(leaf, this.plugin)
		);

		this.plugin.app.workspace.onLayoutReady(() => {
			this.open();
		});
	}

	async open(): Promise<void> {

		const existing =
			this.plugin.app.workspace.getLeavesOfType(
				VIEW_TYPE_DOOB_PANEL
			);

		if (existing.length > 0) {
			return;
		}

		const leaf =
			this.plugin.app.workspace.getRightLeaf(false);

		if (!leaf) {
			return;
		}

		await leaf.setViewState({
			type: VIEW_TYPE_DOOB_PANEL,
			active: true
		});
	}

	close(): void {

		this.plugin.app.workspace
			.getLeavesOfType(VIEW_TYPE_DOOB_PANEL)
			.forEach(leaf => leaf.detach());
	}
}