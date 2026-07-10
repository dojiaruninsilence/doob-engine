import { IAggregateStrategy } from "../IAggregateStrategy";
// import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
// import { AggregateRequest } from "../../../../types/query/AggregateTypes";
// import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
// import { Notice } from "obsidian";
// import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
// import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class SumStrategy
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

        let sum = 0;

        // this.trace.debug("SumStrategy", "Start", { context, plan, group, request })

        for (const match of group.aggregateMatches) {
            const v = match.value;

            if (typeof v === "number") {
                sum += v;
            }

            // this.trace.debug("SumStrategy", "Finished", { v, sum });
        }

        return sum;
    }
}