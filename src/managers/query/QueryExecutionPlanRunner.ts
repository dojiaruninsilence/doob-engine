import { ReferenceBatchResolver } from "../ReferenceBatchResolver";
import { ContextFactory } from "../ContextFactory";
import { SchemaContext } from "../../types/ContextTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryPlan } from "../../types/QueryPlannerTypes";

export class QueryExecutionPlanRunner {

    constructor(
        private batchResolver: ReferenceBatchResolver,
        private contextFactory: ContextFactory
    ) {}

    async run(
        context: SchemaContext,
        records: DataRecord[],
        plan: QueryPlan
    ): Promise<void> {

        if (plan.steps.length === 0) {
            return;
        }

        let currentRecords = records;
        let currentContext = context;

        for (const step of plan.steps) {

            const resolvedMap =
                await this.batchResolver.resolveBatch(
                    currentContext,
                    step.field,
                    currentRecords
                );

            const nextRecords: DataRecord[] = [];

            for (const record of currentRecords) {

                const id =
                    record.data?.[step.field];

                if (typeof id !== "string") {
                    continue;
                }

                const resolved =
                    resolvedMap.get(id);

                if (!resolved) {
                    continue;
                }

                nextRecords.push(resolved);
            }

            currentContext =
                await this.contextFactory.getSchemaContext(
                    step.toRuleset,
                    step.to
                );

            currentRecords = nextRecords;
        }
    }
}