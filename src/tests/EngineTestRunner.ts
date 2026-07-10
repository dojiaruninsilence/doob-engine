import { Notice } from "obsidian";
import { ResolvedRecordGraphNavigator } from "../managers/query/graph/ResolvedRecordGraphNavigator";
import { AggregateResolver } from "../managers/query/aggregate/AggregateResolver";
import { QueryGroupResult } from "../types/query/QueryTypes";
import { AggregateStrategyRegistry } from "../managers/query/aggregate/AggregateStrategyRegistry";
import { CountMatchesStrategy } from "../managers/query/aggregate/strategies/CountMatchesStrategy";
import { SumStrategy } from "../managers/query/aggregate/strategies/SumStrategy";
import { AvgStrategy } from "../managers/query/aggregate/strategies/AvgStrategy";
import { MinStrategy } from "../managers/query/aggregate/strategies/MinStrategy";
import { MaxStrategy } from "../managers/query/aggregate/strategies/MaxStrategy";
import { DistinctCountStrategy } from "../managers/query/aggregate/strategies/DistinctCountStrategy";
import { DistinctValuesStrategy } from "../managers/query/aggregate/strategies/DistinctValuesStrategy";
import { QueryMatchNavigator } from "../managers/query/match/QueryMatchNavigator";
import { CountRootsStrategy } from "../managers/query/aggregate/strategies/CountRootsStrategy";
import { Logger } from "../managers/logging/Logger";
import { LoggerFactory } from "../managers/logging/LoggerFactory";
import { TraversalExecutor } from "../managers/traversal/TraversalExecutor";
import { TraceLogger } from "../managers/logging/TraceLogger";
import { ValueResolver } from "../managers/traversal/resolver/ValueResolver";

export class EngineTestRunner {

	private schemaManager: any;
	private dataManager: any;
	private contextFactory: any;
	private queryManager: any;
	private queryPlanner: any;
	private graphBuilder: any;
	private logger!: Logger;
	private engineLogger!: Logger;
	private loggerFactory!: LoggerFactory;
	private mutationExecutor: any;
	private trace: TraceLogger;

	constructor(
		schemaManager: any, 
		dataManager: any, 
		contextFactory: any, 
		queryManager: any, 
		queryPlanner: any,
		graphBuilder: any,
		mutationExecutor: any,
		engineLogger: Logger,
		loggerFactory: LoggerFactory,
		trace: TraceLogger
	) {

        if (!schemaManager) {
            new Notice("SchemaManager not injected");
            throw new Error("SchemaManager not injected");
        }

        if (!dataManager) {
            new Notice("DataManager not injected");
            throw new Error("DataManager not injected");
        }

        if (!contextFactory) {
            new Notice("ContextFactory not injected");
            throw new Error("ContextFactory not injected");
        }

        this.schemaManager = schemaManager;
        this.dataManager = dataManager;
        this.contextFactory = contextFactory;
        this.queryManager = queryManager;
		this.queryPlanner = queryPlanner;
		this.graphBuilder = graphBuilder;
		this.mutationExecutor = mutationExecutor;
		this.engineLogger = engineLogger;
		this.loggerFactory = loggerFactory;
		this.trace = trace;
    }

    private async safeRun(name: string, fn: () => Promise<void>) {
		this.logger?.log({ level: "info", scope: "TEST", message: `START: ${name}` });
        try {
            await fn();
            // new Notice(`✔ ${name}`);
			this.logger?.log({ level: "info", scope: "TEST", message: `✔ PASS: ${name}` });
        } catch (e) {
            console.error(`❌ ${name} failed`, e);
            // new Notice(`❌ ${name} failed\n${(e as Error).message}`);
			this.logger?.log({ level: "error", scope: "TEST", message: `❌ FAIL: ${name}`, data: (e as Error).message });
			new Notice(`❌ FAIL: ${name}\n${(e as Error).message}`);
            //throw e;
        }
    }

	private async resetCoreTestData() {

		// new Notice("Reset: CoreTest Data + Schema");
		this.logger?.log({ level: "info", scope: "TEST", message: "Resetting CoreTest Data + Schema" });

		const schemas = ["Item", "Character", "Guild"];

		// --------------------------------------------------
		// 1. Clear all data per schema
		// --------------------------------------------------

		for (const schemaName of schemas) {

			const context =
				await this.contextFactory.getSchemaContext(
					"CoreTest",
					schemaName
				);

			const all =
				await this.dataManager.getAll(context);

			for (const record of all) {
				await this.dataManager.remove(context, record.id);
			}
		}

		// --------------------------------------------------
		// 2. Reset schema mutations (IMPORTANT)
		// --------------------------------------------------

		for (const schemaName of schemas) {

			const context =
				await this.contextFactory.getSchemaContext(
					"CoreTest",
					schemaName
				);

			const fields =
				Object.keys(context.schema.fields);

			for (const field of fields) {

				// Keep base identity fields if needed
				if (field === "name") continue;

				await this.schemaManager.removeField(
					"CoreTest",
					schemaName,
					field
				);
			}
		}

		// new Notice("Reset complete");
		this.logger?.log({ level: "info", scope: "TEST", message: "Reset complete" });
	}

	private async ensureField(
		ruleset: string,
		schemaName: string,
		fieldName: string,
		type: any,
		defaultValue?: any,
		enumValues?: string[],
		referenceTarget?: {
			ruleset: string;
			schema: string;
		},
		capability?: "mutable" | "readOnly" | "derived" | "computed"
	) {

		const context =
			await this.contextFactory.getSchemaContext(
				ruleset,
				schemaName
			);

		if (context.schema.fields[fieldName]) {
			return;
		}

		await this.schemaManager.addField(
			ruleset,
			schemaName,
			fieldName,
			type,
			defaultValue,
			enumValues,
			referenceTarget,
			capability
		);
	}

	// Notes:
	/*

	file structure:
	src
    │   main.ts
    │   
    ├───adapters
    ├───core
    │       constants.ts
    │       
    ├───infrastructure
    ├───interfaces
    │       IDataReader.ts
    │       IDataWriter.ts
    │       
    ├───managers
    │   │   CacheManager.ts
    │   │   ContextFactory.ts
    │   │   DataManager.ts
    │   │   RulesetManager.ts
    │   │   SchemaManager.ts
    │   │   
    │   ├───logging
    │   │       Logger.ts
    │   │       LoggerFactory.ts
    │   │       ScopedLogger.ts
    │   │       
    │   ├───mutation
    │   │   │   MutationExecutor.ts
    │   │   │   MutationManager.ts
    │   │   │   MutationPlanner.ts
    │   │   │   MutationTargetResolver.ts
    │   │   │   
    │   │   ├───debug
    │   │   │       MutationTraceLogger.ts
    │   │   │       
    │   │   ├───operations
    │   │   │       MutationOperationResolver.ts
    │   │   │       
    │   │   ├───validation
    │   │   │       MutationValidationLayer.ts
    │   │   │       
    │   │   └───writer
    │   │           DataMutationWriter.ts
    │   │           IMutationWriter.ts
    │   │           
    │   ├───query
    │   │   │   QueryExecutionPlanRunner.ts
    │   │   │   QueryExecutor.ts
    │   │   │   QueryManager.ts
    │   │   │   QueryPlanner.ts
    │   │   │   
    │   │   ├───aggregate
    │   │   │   │   AggregateBootstrap.ts
    │   │   │   │   AggregateResolver.ts
    │   │   │   │   AggregateStrategyRegistry.ts
    │   │   │   │   IAggregateStrategy.ts
    │   │   │   │   
    │   │   │   └───strategies
    │   │   │           AvgStrategy.ts
    │   │   │           CountMatchesStrategy.ts
    │   │   │           CountRootsStrategy.ts
    │   │   │           DistinctCountStrategy.ts
    │   │   │           DistinctValuesStrategy.ts
    │   │   │           MaxStrategy.ts
    │   │   │           MinStrategy.ts
    │   │   │           SumStrategy.ts
    │   │   │           
    │   │   ├───graph
    │   │   │       ResolvedRecordGraphBuilder.ts
    │   │   │       ResolvedRecordGraphNavigator.ts
    │   │   │       
    │   │   └───match
    │   │           QueryMatchBuilder.ts
    │   │           QueryMatchNavigator.ts
    │   │           
    │   ├───reference
    │   └───traversal
    │           ObjectResolver.ts
    │           ReferenceResolver.ts
    │           TraversalExecutor.ts
    │           TraversalManager.ts
    │           
    ├───tests
    │       EngineTestRunner.ts
    │       
    ├───types
    │   │   ContextTypes.ts
    │   │   DataTypes.ts
    │   │   FieldTypes.ts
    │   │   LoggerTypes.ts
    │   │   SchemaTypes.ts
    │   │   TraversalTypes.ts
    │   │   ValidationTypes.ts
    │   │   
    │   ├───core
    │   │       DataValue.ts
    │   │       ResolvedReference.ts
    │   │       
    │   ├───mutation
    │   │       MutationOperationTypes.ts
    │   │       MutationPatchTypes.ts
    │   │       MutationPlanTypes.ts
    │   │       MutationResultTypes.ts
    │   │       MutationTargetTypes.ts
    │   │       MutationTypes.ts
    │   │       MutationValidationTypes.ts
    │   │       MutationWriteTargetTypes.ts
    │   │       
    │   └───query
    │           AggregateTypes.ts
    │           QueryExecutionTypes.ts
    │           QueryExecutorTypes.ts
    │           QueryMatchTypes.ts
    │           QueryPlannerTypes.ts
    │           QueryTypes.ts
    │           ResolvedRecordGraph.ts
    │           
    ├───ui
    │       ToolPanelManager.ts
    │       ToolPanelView.ts
    │       
    └───views
            DoobToolPanel.ts

	x1. Graph Integrity Tests
	x2. Navigator Tests
	x3. Query Tests
	4. Aggregate Expansion

					So later you can add:
					weighted aggregates

	5. Collection References

								QueryExecutionContext {
									graph: ResolvedRecordGraph;
									matches: QueryMatch[];
								}
	6. Mutation Support
			x What I would do next
				x Keep MutationExecutor mostly as-is.
				x Build MutationTargetResolver.
				x Modify executor to use targets instead of writeBack().
				x add datawriter
				x refactor resolvednode
				x Then write tests.
		
		x 👉 MutationPlanner next
		x 👉 Mutation validation layer (lightweight schema guard)

		x 👉 Optimistic mutation batching / diff-based writes

		x B. Field capability system

			define per schema:
			mutable
			read-only
			derived
			computed

		x C. Optimized mutation batching

			x collapse writes per record (you’re close already)

		Good base. Next high-value additions:

			nested object mutation (not just leaf fields)
			array replace vs append behavior (if applicable)
			multi-field mutation in one request (if you ever support it)
			mutation + reference fan-out stability (you’re already close)
		x 2. Add trace logger coverage

			Now that your trace logger exists:

			validate it logs one entry per applied mutation
			validate skipped reasons are recorded
			validate invalid path is captured correctly

			This will save you later debugging pain.

		Mutation diff inspector (VERY powerful for debugging)

			Shows:

			before / after per field
			grouped by record
			execution trace overlay

		3. Stability pass (most important)

			Run:

			full test suite repeatedly (you already do this 👍)
			add a “mutation stress test” (repeat 100–1000 ops on same dataset)

	x After aggregate expansion, I'd move toward:

		/core/traversal/
			TraversalEngine.ts
			TraversalTypes.ts
			TraversalExecutor.ts
			ReferenceResolver.ts
			ObjectResolver.ts

		x Phase 1 — TraversalEngine
			supports:
			reference steps
			object steps
			terminal value resolution
		x Phase 2 — Query migration
			QueryExecutor uses TraversalEngine
			remove old navigator logic
		x Phase 3 — Grouping/Aggregation migration
			grouping keys use traversal results
		x Phase 4 — GraphBuilder migration
			becomes traversal-driven expansion
		x Phase 5 — Mutation migration
			ow trivial because traversal is already proven
			x 2. MutationTargetResolver
			x 3. MutationExecutor
			x 4. MutationOperationResolver
			x 5. MutationWriter

			| Area                     | Status                     |
			| ------------------------ | -------------------------- |
			| Query execution          | ✅ migrated                 |
			| Mutation execution       | ✅ migrated                 |
			| Graph builder            | ✅ migrated                 |
			| Graph tests              | ✅ migrated                 |
			| Mutation operations      | ✅ already independent      |
			| Mutation target resolver | ⚠️ still string path based |
			| Aggregates               | needs check                |
			| GroupBy                  | needs check                |
			| QueryPlan references     | needs global search        |


		need to check main.ts, and clean up where needed

		work on logger. 
			- build trace like loggers for debug, info, error, ect.
			- function that passes in the system name as a string, append the individual components rather than entire name (QueryExecutor to Query(constant) + Executor -> Engine.Query.Executor)
				- only pass in a message and data. 
			- will output to different files for system, splits into different files for debug,info,ect
			- compiled in bundle that passes all loggers for single system in one object
			- also add all logs to master log, then maybe we compile all of the logs to master engine log
			- class to create a logger bundle
		
		Add index.ts to all type folders. 
			- slowly simplify all imports

		begin the ui with a way to display the logs better

		build all the agg strategies we may need
		we need to build extensive testing for grouping, aggregates, where, and select. need to check all edge cases

		upgrade mutation with math operations and all that

		add comments to everything

		Query Optimizations
		Plan deduplication
		Graph reuse
		Aggregate reuse
		Query caching
	*/

	// --------------------------------------------------
	// RUN ALL TESTS
	// --------------------------------------------------

	async runAll() {

		const logger = await this.loggerFactory.create({
			filePath: "tests/coreTests.jsonl",
			mode: "replace",
			defaultScope: "TestRunner",
			includeTimestamp: true
		});
		
		this.logger = logger;

        new Notice("🧪 Engine Tests Starting...");

		try {
			// await this.safeRun(
			// 	"Query Manager",
			// 	() => this.testQueryManager()
			// );

			await this.safeRun("Query Filter", () =>
				this.testQueryFilter()
			);

			await this.safeRun("Query Exact Match", () =>
				this.testQueryExactMatch()
			);

			await this.safeRun("Reference Query", () =>
				this.testReferenceQuery()
			);

			await this.safeRun("Sorting", () =>
				this.testSorting()
			);

			await this.safeRun("Pagination", () =>
				this.testPagination()
			);

			await this.safeRun("Cache Stability", () =>
				this.testCacheStability()
			);

			await this.safeRun("Migration Safety", () =>
				this.testMigrationSafety()
			);

			await this.safeRun("Negative Query", () =>
				this.testNegativeQuery()
			);

			await this.safeRun(
				"Single Hop Traversal",
				() => this.testSingleHopReferenceTraversal()
			);

			await this.safeRun(
				"Multi Hop Traversal",
				() => this.testMultiHopReferenceTraversal()
			);

			await this.safeRun(
				"Missing Reference Traversal",
				() => this.testMissingReferenceTraversal()
			);

			await this.safeRun(
				"projection flat fields",
				() => this.testProjectionFlatFields()
			);

			await this.safeRun(
				"Projection nested fields",
				() => this.testProjectionNestedFields()
			);

			await this.safeRun(
				"projection does not break filtering",
				() => this.testProjectionDoesNotBreakFiltering()
			);

			await this.safeRun(
				"count aggregation",
				() => this.testCountAggregation()
			);

			await this.safeRun(
				"Sum Aggregation",
				() => this.testSumAggregation()
			);

			await this.safeRun(
				"Average Aggregation",
				() => this.testAverageAggregation()
			);

			await this.safeRun(
				"Minimum Aggregation",
				() => this.testMinimumAggregation()
			);

			await this.safeRun(
				"Maximum Aggregation",
				() => this.testMaximumAggregation()
			);

			await this.safeRun(
				"Filtered Count Aggregation",
				() => this.testFilteredCountAggregation()
			);

			await this.safeRun(
				"Group by Count",
				() => this.testGroupByCount()
			);

			await this.safeRun(
				"Group by Sum",
				() => this.testGroupBySum()
			);

			await this.safeRun(
				"Group by Deep Traversal",
				() => this.testGroupByDeepTraversal()
			);

			await this.safeRun(
				"Group by Empty",
				() => this.testGroupByEmpty()
			);

			await this.safeRun(
				"Having Count",
				() => this.testHavingCount()
			);

			await this.safeRun(
				"Having Sum",
				() => this.testHavingSum()
			);

			await this.safeRun(
				"Having count property",
				() => this.testHavingCountProperty()
			);

			await this.safeRun(
				"Having Empty",
				() => this.testHavingEmpty()
			);

			await this.safeRun(
				"Group Order By Value desc",
				() => this.testGroupOrderByValueDesc()
			);

			await this.safeRun(
				"Group Order By Value Asc",
				() => this.testGroupOrderByValueAsc()
			);

			await this.safeRun(
				"Group Order By Key Asc",
				() => this.testGroupOrderByKeyAsc()
			);

			await this.safeRun(
				"Group Order by Count",
				() => this.testGroupOrderByCount()
			);

			await this.safeRun(
				"Query Planner Single Hop",
				() => this.testQueryPlannerSingleHop()
			);

			await this.safeRun(
				"Query Planner Multi Hop",
				() => this.testQueryPlannerMultiHop()
			);

			await this.safeRun(
				"Query Planner Combined Fields",
				() => this.testQueryPlannerCombinedFields()
			);

			await this.safeRun(
				"Query Planner No Traversal",
				() => this.testQueryPlannerNoTraversal()
			);

			await this.safeRun(
				"Planner Filter Integration",
				() => this.testPlannerFilterIntegration()
			);

			await this.safeRun(
				"Planner Projection Integration",
				() => this.testPlannerProjectionIntegration()
			);

			await this.safeRun(
				"Planner Group Integration",
				() => this.testPlannerGroupIntegration()
			);

			await this.safeRun(
				"Deduplication Test (select explosion)",
				() => this.testQueryPlannerDeduplication()
			);

			await this.safeRun(
				"Shared SELECT + WHERE Path Test",
				() => this.testQueryPlannerSelectWhereDeduplication()
			);

			await this.safeRun(
				"GroupBy Deduplication Test",
				() => this.testQueryPlannerGroupByDeduplication()
			);

			await this.safeRun(
				"Runner Batch Deduplication",
				() => this.testRunnerBatchDeduplication()
			);

			await this.safeRun(
				"Runner Multi Hop Integrity",
				() => this.testRunnerMultiHopIntegrity()
			);

			await this.safeRun(
				"Runner No Step Fast Path",
				() => this.testRunnerNoStepFastPath()
			);

			await this.safeRun(
				"Deep Reference Traversal",
				() => this.testDeepReferenceTraversal()
			);

			await this.safeRun(
				"Shared Reference Consistency",
				() => this.testSharedReferenceConsistency()
			);

			await this.safeRun(
				"Batch Fan Out Traversal",
				() => this.testBatchFanOutTraversal()
			);

			await this.safeRun(
				"Missing Reference Filter Behavior",
				() => this.testMissingReferenceFilterBehavior()
			);

			await this.safeRun(
				"Aggregate Tests Manager",
				() => this.testAggregateManager()
			);

			await this.safeRun(
				"Reference Collection Tests Manager",
				() => this.testReferenceCollectionManager()
			);

			await this.safeRun(
				"Mutation Test Suite",
				() => this.MutationTestSuite()
			);

			await this.safeRun(
				"Aggregation Test Suite",
				() => this.aggregationTestSuite()
			);

			await this.safeRun(
				"Graph Edge Case Test Suite",
				() => this.graphEdgeCaseTestSuite()
			);
		}
		catch (e) {
			// this only catches unexpected fatal runner errors
			console.error("Test runner crashed", e);
			this.logger?.log({ level: "error", scope: "TEST", message: `❌ Test Runner Crashed`, data: e });
			new Notice(`❌ Test Runner Crashed\n${(e as Error).message}`);
			//this.logger?.log({ level: "error", scope: "TEST", message: "Reset complete" });
		}
		finally {
			await this.logger.flush();
			new Notice("✅ All Engine Tests Completed");
		}

        

		//await this.logger.flush();
    }

	// --------------------------------------------------
	// QUERY MANAGER TESTS
	// --------------------------------------------------
	
	private async testQueryBasicReturn() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Basic Return" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {});

		if (!Array.isArray(results)) {
			throw new Error("Query did not return array");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: `Basic return OK: ${results.length}` });
	}

	private async testQueryWhereEquals() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Where Equals" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: "=", value: 10 }
				]
			});

		for (const r of results) {
			if (r.data.damage !== 10) {
				throw new Error("Equality filter failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: `Equals OK: ${results.length}` });
	}

	private async testQueryWhereGreaterThan() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Greater Than" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: 5 }
				]
			});

		for (const r of results) {
			if (!(r.data.damage > 5)) {
				throw new Error("Greater than filter failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: `Greater Than OK: ${results.length}` });
	}

	private async testQueryMultiFilterAnd() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Multi Filter" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: 5 },
					{ field: "rarity", op: "=", value: "Epic" }
				]
			});

		for (const r of results) {
			if (!(r.data.damage > 5 && r.data.rarity === "Epic")) {
				throw new Error("Multi filter failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: `Multi Filter OK: ${results.length}` });
	}

	private async testQuerySortAsc() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Sort ASC" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				sort: { field: "damage", dir: "asc" }
			});

		for (let i = 1; i < results.length; i++) {
			if (results[i - 1].data.damage > results[i].data.damage) {
				throw new Error("Sort ASC failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Sort ASC OK" });
	}

	private async testQuerySortDesc() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Sort DESC" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				sort: { field: "damage", dir: "desc" }
			});

		for (let i = 1; i < results.length; i++) {
			if (results[i - 1].data.damage < results[i].data.damage) {
				throw new Error("Sort DESC failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Sort DESC OK" });
	}

	private async testQueryLimit() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Limit" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				limit: 2
			});

		if (results.length > 2) {
			throw new Error("Limit failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: `Limit OK: ${results.length}` });
	}

	private async testQueryOffset() {

		await this.resetCoreTestData();

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			context,
			{ name: "A" }
		);

		await this.dataManager.createRecord(
			context,
			{ name: "B" }
		);

		await this.dataManager.createRecord(
			context,
			{ name: "C" }
		);

		const all =
			await this.queryManager.query(
				context,
				{}
			);

		const offset =
			await this.queryManager.query(
				context,
				{
					offset: 1
				}
			);

		if (offset.length !== 2) {
			throw new Error("Offset failed");
		}
	}

	private async testQueryLimitOffset() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Limit + Offset" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				offset: 1,
				limit: 2
			});

		if (results.length > 2) {
			throw new Error("Limit+Offset failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Limit+Offset OK" });
	}

	private async testQueryInOperator() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: IN Operator" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{
						field: "rarity",
						op: "in",
						value: ["Rare", "Epic"]
					}
				]
			});

		for (const r of results) {
			if (!["Rare", "Epic"].includes(r.data.rarity)) {
				throw new Error("IN operator failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "IN OK" });
	}

	private async testQueryContainsOperator() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Contains" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{
						field: "name",
						op: "contains",
						value: "Sword"
					}
				]
			});

		for (const r of results) {
			if (!r.data.name.includes("Sword")) {
				throw new Error("Contains failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Contains OK" });
	}

	private async testQueryExistsOperator() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Exists" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{
						field: "owner",
						op: "exists"
					}
				]
			});

		for (const r of results) {
			if (r.data.owner == null) {
				throw new Error("Exists failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Exists OK" });
	}

	private async testQueryDeterminism() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Determinism" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const r1 =
			await this.queryManager.query(context, {});

		const r2 =
			await this.queryManager.query(context, {});

		if (r1.length !== r2.length) {
			throw new Error("Non-deterministic results detected");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Determinism OK" });
	}

	private async testQueryUnknownField() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Unknown Field" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "doesNotExist", op: "=", value: 1 }
				]
			});

		if (results.length !== 0) {
			throw new Error("Unknown field should return 0 results");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Unknown Field OK" });
	}

	private async testQueryNullAndUndefinedHandling() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Null Safety" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "nonexistentField", op: "=", value: null }
				]
			});

		// Should not crash
		if (!Array.isArray(results)) {
			throw new Error("Null safety failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Null Safety OK" });
	}

	private async testQueryTypeCoercionSafety() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Type Safety" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: "5" }
				]
			});

		// Should NOT throw or behave inconsistently
		for (const r of results) {
			if (typeof r.data.damage !== "number") {
				throw new Error("Type mismatch detected");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Type Safety OK" });
	}

	private async testQueryStackedSameFieldFilters() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Stacked Filters" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: 5 },
					{ field: "damage", op: "<", value: 20 }
				]
			});

		for (const r of results) {
			if (!(r.data.damage > 5 && r.data.damage < 20)) {
				throw new Error("Stacked filters failed");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Stacked Filters OK" });
	}

	private async testQueryEmptyDataset() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Empty Dataset" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		// If possible, run against a schema with no records
		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: 999999 }
				]
			});

		if (results.length !== 0) {
			throw new Error("Empty dataset handling failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Empty Dataset OK" });
	}

	private async testQuerySortStability() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Query: Sort Stability" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const r1 =
			await this.queryManager.query(context, {
				sort: { field: "damage", dir: "asc" }
			});

		const r2 =
			await this.queryManager.query(context, {
				sort: { field: "damage", dir: "asc" }
			});

		for (let i = 0; i < r1.length; i++) {
			if (r1[i].id !== r2[i].id) {
				throw new Error("Sort is not deterministic");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Sort Stability OK" });
	}

	private async testQueryManager() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Test Query Manager Suite" });

		try {
			await this.testQueryBasicReturn();
			await this.testQueryWhereEquals();
			await this.testQueryWhereGreaterThan();
			await this.testQueryMultiFilterAnd();
			await this.testQuerySortAsc();
			await this.testQuerySortDesc();
			await this.testQueryLimit();
			await this.testQueryOffset();
			await this.testQueryLimitOffset();
			await this.testQueryInOperator();
			await this.testQueryContainsOperator();
			await this.testQueryExistsOperator();
			await this.testQueryDeterminism();
			await this.testQueryUnknownField();
			await this.testQueryNullAndUndefinedHandling();
			await this.testQueryTypeCoercionSafety();
			await this.testQueryStackedSameFieldFilters();
			await this.testQueryEmptyDataset();
			await this.testQuerySortStability();
		}
		catch (e) {
			this.logger?.log({ level: "error", scope: "TEST", message: "Query Manager Tests Failed", data: (e as Error).message });
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Query Manager Tests Completed" });
	}

	private async createItemQueryFixture() {

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);


		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);


		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob"
				}
			);


		const items = [];

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Sword",
					damage: 10,
					owner: bob.id
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Shield",
					damage: 5,
					owner: bob.id
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Rock",
					damage: 1
				}
			)
		);


		return {
			itemContext,
			characterContext,
			bob,
			items
		};
	}

	private async testQueryFilter() {

		await this.resetCoreTestData();

		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Test: Query Filter"
		});


		const {
			itemContext
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "damage",
							op: ">",
							value: 1
						}
					]
				}
			);


		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}


		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Filter passed"
		});
	}

	private async testQueryExactMatch() {

		await this.resetCoreTestData();

		const {
			itemContext
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "name",
							op: "=",
							value: "Sword"
						}
					]
				}
			);


		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}


		if (results[0].data.name !== "Sword") {
			throw new Error(
				"Returned wrong record"
			);
		}
	}

	private async testReferenceQuery() {

		await this.resetCoreTestData();

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});

		const {
			itemContext,
			bob
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "owner",
							op: "=",
							value: bob.id
						}
					]
				}
			);


		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}
	}

	private async testSorting() {

		await this.resetCoreTestData();

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});

		const {
			itemContext
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					sort: {
						field: "damage",
						dir: "asc"
					}
				}
			);


		if (
			results[0].data.damage !== 1 ||
			results[1].data.damage !== 5 ||
			results[2].data.damage !== 10
		) {
			throw new Error(
				"Sorting failed"
			);
		}
	}

	private async testPagination() {

		await this.resetCoreTestData();


		const {
			itemContext
		} =
			await this.createItemQueryFixture();


		const page =
			await this.queryManager.query(
				itemContext,
				{
					offset: 0,
					limit: 2
				}
			);


		if (page.length !== 2) {
			throw new Error(
				`Expected page size 2, got ${page.length}`
			);
		}
	}

	private async testCacheStability() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Cache Stability" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const first =
			await this.dataManager.getAll(context);

		const second =
			await this.dataManager.getAll(context);

		if (first.length !== second.length) {
			throw new Error("Cache inconsistency detected");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Cache stable" });
	}

	private async testMigrationSafety() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Migration Safety" });

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const fieldName =
			`testField_${Date.now()}`;

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			fieldName,
			"string",
			"default"
		);

		const data =
			await this.dataManager.getAll(context);

		if (!Array.isArray(data)) {
			throw new Error("Migration broke data access");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Migration safe" });
	}

	private async testNegativeQuery() {

		await this.resetCoreTestData();

		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Test: Negative Query"
		});


		const {
			itemContext
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "damage",
							op: "=",
							value: -999
						}
					]
				}
			);


		if (!Array.isArray(results)) {
			throw new Error(
				"Negative query did not return array"
			);
		}


		if (results.length !== 0) {
			throw new Error(
				`Negative query returned ${results.length} unexpected results`
			);
		}


		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Negative query passed"
		});
	}

	private async testSingleHopReferenceTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Single Hop Reference Traversal" });

		// --------------------------------------------------
		// Create required schema
		// --------------------------------------------------

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		if (!itemContext.schema.fields.owner) {

			await this.schemaManager.addField(
				"CoreTest",
				"Item",
				"owner",
				"reference",
				null,
				undefined,
				{
					ruleset: "CoreTest",
					schema: "Character"
				}
			);
		}

		// --------------------------------------------------
		// Reload contexts after migration
		// --------------------------------------------------

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const updatedItemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Create data
		// --------------------------------------------------

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Traversal Bob"
				}
			);

		const item =
			await this.dataManager.createRecord(
				updatedItemContext,
				{
					name: "Traversal Sword",
					damage: 10,
					owner: character.id
				}
			);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				updatedItemContext,
				{
					where: [
						{
							field: "owner.name",
							op: "=",
							value: "Traversal Bob"
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== item.id) {
			throw new Error(
				"Wrong item returned"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Single hop traversal passed" });
	}

	private async testMultiHopReferenceTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Multi Hop Reference Traversal" });

		// --------------------------------------------------
		// Add Guild schema field to Character
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		// --------------------------------------------------
		// Reload contexts after migration
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Verify migration succeeded
		// --------------------------------------------------

		const guildField =
			characterContext.schema.fields.guild;

		if (!guildField) {
			throw new Error(
				"Guild field was not created"
			);
		}

		if (guildField.type !== "reference") {
			throw new Error(
				"Guild field is not a reference"
			);
		}

		if (
			!guildField.referenceTarget ||
			guildField.referenceTarget.schema !== "Guild"
		) {
			throw new Error(
				"Guild reference target incorrect"
			);
		}

		// --------------------------------------------------
		// Create Guild
		// --------------------------------------------------

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights"
				}
			);

		if (!guild?.id) {
			throw new Error(
				"Guild creation failed"
			);
		}

		// --------------------------------------------------
		// Create Character
		// --------------------------------------------------

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Guild Bob",
					guild: guild.id
				}
			);

		if (!character?.id) {
			throw new Error(
				"Character creation failed"
			);
		}

		// --------------------------------------------------
		// Create Item
		// --------------------------------------------------

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Guild Sword",
					damage: 15,
					owner: character.id
				}
			);

		if (!item?.id) {
			throw new Error(
				"Item creation failed"
			);
		}

		// --------------------------------------------------
		// Execute traversal query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "owner.guild.name",
							op: "=",
							value: "Knights"
						}
					]
				}
			);

		// --------------------------------------------------
		// Validate results
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== item.id) {
			throw new Error(
				"Traversal returned wrong item"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Multi hop traversal passed" });
	}

	private async testMissingReferenceTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Missing Reference Traversal" });

		// --------------------------------------------------
		// Add Character.guild reference
		// --------------------------------------------------

		await this.schemaManager.addField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Create character with broken guild reference
		// --------------------------------------------------

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Broken Bob",
					guild: "fake-guild-id"
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Broken Sword",
				damage: 10,
				owner: character.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "owner.guild.name",
							op: "=",
							value: "Knights"
						}
					]
				}
			);

		if (results.length !== 0) {
			throw new Error(
				`Expected 0 results, got ${results.length}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Missing reference traversal passed" });
	}

	private async testProjectionFlatFields() {

		await this.resetCoreTestData();

		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Test: Projection - Flat Fields"
		});


		const {
			itemContext,
			items
		} =
			await this.createItemQueryFixture();


		const sword =
			items.find(
				item =>
					item.data.name === "Sword"
			);

		if (!sword) {
			throw new Error(
				"Fixture missing Sword item"
			);
		}


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "name",
							op: "=",
							value: "Sword"
						}
					],
					select: [
						"name",
						"damage"
					]
				}
			);


		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}


		const r = results[0];


		if (r.id !== sword.id) {
			throw new Error(
				"Wrong record returned"
			);
		}


		if (r.name !== "Sword") {
			throw new Error(
				"Name projection failed"
			);
		}


		if (r.damage !== 10) {
			throw new Error(
				"Damage projection failed"
			);
		}


		// owner exists on the record but was not selected
		if ("owner" in r) {
			throw new Error(
				"Unexpected field: owner"
			);
		}


		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Projection flat fields passed"
		});
	}

	private async testProjectionNestedFields() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Projection - Nested Fields" });

		// --------------------------------------------------
		// Build schemas
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Reload contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Create data
		// --------------------------------------------------

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights"
				}
			);

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: guild.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: character.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				itemContext,
				{
					select: [
						"name",
						"owner.name",
						"owner.guild.name"
					]
				}
			);

		// --------------------------------------------------
		// Validate
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		const r = results[0];

		if (!r.owner?.name || r.owner.name !== "Bob") {
			throw new Error("owner.name projection failed");
		}

		if (
			!r.owner?.guild?.name ||
			r.owner.guild.name !== "Knights"
		) {
			throw new Error(
				"owner.guild.name projection failed"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Projection nested fields passed" });
	}

	private async testProjectionDoesNotBreakFiltering() {

		await this.resetCoreTestData();

		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Test: Projection + Filtering"
		});


		const {
			itemContext,
			items
		} =
			await this.createItemQueryFixture();


		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "damage",
							op: ">",
							value: 5
						}
					],
					select: [
						"name"
					]
				}
			);


		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}


		if (results[0].name !== "Sword") {
			throw new Error(
				"Filtering broke with projection"
			);
		}


		// damage should not appear because projection only requested name
		if ("damage" in results[0]) {
			throw new Error(
				"Projection leaked filtered field"
			);
		}


		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Projection filtering safety passed"
		});
	}

	private async testCountAggregation() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Count Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword" }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield" }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Bow" }
		);

		const count =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "count-matches"
					}
				}
			);

		if (count !== 3) {
			throw new Error(
				`Expected 3, got ${count}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Count aggregation passed" });
	}

	private async testSumAggregation() {

		await this.resetCoreTestData();
		// this.engineLogger?.log({ level: "trace", scope: "Test", message: "FAILING TEST START"});

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Sum Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 10 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 20 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 30 }
		);

		const total =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "sum",
						field: "damage"
					}
				}
			);

		if (total !== 60) {
			throw new Error(
				`Expected 60, got ${total}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Sum aggregation passed" });
	}

	private async testAverageAggregation() {

		await this.resetCoreTestData();
		// this.engineLogger?.log({ level: "trace", scope: "Test", message: "FAILING TEST END"});

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Average Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 10 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 20 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 30 }
		);

		const avg =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "avg",
						field: "damage"
					}
				}
			);

		if (avg !== 20) {
			throw new Error(
				`Expected 20, got ${avg}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Average aggregation passed" });
	}

	private async testMinimumAggregation() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Minimum Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 10 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 20 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 30 }
		);

		const min =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "min",
						field: "damage"
					}
				}
			);

		if (min !== 10) {
			throw new Error(
				`Expected 10, got ${min}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Minimum aggregation passed" });
	}

	private async testMaximumAggregation() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Maximum Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 10 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 20 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 30 }
		);

		const max =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "max",
						field: "damage"
					}
				}
			);

		if (max !== 30) {
			throw new Error(
				`Expected 30, got ${max}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Maximum aggregation passed" });
	}

	private async testFilteredCountAggregation() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Filtered Count Aggregation" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 5 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 15 }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ damage: 25 }
		);

		const count =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					where: [
						{
							field: "damage",
							op: ">",
							value: 10
						}
					],
					aggregate: {
						op: "count-matches"
					}
				}
			);

		if (count !== 2) {
			throw new Error(
				`Expected 2, got ${count}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Filtered count aggregation passed" });
	}

	private async testGroupByCount() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group By Count" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const guildA =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const guildB =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const charA =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: guildA.id
				}
			);

		const charB =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: guildA.id
				}
			);

		const charC =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: guildB.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", owner: charA.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield", owner: charB.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Dagger", owner: charC.id }
		);

		const results =
			await this.queryManager.queryGroup(itemContext, {
				groupBy: "owner.guild.name",
				aggregate: {
					op: "count-matches"
				}
			});

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		const knights =
			results.find(r => r.key === "Knights");

		const bandits =
			results.find(r => r.key === "Bandits");

		if (!knights || knights.value !== 2) {
			throw new Error("Knights group failed");
		}

		if (!bandits || bandits.value !== 1) {
			throw new Error("Bandits group failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group By Count passed" });
	}

	private async testGroupBySum() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group By Sum" });
		// this.engineLogger?.log({ level: "trace", scope: "TEST", message: "Failing Test Start" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const char =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: guild.id
				}
			);

		const sword = await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", damage: 10, owner: char.id }
		);

		const shield = await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield", damage: 20, owner: char.id }
		);

		const results =
			await this.queryManager.queryGroup(itemContext, {
				groupBy: "owner.guild.name",
				aggregate: {
					op: "sum",
					field: "damage"
				}
			});

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].value !== 30) {
			throw new Error(
				`Expected sum 30, got ${results[0].value}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group By Sum passed" });
	}

	private async testGroupByDeepTraversal() {

		// this.engineLogger?.log({ level: "trace", scope: "TEST", message: "Failing Test end" });

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group By Deep Traversal" });

		// --------------------------------------------------
		// FULL SCHEMA SETUP (CRITICAL FIX)
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Reload contexts AFTER schema changes
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// DATA SETUP
		// --------------------------------------------------

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const char =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: guild.id
				}
			);

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Sword",
					owner: char.id
				}
			);

		// --------------------------------------------------
		// GROUP QUERY
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(itemContext, {
				groupBy: "owner.guild.name",
				aggregate: {
					op: "count-matches"
				}
			});

		// --------------------------------------------------
		// ASSERTIONS
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error("Wrong group key");
		}

		if (results[0].value !== 1) {
			throw new Error("Wrong group count");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Deep Group By passed" });
	}

	private async testGroupByEmpty() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group By Empty" });

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, { ruleset: "CoreTest", schema: "Character" });
		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, { ruleset: "CoreTest", schema: "Guild" });

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const results =
			await this.queryManager.queryGroup(itemContext, {
				groupBy: "owner.guild.name",
				aggregate: {
					op: "count-matches"
				}
			});

		if (results.length !== 0) {
			throw new Error("Expected empty result set");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Empty group test passed" });
	}

	private async testHavingCount() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: HAVING Count" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Shield",
				owner: rick.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				owner: john.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					having: [
						{
							field: "value",
							op: ">",
							value: 1
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				"Wrong group returned"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "HAVING Count passed" });
	}

	private async testHavingSum() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: HAVING Sum" });

		// schema

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				damage: 10,
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Shield",
				damage: 20,
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				damage: 5,
				owner: john.id
			}
		);

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "sum",
						field: "damage"
					},
					having: [
						{
							field: "value",
							op: ">",
							value: 20
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				"Wrong guild returned"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "HAVING Sum passed" });
	}

	private async testHavingCountProperty() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: HAVING Count Property" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights"
				}
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Bandits"
				}
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Shield",
				owner: rick.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				owner: john.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					having: [
						{
							field: "count",
							op: ">",
							value: 1
						}
					]
				}
			);

		// --------------------------------------------------
		// Validation
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				"Wrong group returned"
			);
		}

		if (results[0].value !== 2) {
			throw new Error(
				`Expected count 2, got ${results[0].value}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "HAVING Count Property passed" });
	}

	private async testHavingEmpty() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: HAVING Empty" });

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "name",
					aggregate: {
						op: "count-matches"
					},
					having: [
						{
							field: "value",
							op: ">",
							value: 1
						}
					]
				}
			);

		if (results.length !== 0) {
			throw new Error(
				"Expected empty result"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "HAVING Empty passed" });
	}

	private async testGroupOrderByValueDesc() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group Order By Value Desc" });

		// Schema

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const jane =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Jane",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", owner: bob.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield", owner: rick.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Bow", owner: jane.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Dagger", owner: john.id }
		);

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					sort: {
						field: "value",
						dir: "desc"
					}
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				"Descending sort failed"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group Order By Value Desc passed" });
	}

	private async testGroupOrderByValueAsc() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group Order By Value Asc" });

		// Schema

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const jane =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Jane",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", owner: bob.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield", owner: rick.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Bow", owner: jane.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Dagger", owner: john.id }
		);

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					sort: {
						field: "value",
						dir: "asc"
					}
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		if (results[0].key !== "Bandits") {
			throw new Error(
				"Value ascending sort failed: Bandits should be first"
			);
		}

		if (results[1].key !== "Knights") {
			throw new Error(
				"Value ascending sort failed: Knights should be second"
			);
		}

		if (results[0].value !== 1) {
			throw new Error(
				`Expected Bandits count 1, got ${results[0].value}`
			);
		}

		if (results[1].value !== 3) {
			throw new Error(
				`Expected Knights count 3, got ${results[1].value}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group Order By Value asc passed" });
	}

	private async testGroupOrderByKeyAsc() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group Order By Key Asc" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Guilds
		// --------------------------------------------------

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const wizards =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Wizards" }
			);

		// --------------------------------------------------
		// Characters
		// --------------------------------------------------

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		const merlin =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Merlin",
					guild: wizards.id
				}
			);

		// --------------------------------------------------
		// Items
		// --------------------------------------------------

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				owner: john.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Staff",
				owner: merlin.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					sort: {
						field: "key",
						dir: "asc"
					}
				}
			);

		// --------------------------------------------------
		// Validation
		// --------------------------------------------------

		if (results.length !== 3) {
			throw new Error(
				`Expected 3 groups, got ${results.length}`
			);
		}

		if (results[0].key !== "Bandits") {
			throw new Error(
				"Bandits should be first alphabetically"
			);
		}

		if (results[1].key !== "Knights") {
			throw new Error(
				"Knights should be second alphabetically"
			);
		}

		if (results[2].key !== "Wizards") {
			throw new Error(
				"Wizards should be third alphabetically"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group Order By Key Asc passed" });
	}

	private async testGroupOrderByCount() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Group Order By Count Desc" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const jane =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Jane",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", owner: bob.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Shield", owner: rick.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Bow", owner: jane.id }
		);

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Dagger", owner: john.id }
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					},
					sort: {
						field: "count",
						dir: "desc"
					}
				}
			);

		// --------------------------------------------------
		// Validation
		// --------------------------------------------------

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				"Count sort descending failed"
			);
		}

		if (results[0].value !== 3) {
			throw new Error(
				"Knights count incorrect"
			);
		}

		if (results[1].key !== "Bandits") {
			throw new Error(
				"Count sort descending failed"
			);
		}

		if (results[1].value !== 1) {
			throw new Error(
				"Bandits count incorrect"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Group Order By Count Desc passed" });
	}

	private async testQueryPlannerSingleHop() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Query Planner Single Hop" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const plan =
			await this.queryPlanner.plan(
				itemContext,
				{
					select: [
						"owner.name"
					]
				}
			);

		if (plan.rootSchema !== "Item") {
			throw new Error(
				"Root schema incorrect"
			);
		}

		if (plan.steps.length !== 1) {
			throw new Error(
				`Expected 1 step, got ${plan.steps.length}`
			);
		}

		const step = plan.steps[0];

		if (step.from !== "Item") {
			throw new Error("Wrong from schema");
		}

		if (step.field !== "owner") {
			throw new Error("Wrong field");
		}

		if (step.to !== "Character") {
			throw new Error("Wrong target schema");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Query Planner Single Hop passed" });
	}

	private async testQueryPlannerMultiHop() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Query Planner Multi Hop" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Reload contexts
		// --------------------------------------------------

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		// --------------------------------------------------
		// Verify schema state
		// --------------------------------------------------

		if (!itemContext.schema.fields.owner) {
			throw new Error(
				"Item.owner missing"
			);
		}

		if (!characterContext.schema.fields.guild) {
			throw new Error(
				"Character.guild missing"
			);
		}

		// --------------------------------------------------
		// Plan
		// --------------------------------------------------

		const plan =
			await this.queryPlanner.plan(
				itemContext,
				{
					select: [
						"owner.guild.name"
					]
				}
			);

		if (plan.steps.length !== 2) {
			throw new Error(
				`Expected 2 steps, got ${plan.steps.length}`
			);
		}

		if (
			plan.steps[0].from !== "Item" ||
			plan.steps[0].field !== "owner" ||
			plan.steps[0].to !== "Character"
		) {
			throw new Error(
				"Step 1 incorrect"
			);
		}

		if (
			plan.steps[1].from !== "Character" ||
			plan.steps[1].field !== "guild" ||
			plan.steps[1].to !== "Guild"
		) {
			throw new Error(
				"Step 2 incorrect"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Query Planner Multi Hop passed" });
	}

	private async testQueryPlannerCombinedFields() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Query Planner Combined Fields" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const plan =
			await this.queryPlanner.plan(
				itemContext,
				{
					select: [
						"owner.name"
					],
					where: [
						{
							field: "owner.guild.name",
							op: "=",
							value: "Knights"
						}
					],
					groupBy: "owner.guild.name"
				}
			);

		if (plan.steps.length === 0) {
			throw new Error(
				"No traversal steps generated"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Query Planner Combined Fields passed" });
	}

	private async testQueryPlannerNoTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Query Planner No Traversal" });

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const plan =
			await this.queryPlanner.plan(
				itemContext,
				{
					select: [
						"name"
					]
				}
			);

		if (plan.steps.length !== 0) {
			throw new Error(
				"Expected no traversal steps"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Query Planner No Traversal passed" });
	}

	private async testPlannerFilterIntegration() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Planner Filter Integration" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				owner: john.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "owner.guild.name",
							op: "=",
							value: "Knights"
						}
					]
				}
			);

		// --------------------------------------------------
		// Validation
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].data.name !== "Sword") {
			throw new Error(
				"Wrong item returned"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Planner Filter Integration passed" });
	}

	private async testPlannerProjectionIntegration() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Planner Projection Integration" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		// Query

		const results =
			await this.queryManager.query(
				itemContext,
				{
					select: [
						"owner.name",
						"owner.guild.name"
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		const result = results[0];

		if (result.owner?.name !== "Bob") {
			throw new Error(
				"owner.name projection failed"
			);
		}

		if (
			result.owner?.guild?.name !== "Knights"
		) {
			throw new Error(
				"owner.guild.name projection failed"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Planner Projection Integration passed" });
	}

	private async testPlannerGroupIntegration() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Planner Group Integration" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Knights" }
			);

		const bandits =
			await this.dataManager.createRecord(
				guildContext,
				{ name: "Bandits" }
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					guild: knights.id
				}
			);

		const rick =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Rick",
					guild: knights.id
				}
			);

		const john =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "John",
					guild: bandits.id
				}
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword",
				owner: bob.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Shield",
				owner: rick.id
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Dagger",
				owner: john.id
			}
		);

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "owner.guild.name",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		// --------------------------------------------------
		// Validation
		// --------------------------------------------------

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		const knightsGroup =
			results.find(
				r => r.key === "Knights"
			);

		const banditsGroup =
			results.find(
				r => r.key === "Bandits"
			);

		if (!knightsGroup || knightsGroup.value !== 2) {
			throw new Error(
				"Knights group incorrect"
			);
		}

		if (!banditsGroup || banditsGroup.value !== 1) {
			throw new Error(
				"Bandits group incorrect"
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Planner Group Integration passed" });
	}

	private async testQueryPlannerDeduplication() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Query Planner Deduplication" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Plan
		// --------------------------------------------------

		const plan =
			await this.queryPlanner.plan(itemContext, {
				select: [
					"owner.name",
					"owner.guild.name",
					"owner.guild.rank"
				]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (plan.steps.length !== 2) {
			throw new Error(
				`Expected 2 steps, got ${plan.steps.length}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Deduplication test passed" });
	}

	private async testQueryPlannerSelectWhereDeduplication() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Select + Where Deduplication" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Plan
		// --------------------------------------------------

		const plan =
			await this.queryPlanner.plan(itemContext, {
				select: ["owner.guild.name"],
				where: [
					{
						field: "owner.guild.name",
						op: "=",
						value: "Knights"
					}
				]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (plan.steps.length !== 2) {
			throw new Error(
				`Expected 2 steps, got ${plan.steps.length}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Select/Where dedup passed" });
	}

	private async testQueryPlannerGroupByDeduplication() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: GroupBy Deduplication" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Plan
		// --------------------------------------------------

		const plan =
			await this.queryPlanner.plan(itemContext, {
				select: ["owner.guild.name"],
				groupBy: "owner.guild.name"
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (plan.steps.length !== 2) {
			throw new Error(
				`Expected 2 steps, got ${plan.steps.length}`
			);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "GroupBy dedup passed" });
	}

	private async testRunnerBatchDeduplication() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Runner Batch Deduplication" });

		await this.ensureField("CoreTest", "Guild", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, { name: "Knights" });

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		const john =
			await this.dataManager.createRecord(characterContext, {
				name: "John",
				guild: guild.id
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Sword",
			owner: bob.id
		});

		await this.dataManager.createRecord(itemContext, {
			name: "Shield",
			owner: john.id
		});

		const results =
			await this.queryManager.query(itemContext, {
				select: ["owner.guild.name"]
			});

		if (results.length !== 2) {
			throw new Error(`Expected 2 results, got ${results.length}`);
		}

		if (results[0].owner?.guild?.name !== "Knights") {
			throw new Error("First result incorrect");
		}

		if (results[1].owner?.guild?.name !== "Knights") {
			throw new Error("Second result incorrect");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Runner Batch Dedup passed" });
	}

	private async testRunnerMultiHopIntegrity() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Runner Multi Hop Integrity" });

		await this.ensureField("CoreTest", "Guild", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Sword",
			owner: bob.id
		});

		const results =
			await this.queryManager.query(itemContext, {
				select: ["owner.guild.name"]
			});

		if (results.length !== 1) {
			throw new Error(`Expected 1 result, got ${results.length}`);
		}

		if (results[0].owner?.guild?.name !== "Knights") {
			throw new Error("Multi-hop failed");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Runner Multi Hop passed" });
	}

	private async testRunnerNoStepFastPath() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Runner No Step Fast Path" });

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		await this.dataManager.createRecord(itemContext, { name: "A" });
		await this.dataManager.createRecord(itemContext, { name: "B" });
		await this.dataManager.createRecord(itemContext, { name: "C" });

		const results =
			await this.queryManager.query(itemContext, {
				offset: 1
			});

		if (results.length !== 2) {
			throw new Error(`Expected 2 results, got ${results.length}`);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Runner No Step Fast Path passed" });
	}

	private async testDeepReferenceTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Deep Reference Traversal" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField("CoreTest", "Guild", "name", "string", "");

		await this.ensureField(
			"CoreTest",
			"Guild",
			"leader",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const leader =
			await this.dataManager.createRecord(characterContext, {
				name: "Guild Leader"
			});

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights",
				leader: leader.id
			});

		const member =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const item =
			await this.dataManager.createRecord(itemContext, {
				name: "Sword",
				owner: member.id
			});

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(itemContext, {
				where: [
					{
						field: "owner.guild.leader.name",
						op: "=",
						value: "Guild Leader"
					}
				]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(`Expected 1 result, got ${results.length}`);
		}

		if (results[0].id !== item.id) {
			throw new Error("Deep traversal returned wrong item");
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Deep Reference Traversal passed" });
	}

	private async testSharedReferenceConsistency() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Shared Reference Consistency" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField("CoreTest", "Guild", "name", "string", "");

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		// 10 items all share same chain
		for (let i = 0; i < 10; i++) {
			await this.dataManager.createRecord(itemContext, {
				name: `Item ${i}`,
				owner: bob.id
			});
		}

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(itemContext, {
				select: [
					"owner.name",
					"owner.guild.name"
				]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (results.length !== 10) {
			throw new Error(`Expected 10 results, got ${results.length}`);
		}

		for (const r of results) {
			if (r.owner.name !== "Bob") {
				throw new Error("Owner mismatch");
			}

			if (r.owner.guild.name !== "Knights") {
				throw new Error("Guild mismatch");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Shared Reference Consistency passed" });
	}

	private async testBatchFanOutTraversal() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Batch Fan-Out Traversal" });

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField("CoreTest", "Guild", "name", "string", "");

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		// --------------------------------------------------
		// Data
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		const john =
			await this.dataManager.createRecord(characterContext, {
				name: "John",
				guild: guild.id
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Sword",
			owner: bob.id
		});

		await this.dataManager.createRecord(itemContext, {
			name: "Shield",
			owner: john.id
		});

		// --------------------------------------------------
		// Query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(itemContext, {
				select: ["owner.guild.name"]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (results.length !== 2) {
			throw new Error(`Expected 2 results, got ${results.length}`);
		}

		for (const r of results) {
			if (r.owner.guild.name !== "Knights") {
				throw new Error("Guild mismatch in fan-out");
			}
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Batch Fan-Out Traversal passed" });
	}

	private async testMissingReferenceFilterBehavior() {

		await this.resetCoreTestData();

		this.logger?.log({ level: "info", scope: "TEST", message: "Test: Missing Reference Filter Behavior" });

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		await this.ensureField("CoreTest", "Guild", "name", "string", "");

		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});

		await this.ensureField("CoreTest", "Item", "name", "string", "");

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Sword",
			owner: bob.id
		});

		// --------------------------------------------------
		// Query (valid path)
		// --------------------------------------------------

		const results =
			await this.queryManager.query(itemContext, {
				where: [
					{
						field: "owner.guild.name",
						op: "=",
						value: "Knights"
					}
				]
			});

		// --------------------------------------------------
		// Assert
		// --------------------------------------------------

		if (results.length !== 1) {
			throw new Error(`Expected 1 result, got ${results.length}`);
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Missing Reference Filter Behavior passed" });
	}

	private async testAggregateManager() {

		this.logger?.log({ level: "info", scope: "TEST", message: "Test Aggregate Manager Suite" });

		try {
			
		}
		catch (e) {
			this.logger?.log({ level: "error", scope: "TEST", message: "Aggregate Manager Tests Failed", data: (e as Error).message });
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Aggregate Manager Tests Completed" });
	}

	private async testReferenceCollectionSchemaRecordValidate() {
		this.logger?.log({ level: "info", scope: "TEST", message: "Test Schema Record Creation" });
		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext = await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob"
			});

		const rick =
			await this.dataManager.createRecord(characterContext, {
				name: "Rick"
			});
			
		await this.dataManager.createRecord(
			guildContext,
			{
				name: "Knights",
				members: [bob.id, rick.id]
			}
		);
		this.logger?.log({ level: "info", scope: "TEST", message: "Test Schema Record Created" });
	}

	private async testReferenceCollectionSchemaValidation() {

		await this.resetCoreTestData();

		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const schema =
			await this.schemaManager.getSchema(
				"CoreTest",
				"Guild"
			);

		const validation =
			this.schemaManager.validateSchema(schema);

		if (!validation.valid) {
			throw new Error(
				"referenceCollection schema should validate"
			);
		}
	}

	private async testReferenceCollectionInvalidDefault() {

		let failed = false;

		try {

			await this.schemaManager.addField(
				"CoreTest",
				"Guild",
				"members",
				"referenceCollection",
				"Bob" // invalid
			);

		} catch {
			failed = true;
		}

		if (!failed) {
			throw new Error(
				"Expected invalid default rejection"
			);
		}
	}

	private async testReferenceCollectionRecordValidation() {

		await this.resetCoreTestData();

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					members: [
						"id1",
						"id2"
					]
				}
			);

		if (!guild) {
			throw new Error(
				"Failed creating referenceCollection record"
			);
		}
	}

	private async buildReferenceCollectionFixture() {

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);


		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);


		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);


		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);


		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob"
				}
			);


		const alice =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice"
				}
			);


		const empty =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Empty",
					members: []
				}
			);


		const single =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Single",
					members: [
						bob.id
					]
				}
			);


		const multiple =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Multiple",
					members: [
						bob.id,
						alice.id
					]
				}
			);


		return {
			guildContext,
			bob,
			alice,
			empty,
			single,
			multiple
		};
	}

	private async testQueryReferenceCollectionSingle() {
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START" });

		const {
			guildContext,
			single,
			bob
		} =
			await this.buildReferenceCollectionFixture();


		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"name",
						"members.name"
					],
					where: [
						{
							field: "name",
							op: "=",
							value: "Single"
						}
					]
				}
			);

		// this.engineLogger.log({ level: "debug", scope: "TEST", message: "results: ", data: results });


		if (results.length !== 1) {
			throw new Error(
				`Expected one guild, got ${results.length}`
			);
		}


		const result = results[0];


		if (result.id !== single.id) {
			throw new Error(
				"Wrong guild returned"
			);
		}

		if (!result.members) {
			throw new Error(
				"Members projection missing"
			);
		}


		if (!result.members.name) {
			throw new Error(
				"Members name projection missing"
			);
		}


		if (!result.members.name.includes("Bob")) {
			throw new Error(
				"Bob was not traversed"
			);
		}

		this.logger?.log({
			level:"info",
			scope:"TEST",
			message:"Query reference collection single passed"
		});
	}

	private async testQueryReferenceCollectionMultiple() {
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Start"});

		const {
			guildContext,
			multiple
		} =
			await this.buildReferenceCollectionFixture();


		const results =
			await this.queryManager.query(
				guildContext,
				{
					select:[
						"name",
						"members.name"
					],
					where:[
						{
							field:"name",
							op:"=",
							value:"Multiple"
						}
					]
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Result", data: results });


		// if (results.length !== 1) {
		// 	throw new Error(
		// 		"Expected multiple guild result"
		// 	);
		// }

		const members =
    		results[0].members?.name;


		if (!members) {
			throw new Error(
				"Members projection missing"
			);
		}

		if (members.length !== 2) {
			throw new Error(
				`Expected 2 members, got ${members.length}`
			);
		}

		if (!members.includes("Bob")) {
			throw new Error(
				"Bob missing"
			);
		}

		if (!members.includes("Alice")) {
			throw new Error(
				"Alice missing"
			);
		}


		this.logger?.log({
			level:"info",
			scope:"TEST",
			message:"Query reference collection multiple passed"
		});
	}

	private async testQueryReferenceCollectionEmpty() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test End"});

		const {
			guildContext,
			empty
		} =
			await this.buildReferenceCollectionFixture();


		const results =
			await this.queryManager.query(
				guildContext,
				{
					select:[
						"name",
						"members.name"
					],
					where:[
						{
							field:"name",
							op:"=",
							value:"Empty"
						}
					]
				}
			);


		// if (results.length !== 1) {
		// 	throw new Error(
		// 		"Empty guild missing"
		// 	);
		// }


		const members =
			results[0].members?.name;


		if (
			members &&
			members.length !== 0
		) {
			throw new Error(
				"Empty collection returned members"
			);
		}


		this.logger?.log({
			level:"info",
			scope:"TEST",
			message:"Query reference collection empty passed"
		});
	}

	private async buildReferenceCollectionQueryFixture() {

		await this.resetCoreTestData();

		// --------------------------------------------------
		// Schema
		// --------------------------------------------------

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"level",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		// --------------------------------------------------
		// Contexts
		// --------------------------------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		// --------------------------------------------------
		// Guilds
		// --------------------------------------------------

		const knights =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights"
				}
			);

		const ninjas =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Ninjas"
				}
			);

		const merchants =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Merchants",
					members: []
				}
			);

		// --------------------------------------------------
		// Characters
		// --------------------------------------------------

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					level: 10,
					guild: knights.id
				}
			);

		const alice =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice",
					level: 20,
					guild: knights.id
				}
			);

		const carl =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Carl",
					level: 30,
					guild: ninjas.id
				}
			);

		// --------------------------------------------------
		// Update guild member collections
		// --------------------------------------------------

		await this.dataManager.update(
			guildContext,
			knights.id,
			{
				members: [
					bob.id,
					alice.id
				]
			}
		);

		await this.dataManager.update(
			guildContext,
			ninjas.id,
			{
				members: [
					carl.id
				]
			}
		);

		return {
			guildContext,
			characterContext,
			knights,
			ninjas,
			merchants,
			bob,
			alice,
			carl
		};
	}

	private async testFilterCollectionEquals() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "=",
							value: "Bob"
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== knights.id) {
			throw new Error(
				"Wrong guild returned"
			);
		}
	}

	private async testFilterCollectionEqualsNoMatch() {

		const {
			guildContext
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "=",
							value: "Zelda"
						}
					]
				}
			);

		if (results.length !== 0) {
			throw new Error(
				`Expected 0 results, got ${results.length}`
			);
		}
	}

	private async testFilterCollectionNotEquals() {

		const {
			guildContext,
			ninjas
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "!=",
							value: "Bob"
						}
					]
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}

		if (
			!results.some(r => r.id === ninjas.id)
		) {
			throw new Error(
				"Ninjas missing"
			);
		}
	}

	private async testFilterCollectionGreaterThan() {

		const {
			guildContext
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.level",
							op: ">",
							value: 15
						}
					]
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}
	}

	private async testFilterCollectionGreaterThanHigh() {

		const {
			guildContext,
			ninjas
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.level",
							op: ">",
							value: 25
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== ninjas.id) {
			throw new Error(
				"Wrong guild returned"
			);
		}
	}

	private async testFilterCollectionContains() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "contains",
							value: "Ali"
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== knights.id) {
			throw new Error(
				"Wrong guild returned"
			);
		}
	}

	private async testFilterCollectionIn() {

		const {
			guildContext
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "in",
							value: [
								"Bob",
								"Carl"
							]
						}
					]
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}
	}

	private async testFilterCollectionExists() {

		const {
			guildContext
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.name",
							op: "exists"
						}
					]
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}
	}

	private async testFilterCollectionEmptyExcluded() {

		const {
			guildContext
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.level",
							op: "exists"
						}
					]
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 populated guilds, got ${results.length}`
			);
		}
	}

	private async testFilterCollectionMultiHop() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					where: [
						{
							field: "members.guild.name",
							op: "=",
							value: "Knights"
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== knights.id) {
			throw new Error(
				"Wrong guild returned"
			);
		}
	}

	private async testProjectionCollectionNames() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"members.name"
					]
				}
			);

		const guild =
			results.find(r => r.id === knights.id);

		if (!guild) {
			throw new Error("Knights missing");
		}

		if (!Array.isArray(guild.members.name)) {
			throw new Error(
				"Expected members.name array"
			);
		}

		if (
			guild.members.name.length !== 2
		) {
			throw new Error(
				`Expected 2 names, got ${guild.members.name.length}`
			);
		}
	}

	private async testProjectionCollectionNumbers() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"members.level"
					]
				}
			);

		const guild =
			results.find(r => r.id === knights.id);

		if (!Array.isArray(guild.members.level)) {
			throw new Error(
				"Expected level array"
			);
		}

		if (
			!guild.members.level.includes(10)
		) {
			throw new Error(
				"Missing level 10"
			);
		}

		if (
			!guild.members.level.includes(20)
		) {
			throw new Error(
				"Missing level 20"
			);
		}
	}

	private async testProjectionCollectionMultipleFields() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"members.name",
						"members.level"
					]
				}
			);

		const guild =
			results.find(r => r.id === knights.id);

		if (!guild?.members) {
			throw new Error(
				"Members missing"
			);
		}

		if (
			!Array.isArray(guild.members.name)
		) {
			throw new Error(
				"Name projection missing"
			);
		}

		if (
			!Array.isArray(guild.members.level)
		) {
			throw new Error(
				"Level projection missing"
			);
		}
	}

	private async testProjectionCollectionMultiHop() {

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"members.guild.name"
					]
				}
			);

		const guild =
			results.find(r => r.id === knights.id);

		if (
			!Array.isArray(
				guild.members.guild.name
			)
		) {
			throw new Error(
				"Expected array"
			);
		}

		if (
			guild.members.guild.name.length !== 2
		) {
			throw new Error(
				"Expected two values"
			);
		}
	}

	private async testProjectionEmptyCollection() {
		// this.engineLogger.log({level: "trace", scope: "TEST", message: "Failing Test Start"});

		const {
			guildContext,
			merchants
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"members.name"
					]
				}
			);

		const guild =
			results.find(r => r.id === merchants.id);

		// this.engineLogger.log({level: "trace", scope: "TEST", message: "Failing Test results", data: { results, guild }});

		if (!guild) {
			throw new Error(
				"Merchants missing"
			);
		}

		if (!Array.isArray(guild.members?.name)) {
			throw new Error("Expected array");
		}

		if (guild.members.name.length !== 0) {
			throw new Error("Expected empty array");
		}
	}

	private async testProjectionMixedFields() {

		// this.engineLogger.log({level: "trace", scope: "TEST", message: "Failing Test End"});

		const {
			guildContext,
			knights
		} = await this.buildReferenceCollectionQueryFixture();

		const results =
			await this.queryManager.query(
				guildContext,
				{
					select: [
						"name",
						"members.name"
					]
				}
			);

		const guild =
			results.find(r => r.id === knights.id);

		if (
			guild.name !== "Knights"
		) {
			throw new Error(
				"Guild name missing"
			);
		}

		if (
			!Array.isArray(
				guild.members.name
			)
		) {
			throw new Error(
				"Member names missing"
			);
		}
	}

	private async buildReferenceCollectionGroupFixture() {
		await this.resetCoreTestData();

		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			"",
			undefined,
			{ ruleset: "CoreTest", schema: "Guild" }
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"level",
			"number",
			0
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					level: 10
				}
			);

		const alice =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice",
					level: 20
				}
			);

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights",
					members: [
						bob.id,
						alice.id
					]
				}
			);
		
		await this.dataManager.update(characterContext, bob.id, { guild: guild.id });
		await this.dataManager.update(characterContext, alice.id, { guild: guild.id });

		return {
			guildContext,
			characterContext,
			guild,
			bob,
			alice
		};
	}

	private async testGroupByCollectionName() {

		const {
			guildContext
		} =
			await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.name",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		const names =
			results.map(x => x.key);

		if (
			!names.includes("Bob") ||
			!names.includes("Alice")
		) {
			throw new Error(
				"Missing member groups"
			);
		}
	}

	private async testGroupByCollectionNumber() {

		const {
			guildContext
		} =
			await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.level",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		const levels =
			results.map(x => x.key);

		if (
			!levels.includes(10) ||
			!levels.includes(20)
		) {
			throw new Error(
				"Missing level groups"
			);
		}
	}

	private async testGroupByEmptyCollection() {

		const {
			guildContext
		} =
			await this.buildReferenceCollectionGroupFixture();

		await this.dataManager.createRecord(
			guildContext,
			{
				name: "Merchants",
				members: []
			}
		);

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.name",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		const merchantGroup =
			results.find(
				x => x.key === "Merchants"
			);

		if (merchantGroup) {
			throw new Error(
				"Empty collection should not create group"
			);
		}
	}

	private async testGroupByCollectionMultiHop() {

		const {
			guildContext
		} =
			await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.guild.name",
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		const group = results[0];

		if (group.key !== "Knights") {
			throw new Error(
				`Expected Knights, got ${group.key}`
			);
		}

		if (group.value !== 1) {
			throw new Error(
				`Expected count 1, got ${group.value}`
			);
		}
	}

	private async testGroupByCollectionDuplicateValues() {

		const {
			guildContext,
			characterContext,
			guild,
			alice
		} =
			await this.buildReferenceCollectionGroupFixture();

		await this.dataManager.update(
			characterContext,
			alice.id,
			{
				level: 10
			}
		);

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.level",
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		const group = results[0];

		if (group.key !== 10) {
			throw new Error(
				`Expected key 10, got ${group.key}`
			);
		}

		if (group.value !== 1) {
			throw new Error(
				`Expected count 1, got ${group.value}`
			);
		}
	}

	private async testAggregateSumReferenceCollection() {
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});

		const {
			guildContext
		} = await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.name",
					aggregate: {
						op: "sum",
						field: "members.level"
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "results: ", data: results });

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 groups, got ${results.length}`
			);
		}

		for (const group of results) {
			if (group.key === "Bob" && group.value !== 10) {
				throw new Error(`Expected Bob sum 10, got ${group.value}`);
			}

			if (group.key === "Alice" && group.value !== 20) {
				throw new Error(`Expected Alice sum 20, got ${group.value}`);
			}
		}
	}

	private async testAggregateSumMultiHopReferenceCollection() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});

		const {
			guildContext
		} = await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.guild.name",
					aggregate: {
						op: "sum",
						field: "members.level"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		const group = results[0];

		if (group.key !== "Knights") {
			throw new Error(
				`Expected Knights, got ${group.key}`
			);
		}

		if (group.value !== 30) {
			throw new Error(
				`Expected sum 30, got ${group.value}`
			);
		}
	}

	private async testAggregateAvgReferenceCollection() {

		const {
			guildContext
		} = await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.name",
					aggregate: {
						op: "avg",
						field: "members.level"
					}
				}
			);


		const bob =
			results.find(r => r.key === "Bob");

		if (!bob) {
			throw new Error("Missing Bob group");
		}

		if (bob.value !== 10) {
			throw new Error(`Expected avg 10, got ${bob.value}`);
		}
	}

	private async testAggregateMinMaxReferenceCollection() {

		const {
			guildContext
		} = await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.guild.name",
					aggregate: {
						op: "max",
						field: "members.level"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error("Expected 1 group");
		}

		if (results[0].value !== 20) {
			throw new Error(`Expected max 20, got ${results[0].value}`);
		}
	}

	private async testAggregateDistinctReferenceCollection() {

		const {
			guildContext
		} = await this.buildReferenceCollectionGroupFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.guild.name",
					aggregate: {
						op: "distinct-values",
						field: "members.name"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		const group = results[0];

		const values = group.value;

		// new Notice(`Distinct values: ${values}`);

		if (!Array.isArray(values)) {
			throw new Error("Expected array from distinct");
		}

		if (values.length !== 2) {
			throw new Error(
				`Expected 2 distinct values, got ${values.length}`
			);
		}

		if (!values.includes("Bob") || !values.includes("Alice")) {
			throw new Error("Missing distinct values");
		}
	}

	private async buildDeepCollectionFixture() {

		await this.resetCoreTestData();

		await this.ensureField(
			"CoreTest",
			"Guild",
			"members",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"guild",
			"reference",
			"",
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Guild"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"items",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Item"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Guild",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"power",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"type",
			"string",
			""
		);

		const guildContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Guild"
			);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const sword =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Sword",
					power: 10,
					type: "Weapon"
				}
			);

		const shield =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Shield",
					power: 20,
					type: "Armor"
				}
			);

		const wand =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Wand",
					power: 30,
					type: "Weapon"
				}
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob",
					items: [
						sword.id,
						shield.id
					]
				}
			);

		const alice =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice",
					items: [
						wand.id
					]
				}
			);

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights",
					members: [
						bob.id,
						alice.id
					]
				}
			);

		await this.dataManager.update(
			characterContext,
			bob.id,
			{
				guild: guild.id
			}
		);

		await this.dataManager.update(
			characterContext,
			alice.id,
			{
				guild: guild.id
			}
		);

		return {
			guildContext,
			characterContext,
			itemContext,
			guild,
			bob,
			alice,
			sword,
			shield,
			wand
		};
	}

	private async testAggregateSumDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].value !== 60) {
			throw new Error(
				`Expected sum 60, got ${results[0].value}`
			);
		}
	}

	private async testCountDeepCollectionMatches() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "count-matches",
						field: "members.items.name"
					}
				}
			);

		if (results[0].value !== 3) {
			throw new Error(
				`Expected 3 matches, got ${results[0].value}`
			);
		}
	}

	private async testGroupByDeepCollectionType() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.type",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		const weapon =
			results.find(
				x => x.key === "Weapon"
			);

		const armor =
			results.find(
				x => x.key === "Armor"
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "results: ", data: { results, weapon, armor } });

		if (!weapon || weapon.value !== 2) {
			throw new Error(
				"Weapon count incorrect"
			);
		}

		if (!armor || armor.value !== 1) {
			throw new Error(
				"Armor count incorrect"
			);
		}
	}

	private async testDistinctValuesDeepCollection() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "distinct-values",
						field: "members.items.type"
					}
				}
			);

		const values = results[0].value;

		if (!Array.isArray(values)) {
			throw new Error(
				"Expected array"
			);
		}

		if (
			!values.includes("Weapon") ||
			!values.includes("Armor")
		) {
			throw new Error(
				"Distinct values missing"
			);
		}
	}

	private async testAggregateAvgDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "avg",
						field: "members.items.power"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		// (10 + 20 + 30) / 3 = 20

		if (results[0].value !== 20) {
			throw new Error(
				`Expected avg 20, got ${results[0].value}`
			);
		}
	}

	private async testAggregateMinDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "min",
						field: "members.items.power"
					}
				}
			);

		if (results[0].value !== 10) {
			throw new Error(
				`Expected min 10, got ${results[0].value}`
			);
		}
	}

	private async testAggregateMaxDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "max",
						field: "members.items.power"
					}
				}
			);

		if (results[0].value !== 30) {
			throw new Error(
				`Expected max 30, got ${results[0].value}`
			);
		}
	}

	private async testAggregateDistinctCountDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "distinct-count",
						field: "members.items.type"
					}
				}
			);

		if (results[0].value !== 2) {
			throw new Error(
				`Expected 2 distinct values, got ${results[0].value}`
			);
		}
	}

	private async testGroupByDeepCollectionTypeNew() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.type",
					aggregate: {
						op: "count-matches"
					}
				}
			);

		const weapon =
				results.find(
					r => r.key === "Weapon"
				);

		const armor =
				results.find(
					r => r.key === "Armor"
				);

		if (!weapon) {
			throw new Error(
				"Missing Weapon group"
			);
		}

		if (!armor) {
			throw new Error(
				"Missing Armor group"
			);
		}

		if (weapon.value !== 2) {
			throw new Error(
				`Expected Weapon count 2, got ${weapon.value}`
			);
		}

		if (armor.value !== 1) {
			throw new Error(
				`Expected Armor count 1, got ${armor.value}`
			);
		}
	}

	private async testGroupByCharacterNameDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		const bob =
				results.find(
					r => r.key === "Bob"
				);

		const alice =
				results.find(
					r => r.key === "Alice"
				);

		if (!bob || bob.value !== 30) {
			throw new Error(
				`Expected Bob sum 30, got ${bob?.value}`
			);
		}

		if (!alice || alice.value !== 30) {
			throw new Error(
				`Expected Alice sum 30, got ${alice?.value}`
			);
		}
	}

	private async testAggregateCountRootsDeepCollection() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.type",
					aggregate: {
						op: "count-roots"
					}
				}
			);

		const weapon =
				results.find(
					r => r.key === "Weapon"
				);

		if (!weapon) {
			throw new Error(
				"Missing Weapon group"
			);
		}

		// Both weapon items originate
		// from the same guild root.

		if (weapon.value !== 1) {
			throw new Error(
				`Expected 1 root, got ${weapon.value}`
			);
		}
	}

	private async buildSharedItemFixture() {

		const {
			guildContext,
			characterContext,
			itemContext,
			sword,
			bob,
			alice,
			guild
		} =
			await this.buildDeepCollectionFixture();

		await this.dataManager.update(
			itemContext,
			sword.id,
			{
				name: "Sword",
				power: 10,
				type: "Weapon"
			}
		);

		await this.dataManager.update(
			characterContext,
			bob.id,
			{
				name: "Bob",
				items: [sword.id]
			}
		);

		await this.dataManager.update(
			characterContext,
			alice.id,
			{
				name: "Alice",
				items: [sword.id]
				}
			);

		return {
			guildContext,
			guild,
			bob,
			alice,
			sword
		};
	}

	private async testSharedItemCountMatches() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "count-matches",
						field: "members.items.name"
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "results: ", data: { results } });

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				`Expected Knights group, got ${results[0].key}`
			);
		}

		if (results[0].value !== 2) {
			throw new Error(
				`Expected 2 matches, got ${results[0].value}`
			);
		}
	}

	private async testGroupByDeepSharedItemName() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.name",
					aggregate: {
						op: "count-matches",
						field: "members.items.name"
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "results: ", data: { results } });

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Sword") {
			throw new Error(
				`Expected Sword group, got ${results[0].key}`
			);
		}

		if (results[0].value !== 2) {
			throw new Error(
				`Expected 2 matches, got ${results[0].value}`
			);
		}
	}

	private async testSharedItemSumCountsSeparatePaths() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST START"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "results: ", data: { results } });

		if (results[0].value !== 20) {

			throw new Error(
				`Expected sum 20, got ${results[0].value}`
			);
		}
	}

	private async testSharedItemDistinctValues() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "FAILING TEST END"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "distinct-values",
						field: "members.items.name"
					}
				}
			);

		const values = results[0].value;

		if (values.length !== 1) {

			throw new Error(
				`Expected 1 value, got ${values.length}`
			);
		}
	}

	private async testSharedItemCountRoots() {

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.type",
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results[0].value !== 1) {

			throw new Error(
				`Expected 1 root, got ${results[0].value}`
			);
		}
	}

	private async testWhereDeepCollectionTypePositive() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					where: [
						{
							field: "members.items.type",
							op: "=",
							value: "Armor"
						}
					],
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Knights") {
			throw new Error(
				`Expected Knights, got ${results[0].key}`
			);
		}
	}

	private async testWhereDeepCollectionTypeNegative() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					where: [
						{
							field: "members.items.type",
							op: "=",
							value: "Potion"
						}
					],
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results.length !== 0) {
			throw new Error(
				`Expected 0 groups, got ${results.length}`
			);
		}
	}

	private async testHavingDeepCollectionSumPositive() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					},
					having: [
						{
							field: "value",
							op: ">",
							value: 50
						}
					]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].value !== 60) {
			throw new Error(
				`Expected sum 60, got ${results[0].value}`
			);
		}
	}

	private async testHavingDeepCollectionSumNegative() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					},
					having: [
						{
							field: "value",
							op: ">",
							value: 100
						}
					]
				}
			);

		if (results.length !== 0) {
			throw new Error(
				`Expected 0 groups, got ${results.length}`
			);
		}
	}

	private async testWhereSharedReferenceItem() {
		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Start"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					where: [
						{
							field: "members.items.name",
							op: "=",
							value: "Sword"
						}
					],
					aggregate: {
						op: "count-matches"
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Results", data: results });

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].value !== 2) {
			throw new Error(
				`Expected 2 matches, got ${results[0].value}`
			);
		}
	}

	private async testGroupBySharedReferenceName() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test End"});

		const {
			guildContext
		} =
			await this.buildSharedItemFixture();

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "members.items.name",
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 group, got ${results.length}`
			);
		}

		if (results[0].key !== "Sword") {
			throw new Error(
				`Expected Sword, got ${results[0].key}`
			);
		}

		if (results[0].value !== 1) {
			throw new Error(
				`Expected 1 root, got ${results[0].value}`
			);
		}
	}

	private async testReferenceCollectionManager() {

		this.logger?.log({
			level: "info",
			scope: "TEST",
			message: "Reference Collection Manager Test Suite"
		});


		try {

			await this.safeRun(
				"Reference Collection Schema Record Validate",
				() => this.testReferenceCollectionSchemaRecordValidate()
			);


			await this.safeRun(
				"Reference Collection Schema Validation",
				() => this.testReferenceCollectionSchemaValidation()
			);


			await this.safeRun(
				"Reference Collection Invalid Default",
				() => this.testReferenceCollectionInvalidDefault()
			);


			await this.safeRun(
				"Reference Collection Record Validation",
				() => this.testReferenceCollectionRecordValidation()
			);



			// ------------------------------------
			// Traversal / Query
			// ------------------------------------

			await this.safeRun(
				"Query Reference Collection Single",
				() => this.testQueryReferenceCollectionSingle()
			);


			await this.safeRun(
				"Query Reference Collection Multiple",
				() => this.testQueryReferenceCollectionMultiple()
			);


			await this.safeRun(
				"Query Reference Collection Empty",
				() => this.testQueryReferenceCollectionEmpty()
			);



			// ------------------------------------
			// Filters
			// ------------------------------------

			await this.safeRun(
				"Filter Collection Equals",
				() => this.testFilterCollectionEquals()
			);


			await this.safeRun(
				"Filter Collection Equals No Match",
				() => this.testFilterCollectionEqualsNoMatch()
			);


			await this.safeRun(
				"Filter Collection Not Equals",
				() => this.testFilterCollectionNotEquals()
			);


			await this.safeRun(
				"Filter Collection Greater Than",
				() => this.testFilterCollectionGreaterThan()
			);


			await this.safeRun(
				"Filter Collection Greater Than High",
				() => this.testFilterCollectionGreaterThanHigh()
			);


			await this.safeRun(
				"Filter Collection Contains",
				() => this.testFilterCollectionContains()
			);


			await this.safeRun(
				"Filter Collection In",
				() => this.testFilterCollectionIn()
			);


			await this.safeRun(
				"Filter Collection Exists",
				() => this.testFilterCollectionExists()
			);


			await this.safeRun(
				"Filter Collection Empty Excluded",
				() => this.testFilterCollectionEmptyExcluded()
			);


			await this.safeRun(
				"Filter Collection Multi Hop",
				() => this.testFilterCollectionMultiHop()
			);



			// ------------------------------------
			// Projection
			// ------------------------------------

			await this.safeRun(
				"Projection Collection Names",
				() => this.testProjectionCollectionNames()
			);


			await this.safeRun(
				"Projection Collection Numbers",
				() => this.testProjectionCollectionNumbers()
			);


			await this.safeRun(
				"Projection Collection Multiple Fields",
				() => this.testProjectionCollectionMultipleFields()
			);


			await this.safeRun(
				"Projection Collection Multi Hop",
				() => this.testProjectionCollectionMultiHop()
			);


			await this.safeRun(
				"Projection Empty Collection",
				() => this.testProjectionEmptyCollection()
			);


			await this.safeRun(
				"Projection Mixed Fields",
				() => this.testProjectionMixedFields()
			);



			// ------------------------------------
			// Grouping
			// ------------------------------------

			await this.safeRun(
				"Group By Collection Name",
				() => this.testGroupByCollectionName()
			);


			await this.safeRun(
				"Group By Collection Number",
				() => this.testGroupByCollectionNumber()
			);


			await this.safeRun(
				"Group By Empty Collection",
				() => this.testGroupByEmptyCollection()
			);


			await this.safeRun(
				"Group By Collection Multi Hop",
				() => this.testGroupByCollectionMultiHop()
			);


			await this.safeRun(
				"Group By Collection Duplicate Values",
				() => this.testGroupByCollectionDuplicateValues()
			);



			// ------------------------------------
			// Aggregates
			// ------------------------------------

			await this.safeRun(
				"Aggregate Sum Reference Collection",
				() => this.testAggregateSumReferenceCollection()
			);


			await this.safeRun(
				"Aggregate Sum Multi Hop Reference Collection",
				() => this.testAggregateSumMultiHopReferenceCollection()
			);


			await this.safeRun(
				"Aggregate Average Reference Collection",
				() => this.testAggregateAvgReferenceCollection()
			);


			await this.safeRun(
				"Aggregate Min Max Reference Collection",
				() => this.testAggregateMinMaxReferenceCollection()
			);


			await this.safeRun(
				"Aggregate Distinct Reference Collection",
				() => this.testAggregateDistinctReferenceCollection()
			);



			// ------------------------------------
			// Deep Collection
			// ------------------------------------

			await this.safeRun(
				"Aggregate Sum Deep Collection",
				() => this.testAggregateSumDeepCollection()
			);


			await this.safeRun(
				"Count Matches Deep Collection",
				() => this.testCountDeepCollectionMatches()
			);


			await this.safeRun(
				"Group By Deep Collection Type",
				() => this.testGroupByDeepCollectionType()
			);


			await this.safeRun(
				"Distinct Values Deep Collection",
				() => this.testDistinctValuesDeepCollection()
			);


			await this.safeRun(
				"Aggregate Average Deep Collection",
				() => this.testAggregateAvgDeepCollection()
			);


			await this.safeRun(
				"Aggregate Min Deep Collection",
				() => this.testAggregateMinDeepCollection()
			);


			await this.safeRun(
				"Aggregate Max Deep Collection",
				() => this.testAggregateMaxDeepCollection()
			);


			await this.safeRun(
				"Aggregate Distinct Count Deep Collection",
				() => this.testAggregateDistinctCountDeepCollection()
			);


			await this.safeRun(
				"Group By Deep Collection Type New",
				() => this.testGroupByDeepCollectionTypeNew()
			);


			await this.safeRun(
				"Group By Character Name Deep Collection",
				() => this.testGroupByCharacterNameDeepCollection()
			);


			await this.safeRun(
				"Aggregate Count Roots Deep Collection",
				() => this.testAggregateCountRootsDeepCollection()
			);



			// ------------------------------------
			// Shared References
			// ------------------------------------

			await this.safeRun(
				"Shared Item Count Matches",
				() => this.testSharedItemCountMatches()
			);


			await this.safeRun(
				"Group By Shared Item Name",
				() => this.testGroupByDeepSharedItemName()
			);


			await this.safeRun(
				"Shared Item Sum Counts Separate Paths",
				() => this.testSharedItemSumCountsSeparatePaths()
			);


			await this.safeRun(
				"Shared Item Distinct Values",
				() => this.testSharedItemDistinctValues()
			);


			await this.safeRun(
				"Shared Item Count Roots",
				() => this.testSharedItemCountRoots()
			);



			// ------------------------------------
			// Where / Having
			// ------------------------------------

			await this.safeRun(
				"Where Deep Collection Type Positive",
				() => this.testWhereDeepCollectionTypePositive()
			);


			await this.safeRun(
				"Where Deep Collection Type Negative",
				() => this.testWhereDeepCollectionTypeNegative()
			);


			await this.safeRun(
				"Having Deep Collection Sum Positive",
				() => this.testHavingDeepCollectionSumPositive()
			);


			await this.safeRun(
				"Having Deep Collection Sum Negative",
				() => this.testHavingDeepCollectionSumNegative()
			);


			await this.safeRun(
				"Where Shared Reference Item",
				() => this.testWhereSharedReferenceItem()
			);


			await this.safeRun(
				"Group By Shared Reference Name",
				() => this.testGroupBySharedReferenceName()
			);


		}
		catch (e) {

			this.logger?.log({
				level:"error",
				scope:"TEST",
				message:"Reference Collection Manager Suite Failed",
				data:(e as Error).message
			});
		}


		this.logger?.log({
			level:"info",
			scope:"TEST",
			message:"Reference Collection Manager Test Suite Completed"
		});
	}

	private async testMutationDeepCollectionSet() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Start"});

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 5
					}
				}
			);

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test Results", data: { result }});

		if (result.errors.length > 0) {
			throw new Error(
				`Mutation errors: ${JSON.stringify(result.errors, null, 2)}`
			);
		}

		if (result.updated !== 3) {
			throw new Error(
				`Expected 3 item updates, got ${result.updated}`
			);
		}

		const itemContext = await this.contextFactory.getSchemaContext("CoreTest", "Item");
		const items = await this.dataManager.getAll(itemContext);

		// reload data
		const guild =
			await this.dataManager.getById(guildContext, result.rootId ?? "");

		// we cannot rely on rootId → verify via aggregate

		const check =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test 2nd Results", data: { itemContext, items, guild, check }});

		if (check[0].value !== 15) {
			throw new Error(
				`Expected mutated sum 15, got ${check[0].value}`
			);
		}
	}

	private async testMutationDeepCollectionAdd() {

		// this.engineLogger.log({ level: "trace", scope: "TEST", message: "Failing Test End"});

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		await this.mutationExecutor.execute(
			guildContext,
			{
				select: "members.items.power",
				operation: {
					type: "math",
					op: "add",
					value: 2
				}
			}
		);

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (results[0].value !== 66) {
			throw new Error(
				`Expected 66 after +2 mutation, got ${results[0].value}`
			);
		}
	}

	private async testMutationNoDuplicates() {

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 1
					}
				}
			);

		// There are 3 items total:
		// sword, shield, wand

		if (result.updated !== 3) {
			throw new Error(
				`Expected 3 unique item mutations, got ${result.updated}`
			);
		}
	}

	private async testMutationMissingPath() {

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.nonexistent.value",
					operation: {
						type: "set",
						value: 123
					}
				}
			);

		if (result.errors.length === 0) {
			throw new Error("Expected mutation errors for invalid path");
		}
	}

	private async testMutationFanOutCorrectness() {

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 1
					}
				}
			);

		// 3 items total (Sword, Shield, Wand)
		if (result.updated !== 3) {
			throw new Error(
				`Expected 3 mutations, got ${result.updated}`
			);
		}

		const check =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (check[0].value !== 3) {
			throw new Error(
				`Expected sum 3, got ${check[0].value}`
			);
		}
	}

	private async testMutationDeepAddPropagation() {

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		await this.mutationExecutor.execute(
			guildContext,
			{
				select: "members.items.power",
				operation: {
					type: "math",
					op: "add",
					value: 2
				}
			}
		);

		const results =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		// 10+20+30 = 60 → +2 each item = +6 → 66
		if (results[0].value !== 66) {
			throw new Error(
				`Expected 66, got ${results[0].value}`
			);
		}
	}

	private async testMutationIdempotencyBehavior() {

		const { guildContext } =
			await this.buildDeepCollectionFixture();

		await this.mutationExecutor.execute(
			guildContext,
			{
				select: "members.items.power",
				operation: {
					type: "set",
					value: 5
				}
			}
		);

		await this.mutationExecutor.execute(
			guildContext,
			{
				select: "members.items.power",
				operation: {
					type: "set",
					value: 5
				}
			}
		);

		const result =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		// still 15
		if (result[0].value !== 15) {
			throw new Error(
				`Expected idempotent result 15, got ${result[0].value}`
			);
		}
	}

	private async testMutationPartialTraversalFailure() {

		const { guildContext, bob } =
			await this.buildDeepCollectionFixture();

		// break one character's items
		await this.dataManager.update(
			await this.contextFactory.getSchemaContext("CoreTest", "Character"),
			bob.id,
			{ items: [] }
		);

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 9
					}
				}
			);

		// should still succeed partially (Alice + Wand only = 1 update)
		if (result.updated !== 1) {
			throw new Error(
				`Expected 1 valid mutation, got ${result.updated}`
			);
		}
	}

	private async testMutationCrossRecordIsolation() {

		const {
			guildContext,
			characterContext,
			itemContext,
			guild,
			bob,
			alice,
			sword,
			shield,
			wand
		} = await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 99
					}
				}
			);

		if (result.updated !== 3) {
			throw new Error(
				`Expected 3 updates, got ${result.updated}`
			);
		}

		// Characters should remain unchanged

		const bobCheck =
			await this.dataManager.getById(
				characterContext,
				bob.id
			);

		const aliceCheck =
			await this.dataManager.getById(
				characterContext,
				alice.id
			);

		if (bobCheck.data.items.length !== 2) {
			throw new Error(
				"Bob item references were modified"
			);
		}

		if (aliceCheck.data.items.length !== 1) {
			throw new Error(
				"Alice item references were modified"
			);
		}

		// Guild should remain unchanged

		const guildCheck =
			await this.dataManager.getById(
				guildContext,
				result.rootId ?? guild.id
			);

		if (guildCheck.data.members.length !== 2) {
			throw new Error(
				"Guild member references were modified"
			);
		}

		// Items should actually be changed

		const swordCheck =
			await this.dataManager.getById(
				itemContext,
				sword.id
			);

		const shieldCheck =
			await this.dataManager.getById(
				itemContext,
				shield.id
			);

		const wandCheck =
			await this.dataManager.getById(
				itemContext,
				wand.id
			);

		if (
			swordCheck.data.power !== 99 ||
			shieldCheck.data.power !== 99 ||
			wandCheck.data.power !== 99
		) {
			throw new Error(
				"Item mutations were not applied"
			);
		}
	}

	private async testMutationPartialPathFailure() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.nonexistent.value",
					operation: {
						type: "set",
						value: 123
					}
				}
			);

		if (result.updated !== 0) {
			throw new Error(
				`Expected 0 updates on invalid path, got ${result.updated}`
			);
		}

		if (result.errors.length === 0) {
			throw new Error(
				"Expected validation or execution errors"
			);
		}

		// verify original values unchanged via aggregate
		const check =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (check[0].value !== 60) {
			throw new Error(
				`Expected unchanged sum 60, got ${check[0].value}`
			);
		}
	}

	private async testMutationDeterministicSinglePass() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "math",
						op: "add",
						value: 1
					}
				}
			);

		const final =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (final[0].value !== 63) {
			throw new Error(
				`Expected deterministic +1 twice => 63, got ${final[0].value}`
			);
		}

		// run same mutation again
		const result2 =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "math",
						op: "add",
						value: 1
					}
				}
			);

		if (result.updated !== 3) {
			throw new Error(
				`First run expected 3 updates, got ${result.updated}`
			);
		}

		if (result2.updated !== 3) {
			throw new Error(
				`Second run expected 3 updates, got ${result2.updated}`
			);
		}

		const final2 =
			await this.queryManager.queryGroup(
				guildContext,
				{
					groupBy: "name",
					aggregate: {
						op: "sum",
						field: "members.items.power"
					}
				}
			);

		if (final2[0].value !== 66) {
			throw new Error(
				`Expected deterministic +1 twice => 66, got ${final2[0].value}`
			);
		}
	}

	private async testMutationReadOnlyField() {

		//this.engineLogger?.log({ level: "debug", scope: "Engine.Test", message: "Mutation Read Only Start" });

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		await this.schemaManager.updateField(
			"CoreTest",
			"Item",
			"power",
			{ capability: "readOnly" }
		);

		const newGuildContext = await this.contextFactory.getSchemaContext("CoreTest", "Guild");
		const newItemContext = await this.contextFactory.getSchemaContext("CoreTest", "Item");

		//this.engineLogger?.log({ level: "debug", scope: "Engine.Test", message: "Mutation Read Only Context Refresh", data: { guildContext, newGuildContext, newItemContext } });

		const result =
			await this.mutationExecutor.execute(
				newGuildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		//this.engineLogger?.log({ level: "debug", scope: "Engine.Test", message: "Mutation Read Only Finish", data: result });

		if (result.updated !== 0) {
			throw new Error(
				`Expected 0 updates, got ${result.updated}`
			);
		}

		if (result.errors.length === 0) {
			throw new Error(
				"Expected validation error"
			);
		}
	}

	private async testMutationDerivedField() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		await this.schemaManager.updateField(
			"CoreTest",
			"Item",
			"power",
			{ capability: "derived" }
		);

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		if (result.updated !== 0) {
			throw new Error(
				`Expected 0 updates, got ${result.updated}`
			);
		}

		if (result.errors.length === 0) {
			throw new Error(
				"Expected validation error"
			);
		}
	}

	private async testMutationComputedField() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		await this.schemaManager.updateField(
			"CoreTest",
			"Item",
			"power",
			{ capability: "computed" }
		);

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		if (result.updated !== 0) {
			throw new Error(
				`Expected 0 updates, got ${result.updated}`
			);
		}

		if (result.errors.length === 0) {
			throw new Error(
				"Expected validation error"
			);
		}
	}

	private async testMutationMutableField() {

		const {
			guildContext
		} = await this.buildDeepCollectionFixture();

		const result =
			await this.mutationExecutor.execute(
				guildContext,
				{
					select: "members.items.power",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		if (result.updated !== 3) {
			throw new Error(
				`Expected 3 updates, got ${result.updated}`
			);
		}

		if (result.errors.length !== 0) {
			throw new Error(
				"Did not expect validation errors"
			);
		}
	}

	private async buildDeepObjectFixture() {

		await this.resetCoreTestData();

		// ---------------------------------
		// CHARACTER CORE
		// ---------------------------------

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		// ---------------------------------
		// DEEP OBJECT STRUCTURE
		// ---------------------------------

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats",
			"object",
			{}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats.attributes",
			"object",
			{}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats.attributes.strength",
			"object",
			{}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats.attributes.strength.value",
			"number",
			10
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats.attributes.agility",
			"object",
			{}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"stats.attributes.agility.value",
			"number",
			5
		);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		this.engineLogger.log({ level: "info", scope: "TEST", message: "Deep Deep Test Fixture: Context", data: { characterContext }});

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Hero",
					stats: {
						attributes: {
							strength: {
								value: 10
							},
							agility: {
								value: 5
							}
						}
					}
				}
			);

		this.engineLogger.log({ level: "info", scope: "TEST", message: "Deep Deep Test Fixture: Character", data: { character }});

		return {
			characterContext,
			character
		};
	}

	private async testDeepObjectMutation() {

		this.engineLogger.log({ level: "debug", scope: "TEST", message: "Deep Object Mutation Start"});

		const { characterContext, character } =
			await this.buildDeepObjectFixture();

		const result =
			await this.mutationExecutor.execute(
				characterContext,
				{
					select: "stats.attributes.strength.value",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		if (result.errors.length > 0) {
			throw new Error(JSON.stringify(result.errors));
		}

		this.engineLogger.log({ level: "debug", scope: "TEST", message: "Deep Object Mutation result:", data: { result } });

		const updated =
			await this.dataManager.getById(characterContext, character.id);

		this.engineLogger.log({ level: "debug", scope: "TEST", message: "Deep Object Mutation end", data: { updated } });

		if (updated.data.stats.attributes.strength.value !== 999) {
			throw new Error("Strength not updated correctly");
		}

		if (updated.data.stats.attributes.agility.value !== 5) {
			throw new Error("Sibling field corrupted");
		}
	}

	private async testMissingIntermediateObject() {

		const { characterContext, character } =
			await this.buildDeepObjectFixture();

		const result =
			await this.mutationExecutor.execute(
				characterContext,
				{
					select: "stats.attributes.intelligence.value",
					operation: {
						type: "set",
						value: 123
					}
				}
			);

		// must not crash
		if (!result) {
			throw new Error("Mutation returned undefined");
		}

		// enforce deterministic behavior
		if (result.errors.length === 0) {

			const updated =
				await this.dataManager.getById(characterContext, character.id);

			const value =
				updated.data.stats?.attributes?.intelligence?.value;

			if (value !== 123) {
				throw new Error("Expected auto-create behavior failed");
			}
		}
	}

	private async MutationTestSuite() {
		this.logger?.log({ level: "info", scope: "TEST", message: "Mutation Test Suite" });

		try {
			await this.safeRun(
				"Mutation Deep Collection Set",
				() => this.testMutationDeepCollectionSet()
			);

			await this.safeRun(
				"Mutation Deep Collection Add",
				() => this.testMutationDeepCollectionAdd()
			);

			await this.safeRun(
				"Mutation No Duplicates",
				() => this.testMutationNoDuplicates()
			);

			await this.safeRun(
				"Mutation Missing Path",
				() => this.testMutationMissingPath()
			);

			await this.safeRun(
				"Mutation Fan Out Correctness",
				() => this.testMutationFanOutCorrectness()
			);

			await this.safeRun(
				"Mutation Deep Add Propagation",
				() => this.testMutationDeepAddPropagation()
			);

			await this.safeRun(
				"Mutation Idempotency Behavior",
				() => this.testMutationIdempotencyBehavior()
			);

			await this.safeRun(
				"Mutation Partial Traversal Failure",
				() => this.testMutationPartialTraversalFailure()
			);

			await this.safeRun(
				"Mutation Cross-Record Isolation",
				() => this.testMutationCrossRecordIsolation()
			);

			await this.safeRun(
				"Mutation Partial Path Failure",
				() => this.testMutationPartialPathFailure()
			);

			await this.safeRun(
				"Mutation Deterministic Single Pass",
				() => this.testMutationDeterministicSinglePass()
			);

			await this.safeRun(
				"Mutation Read Only Field",
				() => this.testMutationReadOnlyField()
			);

			await this.safeRun(
				"Mutation Derived Field",
				() => this.testMutationDerivedField()
			);

			await this.safeRun(
				"Mutation Computed Field",
				() => this.testMutationComputedField()
			);

			await this.safeRun(
				"Mutation Mutable Field",
				() => this.testMutationMutableField()
			);
		}
		catch (e) {
			this.logger?.log({ level: "error", scope: "TEST", message: "Mutation Tests Failed", data: (e as Error).message });
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Mutation Test Suite Completed" });
	}

	private async createAggregateQueryFixture() {

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"type",
			"string",
			""
		);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const items = [];

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Sword",
					damage: 10,
					type: "weapon"
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Axe",
					damage: 20,
					type: "weapon"
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Bow",
					damage: 30,
					type: "weapon"
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Helmet",
					damage: 20,
					type: "armor"
				}
			)
		);

		items.push(
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Shield",
					damage: 0,
					type: "armor"
				}
			)
		);

		return {
			itemContext,
			items
		};
	}

	private async testAggregateSum() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "sum",
						field: "damage"
					}
				}
			);

		if (result !== 80) {
			throw new Error(
				`Expected sum 80, got ${result}`
			);
		}
	}

	private async testAggregateAvg() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "avg",
						field: "damage"
					}
				}
			);

		if (result !== 16) {
			throw new Error(
				`Expected avg 16, got ${result}`
			);
		}
	}

	private async testAggregateMin() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "min",
						field: "damage"
					}
				}
			);

		if (result !== 0) {
			throw new Error(
				`Expected min 0, got ${result}`
			);
		}
	}

	private async testAggregateMax() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "max",
						field: "damage"
					}
				}
			);

		if (result !== 30) {
			throw new Error(
				`Expected max 30, got ${result}`
			);
		}
	}

	private async testAggregateCountRoot() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "count-roots"
					}
				}
			);

		if (result !== 5) {
			throw new Error(
				`Expected countRoot 5, got ${result}`
			);
		}
	}

	private async testAggregateCountMatch() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "count-matches"
					}
				}
			);

		if (result !== 5) {
			throw new Error(
				`Expected countMatch 5, got ${result}`
			);
		}
	}

	private async testAggregateDistinctCount() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "distinct-count",
						field: "damage"
					}
				}
			);

		if (result !== 4) {
			throw new Error(
				`Expected distinctCount 4, got ${result}`
			);
		}
	}

	private async testAggregateDistinctValues() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					aggregate: {
						op: "distinct-values",
						field: "damage"
					}
				}
			);

		const actual =
			[...result].sort((a, b) => a - b);

		const expected =
			[0, 10, 20, 30];

		if (
			JSON.stringify(actual) !==
			JSON.stringify(expected)
		) {
			throw new Error(
				`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
			);
		}
	}

	private async testGroupedAggregateSum() {

		await this.resetCoreTestData();

		const { itemContext } =
			await this.createAggregateQueryFixture();

		const groups =
			await this.queryManager.queryGroup(
				itemContext,
				{
					groupBy: "type",
					aggregate: {
						op: "sum",
						field: "damage"
					}
				}
			);

		const weapon =
			groups.find(g => g.key === "weapon");

		const armor =
			groups.find(g => g.key === "armor");

		if (!weapon || weapon.value !== 60) {
			throw new Error(
				`Expected weapon sum 60`
			);
		}

		if (!armor || armor.value !== 20) {
			throw new Error(
				`Expected armor sum 20`
			);
		}
	}

	private async testReferenceAggregateSum() {

		await this.resetCoreTestData();

		const {
			itemContext,
			bob
		} =
			await this.createItemQueryFixture();

		const result =
			await this.queryManager.queryAggregate(
				itemContext,
				{
					where: [
						{
							field: "owner",
							op: "=",
							value: bob.id
						}
					],
					aggregate: {
						op: "sum",
						field: "damage"
					}
				}
			);

		if (result !== 15) {
			throw new Error(
				`Expected 15, got ${result}`
			);
		}
	}

	private async aggregationTestSuite() {
		this.logger?.log({ level: "info", scope: "TEST", message: "Aggregation Test Suite" });

		try {
			await this.safeRun(
				"Aggregate Sum",
				() => this.testAggregateSum()
			);

			await this.safeRun(
				"Aggregate Avg",
				() => this.testAggregateAvg()
			);

			await this.safeRun(
				"Aggregate Min",
				() => this.testAggregateMin()
			);

			await this.safeRun(
				"Aggregate Max",
				() => this.testAggregateMax()
			);

			await this.safeRun(
				"Aggregate Count Root",
				() => this.testAggregateCountRoot()
			);

			await this.safeRun(
				"Aggregate Count Match",
				() => this.testAggregateCountMatch()
			);

			await this.safeRun(
				"Aggregate Distinct Count",
				() => this.testAggregateDistinctCount()
			);

			await this.safeRun(
				"Aggregate Distinct Values",
				() => this.testAggregateDistinctValues()
			);

			await this.safeRun(
				"Aggregate Grouped Sum",
				() => this.testGroupedAggregateSum()
			);

			await this.safeRun(
				"Aggregate Reference Sum",
				() => this.testReferenceAggregateSum()
			);
		}
		catch (e) {
			this.logger?.log({ level: "error", scope: "TEST", message: "Aggregation Tests Failed", data: (e as Error).message });
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Aggregation Test Suite Completed" });
	}

	private async buildGraphEdgeCaseFixture() {

		await this.ensureField(
			"CoreTest",
			"Character",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"friend",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Character",
			"items",
			"referenceCollection",
			[],
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Item"
			}
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"power",
			"number",
			0
		);

		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{
				ruleset: "CoreTest",
				schema: "Character"
			}
		);

		const characterContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const bob =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob"
				}
			);

		const alice =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice"
				}
			);

		const sharedSword =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Shared Sword",
					power: 10
				}
			);

		await this.dataManager.update(
			characterContext,
			bob.id,
			{
				items: [sharedSword.id]
			}
		);

		await this.dataManager.update(
			characterContext,
			alice.id,
			{
				items: [sharedSword.id]
			}
		);

		const loopA =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "LoopA"
				}
			);

		const loopB =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "LoopB"
				}
			);

		await this.dataManager.update(
			characterContext,
			loopA.id,
			{
				friend: loopB.id
			}
		);

		await this.dataManager.update(
			characterContext,
			loopB.id,
			{
				friend: loopA.id
			}
		);

		const brokenItem =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Broken Item",
					owner: "dead-id"
				}
			);

		return {
			characterContext,
			itemContext,
			bob,
			alice,
			sharedSword,
			loopA,
			loopB,
			brokenItem
		};
	}

	private async testCircularReferenceQuery() {

		await this.resetCoreTestData();

		const {
			characterContext,
			loopA
		} = await this.buildGraphEdgeCaseFixture();

		const results =
			await this.queryManager.query(
				characterContext,
				{
					where: [
						{
							field: "friend.name",
							op: "=",
							value: "LoopB"
						}
					]
				}
			);

		if (results.length !== 1) {

			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].id !== loopA.id) {

			throw new Error(
				"Wrong circular reference result"
			);
		}
	}

	private async testBrokenReferenceQuery() {

		await this.resetCoreTestData();

		const {
			itemContext
		} = await this.buildGraphEdgeCaseFixture();

		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "owner.name",
							op: "=",
							value: "Bob"
						}
					]
				}
			);

		if (!Array.isArray(results)) {

			throw new Error(
				"Query did not return results"
			);
		}
	}

	private async testSharedTargetMutation() {

		await this.resetCoreTestData();

		const {
			characterContext,
			sharedSword
		} = await this.buildGraphEdgeCaseFixture();

		const result =
			await this.mutationExecutor.execute(
				characterContext,
				{
					select: "items.power",
					operation: {
						type: "set",
						value: 999
					}
				}
			);

		if (result.updated !== 1) {

			throw new Error(
				`Expected 1 update, got ${result.updated}`
			);
		}

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const updatedSword =
			await this.dataManager.getById(
				itemContext,
				sharedSword.id
			);

		if (updatedSword?.data?.power !== 999) {

			throw new Error(
				"Shared target was not updated"
			);
		}
	}

	private async graphEdgeCaseTestSuite() {
		this.logger?.log({ level: "info", scope: "TEST", message: "Graph Edge Cases Test Suite" });

		try {
			await this.safeRun(
				"Circular Reference Query",
				() => this.testCircularReferenceQuery()
			);

			await this.safeRun(
				"Broken Referency Query",
				() => this.testBrokenReferenceQuery()
			);

			await this.safeRun(
				"Shared Target Mutation",
				() => this.testSharedTargetMutation()
			);
		}
		catch (e) {
			this.logger?.log({ level: "error", scope: "TEST", message: "Graph Edge Cases Tests Failed", data: (e as Error).message });
		}

		this.logger?.log({ level: "info", scope: "TEST", message: "Graph Edge Cases Test Suite Completed" });
	}
}