import { IAggregateStrategy } from "../IAggregateStrategy";
import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { AggregateRequest } from "../../../../types/AggregateTypes";

export class SumStrategy
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

        for (const record of group.records) {

            const value =
                this.navigator.getValue(
                    graph,
                    record.id,
                    request.field!
                );

            if (typeof value === "number") {
                sum += value;
            }
        }

        return sum;
    }
}