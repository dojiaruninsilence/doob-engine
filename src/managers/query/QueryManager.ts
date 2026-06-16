import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryFilter, QueryAggregate, QueryGroupResult } from "../../types/QueryTypes";
//import { IDataReader } from "../interfaces/IDataReader";
//import {IReferenceResolver} from "../interfaces/IReferenceResolver";
import { DataRecord } from "../../types/DataTypes";
//import { Notice } from "obsidian";
//import { ContextFactory } from "./ContextFactory";
import { QueryPlanner } from "./QueryPlanner";
//import { QueryPlan } from "../types/QueryPlannerTypes";
import { QueryExecutor } from "./QueryExecutor";

export class QueryManager {

	//private referenceCache = new Map<string, any>();

	constructor(
		//private reader: IDataReader,
		//private referenceResolver: IReferenceResolver,
		//private contextFactory: ContextFactory,
		private queryPlanner: QueryPlanner,
		private queryExecutor: QueryExecutor
	) {}

	async query(
		context: SchemaContext,
		request: QueryRequest
	): Promise<DataRecord[]> {

		const plan = await this.queryPlanner.plan(context, request);

		return await this.queryExecutor.executeQuery(
			context,
			request,
			plan
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

		const plan = await this.queryPlanner.plan(context, request);

		return await this.queryExecutor.executeAggregate(
			context,
			request,
			plan
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

		const plan = await this.queryPlanner.plan(context, request);
		
		return await this.queryExecutor.executeGroup(
			context,
			request,
			plan
		);
	}
}