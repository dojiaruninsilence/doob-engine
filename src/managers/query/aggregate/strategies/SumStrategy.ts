import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class SumStrategy
    implements IAggregateStrategy {

    constructor(
        private trace: TraceLogger
    ) {}

    async evaluate(
        group: QueryGroupResult
    ): Promise<any> {

        let sum = 0;

        for (const match of group.aggregateMatches) {
            const v = match.value;

            if (typeof v === "number") {
                sum += v;
            }
        }

        return sum;
    }
}