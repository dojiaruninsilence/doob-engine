import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class CountMatchesStrategy implements IAggregateStrategy {

    constructor(private trace: TraceLogger) {}

    async evaluate(
        group: QueryGroupResult
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
    }
}