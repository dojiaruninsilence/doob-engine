export interface DataRecord {
	id: string;
	schemaVersion: number;
	data: Record<string, any>;
}

export interface DataFile {
	ruleset: string;
	schemaName: string;
	version: number;
	records: DataRecord[];
}