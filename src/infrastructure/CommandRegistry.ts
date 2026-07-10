import { Notice } from "obsidian";
import DoobEngine from "../main";

export class CommandRegistry {

	static register(
		plugin: DoobEngine
	): void {

		this.registerOpenToolPanel(plugin);

		// future:
		// this.registerRunTests(plugin);
		// this.registerValidateRulesets(plugin);
		// this.registerRebuildCache(plugin);
	}

	private static registerOpenToolPanel(
		plugin: DoobEngine
	): void {

		plugin.addCommand({
			id: "open-doob-panel",
			name: "Open Doob Tool Panel",
			callback: async () => {

				new Notice("Tool panel command triggered");

				await plugin.toolPanelManager.open();
			}
		});
	}
}