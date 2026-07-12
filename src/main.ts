import { Plugin, Notice } from "obsidian";
import { EngineBootstrap } from "./infrastructure/bootstraps/EngineBootstrap";
import { EngineServices } from "./types";
import { DebugHooks } from "./infrastructure/DebugHooks";
import { ToolPanelManager } from "./ui/ToolPanelManager";
import { CommandRegistry } from "./infrastructure/CommandRegistry";
import { LayoutManager } from "./ui/LayoutManager";

export default class DoobEngine extends Plugin {

	// optional global reference (useful for debugging + reload)
	public softReload?: () => Promise<void>;
	public toolPanelManager!: ToolPanelManager;
	public services!: EngineServices;
	public layoutManager!: LayoutManager;
	
	async onload() {

		// --------------------------------------------------
		// DEBUG HOOKS FIRST
		// --------------------------------------------------

		this.softReload = this.softReloadImpl.bind(this);

		DebugHooks.install(this);

		// --------------------------------------------------
		// INIT CORE SYSTEMS FIRST (CRITICAL FIX)
		// --------------------------------------------------

		this.services = await EngineBootstrap.build(
			this.app
		);

		// --------------------------------------------------
		// NOW SAFE TO BUILD UI
		// --------------------------------------------------

		// this.layoutManager = new LayoutManager();

		this.toolPanelManager =
			new ToolPanelManager(this);

		this.toolPanelManager.initialize();
		CommandRegistry.register(this);

		new Notice("Doob Engine is alive!");
	}

	// --------------------------------------------------
	// SAFE RELOAD (NO INTERNAL OBSIDIAN API HACKS)
	// --------------------------------------------------
	private async softReloadImpl() {

		new Notice("Soft reloading Doob Engine...");

		// 1. remove UI views
		this.toolPanelManager.close();

		// 2. cleanup custom systems (add later)
		this.cleanupSystems?.();

		// 3. rebuild UI + systems
		this.toolPanelManager.initialize();
		CommandRegistry.register(this);

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
		DebugHooks.uninstall();
		console.log("Doob Engine unloaded");
	}
}