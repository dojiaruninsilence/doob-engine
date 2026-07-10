import { IAggregateStrategy } from "../IAggregateStrategy";
// import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
// import { AggregateRequest } from "../../../../types/query/AggregateTypes";
// import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
import { TraceLogger } from "../../../logging/TraceLogger";

export class CountRootsStrategy implements IAggregateStrategy {

    constructor(private trace: TraceLogger) {}

    async evaluate(
        // context: TraversalContext,
        // plan: TraversalPlan,
        group: QueryGroupResult,
        // request: AggregateRequest
    ): Promise<any> {
        return group.records.length;
    }
}