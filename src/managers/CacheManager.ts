import { Schema } from "../types/SchemaTypes";
import { DataFile } from "../types/DataTypes";
import { Logger } from "./logging/Logger";
import { TraceLogger } from "./logging/TraceLogger";

export class CacheManager {

	constructor(private trace: TraceLogger) {}

	// --------------------------------------------------
	// SCHEMA CACHE
	// --------------------------------------------------

	private schemaCache: Map<string, Schema> =
		new Map();

	// --------------------------------------------------
	// DATA CACHE
	// --------------------------------------------------

	private dataCache: Map<string, DataFile> =
		new Map();

	// --------------------------------------------------
	// KEY HELPERS
	// --------------------------------------------------

	private getSchemaKey(
		ruleset: string,
		schemaName: string
	): string {

		return `${ruleset}::${schemaName}`;
	}

	private getDataKey(
		ruleset: string,
		schemaName: string
	): string {

		return `${ruleset}::${schemaName}`;
	}

	// --------------------------------------------------
	// SCHEMA CACHE
	// --------------------------------------------------

	getSchema(
		ruleset: string,
		schemaName: string
	): Schema | undefined {

		return this.schemaCache.get(
			this.getSchemaKey(ruleset, schemaName)
		);
	}

	setSchema(
		ruleset: string,
		schemaName: string,
		schema: Schema
	): void {

		this.schemaCache.set(
			this.getSchemaKey(ruleset, schemaName),
			schema
		);
	}

	clearSchema(
		ruleset: string,
		schemaName: string
	): void {

		this.schemaCache.delete(
			this.getSchemaKey(ruleset, schemaName)
		);
	}

	// --------------------------------------------------
	// DATA CACHE
	// --------------------------------------------------

	getData(
		ruleset: string,
		schemaName: string
	): DataFile | undefined {

		return this.dataCache.get(
			this.getDataKey(ruleset, schemaName)
		);
	}

	setData(
		ruleset: string,
		schemaName: string,
		data: DataFile
	): void {

		this.dataCache.set(
			this.getDataKey(ruleset, schemaName),
			data
		);
	}

	clearData(
		ruleset: string,
		schemaName: string
	): void {

		this.dataCache.delete(
			this.getDataKey(ruleset, schemaName)
		);
	}

	// --------------------------------------------------
	// GLOBAL INVALIDATION
	// --------------------------------------------------

	clearAll(): void {

		this.schemaCache.clear();
		this.dataCache.clear();
	}
}