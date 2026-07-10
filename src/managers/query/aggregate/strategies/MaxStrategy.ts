import { IAggregateStrategy } from "../IAggregateStrategy";
// import { AggregateRequest } from "../../../../types/query/AggregateTypes";
// import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
// import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class MaxStrategy implements IAggregateStrategy {

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

        let max: number | null = null;

        for (const match of group.aggregateMatches) {

            const v = match.value;

            if (typeof v === "number") {

                max =
                    max === null
                        ? v
                        : Math.max(max, v);
            }
        }

        return max;
    }
}