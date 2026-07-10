import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class MinStrategy implements IAggregateStrategy {

    constructor(
        private trace: TraceLogger
    ) {}

    async evaluate(
        group: QueryGroupResult
    ): Promise<any> {

        let min: number | null = null;

        for (const match of group.aggregateMatches) {

            const v = match.value;

            if (typeof v === "number") {

                min =
                    min === null
                        ? v
                        : Math.min(min, v);
            }
        }

        return min;
    }
}