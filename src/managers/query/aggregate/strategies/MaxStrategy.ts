import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class MaxStrategy implements IAggregateStrategy {

    constructor(
        private trace: TraceLogger
    ) {}

    async evaluate(
        group: QueryGroupResult
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