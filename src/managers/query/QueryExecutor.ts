import { IDataReader } from "../../interfaces/IDataReader";
import { IReferenceResolver } from "../../interfaces/IReferenceResolver";
import { ContextFactory } from "../ContextFactory";
import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryGroupResult, QueryFilter, QueryAggregate } from "../../types/QueryTypes";
import { QueryPlan } from "../../types/QueryPlannerTypes";
import { DataRecord } from "../../types/DataTypes";
import { ReferenceBatchResolver } from "../reference/ReferenceBatchResolver";
import { QueryExecutionPlanRunner } from "./QueryExecutionPlanRunner";
import { HydrationMap } from "../../types/QueryExecutionTypes";
import { Notice } from "obsidian";
import { ResolvedRecordGraphNavigator } from "./execution/ResolvedRecordGraphNavigator";
import { ResolvedRecordGraph } from "../../types/ResolvedRecordGraph";

export class QueryExecutor {

	constructor(
		private reader: IDataReader,
		private referenceResolver: IReferenceResolver,
		private contextFactory: ContextFactory,
        private batchResolver: ReferenceBatchResolver,
        private runner: QueryExecutionPlanRunner,
        private graphNavigator: ResolvedRecordGraphNavigator
	) {}

    private async matches(
        record: DataRecord,
        filter: QueryFilter,
        graph: ResolvedRecordGraph
    ): Promise<boolean> {

        const value = this.graphNavigator.getValue(graph, record.id, filter.field);

        switch (filter.op) {

            case "=":
                return value === filter.value;

            case "!=":
                return value !== filter.value;

            case ">":
                const result = value > filter.value;

                new Notice(
                    `${value} > ${filter.value} = ${result}`
                );
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

    private matchesGroup(
        group: QueryGroupResult,
        filter: QueryFilter
    ): boolean {

        let value: any;

        switch (filter.field) {

            case "value":
                value = group.value;
                break;

            case "key":
                value = group.key;
                break;

            case "count":
                value = group.records.length;
                break;

            default:
                return false;
        }

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
                return value !== undefined
                    && value !== null;

            default:
                return false;
        }
    }

    private async sum(
        records: DataRecord[],
        graph: ResolvedRecordGraph,
        field?: string
    ): Promise<number> {

        if (!field) {
            throw new Error(
                "Sum aggregate requires a field"
            );
        }

        let total = 0;

        for (const record of records) {

            const value = this.graphNavigator.getValue(graph, record.id, field);

            if (typeof value === "number") {
                total += value;
            }
        }

        return total;
    }

    private async average(
        records: DataRecord[],
        graph: ResolvedRecordGraph,
        field?: string
    ): Promise<number> {

        if (records.length === 0) {
            return 0;
        }

        const total =
            await this.sum(
                records,
                graph,
                field
            );

        return total / records.length;
    }

    private async minimum(
        records: DataRecord[],
        graph: ResolvedRecordGraph,
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

            const value = this.graphNavigator.getValue(graph, record.id, field);

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
        records: DataRecord[],
        graph: ResolvedRecordGraph,
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

            const value = this.graphNavigator.getValue(graph, record.id, field);

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
        aggregate: QueryAggregate,
        graph: ResolvedRecordGraph
    ): Promise<number> {

        switch (aggregate.op) {

            case "count":
                return records.length;

            case "sum":
                return await this.sum(
                    records,
                    graph,
                    aggregate.field
                );

            case "avg":
                return await this.average(
                    records,
                    graph,
                    aggregate.field
                );

            case "min":
                return await this.minimum(
                    records,
                    graph,
                    aggregate.field
                );

            case "max":
                return await this.maximum(
                    records,
                    graph,
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
        records: DataRecord[],
        filters: QueryFilter[],
        graph: ResolvedRecordGraph
    ): Promise<DataRecord[]> {

        let result = records;

        for (const filter of filters) {

            const evaluated = await Promise.all(
                result.map(async (record) => ({
                    record,
                    keep: await this.matches(
                        record,
                        filter,
                        graph
                    )
                }))
            );

            result = evaluated
                .filter(x => x.keep)
                .map(x => x.record);
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
        records: DataRecord[],
        graph: ResolvedRecordGraph,
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
                    await this.graphNavigator.getValue(
                        graph,
                        record.id,
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
        graph: ResolvedRecordGraph,
        having?: QueryFilter[]
    ): Promise<QueryGroupResult[]> {

        if (!having?.length) return groups;

        let result = groups;

        for (const filter of having) {

            const next: QueryGroupResult[] = [];

            for (const group of result) {

                if (this.matchesGroup(group, filter)) {
                    next.push(group);
                }
            }

            result = next;
        }

        return result;
    }

    private async getValueByPath(
        context: SchemaContext,
        record: DataRecord,
        path: string,
        hydrationMap: HydrationMap
    ): Promise<any> {

        const parts = path.split(".");

        let current: any = record.data;
        let currentContext = context;

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];

            if (current == null) {
                return undefined;
            }

            const value = current[part];

            // Last segment
            if (i === parts.length - 1) {
                return value;
            }

            const field =
                currentContext.schema.fields[part];

            // Reference traversal
            if (field?.type === "reference") {

                if (typeof value !== "string") {
                    return undefined;
                }

                const targetSchema =
                    field.referenceTarget.schema;

                const schemaMap =
                    hydrationMap.get(targetSchema);

                const resolved =
                    schemaMap?.get(value);

                if (!resolved) {
                    return undefined;
                }

                current = resolved.data;

                currentContext =
                    await this.contextFactory.getSchemaContext(
                        field.referenceTarget.ruleset,
                        targetSchema
                    );

                continue;
            }

            // Normal object traversal
            current = value;
        }

        return current;
    }

	async executeQuery(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<any[]> {
		// 1. Load all data
		let records =
			await this.reader.getAll(context);

        const graph = await this.runner.run(context, records, plan);

        

		// 2. Apply filters
		if (request.where?.length) {
			records =
				await this.applyFilters(records, request.where, graph);
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
			records,
            graph,
			request.select
		);
	}

    async executeAggregate(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<number> {
        let records =
			await this.reader.getAll(context);

        const graph = await this.runner.run(context, records, plan);

		if (request.where?.length) {

			records =
				await this.applyFilters(
					records,
					request.where,
                    graph
				);
		}

		return await this.aggregate(
			context,
			records,
			request.aggregate,
            graph
		);
    }

    async executeGroup(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<QueryGroupResult[]> {

        let records = await this.reader.getAll(context);

        const graph = await this.runner.run(context, records, plan);

		// 2. Apply filters
		if (request.where?.length) {
			records =
				await this.applyFilters(
					records,
					request.where,
                    graph
				);
		}

		// 3. Build groups
		const groups =
			new Map<any, DataRecord[]>();

		for (const record of records) {

			const key = this.graphNavigator.getValue(graph, record.id, request.groupBy);

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
					request.aggregate,
                    graph
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
                graph,
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