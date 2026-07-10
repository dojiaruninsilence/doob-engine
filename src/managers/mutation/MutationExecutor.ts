import { SchemaContext } from "../../types/ContextTypes";
import { MutationResult, MutationRequest } from "../../types/mutation";

import { IDataReader } from "../../interfaces/IDataReader";
import { IDataWriter } from "../../interfaces/IDataWriter";

import { ResolvedRecordGraphBuilder } from "../traversal/ResolvedRecordGraphBuilder";

import { MutationOperationResolver } from "./operations/MutationOperationResolver";
import { MutationTargetResolver } from "./MutationTargetResolver";
import { MutationValidationLayer } from "./validation/MutationValidationLayer";

import { DataMutationWriter } from "./writer/DataMutationWriter";

import { ContextFactory } from "../ContextFactory";
import { TraceLogger } from "../logging/TraceLogger";

import { MutationPlanner } from "./MutationPlanner";
import { TraversalExecutor } from "../traversal/TraversalExecutor";
import { TraversalMatch } from "../../types/traversal";


export class MutationExecutor {

	constructor(
		private reader: IDataReader,
		private writer: IDataWriter,
		private graphBuilder: ResolvedRecordGraphBuilder,
		private mutationPlanner: MutationPlanner,
		private targetResolver: MutationTargetResolver,
		private operationResolver: MutationOperationResolver,
		private trace: TraceLogger,
		private contextFactory: ContextFactory,
		private validator: MutationValidationLayer,
		private traversalExecutor: TraversalExecutor
	) {}


	async execute(
		context: SchemaContext,
		request: MutationRequest
	): Promise<MutationResult> {


		const validation =
			await this.validator.validate(
				context,
				request.select
			);


		if (!validation.valid) {

			return {
				updated: 0,
				skipped: 0,
				errors: validation.errors.map(e => ({
					rootId: "global",
					path: e.path,
					message: e.message
				}))
			};
		}


		let updated = 0;
		let skipped = 0;

		const errors: any[] = [];


		const patches = new Map<
			string,
			{
				record: any;
				schemaName: string;
				changes: Map<string, any>;
			}
		>();



		try {

			const mutationPlan =
				await this.mutationPlanner.plan(
					context,
					request
				);

			this.trace.debug(
				"MutationExecutor",
				"Mutation Plan",
				{
					target: mutationPlan.target,
					traversals: mutationPlan.traversals
				}
			);

			const records =
				await this.reader.getAll(
					context
				);

			const graph =
				await this.graphBuilder.build(
					context,
					records,
					mutationPlan.traversals
				);

			this.trace.debug(
				"MutationExecutor",
				"Mutation Graph Built",
				{
					roots: graph.roots,
					nodes: graph.nodes.size
				}
			);

			const traversalContext = {
				schema: context.schema,
				graph
			};

			const targetPlan =
				mutationPlan.target;

			if (targetPlan.steps.length === 0) {

				throw new Error(
					"Mutation target contains no steps"
				);
			}

			const finalStep =
				targetPlan.steps[
					targetPlan.steps.length - 1
				];

			if (finalStep.kind !== "object") {

				throw new Error(
					"Mutation target must end with object step"
				);
			}

			const targetField =
				finalStep.field;

			const nodeTraversalPlan = {
				...targetPlan,

				steps:
					targetPlan.steps.slice(
						0,
						targetPlan.steps.length - 1
					)
			};

			const targetMatches: TraversalMatch[] = [];

			for (const rootId of graph.roots) {

				const result =
					this.traversalExecutor.execute(
						traversalContext,
						rootId,
						mutationPlan.target
					);

				targetMatches.push(
					...result.matches
				)
			}

			const targets = this.targetResolver.resolve(targetMatches, request.select.split(".").pop()!);

			this.trace.debug(
				"MutationExecutor",
				"Mutation Targets",
				{
					count: targets.length,
					targets
				}
			);

			const seen =
				new Set<string>();

			for (const target of targets) {


				try {


					if (!target.valid) {

						errors.push({
							rootId: target.match.sourceId,
							path: target.field,
							message: "Invalid mutation path"
						});

						continue;
					}



					const key =
						`${target.match.nodeId}:${target.field}`;



					if (seen.has(key)) {

						skipped++;
						continue;
					}



					seen.add(key);



					const node =
						graph.nodes.get(
							target.match.nodeId
						);



					if (!node) {

						skipped++;
						continue;
					}



					const currentValue =
						node.record.data[
							target.field
						];



					const result =
						this.operationResolver.apply(
							currentValue,
							request.operation,
							{
								record: node.record,
								fieldPath: target.field,
								currentValue
							}
						);



					if (result === undefined) {

						skipped++;
						continue;
					}



					this.trace.debug(
						"MutationExecutor",
						"Mutation Applied",
						{
							nodeId: node.id,
							field: target.field,
							before: currentValue,
							after: result
						}
					);



					let patch =
						patches.get(
							node.record.id
						);



					if (!patch) {

						patch = {
							schemaName: node.schema,
							record: node.record,
							changes: new Map()
						};


						patches.set(
							node.record.id,
							patch
						);
					}



					patch.changes.set(
						target.field,
						result
					);



					updated++;



				} catch (e: any) {


					errors.push({
						rootId: target.match.sourceId,
						path: target.field,
						message: e?.message ?? String(e)
					});
				}
			}



			// Apply patches locally

			for (const patch of patches.values()) {


				for (const [
					field,
					value
				] of patch.changes) {


					patch.record.data[field] =
						value;
				}
			}



			const mutationWriter =
				new DataMutationWriter(
					this.writer,
					schemaName =>
						this.contextFactory.getSchemaContext(
							context.ruleset,
							schemaName
						)
				);



			await mutationWriter.save(
				[...patches.values()]
					.map(p => ({
						schemaName: p.schemaName,
						record: p.record
					}))
			);



		} catch (e: any) {


			errors.push({
				rootId: "global",
				path: request.select,
				message: e?.message ?? String(e)
			});


			this.trace.error(
				"MutationExecutor",
				"Fatal mutation error",
				{
					message: e.message
				}
			);
		}



		return {
			updated,
			skipped,
			errors
		};
	}
}