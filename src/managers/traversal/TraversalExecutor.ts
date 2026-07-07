import { TraversalPlan, TraversalResult, TraversalContext, ResolvedValue } from "../../types/traversal";
import { TraceLogger } from "../logging/TraceLogger";
import { ValueResolver } from "./resolver/ValueResolver";

export class TraversalExecutor {

	constructor(
		private trace: TraceLogger,
		private resolver: ValueResolver
	) {}

	execute(
		context: TraversalContext,
		rootId: string,
		plan: TraversalPlan
	): TraversalResult {

		if (!context.graph) {

			this.trace.error(
				"TraversalExecutor",
				"No graph supplied to traversal context"
			);

			return {
				value: undefined,
				nodes: []
			};
		}

        const root =
            context.graph.nodes.get(rootId);

        this.trace.debug(
            "TraversalExecutor",
            "Root Node",
            {
                id: root?.id,
                schema: root?.schema,
                refs: root
                    ? [...root.refs.entries()]
                    : []
            }
        );

		let currentNodeIds: string[] = [rootId];
		let finalValues: any[] = [];

		for (const step of plan.steps) {

			const nextNodeIds: string[] = [];
			const nextValues: any[] = [];

			// -----------------------------------
			// STEP PROCESSING (STRICT RESOLVER CONTRACT)
			// -----------------------------------

			switch (step.kind) {

				// ===================================
				// OBJECT
				// ===================================
				case "object": {

					for (const nodeId of currentNodeIds) {

						const node =
							context.graph.nodes.get(nodeId);

						if (!node) continue;

						let result;

						try {
							this.trace.debug("TraversalExecutor", "Entered Try");

							result =
							this.resolver.resolve(node, step, context.graph);

							this.trace.debug(
								"TraversalExecutor",
								"Collection Resolve",
								{
									nodeId,
									field: step.field,
									result
								}
							);
						}

						catch (error) {

							this.trace.error(
								"TraversalExecutor",
								"Resolver Failed",
								{
									step,
									nodeId,
									message:
										error instanceof Error
											? error.message
											: String(error),

									stack:
										error instanceof Error
											? error.stack
											: undefined
								}
							);

							throw error;
						}

						if (!result || result.type !== "value") {
							continue;
						}

						nextValues.push(result.value);
					}

					finalValues = nextValues;
					break;
				}

				// ===================================
				// REFERENCE
				// ===================================
				case "reference": {

					for (const nodeId of currentNodeIds) {

						const node =
							context.graph.nodes.get(nodeId);

						if (!node) continue;

						let result;

						try {
							this.trace.debug("TraversalExecutor", "Entered Try");

							result =
							this.resolver.resolve(node, step, context.graph);

							this.trace.debug(
								"TraversalExecutor",
								"Collection Resolve",
								{
									nodeId,
									field: step.field,
									result
								}
							);
						}

						catch (error) {

							this.trace.error(
								"TraversalExecutor",
								"Resolver Failed",
								{
									step,
									nodeId,
									message:
										error instanceof Error
											? error.message
											: String(error),

									stack:
										error instanceof Error
											? error.stack
											: undefined
								}
							);

							throw error;
						}

						if (!result || result.type !== "nodes") {
							continue;
						}

						nextNodeIds.push(...result.nodes);
					}

					currentNodeIds = nextNodeIds;
					break;
				}

				// ===================================
				// COLLECTION
				// ===================================
				case "collection": {

					for (const nodeId of currentNodeIds) {

						const node =
							context.graph.nodes.get(nodeId);

						if (!node) continue;

						let result;

						try {
							this.trace.debug("TraversalExecutor", "Entered Try");

							result =
							this.resolver.resolve(node, step, context.graph);

							this.trace.debug(
								"TraversalExecutor",
								"Collection Resolve",
								{
									nodeId,
									field: step.field,
									result
								}
							);
						}

						catch (error) {

							this.trace.error(
								"TraversalExecutor",
								"Resolver Failed",
								{
									step,
									nodeId,
									message:
										error instanceof Error
											? error.message
											: String(error),

									stack:
										error instanceof Error
											? error.stack
											: undefined
								}
							);

							throw error;
						}

						if (!result || result.type !== "nodes") {
							continue;
						}

						switch (step.mode) {

							case "first":
								if (result.nodes.length > 0) {
									nextNodeIds.push(result.nodes[0]);
								}
								break;

							case "all":
							case "expand":
								nextNodeIds.push(...result.nodes);
								break;
						}
					}

					currentNodeIds = nextNodeIds;
					break;
				}

				default: {

					return {
						value: undefined,
						nodes: []
					};
				}
			}

			this.trace.debug(
				"TraversalExecutor",
				"Step complete",
				{
					step,
					nodeCount: currentNodeIds.length,
					valueCount: finalValues.length,
					currentNodeIds,
					finalValues
				}
			);
		}

		return {
			value: finalValues.length === 1
				? finalValues[0]
				: finalValues,
			nodes: currentNodeIds
		};
	}
}