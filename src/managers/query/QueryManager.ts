import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryGroupResult } from "../../types/query/QueryTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryExecutor } from "./QueryExecutor";
import { TraceLogger } from "../logging/TraceLogger";

export class QueryManager {

	constructor(
		private queryExecutor: QueryExecutor,
		private trace: TraceLogger
	) {}

	async query(
		context: SchemaContext,
		request: QueryRequest
	): Promise<DataRecord[]> {

		return await this.queryExecutor.executeQuery(
			context,
			request,
			// plan
		);
	}

	async queryAggregate(
		context: SchemaContext,
		request: QueryRequest
	): Promise<number> {

		if (!request.aggregate) {
			throw new Error(
				"Aggregate query missing aggregate definition"
			);
		}

		if (request.select?.length) {
			throw new Error(
				"Aggregate queries do not support select"
			);
		}

		if (request.sort) {
			throw new Error(
				"Aggregate queries do not support sort"
			);
		}

		if (request.limit !== undefined) {
			throw new Error(
				"Aggregate queries do not support limit"
			);
		}

		if (request.offset !== undefined) {
			throw new Error(
				"Aggregate queries do not support offset"
			);
		}

		return await this.queryExecutor.executeAggregate(
			context,
			request,
			// plan
		);
	}

	async queryGroup(
		context: SchemaContext,
		request: QueryRequest
	): Promise<QueryGroupResult[]> {

		if (!request.groupBy) {
			throw new Error(
				"Group query missing groupBy field"
			);
		}

		if (!request.aggregate) {
			throw new Error(
				"Group query requires aggregate"
			);
		}

		return await this.queryExecutor.executeGroup(
			context,
			request,
			// plan
		);
	}
}