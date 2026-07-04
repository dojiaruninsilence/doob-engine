import { SchemaContext } from "../../types/ContextTypes";
import { MutationResult } from "../../types/mutation/MutationResultTypes";
import { MutationRequest } from "../../types/mutation/MutationTypes";

import { IDataReader } from "../../interfaces/IDataReader";
import { IDataWriter } from "../../interfaces/IDataWriter";

import { QueryPlanner } from "../query/QueryPlanner";
import { ResolvedRecordGraphBuilder } from "../query/graph/ResolvedRecordGraphBuilder";

import { MutationOperationResolver } from "./operations/MutationOperationResolver";
import { MutationTargetResolver } from "./MutationTargetResolver";

import { DataMutationWriter } from "./writer/DataMutationWriter";
import { MutationWriteTarget } from "../../types/mutation/MutationWriteTargetTypes";

import { ContextFactory } from "../ContextFactory";

import { MutationTraceLogger } from "./debug/MutationTraceLogger";

export class MutationExecutor {

    constructor(
        private reader: IDataReader,
        private writer: IDataWriter,
        private graphBuilder: ResolvedRecordGraphBuilder,
        private queryPlanner: QueryPlanner,
        private targetResolver: MutationTargetResolver,
        private operationResolver: MutationOperationResolver,
        private trace: MutationTraceLogger,
        private contextFactory: ContextFactory
    ) {}

    async execute(
        context: SchemaContext,
        request: MutationRequest
    ): Promise<MutationResult> {

        let updated = 0;
        let skipped = 0;

        const errors: any[] = [];

        try {

            const records =
                await this.reader.getAll(context);

            const plan =
                await this.queryPlanner.plan(
                    context,
                    {
                        select: [request.select],
                        where: request.where
                    }
                );

            const graph =
                await this.graphBuilder.build(
                    context,
                    records,
                    plan
                );

            const targets =
                this.targetResolver.resolve(
                    graph,
                    request.select
                );

            const seen = new Set<string>();

            const writes =
                new Map<string, MutationWriteTarget>();

            for (const target of targets) {
                this.trace.debug("MutationExecutor", "Processing target", { target });

                try {

                    if (!target.valid) {

                        errors.push({
                            rootId: target.rootId,
                            path: request.select,
                            message: "Invalid mutation path"
                        });

                        continue;
                    }

                    const key =
                        `${target.nodeId}:${target.fieldPath}`;

                    if (seen.has(key)) {
                        skipped++;
                        continue;
                    }

                    seen.add(key);

                    const node =
                        graph.nodes.get(
                            target.nodeId
                        );

                    if (!node) {
                        skipped++;
                        continue;
                    }

                    const currentValue =
                        this.readField(
                            node.record.data,
                            target.fieldPath
                        );

                    this.trace.debug("MutationExecutor", "Reading field value", {
                        nodeId: node.id,
                        fieldPath: target.fieldPath,
                        value: currentValue
                    });

                    const result =
                        this.operationResolver.apply(
                            currentValue,
                            request.operation,
                            {
                                record: node.record,
                                fieldPath: target.fieldPath,
                                currentValue
                            }
                        );
                    
                    this.trace.debug("MutationExecutor", "Computed new value", {
                        nodeId: node.id,
                        fieldPath: target.fieldPath,
                        before: currentValue,
                        after: result,
                        operation: request.operation
                    });

                    if (result === undefined) {
                        skipped++;
                        continue;
                    }

                    this.writeField(
                        node.record.data,
                        target.fieldPath,
                        result
                    );

                    writes.set(
                        node.record.id,
                        {
                            schemaName: node.schema,
                            record: node.record
                        }
                    );

                    this.trace.debug("MutationExecutor", "Value written", {
                        nodeId: node.id,
                        fieldPath: target.fieldPath,
                        value: result
                    });

                    updated++;

                } catch (e: any) {

                    errors.push({
                        rootId: target.rootId,
                        path: target.fieldPath,
                        message:
                            e?.message ??
                            String(e)
                    });

                    this.trace.error("MutationExecutor", "Error occurred while processing target", {
                        rootId: target.rootId,
                        fieldPath: target.fieldPath,
                        message: e.message
                    });
                }
            }

            const mutationWriter =
                new DataMutationWriter(
                    this.writer,
                    (schemaName) =>
                        this.contextFactory.getSchemaContext(
                            context.ruleset,
                            schemaName
                        )
                );

            await mutationWriter.save(
                [...writes.values()]
            );

        } catch (e: any) {

            errors.push({
                rootId: "global",
                path: request.select,
                message:
                    e?.message ??
                    String(e)
            });
        }

        return {
            updated,
            skipped,
            errors
        };
    }

    private readField(
        data: any,
        path: string
    ): any {

        const parts = path.split(".");
        let current = data;

        for (const part of parts) {

            if (current == null) {
                return undefined;
            }

            current = current[part];
        }

        return current;
    }

    private writeField(
        data: any,
        path: string,
        value: any
    ): void {

        const parts = path.split(".");
        let current = data;

        for (
            let i = 0;
            i < parts.length - 1;
            i++
        ) {

            const part = parts[i];

            if (
                current[part] === undefined
            ) {
                current[part] = {};
            }

            current = current[part];
        }

        const last =
            parts[parts.length - 1];

        if (!last) {
            return;
        }

        current[last] = value;
    }
}