import { ItemView, Notice } from "obsidian";

export class DoobToolPanel extends ItemView {

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

		new Notice("Doob Tool Panel Loaded");
	}

	async onClose() {}
}