import { Notice } from "obsidian";
import { QueryMatch, ValueMode } from "../../../types/QueryMatchTypes";
import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";

export class QueryMatchNavigator {

    private resolveFieldTarget(
        match: QueryMatch,
        fieldPath: string
    ): {
        nodeIndex: number;
        remainingPath: string[];
    } {

        const fieldParts =
            fieldPath.split(".");

        let bestDepth = 0;

        for (const bindingKey of Object.keys(match.bindings)) {

            const bindingParts =
                bindingKey.split(".");

            // Remove schema/root prefix
            // guild.members -> members
            const traversalParts =
                bindingParts.slice(1);

            let matches = true;

            for (
                let i = 0;
                i < traversalParts.length;
                i++
            ) {

                if (
                    i >= fieldParts.length ||
                    fieldParts[i] !== traversalParts[i]
                ) {
                    matches = false;
                    break;
                }
            }

            if (
                matches &&
                traversalParts.length > bestDepth
            ) {
                bestDepth =
                    traversalParts.length;
            }
        }

        return {
            nodeIndex: bestDepth,
            remainingPath:
                fieldParts.slice(bestDepth)
        };
    }

    // --------------------------------------------------
    // GROUPING
    // Structural traversal using the match path
    // --------------------------------------------------

    getGroupValue(
        graph: ResolvedRecordGraph,
        match: QueryMatch,
        path: string
    ): any {

        const parts = path.split(".");

        let node =
            graph.nodes.get(match.rootId);

        if (!node) {
            return undefined;
        }

        let pathIndex = 0;

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];
            const isLast =
                i === parts.length - 1;

            if (isLast) {
                return node.data?.[part];
            }

            const refs =
                node.refs.get(part);

            if (!refs?.length) {
                return undefined;
            }

            const nextId =
                match.pathNodes[pathIndex + 1];

            node =
                graph.nodes.get(nextId);

            if (!node) {
                return undefined;
            }

            pathIndex++;
        }

        return undefined;
    }

    // --------------------------------------------------
    // AGGREGATION
    // Read value from the match endpoint
    // --------------------------------------------------

    resolveValues(
        graph: ResolvedRecordGraph,
        match: QueryMatch,
        path: string
    ): { value: any; sourceId: string }[] {

        const {
            nodeIndex,
            remainingPath
        } = this.resolveFieldTarget(
            match,
            path
        );

        let currentNodes = [
            graph.nodes.get(match.pathNodes[nodeIndex])
        ].filter(Boolean);

        if (currentNodes.length === 0) {
            return [];
        }

        // traverse structural part
        for (let i = 0; i < remainingPath.length - 1; i++) {

            const part = remainingPath[i];
            const nextNodes: typeof currentNodes = [];

            for (const node of currentNodes) {

                if (!node) continue;

                const refs =
                    node.refs.get(part) ?? [];

                for (const refId of refs) {

                    const next =
                        graph.nodes.get(refId);

                    if (next) {
                        nextNodes.push(next);
                    }
                }
            }

            currentNodes = nextNodes;

            if (currentNodes.length === 0) {
                return [];
            }
        }

        const last = remainingPath[remainingPath.length - 1];

        if (!last) return [];

        const results: {
            value: any;
            sourceId: string;
        }[] = [];

        for (const node of currentNodes) {

            if (!node) continue;

            const value =
                node.data?.[last];

            if (Array.isArray(value)) {

                for (const v of value) {
                    results.push({
                        value: v,
                        sourceId: node.id
                    });
                }

            } else if (value !== undefined) {

                results.push({
                    value,
                    sourceId: node.id
                });
            }
        }

        return results;
    }
    
}