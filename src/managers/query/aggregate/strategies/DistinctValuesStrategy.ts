import { IAggregateStrategy } from "../IAggregateStrategy";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
// import { AggregateRequest } from "../../../../types/query/AggregateTypes";
// import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
// import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class DistinctValuesStrategy
    implements IAggregateStrategy {

    constructor(
        // private travExecutor: TraversalExecutor,
        private trace: TraceLogger
    ) {}

    async evaluate(
        // context: TraversalContext,
        // plan: TraversalPlan,
        group: QueryGroupResult,
        // request: AggregateRequest
    ): Promise<any> {

        const values = new Set<any>();

        for (const match of group.aggregateMatches) {

            const v = match.value;
            values.add(v);
        }

        return Array.from(values);
    }
}