import { SchemaContext } from "../../types/ContextTypes";

import {
	MutationRequest,
	MutationPlanSet
} from "../../types/mutation";

import {
	TraversalRequestSet
} from "../../types/traversal";

import { MutationRequestBuilder } from "./MutationRequestBuilder";

import { TraversalPlanBuilder } from "../traversal/TraversalPlanBuilder";
import { TraceLogger } from "../logging/TraceLogger";


export class MutationPlanner {

	constructor(
		private requestBuilder: MutationRequestBuilder,
		private planBuilder: TraversalPlanBuilder,
		private trace: TraceLogger
	) {}


	async plan(
		context: SchemaContext,
		request: MutationRequest
	): Promise<MutationPlanSet> {


		const requestSet =
			await this.requestBuilder.build(
				context,
				request
			);



		// -----------------------------
		// Build mutation target plan
		// -----------------------------

		const targetRequests: TraversalRequestSet = {

			select: [
				requestSet.target
			],

			where: [],

			groupBy: undefined,

			aggregate: undefined
		};


		const targetPlans =
			this.planBuilder.build(
				targetRequests
			);



		const target =
			targetPlans.select[0];



		if (!target) {

			throw new Error(
				"Mutation target traversal missing"
			);
		}



		// -----------------------------
		// Build supporting traversals
		// -----------------------------

		const traversalRequests: TraversalRequestSet = {

			select: [
				requestSet.target
			],

			where:
				requestSet.where,

			groupBy: undefined,

			aggregate: undefined
		};



		const traversals =
			this.planBuilder.build(
				traversalRequests
			);



		return {

			target,

			traversals
		};
	}
}