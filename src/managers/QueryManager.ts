import { DataManager } from "./DataManager";
import { SchemaContext } from "../types/ContextTypes";
import { Query } from "../types/QueryTypes";

export class QueryManager {

	constructor(private dataManager: DataManager) {}

	async query(
		context: SchemaContext,
		query: Query
	) {

		const data =
			await this.dataManager.getAll(context);

		let results = data.map(r => r.data);

		// --------------------------
		// WHERE FILTER
		// --------------------------

		if (query.where) {
			results = results.filter(record =>
				this.matchesWhere(record, query.where!)
			);
		}

		// --------------------------
		// SORT
		// --------------------------

		if (query.sort) {
			const { field, direction } = query.sort;

			results.sort((a, b) => {
				if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
				if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		// --------------------------
		// OFFSET
		// --------------------------

		if (query.offset) {
			results = results.slice(query.offset);
		}

		// --------------------------
		// LIMIT
		// --------------------------

		if (query.limit) {
			results = results.slice(0, query.limit);
		}

		return results;
	}

	private matchesWhere(
		record: any,
		where: Record<string, any>
	): boolean {

		for (const key in where) {

			const value = where[key];
			const recordValue = record[key];

			// simple equality first
			if (typeof value !== "object") {
				if (recordValue !== value) {
					return false;
				}
				continue;
			}

			// future operators (gt, lt, etc)
			if (value.gt !== undefined && recordValue <= value.gt) return false;
			if (value.lt !== undefined && recordValue >= value.lt) return false;
		}

		return true;
	}
}