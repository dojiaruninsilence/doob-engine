// import { QueryPlan } from "../../../types/query/QueryPlannerTypes";
// import { QueryMatch } from "../../../types/query/QueryMatchTypes";
// import { ResolvedRecordGraph } from "../../../types/query/ResolvedRecordGraph";
// import { Notice } from "obsidian";

// export class QueryMatchBuilder {

//     build(
//         graph: ResolvedRecordGraph,
//         plan: QueryPlan
//     ): QueryMatch[] {

//         let matches: QueryMatch[] = [];

//         // ----------------------------------
//         // INIT ROOTS
//         // ----------------------------------

//         for (const rootId of graph.roots) {

//             matches.push({
//                 rootId,
//                 currentId: rootId,

//                 pathNodes: [rootId],
//                 pathIndexes: [],

//                 bindings: {}
//             });
//         }

//         // ----------------------------------
//         // TRAVERSE PLAN
//         // ----------------------------------

//         for (const step of plan.steps) {

//             const nextMatches: QueryMatch[] = [];

//             for (const match of matches) {

//                 const sourceNode =
//                     graph.nodes.get(match.currentId);

//                 if (!sourceNode) continue;

//                 const refs =
//                     sourceNode.refs.get(step.field) ?? [];

//                 if (refs.length === 0) continue;

//                 const pathKey =
//                     `${step.from}.${step.field}`;

//                 for (let index = 0; index < refs.length; index++) {

//                     const refId = refs[index];

//                     nextMatches.push({
//                         rootId: match.rootId,
//                         currentId: refId,

//                         // ----------------------------------
//                         // CRITICAL: structural trace
//                         // ----------------------------------
//                         pathNodes: [
//                             ...match.pathNodes,
//                             refId
//                         ],

//                         // ----------------------------------
//                         // CRITICAL: decision trace
//                         // ----------------------------------
//                         pathIndexes: [
//                             ...match.pathIndexes,
//                             index
//                         ],

//                         bindings: {
//                             ...match.bindings,
//                             [pathKey]: refId
//                         }
//                     });
//                 }
//             }

//             matches = nextMatches;
//         }
//         return matches;
//     }
// }