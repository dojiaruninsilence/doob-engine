import {
	TraversalPlan,
	TraversalRequest,
	TraversalStep
} from "../../types/traversal";
import { TraceLogger } from "../logging/TraceLogger";

export class TraversalPlanner {

    constructor(trace: TraceLogger){}

	build(
		request: TraversalRequest
	): TraversalPlan {

		if (!request.rootSchema) {
			throw new Error(
				"TraversalRequest missing rootSchema"
			);
		}

		if (!request.steps?.length) {
			throw new Error(
				"TraversalRequest contains no steps"
			);
		}

		const steps: TraversalStep[] = [];

		for (const step of request.steps) {

			switch (step.kind) {

				case "reference": {

					if (!step.field) {
						throw new Error(
							"ReferenceStep missing field"
						);
					}

					steps.push({
						kind: "reference",
						field: step.field
					});

					break;
				}

				case "object": {

					if (!step.field) {
						throw new Error(
							"ObjectStep missing field"
						);
					}

					steps.push({
						kind: "object",
						field: step.field
					});

					break;
				}

				case "collection": {

					if (!step.field) {
						throw new Error(
							"CollectionStep missing field"
						);
					}

					steps.push({
						kind: "collection",
						field: step.field,
						mode: step.mode
					});

					break;
				}

				default:
					throw new Error(
						`Unknown traversal step`
					);
			}
		}

		return {
			rootSchema: request.rootSchema,
			steps
		};
	}
}