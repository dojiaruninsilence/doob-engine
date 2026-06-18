import { IAggregateStrategy } from "../IAggregateStrategy";
import { AggregateRequest } from "../../../../types/AggregateTypes";
import { ResolvedRecordGraph } from "../../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../../types/QueryTypes";
import { ResolvedRecordGraphNavigator } from "../../graph/ResolvedRecordGraphNavigator";

export class DistinctStrategy
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

        const set = new Set<any>();

            for (const record of group.records) {

                const value =
                    this.navigator.getValue(
                        graph,
                        record.id,
                        request.field!
                    );

                set.add(value);
            }

            return set.size;
    }
}
