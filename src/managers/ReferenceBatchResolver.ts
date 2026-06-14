import { IReferenceResolver } from "../interfaces/IReferenceResolver";
import { SchemaContext } from "../types/ContextTypes";
import { DataRecord } from "../types/DataTypes";

export class ReferenceBatchResolver {

    private cache =
        new Map<string, DataRecord>();

    constructor(
        private referenceResolver: IReferenceResolver
    ) {}

    async resolveBatch(
        context: SchemaContext,
        fieldName: string,
        records: DataRecord[]
    ): Promise<Map<string, DataRecord>> {

        const ids = new Set<string>();

        for (const record of records) {

            const id = record.data?.[fieldName];

            if (typeof id === "string") {
                ids.add(id);
            }
        }

        const results =
            new Map<string, DataRecord>();

        for (const id of ids) {

            const cached =
                this.cache.get(id);

            if (cached) {

                results.set(id, cached);
                continue;
            }

            const resolved =
                await this.referenceResolver.resolve(
                    context,
                    fieldName,
                    id
                );

            if (!resolved) {
                continue;
            }

            this.cache.set(id, resolved);
            results.set(id, resolved);
        }

        return results;
    }

    clear(): void {

        this.cache.clear();
    }

    get(id: string): DataRecord | undefined {

        return this.cache.get(id);
    }

    store(
        id: string,
        record: DataRecord
    ): void {

        this.cache.set(
            id,
            record
        );
    }
}