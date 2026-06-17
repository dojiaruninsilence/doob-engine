import { SchemaContext } from "../../../types/ContextTypes";
import { DataRecord } from "../../../types/DataTypes";
import { QueryPlan, QueryPlanStep } from "../../../types/QueryPlannerTypes";
import { ContextFactory } from "../../ContextFactory";
import { IDataReader } from "../../../interfaces/IDataReader";
import { IReferenceResolver } from "../../../interfaces/IReferenceResolver";
import { ResolvedRecordGraph, ResolvedNode } from "../../../types/ResolvedRecordGraph";
import { Notice } from "obsidian";

export class ResolvedRecordGraphBuilder {

    constructor(
        private reader: IDataReader,
        private contextFactory: ContextFactory,
        private referenceResolver: IReferenceResolver
    ) {}

    async build(
        rootContext: SchemaContext,
        rootRecords: DataRecord[],
        plan: QueryPlan
    ): Promise<ResolvedRecordGraph> {

        const nodes = new Map<string, ResolvedNode>();

        const rootIds: string[] = [];

        // --------------------------------------------------
        // STEP 1: seed root nodes
        // --------------------------------------------------

        for (const record of rootRecords) {

            rootIds.push(record.id);

            nodes.set(record.id, {
                id: record.id,
                schema: rootContext.schema.name,
                data: record.data,
                refs: new Map()
            });
        }

        // --------------------------------------------------
        // STEP 2: expand graph per plan step
        // --------------------------------------------------

        let currentSchema = rootContext;
        let frontier = rootRecords;

        for (const step of plan.steps) {

            const nextSchema =
                await this.contextFactory.getSchemaContext(
                    step.toRuleset,
                    step.to
                );

            const idsToFetch = new Set<string>();

            // 🔥 IMPORTANT: ONLY use nodes of correct schema
            for (const node of nodes.values()) {

                if (node.schema !== step.from) {
                    continue;
                }

                const value = node.data?.[step.field];

                if (typeof value === "string") {
                    idsToFetch.add(value);
                }
            }

            if (idsToFetch.size === 0) {
                continue;
            }

            const referencedRecords =
                await this.reader.getManyByIds(nextSchema, idsToFetch);

            const byId = new Map<string, DataRecord>();

            for (const r of referencedRecords) {
                byId.set(r.id, r);
            }

            for (const node of nodes.values()) {

                if (node.schema !== step.from) {
                    continue;
                }

                const id = node.data?.[step.field];

                if (typeof id !== "string") {
                    continue;
                }

                const target = byId.get(id);

                if (!target) {
                    continue;
                }

                if (!nodes.has(target.id)) {
                    nodes.set(target.id, {
                        id: target.id,
                        schema: step.to,
                        data: target.data,
                        refs: new Map()
                    });
                }

                const targetNode = nodes.get(target.id)!;

                node.refs.set(step.field, target.id);
            }
        }

        // --------------------------------------------------
        // STEP 3: return graph
        // --------------------------------------------------

        return {
            rootSchema: rootContext.schema.name,
            nodes,
            roots: rootIds
        };
    }
}