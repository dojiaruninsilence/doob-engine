import { Plugin, Notice } from "obsidian";
import { DoobToolPanel } from "./views/DoobToolPanel";
import { DataManager } from "./managers/DataManager";
import { SchemaManager } from "./managers/SchemaManager";
import { RulesetManager } from "./managers/RulesetManager";
import { ContextFactory } from "./managers/ContextFactory";
import { CacheManager } from "./managers/CacheManager";
import { QueryManager } from "./managers/query/QueryManager";
import { QueryPlanner } from "./managers/query/QueryPlanner";
import { QueryExecutor } from "./managers/query/QueryExecutor";
import { QueryExecutionPlanRunner } from "./managers/query/QueryExecutionPlanRunner";
import { ResolvedRecordGraphBuilder } from "./managers/query/graph/ResolvedRecordGraphBuilder";
import { ResolvedRecordGraphNavigator } from "./managers/query/graph/ResolvedRecordGraphNavigator";
//import { AggregateResolver } from "./managers/query/aggregate/AggregateResolver";
import { AggregateBootstrap } from "./managers/query/aggregate/AggregateBootstrap";

const VIEW_TYPE_DOOB_PANEL = "doob-tool-panel";

export default class DoobEngine extends Plugin {

	// optional global reference (useful for debugging + reload)
	public softReload?: () => Promise<void>;

  	public dataManager!: DataManager;
  	public schemaManager!: SchemaManager;
  	public rulesetManager!: RulesetManager;
  	public contextFactory!: ContextFactory;
  	public cacheManager!: CacheManager;
  	public queryManager!: QueryManager;
	public queryPlanner!: QueryPlanner;
	public queryExecutor!: QueryExecutor;
	public queryExecutionPlanRunner!: QueryExecutionPlanRunner;
	public resolvedRecordGraphBuilcer!: ResolvedRecordGraphBuilder;
	//public aggregateResolver!: AggregateResolver;
	
	async onload() {

		// --------------------------------------------------
		// DEBUG HOOKS FIRST
		// --------------------------------------------------

		(window as any).doobPlugin = this;

		(window as any).doobReload = async () => {
			new Notice("Reloading Doob Engine...");
			await this.softReload?.();
		};

		this.softReload = this.softReloadImpl.bind(this);

		// --------------------------------------------------
		// INIT CORE SYSTEMS FIRST (CRITICAL FIX)
		// --------------------------------------------------

		this.cacheManager = new CacheManager();

		this.rulesetManager = new RulesetManager(this.app);

		this.schemaManager = new SchemaManager(
			this.app,
			this.rulesetManager,
			this.cacheManager
		);

		this.dataManager = new DataManager(
			this.app,
			this.schemaManager,
			this.rulesetManager,
			this.cacheManager
		);

		this.contextFactory = new ContextFactory(
			this.schemaManager
		);

		const resolvedRecordGraphNavigator = new ResolvedRecordGraphNavigator();
		const aggregateResolver = AggregateBootstrap.build(resolvedRecordGraphNavigator);

		this.queryPlanner = new QueryPlanner(
			this.contextFactory
		);

		this.resolvedRecordGraphBuilcer = new ResolvedRecordGraphBuilder(
			this.dataManager,
			this.contextFactory
		);

		this.queryExecutionPlanRunner = new QueryExecutionPlanRunner(
			this.resolvedRecordGraphBuilcer
		)

		this.queryExecutor = new QueryExecutor(
			this.dataManager,
			this.contextFactory,
			this.queryExecutionPlanRunner,
			resolvedRecordGraphNavigator,
			aggregateResolver
		);
		
		this.queryManager = new QueryManager(
			this.queryPlanner,
			this.queryExecutor
		);

		// --------------------------------------------------
		// NOW SAFE TO BUILD UI
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
			(leaf) => new DoobToolPanel(leaf, this)
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