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
import { AggregateBootstrap } from "./managers/query/aggregate/AggregateBootstrap";
import { QueryMatchBuilder } from "./managers/query/match/QueryMatchBuilder";
import { QueryMatchNavigator } from "./managers/query/match/QueryMatchNavigator";
import { LoggerFactory } from "./managers/logging/LoggerFactory";
import { Logger } from "./managers/logging/Logger";
import { MutationExecutor } from "./managers/mutation/MutationExecutor";
import { MutationOperationResolver } from "./managers/mutation/operations/MutationOperationResolver";
import { MutationTargetResolver } from "./managers/mutation/MutationTargetResolver";
import { TraceLogger } from "./managers/logging/TraceLogger";
import { MutationValidationLayer } from "./managers/mutation/validation/MutationValidationLayer";
import { TraversalPlanner } from "./managers/traversal/TraversalPlanner";
import { TraversalExecutor } from "./managers/traversal/TraversalExecutor";
import { LegacyTraversalAdapter } from "./managers/traversal/LegacyTraversalAdapter";
import { TraversalPlanBuilder } from "./managers/traversal/TraversalPlanBuilder";
import { TraversalRequestBuilder } from "./managers/traversal/TraversalRequestBuilder";
import { ValueResolver } from "./managers/traversal/resolver/ValueResolver";

const VIEW_TYPE_DOOB_PANEL = "doob-tool-panel";

export default class DoobEngine extends Plugin {

	// optional global reference (useful for debugging + reload)
	public softReload?: () => Promise<void>;

  	public loggerFactory!: LoggerFactory;
	public engineLog!: Logger;
	public dataManager!: DataManager;
  	public schemaManager!: SchemaManager;
  	public rulesetManager!: RulesetManager;
  	public contextFactory!: ContextFactory;
  	public cacheManager!: CacheManager;
  	public queryManager!: QueryManager;
	public queryPlanner!: QueryPlanner;
	public queryExecutor!: QueryExecutor;
	public queryExecutionPlanRunner!: QueryExecutionPlanRunner;
	public resolvedRecordGraphBuilder!: ResolvedRecordGraphBuilder;
	public mutationExecutor!: MutationExecutor;
	public traversalPlanner!: TraversalPlanner;
	public traversalExecutor!: TraversalExecutor;
	public traversalRequestBuilder!: TraversalRequestBuilder;
	public traversalPlanBuilder!: TraversalPlanBuilder;
	
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

		this.loggerFactory = new LoggerFactory(this.app, {
			rootFolder: "Doob Engine/Logs"
		});

		this.engineLog = await this.loggerFactory.create({ filePath: "Engine/main.jsonl", mode: "append", defaultScope: "ENGINE", includeTimestamp: true });

		this.cacheManager = new CacheManager(this.engineLog);

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
		const queryMatchBuilder = new QueryMatchBuilder();
		const queryMatchNavigator = new QueryMatchNavigator();
		const mutationTargetResolver = new MutationTargetResolver();
		const mutationOperationResolver = new MutationOperationResolver();
		const traceLogger = new TraceLogger(this.engineLog);
		const mutationValidationLayer = new MutationValidationLayer(this.contextFactory, traceLogger);
		const traversalAdapter = new LegacyTraversalAdapter(this.contextFactory);
		const valueResolver = new ValueResolver();
		//const traversalPlanBuilder = new TraversalPlanBuilder()
		
		this.traversalPlanner = new TraversalPlanner(traceLogger);
		this.traversalExecutor = new TraversalExecutor(traceLogger, valueResolver);
		this.traversalPlanBuilder = new TraversalPlanBuilder(this.traversalPlanner);
		this.traversalRequestBuilder = new TraversalRequestBuilder(traversalAdapter);
		
		const aggregateResolver = AggregateBootstrap.build(this.traversalExecutor, traceLogger);

		this.queryPlanner = new QueryPlanner(
			this.contextFactory
		);

		this.resolvedRecordGraphBuilder = new ResolvedRecordGraphBuilder(
			this.dataManager,
			this.contextFactory,
			traceLogger
		);

		this.queryExecutionPlanRunner = new QueryExecutionPlanRunner(
			this.resolvedRecordGraphBuilder
		)

		this.queryExecutor = new QueryExecutor(
			this.dataManager,
			this.queryExecutionPlanRunner,
			resolvedRecordGraphNavigator,
			aggregateResolver,
			queryMatchBuilder,
			queryMatchNavigator,
			this.traversalPlanner,
			this.traversalExecutor,
			traversalAdapter,
			this.traversalRequestBuilder,
			this.traversalPlanBuilder,
			traceLogger
		);

		this.queryManager = new QueryManager(
			this.queryPlanner,
			this.queryExecutor
		);

		this.mutationExecutor = new MutationExecutor(
			this.dataManager,
			this.dataManager,
			this.resolvedRecordGraphBuilder,
			this.queryPlanner,
			mutationTargetResolver,
			mutationOperationResolver,
			traceLogger,
			this.contextFactory,
			mutationValidationLayer
		)


		// private reader: IDataReader,
		// 		private writer: IDataWriter,
		// 		private graphBuilder: ResolvedRecordGraphBuilder,
		// 		private queryPlanner: QueryPlanner,
		// 		private targetResolver: MutationTargetResolver,
		// 		private operationResolver: MutationOperationResolver

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