import { Schema } from "./SchemaTypes";

export interface SchemaContext {
	ruleset: string;
	schemaName: string;
	schema: Schema;
}