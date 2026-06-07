import { App, TFile, normalizePath } from "obsidian";
import { Schema } from "../types/SchemaTypes";

export class SchemaManager {

	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	private getSchemaFolder(): string {
		return "Doob Engine/Schemas";
	}

	private getSchemaPath(
		name: string
	): string {

		return normalizePath(
			`${this.getSchemaFolder()}/${name}.json`
		);
	}

	async ensureFolderExists() {

		const folder =
			this.getSchemaFolder();

		if (
			!this.app.vault.getAbstractFileByPath(folder)
		) {
			await this.app.vault.createFolder(folder);
		}
	}

	async ensureSchemaExists(
		name: string
	) {

		await this.ensureFolderExists();

		const path =
			this.getSchemaPath(name);

		if (
			!this.app.vault.getAbstractFileByPath(path)
		) {

			const schema: Schema = {
				name,
				fields: {}
			};

			await this.app.vault.create(
				path,
				JSON.stringify(
					schema,
					null,
					2
				)
			);
		}
	}

	async loadSchema(
		name: string
	): Promise<Schema> {

		await this.ensureSchemaExists(name);

		const path =
			this.getSchemaPath(name);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		const content =
			await this.app.vault.read(file);

		return JSON.parse(content);
	}

	async saveSchema(
		schema: Schema
	) {

		await this.ensureSchemaExists(
			schema.name
		);

		const path =
			this.getSchemaPath(
				schema.name
			);

		const file =
			this.app.vault.getAbstractFileByPath(path) as TFile;

		await this.app.vault.modify(
			file,
			JSON.stringify(
				schema,
				null,
				2
			)
		);
	}
}