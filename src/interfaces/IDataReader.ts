import { SchemaContext } from "../types/ContextTypes";
import { DataRecord } from "../types/DataTypes";

export interface IDataReader {

	getById(
		context: SchemaContext,
		id: string
	): Promise<DataRecord | undefined>;

	getAll(
		context: SchemaContext
	): Promise<DataRecord[]>;

	getManyByIds(
		context: SchemaContext,
		ids: Set<string>
	): Promise<DataRecord[]>;
}