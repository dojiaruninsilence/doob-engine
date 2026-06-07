export interface DataRecord {
	id: string;
	data: Record<string, any>;
}

export interface DataFile {
	version: number;
	records: DataRecord[];
}