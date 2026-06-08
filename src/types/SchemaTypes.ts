import { FieldType } from './FieldTypes';

export interface SchemaField {
	type: FieldType;
	default: any;
	required?: boolean;
	description?: string;
}

export interface Schema {
	name: string;
	version: number;
	fields: Record<string, SchemaField>;
}