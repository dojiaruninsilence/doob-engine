import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryFilter } from "../../types/QueryTypes";
import { QueryPlan, QueryPlanStep } from "../../types/QueryPlannerTypes";
import { ContextFactory } from "../ContextFactory";

export class QueryPlanner {

	constructor(
        private contextFactory: ContextFactory
    ) {}

	async plan(
		context: SchemaContext,
		request: QueryRequest
	): Promise<QueryPlan> {

		//const steps: QueryPlanStep[] = [];
		const stepMap =
    		new Map<string, QueryPlanStep>();

		const fieldsToAnalyze = [
			...(request.select ?? []),
			...(request.where?.map(w => w.field) ?? []),
			request.groupBy
		].filter(Boolean) as string[];

		for (const path of fieldsToAnalyze) {

			const parts = path.split(".");
			let currentSchema = context.schema.name;

            let currentContext = context;

			for (let i = 0; i < parts.length - 1; i++) {

				const field = parts[i];

				const fieldDef =
		            currentContext.schema.fields[field];

				if (!fieldDef || fieldDef.type !== "reference") {
					continue;
				}

				const key =
					[
						currentSchema,
						field,
						fieldDef.referenceTarget.ruleset,
						fieldDef.referenceTarget.schema
					].join("|");

				if (!stepMap.has(key)) {

					stepMap.set(
						key,
						{
							from: currentSchema,
							field,
							to: fieldDef.referenceTarget.schema,
							isReference: true,
							toRuleset: fieldDef.referenceTarget.ruleset
						}
					);
				}

				currentContext =
                    await this.contextFactory.getSchemaContext(
                        fieldDef.referenceTarget.ruleset,
                        fieldDef.referenceTarget.schema
                    );

                currentSchema =
		            currentContext.schema.name;
			}
		}

		return {
			rootSchema: context.schema.name,
			steps: [...stepMap.values()]
		};
	}
}