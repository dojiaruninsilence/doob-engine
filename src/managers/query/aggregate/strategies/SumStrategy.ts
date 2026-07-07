import { IAggregateStrategy } from "../IAggregateStrategy";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { Notice } from "obsidian";
import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class SumStrategy
    implements IAggregateStrategy {

    constructor(
        private travExecutor: TraversalExecutor,
        private trace: TraceLogger
        // private matchNavigator: QueryMatchNavigator
    ) {}

    // async evaluate(
    //     graph: ResolvedRecordGraph,
    //     group: QueryGroupResult,
    //     rootId: string,
    //     request: AggregateRequest
    // ): Promise<any> {
    async evaluate(
        context: TraversalContext,
        plan: TraversalPlan,
        group: QueryGroupResult,
        request: AggregateRequest
    ): Promise<any> {

        // const seen = new Set<string>();
        let sum = 0;

        this.trace.debug("SumStrategy", "Start", { context, plan, group, request })

        for (const match of group.matches) {

            const results = this.travExecutor.execute(context, match.rootId, plan);
                // this.matchNavigator.resolveValues(
                //     graph,
                //     match,
                //     request.field!
                // );

            const values = 
                 results.values ??
                (results.value !== undefined
                    ? [results.value]
                    : []);

            this.trace.debug("SumStrategy", "Results: ", { results, values })

            for (const v of values) {

                // const key =
                //     `${match.rootId}:${v.sourceId}:${request.field}`;

                // if (seen.has(key)) continue;

                // seen.add(key);

                if (typeof v === "number") {
                    sum += v;
                }

                this.trace.debug("SumStrategy", "Finished", { v, sum })
            }
        }

        return sum;
    }
}