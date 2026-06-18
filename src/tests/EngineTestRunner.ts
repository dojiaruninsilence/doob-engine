import { Notice } from "obsidian";
import { ResolvedRecordGraphNavigator } from "../managers/query/graph/ResolvedRecordGraphNavigator";
import { AggregateResolver } from "../managers/query/aggregate/AggregateResolver";
import { QueryGroupResult } from "../types/QueryTypes";
import { AggregateStrategyRegistry } from "../managers/query/aggregate/AggregateStrategyRegistry";
import { CountStrategy } from "../managers/query/aggregate/strategies/CountStrategy";
import { SumStrategy } from "../managers/query/aggregate/strategies/SumStrategy";
import { AvgStrategy } from "../managers/query/aggregate/strategies/AvgStrategy";
import { MinStrategy } from "../managers/query/aggregate/strategies/MinStrategy";
import { MaxStrategy } from "../managers/query/aggregate/strategies/MaxStrategy";
import { DistinctStrategy } from "../managers/query/aggregate/strategies/DistinctStrategy";

export class EngineTestRunner {

	private schemaManager: any;
	private dataManager: any;
	private contextFactory: any;
	private queryManager: any;
	private queryPlanner: any;
	private graphBuilder: any;

	constructor(
		schemaManager: any, 
		dataManager: any, 
		contextFactory: any, 
		queryManager: any, 
		queryPlanner: any,
		graphBuilder: any
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
    }

    private async safeRun(name: string, fn: () => Promise<void>) {
        try {
            await fn();
            new Notice(`✔ ${name}`);
        } catch (e) {
            console.error(`❌ ${name} failed`, e);
            new Notice(`❌ ${name} failed\n${(e as Error).message}`);
            throw e;
        }
    }

	private async resetCoreTestData() {

		new Notice("Reset: CoreTest Data + Schema");

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

		new Notice("Reset complete");
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
		}
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
			referenceTarget
		);
	}

	// Notes:
	/*
	x1. Graph Integrity Tests
	x2. Navigator Tests
	x3. Query Tests
	4. Aggregate Expansion

			🧠 What you need to design next

			You need 3 layers:

					x1. Aggregate Resolver (core new component)

					This is the key missing piece.

					It answers:

					“Given a group + graph, how do I compute sum(owner.guild.rank)?”

					It should:

					use ResolvedRecordGraphNavigator
					support field paths
					return a computed scalar
			2. Aggregate Executor (group level)

			For each group:

			for group in groups:
				value = aggregateResolver.evaluate(group, graph)
			3. Aggregate Strategy Registry (optional but recommended)

			So later you can add:

			count
			sum
			avg
			min
			max
			distinct count
			weighted aggregates

	5. Collection References
	6. Mutation Support

	After aggregate expansion, I'd move toward:

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

        new Notice("🧪 Engine Tests Starting...");

        
		await this.safeRun(
			"Query Manager",
			() => this.testQueryManager()
		);

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
			"Graph Basic Build",
			() => this.testGraphBasicBuild()
		);

		await this.safeRun(
			"Graph Edge Integrity",
			() => this.testGraphEdgeIntegrity()
		);

		await this.safeRun(
			"Graph Shared Node Deduplication",
			() => this.testGraphSharedNodeDeduplication()
		);

		await this.safeRun(
			"Graph Multi Hop Integrity",
			() => this.testGraphMultiHopIntegrity()
		);

		await this.safeRun(
			"Navigator Simple Hop",
			() => this.testNavigatorSimpleHop()
		);

		await this.safeRun(
			"Navigator Multi Hop",
			() => this.testNavigatorMultiHop()
		);

		await this.safeRun(
			"Navigator Missing Branch",
			() => this.testNavigatorMissingBranch()
		);

		await this.safeRun(
			"Navigator Deep Traversal",
			() => this.testNavigatorDeepTraversal()
		);

		await this.safeRun(
			"Navigator Invalid Path",
			() => this.testNavigatorInvalidPath()
		);

		await this.safeRun(
			"Graph Diamond Deduplication",
			() => this.testGraphDiamondDeduplication()
		);

		await this.safeRun(
			"Graph Circular Reference",
			() => this.testGraphCircularReference()
		);

		await this.safeRun(
			"Graph Broken References",
			() => this.testGraphBrokenReference()
		);

		await this.safeRun(
			"Navigator Root Property",
			() => this.testNavigatorRootProperty()
		);

		await this.safeRun(
			"Navigator Missing Mid Hop",
			() => this.testNavigatorMissingMidHop()
		);

		await this.safeRun(
			"Graph Multi Root Stability",
			() => this.testGraphMultiRootStability()
		);

		await this.safeRun(
			"Aggregate Count",
			() => this.testAggregateCount()
		);

		await this.safeRun(
			"Aggregate Sum",
			() => this.testAggregateSum()
		);

		await this.safeRun(
			"Aggregate Avg",
			() => this.testAggregateAvg()
		);

		await this.safeRun(
			"Aggregate Min Max",
			() => this.testAggregateMinMax()
		);

		await this.safeRun(
			"Aggregate Tests Manager",
			() => this.testAggregateManager()
		);

        new Notice("✅ All Engine Tests Completed");
    }

	// --------------------------------------------------
	// QUERY MANAGER TESTS
	// --------------------------------------------------
	
	private async testQueryBasicReturn() {

		new Notice("Query: Basic Return");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {});

		if (!Array.isArray(results)) {
			throw new Error("Query did not return array");
		}

		new Notice(`Basic return OK: ${results.length}`);
	}

	private async testQueryWhereEquals() {

		new Notice("Query: Where Equals");

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

		new Notice(`Equals OK: ${results.length}`);
	}

	private async testQueryWhereGreaterThan() {

		new Notice("Query: Greater Than");

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

		new Notice(`Greater Than OK: ${results.length}`);
	}

	private async testQueryMultiFilterAnd() {

		new Notice("Query: Multi Filter");

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

		new Notice(`Multi Filter OK: ${results.length}`);
	}

	private async testQuerySortAsc() {

		new Notice("Query: Sort ASC");

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

		new Notice("Sort ASC OK");
	}

	private async testQuerySortDesc() {

		new Notice("Query: Sort DESC");

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

		new Notice("Sort DESC OK");
	}

	private async testQueryLimit() {

		new Notice("Query: Limit");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				limit: 2
			});

		if (results.length > 2) {
			throw new Error("Limit failed");
		}

		new Notice(`Limit OK: ${results.length}`);
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

		new Notice("Query: Limit + Offset");

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

		new Notice("Limit+Offset OK");
	}

	private async testQueryInOperator() {

		new Notice("Query: IN Operator");

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

		new Notice("IN OK");
	}

	private async testQueryContainsOperator() {

		new Notice("Query: Contains");

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

		new Notice("Contains OK");
	}

	private async testQueryExistsOperator() {

		new Notice("Query: Exists");

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

		new Notice("Exists OK");
	}

	private async testQueryDeterminism() {

		new Notice("Query: Determinism");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const r1 =
			await this.queryManager.query(context, {});

		const r2 =
			await this.queryManager.query(context, {});

		if (r1.length !== r2.length) {
			throw new Error("Non-deterministic results detected");
		}

		new Notice("Determinism OK");
	}

	private async testQueryUnknownField() {

		new Notice("Query: Unknown Field");

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

		new Notice("Unknown Field OK");
	}

	private async testQueryNullAndUndefinedHandling() {

		new Notice("Query: Null Safety");

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

		new Notice("Null Safety OK");
	}

	private async testQueryTypeCoercionSafety() {

		new Notice("Query: Type Safety");

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

		new Notice("Type Safety OK");
	}

	private async testQueryStackedSameFieldFilters() {

		new Notice("Query: Stacked Filters");

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

		new Notice("Stacked Filters OK");
	}

	private async testQueryEmptyDataset() {

		new Notice("Query: Empty Dataset");

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

		new Notice("Empty Dataset OK");
	}

	private async testQuerySortStability() {

		new Notice("Query: Sort Stability");

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

		new Notice("Sort Stability OK");
	}

	private async testQueryManager() {

		new Notice("Test Query Manager Suite");

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

		new Notice("Query Manager Tests Completed");
	}

	private async testQueryFilter() {

		await this.resetCoreTestData();

		new Notice("Test: Query Filter");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: ">", value: 1 }
				]
			});

		if (!Array.isArray(results)) {
			throw new Error("Query did not return array");
		}

		new Notice(`Filter returned ${results.length} results`);
	}

	private async testQueryExactMatch() {

		await this.resetCoreTestData();

		new Notice("Test: Query Exact Match");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// --------------------------------------------------
		// Seed test data
		// --------------------------------------------------

		await this.dataManager.createRecord(
			context,
			{
				name: "Exact Match Sword",
				damage: 10
			}
		);

		// --------------------------------------------------
		// Run query
		// --------------------------------------------------

		const results =
			await this.queryManager.query(
				context,
				{
					where: [
						{
							field: "name",
							op: "=",
							value: "Exact Match Sword"
						}
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

		if (
			results[0].data.name !==
			"Exact Match Sword"
		) {
			throw new Error(
				"Returned wrong record"
			);
		}

		new Notice("Exact match query passed");
	}

	private async testReferenceQuery() {

		await this.resetCoreTestData();

		new Notice("Test: Reference Query");

		const charContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const character =
			await this.dataManager.createRecord(charContext, {
				name: "Ref Bob"
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Ref Sword",
			damage: 7,
			owner: character.id
		});

		const results =
			await this.queryManager.query(itemContext, {
				where: [
					{ field: "owner", op: "=", value: character.id }
				]
			});

		if (results.length !== 1) {
			throw new Error(`Expected 1 result, got ${results.length}`);
		}

		new Notice("Reference query passed");
	}

	private async testSorting() {

		await this.resetCoreTestData();

		new Notice("Test: Sorting");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				sort: {
					field: "damage",
					dir: "asc"
				}
			});

		for (let i = 1; i < results.length; i++) {
			if (results[i - 1].data.damage > results[i].data.damage) {
				throw new Error("Sorting failed");
			}
		}

		new Notice("Sorting passed");
	}

	private async testPagination() {

		await this.resetCoreTestData();

		new Notice("Test: Pagination");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const page =
			await this.queryManager.query(context, {
				offset: 0,
				limit: 2
			});

		if (page.length > 2) {
			throw new Error("Pagination failed");
		}

		new Notice("Pagination passed");
	}

	private async testCacheStability() {

		await this.resetCoreTestData();

		new Notice("Test: Cache Stability");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const first =
			await this.dataManager.getAll(context);

		const second =
			await this.dataManager.getAll(context);

		if (first.length !== second.length) {
			throw new Error("Cache inconsistency detected");
		}

		new Notice("Cache stable");
	}

	private async testMigrationSafety() {

		await this.resetCoreTestData();

		new Notice("Test: Migration Safety");

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

		new Notice("Migration safe");
	}

	private async testNegativeQuery() {

		await this.resetCoreTestData();

		new Notice("Test: Negative Query");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const results =
			await this.queryManager.query(context, {
				where: [
					{ field: "damage", op: "=", value: -999 }
				]
			});

		if (results.length !== 0) {
			throw new Error("Negative query returned results unexpectedly");
		}

		new Notice("Negative query passed");
	}

	private async testSingleHopReferenceTraversal() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Single Hop Reference Traversal"
		);

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

		new Notice(
			"Single hop traversal passed"
		);
	}

	private async testMultiHopReferenceTraversal() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Multi Hop Reference Traversal"
		);

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

		new Notice(
			"Multi hop traversal passed"
		);
	}

	private async testMissingReferenceTraversal() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Missing Reference Traversal"
		);

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

		new Notice(
			"Missing reference traversal passed"
		);
	}

	private async testProjectionFlatFields() {

		await this.resetCoreTestData();

		new Notice("Test: Projection - Flat Fields");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Projection Sword",
					damage: 25,
					weight: 10
				}
			);

		const results =
			await this.queryManager.query(
				itemContext,
				{
					select: ["name", "damage"]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		const r = results[0];

		if (r.id !== item.id) {
			throw new Error("Wrong record returned");
		}

		if (!r.name || r.name !== "Projection Sword") {
			throw new Error("Name projection failed");
		}

		if (r.damage !== 25) {
			throw new Error("Damage projection failed");
		}

		// must NOT include weight
		if ("weight" in r) {
			throw new Error("Unexpected field: weight");
		}

		new Notice("Projection flat fields passed");
	}

	private async testProjectionNestedFields() {

		await this.resetCoreTestData();

		new Notice("Test: Projection - Nested Fields");

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

		new Notice(
			"Projection nested fields passed"
		);
	}

	private async testProjectionDoesNotBreakFiltering() {

		await this.resetCoreTestData();

		new Notice("Test: Projection + Filtering");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword A",
				damage: 10
			}
		);

		await this.dataManager.createRecord(
			itemContext,
			{
				name: "Sword B",
				damage: 50
			}
		);

		const results =
			await this.queryManager.query(
				itemContext,
				{
					where: [
						{
							field: "damage",
							op: ">",
							value: 20
						}
					],
					select: ["name"]
				}
			);

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		if (results[0].name !== "Sword B") {
			throw new Error("Filtering broke with projection");
		}

		new Notice("Projection filtering safety passed");
	}

	private async testCountAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Count Aggregation"
		);

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
						op: "count"
					}
				}
			);

		if (count !== 3) {
			throw new Error(
				`Expected 3, got ${count}`
			);
		}

		new Notice(
			"Count aggregation passed"
		);
	}

	private async testSumAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Sum Aggregation"
		);

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

		new Notice(
			"Sum aggregation passed"
		);
	}

	private async testAverageAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Average Aggregation"
		);

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

		new Notice(
			"Average aggregation passed"
		);
	}

	private async testMinimumAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Minimum Aggregation"
		);

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

		new Notice(
			"Minimum aggregation passed"
		);
	}

	private async testMaximumAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Maximum Aggregation"
		);

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

		new Notice(
			"Maximum aggregation passed"
		);
	}

	private async testFilteredCountAggregation() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Filtered Count Aggregation"
		);

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
						op: "count"
					}
				}
			);

		if (count !== 2) {
			throw new Error(
				`Expected 2, got ${count}`
			);
		}

		new Notice(
			"Filtered count aggregation passed"
		);
	}

	private async testGroupByCount() {

		await this.resetCoreTestData();

		new Notice("Test: Group By Count");

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
					op: "count"
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

		new Notice("Group By Count passed");
	}

	private async testGroupBySum() {

		await this.resetCoreTestData();

		new Notice("Test: Group By Sum");

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

		await this.dataManager.createRecord(
			itemContext,
			{ name: "Sword", damage: 10, owner: char.id }
		);

		await this.dataManager.createRecord(
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

		new Notice("Group By Sum passed");
	}

	private async testGroupByDeepTraversal() {

		await this.resetCoreTestData();

		new Notice("Test: Group By Deep Traversal");

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
					op: "count"
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

		new Notice("Deep Group By passed");
	}

	private async testGroupByEmpty() {

		await this.resetCoreTestData();

		new Notice("Test: Group By Empty");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const results =
			await this.queryManager.queryGroup(itemContext, {
				groupBy: "owner.guild.name",
				aggregate: {
					op: "count"
				}
			});

		if (results.length !== 0) {
			throw new Error("Expected empty result set");
		}

		new Notice("Empty group test passed");
	}

	private async testHavingCount() {

		await this.resetCoreTestData();

		new Notice(
			"Test: HAVING Count"
		);

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
						op: "count"
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

		new Notice(
			"HAVING Count passed"
		);
	}

	private async testHavingSum() {

		await this.resetCoreTestData();

		new Notice(
			"Test: HAVING Sum"
		);

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

		new Notice(
			"HAVING Sum passed"
		);
	}

	private async testHavingCountProperty() {

		await this.resetCoreTestData();

		new Notice(
			"Test: HAVING Count Property"
		);

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
						op: "count"
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

		new Notice(
			"HAVING Count Property passed"
		);
	}

	private async testHavingEmpty() {

		await this.resetCoreTestData();

		new Notice(
			"Test: HAVING Empty"
		);

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
						op: "count"
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

		new Notice(
			"HAVING Empty passed"
		);
	}

	private async testGroupOrderByValueDesc() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Group Order By Value Desc"
		);

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
						op: "count"
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

		new Notice(
			"Group Order By Value Desc passed"
		);
	}

	private async testGroupOrderByValueAsc() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Group Order By Value Asc"
		);

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
						op: "count"
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

		new Notice(
			"Group Order By Value asc passed"
		);
	}

	private async testGroupOrderByKeyAsc() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Group Order By Key Asc"
		);

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
						op: "count"
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

		new Notice(
			"Group Order By Key Asc passed"
		);
	}

	private async testGroupOrderByCount() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Group Order By Count Desc"
		);

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
						op: "count"
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

		new Notice(
			"Group Order By Count Desc passed"
		);
	}

	private async testQueryPlannerSingleHop() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Query Planner Single Hop"
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

		new Notice(
			"Query Planner Single Hop passed"
		);
	}

	private async testQueryPlannerMultiHop() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Query Planner Multi Hop"
		);

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

		new Notice(
			"Query Planner Multi Hop passed"
		);
	}

	private async testQueryPlannerCombinedFields() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Query Planner Combined Fields"
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

		new Notice(
			"Query Planner Combined Fields passed"
		);
	}

	private async testQueryPlannerNoTraversal() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Query Planner No Traversal"
		);

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

		new Notice(
			"Query Planner No Traversal passed"
		);
	}

	private async testPlannerFilterIntegration() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Planner Filter Integration"
		);

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

		new Notice(
			"Planner Filter Integration passed"
		);
	}

	private async testPlannerProjectionIntegration() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Planner Projection Integration"
		);

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

		new Notice(
			"Planner Projection Integration passed"
		);
	}

	private async testPlannerGroupIntegration() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Planner Group Integration"
		);

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
						op: "count"
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

		new Notice(
			"Planner Group Integration passed"
		);
	}

	private async testQueryPlannerDeduplication() {

		await this.resetCoreTestData();

		new Notice("Test: Query Planner Deduplication");

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

		new Notice("Deduplication test passed");
	}

	private async testQueryPlannerSelectWhereDeduplication() {

		await this.resetCoreTestData();

		new Notice("Test: Select + Where Deduplication");

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

		new Notice("Select/Where dedup passed");
	}

	private async testQueryPlannerGroupByDeduplication() {

		await this.resetCoreTestData();

		new Notice("Test: GroupBy Deduplication");

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

		new Notice("GroupBy dedup passed");
	}

	private async testRunnerBatchDeduplication() {

		await this.resetCoreTestData();

		new Notice("Test: Runner Batch Deduplication");

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

		new Notice("Runner Batch Dedup passed");
	}

	private async testRunnerMultiHopIntegrity() {

		await this.resetCoreTestData();

		new Notice("Test: Runner Multi Hop Integrity");

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

		new Notice("Runner Multi Hop passed");
	}

	private async testRunnerNoStepFastPath() {

		await this.resetCoreTestData();

		new Notice("Test: Runner No Step Fast Path");

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

		new Notice("Runner No Step Fast Path passed");
	}

	private async testDeepReferenceTraversal() {

		await this.resetCoreTestData();

		new Notice("Test: Deep Reference Traversal");

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

		new Notice("Deep Reference Traversal passed");
	}

	private async testSharedReferenceConsistency() {

		await this.resetCoreTestData();

		new Notice("Test: Shared Reference Consistency");

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

		new Notice("Shared Reference Consistency passed");
	}

	private async testBatchFanOutTraversal() {

		await this.resetCoreTestData();

		new Notice("Test: Batch Fan-Out Traversal");

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

		new Notice("Batch Fan-Out Traversal passed");
	}

	private async testMissingReferenceFilterBehavior() {

		await this.resetCoreTestData();

		new Notice("Test: Missing Reference Filter Behavior");

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

		new Notice("Missing Reference Filter Behavior passed");
	}

	private async testGraphBasicBuild() {

		await this.resetCoreTestData();

		new Notice("Graph Test: Basic Build");

		await this.ensureField("CoreTest", "Character", "name", "string", "");
		await this.ensureField("CoreTest", "Item", "name", "string", "");
		await this.ensureField(
			"CoreTest",
			"Item",
			"owner",
			"reference",
			null,
			undefined,
			{ ruleset: "CoreTest", schema: "Character" }
		);

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob"
			});

		const sword =
			await this.dataManager.createRecord(itemContext, {
				name: "Sword",
				owner: bob.id
			});

		const graph =
			await this.graphBuilder.build(
				itemContext,
				[sword],
				{
					steps: [
						{
							from: "Item",
							field: "owner",
							to: "Character",
							isReference: true,
							toRuleset: "CoreTest"
						}
					]
				} as any
			);

		const ownerNode = graph.nodes.get(bob.id);

		if (!ownerNode) {
			throw new Error("Owner node missing");
		}

		new Notice("Graph Basic Build passed");
	}

	private async testGraphEdgeIntegrity() {

		await this.resetCoreTestData();

		new Notice("Graph Test: Edge Integrity");

		await this.ensureField("CoreTest", "Character", "name", "string", "");
		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const bob =
			await this.dataManager.createRecord(characterContext, { name: "Bob" });

		const sword =
			await this.dataManager.createRecord(itemContext, {
				owner: bob.id
			});

		const graph =
			await this.graphBuilder.build(
				itemContext,
				[sword],
				{
					steps: [
						{
							from: "Item",
							field: "owner",
							to: "Character",
							isReference: true,
							toRuleset: "CoreTest"
						}
					]
				} as any
			);

		const swordNode = graph.nodes.get(sword.id);
		const bobNode = graph.nodes.get(bob.id);

		if (!swordNode?.refs.get("owner")) {
			throw new Error("Missing owner edge");
		}

		if (swordNode.refs.get("owner") !== bob.id) {
			throw new Error("Wrong edge target");
		}

		if (!bobNode) {
			throw new Error("Bob node missing");
		}

		new Notice("Graph Edge Integrity passed");
	}

	private async testGraphSharedNodeDeduplication() {

		await this.resetCoreTestData();

		new Notice("Graph Test: Shared Node Dedup");

		await this.ensureField("CoreTest", "Item", "owner", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const bob =
			await this.dataManager.createRecord(characterContext, { name: "Bob" });

		const items = [];

		for (let i = 0; i < 5; i++) {
			items.push(
				await this.dataManager.createRecord(itemContext, {
					owner: bob.id
				})
			);
		}

		const graph =
			await this.graphBuilder.build(
				itemContext,
				items,
				{
					steps: [
						{
							from: "Item",
							field: "owner",
							to: "Character",
							isReference: true,
							toRuleset: "CoreTest"
						}
					]
				} as any
			);

		let bobCount = 0;

		for (const node of graph.nodes.values()) {
			if (node.id === bob.id) {
				bobCount++;
			}
		}

		if (bobCount !== 1) {
			throw new Error(`Expected 1 Bob node, got ${bobCount}`);
		}

		new Notice("Graph Shared Node Dedup passed");
	}

	private async testGraphMultiHopIntegrity() {

		await this.resetCoreTestData();

		new Notice("Graph Test: Multi Hop");

		await this.ensureField("CoreTest", "Guild", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});
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
			await this.dataManager.createRecord(guildContext, { name: "Knights" });

		const bob =
			await this.dataManager.createRecord(characterContext, {
				guild: guild.id
			});

		const sword =
			await this.dataManager.createRecord(itemContext, {
				owner: bob.id
			});

		const graph =
			await this.graphBuilder.build(
				itemContext,
				[sword],
				{
					steps: [
						{
							from: "Item",
							field: "owner",
							to: "Character",
							isReference: true,
							toRuleset: "CoreTest"
						},
						{
							from: "Character",
							field: "guild",
							to: "Guild",
							isReference: true,
							toRuleset: "CoreTest"
						}
					]
				} as any
			);

		const guildNode = graph.nodes.get(guild.id);

		if (!guildNode) {
			throw new Error("Guild node missing");
		}

		new Notice("Graph Multi Hop passed");
	}

	private async buildGraphForNavigator(missing = false) {

		await this.resetCoreTestData();

		await this.ensureField("CoreTest", "Guild", "name", "string", "");
		if (missing) {
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
		}
		
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

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const guild =
			await this.dataManager.createRecord(guildContext, { name: "Knights" });
		

		const leader =
			await this.dataManager.createRecord(characterContext, {
				name: "Leader",
				guild: guild.id
			});

		if (missing) {
			await this.dataManager.update(guildContext, guild.id, { leader: leader.id })
		}

		const member =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		const item =
			await this.dataManager.createRecord(itemContext, {
				name: "Sword",
				owner: member.id
			});

		return {
			itemContext,
			item,
			graph: null as any // filled per test
		};
	}

	private async testNavigatorSimpleHop() {

		new Notice("Navigator Test: Simple Hop");

		const setup = await this.buildGraphForNavigator();

		const plan = await this.queryPlanner.plan(setup.itemContext, {
			select: ["owner.name"]
		});

		setup.graph = await this.graphBuilder.build(
			setup.itemContext,
			await this.dataManager.getAll(setup.itemContext),
			plan
		);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(
				setup.graph,
				setup.item.id,
				"owner.name"
			);

		if (value !== "Bob") {
			throw new Error(`Expected Bob, got ${value}`);
		}

		new Notice("Navigator Simple Hop passed");
	}

	private async testNavigatorMultiHop() {

		new Notice("Navigator Test: Multi Hop");

		const setup = await this.buildGraphForNavigator();

		const plan = await this.queryPlanner.plan(setup.itemContext, {
			select: ["owner.guild.name"]
		});

		setup.graph = await this.graphBuilder.build(
			setup.itemContext,
			await this.dataManager.getAll(setup.itemContext),
			plan
		);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(
				setup.graph,
				setup.item.id,
				"owner.guild.name"
			);

		if (value !== "Knights") {
			throw new Error(`Expected Knights, got ${value}`);
		}

		new Notice("Navigator Multi Hop passed");
	}

	private async testNavigatorMissingBranch() {

		new Notice("Navigator Test: Missing Branch");

		const setup = await this.buildGraphForNavigator();

		const plan = await this.queryPlanner.plan(setup.itemContext, {
			select: ["owner.guild.leader.name"]
		});

		setup.graph = await this.graphBuilder.build(
			setup.itemContext,
			await this.dataManager.getAll(setup.itemContext),
			plan
		);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(
				setup.graph,
				setup.item.id,
				"owner.guild.leader.name"
			);

		if (value !== undefined) {
			throw new Error(`Expected Leader, got ${value}`);
		}

		new Notice("Navigator Missing Branch passed");
	}

	private async testNavigatorDeepTraversal() {

		new Notice("Navigator Test: Missing Branch");

		const setup = await this.buildGraphForNavigator(true);

		const plan = await this.queryPlanner.plan(setup.itemContext, {
			select: ["owner.guild.leader.name"]
		});

		setup.graph = await this.graphBuilder.build(
			setup.itemContext,
			await this.dataManager.getAll(setup.itemContext),
			plan
		);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(
				setup.graph,
				setup.item.id,
				"owner.guild.leader.name"
			);

		if (value !== "Leader") {
			throw new Error(`Expected Leader, got ${value}`);
		}

		new Notice("Navigator Missing Branch passed");
	}

	private async testNavigatorInvalidPath() {

		new Notice("Navigator Test: Invalid Path");

		const setup = await this.buildGraphForNavigator();

		const plan = await this.queryPlanner.plan(setup.itemContext, {
			select: ["owner.nonexistent.field"]
		});

		setup.graph = await this.graphBuilder.build(
			setup.itemContext,
			await this.dataManager.getAll(setup.itemContext),
			plan
		);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(
				setup.graph,
				setup.item.id,
				"owner.nonexistent.field"
			);

		if (value !== undefined) {
			throw new Error(`Expected undefined, got ${value}`);
		}

		new Notice("Navigator Invalid Path passed");
	}

	private async testGraphDiamondDeduplication() {

		await this.resetCoreTestData();

		new Notice("Test: Graph Diamond Deduplication");

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

		const rick =
			await this.dataManager.createRecord(characterContext, {
				name: "Rick",
				guild: guild.id
			});

		await this.dataManager.createRecord(itemContext, {
			name: "Sword",
			owner: bob.id
		});

		await this.dataManager.createRecord(itemContext, {
			name: "Shield",
			owner: rick.id
		});

		const plan =
			await this.queryPlanner.plan(itemContext, {
				select: ["owner.guild.name"]
			});

		const graph =
			await this.graphBuilder.build(
				itemContext,
				await this.dataManager.getAll(itemContext),
				plan
			);

		const guildNodes =
			[...graph.nodes.values()]
				.filter(n => n.schema === "Guild");

		if (guildNodes.length !== 1) {
			throw new Error(`Expected 1 Guild node, got ${guildNodes.length}`);
		}

		new Notice("Graph Diamond Deduplication passed");
	}

	private async testGraphCircularReference() {

		await this.resetCoreTestData();

		new Notice("Test: Graph Circular Reference");

		await this.ensureField("CoreTest", "Character", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "friend", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Character"
		});

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const a =
			await this.dataManager.createRecord(characterContext, {
				name: "A"
			});

		const b =
			await this.dataManager.createRecord(characterContext, {
				name: "B",
				friend: a.id
			});

		await this.dataManager.update(characterContext, a.id, {
			friend: b.id
		});

		const plan =
			await this.queryPlanner.plan(characterContext, {
				select: ["friend.friend.name"]
			});

		const graph =
			await this.graphBuilder.build(
				characterContext,
				await this.dataManager.getAll(characterContext),
				plan
			);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(graph, a.id, "friend.friend.name");

		if (value !== "A") {
			throw new Error(`Expected A, got ${value}`);
		}

		new Notice("Graph Circular Reference passed");
	}

	private async testGraphBrokenReference() {

		await this.resetCoreTestData();

		new Notice("Test: Graph Broken Reference");

		await this.ensureField("CoreTest", "Character", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: "non-existent-id"
			});

		const plan =
			await this.queryPlanner.plan(characterContext, {
				select: ["guild.name"]
			});

		const graph =
			await this.graphBuilder.build(
				characterContext,
				await this.dataManager.getAll(characterContext),
				plan
			);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(graph, bob.id, "guild.name");

		if (value !== undefined) {
			throw new Error(`Expected undefined, got ${value}`);
		}

		new Notice("Graph Broken Reference passed");
	}

	private async testNavigatorRootProperty() {

		await this.resetCoreTestData();

		new Notice("Test: Navigator Root Property");

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob"
			});

		const plan =
			await this.queryPlanner.plan(characterContext, {
				select: ["name"]
			});

		const graph =
			await this.graphBuilder.build(
				characterContext,
				await this.dataManager.getAll(characterContext),
				plan
			);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(graph, bob.id, "name");

		if (value !== "Bob") {
			throw new Error(`Expected Bob, got ${value}`);
		}

		new Notice("Navigator Root Property passed");
	}

	private async testNavigatorMissingMidHop() {

		await this.resetCoreTestData();

		new Notice("Test: Navigator Missing Mid-Hop");

		await this.ensureField("CoreTest", "Character", "name", "string", "");
		await this.ensureField("CoreTest", "Character", "guild", "reference", null, undefined, {
			ruleset: "CoreTest",
			schema: "Guild"
		});

		await this.ensureField("CoreTest", "Guild", "name", "string", "");

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const guild =
			await this.dataManager.createRecord(guildContext, {
				name: "Knights"
			});

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: guild.id
			});

		const plan =
			await this.queryPlanner.plan(characterContext, {
				select: ["guild.name"]
			});

		const graph =
			await this.graphBuilder.build(
				characterContext,
				await this.dataManager.getAll(characterContext),
				plan
			);

		const navigator =
			new ResolvedRecordGraphNavigator();

		const value =
			navigator.getValue(graph, bob.id, "guild.leader.name");

		if (value !== undefined) {
			throw new Error(`Expected undefined, got ${value}`);
		}

		new Notice("Navigator Missing Mid-Hop passed");
	}

	private async testGraphMultiRootStability() {

		await this.resetCoreTestData();

		new Notice("Test: Graph Multi Root Stability");

		await this.ensureField("CoreTest", "Character", "name", "string", "");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		await this.dataManager.createRecord(characterContext, { name: "A" });
		await this.dataManager.createRecord(characterContext, { name: "B" });
		await this.dataManager.createRecord(characterContext, { name: "C" });

		const plan =
			await this.queryPlanner.plan(characterContext, {
				select: ["name"]
			});

		const graph =
			await this.graphBuilder.build(
				characterContext,
				await this.dataManager.getAll(characterContext),
				plan
			);

		if (graph.roots.length !== 3) {
			throw new Error(`Expected 3 roots, got ${graph.roots.length}`);
		}

		new Notice("Graph Multi Root Stability passed");
	}

	private async buildAggregateTestFixture(swdVal = 10, shdVal = 10, missing = false, emptyGroup = false) {

		await this.resetCoreTestData();

		// -----------------------------
		// Schema
		// -----------------------------

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

		await this.ensureField("CoreTest", "Item", "power", "number", 0);

		// -----------------------------
		// Data
		// -----------------------------

		const guildContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Guild");

		const characterContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Character");

		const itemContext =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const knights =
			await this.dataManager.createRecord(guildContext, { name: "Knights" });

		const bob =
			await this.dataManager.createRecord(characterContext, {
				name: "Bob",
				guild: knights.id
			});

		const sword =
			await this.dataManager.createRecord(itemContext, {
				name: "Sword",
				owner: bob.id,
				power: swdVal
			});

		const shield =
			await this.dataManager.createRecord(itemContext, {
				name: "Shield",
				owner: bob.id,
				power: shdVal
			});

		if (missing) {
			await this.dataManager.update(itemContext, shield.id, {power: undefined});
		}

		// -----------------------------
		// Build graph (NO executor)
		// -----------------------------

		const plan =
			await this.queryPlanner.plan(itemContext, {
				select: ["owner.guild.name"]
			});

		const graph =
			await this.graphBuilder.build(
				itemContext,
				await this.dataManager.getAll(itemContext),
				plan
			);

		// -----------------------------
		// Fake group (this is the key)
		// -----------------------------

		let group: QueryGroupResult;
		if (emptyGroup) {
			group = {
				key: "Knights",
				records: [],
				value: 0
			};
		} else {
			group = {
				key: "Knights",
				records: [sword, shield],
				value: 2
			};
		}

		const registry = new AggregateStrategyRegistry();
		const graphNav = new ResolvedRecordGraphNavigator;

		registry.register("count", new CountStrategy());
		registry.register("sum", new SumStrategy(graphNav));
		registry.register("avg", new AvgStrategy(graphNav));
		registry.register("min", new MinStrategy(graphNav));
		registry.register("max", new MaxStrategy(graphNav));
		registry.register("distinct", new DistinctStrategy(graphNav));

		return {
			graph,
			group,
			itemContext,
			sword,
			bob,
			knights,
			registry
		};
	}

	private async testAggregateCount() {

		new Notice("Aggregate Resolver: Count");

		const fx = await this.buildAggregateTestFixture();

		const resolver =
			new AggregateResolver(fx.registry);

		const value =
			await resolver.evaluate(
				fx.graph,
				fx.group,
				fx.sword.id,
				{ op: "count" }
			);

		if (value !== 2) {
			throw new Error(`Expected 2, got ${value}`);
		}

		new Notice("Aggregate Count passed");
	}

	private async testAggregateSum() {

		new Notice("Aggregate Resolver: Sum");

		const fx = await this.buildAggregateTestFixture();

		const resolver =
			new AggregateResolver(fx.registry);

		const value =
			await resolver.evaluate(
				fx.graph,
				fx.group,
				fx.sword.id,
				{ op: "sum", field: "power" }
			);

		if (value !== 20) {
			throw new Error(`Expected 20, got ${value}`);
		}

		new Notice("Aggregate Sum passed");
	}

	private async testAggregateAvg() {

		new Notice("Aggregate Resolver: Avg");

		const fx = await this.buildAggregateTestFixture(10, 20);

		const resolver =
			new AggregateResolver(fx.registry);

		const value =
			await resolver.evaluate(
				fx.graph,
				fx.group,
				fx.sword.id,
				{ op: "avg", field: "power" }
			);

		if (value !== 15) {
			throw new Error(`Expected 15, got ${value}`);
		}

		new Notice("Aggregate Avg passed");
	}

	private async testAggregateMinMax() {

		new Notice("Aggregate Resolver: Min/Max");

		const fx = await this.buildAggregateTestFixture(5, 15);

		const resolver =
			new AggregateResolver(fx.registry);

		const min =
			await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "min", field: "power" });

		const max =
			await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "max", field: "power" });

		if (min !== 5) throw new Error(`Expected min 5, got ${min}`);
		if (max !== 15) throw new Error(`Expected max 15, got ${max}`);

		new Notice("Aggregate Min/Max passed");
	}

	private async testAggregateDistinctOne() {
		new Notice("Aggregate Resolver: Distinct One");

		const fx = await this.buildAggregateTestFixture();

		const resolver =
			new AggregateResolver(fx.registry);
		
		const distinct = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "distinct", field: "power" });
		if (distinct !== 1) throw new Error(`Expected distinct 1, got ${distinct}`);
		new Notice("Aggregate Distinct One Passed");
	}

	private async testAggregateDistinctTwo() {
		new Notice("Aggregate Resolver: Distinct Two");

		const fx = await this.buildAggregateTestFixture(10, 20);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const distinct = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "distinct", field: "power" });
		if (distinct !== 2) throw new Error(`Expected distinct 2, got ${distinct}`);
		new Notice("Aggregate Distinct Two Passed");
	}

	private async testAggregateSumMissingNum() {
		new Notice("Aggregate Resolver: Sum Missing Number");

		const fx = await this.buildAggregateTestFixture(10, 10, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const sum = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "sum", field: "power" });
		if (sum !== 10) throw new Error(`Expected sum 2, got ${sum}`);
		new Notice("Aggregate Sum Missing Number Passed");
	}

	private async testAggregateAvgMissingNum() {
		new Notice("Aggregate Resolver: Avg Missing Number");

		const fx = await this.buildAggregateTestFixture(10, 10, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const avg = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "avg", field: "power" });
		if (avg !== 10) throw new Error(`Expected Avg 2, got ${avg}`);
		new Notice("Aggregate Avg Missing Number Passed");
	}

	private async testAggregateCountEmpty() {
		new Notice("Aggregate Resolver: Count Empty");

		const fx = await this.buildAggregateTestFixture(10, 10, false, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const count = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "count" });
		if (count !== 0) throw new Error(`Expected count 0, got ${count}`);
		new Notice("Aggregate Count Empty Passed");
	}

	private async testAggregateAvgEmpty() {
		new Notice("Aggregate Resolver: Avg Empty");

		const fx = await this.buildAggregateTestFixture(10, 10, false, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const avg = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "avg", field: "power" });
		if (avg !== 0) throw new Error(`Expected Avg 0, got ${avg}`);
		new Notice("Aggregate Avg Empty Passed");
	}

	private async testAggregateMinEmpty() {
		new Notice("Aggregate Resolver: min Empty");

		const fx = await this.buildAggregateTestFixture(10, 10, false, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const min = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "min", field: "power" });
		if (min !== null) throw new Error(`Expected Avg 0, got ${min}`);
		new Notice("Aggregate min Empty Passed");
	}

	private async testAggregateMaxEmpty() {
		new Notice("Aggregate Resolver: max Empty");

		const fx = await this.buildAggregateTestFixture(10, 10, false, true);

		const resolver =
			new AggregateResolver(fx.registry);
		
		const max = await resolver.evaluate(fx.graph, fx.group, fx.sword.id, { op: "max", field: "power" });
		if (max !== null) throw new Error(`Expected Avg 0, got ${max}`);
		new Notice("Aggregate max Empty Passed");
	}

	private async testAggregateManager() {

		new Notice("Test Aggregate Manager Suite");

		await this.testAggregateCount();
		await this.testAggregateMinMax();
		await this.testAggregateAvg();
		await this.testAggregateSum();
		await this.testAggregateDistinctOne();
		await this.testAggregateDistinctTwo();
		await this.testAggregateSumMissingNum();
		await this.testAggregateAvgMissingNum();
		await this.testAggregateCountEmpty();
		await this.testAggregateAvgEmpty();
		await this.testAggregateMinEmpty();
		await this.testAggregateMaxEmpty();


		new Notice("Aggregate Manager Tests Completed");
	}
}