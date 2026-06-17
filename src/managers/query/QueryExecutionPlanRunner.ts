import { SchemaContext } from "../../types/ContextTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryPlan } from "../../types/QueryPlannerTypes";
import { ResolvedRecordGraph } from "../../types/ResolvedRecordGraph";
import { ResolvedRecordGraphBuilder } from "./execution/ResolvedRecordGraphBuilder";
import { Notice } from "obsidian";

export class QueryExecutionPlanRunner {

    constructor(
        private graphBuilder: ResolvedRecordGraphBuilder
    ) {}

    async run(
        context: SchemaContext,
        records: DataRecord[],
        plan: QueryPlan
    ): Promise<ResolvedRecordGraph> {

        return await this.graphBuilder.build(
            context,
            records,
            plan
        );
    }
}