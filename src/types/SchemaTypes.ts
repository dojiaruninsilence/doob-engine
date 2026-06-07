export interface SchemaField {
	type: string;
	default: any;
}

export interface Schema {
	name: string;
	fields: Record<string, SchemaField>;
}