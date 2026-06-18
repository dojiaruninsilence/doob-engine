import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../types/QueryTypes";
import { AggregateRequest } from "../../../types/AggregateTypes";

export interface IAggregateStrategy {

    evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any>;
}