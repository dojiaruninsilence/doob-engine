import { TraversalMatch } from "../../types/traversal";
import { MutationTarget } from "../../types/mutation/MutationTargetTypes";
import { TraceLogger } from "../logging/TraceLogger";

export class MutationTargetResolver {

    constructor(trace: TraceLogger) {}

	resolve(
		matches: TraversalMatch[],
		field: string
	): MutationTarget[] {

		const targets: MutationTarget[] = [];

		for (const match of matches) {

			targets.push({
				match,
				field,
				valid: true
			});
		}

		return targets;
	}
}

// import { ResolvedRecordGraph } from "../../types/query/ResolvedRecordGraph";
// import { TraversalPlan } from "../../types/traversal";
// import { MutationTarget } from "../../types/mutation/MutationTargetTypes";


// export class MutationTargetResolver {


//     resolve(
//         graph: ResolvedRecordGraph,
//         plan: TraversalPlan
//     ): MutationTarget[] {


//         const targets: MutationTarget[] = [];


//         const steps =
//             plan.steps;


//         if (steps.length === 0) {
//             return targets;
//         }


//         const finalStep =
//             steps[steps.length - 1];


//         if (finalStep.kind !== "object") {

//             throw new Error(
//                 "Mutation target must end with object step"
//             );
//         }


//         const traversalSteps =
//             steps.slice(
//                 0,
//                 steps.length - 1
//             );



//         for (const rootId of graph.roots) {


//             let currentNodes = [
//                 graph.nodes.get(rootId)
//             ].filter(Boolean);



//             let valid = true;



//             for (const step of traversalSteps) {


//                 const nextNodes: typeof currentNodes = [];



//                 for (const node of currentNodes) {


//                     if (!node) {
//                         continue;
//                     }



//                     const refs =
//                         node.refs.get(step.field)
//                         ?? [];



//                     for (const refId of refs) {


//                         const target =
//                             graph.nodes.get(refId);



//                         if (target) {

//                             nextNodes.push(
//                                 target
//                             );
//                         }
//                     }
//                 }



//                 if (nextNodes.length === 0) {

//                     valid = false;
//                     break;
//                 }



//                 currentNodes =
//                     nextNodes;
//             }



//             if (!valid) {


//                 targets.push({

//                     rootId,

//                     nodeId: rootId,

//                     field:
//                         finalStep.field,

//                     valid: false
//                 });


//                 continue;
//             }



//             for (const node of currentNodes) {


//                 if (!node) {
//                     continue;
//                 }


//                 targets.push({

//                     rootId,

//                     nodeId:
//                         node.id,

//                     field:
//                         finalStep.field,

//                     valid: true
//                 });
//             }
//         }


//         return targets;
//     }
// }

// import { ResolvedRecordGraph } from "../../types/query/ResolvedRecordGraph";
// import { MutationTarget } from "../../types/mutation/MutationTargetTypes";

// export class MutationTargetResolver {

//     resolve(
//         graph: ResolvedRecordGraph,
//         select: string
//     ): MutationTarget[] {

//         const targets: MutationTarget[] = [];

//         const parts = select.split(".");

//         if (parts.length === 0) {
//             return targets;
//         }

//         const field =
//             parts[parts.length - 1];

//         const traversal =
//             parts.slice(0, parts.length - 1);

//         for (const rootId of graph.roots) {

//             let currentNodes = [
//                 graph.nodes.get(rootId)
//             ].filter(Boolean);

//             if (currentNodes.length === 0) {
//                 continue;
//             }

//             let valid = true;

//             for (const part of traversal) {

//                 const nextNodes: typeof currentNodes = [];

//                 for (const node of currentNodes) {

//                     if (!node) {
//                         continue;
//                     }

//                     const refs =
//                         node.refs.get(part) ?? [];

//                     for (const refId of refs) {

//                         const target =
//                             graph.nodes.get(refId);

//                         if (target) {
//                             nextNodes.push(target);
//                         }
//                     }
//                 }

//                 if (nextNodes.length === 0) {
//                     valid = false;
//                     break;
//                 }

//                 currentNodes = nextNodes;
//             }

//             if (!valid) {

//                 targets.push({
//                     rootId,
//                     nodeId: rootId,
//                     fieldPath: field,
//                     valid: false
//                 });

//                 continue;
//             }

//             for (const node of currentNodes) {

//                 if (!node) {
//                     continue;
//                 }

//                 targets.push({
//                     rootId,
//                     nodeId: node.id,
//                     fieldPath: field,
//                     valid: true
//                 });
//             }
//         }

//         return targets;
//     }
// }