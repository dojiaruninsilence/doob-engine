import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";

export class ResolvedRecordGraphNavigator {

    getValue(
        graph: ResolvedRecordGraph,
        rootId: string,
        path: string
    ): any {

        const parts = path.split(".");

        let node =
            graph.nodes.get(rootId);

        if (!node) {
            return undefined;
        }

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];

            const isLast =
                i === parts.length - 1;

            if (isLast) {
                return node.data?.[part];
            }

            const ref =
                node.refs.get(part);

            if (typeof ref !== "string") {
                return undefined;
            }

            node =
                graph.nodes.get(ref);

            if (!node) {
                return undefined;
            }
        }

        return undefined;
    }
}