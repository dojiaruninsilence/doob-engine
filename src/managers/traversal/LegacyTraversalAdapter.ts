import { SchemaContext } from "../../types/ContextTypes";

import {
	TraversalRequest,
	TraversalStep
} from "../../types/traversal";

import { ContextFactory } from "../ContextFactory";

export class LegacyTraversalAdapter {

	constructor(
		private contextFactory: ContextFactory
	) {}

	async buildRequest(
		context: SchemaContext,
		path: string
	): Promise<TraversalRequest> {

		const parts = path.split(".");

		const steps: TraversalStep[] = [];

		let currentSchema = context.schema;

		for (const part of parts) {

			const field =
				currentSchema.fields?.[part];

			if (!field) {
				throw new Error(
					`Missing field: ${part} on schema ${currentSchema.name}`
				);
			}

			// -----------------------------
			// Reference Collection
			// -----------------------------

			if (field.type === "referenceCollection") {

				steps.push({
					kind: "collection",
					field: part,
					mode: "expand"
				});

				if (field.referenceTarget) {

					const nextContext =
						await this.contextFactory.getSchemaContext(
							field.referenceTarget.ruleset,
							field.referenceTarget.schema
						);

					currentSchema =
						nextContext.schema;
				}

				continue;
			}

			// -----------------------------
			// Reference
			// -----------------------------

			if (field.type === "reference") {

				steps.push({
					kind: "reference",
					field: part
				});

				if (field.referenceTarget) {

					const nextContext =
						await this.contextFactory.getSchemaContext(
							field.referenceTarget.ruleset,
							field.referenceTarget.schema
						);

					currentSchema =
						nextContext.schema;
				}

				continue;
			}

			// -----------------------------
			// Everything else
			// -----------------------------

			steps.push({
				kind: "object",
				field: part
			});
		}

		return {
			rootSchema: context.schema.name,
			steps
		};
	}
}