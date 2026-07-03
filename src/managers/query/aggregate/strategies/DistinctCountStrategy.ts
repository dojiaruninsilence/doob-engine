import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

export class DistinctCountStrategy
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

        return values.size;
    }
}

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

// export class DistinctCountStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         const set = new Set<any>();

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getDataValue(
//                     graph,
//                     match,
//                     request.field!
//                 );

//             if (Array.isArray(value)) {

//                 for (const v of value) {
//                     set.add(v);
//                 }

//             } else {
//                 set.add(value);
//             }
//         }

//         return set.size;
//     }
// }

// export class DistinctStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         const set = new Set<any>();

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getValue(
//                     graph,
//                     match,
//                     request.field!
//                 );

//             if (Array.isArray(value)) {

//                 for (const v of value) {
//                     set.add(v);
//                 }

//             } else {
//                 set.add(value);
//             }
//         }

//         return [...set];
//     }
// }

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";

// export class DistinctStrategy implements IAggregateStrategy {

//     constructor(
//         private matchNavigator: QueryMatchNavigator
//     ) {}

//     async evaluate(
//         graph: ResolvedRecordGraph,
//         group: QueryGroupResult,
//         rootId: string,
//         request: AggregateRequest
//     ): Promise<any> {

//         const set = new Set<any>();

//         for (const match of group.matches) {

//             const value =
//                 this.matchNavigator.getValue(
//                     graph,
//                     match,
//                     request.field!
//                 );

//             if (Array.isArray(value)) {
//                 for (const v of value) {
//                     set.add(v);
//                 }
//             } else {
//                 set.add(value);
//             }
//         }

//         return set.size;
//     }
// }

// import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
// import { QueryGroupResult } from "../../../../types/QueryTypes";
// import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

// export class DistinctStrategy
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

//         const set = new Set<any>();

//             for (const record of group.records) {

//                 const value =
//                     this.navigator.getValue(
//                         graph,
//                         record.id,
//                         request.field!
//                     );

//                 set.add(value);
//             }

//             return set.size;
//     }
// }
