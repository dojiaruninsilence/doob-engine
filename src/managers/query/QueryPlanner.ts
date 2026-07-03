import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest } from "../../types/query/QueryTypes";
import { QueryPlan, QueryPlanStep } from "../../types/query/QueryPlannerTypes";
import { ContextFactory } from "../ContextFactory";

export class QueryPlanner {

	constructor(
        private contextFactory: ContextFactory
    ) {}

	async plan(
		context: SchemaContext,
		request: QueryRequest
	): Promise<QueryPlan> {

		const stepMap =
			new Map<string, QueryPlanStep>();

		const fieldsToAnalyze = [
			...(request.select ?? []),
			...(request.where?.map(w => w.field) ?? []),
			request.groupBy,
			request.aggregate?.field
		].filter(Boolean) as string[];

		for (const path of fieldsToAnalyze) {

			const parts = path.split(".");
			let currentSchema = context;

			// THIS is the missing piece
			let traversalPath = "";

			for (let i = 0; i < parts.length - 1; i++) {

				const field = parts[i];

				const fieldDef =
					currentSchema.schema.fields[field];

				if (
					!fieldDef ||
					(fieldDef.type !== "reference" &&
					 fieldDef.type !== "referenceCollection")
				) {
					break;
				}

				// build correct traversal path
				traversalPath = traversalPath
					? `${traversalPath}.${field}`
					: field;

				const key = [
					currentSchema.schema.name,
					field,
					fieldDef.referenceTarget.ruleset,
					fieldDef.referenceTarget.schema
				].join("|");

				stepMap.set(key, {
					from: currentSchema.schema.name,
					field,
					to: fieldDef.referenceTarget.schema,

					// ⭐ CRITICAL ADDITION
					path: traversalPath,

					cardinality:
						fieldDef.type === "referenceCollection"
							? "many"
							: "one",

					toRuleset:
						fieldDef.referenceTarget.ruleset,

					refType: fieldDef.type
				});

				currentSchema =
					await this.contextFactory.getSchemaContext(
						fieldDef.referenceTarget.ruleset,
						fieldDef.referenceTarget.schema
					);
			}
		}

		return {
			rootSchema: context.schema.name,
			steps: [...stepMap.values()]
		};
	}
}