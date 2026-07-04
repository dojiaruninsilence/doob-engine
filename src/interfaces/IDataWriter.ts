import { SchemaContext } from "../types/ContextTypes";
import { DataRecord } from "../types/DataTypes";

export interface IDataWriter {

	saveRecord(
		context: SchemaContext,
		record: DataRecord
	): Promise<void>;

	saveRecords(
		context: SchemaContext,
		records: DataRecord[]
	): Promise<void>;
}