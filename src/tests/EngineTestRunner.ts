import { Notice } from "obsidian";

export class EngineTestRunner {

	private schemaManager: any;
	private dataManager: any;
	private contextFactory: any;
	private queryManager: any;
	private referenceManager: any;

	constructor(schemaManager: any, dataManager: any, contextFactory: any, queryManager: any, referenceManager: any) {

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
        this.referenceManager = referenceManager;
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

	// --------------------------------------------------
	// RUN ALL TESTS
	// --------------------------------------------------

	async runAll() {

        new Notice("🧪 Engine Tests Starting...");

        /*await this.safeRun("Schema Setup", () =>
            this.testSchemaSetup()
        );

        await this.safeRun("Valid Record", () =>
            this.testValidRecord()
        );

        await this.safeRun("Invalid Record", () =>
            this.testInvalidRecord()
        );

        await this.safeRun("Migration", () =>
            this.testMigration()
        );

        await this.safeRun("Queries", () =>
            this.testQueries()
        );

		await this.safeRun(
			"Update Cache",
			() => this.testUpdateCache()
		);

		await this.safeRun(
			"Remove Cache",
			() => this.testRemoveCache()
		);

		await this.safeRun(
			"Query Where",
			() => this.testQueryWhere()
		);

		await this.safeRun(
			"Query Comparison",
			() => this.testQueryComparison()
		);

		await this.safeRun(
			"Query Sort",
			() => this.testQuerySort()
		);

		await this.safeRun(
			"Query Pagination",
			() => this.testQueryPagination()
		);

		await this.safeRun(
			"Reference Setup",
			() => this.testReferenceSetup()
		);

		await this.safeRun(
			"Resolve Reference",
			() => this.testResolveReference()
		);

		await this.safeRun(
			"Invalid Reference",
			() => this.testInvalidReference()
		);

		await this.safeRun(
			"Reference Validation",
			() => this.testReferenceValidation()
		);

		await this.safeRun(
			"Reference Resolution",
			() => this.testReferenceResolution()
		);

		await this.safeRun(
			"Invalid Reference Validation",
			() => this.testInvalidReferenceValidation()
		);

		await this.safeRun(
			"Valid Reference Validation",
			() => this.testValidReferenceValidation()
		);

		await this.safeRun(
			"Hydration",
			() => this.testHydration()
		);

		await this.safeRun(
			"Query Manager",
			() => this.testQueryManager()
		);

		await this.safeRun("Invalid Reference Validation", () =>
			this.testInvalidReferenceValidation()
		);

		await this.safeRun("Valid Reference Validation", () =>
			this.testValidReferenceValidation()
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
			"Deep Reference Traversal",
			() => this.testDeepReferenceTraversal()
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
		);*/

		await this.safeRun(
			"Group Order by Count",
			() => this.testGroupOrderByCount()
		);

        new Notice("✅ All Engine Tests Completed");
    }

	// --------------------------------------------------
	// TEST 1: Schema Setup
	// --------------------------------------------------

	/*private async testSchemaSetup() {

		new Notice("Test 1: Schema Setup");

		await this.resetCoreTestData();

		const schema =
			await this.schemaManager.loadSchema(
				"CoreTest",
				"Item"
			);

		if (!schema.fields["name"]) {
			await this.schemaManager.addField(
				"CoreTest",
				"Item",
				"name",
				"string",
				""
			);
		}

		if (!schema.fields["damage"]) {
			await this.schemaManager.addField(
				"CoreTest",
				"Item",
				"damage",
				"number",
				1
			);
		}

		if (!schema.fields["rarity"]) {
			await this.schemaManager.addField(
				"CoreTest",
				"Item",
				"rarity",
				"enum",
				"Common",
				["Common", "Uncommon", "Rare", "Epic", "Legendary"]
			);
		}

		new Notice("Schema ready");
	}

	// --------------------------------------------------
	// TEST 2: Valid Record
	// --------------------------------------------------

	private async testValidRecord() {

		await this.resetCoreTestData();

		new Notice("Test 2: Valid Record");

        const context = await this.contextFactory.getSchemaContext(
			"CoreTest",
			"Item"
		);

		const record =
			await this.dataManager.createRecord(
				context,
				{
					name: "Test Sword"
				}
			);

		new Notice(`Created: ${record.id}`);
	}

	// --------------------------------------------------
	// TEST 3: Invalid Record
	// --------------------------------------------------

	private async testInvalidRecord() {

		await this.resetCoreTestData();

		new Notice("Test 3: Invalid Record");

        const context = await this.contextFactory.getSchemaContext(
			"CoreTest",
			"Item"
		);

		try {

			await this.dataManager.createRecord(
				context,
				{
					name: "Bad Item",
					damage: "INVALID"
				}
			);

			throw new Error("Validation failed to catch error");

		} catch (e) {

			new Notice(`Validation working: ${e.message}`);
		}
	}

	// --------------------------------------------------
	// TEST 4: Migration
	// --------------------------------------------------

	private async testMigration() {

		await this.resetCoreTestData();

		new Notice("Test 4: Migration");
		
		const schema = await this.schemaManager.loadSchema("CoreTest", "Item");

		if (!schema.fields["weight"]) {
			await this.schemaManager.addField(
				"CoreTest",
				"Item",
				"weight",
				"number",
				5
			);
		}

        const context = await this.contextFactory.getSchemaContext(
			"CoreTest",
			"Item"
		);

		const all =
			await this.dataManager.getAll(
				context
			);

		new Notice(`Migrated ${all.length} records`);
	}

	// --------------------------------------------------
	// TEST 5: Queries
	// --------------------------------------------------

	private async testQueries() {

		await this.resetCoreTestData();

		new Notice("Test 5: Queries");

        const context = await this.contextFactory.getSchemaContext(
			"CoreTest",
			"Item"
		);

		const all =
			await this.dataManager.getAll(
				context
			);

		if (all.length > 0) {

			const first =
				await this.dataManager.getById(
					context,
					all[0].id
				);

			new Notice(`GetById OK: ${first?.id}`);
		}
	}

	// --------------------------------------------------
	// TEST 6: UPDATE CACHE
	// --------------------------------------------------

	private async testUpdateCache() {

		await this.resetCoreTestData();

		new Notice("Test 6: Update Cache");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// Create record

		const record =
			await this.dataManager.createRecord(
				context,
				{
					name: "Cache Sword",
					damage: 10
				}
			);

		// Update record

		await this.dataManager.update(
			context,
			record.id,
			{
				damage: 999
			}
		);

		// Immediately read back

		const updated =
			await this.dataManager.getById(
				context,
				record.id
			);

		if (!updated) {
			throw new Error(
				"Updated record not found"
			);
		}

		if (updated.data.damage !== 999) {
			throw new Error(
				`Expected damage 999, got ${updated.data.damage}`
			);
		}

		new Notice(
			`Update cache OK (${updated.data.damage})`
		);
	}

	// --------------------------------------------------
	// TEST 7: REMOVE CACHE
	// --------------------------------------------------

	private async testRemoveCache() {

		await this.resetCoreTestData();

		new Notice("Test 7: Remove Cache");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// Create record

		const record =
			await this.dataManager.createRecord(
				context,
				{
					name: "Delete Me",
					damage: 1
				}
			);

		// Remove record

		const removed =
			await this.dataManager.remove(
				context,
				record.id
			);

		if (!removed) {
			throw new Error(
				"Remove returned false"
			);
		}

		// Verify cache + storage

		const exists =
			await this.dataManager.exists(
				context,
				record.id
			);

		if (exists) {
			throw new Error(
				"Record still exists after remove"
			);
		}

		new Notice(
			"Remove cache OK"
		);
	}

	// --------------------------------------------------
	// TEST 8: QUERY - BASIC WHERE
	// --------------------------------------------------

	private async testQueryWhere() {

		await this.resetCoreTestData();

		new Notice("Test 8: Query Where");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// Create test records

		await this.dataManager.createRecord(context, {
			name: "Sword A",
			damage: 5
		});

		await this.dataManager.createRecord(context, {
			name: "Sword B",
			damage: 15
		});

		const results =
			await this.queryManager.query(context, {
				where: {
					damage: 15
				}
			});

		if (results.length !== 1) {
			throw new Error(
				`Expected 1 result, got ${results.length}`
			);
		}

		new Notice(
			`WHERE query OK (${results[0].name})`
		);
	}

	// --------------------------------------------------
	// TEST 9: QUERY - COMPARISON
	// --------------------------------------------------

	private async testQueryComparison() {

		await this.resetCoreTestData();

		new Notice("Test 9: Query Comparison");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(context, {
			name: "Weak Item",
			damage: 2
		});

		await this.dataManager.createRecord(context, {
			name: "Strong Item",
			damage: 100
		});

		const results =
			await this.queryManager.query(context, {
				where: {
					damage: { gt: 10 }
				}
			});

		if (results.length === 0) {
			throw new Error("Expected results for gt query");
		}

		if (!results.every(r => r.damage > 10)) {
			throw new Error("gt filter failed");
		}

		new Notice(
			`GT query OK (${results.length} results)`
		);
	}

	// --------------------------------------------------
	// TEST 10: QUERY - SORT
	// --------------------------------------------------

	private async testQuerySort() {

		await this.resetCoreTestData();

		new Notice("Test 10: Query Sort");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		await this.dataManager.createRecord(context, {
			name: "Low",
			damage: 1
		});

		await this.dataManager.createRecord(context, {
			name: "High",
			damage: 999
		});

		const results =
			await this.queryManager.query(context, {
				sort: {
					field: "damage",
					direction: "desc"
				}
			});

		if (results.length < 2) {
			throw new Error("Not enough data for sort test");
		}

		if (results[0].damage < results[1].damage) {
			throw new Error("Sort failed (desc expected)");
		}

		new Notice("Sort query OK");
	}

	// --------------------------------------------------
	// TEST 11: QUERY - LIMIT / OFFSET
	// --------------------------------------------------

	private async testQueryPagination() {

		await this.resetCoreTestData();

		new Notice("Test 11: Query Pagination");

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		// create multiple records
		for (let i = 0; i < 5; i++) {
			await this.dataManager.createRecord(context, {
				name: `Item ${i}`,
				damage: i
			});
		}

		const results =
			await this.queryManager.query(context, {
				sort: {
					field: "damage",
					direction: "asc"
				},
				offset: 1,
				limit: 2
			});

		if (results.length !== 2) {
			throw new Error(
				`Expected 2 results, got ${results.length}`
			);
		}

		new Notice("Pagination OK");
	}

	// --------------------------------------------------
	// TEST 12: REFERENCE SCHEMA SETUP
	// --------------------------------------------------

	private async testReferenceSetup() {

		new Notice("Test 12: Reference Setup");

		// Character schema

		try {

			await this.schemaManager.addField(
				"CoreTest",
				"Character",
				"name",
				"string",
				""
			);

		} catch {}

		// Item schema reference field

		try {

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

		} catch {}

		new Notice("Reference schema ready");
	}

	// --------------------------------------------------
	// TEST 13: RESOLVE REFERENCE
	// --------------------------------------------------

	private async testResolveReference() {

		new Notice("Test 13: Resolve Reference");

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

		// Create character

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Bob"
				}
			);

		// Create item

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Sword",
					damage: 10,
					owner: character.id
				}
			);

		const resolved =
			await this.referenceManager.resolve(
				itemContext,
				"owner",
				character.id
			);

		if (!resolved) {
			throw new Error(
				"Reference failed to resolve"
			);
		}

		if (
			resolved.data.name !== "Bob"
		) {
			throw new Error(
				"Resolved wrong record"
			);
		}

		new Notice(
			`Reference resolved: ${resolved.data.name}`
		);
	}

	// --------------------------------------------------
	// TEST 14: INVALID REFERENCE
	// --------------------------------------------------

	private async testInvalidReference() {

		new Notice("Test 14: Invalid Reference");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const resolved =
			await this.referenceManager.resolve(
				itemContext,
				"owner",
				"fake-id-does-not-exist"
			);

		if (resolved) {
			throw new Error(
				"Invalid reference resolved unexpectedly"
			);
		}

		new Notice(
			"Invalid reference handled correctly"
		);
	}

	// --------------------------------------------------
	// TEST 15: REFERENCE VALIDATION
	// --------------------------------------------------

	private async testReferenceValidation() {

		new Notice("Test 15: Reference Validation");

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

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Alice"
				}
			);

		const valid =
			await this.referenceManager.validate(
				itemContext,
				"owner",
				character.id
			);

		if (!valid) {
			throw new Error(
				"Valid reference failed validation"
			);
		}

		const invalid =
			await this.referenceManager.validate(
				itemContext,
				"owner",
				"bad-id"
			);

		if (invalid) {
			throw new Error(
				"Invalid reference passed validation"
			);
		}

		new Notice(
			"Reference validation OK"
		);
	}

	// --------------------------------------------------
	// TEST: REFERENCE RESOLUTION
	// --------------------------------------------------

	private async testReferenceResolution() {

		new Notice("Reference Resolution Test");

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

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Reference Bob"
				}
			);

		const resolved =
			await this.referenceManager.resolve(
				itemContext,
				"owner",
				character.id
			);

		if (!resolved) {
			throw new Error(
				"Reference failed to resolve"
			);
		}

		if (
			resolved.data.name !== "Reference Bob"
		) {
			throw new Error(
				"Resolved incorrect record"
			);
		}

		new Notice(
			`Resolved: ${resolved.data.name}`
		);
	}

	// --------------------------------------------------
	// TEST: INVALID REFERENCE VALIDATION
	// --------------------------------------------------

	private async testInvalidReferenceValidation() {

		new Notice("Invalid Reference Test");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		let failedCorrectly = false;

		try {

			// ❌ Step 1: validate references BEFORE saving
			const errors =
				await this.referenceManager.validateRecordReferences(
					itemContext,
					{
						name: "Broken Sword",
						damage: 10,
						owner: "fake-id"
					}
				);

			if (errors.length > 0) {
				throw new Error(errors.join("\n"));
			}

			// ❌ Step 2: should never reach here
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Broken Sword",
					damage: 10,
					owner: "fake-id"
				}
			);

		} catch {
			failedCorrectly = true;
		}

		if (!failedCorrectly) {
			throw new Error("Invalid reference was accepted");
		}

		new Notice("Invalid reference rejected correctly");
	}

	// --------------------------------------------------
	// TEST: VALID REFERENCE VALIDATION
	// --------------------------------------------------

	private async testValidReferenceValidation() {

		new Notice("Valid Reference Test");

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

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Valid Bob"
				}
			);

		// ✔ Step 1: validate references first
		const errors =
			await this.referenceManager.validateRecordReferences(
				itemContext,
				{
					name: "Valid Sword",
					damage: 5,
					owner: character.id
				}
			);

		if (errors.length > 0) {
			throw new Error(errors.join("\n"));
		}

		// ✔ Step 2: only create after validation passes
		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Valid Sword",
					damage: 5,
					owner: character.id
				}
			);

		if (!item) {
			throw new Error("Valid reference failed creation");
		}

		new Notice("Valid reference accepted");
	}

	// --------------------------------------------------
	// TEST: HYDRATION
	// --------------------------------------------------

	private async testHydration() {

		new Notice("Hydration Test");

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

		const character =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Hydration Bob"
				}
			);

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Hydration Sword",
					damage: 10,
					owner: character.id
				}
			);

		const hydrated =
			await this.referenceManager.hydrateRecord(
				itemContext,
				item.data
			);

		if (!hydrated._resolved) {
			throw new Error(
				"_resolved was not created"
			);
		}

		if (!hydrated._resolved.owner) {
			throw new Error(
				"Owner was not hydrated"
			);
		}

		if (
			hydrated._resolved.owner.data.name !==
			"Hydration Bob"
		) {
			throw new Error(
				"Hydrated wrong record"
			);
		}

		new Notice(
			`Hydrated owner: ${hydrated._resolved.owner.data.name}`
		);
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

		new Notice("Query: Offset");

		const context =
			await this.contextFactory.getSchemaContext("CoreTest", "Item");

		const all =
			await this.queryManager.query(context, {});

		const offset =
			await this.queryManager.query(context, {
				offset: 1
			});

		if (offset.length !== all.length - 1) {
			throw new Error("Offset failed");
		}

		new Notice("Offset OK");
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
	}*/

	private async testInvalidReferenceValidation() {

		await this.resetCoreTestData();

		new Notice("Test: Invalid Reference Validation");

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const errors =
			await this.referenceManager.validateRecordReferences(
				itemContext,
				{
					owner: "fake-id"
				}
			);

		if (errors.length === 0) {
			throw new Error(
				"Invalid reference was accepted"
			);
		}

		new Notice(
			"Invalid reference rejected correctly"
		);
	}

	private async testValidReferenceValidation() {

		await this.resetCoreTestData();

		new Notice("Test: Valid Reference Validation");

		const charContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Character"
			);

		const itemContext =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const character =
			await this.dataManager.createRecord(
				charContext,
				{
					name: "Valid Bob"
				}
			);

		const errors =
			await this.referenceManager.validateRecordReferences(
				itemContext,
				{
					owner: character.id
				}
			);

		if (errors.length > 0) {
			throw new Error(
				`Valid reference failed validation:\n${errors.join("\n")}`
			);
		}

		new Notice(
			"Valid reference accepted"
		);
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

	private async testDeepReferenceTraversal() {

		await this.resetCoreTestData();

		new Notice(
			"Test: Deep Reference Traversal"
		);

		// --------------------------------------------------
		// Ensure required schema fields exist
		// --------------------------------------------------

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
			"Guild",
			"name",
			"string",
			""
		);

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
		// Create leader
		// --------------------------------------------------

		const leader =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Guild Leader"
				}
			);

		if (!leader?.id) {
			throw new Error(
				"Leader creation failed"
			);
		}

		// --------------------------------------------------
		// Create guild
		// --------------------------------------------------

		const guild =
			await this.dataManager.createRecord(
				guildContext,
				{
					name: "Knights",
					leader: leader.id
				}
			);

		if (!guild?.id) {
			throw new Error(
				"Guild creation failed"
			);
		}

		// --------------------------------------------------
		// Create member
		// --------------------------------------------------

		const member =
			await this.dataManager.createRecord(
				characterContext,
				{
					name: "Guild Bob",
					guild: guild.id
				}
			);

		if (!member?.id) {
			throw new Error(
				"Member creation failed"
			);
		}

		// --------------------------------------------------
		// Create item
		// --------------------------------------------------

		const item =
			await this.dataManager.createRecord(
				itemContext,
				{
					name: "Guild Sword",
					damage: 15,
					owner: member.id
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
							field: "owner.guild.leader.name",
							op: "=",
							value: "Guild Leader"
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
				"Deep traversal returned wrong item"
			);
		}

		new Notice(
			"Deep reference traversal passed"
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
}