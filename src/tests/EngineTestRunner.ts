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

		const context =
			await this.contextFactory.getSchemaContext(
				"CoreTest",
				"Item"
			);

		const all =
			await this.dataManager.getAll(context);

		for (const record of all) {
			await this.dataManager.remove(context, record.id);
		}
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
		);*/

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
}