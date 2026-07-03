import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { AggregateRequest } from "../../../../types/AggregateTypes";

export class DistinctValuesStrategy
    implements IAggregateStrategy {

    constructor(
        private matchNavigator: QueryMatchNavigator
    ) {}

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        const values = new Set<any>();

        for (const match of group.matches) {

            const resolved =
                this.matchNavigator.resolveValues(
                    graph,
                    match,
                    request.field!
                );

            for (const v of resolved) {
                values.add(v.value);
            }
        }

        return Array.from(values);
    }
}

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { Notice } from "obsidian";

// export class DistinctValuesStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         // new Notice(
//         //     JSON.stringify(
//         //         group.matches.map(m => ({
//         //             root: m.rootId,
//         //             current: m.currentId
//         //         })),
//         //         null,
//         //         2
//         //     )
//         // );

//         const set = new Set<any>();

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getDataValue(
//                     graph,
//                     match,
//                     request.field!,
//                     "group"
//                 );

//             if (Array.isArray(value)) {
//                 for (const v of value) set.add(v);
//             } else {
//                 set.add(value);
//             }
//         }

//         return Array.from(set);
//     }
// }