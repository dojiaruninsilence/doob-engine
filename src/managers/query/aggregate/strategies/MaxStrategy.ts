import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class MaxStrategy implements IAggregateStrategy {

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

        let max: number | null = null;

        // for (const match of group.records) {

        //     const results = this.travExecutor.execute(context, match.rootId, plan);

        for (const record of group.records) {

            const results = this.travExecutor.execute(context, record.id, plan);
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

            for (const v of values) {

                // const key =
                //     `${match.rootId}:${v.sourceId}:${request.field}`;

                // if (seen.has(key)) continue;

                // seen.add(key);

                if (typeof v === "number") {

                    max =
                        max === null
                            ? v
                            : Math.max(max, v);
                }
            }
        }

        return max;
    }
}