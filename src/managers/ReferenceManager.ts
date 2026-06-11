import { IDataReader } from "../interfaces/IDataReader";
import { SchemaContext } from "../types/ContextTypes";
import { ContextFactory } from "./ContextFactory";

export class ReferenceManager {

	constructor(
		private dataManager: IDataReader,
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

	async resolveById(
		context: SchemaContext,
		id: string
	) {
		// try current context first
		let record =
			await this.dataManager.getById(context, id);

		if (record) return record;

		// optional: search other known contexts in ruleset (future upgrade)
		return null;
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

	// --------------------------------------------------
	// Validate record references
	// --------------------------------------------------

	async validateRecordReferences(
		context: SchemaContext,
		recordData: Record<string, any>
	): Promise<string[]> {

		const errors: string[] = [];

		for (const [fieldName, field] of Object.entries(context.schema.fields)) {

			if (field.type !== "reference") {
				continue;
			}

			const value = recordData[fieldName];

			if (
				value === undefined ||
				value === null ||
				value === ""
			) {
				continue;
			}

			const valid =
				await this.validate(
					context,
					fieldName,
					value
				);

			if (!valid) {
				errors.push(
					`Invalid reference in '${fieldName}': ${value}`
				);
			}
		}

		return errors;
	}

	// --------------------------------------------------
	// Hydrate record
	// --------------------------------------------------

	async hydrateRecord(
		context: SchemaContext,
		recordData: Record<string, any>
	): Promise<Record<string, any>> {

		const hydrated =
			structuredClone(recordData);

		hydrated._resolved = {};

		for (
			const [fieldName, field]
			of Object.entries(context.schema.fields)
		) {

			if (field.type !== "reference") {
				continue;
			}

			const value =
				recordData[fieldName];

			if (!value) {
				continue;
			}

			const resolved =
				await this.resolve(
					context,
					fieldName,
					value
				);

			hydrated._resolved[fieldName] =
				resolved ?? null;
		}

		return hydrated;
	}
}