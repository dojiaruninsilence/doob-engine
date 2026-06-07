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

		const el = container.createDiv();
		el.innerHTML = "<h2>Doob Engine Interface</h2><p>Ready 🚀</p>";

		new Notice("Tool Panel Loaded");
	}
}