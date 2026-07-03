import { IAggregateStrategy } from "../IAggregateStrategy";
import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { Notice } from "obsidian";

export class SumStrategy
    implements IAggregateStrategy {

    constructor(
        //private navigator: ResolvedRecordGraphNavigator,
        private matchNavigator: QueryMatchNavigator
    ) {}

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        // let sum = 0;

        // for (const match of group.matches) {

        //     const value =
        //         this.matchNavigator.getDataValue(
        //             graph,
        //             match,
        //             request.field!
        //         );

        //     if (Array.isArray(value)) {

        //         for (const v of value) {

        //             if (typeof v === "number") {
        //                 sum += v;
        //             }
        //         }

        //     } else if (typeof value === "number") {

        //         sum += value;
        //     }
        // }

        // return sum;

        const seen = new Set<string>();
        let sum = 0;

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
                }
            }
        }

        return sum;
    }
}