import { FieldType } from './FieldTypes';

export interface SchemaField {
	type: FieldType;
	default: any;
	required?: boolean;
	description?: string;
	enumValues?: string[];

	referenceTarget?: {
		ruleset: string;
		schema: string;
	};
}

export interface Schema {
	name: string;
	version: number;
	fields: Record<string, SchemaField>;
}