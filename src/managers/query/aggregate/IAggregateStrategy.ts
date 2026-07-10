import { QueryGroupResult } from "../../../types/query/QueryTypes";

export interface IAggregateStrategy {
    evaluate(
        group: QueryGroupResult
    ): Promise<any>;
}