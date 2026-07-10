import { ResolvedRecordGraph } from "../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../types/query/AggregateTypes";
import { TraversalContext, TraversalPlan } from "../../../types/traversal";

export interface IAggregateStrategy {
    evaluate(
        context: TraversalContext,
        plan: TraversalPlan,
        group: QueryGroupResult,
        request: AggregateRequest
    ): Promise<any>;
}