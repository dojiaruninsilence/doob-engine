import { QueryMatch } from "../../../types/query/QueryMatchTypes";
import { ResolvedRecordGraph } from "../../../types/query/ResolvedRecordGraph";

export class QueryMatchNavigator {

	// --------------------------------------------------
	// FIELD TARGET RESOLUTION
	// --------------------------------------------------

	private resolveFieldTarget(
		match: QueryMatch,
		fieldPath: string
	): {
		nodeIndex: number;
		remainingPath: string[];
	} {

		const fieldParts = fieldPath.split(".");
		let bestDepth = 0;

		for (const bindingKey of Object.keys(match.bindings)) {

			const bindingParts = bindingKey.split(".");

			// strip root (e.g. guild.members -> members)
			const traversalParts = bindingParts.slice(1);

			let matches = true;

			for (let i = 0; i < traversalParts.length; i++) {

				if (fieldParts[i] !== traversalParts[i]) {
					matches = false;
					break;
				}
			}

			if (matches) {
				bestDepth = Math.max(bestDepth, traversalParts.length);
			}
		}

		return {
			nodeIndex: bestDepth,
			remainingPath: fieldParts.slice(bestDepth)
		};
	}

	// --------------------------------------------------
	// GROUP VALUE (STRUCTURAL WALK)
	// --------------------------------------------------

	getGroupValue(
		graph: ResolvedRecordGraph,
		match: QueryMatch,
		path: string
	): any {

		const parts = path.split(".");

		let node =
			graph.nodes.get(match.rootId);

		if (!node) return undefined;

		let pathIndex = 0;

		for (let i = 0; i < parts.length; i++) {

			const part = parts[i];
			const isLast = i === parts.length - 1;

			// --------------------------------------------------
			// FINAL FIELD
			// --------------------------------------------------
			if (isLast) {
				return node.record.data?.[part];
			}

			// --------------------------------------------------
			// TRAVERSE REFERENCES
			// --------------------------------------------------
			const refs = node.refs.get(part);

			if (!refs || refs.length === 0) {
				return undefined;
			}

			const nextId = match.pathNodes[pathIndex + 1];

			if (!nextId) return undefined;

			const next = graph.nodes.get(nextId);

			if (!next) return undefined;

			node = next;
			pathIndex++;
		}

		return undefined;
	}

	// --------------------------------------------------
	// AGGREGATION VALUE RESOLUTION
	// --------------------------------------------------

	resolveValues(
		graph: ResolvedRecordGraph,
		match: QueryMatch,
		path: string
	): { value: any; sourceId: string }[] {

		const { nodeIndex, remainingPath } =
			this.resolveFieldTarget(match, path);

		let current =
			graph.nodes.get(match.pathNodes[nodeIndex]);

		if (!current) return [];

		let currentNodes = [current];

		// --------------------------------------------------
		// traverse structural part
		// --------------------------------------------------
		for (let i = 0; i < remainingPath.length - 1; i++) {

			const part = remainingPath[i];
			const nextNodes: typeof currentNodes = [];

			for (const node of currentNodes) {

				const refs = node.refs.get(part);

				if (!refs) continue;

				for (const refId of refs) {

					const next = graph.nodes.get(refId);

					if (next) {
						nextNodes.push(next);
					}
				}
			}

			if (nextNodes.length === 0) {
				return [];
			}

			currentNodes = nextNodes;
		}

		const last = remainingPath[remainingPath.length - 1];

		if (!last) return [];

		const results: { value: any; sourceId: string }[] = [];

		for (const node of currentNodes) {

			const value = node.record.data?.[last];

			if (Array.isArray(value)) {

				for (const v of value) {
					results.push({
						value: v,
						sourceId: node.id
					});
				}

			} else if (value !== undefined && value !== null) {

				results.push({
					value,
					sourceId: node.id
				});
			}
		}

		return results;
	}
}