import { SchemaContext } from "../../types/ContextTypes";
import { DataRecord } from "../../types/DataTypes";
import { QueryPlan } from "../../types/QueryPlannerTypes";
import { ResolvedRecordGraph } from "../../types/ResolvedRecordGraph";
import { ResolvedRecordGraphBuilder } from "./execution/ResolvedRecordGraphBuilder";
import { Notice } from "obsidian";

export class QueryExecutionPlanRunner {

    constructor(
        private graphBuilder: ResolvedRecordGraphBuilder
    ) {}

    async run(
        context: SchemaContext,
        records: DataRecord[],
        plan: QueryPlan
    ): Promise<ResolvedRecordGraph> {

        return await this.graphBuilder.build(
            context,
            records,
            plan
        );
    }
}

// import { ContextFactory } from "../ContextFactory";
// import { SchemaContext } from "../../types/ContextTypes";
// import { DataRecord } from "../../types/DataTypes";
// import { QueryPlan } from "../../types/QueryPlannerTypes";
// import { ReferenceGraphBuilder } from "../reference/ReferenceGraphBuilder";
// import { GlobalIdAccumulator } from "./execution/GlobalIdAccumulator";
// import { HydrationMapBuilder } from "./execution/HydrationMapBuilder";
// import { HydrationMap } from "../../types/QueryExecutionTypes";
// import { Notice } from "obsidian";

// export class QueryExecutionPlanRunner {

//     constructor(
//         private contextFactory: ContextFactory,
//         private graphBuilder: ReferenceGraphBuilder,
//         private accumulator: GlobalIdAccumulator,
//         private hydrationMapBuilder: HydrationMapBuilder
//     ) {}

//     async run(
//         context: SchemaContext,
//         records: DataRecord[],
//         plan: QueryPlan
//     ): Promise<HydrationMap> {

//         const hydrationMap: HydrationMap =
//             new Map();

//         if (plan.steps.length === 0) {
//             return hydrationMap;
//         }

//         let currentRecords = records;

//         for (const step of plan.steps) {

//             const ids =
//                 new Set<string>();

//             for (const record of currentRecords) {

//                 const id =
//                     record.data?.[step.field];

//                 if (typeof id === "string") {
//                     ids.add(id);
//                 }
//             }

//             if (ids.size === 0) {
//                 currentRecords = [];
//                 continue;
//             }

//             const schemaMap =
//                 await this.hydrationMapBuilder.buildSchema(
//                     step.toRuleset,
//                     step.to,
//                     ids
//                 );

//             // --------------------------------------------------
//             // FIX: merge instead of overwrite
//             // --------------------------------------------------

//             const existing =
//                 hydrationMap.get(step.to);

//             if (!existing) {

//                 hydrationMap.set(
//                     step.to,
//                     schemaMap
//                 );
//             }
//             else {

//                 for (const [id, record] of schemaMap) {
//                     existing.set(id, record);
//                 }
//             }

//             currentRecords =
//                 [...schemaMap.values()];
//         }

//         return hydrationMap;
//     }

//     // async run(
//     //     context: SchemaContext,
//     //     records: DataRecord[],
//     //     plan: QueryPlan
//     // ): Promise<HydrationMap> {

//     //     const hydrationMap: HydrationMap =
//     //         new Map();

//     //     if (plan.steps.length === 0) {
//     //         return hydrationMap;
//     //     }

//     //     let currentRecords = records;

//     //     for (const step of plan.steps) {

//     //         const ids =
//     //             new Set<string>();

//     //         for (const record of currentRecords) {

//     //             const id =
//     //                 record.data?.[step.field];

//     //             if (typeof id === "string") {
//     //                 ids.add(id);
//     //             }
//     //         }

//     //         if (ids.size === 0) {

//     //             hydrationMap.set(
//     //                 step.to,
//     //                 new Map()
//     //             );

//     //             currentRecords = [];
//     //             continue;
//     //         }

//     //         new Notice(
//     //             `Hydrating ${step.to} : ${ids.size}`
//     //         );

//     //         const schemaMap =
//     //             await this.hydrationMapBuilder.buildSchema(
//     //                 step.toRuleset,
//     //                 step.to,
//     //                 ids
//     //             );

//     //         hydrationMap.set(
//     //             step.to,
//     //             schemaMap
//     //         );

//     //         currentRecords =
//     //             [...schemaMap.values()];
//     //     }

//     //     return hydrationMap;
//     // }

//     // async run(
//     //     context: SchemaContext,
//     //     records: DataRecord[],
//     //     plan: QueryPlan
//     // ): Promise<HydrationMap> {

//     //     if (plan.steps.length === 0) {
//     //         return new Map();
//     //     }

//     //     // --------------------------------------------------
//     //     // STEP 1: BUILD GRAPH
//     //     // --------------------------------------------------

//     //     const graph =
//     //         this.graphBuilder.build(plan);

//     //     // --------------------------------------------------
//     //     // STEP 2: ACCUMULATE IDS (SOURCE OF TRUTH)
//     //     // --------------------------------------------------

//     //     const idsBySchema =
//     //         await this.accumulator.collect(
//     //             context,
//     //             records,
//     //             graph
//     //         );

//     //     // --------------------------------------------------
//     //     // STEP 3: BUILD HYDRATION MAP
//     //     // --------------------------------------------------

//     //     const hydrationMap =
//     //         await this.hydrationMapBuilder.build(
//     //             context.ruleset,
//     //             idsBySchema
//     //         );

//     //     return hydrationMap;
//     // }

//     // async run(
//     //     context: SchemaContext,
//     //     records: DataRecord[],
//     //     plan: QueryPlan
//     // ): Promise<HydrationMap> {

//     //     if (plan.steps.length === 0) {
//     //         return new Map();
//     //     }

//     //     const hydrationMap: HydrationMap =
//     //         new Map();

//     //     // --------------------------------------------------
//     //     // PHASE 1: BUILD HYDRATION MAP ONLY
//     //     // --------------------------------------------------

//     //     let currentRecords = records;

//     //     for (const step of plan.steps) {

//     //         const ids = new Set<string>();

//     //         for (const record of currentRecords) {

//     //             const id = record.data?.[step.field];

//     //             if (typeof id === "string") {
//     //                 ids.add(id);
//     //             }
//     //         }

//     //         const schemaMap =
//     //             await this.hydrationMapBuilder.buildSchema(
//     //                 step.toRuleset,
//     //                 step.to,
//     //                 ids
//     //             );

//     //         hydrationMap.set(step.to, schemaMap);
//     //     }

//     //     // --------------------------------------------------
//     //     // NO PHASE 2
//     //     // --------------------------------------------------

//     //     return hydrationMap;
//     // }

//     // async run(
//     //     context: SchemaContext,
//     //     records: DataRecord[],
//     //     plan: QueryPlan
//     // ): Promise<HydrationMap> {

//     //     if (plan.steps.length === 0) {
//     //         return new Map();
//     //     }

//     //     const hydrationMap: HydrationMap =
//     //         new Map();

//     //     // --------------------------------------------------
//     //     // PHASE 1: BUILD HYDRATION MAP (NO EXECUTION)
//     //     // --------------------------------------------------

//     //     let currentRecords = records;

//     //     for (const step of plan.steps) {

//     //         const ids = new Set<string>();

//     //         for (const record of currentRecords) {

//     //             const id = record.data?.[step.field];

//     //             if (typeof id === "string") {
//     //                 ids.add(id);
//     //             }
//     //         }

//     //         if (ids.size === 0) {
//     //             hydrationMap.set(step.to, new Map());
//     //             continue;
//     //         }

//     //         const schemaMap =
//     //             await this.hydrationMapBuilder.buildSchema(
//     //                 step.toRuleset,
//     //                 step.to,
//     //                 ids
//     //             );

//     //         hydrationMap.set(step.to, schemaMap);
//     //     }

//     //     // --------------------------------------------------
//     //     // PHASE 2: EXECUTION (USING HYDRATION ONLY)
//     //     // --------------------------------------------------

//     //     let stream = records;

//     //     for (const step of plan.steps) {

//     //         const schemaMap =
//     //             hydrationMap.get(step.to);

//     //         const nextStream: DataRecord[] = [];

//     //         for (const record of stream) {

//     //             const id = record.data?.[step.field];

//     //             if (typeof id !== "string") {
//     //                 continue;
//     //             }

//     //             const resolved =
//     //                 schemaMap?.get(id);

//     //             if (!resolved) {
//     //                 continue;
//     //             }

//     //             nextStream.push(resolved);
//     //         }

//     //         stream = nextStream;
//     //     }

//     //     return hydrationMap;
//     // }

//     // async run(
//     //     context: SchemaContext,
//     //     records: DataRecord[],
//     //     plan: QueryPlan
//     // ): Promise<HydrationMap> {

//     //     if (plan.steps.length === 0) {
//     //         return new Map();
//     //     }

//     //     /*const graph = this.graphBuilder.build(plan);

//     //     const idsBySchema =
//     //         await this.accumulator.collect(
//     //             context,
//     //             records,
//     //             graph
//     //         );

//     //     const hydrationMap =
//     //         await this.hydrationMapBuilder.build(
//     //             context.ruleset,
//     //             idsBySchema
//     //         );*/

//     //     const hydrationMap: HydrationMap =
//     //         new Map();

//     //     let currentRecords = records;
//     //     let currentContext = context;

//     //     for (const step of plan.steps) {

//     //         /*const resolvedMap =
//     //             hydrationMap.get(step.to);

//     //         const nextRecords: DataRecord[] = [];*/

//     //         const ids =
//     //             new Set<string>();

//     //         for (const record of currentRecords) {

//     //             const id =
//     //                 record.data?.[step.field];

//     //             if (typeof id === "string") {
//     //                 ids.add(id);
//     //                 //continue;
//     //             }

//     //             // const resolved =
//     //             //     resolvedMap.get(id);

//     //             /*const resolved =
//     //                 resolvedMap?.get(id);

//     //             if (!resolved) {
//     //                 continue;
//     //             }

//     //             nextRecords.push(resolved);*/
//     //         }

//     //         const schemaMap =
//     //             await this.hydrationMapBuilder.buildSchema(
//     //                 step.toRuleset,
//     //                 step.to,
//     //                 ids
//     //             );

//     //         hydrationMap.set(
//     //             step.to,
//     //             schemaMap
//     //         );

//     //         currentRecords =
//     //             [...schemaMap.values()];

//     //         currentContext =
//     //             await this.contextFactory.getSchemaContext(
//     //                 step.toRuleset,
//     //                 step.to
//     //             );

//     //         //currentRecords = nextRecords;
//     //     }

//     //     return hydrationMap;
//     // }
// }