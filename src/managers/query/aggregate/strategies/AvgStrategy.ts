import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/query/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
// import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class AvgStrategy implements IAggregateStrategy {

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
        let sum = 0;
        let count = 0;

        for (const matches of group.aggregateMatches) {

            const v = matches.value;

            if (typeof v === "number") {
                sum += v;
                count++;
            }
        }

        return count === 0
            ? 0
            : sum / count;
    }
}
