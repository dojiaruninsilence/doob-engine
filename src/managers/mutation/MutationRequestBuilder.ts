import { SchemaContext } from "../../types/ContextTypes";

import { MutationRequestSet, MutationRequest } from "../../types/mutation";

import { TraversalRequest } from "../../types/traversal";
import { TraceLogger } from "../logging/TraceLogger";

import { LegacyTraversalAdapter } from "../traversal/LegacyTraversalAdapter";

export class MutationRequestBuilder {

    constructor(
        private traversalAdapter: LegacyTraversalAdapter,
        private trace: TraceLogger
    ) {}

    async build(
        context: SchemaContext,
        request: MutationRequest
    ): Promise<MutationRequestSet> {

        const target =
            await this.traversalAdapter.buildRequest(
                context,
                request.select
            );

        const where: TraversalRequest[] = [];

        if (request.where?.length) {

            for (const filter of request.where) {

                where.push(
                    await this.traversalAdapter.buildRequest(
                        context,
                        filter.field
                    )
                );
            }
        }

        return {
            target,
            where
        };
    }
}