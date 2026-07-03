import { SchemaContext } from "../../../types/ContextTypes";
import { DataRecord } from "../../../types/DataTypes";
import { QueryPlan } from "../../../types/QueryPlannerTypes";
import { ContextFactory } from "../../ContextFactory";
import { IDataReader } from "../../../interfaces/IDataReader";
import { ResolvedRecordGraph, ResolvedNode } from "../../../types/ResolvedRecordGraph";
import { Notice } from "obsidian";

export class ResolvedRecordGraphBuilder {

    constructor(
        private reader: IDataReader,
        private contextFactory: ContextFactory
    ) {}

    private normalizeRefs(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(v => typeof v === "string");
        if (typeof value === "string") return [value];
        return [];
    }

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
        // STEP 2: BFS-style expansion per step
        // --------------------------------------------------

        let frontier = new Set<string>(rootRecords.map(r => r.id));

        for (const step of plan.steps) {

            const nextFrontier = new Set<string>();
            const idsToFetch = new Set<string>();

            // --------------------------------------------------
            // collect references ONLY from current frontier
            // --------------------------------------------------

            for (const nodeId of frontier) {

                const node = nodes.get(nodeId);
                if (!node) continue;

                const refs = this.normalizeRefs(node.data?.[step.field]);

                for (const refId of refs) {
                    idsToFetch.add(refId);
                }
            }

            if (idsToFetch.size === 0) {
                frontier = new Set();
                continue;
            }

            const nextSchema =
                await this.contextFactory.getSchemaContext(
                    step.toRuleset,
                    step.to
                );

            const referencedRecords =
                await this.reader.getManyByIds(nextSchema, idsToFetch);

            const byId = new Map<string, DataRecord>();

            for (const r of referencedRecords) {
                byId.set(r.id, r);
            }

            // --------------------------------------------------
            // attach edges + build next frontier
            // --------------------------------------------------

            for (const nodeId of frontier) {

                const node = nodes.get(nodeId);
                
                if (!node) continue;

                const refs = this.normalizeRefs(node.data?.[step.field]);
                const resolvedTargets = new Set<string>();

                for (const refId of refs) {

                    const target = byId.get(refId);
                    if (!target) continue;

                    if (!nodes.has(target.id)) {
                        nodes.set(target.id, {
                            id: target.id,
                            schema: step.to,
                            data: target.data,
                            refs: new Map()
                        });
                    }

                    resolvedTargets.add(target.id);
                    nextFrontier.add(target.id);
                }

                if (resolvedTargets.size > 0) {
                    node.refs.set(step.field, [...resolvedTargets]);
                }

            }
            frontier = nextFrontier;
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
