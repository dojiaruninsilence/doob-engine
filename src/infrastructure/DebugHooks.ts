import { Notice } from "obsidian";
import DoobEngine from "../main";

export class DebugHooks {

	static install(plugin: DoobEngine): void {

		(window as any).doobPlugin = plugin;

		(window as any).doobReload = async () => {
			new Notice("Reloading Doob Engine...");
			await plugin.softReload?.();
		};
	}

	static uninstall(): void {

		delete (window as any).doobPlugin;
		delete (window as any).doobReload;
	}
}