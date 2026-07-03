import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

export class MinStrategy implements IAggregateStrategy {

    constructor(
        private matchNavigator: QueryMatchNavigator
    ) {}

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        const seen = new Set<string>();

        let min: number | null = null;

        for (const match of group.matches) {

            const values =
                this.matchNavigator.resolveValues(
                    graph,
                    match,
                    request.field!
                );

            for (const v of values) {

                const key =
                    `${match.rootId}:${v.sourceId}:${request.field}`;

                if (seen.has(key)) continue;

                seen.add(key);

                if (typeof v.value === "number") {

                    min =
                        min === null
                            ? v.value
                            : Math.min(min, v.value);
                }
            }
        }

        return min;
    }
}

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

// export class MinStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         let min: number | null = null;

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getDataValue(
//                     graph,
//                     match,
//                     request.field!
//                 );

//             if (Array.isArray(value)) {

//                 for (const v of value) {
//                     if (typeof v === "number") {

//                         min = min === null
//                             ? v
//                             : Math.min(min, v);
//                     }
//                 }

//             } else if (typeof value === "number") {

//                 min = min === null
//                     ? value
//                     : Math.min(min, value);
//             }
//         }

//         return min;
//     }
// }

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

// export class MinStrategy
//     implements IAggregateStrategy {

//     constructor(
//         private navigator: ResolvedRecordGraphNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//          let min = Infinity;

//         for (const record of group.records) {

//             const value =
//                 this.navigator.getValue(
//                     graph,
//                     record.id,
//                     request.field!
//                 );

//             if (typeof value === "number") {
//                 min = Math.min(min, value);
//             }
//         }

//         return min === Infinity ? null : min;
//     }
// }