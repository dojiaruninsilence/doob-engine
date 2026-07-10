import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class AvgStrategy implements IAggregateStrategy {

    constructor(
        private trace: TraceLogger
    ) {}

    async evaluate(
        group: QueryGroupResult
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
