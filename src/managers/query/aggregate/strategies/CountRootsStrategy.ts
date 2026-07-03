import { IAggregateStrategy } from "../IAggregateStrategy";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { AggregateRequest } from "../../../../types/AggregateTypes";

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