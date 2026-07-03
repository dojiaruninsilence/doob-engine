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

    private findNodeForFieldPath(
        match: QueryMatch,
        fieldPath: string
    ): number {

        const fieldParts =
            fieldPath.split(".");

        let bestDepth = 0;

        for (const bindingKey of Object.keys(match.bindings)) {

            const bindingParts =
                bindingKey.split(".");

            // remove schema/root prefix
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

        return bestDepth;
    }

    private findBindingForPath(
        match: QueryMatch,
        traversalPath: string[]
    ): string | undefined {

        const target =
            traversalPath.join(".");

        for (const bindingKey of Object.keys(match.bindings)) {

            const parts =
                bindingKey.split(".");

            const suffix =
                parts.slice(-traversalPath.length)
                    .join(".");

            if (suffix === target) {
                return bindingKey;
            }
        }

        return undefined;
    }

    private splitPathAtMatch(
        match: QueryMatch,
        fieldPath: string
    ): {
        matchedPath: string[];
        remainingPath: string[];
    } {

        const fieldParts =
            fieldPath.split(".");

        let bestMatchLength = 0;

        for (const bindingKey of Object.keys(match.bindings)) {

            const bindingParts =
                bindingKey.split(".");

            const candidate =
                bindingParts.slice(1); // remove root schema name

            let matches = true;

            for (
                let i = 0;
                i < candidate.length;
                i++
            ) {

                if (fieldParts[i] !== candidate[i]) {
                    matches = false;
                    break;
                }
            }

            if (
                matches &&
                candidate.length > bestMatchLength
            ) {
                bestMatchLength =
                    candidate.length;
            }
        }

        return {
            matchedPath:
                fieldParts.slice(
                    0,
                    bestMatchLength
                ),
            remainingPath:
                fieldParts.slice(
                    bestMatchLength
                )
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

    getDataValue(
        graph: ResolvedRecordGraph,
        match: QueryMatch,
        path: string,
        mode: ValueMode = "aggregate"
    ): any {

        const {
            nodeIndex,
            remainingPath
        } = this.resolveFieldTarget(
            match,
            path
        );

        let startNodeId =
            match.pathNodes[nodeIndex];

        let currentNodes = [
            graph.nodes.get(startNodeId)
        ].filter(Boolean);

        if (currentNodes.length === 0) {
            return undefined;
        }

        // ----------------------------------
        // Traverse remaining path
        // ----------------------------------

        for (let i = 0; i < remainingPath.length; i++) {

            const part = remainingPath[i];
            const isLast =
                i === remainingPath.length - 1;

            // ----------------------------------
            // Final field access
            // ----------------------------------

            if (isLast) {

                const results: any[] = [];

                for (const node of currentNodes) {

                    if (!node) continue;

                    const value =
                        node.data?.[part];

                    if (Array.isArray(value)) {
                        results.push(...value);
                    } else if (value !== undefined) {
                        results.push(value);
                    }
                }

                if (results.length === 0) {
                    return undefined;
                }

                return results.length === 1
                    ? results[0]
                    : results;
            }

            // ----------------------------------
            // Reference traversal
            // ----------------------------------

            const nextNodes: typeof currentNodes = [];

            for (const node of currentNodes) {

                if (!node) continue;

                const refs =
                    node.refs.get(part) ?? [];

                for (const refId of refs) {

                    const nextNode =
                        graph.nodes.get(refId);

                    if (nextNode) {
                        nextNodes.push(nextNode);
                    }
                }
            }

            currentNodes = nextNodes;

            if (currentNodes.length === 0) {
                return undefined;
            }
        }

        return undefined;
    }

    resolveGroupValues(
        graph: ResolvedRecordGraph,
        match: QueryMatch,
        path: string
    ): { value: any; sourceId: string }[] {

        const { nodeIndex, remainingPath } =
            this.resolveFieldTarget(match, path);

        let currentNodes = [
            graph.nodes.get(match.rootId)
        ].filter(Boolean);

        if (currentNodes.length === 0) return [];

        // traverse structural path (same logic as aggregate)
        for (let i = 0; i < remainingPath.length - 1; i++) {

            const part = remainingPath[i];
            const nextNodes: typeof currentNodes = [];

            for (const node of currentNodes) {

                const refs = node.refs.get(part) ?? [];

                for (const refId of refs) {
                    const next = graph.nodes.get(refId);
                    if (next) nextNodes.push(next);
                }
            }

            currentNodes = nextNodes;

            if (currentNodes.length === 0) return [];
        }

        const last = remainingPath[remainingPath.length - 1];
        if (!last) return [];

        const results: { value: any; sourceId: string }[] = [];

        for (const node of currentNodes) {

            const value = node.data?.[last];

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