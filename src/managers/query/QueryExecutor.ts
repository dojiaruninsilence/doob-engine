import { IDataReader } from "../../interfaces/IDataReader";
import { SchemaContext } from "../../types/ContextTypes";
import { QueryRequest, QueryGroupResult, QueryFilter } from "../../types/query/QueryTypes";
import { QueryPlan } from "../../types/query/QueryPlannerTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryExecutionPlanRunner } from "./QueryExecutionPlanRunner";
import { Notice } from "obsidian";
import { ResolvedRecordGraphNavigator } from "./graph/ResolvedRecordGraphNavigator";
import { ResolvedRecordGraph } from "../../types/query/ResolvedRecordGraph";
import { AggregateRequest } from "../../types/query/AggregateTypes";
import { AggregateResolver } from "./aggregate/AggregateResolver";
import { Schema } from "../../types/SchemaTypes";
import { QueryMatchBuilder } from "./match/QueryMatchBuilder";
import { QueryMatchNavigator } from "./match/QueryMatchNavigator";
import { TraversalPlanner } from "../traversal/TraversalPlanner";
import { TraversalExecutor } from "../traversal/TraversalExecutor";
import { LegacyTraversalAdapter } from "../traversal/LegacyTraversalAdapter";
import { Logger } from "../logging/Logger";
import { TraceLogger } from "../logging/TraceLogger";
import { TraversalRequestBuilder } from "../traversal/TraversalRequestBuilder";
import { TraversalPlanBuilder } from "../traversal/TraversalPlanBuilder";
import { TraversalContext, TraversalMatch, TraversalPlan, TraversalResult } from "../../types/traversal";
import { TraversalExecutionPlanBuilder } from "../traversal/TraversalExecutionPlanBuilder";
import { FilterResult } from "../../types/query";

export class QueryExecutor {

	constructor(
		private reader: IDataReader,
        private runner: QueryExecutionPlanRunner,
        private graphNavigator: ResolvedRecordGraphNavigator,
        private aggregateResolver: AggregateResolver,
        private matchBuilder: QueryMatchBuilder,
        private matchNavigator: QueryMatchNavigator,
        private traversalPlanner: TraversalPlanner,
        private traversalExecutor: TraversalExecutor,
        private traversalAdapter: LegacyTraversalAdapter,
        private traversalRequestBuilder: TraversalRequestBuilder,
        private traversalPlanBuilder: TraversalPlanBuilder,
        private traversalExecutionPlanBuilder: TraversalExecutionPlanBuilder,
        private trace: TraceLogger
	) {}

    private normalizeValue(value: any): any[] {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    }

    private compareValue(
        value: any,
        filter: QueryFilter
    ): boolean {

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
                    && filter.value.includes(value);

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

    private async matches(
        context: TraversalContext,
        plan: TraversalPlan,
        filter: QueryFilter,
        record: DataRecord
    ): Promise<FilterResult> {

        const result =
            this.traversalExecutor.execute(
                context,
                record.id,
                plan
            );


        const matches =
            result.matches.filter(
                m => this.compareValue(
                    m.value,
                    filter
                )
            );


        return {
            keep: matches.length > 0,
            matches
        };
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

    private dedupeMatches(
        matches: TraversalMatch[]
    ): TraversalMatch[] {

        const unique =
            new Map<string, TraversalMatch>();

        this.trace.debug("QueryExecutor.dedupeMatches", "matches: ", { matches });

        for (const match of matches) {

            const key =
                [
                    match.sourceId,
                    ...match.branchPath,
                    match.nodeId
                ]
                .join(":");

            this.trace.debug("QueryExecutor.dedupeMatches", "match: and key: ", { match, key });

            if (!unique.has(key)) {

                unique.set(
                    key,
                    match
                );
            }
        }

        this.trace.debug("QueryExecutor.dedupeMatches", "...unique.values: ", { ...unique.values() });

        return [
            ...unique.values()
        ];
    }

    private async evaluateAggregate(
        context: TraversalContext,
        aggregatePlan: TraversalPlan | undefined,
        records: DataRecord[],
        request: AggregateRequest,
        whereMatches: TraversalMatch[] = []
    ): Promise<any> {

        const aggregateMatches: TraversalMatch[] = [];


        // ----------------------------------
        // Build aggregate traversal matches
        // ----------------------------------

        if (aggregatePlan) {

            for (const record of records) {

                const result =
                    this.traversalExecutor.execute(
                        context,
                        record.id,
                        aggregatePlan
                    );


                aggregateMatches.push(
                    ...result.matches
                );
            }
        }


        const group: QueryGroupResult = {

            key: "__all__",


            records,


            groupMatches: [],


            aggregateMatches,


            whereMatches,


            value: 0
        };


        // ----------------------------------
        // Aggregates that do not need a field
        // ----------------------------------

        if (!request.field) {

            return this.aggregateResolver.evaluate(
                context,
                undefined,
                group,
                request
            );
        }


        // ----------------------------------
        // Field aggregates
        // ----------------------------------

        if (!aggregatePlan) {

            throw new Error(
                `Missing aggregate traversal plan for field: ${request.field}`
            );
        }


        return this.aggregateResolver.evaluate(
            context,
            aggregatePlan,
            group,
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

    private setCollectionProjectedValue(
        target:any,
        path:string,
        values:any[]
    ):void {

        const parts =
            path.split(".");


        if (parts.length === 1) {

            target[parts[0]] =
                values;

            return;
        }


        const collectionField =
            parts[0];


        target[collectionField] =
            values;
    }

    private async applyFilters(
        records: DataRecord[],
        filters: QueryFilter[],
        context: TraversalContext,
        plans: TraversalPlan[]
    ): Promise<{
        records: DataRecord[];
        matches: TraversalMatch[];
    }> {

        let result = records;

        let allMatches: TraversalMatch[] = [];


        for (let i = 0; i < filters.length; i++) {

            const filter = filters[i];
            const plan = plans[i];


            const evaluated =
                await Promise.all(
                    result.map(async record => {

                        const evaluation =
                            await this.matches(
                                context,
                                plan,
                                filter,
                                record
                            );


                        return {
                            record,
                            ...evaluation
                        };

                    })
                );



            result =
                evaluated
                    .filter(
                        x => x.keep
                    )
                    .map(
                        x => x.record
                    );



            allMatches.push(
                ...evaluated
                    .filter(
                        x => x.keep
                    )
                    .flatMap(
                        x => x.matches
                    )
            );
        }


        return {
            records: result,
            matches: allMatches
        };
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
        context: TraversalContext,
        schema: Schema,
        select: string[] | undefined,
        plans: TraversalPlan[]
    ): Promise<any[]> {

        if (!select || select.length === 0) {
            return records;
        }


        const result: any[] = [];


        for (const record of records) {

            const projected:any = {
                id: record.id
            };


            for (let i = 0; i < select.length; i++) {

                const path = select[i];
                const plan = plans[i];


                const traversalResult =
                    this.traversalExecutor.execute(
                        context,
                        record.id,
                        plan
                    );

                const matches =
                    traversalResult.matches;
                    

                const values =
                    matches.map(
                        m => m.value
                    );

                /*
                * A traversal that ends on multiple values
                * is a collection traversal.
                *
                * Do not rebuild the path tree.
                * Collapse the collection onto the final field.
                */

                const containsCollection =
                    matches.length > 1 ||
                    plan.steps.some(
                        s => s.kind === "collection"
                    );

                if (values.length === 0) {

                    if (containsCollection) {

                        this.setProjectedValue(
                            projected,
                            path,
                            []
                        );

                    } else {

                        this.setProjectedValue(
                            projected,
                            path,
                            undefined
                        );
                    }

                    continue;
                }

                const value =
                    values.length <= 1
                        ? values[0]
                        : values;

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

    async executeQuery(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<any[]> {

        let records =
            await this.reader.getAll(context);


        const travReqSet =
            await this.traversalRequestBuilder.build(
                context,
                request
            );


        const travPlanSet =
            this.traversalPlanBuilder.build(
                travReqSet
            );


        const graph =
            await this.runner.run(
                context,
                records,
                travPlanSet
            );


        const travContext: TraversalContext = {
            schema: context.schema,
            graph
        };


        this.trace.debug(
            "QueryExecutor",
            "Traversal Plans Built",
            {
                travReqSet,
                travPlanSet
            }
        );


        // ----------------------------------
        // 1. Apply filters
        // ----------------------------------

        let whereMatches: TraversalMatch[] = [];


        if (request.where?.length) {

            const filterResult =
                await this.applyFilters(
                    records,
                    request.where,
                    travContext,
                    travPlanSet.where
                );


            records =
                filterResult.records;


            whereMatches =
                filterResult.matches;
        }


        // ----------------------------------
        // 2. Sort
        // ----------------------------------

        if (request.sort) {

            records =
                this.applySort(
                    records,
                    request.sort
                );
        }


        // ----------------------------------
        // 3. Pagination
        // ----------------------------------

        records =
            this.applyPagination(
                records,
                request
            );


        // ----------------------------------
        // 4. Projection
        // ----------------------------------

        return await this.applyProjection(
            records,
            travContext,
            context.schema,
            request.select,
            travPlanSet.select
        );
    }

    async executeAggregate(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<number> {

        let records =
            await this.reader.getAll(context);


        const travReqSet =
            await this.traversalRequestBuilder.build(
                context,
                request
            );


        const travPlanSet =
            this.traversalPlanBuilder.build(
                travReqSet
            );


        const graph =
            await this.runner.run(
                context,
                records,
                travPlanSet
            );


        const travContext: TraversalContext = {
            schema: context.schema,
            graph
        };


        this.trace.debug(
            "QueryExecutor",
            "Aggregate Traversal Built",
            {
                travReqSet,
                travPlanSet
            }
        );


        let whereMatches: TraversalMatch[] = [];


        // ----------------------------------
        // Apply filters
        // ----------------------------------

        if (request.where?.length) {

            const filterResult =
                await this.applyFilters(
                    records,
                    request.where,
                    travContext,
                    travPlanSet.where
                );


            records =
                filterResult.records;


            whereMatches =
                filterResult.matches;
        }


        this.trace.debug(
            "QueryExecutor.executeAggregate",
            "Filter Result",
            {
                recordCount: records.length,
                whereMatches
            }
        );


        // ----------------------------------
        // Aggregate
        // ----------------------------------

        return await this.evaluateAggregate(
            travContext,
            travPlanSet.aggregate,
            records,
            request.aggregate,
            whereMatches
        );
    }

    async executeGroup(
        context: SchemaContext,
        request: QueryRequest,
        plan: QueryPlan
    ): Promise<QueryGroupResult[]> {


        const records =
            await this.reader.getAll(context);



        const travReqSet =
            await this.traversalRequestBuilder.build(
                context,
                request
            );



        const travPlanSet =
            this.traversalPlanBuilder.build(
                travReqSet
            );



        const executionPlan =
            this.traversalExecutionPlanBuilder.build(
                travPlanSet
            );



        const graph =
            await this.runner.run(
                context,
                records,
                travPlanSet
            );



        const travContext: TraversalContext = {
            schema: context.schema,
            graph
        };



        this.trace.debug(
            "QueryExecutor.executeGroup",
            "Traversal Built",
            {
                travReqSet,
                travPlanSet
            }
        );



        // ----------------------------------
        // Apply filters
        // ----------------------------------

        let validRecords =
            records;

        let whereMatches: TraversalMatch[] = [];


        if (request.where?.length) {

            const filterResult =
                await this.applyFilters(
                    records,
                    request.where,
                    travContext,
                    travPlanSet.where
                );


            validRecords =
                filterResult.records;


            whereMatches =
                filterResult.matches;
        }



        const groups =
            new Map<any, QueryGroupResult>();



        // ----------------------------------
        // Process records
        // ----------------------------------

        for (const record of validRecords) {


            /*
            * Find anchor points.
            *
            * Example:
            *
            * Guild
            *   |
            * members
            *
            * returns:
            *
            * Bob
            * Alice
            */

            const anchorResult =
                executionPlan.commonPrefix
                    ? this.traversalExecutor.execute(
                        travContext,
                        record.id,
                        executionPlan.commonPrefix,
                        {
                            returnNodes: true
                        }
                    )
                    : {
                        matches: [
                            {
                                value: undefined,
                                nodeId: record.id,
                                sourceId: record.id,
                                branchPath: []
                            }
                        ]
                    };



            for (const anchor of anchorResult.matches) {


                const anchorNode =
                    anchor.nodeId;



                if (!anchorNode) {
                    continue;
                }



                /*
                * Group branch
                *
                * Example:
                *
                * Bob -> name
                *
                * returns:
                *
                * "Bob"
                */

                const groupResult =
                    executionPlan.groupBranch
                        ? this.traversalExecutor.execute(
                            travContext,
                            anchorNode,
                            executionPlan.groupBranch.suffixPlan
                        )
                        : undefined;



                const groupMatches =
                    groupResult?.matches ?? [];



                this.trace.debug(
                    "QueryExecutor.executeGroup",
                    "Group Branch Result",
                    {
                        anchor: anchorNode,
                        matches: groupMatches
                    }
                );



                for (const groupMatch of groupMatches) {


                    const key =
                        groupMatch.value;



                    let group =
                        groups.get(key);



                    if (!group) {


                        group = {

                            key,

                            records: [],

                            groupMatches: [],

                            whereMatches: [],

                            aggregateMatches: [],

                            value: 0
                        };



                        groups.set(
                            key,
                            group
                        );
                    }



                    /*
                    * Attach group matches
                    */

                    group.groupMatches!.push(
                        groupMatch
                    );



                    /*
                    * Attach where matches
                    */

                    group.whereMatches!.push(
                        ...whereMatches
                    );



                    /*
                    * Track records
                    */

                    if (
                        !group.records.some(
                            r =>
                                r.id === record.id
                        )
                    ) {

                        group.records.push(
                            record
                        );
                    }



                    /*
                    * Aggregate branch
                    *
                    * IMPORTANT:
                    *
                    * No global node dedupe.
                    *
                    * Bob -> Sword
                    * Alice -> Sword
                    *
                    * are two valid aggregate matches.
                    */

                    if (
                        executionPlan.aggregateBranch
                    ) {


                        const aggregateResult =
                            this.traversalExecutor.execute(
                                travContext,
                                anchorNode,
                                executionPlan.aggregateBranch.suffixPlan
                            );



                        const aggregateMatches =
                            aggregateResult.matches.filter(
                                m =>
                                    m.value !== undefined &&
                                    m.value !== null
                            );



                        group.aggregateMatches!.push(
                            ...aggregateMatches
                        );
                    }
                }
            }
        }



        // ----------------------------------
        // Evaluate groups
        // ----------------------------------

        const results: QueryGroupResult[] = [];


        for (const group of groups.values()) {


            group.value =
                await this.aggregateResolver.evaluate(
                    travContext,
                    undefined,
                    group,
                    request.aggregate
                );



            results.push(
                group
            );
        }



        return this.applyGroupSort(
            await this.applyHaving(
                results,
                context,
                graph,
                request.having
            ),
            request.sort
        );
    }
}