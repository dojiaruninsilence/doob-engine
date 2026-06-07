import { Plugin, Notice } from "obsidian";
import { DoobToolPanel } from "./views/DoobToolPanel";

const VIEW_TYPE_DOOB_PANEL = "doob-tool-panel";

export default class DoobEngine extends Plugin {

	// optional global reference (useful for debugging + reload)
	public softReload?: () => Promise<void>;

	async onload() {

		// --------------------------------------------------
		// GLOBAL DEBUG / HOT RELOAD HOOK
		// --------------------------------------------------
		(window as any).doobPlugin = this;

		(window as any).doobReload = async () => {
			new Notice("Reloading Doob Engine...");
			await this.softReload?.();
		};

		// bind so we can safely call it externally
		this.softReload = this.softReloadImpl.bind(this);

		// --------------------------------------------------
		// INIT SYSTEMS
		// --------------------------------------------------
		this.initUI();
		this.initCommands?.();

		new Notice("Doob Engine is alive!");
	}

	// --------------------------------------------------
	// UI INIT (ALL UI SETUP GOES HERE)
	// --------------------------------------------------
	private initUI() {

		// register panel view
		this.registerView(
			VIEW_TYPE_DOOB_PANEL,
			(leaf) => new DoobToolPanel(leaf)
		);

		// open panel on startup
		this.app.workspace.onLayoutReady(() => {
			this.openToolPanel();
		});
	}

  // 👇 ADD IT RIGHT HERE
	private initCommands() {

		this.addCommand({
			id: "open-doob-panel",
			name: "Open Doob Tool Panel",
			callback: () => {
				new Notice("Tool panel command triggered");
				// later: open sidebar/tool panel here
			}
		});

	}

	// --------------------------------------------------
	// OPEN PANEL
	// --------------------------------------------------
	private async openToolPanel() {

		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_DOOB_PANEL);

		if (existing.length > 0) return;

		const leaf = this.app.workspace.getRightLeaf(false);

		await leaf.setViewState({
			type: VIEW_TYPE_DOOB_PANEL,
			active: true
		});
	}

	// --------------------------------------------------
	// SAFE RELOAD (NO INTERNAL OBSIDIAN API HACKS)
	// --------------------------------------------------
	private async softReloadImpl() {

		new Notice("Soft reloading Doob Engine...");

		// 1. remove UI views
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE_DOOB_PANEL)
			.forEach(leaf => leaf.detach());

		// 2. cleanup custom systems (add later)
		this.cleanupSystems?.();

		// 3. rebuild UI + systems
		this.initUI();
		this.initCommands?.();

		new Notice("Reload complete");
	}

	// --------------------------------------------------
	// OPTIONAL CLEANUP HOOK
	// --------------------------------------------------
	private cleanupSystems() {
		// future: remove listeners, intervals, cached data, etc
		console.log("Cleaning systems...");
	}

	onunload() {
		console.log("Doob Engine unloaded");
	}
}