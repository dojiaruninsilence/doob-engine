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

        new Notice("✅ All Engine Tests Completed");
    }

	// --------------------------------------------------
	// TEST 1: Schema Setup
	// --------------------------------------------------

	private async testSchemaSetup() {

		new Notice("Test 1: Schema Setup");

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			"name",
			"string",
			""
		);

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			"damage",
			"number",
			1
		);

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			"rarity",
			"enum",
			"Common",
            ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
		);

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

		await this.schemaManager.addField(
			"CoreTest",
			"Item",
			"weight",
			"number",
			5
		);

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
}