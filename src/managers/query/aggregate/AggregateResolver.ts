import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";
import { QueryGroupResult } from "../../../types/QueryTypes";
import { AggregateRequest } from "../../../types/AggregateTypes";
import { AggregateStrategyRegistry } from "./AggregateStrategyRegistry";

export class AggregateResolver {

    constructor(
        private registry: AggregateStrategyRegistry
    ) {}

    async evaluate(
        graph: ResolvedRecordGraph,
        group: QueryGroupResult,
        rootId: string,
        request: AggregateRequest
    ): Promise<any> {

        const strategy =
            this.registry.get(
                request.op
            );

        return await strategy.evaluate(
            graph,
            group,
            rootId,
            request
        );
    }
}