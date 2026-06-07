import { App, TFile, normalizePath } from "obsidian";
import { Schema } from "../types/SchemaTypes";
import { RulesetManager } from "./RulesetManager";

export class SchemaManager {

	private app: App;
	private rulesetManager: RulesetManager;

	constructor(
		app: App,
		rulesetManager: RulesetManager
	) {
		this.app = app;
		this.rulesetManager = rulesetManager;
	}

	// --------------------------------------------------
	// PATH
	// --------------------------------------------------

	private getSchemaPath(
		ruleset: string,
		name: string
	): string {

		return normalizePath(
			`${this.rulesetManager.getSchemaFolder(
				ruleset
			)}/${name}.json`
		);
	}

	// --------------------------------------------------
	// CREATE / ENSURE
	// --------------------------------------------------

	async ensureSchemaExists(
		ruleset: string,
		name: string
	) {
		await this.rulesetManager.ensureRulesetExists(
			ruleset
		);

		const path =
			this.getSchemaPath(ruleset, name);

		if (
			!this.app.vault.getAbstractFileByPath(path)
		) {

			const schema: Schema = {
				name,
				fields: {}
			};

			await this.app.vault.create(
				path,
				JSON.stringify(schema, null, 2)
			);
		}
	}

	// --------------------------------------------------
	// LOAD
	// --------------------------------------------------

	async loadSchema(
		ruleset: string,
		name: string
	): Promise<Schema> {

		await this.ensureSchemaExists(ruleset, name);

		const path =
			this.getSchemaPath(ruleset, name);

		const file =
			this.app.vault.getAbstractFileByPath(
				path
			) as TFile;

		const content =
			await this.app.vault.read(file);

		return JSON.parse(content);
	}

	// --------------------------------------------------
	// SAVE
	// --------------------------------------------------

	async saveSchema(
		ruleset: string,
		schema: Schema
	) {

		await this.ensureSchemaExists(
			ruleset,
			schema.name
		);

		const path =
			this.getSchemaPath(
				ruleset,
				schema.name
			);

		const file =
			this.app.vault.getAbstractFileByPath(
				path
			) as TFile;

		await this.app.vault.modify(
			file,
			JSON.stringify(schema, null, 2)
		);
	}

	// --------------------------------------------------
	// FIELD OPS
	// --------------------------------------------------

	async addField(
		ruleset: string,
		schemaName: string,
		fieldName: string,
		type: string,
		defaultValue: any
	) {

		const schema =
			await this.loadSchema(
				ruleset,
				schemaName
			);

		schema.fields[fieldName] = {
			type,
			default: defaultValue
		};

		await this.saveSchema(
			ruleset,
			schema
		);
	}
}