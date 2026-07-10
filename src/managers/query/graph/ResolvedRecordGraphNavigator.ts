import { ResolvedRecordGraph } from "../../../types/query/ResolvedRecordGraph";

export class ResolvedRecordGraphNavigator {

	getValue(
		graph: ResolvedRecordGraph,
		rootId: string,
		path: string
	): any {

		const parts = path.split(".");

		let current = graph.nodes.get(rootId);
		if (!current) return undefined;

		let currentNodes = [current];

		for (let i = 0; i < parts.length; i++) {

			const part = parts[i];
			const isLast = i === parts.length - 1;

			// --------------------------------------------------
			// FINAL STEP → extract values
			// --------------------------------------------------
			if (isLast) {

				const out: any[] = [];

				for (const node of currentNodes) {

					const value = node.record.data?.[part];

					if (value === undefined || value === null) {
						continue;
					}

					if (Array.isArray(value)) {
						out.push(...value);
					} else {
						out.push(value);
					}
				}

				if (out.length === 0) return undefined;

				return out.length === 1 ? out[0] : out;
			}

			// --------------------------------------------------
			// INTERMEDIATE STEP → follow refs
			// --------------------------------------------------
			const nextNodes: typeof currentNodes = [];

			for (const node of currentNodes) {

				const refs = node.refs.get(part);

				if (!refs || refs.length === 0) {
					continue;
				}

				for (const refId of refs) {

					const next = graph.nodes.get(refId);
					if (next) {
						nextNodes.push(next);
					}
				}
			}

			if (nextNodes.length === 0) {
				return undefined;
			}

			currentNodes = nextNodes;
		}

		return undefined;
	}
}