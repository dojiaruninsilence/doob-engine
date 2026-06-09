import { SchemaManager } from "./SchemaManager";
import { SchemaContext } from "../types/ContextTypes";

export class ContextFactory {

	private schemaManager: SchemaManager;

	constructor(
		schemaManager: SchemaManager
	) {
		this.schemaManager = schemaManager;
	}

	async getSchemaContext(
		ruleset: string,
		schemaName: string
	): Promise<SchemaContext> {

		const schema =
			await this.schemaManager.loadSchema(
				ruleset,
				schemaName
			);

		return {
			ruleset,
			schemaName,
			schema
		};
	}
}