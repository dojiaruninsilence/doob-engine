import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryMatchNavigator } from "../../match/QueryMatchNavigator";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";
import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
import { TraversalExecutor } from "../../../traversal/TraversalExecutor";
import { TraceLogger } from "../../../logging/TraceLogger";

export class DistinctValuesStrategy
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

        const values = new Set<any>();

        // for (const match of group.records) {

        //     const results = this.travExecutor.execute(context, match.rootId, plan);

        for (const record of group.records) {

            const results = this.travExecutor.execute(context, record.id, plan);
                // this.matchNavigator.resolveValues(
                //     graph,
                //     match,
                //     request.field!
                // );

            const resolved = 
                results.values ??
                (results.value !== undefined
                    ? [results.value]
                    : []);

            for (const v of resolved) {
                values.add(v);
            }
        }

        return Array.from(values);
    }
}