import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import DoobEngine from "../main";

export class DoobToolPanel extends ItemView {
	private plugin: DoobEngine;

	constructor(leaf: WorkspaceLeaf, plugin: DoobEngine) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return "doob-tool-panel";
	}

	getDisplayText() {
		return "Doob Tool Panel";
	}

	async onOpen() {

		const container = this.containerEl.children[1];
		container.empty();

		const root = container.createDiv();
		root.style.padding = "12px";
		root.style.display = "flex";
		root.style.flexDirection = "column";
		root.style.gap = "10px";

		// 🔥 HEADER
		const title = root.createEl("h1");
		title.textContent = "🧠 DOOB ENGINE TOOL PANEL";
		title.style.marginBottom = "0px";

		// 🔥 STATUS BOX (VERY OBVIOUS)
		const status = root.createDiv();
		status.textContent = "STATUS: ONLINE";
		status.style.background = "#2ecc71";
		status.style.color = "black";
		status.style.padding = "8px";
		status.style.fontWeight = "bold";
		status.style.textAlign = "center";

		// 🔥 TEST BUTTON
		const testBtn = root.createEl("button");
		testBtn.textContent = "TEST BUTTON";
		testBtn.style.padding = "10px";
		testBtn.style.fontSize = "16px";

		testBtn.onclick = () => {
			new Notice("Tool Panel Button Clicked!");
		};

		// 🔥 SECOND BUTTON (for future expansion)
		const statBtn = root.createEl("button");
		statBtn.textContent = "+ ADD STAT (placeholder)";
		statBtn.style.padding = "10px";

		statBtn.onclick = () => {
			new Notice("Stat tool triggered (not implemented yet)");
		};

		const debugHeader = root.createEl("h2");

		debugHeader.textContent = "Development";

		const testFeatureBtn = root.createEl("button");

		testFeatureBtn.textContent = "Test Feature";

		testFeatureBtn.onclick =
			async () => {

				try {

					const ruleset = "Core";
					const schemaName = "SchemaManagerTest";

					new Notice("Starting SchemaManager test...");

					// ----------------------------------------
					// CREATE / LOAD
					// ----------------------------------------

					await this.plugin.schemaManager.loadSchema(
						ruleset,
						schemaName
					);

					// ----------------------------------------
					// CLEAN START
					// ----------------------------------------

					const schema =
						await this.plugin.schemaManager.loadSchema(
							ruleset,
							schemaName
						);

					schema.fields = {};
					schema.version = 1;

					await this.plugin.schemaManager.saveSchema(
						ruleset,
						schema
					);

					// ----------------------------------------
					// ADD FIELDS
					// ----------------------------------------

					await this.plugin.schemaManager.addField(
						ruleset,
						schemaName,
						"name",
						"string"
					);

					await this.plugin.schemaManager.addField(
						ruleset,
						schemaName,
						"level",
						"number"
					);

					await this.plugin.schemaManager.addField(
						ruleset,
						schemaName,
						"health",
						"number"
					);

					// ----------------------------------------
					// VERIFY ADD
					// ----------------------------------------

					if (
						!(
							await this.plugin.schemaManager.hasField(
								ruleset,
								schemaName,
								"name"
							)
						)
					) {
						throw new Error("name field missing");
					}

					if (
						!(
							await this.plugin.schemaManager.hasField(
								ruleset,
								schemaName,
								"level"
							)
						)
					) {
						throw new Error("level field missing");
					}

					if (
						!(
							await this.plugin.schemaManager.hasField(
								ruleset,
								schemaName,
								"health"
							)
						)
					) {
						throw new Error("health field missing");
					}

					// ----------------------------------------
					// RENAME
					// ----------------------------------------

					await this.plugin.schemaManager.renameField(
						ruleset,
						schemaName,
						"health",
						"hp"
					);

					if (
						await this.plugin.schemaManager.hasField(
							ruleset,
							schemaName,
							"health"
						)
					) {
						throw new Error("health field still exists");
					}

					if (
						!(
							await this.plugin.schemaManager.hasField(
								ruleset,
								schemaName,
								"hp"
							)
						)
					) {
						throw new Error("hp field missing");
					}

					// ----------------------------------------
					// UPDATE
					// ----------------------------------------

					await this.plugin.schemaManager.updateField(
						ruleset,
						schemaName,
						"hp",
						{
							default: 100
						}
					);

					// ----------------------------------------
					// REMOVE
					// ----------------------------------------

					await this.plugin.schemaManager.removeField(
						ruleset,
						schemaName,
						"level"
					);

					if (
						await this.plugin.schemaManager.hasField(
							ruleset,
							schemaName,
							"level"
						)
					) {
						throw new Error("level field still exists");
					}

					// ----------------------------------------
					// APPLY DEFAULTS
					// ----------------------------------------

					const finalSchema =
						await this.plugin.schemaManager.loadSchema(
							ruleset,
							schemaName
						);

					const migrated =
						this.plugin.schemaManager.applyDefaults(
							{},
							finalSchema
						);

					if (migrated.name !== "") {
						throw new Error(
							"name default failed"
						);
					}

					if (migrated.hp !== 100) {
						throw new Error(
							"hp default failed"
						);
					}

					// ----------------------------------------
					// SUCCESS
					// ----------------------------------------

					new Notice(
						"✅ SchemaManager test passed"
					);

					console.log(
						"Final schema:",
						finalSchema
					);

					console.log(
						"Migrated record:",
						migrated
					);

				}
				catch (error) {

					console.error(error);

					new Notice(
						`❌ SchemaManager test failed: ${error}`
					);
				}

			};

		new Notice("Doob Tool Panel Loaded");
	}

	async onClose() {}
}