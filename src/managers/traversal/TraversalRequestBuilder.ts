import { SchemaContext } from "../../types/ContextTypes";
import { TraversalRequestSet } from "../../types/traversal";
import { QueryRequest } from "../../types/query/QueryTypes";
import { LegacyTraversalAdapter } from "./LegacyTraversalAdapter";
import { TraceLogger } from "../logging/TraceLogger";

export class TraversalRequestBuilder {

	constructor(
		private adapter: LegacyTraversalAdapter,
		private trace: TraceLogger
	) {}

	async build(
		context: SchemaContext,
		request: QueryRequest
	): Promise<TraversalRequestSet> {

		const result: TraversalRequestSet = {

			select: [],
			where: []
		};

		// -------------------------
		// GROUP BY
		// -------------------------

		if (request.groupBy) {

			result.groupBy =
				await this.adapter.buildRequest(
					context,
					request.groupBy
				);
		}

		// -------------------------
		// AGGREGATE
		// -------------------------

		if (request.aggregate?.field) {

			result.aggregate =
				await this.adapter.buildRequest(
					context,
					request.aggregate.field
				);
		}

		// -------------------------
		// SELECT
		// -------------------------

		if (request.select) {

			for (const field of request.select) {

				result.select.push(
					await this.adapter.buildRequest(
						context,
						field
					)
				);
			}
		}

		// -------------------------
		// WHERE
		// -------------------------

		if (request.where) {

			for (const filter of request.where) {

				result.where.push(
					await this.adapter.buildRequest(
						context,
						filter.field
					)
				);
			}
		}

		return result;
	}
}