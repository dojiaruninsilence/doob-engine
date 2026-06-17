import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryFilter } from "../../types/QueryTypes";
import { QueryPlan, QueryPlanStep } from "../../types/QueryPlannerTypes";
import { ContextFactory } from "../ContextFactory";
import { Notice } from "obsidian";

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
			let currentSchema = context;

			for (let i = 0; i < parts.length - 1; i++) {

				const field = parts[i];

				const fieldDef =
					currentSchema.schema.fields[field];

				// ❗ only care if THIS segment is a reference
				if (!fieldDef || fieldDef.type !== "reference") {
					break;
				}

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
					isReference: true,
					toRuleset: fieldDef.referenceTarget.ruleset
				});

				currentSchema =
					await this.contextFactory.getSchemaContext(
						fieldDef.referenceTarget.ruleset,
						fieldDef.referenceTarget.schema
					);
			}
		}

		// for (const path of fieldsToAnalyze) {

		// 	const parts = path.split(".");
		// 	let currentContext = context;

		// 	let validChain = true;

		// 	for (let i = 0; i < parts.length - 1; i++) {

		// 		const field = parts[i];

		// 		const fieldDef =
		// 			currentContext.schema.fields[field];

		// 		// 🚨 HARD STOP if invalid
		// 		if (!fieldDef || fieldDef.type !== "reference") {
		// 			validChain = false;
		// 			break;
		// 		}

		// 		const key = [
		// 			currentContext.schema.name,
		// 			field,
		// 			fieldDef.referenceTarget.ruleset,
		// 			fieldDef.referenceTarget.schema
		// 		].join("|");

		// 		if (!stepMap.has(key)) {

		// 			stepMap.set(key, {
		// 				from: currentContext.schema.name,
		// 				field,
		// 				to: fieldDef.referenceTarget.schema,
		// 				isReference: true,
		// 				toRuleset: fieldDef.referenceTarget.ruleset
		// 			});
		// 		}

		// 		currentContext =
		// 			await this.contextFactory.getSchemaContext(
		// 				fieldDef.referenceTarget.ruleset,
		// 				fieldDef.referenceTarget.schema
		// 			);
		// 	}

		// 	// 🚨 IMPORTANT: ONLY ACCEPT FULLY VALID PATHS
		// 	if (!validChain) {
		// 		continue;
		// 	}
		// }

		// for (const path of fieldsToAnalyze) {

		// 	const parts = path.split(".");
		// 	let currentSchema = context.schema.name;

        //     //let currentContext = context;

		// 	for (let i = 0; i < parts.length - 1; i++) {

		// 		const field = parts[i];

		// 		const fieldDef = context.schema.fields[field];
		//             //currentContext.schema.fields[field];

		// 		if (!fieldDef || fieldDef.type !== "reference") {
		// 			continue;
		// 		}

		// 		const key =
		// 			[
		// 				currentSchema,
		// 				field,
		// 				fieldDef.referenceTarget.ruleset,
		// 				fieldDef.referenceTarget.schema
		// 			].join("|");

		// 		if (!stepMap.has(key)) {

		// 			stepMap.set(
		// 				key,
		// 				{
		// 					from: currentSchema,
		// 					field,
		// 					to: fieldDef.referenceTarget.schema,
		// 					isReference: true,
		// 					toRuleset: fieldDef.referenceTarget.ruleset
		// 				}
		// 			);
		// 		}

		// 		// currentContext =
        //         //     await this.contextFactory.getSchemaContext(
        //         //         fieldDef.referenceTarget.ruleset,
        //         //         fieldDef.referenceTarget.schema
        //         //     );

        //         // currentSchema =
		//         //     currentContext.schema.name;
		// 	}
		// }

		return {
			rootSchema: context.schema.name,
			steps: [...stepMap.values()]
		};
	}
}