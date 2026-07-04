import { DataRecord } from "../DataTypes";

export interface MutationWriteTarget {
    schemaName: string;
    record: DataRecord;
}