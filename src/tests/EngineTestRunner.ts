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
		);*/

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

        new Notice("✅ All Engine Tests Completed");
    }

	// --------------------------------------------------
	// TEST 1: Schema Setup
	// --------------------------------------------------

	private async testSchemaSetup() {

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
}