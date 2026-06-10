import { SchemaContext } from "../types/ContextTypes";
import { QueryRequest, QueryFilter } from "../types/QueryTypes";
import { IDataReader } from "../interfaces/IDataReader";
import { DataRecord } from "../types/DataTypes";

export class QueryManager {

	constructor(
		private reader: IDataReader
	) {}

	private matches(
		record: DataRecord,
		filter: QueryFilter
	): boolean {

		const value = record.data[filter.field];

		switch (filter.op) {

			case "=":
				return value === filter.value;

			case "!=":
				return value !== filter.value;

			case ">":
				return value > filter.value;

			case ">=":
				return value >= filter.value;

			case "<":
				return value < filter.value;

			case "<=":
				return value <= filter.value;

			case "in":
				return Array.isArray(filter.value)
					? filter.value.includes(value)
					: false;

			case "contains":
				return typeof value === "string"
					&& value.includes(filter.value);

			case "exists":
				return value !== undefined && value !== null;

			default:
				return false;
		}
	}

	private applyFilters(
		records: DataRecord[],
		filters: QueryFilter[]
	): DataRecord[] {

		return filters.reduce((result, filter) => {
			return result.filter(record =>
				this.matches(record, filter)
			);
		}, records);
	}

	private applySort(
		records: DataRecord[],
		sort: QueryRequest["sort"]
	): DataRecord[] {

		if (!sort) return records;

		const { field, dir } = sort;

		return [...records].sort((a, b) => {

			const av = a.data[field];
			const bv = b.data[field];

			if (av < bv) return dir === "asc" ? -1 : 1;
			if (av > bv) return dir === "asc" ? 1 : -1;

			return 0;
		});
	}

	private applyPagination(
		records: DataRecord[],
		request: QueryRequest
	): DataRecord[] {

		let result = records;

		if (request.offset) {
			result = result.slice(request.offset);
		}

		if (request.limit !== undefined) {
			result = result.slice(0, request.limit);
		}

		return result;
	}

	async query(
		context: SchemaContext,
		request: QueryRequest
	): Promise<DataRecord[]> {

		// 1. Load all data
		let records =
			await this.reader.getAll(context);

		// 2. Apply filters
		if (request.where?.length) {
			records =
				this.applyFilters(records, request.where);
		}

		// 3. Sort
		if (request.sort) {
			records =
				this.applySort(records, request.sort);
		}

		// 4. Pagination
		records =
			this.applyPagination(records, request);

		return records;
	}
}