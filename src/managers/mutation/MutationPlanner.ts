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


export class MutationPlanner {

	constructor(
		private requestBuilder: MutationRequestBuilder,
		private planBuilder: TraversalPlanBuilder
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

// import { SchemaContext } from "../../types/ContextTypes";

// import {
// 	MutationRequest,
// 	MutationPlanSet
// } from "../../types/mutation";

// import {
// 	TraversalRequestSet,
// 	TraversalPlanSet
// } from "../../types/traversal";

// import { MutationRequestBuilder } from "./MutationRequestBuilder";

// import { TraversalPlanBuilder } from "../traversal/TraversalPlanBuilder";

// export class MutationPlanner {

// 	constructor(
// 		private requestBuilder: MutationRequestBuilder,
// 		private planBuilder: TraversalPlanBuilder
// 	) {}

// 	async plan(
// 		context: SchemaContext,
// 		request: MutationRequest
// 	): Promise<MutationPlanSet> {

// 		const requestSet =
// 			await this.requestBuilder.build(
// 				context,
// 				request
// 			);

// 		const traversalRequests: TraversalRequestSet = {

// 			select: [
// 				requestSet.target
// 			],

// 			where:
// 				requestSet.where,

// 			groupBy:
// 				undefined,

// 			aggregate:
// 				undefined
// 		};

// 		const traversals =
// 			this.planBuilder.build(
// 				traversalRequests
// 			);

// 		return {

// 			targetPath:
// 				request.select,

// 			traversals
// 		};
// 	}
// }


// import { SchemaContext } from "../../types/ContextTypes";

// import { MutationRequest, MutationPlanSet } from "../../types/mutation";

// import { MutationRequestBuilder } from "./MutationRequestBuilder";

// import { TraversalPlanner } from "../traversal/TraversalPlanner";

// export class MutationPlanner {

//     constructor(
//         private requestBuilder: MutationRequestBuilder,
//         private traversalPlanner: TraversalPlanner
//     ) {}

//     async plan(
//         context: SchemaContext,
//         request: MutationRequest
//     ): Promise<MutationPlanSet> {

//         const requestSet =
//             await this.requestBuilder.build(
//                 context,
//                 request
//             );


//         const target =
//             this.traversalPlanner.build(
//                 requestSet.target
//             );


//         const where =
//             requestSet.where.map(
//                 traversalRequest =>
//                     this.traversalPlanner.build(
//                         traversalRequest
//                     )
//             );


//         return {
//             target,
//             where
//         };
//     }
// }

// import { SchemaContext } from "../../types/ContextTypes";
// import { MutationRequest } from "../../types/mutation/MutationTypes";
// import { MutationPlan, MutationPlanStep } from "../../types/mutation/MutationPlanTypes";

// export class MutationPlanner {

//     async plan(
//         context: SchemaContext,
//         request: MutationRequest
//     ): Promise<MutationPlan> {

//         const steps: MutationPlanStep[] = [];

//         const select = request.select;

//         const parts = select.split(".");
//         if (parts.length === 0) {
//             return { steps };
//         }

//         const field = parts[parts.length - 1];
//         const traversal = parts.slice(0, -1);

//         const operationType = request.operation.type;

//         steps.push({
//             select,
//             traversal,
//             field,
//             operationType,
//             safe: true // we can upgrade this later with schema validation
//         });

//         return { steps };
//     }
// }