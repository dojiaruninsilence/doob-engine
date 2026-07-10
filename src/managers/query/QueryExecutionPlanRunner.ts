import { SchemaContext } from "../../types/ContextTypes";
import { DataRecord } from "../../types/DataTypes";
import { ResolvedRecordGraph } from "../../types/query/ResolvedRecordGraph";
import { TraversalPlanSet } from "../../types/traversal";
import { ResolvedRecordGraphBuilder } from "../traversal/ResolvedRecordGraphBuilder";

export class QueryExecutionPlanRunner {

    constructor(
        private graphBuilder: ResolvedRecordGraphBuilder
    ) {}

    async run(
        context: SchemaContext,
        records: DataRecord[],
        plan: TraversalPlanSet
    ): Promise<ResolvedRecordGraph> {

        return await this.graphBuilder.build(
            context,
            records,
            plan
        );
    }
}