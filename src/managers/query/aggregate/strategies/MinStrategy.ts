import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
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