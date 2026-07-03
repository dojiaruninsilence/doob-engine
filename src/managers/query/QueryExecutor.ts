import { IDataReader } from "../../interfaces/IDataReader";
import { ContextFactory } from "../ContextFactory";
import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryGroupResult, QueryFilter/*, QueryAggregate*/ } from "../../types/QueryTypes";
import { QueryPlan } from "../../types/QueryPlannerTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryExecutionPlanRunner } from "./QueryExecutionPlanRunner";
//import { HydrationMap } from "../../types/QueryExecutionTypes";
import { Notice } from "obsidian";
import { ResolvedRecordGraphNavigator } from "./graph/ResolvedRecordGraphNavigator";
import { ResolvedRecordGraph } from "../../types/ResolvedRecordGraph";
import { AggregateRequest } from "../../types/AggregateTypes";
import { AggregateResolver } from "./aggregate/AggregateResolver";
import { Schema } from "../../types/SchemaTypes";
import { QueryMatchBuilder } from "./match/QueryMatchBuilder";
import { QueryMatchNavigator } from "./match/QueryMatchNavigator";
import { QueryMatch } from "../../types/QueryMatchTypes";

export class QueryExecutor {

	constructor(
		private reader: IDataReader,
		private contextFactory: ContextFactory,
        private runner: QueryExecutionPlanRunner,
        private graphNavigator: ResolvedRecordGraphNavigator,
        private aggregateResolver: AggregateResolver,
        private matchBuilder: QueryMatchBuilder,
        private matchNavigator: QueryMatchNavigator
	) {}

    private normalizeValue(value: any): any[] {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }

    private async matches(
        record: DataRecord,
        filter: QueryFilter,
        graph: ResolvedRecordGraph
    ): Promise<boolean> {

        //const value = this.graphNavigator.getValue(graph, record.id, filter.field);
        const rawValue = this.graphNavigator.getValue(graph, record.id, filter.field);
        const values = this.normalizeValue(rawValue);

        // new Notice(
        //     JSON.stringify({
        //         field: filter.field,
        //         rawValue
        //     })
        // );

        switch (filter.op) {

            case "=":
                return values.some(v => v === filter.value);
                //return value === filter.value;

            case "!=":
                return values.every(v => v !== filter.value);
                //return value !== filter.value;

            case ">":
                return values.some(v => v > filter.value);
                //return value > filter.value;

            case ">=":
                return values.some(v => v >= filter.value);
                //return value >= filter.value;

            case "<":
                return values.some(v => v < filter.value);
                //return value < filter.value;

            case "<=":
                return values.some(v => v <= filter.value);
                //return value <= filter.value;

            case "in":
                return Array.isArray(filter.value)
                    ? values.some(v => filter.value.includes(v))
                    : false;
                // return Array.isArray(filter.value)
                //     ? filter.value.includes(value)
                //     : false;

            case "contains":
                return values.some(v =>
                    typeof v === "string" && v.includes(filter.value)
                );
                // return typeof value === "string"
                //     && value.includes(filter.value);

            case "exists":
                return values.length > 0;
                // return value !== undefined && value !== null;

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

    private async evaluateAggregate(
        graph: ResolvedRecordGraph,
        records: DataRecord[],
        request: AggregateRequest
    ): Promise<any> {

        const matches =
            records.map(record => ({
                rootId: record.id,
                currentId: record.id,
                pathIndexes: [],
                pathNodes: [record.id],
                bindings: {}
            }));

        const group: QueryGroupResult = {
            key: "__all__",
            records,
            matches,
            value: 0
        };

        return this.aggregateResolver.evaluate(
            graph,
            group,
            records[0]?.id,
            request
        );
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
            const isLast = i === parts.length - 1;

            if (isLast) {

                // -----------------------------
                // CASE 1: no existing value
                // -----------------------------
                if (!(part in current)) {
                    current[part] = value;
                    return;
                }

                const existing = current[part];

                // -----------------------------
                // CASE 2: both arrays → merge
                // -----------------------------
                if (Array.isArray(existing) && Array.isArray(value)) {
                    current[part] = [...new Set([...existing, ...value])];
                    return;
                }

                // -----------------------------
                // CASE 3: existing scalar + new array
                // -----------------------------
                if (!Array.isArray(existing) && Array.isArray(value)) {
                    current[part] = [existing, ...value];
                    return;
                }

                // -----------------------------
                // CASE 4: existing array + new scalar
                // -----------------------------
                if (Array.isArray(existing) && !Array.isArray(value)) {
                    if (!existing.includes(value)) {
                        existing.push(value);
                    }
                    return;
                }

                // -----------------------------
                // CASE 5: scalar overwrite (same shape)
                // -----------------------------
                current[part] = value;
                return;
            }

            if (!current[part] || typeof current[part] !== "object") {
                current[part] = {};
            }

            current = current[part];
        }
    }

    // private setProjectedValue(
    //     target: any,
    //     path: string,
    //     value: any
    // ) {

    //     const parts = path.split(".");
    //     let current = target;

    //     for (let i = 0; i < parts.length; i++) {

    //         const part = parts[i];

    //         if (i === parts.length - 1) {
    //             current[part] = value;
    //             return;
    //         }

    //         if (!current[part]) {
    //             current[part] = {};
    //         }

    //         current = current[part];
    //     }
    // }

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
        schema: Schema,
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

                // const value =
                //     await this.graphNavigator.getValue(
                //         graph,
                //         record.id,
                //         path
                //     );

                // const rawValue = this.graphNavigator.getValue(graph, record.id, path);
                // const values = this.normalizeValue(rawValue);

                // this.setProjectedValue(
                //     projected,
                //     path,
                //     values
                // );

                const rawValue =
                    this.graphNavigator.getValue(graph, record.id, path);

                const field = schema.fields[path.split(".")[0]];

                // --------------------------------------------------
                // CASE 1: no field (safety fallback)
                // --------------------------------------------------
                if (!field) {
                    this.setProjectedValue(projected, path, rawValue);
                    continue;
                }

                // --------------------------------------------------
                // CASE 2: referenceCollection OR array field
                // --------------------------------------------------
                if (field.type === "referenceCollection") {

                    const values = this.normalizeValue(rawValue);
                    this.setProjectedValue(projected, path, values);
                    continue;
                }

                // --------------------------------------------------
                // CASE 3: scalar field → DO NOT wrap
                // --------------------------------------------------
                this.setProjectedValue(projected, path, rawValue);
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

    private resolveGroupByFromRoot(
        graph: ResolvedRecordGraph,
        match: QueryMatch,
        path: string
    ): any {

        // new Notice(
        //     String(
        //         this.matchNavigator.getValue(
        //             graph,
        //             match,
        //             path
        //         )
        //     )
        // );

        const parts = path.split(".");

        let node = graph.nodes.get(match.rootId);

        if (!node) return undefined;

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (isLast) {
                return node.data?.[part];
            }

            const refs = node.refs.get(part);

            if (!refs?.length) {
                return undefined;
            }

            node = graph.nodes.get(refs[0]);

            if (!node) return undefined;
        }

        return undefined;
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
            context.schema,
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

		return await this.evaluateAggregate(
            graph,
            records,
            request.aggregate
        );
    }

    async executeGroup(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<QueryGroupResult[]> {

        // ----------------------------------
        // 1. Load records + graph
        // ----------------------------------

        let records =
            await this.reader.getAll(context);

        const graph =
            await this.runner.run(
                context,
                records,
                plan
            );

        // new Notice(
        //     JSON.stringify({
        //         graph
        //     }, null, 2)
        // );

        if (request.where?.length) {

            records =
                await this.applyFilters(
                    records,
                    request.where,
                    graph
                );
        }

        const validRoots =
            new Set(
                records.map(r => r.id)
            );

        // ----------------------------------
        // 2. Build matches
        // ----------------------------------

        const matches =
            this.matchBuilder
                .build(graph, plan)
                .filter(
                    m =>
                        validRoots.has(
                            m.rootId
                        )
                );

        // ----------------------------------
        // 3. Grouping
        // ----------------------------------

        const groups =
            new Map<any, QueryGroupResult>();

        const mode =
            request.groupByMode ??
            "fanout";

        for (const match of matches) {

            // new Notice(
            //     JSON.stringify({
            //         match
            //     }, null, 2)
            // );

            const rawKey =
                this.matchNavigator.getGroupValue(
                    graph,
                    match,
                    request.groupBy!
                );

            // const rawKey =
            //     this.matchNavigator
            //         .resolveGroupValues(
            //             graph,
            //             match,
            //             request.groupBy!
            //         )
            //         .map(v => v.value);

            // new Notice(
            //     JSON.stringify(rawKey, null, 2)
            // );

            const keys =
                this.normalizeValue(rawKey)
                    .filter(
                        k =>
                            k !== undefined &&
                            k !== null
                    );

            let finalKeys: any[];

            switch (mode) {

                case "collapse":

                    finalKeys =
                        keys.length
                            ? [keys.join("|")]
                            : [];

                    break;

                case "first":

                    finalKeys =
                        keys.length
                            ? [keys[0]]
                            : [];

                    break;

                case "distinct":

                    finalKeys =
                        [...new Set(keys)];

                    break;

                case "fanout":
                default:

                    finalKeys =
                        keys;

                    break;
            }

            for (const key of finalKeys) {

                let group =
                    groups.get(key);

                if (!group) {

                    group = {
                        key,
                        records: [],
                        matches: [],
                        value: 0
                    };

                    groups.set(
                        key,
                        group
                    );
                }

                group.matches.push(match);

                const rootRecord =
                    records.find(
                        r =>
                            r.id ===
                            match.rootId
                    );

                if (
                    rootRecord &&
                    !group.records.some(
                        r =>
                            r.id ===
                            rootRecord.id
                    )
                ) {

                    group.records.push(
                        rootRecord
                    );
                }
            }
        }

        // ----------------------------------
        // 4. Aggregate
        // ----------------------------------

        const results:
            QueryGroupResult[] = [];

        for (const group of groups.values()) {

            group.value =
                await this.aggregateResolver.evaluate(
                    graph,
                    group,
                    group.matches[0]?.rootId,
                    request.aggregate
                );

            results.push(group);
        }

        // ----------------------------------
        // 5. Having
        // ----------------------------------

        const filtered =
            await this.applyHaving(
                results,
                context,
                graph,
                request.having
            );

        // ----------------------------------
        // 6. Sort
        // ----------------------------------

        return this.applyGroupSort(
            filtered,
            request.sort
        );
    }
    
    // async executeGroup(
    //     context: SchemaContext,
    //     request: QueryRequest,
    //     plan: QueryPlan
    // ): Promise<QueryGroupResult[]> {

    //     // ----------------------------------
    //     // 1. Load records + graph
    //     // ----------------------------------

    //     let records = await this.reader.getAll(context);

    //     const graph =
    //         await this.runner.run(context, records, plan);

    //     if (request.where?.length) {
    //         records =
    //             await this.applyFilters(records, request.where, graph);
    //     }

    //     const validRoots =
    //         new Set(records.map(r => r.id));

    //     // ----------------------------------
    //     // 2. Build MATCHES (NO FILTERING EXCEPT ROOT VALIDITY)
    //     // ----------------------------------

    //     // new Notice(
    //     //     JSON.stringify(plan.steps, null, 2)
    //     // );

    //     let matches =
    //         this.matchBuilder.build(graph, plan)
    //             .filter(m => validRoots.has(m.pathNodes[0]));

    //     // for (const match of matches) {
    //     //     new Notice(
    //     //         JSON.stringify({
    //     //             rootId: match.rootId,
    //     //             currentId: match.currentId,
    //     //             pathNodes: match.pathNodes,
    //     //             pathIndexes: match.pathIndexes,
    //     //             bindings: match.bindings
    //     //         }, null, 2)
    //     //     );
    //     // }

    //     // ----------------------------------
    //     // 3. GROUPING (NO DEDUPE)
    //     // ----------------------------------

    //     const groups =
    //         new Map<any, QueryGroupResult>();

    //     const mode = request.groupByMode ?? "fanout";

    //     for (const match of matches) {

    //         // new Notice(
    //         //     JSON.stringify({
    //         //         currentId: match.currentId,
    //         //         bindings: match.bindings,
    //         //         pathNodes: match.pathNodes,
    //         //         pathIndexes: match.pathIndexes
    //         //     }, null, 2)
    //         // );
            
    //         // new Notice(
    //         //     JSON.stringify(match.bindings, null, 2)
    //         // );

    //         // const rawKey =
    //         //     this.matchNavigator.getValue(
    //         //         graph,
    //         //         match,
    //         //         request.groupBy
    //         //     );

    //         // const rawKey =
    //         //     this.resolveGroupByFromRoot(
    //         //         graph,
    //         //         match,
    //         //         request.groupBy
    //         //     );

    //         // const rawKey =
    //         //     this.matchNavigator.getValue(
    //         //         graph,
    //         //         match,
    //         //         request.groupBy
    //         //     );

    //         // const requiresMatchTraversal =
    //         //     plan.steps.some(
    //         //         step =>
    //         //             request.groupBy === step.path ||
    //         //             request.groupBy.startsWith(step.path + ".")
    //         //     );

    //         const requiresMatchTraversal =
    //             plan.steps.some(
    //                 step => request.groupBy === step.path
    //             );

    //         const rawKey =
    //             requiresMatchTraversal
    //                 ? this.matchNavigator.getValue(
    //                     graph,
    //                     match,
    //                     request.groupBy
    //                 )
    //                 : this.resolveGroupByFromRoot(
    //                     graph,
    //                     match,
    //                     request.groupBy
    //                 );

    //         // new Notice(
    //         //     [
    //         //         `GroupBy: ${request.groupBy}`,
    //         //         `RequiresMatch: ${requiresMatchTraversal}`
    //         //     ].join("\n")
    //         // );

    //         // new Notice(
    //         //     [
    //         //         `GroupBy: ${request.groupBy}`,
    //         //         `CurrentId: ${match.currentId}`,
    //         //         `Key: ${rawKey}`
    //         //     ].join("\n")
    //         // );

    //         const keys =
    //             this.normalizeValue(rawKey)
    //                 .filter(k => k !== undefined && k !== null);

    //         let finalKeys: any[];

    //         switch (mode) {

    //             case "collapse":
    //                 finalKeys = keys.length ? [keys.join("|")] : [];
    //                 break;

    //             case "first":
    //                 finalKeys = keys.length ? [keys[0]] : [];
    //                 break;

    //             case "distinct":
    //                 finalKeys = [...new Set(keys)];
    //                 break;

    //             case "fanout":
    //             default:
    //                 finalKeys = keys;
    //                 break;
    //         }

    //         for (const key of finalKeys) {

    //             // new Notice(
    //             //     `Group ${key} Bindings ${JSON.stringify(match.bindings)}`
    //             // );

    //             if (!groups.has(key)) {
    //                 groups.set(key, {
    //                     key,
    //                     records: [],
    //                     matches: [],
    //                     value: 0
    //                 });
    //             }

    //             const group = groups.get(key)!;

    //             group.matches.push(match);

    //             // keep record list (optional cache only)
    //             const rootRecord =
    //                 records.find(r => r.id === match.rootId);

    //             if (
    //                 rootRecord &&
    //                 !group.records.some(r => r.id === rootRecord.id)
    //             ) {
    //                 group.records.push(rootRecord);
    //             }

    //             // new Notice(
    //             //     [
    //             //         `GROUP: ${key}`,
    //             //         `MATCHES: ${group.matches.length}`,
    //             //         ...group.matches.map(m =>
    //             //             JSON.stringify({
    //             //                 rootId: m.rootId,
    //             //                 currentId: m.currentId,
    //             //                 pathNodes: m.pathNodes
    //             //             })
    //             //         )
    //             //     ].join("\n")
    //             // );
    //         }
    //     }

    //     // ----------------------------------
    //     // 4. AGGREGATION (MATCH-BASED ONLY)
    //     // ----------------------------------

    //     const results: QueryGroupResult[] = [];

    //     for (const group of groups.values()) {

    //         new Notice(
    //             [
    //                 `Group ${group.key}`,
    //                 `Matches ${group.matches.length}`
    //             ].join("\n")
    //         );

    //         group.value =
    //             await this.aggregateResolver.evaluate(
    //                 graph,
    //                 group,
    //                 group.matches[0]?.rootId,
    //                 request.aggregate
    //             );

    //         results.push(group);
    //     }

    //     // ----------------------------------
    //     // 5. HAVING
    //     // ----------------------------------

    //     const filtered =
    //         await this.applyHaving(
    //             results,
    //             context,
    //             graph,
    //             request.having
    //         );

    //     // ----------------------------------
    //     // 6. SORT
    //     // ----------------------------------

    //     return this.applyGroupSort(filtered, request.sort);
    // }

    // async executeGroup(
    //     context: SchemaContext,
    //     request: QueryRequest,
    //     plan: QueryPlan
    // ): Promise<QueryGroupResult[]> {

    //     // ----------------------------------
    //     // 1. Load base records
    //     // ----------------------------------

    //     let records =
    //         await this.reader.getAll(context);

    //     const graph =
    //         await this.runner.run(
    //             context,
    //             records,
    //             plan
    //         );

    //     // ----------------------------------
    //     // 2. Apply record-level filters
    //     // ----------------------------------

    //     if (request.where?.length) {

    //         records =
    //             await this.applyFilters(
    //                 records,
    //                 request.where,
    //                 graph
    //             );
    //     }

    //     const validRoots =
    //         new Set(records.map(r => r.id));

    //     // ----------------------------------
    //     // 3. Build MATCHES (source of truth)
    //     // ----------------------------------

    //     let matches =
    //         this.matchBuilder.build(graph, plan);

    //     matches =
    //         matches.filter(m =>
    //             validRoots.has(m.rootId)
    //         );

    //     // ----------------------------------
    //     // 4. GROUPING
    //     // ----------------------------------

    //     const groups =
    //         new Map<any, QueryGroupResult>();

    //     // IMPORTANT: prevents duplicate match insertion per group
    //     const groupMatchIndex =
    //         new Map<any, Set<string>>();

    //     const mode =
    //         request.groupByMode ?? "fanout";

    //     for (const match of matches) {

    //         // ----------------------------------
    //         // Resolve group key
    //         // ----------------------------------

    //         const rawKey =
    //             this.matchNavigator.getValue(
    //                 graph,
    //                 match,
    //                 request.groupBy
    //             );

    //         const keys =
    //             this.normalizeValue(rawKey)
    //                 .filter(k =>
    //                     k !== undefined &&
    //                     k !== null
    //                 );

    //         let finalKeys: any[];

    //         switch (mode) {

    //             case "collapse":
    //                 finalKeys =
    //                     keys.length
    //                         ? [keys.join("|")]
    //                         : [];
    //                 break;

    //             case "first":
    //                 finalKeys =
    //                     keys.length
    //                         ? [keys[0]]
    //                         : [];
    //                 break;

    //             case "distinct":
    //                 finalKeys =
    //                     [...new Set(keys)];
    //                 break;

    //             case "fanout":
    //             default:
    //                 finalKeys = keys;
    //                 break;
    //         }

    //         // ----------------------------------
    //         // Assign match into groups
    //         // ----------------------------------

    //         for (const key of finalKeys) {

    //             if (!groups.has(key)) {

    //                 groups.set(key, {
    //                     key,
    //                     records: [],
    //                     matches: [],
    //                     value: 0
    //                 });

    //                 groupMatchIndex.set(key, new Set());
    //             }

    //             const group =
    //                 groups.get(key)!;

    //             const seen =
    //                 groupMatchIndex.get(key)!;

    //             // const matchId =
    //             //     `${match.rootId}`;

    //             const matchId =
    //                 JSON.stringify(match.bindings);

    //             // ----------------------------------
    //             // HARD DEDUPE (CRITICAL FIX)
    //             // ----------------------------------

    //             if (seen.has(matchId)) {
    //                 continue;
    //             }

    //             seen.add(matchId);
    //             group.matches.push(match);

    //             // Optional: keep root record list in sync
    //             const rootRecord =
    //                 records.find(r => r.id === match.rootId);

    //             if (
    //                 rootRecord &&
    //                 !group.records.some(r => r.id === rootRecord.id)
    //             ) {
    //                 group.records.push(rootRecord);
    //             }
    //         }
    //     }

    //     // ----------------------------------
    //     // 5. AGGREGATION
    //     // ----------------------------------

    //     const results: QueryGroupResult[] = [];

    //     for (const group of groups.values()) {

    //         new Notice(
    //             [
    //                 `Group: ${group.key}`,
    //                 `Matches: ${group.matches.length}`,
    //                 `Records: ${group.records.length}`
    //             ].join("\n")
    //         );

    //         group.value =
    //             await this.aggregateResolver.evaluate(
    //                 graph,
    //                 group,
    //                 group.matches[0]?.rootId,
    //                 request.aggregate
    //             );

    //         results.push(group);
    //     }

    //     // ----------------------------------
    //     // 6. HAVING FILTER
    //     // ----------------------------------

    //     const filtered =
    //         await this.applyHaving(
    //             results,
    //             context,
    //             graph,
    //             request.having
    //         );

    //     // ----------------------------------
    //     // 7. SORT
    //     // ----------------------------------

    //     return this.applyGroupSort(
    //         filtered,
    //         request.sort
    //     );
    // }

    // async executeGroup(
    //     context: SchemaContext,
    //     request: QueryRequest,
    //     plan: QueryPlan
    // ): Promise<QueryGroupResult[]> {

    //     let records =
    //         await this.reader.getAll(context);

    //     const graph =
    //         await this.runner.run(
    //             context,
    //             records,
    //             plan
    //         );

    //     // ----------------------------------
    //     // Apply record filters first
    //     // ----------------------------------

    //     if (request.where?.length) {

    //         records =
    //             await this.applyFilters(
    //                 records,
    //                 request.where,
    //                 graph
    //             );
    //     }

    //     // ----------------------------------
    //     // Build matches
    //     // ----------------------------------

    //     let matches =
    //         this.matchBuilder.build(
    //             graph,
    //             plan
    //         );

    //     // Keep only matches whose root record survived filtering
    //     const validRoots =
    //         new Set(records.map(r => r.id));

    //     matches =
    //         matches.filter(
    //             m => validRoots.has(m.rootId)
    //         );

    //     // ----------------------------------
    //     // Build groups
    //     // ----------------------------------

    //     const groups =
    //         new Map<any, QueryGroupResult>();

    //     const mode =
    //         request.groupByMode ?? "fanout";

    //     new Notice(`Matches: ${matches.length}`);

    //     for (const match of matches) {

    //         const rawKey =
    //             this.matchNavigator.getValue(
    //                 graph,
    //                 match,
    //                 request.groupBy
    //             );

    //         const keys =
    //             this.normalizeValue(rawKey)
    //                 .filter(
    //                     k => k !== undefined &&
    //                     k !== null
    //                 );

    //         let finalKeys: any[];

    //         switch (mode) {

    //             case "collapse":

    //                 finalKeys =
    //                     keys.length
    //                         ? [keys.join("|")]
    //                         : [];

    //                 break;

    //             case "first":

    //                 finalKeys =
    //                     keys.length
    //                         ? [keys[0]]
    //                         : [];

    //                 break;

    //             case "distinct":

    //                 finalKeys =
    //                     [...new Set(keys)];

    //                 break;

    //             case "fanout":
    //             default:

    //                 finalKeys = keys;

    //                 break;
    //         }

    //         for (const key of finalKeys) {

    //             // new Notice(
    //             //     `Key: ${JSON.stringify(key)}`
    //             // );

    //             if (!groups.has(key)) {

    //                 const rootRecord =
    //                     records.find(
    //                         r => r.id === match.rootId
    //                     );

    //                 groups.set(key, {
    //                     key,
    //                     records:
    //                         rootRecord
    //                             ? [rootRecord]
    //                             : [],
    //                     matches: [],
    //                     value: 0
    //                 });
    //             }

    //             const group =
    //                 groups.get(key)!;

    //             group.matches.push(match);

    //             const rootRecord =
    //                 records.find(
    //                     r => r.id === match.rootId
    //                 );

    //             if (
    //                 rootRecord &&
    //                 !group.records.some(
    //                     r => r.id === rootRecord.id
    //                 )
    //             ) {
    //                 group.records.push(rootRecord);
    //             }
    //         }
    //     }

    //     // ----------------------------------
    //     // Aggregate
    //     // ----------------------------------

    //     const results: QueryGroupResult[] = [];

    //     for (const group of groups.values()) {

    //         // group.value =
    //         //     await this.evaluateAggregate(
    //         //         graph,
    //         //         group.records,
    //         //         request.aggregate
    //         //     );

    //         group.value = await this.aggregateResolver.evaluate(graph, group, records[0]?.id, request.aggregate);

    //         results.push(group);
    //     }

    //     // ----------------------------------
    //     // Having
    //     // ----------------------------------

    //     const filtered =
    //         await this.applyHaving(
    //             results,
    //             context,
    //             graph,
    //             request.having
    //         );

    //     // ----------------------------------
    //     // Sort
    //     // ----------------------------------

    //     return this.applyGroupSort(
    //         filtered,
    //         request.sort
    //     );
    // }

    // async executeGroup(
    //     context: SchemaContext,
    //     request: QueryRequest,
    //     plan: QueryPlan
    // ): Promise<QueryGroupResult[]> {

    //     let records = await this.reader.getAll(context);

    //     const graph = await this.runner.run(context, records, plan);

	// 	// 2. Apply filters
	// 	if (request.where?.length) {
	// 		records =
	// 			await this.applyFilters(
	// 				records,
	// 				request.where,
    //                 graph
	// 			);
	// 	}

	// 	// 3. Build groups
	// 	const groups =
	// 		new Map<any, DataRecord[]>();

    //     const mode =
    //         request.groupByMode ?? "fanout";

    //     for (const record of records) {

    //         const rawKey =
    //             this.graphNavigator.getValue(
    //                 graph,
    //                 record.id,
    //                 request.groupBy
    //             );

    //         const keys = this.normalizeValue(rawKey)
    //             .filter(k => k !== undefined && k !== null);

    //         let finalKeys: any[];

    //         switch (mode) {

    //             case "collapse":
    //                 finalKeys =
    //                     keys.length
    //                         ? [keys.join("|")]
    //                         : [];
    //                 break;

    //             case "first":
    //                 finalKeys =
    //                     keys.length
    //                         ? [keys[0]]
    //                         : [];
    //                 break;

    //             case "distinct":
    //                 finalKeys =
    //                     [...new Set(keys)];
    //                 break;

    //             case "fanout":
    //             default:
    //                 finalKeys = keys;
    //                 break;
    //         }

    //         for (const key of finalKeys) {

    //             new Notice(
    //                 [
    //                     `Group Key: ${String(key)}`,
    //                     `Record Id: ${record.id}`,
    //                     `Record Data: ${JSON.stringify(record.data, null, 2)}`
    //                 ].join("\n")
    //             );

    //             new Notice(
    //                 [
    //                     `Record: ${record.id}`,
    //                     `Raw Key: ${JSON.stringify(rawKey)}`,
    //                     `Keys: ${JSON.stringify(keys)}`,
    //                     `Final Keys: ${JSON.stringify(finalKeys)}`
    //                 ].join("\n")
    //             );

    //             if (!groups.has(key)) {
    //                 groups.set(key, []);
    //             }

    //             groups.get(key)!.push(record);
    //         }
    //     }

	// 	// 4. Aggregate each group
	// 	let results: QueryGroupResult[] = [];

	// 	for (const [key, groupRecords] of groups) {

	// 		const value =
	// 			await this.evaluateAggregate(
    //                 graph,
    //                 groupRecords,
    //                 request.aggregate
    //             )

	// 		results.push({
	// 			key,
	// 			records: groupRecords,
    //             matches: [],
	// 			value
	// 		});
	// 	}

	// 	results =
	// 		await this.applyHaving(
	// 			results,
	// 			context,
    //             graph,
	// 			request.having
	// 		);

	// 	results =
	// 		this.applyGroupSort(
	// 			results,
	// 			request.sort
	// 		);

	// 	return results;
    // }
}