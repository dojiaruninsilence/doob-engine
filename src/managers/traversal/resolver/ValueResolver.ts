import { ResolvedRecordGraph, ResolvedNode } from "../../../types/query/ResolvedRecordGraph";
import { TraversalStep, ResolvedValue } from "../../../types/traversal";
import { TraceLogger } from "../../logging/TraceLogger";

export class ValueResolver {

	constructor(private trace: TraceLogger) {}

	resolve(
		node: ResolvedNode,
		step: TraversalStep,
		graph: ResolvedRecordGraph
	): ResolvedValue | undefined {

		switch (step.kind) {

			// -----------------------------------
			// OBJECT FIELD (DATA ACCESS)
			// -----------------------------------
			case "object": {
				const value =
					this.resolveObject(node, step.field);

				if (value === undefined) return undefined;

				return {
					type: "value",
					value
				};
			}

			// -----------------------------------
			// REFERENCE FIELD (GRAPH EDGE)
			// -----------------------------------
			case "reference": {
				const nodes =
					this.resolveReference(node, step.field);

				if (!nodes || nodes.length === 0) return undefined;

				return {
					type: "nodes",
					nodes
				};
			}

			// -----------------------------------
			// COLLECTION FIELD (GRAPH EDGE)
			// -----------------------------------
			case "collection": {
				const nodes =
					this.resolveReference(node, step.field);

				if (!nodes || nodes.length === 0) return undefined;

				// IMPORTANT:
				// collection is NOT automatically expanded here
				// executor decides "first/all/expand"

				return {
					type: "nodes",
					nodes
				};
			}

			default:
				return undefined;
		}
	}

	// ---------------------------------------
	// OBJECT / DATA LAYER
	// ---------------------------------------
	private resolveObject(
		node: ResolvedNode,
		field: string
	): any {

		const record = node.record;

		if (!record) {
			return undefined;
		}

		return record.data?.[field];
	}

	// ---------------------------------------
	// REFERENCE LAYER
	// ---------------------------------------
	private resolveReference(
		node: ResolvedNode,
		field: string
	): string[] | undefined {

		const refs = node.refs.get(field);

		if (!refs || refs.length === 0) {
			return undefined;
		}

		return refs;
	}
}