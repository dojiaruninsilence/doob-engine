import { QueryPlan } from "../../../types/QueryPlannerTypes";
import { QueryMatch } from "../../../types/QueryMatchTypes";
import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";
import { Notice } from "obsidian";

export class QueryMatchBuilder {

    build(
        graph: ResolvedRecordGraph,
        plan: QueryPlan
    ): QueryMatch[] {

        let matches: QueryMatch[] = [];

        // ----------------------------------
        // INIT ROOTS
        // ----------------------------------

        for (const rootId of graph.roots) {

            // new Notice(
            //     JSON.stringify({
            //         rootId,
            //         nodeData: graph.nodes.get(rootId)?.data
            //     }, null, 2)
            // );

            matches.push({
                rootId,
                currentId: rootId,

                pathNodes: [rootId],
                pathIndexes: [],

                bindings: {}
            });

            // new Notice(
            //     JSON.stringify({
            //         matches
            //     }, null, 2)
            // );
        }

        // ----------------------------------
        // TRAVERSE PLAN
        // ----------------------------------

        for (const step of plan.steps) {

            const nextMatches: QueryMatch[] = [];

            for (const match of matches) {

                const sourceNode =
                    graph.nodes.get(match.currentId);

                if (!sourceNode) continue;

                const refs =
                    sourceNode.refs.get(step.field) ?? [];

                if (refs.length === 0) continue;

                const pathKey =
                    `${step.from}.${step.field}`;

                for (let index = 0; index < refs.length; index++) {

                    const refId = refs[index];

                    nextMatches.push({
                        rootId: match.rootId,
                        currentId: refId,

                        // ----------------------------------
                        // CRITICAL: structural trace
                        // ----------------------------------
                        pathNodes: [
                            ...match.pathNodes,
                            refId
                        ],

                        // ----------------------------------
                        // CRITICAL: decision trace
                        // ----------------------------------
                        pathIndexes: [
                            ...match.pathIndexes,
                            index
                        ],

                        bindings: {
                            ...match.bindings,
                            [pathKey]: refId
                        }
                    });
                }
            }

            matches = nextMatches;
        }

        // for (const m of matches) {
        //     new Notice(
        //         JSON.stringify({
        //             rootId: m.rootId,
        //             currentId: m.currentId,
        //             nodeData: graph.nodes.get(m.currentId)?.data
        //         }, null, 2)
        //     );
        // }

        // for (const match of matches) {

        //     new Notice(
        //         JSON.stringify({
        //             rootId: match.rootId,
        //             currentId: match.currentId,
        //             pathNodes: match.pathNodes,
        //             pathIndexes: match.pathIndexes,
        //             bindings: match.bindings
        //         }, null, 2)
        //     );
        // }

        return matches;
    }
}

// export class QueryMatchBuilder {

//     build(
//         graph: ResolvedRecordGraph,
//         plan: QueryPlan
//     ): QueryMatch[] {

//         let matches: QueryMatch[] = [];

//         for (const rootId of graph.roots) {

//             matches.push({
//                 rootId,
//                 currentId: rootId,
//                 path: [rootId],
//                 bindings: {}
//             });
//         }

//         for (const step of plan.steps) {

//             const nextMatches: QueryMatch[] = [];

//             for (const match of matches) {

//                 const sourceNode =
//                     graph.nodes.get(match.currentId);

//                 if (!sourceNode) continue;

//                 const refs =
//                     sourceNode.refs.get(step.field) ?? [];

//                 if (!refs.length) continue;

//                 const pathKey =
//                     `${step.from}.${step.field}`;

//                 for (const refId of refs) {

//                     nextMatches.push({
//                         rootId: match.rootId,
//                         currentId: refId,

//                         // 🔥 CRITICAL: extend full path
//                         path: [...match.path, refId],

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

// export class QueryMatchBuilder {

//     build(
//         graph: ResolvedRecordGraph,
//         plan: QueryPlan
//     ): QueryMatch[] {

//         // ----------------------------------
//         // 1. seed root matches
//         // ----------------------------------

//         let matches: QueryMatch[] = graph.roots.map(rootId => ({
//             rootId,
//             currentId: rootId,
//             bindings: {}
//         }));

//         // ----------------------------------
//         // 2. walk traversal steps
//         // ----------------------------------

//         for (const step of plan.steps) {

//             const nextMatches: QueryMatch[] = [];

//             for (const match of matches) {

//                 const sourceNode =
//                     graph.nodes.get(match.currentId);

//                 if (!sourceNode) {
//                     continue;
//                 }

//                 const refs =
//                     sourceNode.refs.get(step.field) ?? [];

//                 if (refs.length === 0) {
//                     continue;
//                 }

//                 for (const refId of refs) {

//                     nextMatches.push({
//                         rootId: match.rootId,
//                         currentId: refId,

//                         bindings: {
//                             ...match.bindings,

//                             // 🔥 CRITICAL FIX
//                             [step.path]: refId
//                         }
//                     });
//                 }
//             }

//             matches = nextMatches;
//         }

//         return matches;
//     }
// }

// import { QueryPlan } from "../../../types/QueryPlannerTypes";
// import { QueryMatch } from "../../../types/QueryMatchTypes";
// import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";
// import { Notice } from "obsidian";

// export class QueryMatchBuilder {

//     build(
//         graph: ResolvedRecordGraph,
//         plan: QueryPlan
//     ): QueryMatch[] {

//         let matches: QueryMatch[] = [];

//         for (const rootId of graph.roots) {

//             matches.push({
//                 rootId,
//                 currentId: rootId,
//                 bindings: {}
//             });
//         }

//         for (const step of plan.steps) {

//             const nextMatches: QueryMatch[] = [];

//             for (const match of matches) {

//                 const sourceNode =
//                     graph.nodes.get(match.currentId);

//                 if (!sourceNode) {
//                     continue;
//                 }

//                 const refs =
//                     sourceNode.refs.get(step.field) ?? [];

//                 if (refs.length === 0) {
//                     continue;
//                 }

//                 const pathKey =
//                     step.from
//                         ? `${step.from}.${step.field}`
//                         : step.field;

//                 for (const refId of refs) {

//                     nextMatches.push({
//                         rootId: match.rootId,
//                         currentId: refId,
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

// export class QueryMatchBuilder {

//     build(
//         graph: ResolvedRecordGraph,
//         plan: QueryPlan
//     ): QueryMatch[] {

//         // new Notice(`Roots: ${graph.roots.length}`);

//         let matches: QueryMatch[] = [];

//         for (const rootId of graph.roots) {

//             matches.push({
//                 rootId,
//                 currentId: rootId,
//                 bindings: {}
//             });
//         }

//         // new Notice(`Initial matches: ${matches.length}`);

//         for (const step of plan.steps) {

//             const nextMatches: QueryMatch[] = [];

//             for (const match of matches) {

//                 let sourceId = match.rootId;

//                 const existing =
//                     match.bindings[step.from];

//                 if (existing) {
//                     sourceId = existing;
//                 }

//                 // new Notice(
//                 //     [
//                 //         `Step: ${step.from}.${step.field}`,
//                 //         `Root: ${match.rootId}`,
//                 //         `Existing: ${existing}`,
//                 //         `SourceId: ${sourceId}`
//                 //     ].join("\n")
//                 // );

//                 const sourceNode =
//                     graph.nodes.get(match.currentId);

//                 if (!sourceNode) {
//                     continue;
//                 }

//                 const refs =
//                     sourceNode.refs.get(step.field) ?? [];

//                 if (refs.length === 0) {
//                     continue;
//                 }

//                 for (const refId of refs) {

//                     nextMatches.push({
//                         rootId: match.rootId,
//                         currentId: refId,
//                         bindings: {
//                             ...match.bindings,
//                             [step.field]: refId
//                         }
//                     });
//                 }
//             }

//             matches = nextMatches;

//             // new Notice(
//             //     `After ${step.field}: ${matches.length}`
//             // );
//         }

//         return matches;
//     }
// }