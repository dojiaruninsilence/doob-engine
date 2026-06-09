import { Schema } from "./SchemaTypes";

export interface Entity {
	ruleset: string;
	schemaName: string;
	schema: Schema;
}