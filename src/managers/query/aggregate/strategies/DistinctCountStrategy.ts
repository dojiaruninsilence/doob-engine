import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class DistinctCountStrategy
    implements IAggregateStrategy {

    constructor(
        private trace: TraceLogger
    ) {}

    async evaluate(
        group: QueryGroupResult
    ): Promise<any> {

        const values = new Set<any>();

        for (const match of group.aggregateMatches) {

            const v = match.value;
            values.add(v);
        }

        return values.size;
    }
}