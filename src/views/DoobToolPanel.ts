import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import DoobEngine from "../main";
import { EngineTestRunner } from "../tests/EngineTestRunner";

export class DoobToolPanel extends ItemView {
	private plugin: DoobEngine;
	private testRunner!: EngineTestRunner;

	constructor(leaf: WorkspaceLeaf, plugin: DoobEngine) {
		super(leaf);
		this.plugin = plugin;
		this.testRunner = new EngineTestRunner(
			this.plugin.schemaManager, 
			this.plugin.dataManager, 
			this.plugin.contextFactory, 
			this.plugin.queryManager, 
			this.plugin.queryPlanner,
			this.plugin.resolvedRecordGraphBuilder,
			this.plugin.mutationExecutor,
			this.plugin.engineLog,
			this.plugin.loggerFactory
		);
	}

	getViewType() {
		return "doob-tool-panel";
	}

	getDisplayText() {
		return "Doob Tool Panel";
	}

	async onOpen() {

		const container = this.containerEl.children[1];
		container.empty();

		const root = container.createDiv();
		root.style.padding = "12px";
		root.style.display = "flex";
		root.style.flexDirection = "column";
		root.style.gap = "10px";

		// 🔥 HEADER
		const title = root.createEl("h1");
		title.textContent = "🧠 DOOB ENGINE TOOL PANEL";
		title.style.marginBottom = "0px";

		// 🔥 STATUS BOX (VERY OBVIOUS)
		const status = root.createDiv();
		status.textContent = "STATUS: ONLINE";
		status.style.background = "#2ecc71";
		status.style.color = "black";
		status.style.padding = "8px";
		status.style.fontWeight = "bold";
		status.style.textAlign = "center";

		// 🔥 TEST BUTTON
		const testBtn = root.createEl("button");
		testBtn.textContent = "TEST BUTTON";
		testBtn.style.padding = "10px";
		testBtn.style.fontSize = "16px";

		testBtn.onclick = () => {
			new Notice("Tool Panel Button Clicked!");
		};

		// 🔥 SECOND BUTTON (for future expansion)
		const statBtn = root.createEl("button");
		statBtn.textContent = "+ ADD STAT (placeholder)";
		statBtn.style.padding = "10px";

		statBtn.onclick = () => {
			new Notice("Stat tool triggered (not implemented yet)");
		};

		const debugHeader = root.createEl("h2");

		debugHeader.textContent = "Development";

		const testEngineBtn = root.createEl("button");

		testEngineBtn.textContent = "Test Engine";

		testEngineBtn.onclick =
			async () => {

				await this.testRunner.runAll();
			};

		new Notice("Doob Tool Panel Loaded");
	}

	async onClose() {}
}