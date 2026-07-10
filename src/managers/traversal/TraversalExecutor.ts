import {
	TraversalPlan,
	TraversalResult,
	TraversalContext,
	TraversalExecutionOptions,
	TraversalMatch
} from "../../types/traversal";

import { TraceLogger } from "../logging/TraceLogger";
import { ValueResolver } from "./resolver/ValueResolver";


interface TraversalCursor {

	nodeId: string;

	branchPath: string[];
}


interface ValueCursor {

	value: any;

	nodeId: string;

	branchPath: string[];
}


export class TraversalExecutor {

	constructor(
		private trace: TraceLogger,
		private resolver: ValueResolver
	) {}


	execute(
		context: TraversalContext,
		rootId: string,
		plan: TraversalPlan,
		options?: TraversalExecutionOptions
	): TraversalResult {


		this.trace.debug(
			"TraversalExecutor",
			"Start",
			{
				rootId,
				plan
			}
		);


		if (!context.graph) {

			this.trace.error(
				"TraversalExecutor",
				"No graph supplied"
			);

			return {
				matches: []
			};
		}


		let nodes: TraversalCursor[] = [
			{
				nodeId: rootId,
				branchPath: []
			}
		];


		let values: ValueCursor[] = [];


		for (const step of plan.steps) {


			switch (step.kind) {


				// ----------------------------------
				// VALUE
				// ----------------------------------

				case "object": {

					const nextValues: ValueCursor[] = [];


					for (const cursor of nodes) {

						const node =
							context.graph.nodes.get(
								cursor.nodeId
							);

						if (!node) {
							continue;
						}


						const result =
							this.resolver.resolve(
								node,
								step,
								context.graph
							);


						this.trace.debug(
							"TraversalExecutor",
							"Resolve",
							{
								nodeId: cursor.nodeId,
								step,
								result
							}
						);


						if (
							!result ||
							result.type !== "value"
						) {
							continue;
						}


						nextValues.push({

							value:
								result.value,

							nodeId:
								cursor.nodeId,

							branchPath:
								[
									...cursor.branchPath
								]
						});
					}


					values = nextValues;

					break;
				}



				// ----------------------------------
				// REFERENCE
				// ----------------------------------

				case "reference": {

					const nextNodes: TraversalCursor[] = [];


					for (const cursor of nodes) {

						const node =
							context.graph.nodes.get(
								cursor.nodeId
							);

						if (!node) {
							continue;
						}


						const result =
							this.resolver.resolve(
								node,
								step,
								context.graph
							);


						if (
							!result ||
							result.type !== "nodes"
						) {
							continue;
						}


						for (const childId of result.nodes) {

							nextNodes.push({

								nodeId:
									childId,

								branchPath:
									[
										...cursor.branchPath,
										cursor.nodeId
									]
							});
						}
					}


					nodes = nextNodes;

					break;
				}



				// ----------------------------------
				// COLLECTION
				// ----------------------------------

				case "collection": {

					const nextNodes: TraversalCursor[] = [];


					for (const cursor of nodes) {

						const node =
							context.graph.nodes.get(
								cursor.nodeId
							);

						if (!node) {
							continue;
						}


						const result =
							this.resolver.resolve(
								node,
								step,
								context.graph
							);


						this.trace.debug(
							"TraversalExecutor",
							"Collection Resolve",
							{
								nodeId:
									cursor.nodeId,

								field:
									step.field,

								result
							}
						);



						if (
							!result ||
							result.type !== "nodes"
						) {
							continue;
						}



						switch(step.mode) {


							case "first": {

								const child =
									result.nodes[0];


								if (child) {

									nextNodes.push({

										nodeId:
											child,

										branchPath:
											[
												...cursor.branchPath,
												cursor.nodeId
											]
									});
								}

								break;
							}



							case "all":
							case "expand": {


								for (const childId of result.nodes) {

									nextNodes.push({

										nodeId:
											childId,

										branchPath:
											[
												...cursor.branchPath,
												cursor.nodeId
											]
									});
								}


								break;
							}
						}
					}


					nodes = nextNodes;

					break;
				}



				default:

					return {
						matches: []
					};
			}



			this.trace.debug(
				"TraversalExecutor",
				"Step complete",
				{
					step,

					nodes:
						nodes.map(
							x => x.nodeId
						),

					values
				}
			);
		}



		// ----------------------------------
		// RETURN NODES
		// ----------------------------------

		if (options?.returnNodes) {

			return {

				matches:
					nodes.map(
						(cursor): TraversalMatch => ({

							value:
								undefined,

							nodeId:
								cursor.nodeId,

							sourceId:
								rootId,

							branchPath:
								cursor.branchPath
						})
					)
			};
		}



		// ----------------------------------
		// RETURN VALUES
		// ----------------------------------

		return {

			matches:
				values.map(
					(value): TraversalMatch => ({

						value:
							value.value,

						nodeId:
							value.nodeId,

						sourceId:
							rootId,

						branchPath:
							value.branchPath
					})
				)
		};
	}
}