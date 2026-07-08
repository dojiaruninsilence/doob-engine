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

		for (let i = 0; i < parts.length; i++) {

			const part = parts[i];

			const isFinal =
				i === parts.length - 1;

			const field =
				currentSchema.fields?.[part];

			if (!field) {
				throw new Error(
					`Missing field: ${part} on schema ${currentSchema.name}`
				);
			}


			// --------------------------------------------------
			// Final segment is ALWAYS an object/value read
			// --------------------------------------------------
			if (isFinal) {

				steps.push({
					kind: "object",
					field: part
				});

				break;
			}


			// --------------------------------------------------
			// Reference Collection
			// --------------------------------------------------

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


			// --------------------------------------------------
			// Reference
			// --------------------------------------------------

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


			// --------------------------------------------------
			// Intermediate object
			// --------------------------------------------------

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