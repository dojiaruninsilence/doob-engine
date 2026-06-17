import { SchemaContext } from "../../../types/ContextTypes";
import { DataRecord } from "../../../types/DataTypes";
import { ReferencePlan, SchemaIdMap } from "../../../types/QueryExecutionTypes";
import { Notice } from "obsidian";

export class GlobalIdAccumulator {

    async collect(
        context: SchemaContext,
        records: DataRecord[],
        graph: ReferencePlan
    ): Promise<SchemaIdMap> {

        const result: SchemaIdMap =
            new Map();

        for (const [schema, steps] of graph.stepMap) {

            for (const step of steps) {

                // new Notice(
                //     `Collecting ${step.field} from ${step.from}`
                // );

                const targetSchema =
                    step.to;

                if (!result.has(targetSchema)) {
                    result.set(
                        targetSchema,
                        new Set<string>()
                    );
                }

                const ids =
                    result.get(targetSchema)!;

                for (const record of records) {

                    const id =
                        record.data?.[step.field];

                    // new Notice(
                    //     `${step.field} on record ${record.id}: ${String(record.data?.[step.field])}`
                    // );

                    if (typeof id === "string") {
                        ids.add(id);
                    }
                }
            }
        }

        return result;
    }
}