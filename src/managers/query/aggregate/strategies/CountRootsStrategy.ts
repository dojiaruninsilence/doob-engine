import { IAggregateStrategy } from "../IAggregateStrategy";
import { QueryGroupResult } from "../../../../types/query/QueryTypes";
import { TraceLogger } from "../../../logging/TraceLogger";

export class CountRootsStrategy implements IAggregateStrategy {

    constructor(private trace: TraceLogger) {}

    async evaluate(
        group: QueryGroupResult
    ): Promise<any> {
        return group.records.length;
    }
}