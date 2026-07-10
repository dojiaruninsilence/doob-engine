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

// import { TraversalPlan, TraversalResult, TraversalContext, ResolvedValue, TraversalExecutionOptions } from "../../types/traversal";
// import { TraceLogger } from "../logging/TraceLogger";
// import { ValueResolver } from "./resolver/ValueResolver";

// export class TraversalExecutor {

// 	constructor(
// 		private trace: TraceLogger,
// 		private resolver: ValueResolver
// 	) {}

// 	execute(
// 		context: TraversalContext,
// 		rootId: string,
// 		plan: TraversalPlan,
// 		options?: TraversalExecutionOptions
// 	): TraversalResult {

// 		this.trace.debug("TraversalExecutor", "Start", { context, rootId, plan })

// 		if (!context.graph) {

// 			this.trace.error(
// 				"TraversalExecutor",
// 				"No graph supplied to traversal context"
// 			);

// 			return {
// 				matches: []
// 			};
// 		}

//         const root =
//             context.graph.nodes.get(rootId);

//         this.trace.debug(
//             "TraversalExecutor",
//             "Root Node",
//             {
//                 id: root?.id,
//                 schema: root?.schema,
//                 refs: root
//                     ? [...root.refs.entries()]
//                     : []
//             }
//         );

// 		let currentNodeIds: string[] = [rootId];
// 		let finalValues: any[] = [];
// 		let currentBranchPaths: string[][] = [
// 			[]
// 		];

// 		for (const step of plan.steps) {

// 			const nextNodeIds: string[] = [];
// 			const nextValues: any[] = [];

// 			const nextBranchPaths: string[][] = [
// 				[]
// 			];

// 			// -----------------------------------
// 			// STEP PROCESSING (STRICT RESOLVER CONTRACT)
// 			// -----------------------------------

// 			switch (step.kind) {

// 				// ===================================
// 				// OBJECT
// 				// ===================================
// 				case "object": {

// 					for (const nodeId of currentNodeIds) {

// 						const node =
// 							context.graph.nodes.get(nodeId);

// 						if (!node) continue;

// 						let result;

// 						try {
// 							this.trace.debug("TraversalExecutor", "Entered Try");

// 							result =
// 							this.resolver.resolve(node, step, context.graph);

// 							this.trace.debug(
// 								"TraversalExecutor",
// 								"Collection Resolve",
// 								{
// 									nodeId,
// 									field: step.field,
// 									result
// 								}
// 							);
// 						}

// 						catch (error) {

// 							this.trace.error(
// 								"TraversalExecutor",
// 								"Resolver Failed",
// 								{
// 									step,
// 									nodeId,
// 									message:
// 										error instanceof Error
// 											? error.message
// 											: String(error),

// 									stack:
// 										error instanceof Error
// 											? error.stack
// 											: undefined
// 								}
// 							);

// 							throw error;
// 						}

// 						if (!result || result.type !== "value") {
// 							continue;
// 						}

// 						nextValues.push(result.value);
// 					}

// 					finalValues = nextValues;
// 					break;
// 				}

// 				// ===================================
// 				// REFERENCE
// 				// ===================================
// 				case "reference": {

// 					// for (const nodeId of currentNodeIds) {
// 					for (let index = 0; index < currentNodeIds.length; index++) {

// 						const nodeId =
// 							currentNodeIds[index];

// 						// const branchPath =
// 						// 	currentBranchPaths[index];

// 						const node =
// 							context.graph.nodes.get(nodeId);

// 						if (!node) continue;

// 						let result;

// 						try {
// 							this.trace.debug("TraversalExecutor", "Entered Try");

// 							result =
// 							this.resolver.resolve(node, step, context.graph);

// 							this.trace.debug(
// 								"TraversalExecutor",
// 								"Collection Resolve",
// 								{
// 									nodeId,
// 									field: step.field,
// 									result
// 								}
// 							);
// 						}

// 						catch (error) {

// 							this.trace.error(
// 								"TraversalExecutor",
// 								"Resolver Failed",
// 								{
// 									step,
// 									nodeId,
// 									message:
// 										error instanceof Error
// 											? error.message
// 											: String(error),

// 									stack:
// 										error instanceof Error
// 											? error.stack
// 											: undefined
// 								}
// 							);

// 							throw error;
// 						}

// 						if (!result || result.type !== "nodes") {
// 							continue;
// 						}

// 						for (const childId of result.nodes) {

// 							nextNodeIds.push(childId);

// 							nextBranchPaths.push([
// 								...currentBranchPaths[index],
// 								nodeId
// 							]);
// 						}

// 						// nextNodeIds.push(...result.nodes);
// 					}

// 					currentNodeIds = nextNodeIds;
// 					currentBranchPaths = nextBranchPaths;
// 					break;
// 				}

// 				// ===================================
// 				// COLLECTION
// 				// ===================================
// 				case "collection": {

// 					// for (const nodeId of currentNodeIds) {
// 					for (let index = 0; index < currentNodeIds.length; index++) {

// 						const nodeId =
// 							currentNodeIds[index];

// 						// const branchPath =
// 						// 	currentBranchPaths[index];

// 						const node =
// 							context.graph.nodes.get(nodeId);

// 						if (!node) continue;

// 						let result;

// 						try {
// 							this.trace.debug("TraversalExecutor", "Entered Try");

// 							result =
// 							this.resolver.resolve(node, step, context.graph);

// 							this.trace.debug(
// 								"TraversalExecutor",
// 								"Collection Resolve",
// 								{
// 									nodeId,
// 									field: step.field,
// 									result
// 								}
// 							);
// 						}

// 						catch (error) {

// 							this.trace.error(
// 								"TraversalExecutor",
// 								"Resolver Failed",
// 								{
// 									step,
// 									nodeId,
// 									message:
// 										error instanceof Error
// 											? error.message
// 											: String(error),

// 									stack:
// 										error instanceof Error
// 											? error.stack
// 											: undefined
// 								}
// 							);

// 							throw error;
// 						}

// 						if (!result || result.type !== "nodes") {
// 							continue;
// 						}

// 						switch (step.mode) {

// 							case "first":
// 								if (result.nodes.length > 0) {
// 									nextNodeIds.push(result.nodes[0]);
// 								}
// 								break;

// 							case "all":
// 							case "expand":
// 								// nextNodeIds.push(...result.nodes);
// 								for (const childId of result.nodes) {

// 									nextNodeIds.push(childId);

// 									nextBranchPaths.push([
// 										...currentBranchPaths[index],
// 										nodeId
// 									]);
// 								}
// 								break;
// 						}
// 					}

// 					currentNodeIds = nextNodeIds;
// 					currentBranchPaths = nextBranchPaths;
// 					break;
// 				}

// 				default: {

// 					return {
// 						matches: []
// 					};
// 				}
// 			}

// 			this.trace.debug(
// 				"TraversalExecutor",
// 				"Step complete",
// 				{
// 					step,
// 					nodeCount: currentNodeIds.length,
// 					valueCount: finalValues.length,
// 					currentNodeIds,
// 					finalValues
// 				}
// 			);
// 		}

// 		if (options?.returnNodes) {

// 			return {
// 				matches:
// 					currentNodeIds.map(
// 						(nodeId, index) => ({
// 							value: undefined,

// 							nodeId,

// 							sourceId: rootId,

// 							branchPath:
// 								currentBranchPaths[index]
// 						})
// 					)
// 			};

// 			// return {
// 			// 	matches:
// 			// 		currentNodeIds.map(
// 			// 			nodeId => ({
// 			// 				value: undefined,
// 			// 				nodeId,
// 			// 				sourceId: rootId
// 			// 			})
// 			// 		)
// 			// };
// 		}

// 		return {
// 			matches:
// 				finalValues.map(
// 					(value, index) => ({
// 						value,

// 						nodeId:
// 							currentNodeIds[index],

// 						sourceId:
// 							rootId,

// 						branchPath:
// 							currentBranchPaths[index]
// 					})
// 				)
// 		};

// 		// return {
// 		// 	matches: finalValues.map(
// 		// 		(value, index) => ({
// 		// 			value,
// 		// 			nodeId: currentNodeIds[index],
// 		// 			sourceId: rootId
// 		// 		})
// 		// 	)
// 		// };
// 	}
// }