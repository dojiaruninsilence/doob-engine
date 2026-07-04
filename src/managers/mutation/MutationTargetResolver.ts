import { ResolvedRecordGraph } from "../../types/query/ResolvedRecordGraph";
import { MutationTarget } from "../../types/mutation/MutationTargetTypes";

export class MutationTargetResolver {

    resolve(
        graph: ResolvedRecordGraph,
        select: string
    ): MutationTarget[] {

        const targets: MutationTarget[] = [];

        const parts = select.split(".");

        if (parts.length === 0) {
            return targets;
        }

        const field =
            parts[parts.length - 1];

        const traversal =
            parts.slice(0, parts.length - 1);

        for (const rootId of graph.roots) {

            let currentNodes = [
                graph.nodes.get(rootId)
            ].filter(Boolean);

            if (currentNodes.length === 0) {
                continue;
            }

            let valid = true;

            for (const part of traversal) {

                const nextNodes: typeof currentNodes = [];

                for (const node of currentNodes) {

                    if (!node) {
                        continue;
                    }

                    const refs =
                        node.refs.get(part) ?? [];

                    for (const refId of refs) {

                        const target =
                            graph.nodes.get(refId);

                        if (target) {
                            nextNodes.push(target);
                        }
                    }
                }

                if (nextNodes.length === 0) {
                    valid = false;
                    break;
                }

                currentNodes = nextNodes;
            }

            if (!valid) {

                targets.push({
                    rootId,
                    nodeId: rootId,
                    fieldPath: field,
                    valid: false
                });

                continue;
            }

            for (const node of currentNodes) {

                if (!node) {
                    continue;
                }

                targets.push({
                    rootId,
                    nodeId: node.id,
                    fieldPath: field,
                    valid: true
                });
            }
        }

        return targets;
    }
}