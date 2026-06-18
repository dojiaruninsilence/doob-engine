import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

export class AvgStrategy
    implements IAggregateStrategy {

    constructor(
        private navigator: ResolvedRecordGraphNavigator
    ) {}

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        let sum = 0;
        let count = 0;

        for (const record of group.records) {

            const value =
                this.navigator.getValue(
                    graph,
                    record.id,
                    request.field!
                );

            if (typeof value === "number") {
                sum += value;
                count++;
            }
        }

        return count === 0 ? 0 : sum / count;
    }
}