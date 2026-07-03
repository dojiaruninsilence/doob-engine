import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

export class AvgStrategy implements IAggregateStrategy {

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

        let sum = 0;
        let count = 0;

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
                    sum += v.value;
                    count++;
                }
            }
        }

        return count === 0
            ? 0
            : sum / count;
    }
}

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { Notice } from "obsidian";

// export class AvgStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         // new Notice("AVG entered");

//         let sum = 0;
//         let count = 0;

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getDataValue(
//                     graph,
//                     match,
//                     request.field!
//                 );

//             // new Notice(
//             //     [
//             //         `Group: ${group.key}`,
//             //         `CurrentId: ${match.currentId}`,
//             //         `Field: ${request.field}`,
//             //         `Value: ${String(value)}`,
//             //         `Type: ${typeof value}`
//             //     ].join("\n")
//             // );

//             if (Array.isArray(value)) {

//                 for (const v of value) {
//                     if (typeof v === "number") {
//                         sum += v;
//                         count++;
//                     }
//                 }

//             } else if (typeof value === "number") {
//                 sum += value;
//                 count++;
//             }
//         }

//         return count === 0 ? 0 : sum / count;
//     }
// }

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

// export class AvgStrategy
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

//         let sum = 0;
//         let count = 0;

//         for (const record of group.records) {

//             const value =
//                 this.navigator.getValue(
//                     graph,
//                     record.id,
//                     request.field!
//                 );

//             if (typeof value === "number") {
//                 sum += value;
//                 count++;
//             }
//         }

//         return count === 0 ? 0 : sum / count;
//     }
// }