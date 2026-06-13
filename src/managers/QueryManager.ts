import { SchemaContext } from "../types/ContextTypes";
import { QueryRequest, QueryFilter, QueryAggregate, QueryGroupResult } from "../types/QueryTypes";
import { IDataReader } from "../interfaces/IDataReader";
import {IReferenceResolver} from "../interfaces/IReferenceResolver";
import { DataRecord } from "../types/DataTypes";
import { Notice } from "obsidian";
import { ContextFactory } from "./ContextFactory";
import { QueryPlanner } from "../planners/QueryPlanner";
import { QueryPlan } from "../types/QueryPlannerTypes";

export class QueryManager {

	private referenceCache = new Map<string, any>();

	constructor(
		private reader: IDataReader,
		private referenceResolver: IReferenceResolver,
		private contextFactory: ContextFactory,
		private queryPlanner: QueryPlanner
	) {}

	private async matches(
		context: SchemaContext,
		record: DataRecord,
		filter: QueryFilter
	): Promise<boolean> {

		const value =
			await this.getValueByPath(context, record, filter.field);

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

	private async sum(
		context: SchemaContext,
		records: DataRecord[],
		field?: string
	): Promise<number> {

		if (!field) {
			throw new Error(
				"Sum aggregate requires a field"
			);
		}

		let total = 0;

		for (const record of records) {

			const value =
				await this.getValueByPath(
					context,
					record,
					field
				);

			if (typeof value === "number") {
				total += value;
			}
		}

		return total;
	}

	private async average(
		context: SchemaContext,
		records: DataRecord[],
		field?: string
	): Promise<number> {

		if (records.length === 0) {
			return 0;
		}

		const total =
			await this.sum(
				context,
				records,
				field
			);

		return total / records.length;
	}

	private async minimum(
		context: SchemaContext,
		records: DataRecord[],
		field?: string
	): Promise<number> {

		if (!field) {
			throw new Error(
				"Min aggregate requires a field"
			);
		}

		let min =
			Infinity;

		for (const record of records) {

			const value =
				await this.getValueByPath(
					context,
					record,
					field
				);

			if (
				typeof value === "number" &&
				value < min
			) {
				min = value;
			}
		}

		return min === Infinity
			? 0
			: min;
	}

	private async maximum(
		context: SchemaContext,
		records: DataRecord[],
		field?: string
	): Promise<number> {

		if (!field) {
			throw new Error(
				"Max aggregate requires a field"
			);
		}

		let max =
			-Infinity;

		for (const record of records) {

			const value =
				await this.getValueByPath(
					context,
					record,
					field
				);

			if (
				typeof value === "number" &&
				value > max
			) {
				max = value;
			}
		}

		return max === -Infinity
			? 0
			: max;
	}

	private async aggregate(
		context: SchemaContext,
		records: DataRecord[],
		aggregate: QueryAggregate
	): Promise<number> {

		switch (aggregate.op) {

			case "count":
				return records.length;

			case "sum":
				return await this.sum(
					context,
					records,
					aggregate.field
				);

			case "avg":
				return await this.average(
					context,
					records,
					aggregate.field
				);

			case "min":
				return await this.minimum(
					context,
					records,
					aggregate.field
				);

			case "max":
				return await this.maximum(
					context,
					records,
					aggregate.field
				);

			default:
				throw new Error(
					`Unknown aggregate operation: ${aggregate.op}`
				);
		}
	}

	private setProjectedValue(
		target: any,
		path: string,
		value: any
	) {

		const parts = path.split(".");
		let current = target;

		for (let i = 0; i < parts.length; i++) {

			const part = parts[i];

			if (i === parts.length - 1) {
				current[part] = value;
				return;
			}

			if (!current[part]) {
				current[part] = {};
			}

			current = current[part];
		}
	}

	private async applyFilters(
		context: SchemaContext,
		records: DataRecord[],
		filters: QueryFilter[]
	): Promise<DataRecord[]> {

		let result = records;

		for (const filter of filters) {

			const next: DataRecord[] = [];

			for (const record of result) {

				if (await this.matches(context, record, filter)) {
					next.push(record);
				}
			}

			result = next;
		}

		return result;
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

	private applyGroupSort(
		groups: QueryGroupResult[],
		sort?: QueryRequest["sort"]
	): QueryGroupResult[] {

		if (!sort) {
			return groups;
		}

		const { field, dir } = sort;

		return [...groups].sort((a, b) => {

			let av: any;
			let bv: any;

			switch (field) {

				case "key":
					av = a.key;
					bv = b.key;
					break;

				case "count":
					av = a.records.length;
					bv = b.records.length;
					break;

				case "value":
					av = a.value;
					bv = b.value;
					break;

				default:
					return 0;
			}

			if (av < bv) {
				return dir === "asc" ? -1 : 1;
			}

			if (av > bv) {
				return dir === "asc" ? 1 : -1;
			}

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

	private async applyProjection(
		context: SchemaContext,
		records: DataRecord[],
		select?: string[]
	): Promise<any[]> {

		if (!select || select.length === 0) {
			return records;
		}

		const result: any[] = [];

		for (const record of records) {

			const projected: any = {
				id: record.id
			};

			for (const path of select) {

				const value =
					await this.getValueByPath(
						context,
						record,
						path
					);

				this.setProjectedValue(
					projected,
					path,
					value
				);
			}

			result.push(projected);
		}

		return result;
	}

	private async applyHaving(
		groups: QueryGroupResult[],
		context: SchemaContext,
		having?: QueryFilter[]
	): Promise<QueryGroupResult[]> {

		if (!having?.length) return groups;

		let result = groups;

		for (const filter of having) {

			const next: QueryGroupResult[] = [];

			for (const group of result) {

				// Build pseudo-record for reuse of existing matcher
				const fakeRecord = {
					data: {
						key: group.key,
						value: group.value,
						count: group.records.length
					}
				} as any;

				const matches =
					await this.matches(
						context,
						fakeRecord,
						filter
					);

				if (matches) {
					next.push(group);
				}
			}

			result = next;
		}

		return result;
	}
	
	private async resolveReference(
		context: SchemaContext,
		fieldName: string,
		id: string
	) {

		if (this.referenceCache.has(id)) {
			return this.referenceCache.get(id);
		}

		const resolved =
			await this.referenceResolver.resolve(context, fieldName, id);

		this.referenceCache.set(id, resolved);

		return resolved;
	}

	private async getValueByPath(
		context: SchemaContext,
		record: DataRecord,
		path: string
	): Promise<any> {

		const parts = path.split(".");

		let current: any = record.data;
		let currentContext = context;

		for (let i = 0; i < parts.length; i++) {

			const part = parts[i];

			if (current == null) return undefined;

			const value = current[part];

			// LAST SEGMENT
			if (i === parts.length - 1) {
				return value;
			}

			// ONLY treat as reference if schema says so
			const field = currentContext.schema.fields[part];

			if (field?.type === "reference") {

				if (typeof value !== "string") {
					return undefined;
				}

				const resolved =
					await this.resolveReference(
						currentContext,
						part,
						value
					);

				if (!resolved) return undefined;

				current = resolved.data;

				currentContext =
					await this.contextFactory.getSchemaContext(
						field.referenceTarget.ruleset,
						field.referenceTarget.schema
					);

				continue;
			}

			// 🔥 IMPORTANT FIX:
			// After first hop OR non-reference:
			// just treat as object traversal

			current = value;
		}

		return current;
	}

	private async preloadReferences(
		context: SchemaContext,
		records: DataRecord[],
		plan: QueryPlan
	): Promise<void> {

		if (plan.steps.length === 0) {
			return;
		}

		let currentRecords = records;
		let currentContext = context;

		for (const step of plan.steps) {

			const nextRecords: DataRecord[] = [];

			for (const record of currentRecords) {

				const id =
					record.data?.[step.field];

				if (typeof id !== "string") {
					continue;
				}

				const resolved =
					await this.resolveReference(
						currentContext,
						step.field,
						id
					);

				if (!resolved) {
					continue;
				}

				nextRecords.push(resolved);
			}

			currentContext =
				await this.contextFactory.getSchemaContext(
					step.toRuleset ?? context.ruleset,
					step.to
				);

			currentRecords = nextRecords;
		}
	}

	async query(
		context: SchemaContext,
		request: QueryRequest
	): Promise<DataRecord[]> {

		/*const plan =
			await this.queryPlanner.plan(context, request);

		new Notice(
			`Query plan steps: ${plan.steps.length}`
		);*/

		// 1. Load all data
		let records =
			await this.reader.getAll(context);

		const plan = await this.queryPlanner.plan(context, request);
		await this.preloadReferences(context, records, plan);

		// 2. Apply filters
		if (request.where?.length) {
			records =
				await this.applyFilters(context, records, request.where);
		}

		// 3. Sort
		if (request.sort) {
			records =
				this.applySort(records, request.sort);
		}

		// 4. Pagination
		records =
			this.applyPagination(records, request);

		return await this.applyProjection(
			context,
			records,
			request.select
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

		let records =
			await this.reader.getAll(context);

		const plan = await this.queryPlanner.plan(context, request);
		await this.preloadReferences(context, records, plan);

		if (request.where?.length) {

			records =
				await this.applyFilters(
					context,
					records,
					request.where
				);
		}

		return await this.aggregate(
			context,
			records,
			request.aggregate
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

		// 1. Load all data
		let records =
			await this.reader.getAll(context);

		const plan = await this.queryPlanner.plan(context, request);
		await this.preloadReferences(context, records, plan);

		// 2. Apply filters
		if (request.where?.length) {
			records =
				await this.applyFilters(
					context,
					records,
					request.where
				);
		}

		// 3. Build groups
		const groups =
			new Map<any, DataRecord[]>();

		for (const record of records) {

			const key =
				await this.getValueByPath(
					context,
					record,
					request.groupBy
				);

			if (!groups.has(key)) {
				groups.set(key, []);
			}

			groups.get(key)!.push(record);
		}

		// 4. Aggregate each group
		let results: QueryGroupResult[] = [];

		for (const [key, groupRecords] of groups) {

			const value =
				await this.aggregate(
					context,
					groupRecords,
					request.aggregate
				);

			results.push({
				key,
				records: groupRecords,
				value
			});
		}

		results =
			await this.applyHaving(
				results,
				context,
				request.having
			);

		results =
			this.applyGroupSort(
				results,
				request.sort
			);

		return results;
	}
}