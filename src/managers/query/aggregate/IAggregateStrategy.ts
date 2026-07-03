import { ResolvedRecordGraph } from "../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../types/query/AggregateTypes";

export interface IAggregateStrategy {

    evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any>;
}