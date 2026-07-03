import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";

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