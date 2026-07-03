import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

export class MaxStrategy implements IAggregateStrategy {

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

        let max: number | null = null;

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

                    max =
                        max === null
                            ? v.value
                            : Math.max(max, v.value);
                }
            }
        }

        return max;
    }
}

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { Notice } from "obsidian";

// export class MaxStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         let max: number | null = null;

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
//                         max = max === null
//                             ? v
//                             : Math.max(max, v);
//                     }
//                 }

//             } else if (typeof value === "number") {

//                 max = max === null
//                     ? value
//                     : Math.max(max, value);
//             }

//             // new Notice(
//             //     [
//             //         `Field: ${request.field}`,
//             //         `CurrentId: ${match.currentId}`,
//             //         `Value: ${String(value)}`,
//             //         `Type: ${typeof value}`
//             //     ].join("\n")
//             // );
//         }

//         return max;
//     }
// }

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

// export class MaxStrategy
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

//         let max = -Infinity;

//         for (const record of group.records) {

//             const value =
//                 this.navigator.getValue(
//                     graph,
//                     record.id,
//                     request.field!
//                 );

//             if (typeof value === "number") {
//                 max = Math.max(max, value);
//             }
//         }

//         return max === -Infinity ? null : max;
//     }
// }