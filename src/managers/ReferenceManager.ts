import { DataManager } from "./DataManager";
import { SchemaContext } from "../types/ContextTypes";
import { ContextFactory } from "./ContextFactory";

export class ReferenceManager {

	constructor(
		private dataManager: DataManager,
		private contextFactory: ContextFactory
	) {}

	// --------------------------------------------------
	// RESOLVE SINGLE REFERENCE
	// --------------------------------------------------

	async resolve(
		context: SchemaContext,
		fieldName: string,
		id: string
	): Promise<any | null> {

		if (!id) return null;

		const schema =
			context.schema;

		const field =
			schema.fields[fieldName];

		if (!field || field.type !== "reference") {
			throw new Error(
				`Field ${fieldName} is not a reference`
			);
		}

		const target =
			field.referenceTarget;

		if (!target) {
			throw new Error(
				`Reference field missing target metadata`
			);
		}

		const targetContext =
			await this.contextFactory.getSchemaContext(
				target.ruleset,
				target.schema
			);

		return this.dataManager.getById(
			targetContext,
			id
		);
	}

	// --------------------------------------------------
	// VALIDATE REFERENCE
	// --------------------------------------------------

	async validate(
		context: SchemaContext,
		fieldName: string,
		id: string
	): Promise<boolean> {

		const resolved =
			await this.resolve(
				context,
				fieldName,
				id
			);

		return resolved !== undefined;
	}
}