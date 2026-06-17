import { ContextFactory } from "../../ContextFactory";
import { IDataReader } from "../../../interfaces/IDataReader";
import { SchemaIdMap, HydrationMap } from "../../../types/QueryExecutionTypes";
import { DataRecord } from "../../../types/DataTypes";

export class HydrationMapBuilder {

    constructor(
        private reader: IDataReader,
        private contextFactory: ContextFactory
    ) {}

    async build(
        ruleset: string,
        idsBySchema: SchemaIdMap
    ): Promise<HydrationMap> {

        const hydrationMap: HydrationMap =
            new Map();

        for (const [schemaName, ids] of idsBySchema) {

            if (ids.size === 0) {
                hydrationMap.set(schemaName, new Map());
                continue;
            }

            const context =
                await this.contextFactory.getSchemaContext(
                    ruleset,
                    schemaName
                );

            const records =
                await this.reader.getManyByIds(context, ids);

            const schemaMap =
                new Map<string, DataRecord>();

            for (const record of records) {
                schemaMap.set(record.id, record);
            }

            hydrationMap.set(schemaName, schemaMap);
        }

        return hydrationMap;
    }

    async buildSchema(
        ruleset: string,
        schemaName: string,
        ids: Set<string>
    ): Promise<Map<string, DataRecord>> {

        if (ids.size === 0) {
            return new Map();
        }

        const context =
            await this.contextFactory.getSchemaContext(
                ruleset,
                schemaName
            );

        const records =
            await this.reader.getManyByIds(context, ids);

        const result =
            new Map<string, DataRecord>();

        for (const record of records) {
            result.set(record.id, record);
        }

        return result;
    }
}