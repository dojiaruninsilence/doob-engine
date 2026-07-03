import { IAggregateStrategy } from "../IAggregateStrategy";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";

export class CountRootsStrategy implements IAggregateStrategy {

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        return new Set(
            group.matches.map(
                m => m.rootId
            )
        ).size;
    }
}