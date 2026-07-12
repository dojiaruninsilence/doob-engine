import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import DoobEngine from "../main";
import { EngineTestRunner } from "../tests/EngineTestRunner";
// import { LayoutManager } from "golden-layout";

export class DoobToolPanel extends ItemView {
	private plugin: DoobEngine;
	private testRunner!: EngineTestRunner;
	// private layoutManager!: LayoutManager;

	constructor(leaf: WorkspaceLeaf, plugin: DoobEngine) {
		super(leaf);
		this.plugin = plugin;
		this.testRunner = new EngineTestRunner(
			this.plugin.services
		);
		// this.layoutManager = layoutManager;
	}

	getViewType() {
		return "doob-tool-panel";
	}

	getDisplayText() {
		return "Doob Tool Panel";
	}

	async onOpen() {

		this.plugin.services.traceLogger.debug("DoobToolPanel", "Doob Tool Panel Opened");

		const container =
			this.containerEl.children[1] as HTMLElement;

		container.empty();

		container.style.height = "100%";
		container.style.display = "flex";
		container.style.flexDirection = "column";

		// ----------------------
		// toolbar
		// ----------------------

		const toolbar =
			container.createDiv();

		toolbar.style.padding = "10px";
		toolbar.style.display = "flex";
		toolbar.style.gap = "8px";
		toolbar.style.flexShrink = "0";

		const testBtn =
			toolbar.createEl("button");

		testBtn.textContent =
			"Test";

		testBtn.onclick =
			() => new Notice("Test");

		const engineBtn =
			toolbar.createEl("button");

		engineBtn.textContent =
			"Test Engine";

		engineBtn.onclick =
			async () => {

				await this.testRunner.runAll();
			};

		// ----------------------
		// golden layout host
		// ----------------------

		const host =
			container.createDiv();

		host.style.flex = "1";
		host.style.minHeight = "0";

		this.plugin.services.layoutManager.initialize(
			host
		);

		this.plugin.services.traceLogger.debug("DoobToolPanel.onOpen", "after initializer call");
	}

	// async onOpen() {

	// 	const container = this.containerEl.children[1];
	// 	container.empty();

	// 	const root = container.createDiv();
	// 	root.style.padding = "12px";
	// 	root.style.display = "flex";
	// 	root.style.flexDirection = "column";
	// 	root.style.gap = "10px";

	// 	// 🔥 HEADER
	// 	const title = root.createEl("h1");
	// 	title.textContent = "🧠 DOOB ENGINE TOOL PANEL";
	// 	title.style.marginBottom = "0px";

	// 	// 🔥 STATUS BOX (VERY OBVIOUS)
	// 	const status = root.createDiv();
	// 	status.textContent = "STATUS: ONLINE";
	// 	status.style.background = "#2ecc71";
	// 	status.style.color = "black";
	// 	status.style.padding = "8px";
	// 	status.style.fontWeight = "bold";
	// 	status.style.textAlign = "center";

	// 	// 🔥 TEST BUTTON
	// 	const testBtn = root.createEl("button");
	// 	testBtn.textContent = "TEST BUTTON";
	// 	testBtn.style.padding = "10px";
	// 	testBtn.style.fontSize = "16px";

	// 	testBtn.onclick = () => {
	// 		new Notice("Tool Panel Button Clicked!");
	// 	};

	// 	// 🔥 SECOND BUTTON (for future expansion)
	// 	const statBtn = root.createEl("button");
	// 	statBtn.textContent = "+ ADD STAT (placeholder)";
	// 	statBtn.style.padding = "10px";

	// 	statBtn.onclick = () => {
	// 		new Notice("Stat tool triggered (not implemented yet)");
	// 	};

	// 	const debugHeader = root.createEl("h2");

	// 	debugHeader.textContent = "Development";

	// 	const testEngineBtn = root.createEl("button");

	// 	testEngineBtn.textContent = "Test Engine";

	// 	testEngineBtn.onclick =
	// 		async () => {

	// 			await this.testRunner.runAll();
	// 		};

	// 	new Notice("Doob Tool Panel Loaded");
	// }

	async onClose() {}
}