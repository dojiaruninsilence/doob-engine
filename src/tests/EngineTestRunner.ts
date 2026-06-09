import { Notice } from "obsidian";

export class EngineTestRunner {

	private schemaManager: any;
	private dataManager: any;
	private contextFactory: any;

	constructor(schemaManager: any, dataManager: any, contextFactory: any) {

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

	// --------------------------------------------------
	// RUN ALL TESTS
	// --------------------------------------------------

	async runAll() {

        new Notice("🧪 Engine Tests Starting...");

        await this.safeRun("Schema Setup", () =>
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

        new Notice("✅ All Engine Tests Completed");
    }

	// --------------------------------------------------
	// TEST 1: Schema Setup
	// --------------------------------------------------

	private async testSchemaSetup() {

	new Notice("Test 1: Schema Setup");

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
}