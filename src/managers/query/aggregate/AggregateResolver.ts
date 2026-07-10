import { QueryGroupResult } from "../../../types/query/QueryTypes";
import { AggregateRequest } from "../../../types/query/AggregateTypes";
import { AggregateStrategyRegistry } from "./AggregateStrategyRegistry";

export class AggregateResolver {

    constructor(
        private registry: AggregateStrategyRegistry
    ) {}

    async evaluate(
        group: QueryGroupResult,
        request: AggregateRequest
    ): Promise<any> {

        const strategy =
            this.registry.get(
                request.op
            );

        return await strategy.evaluate(
            group
        );
    }
}