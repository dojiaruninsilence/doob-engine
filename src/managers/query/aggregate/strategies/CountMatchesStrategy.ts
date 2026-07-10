import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/query/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/query/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraversalContext, TraversalPlan } from "../../../../types/traversal";
import { TraceLogger } from "../../../logging/TraceLogger";

export class CountMatchesStrategy implements IAggregateStrategy {

    constructor(private trace: TraceLogger) {}

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

        if (group.whereMatches && group.whereMatches.length > 0) {
            return group.whereMatches.length;
        }

        if (
            group.aggregateMatches &&
            group.aggregateMatches.length > 0
        ) {
            return group.aggregateMatches.length;
        }

        if (
            group.groupMatches &&
            group.groupMatches.length > 0
        ) {
            return group.groupMatches.length;
        }

        return group.records.length;
            // return group.matches.length;
            // return group.records.length;
    }
}