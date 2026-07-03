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

        // new Notice(JSON.stringify({graph, match, path}));

        const parts = path.split(".");

        let node =
            graph.nodes.get(match.rootId);

        if (!node) {
            return undefined;
        }

        let pathIndex = 0;

        // new Notice(
        //     JSON.stringify({
        //         path,
        //         pathNodes: match.pathNodes
        //     })
        // );

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];
            const isLast =
                i === parts.length - 1;

            // new Notice(
            //     JSON.stringify({
            //         part,
            //         nodeId: node.id,
            //         refs: node.refs.get(part)
            //     })
            // );

            if (isLast) {
                // new Notice(
                //     JSON.stringify({
                //         // finalNode: node.id,
                //         // field: part,
                //         value: node.data?.[part]
                //     })
                // );

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

    // getDataValue(
    //     graph: ResolvedRecordGraph,
    //     match: QueryMatch,
    //     path: string,
    //     mode: ValueMode = "aggregate"
    // ): any {

    // //     // new Notice(
    // //     //     JSON.stringify({
    // //     //         path,
    // //     //         currentId: match.currentId,
    // //     //         bindings: match.bindings,
    // //     //         pathNodes: match.pathNodes
    // //     //     }, null, 2)
    // //     // );

    // //     const node = graph.nodes.get(match.currentId);
    // //     if (!node) return undefined;

    // //     const parts = path.split(".");
    // //     const field = parts[parts.length - 1];
    // //     const traversal = parts.slice(0, -1);

    // //     // ------------------------------
    // //     // GROUP MODE (STRICT PATH FOLLOWING)
    // //     // ------------------------------
    // //     if (mode === "group") {

    // //         let current = node;

    // //         for (let i = 0; i < parts.length - 1; i++) {

    // //             const part = parts[i];

    // //             const refs = current.refs.get(part);

    // //             if (!refs?.length) return undefined;

    // //             const nextId = refs[0];
    // //             current = graph.nodes.get(nextId);

    // //             if (!current) return undefined;
    // //         }

    // //         return current.data?.[field];
    // //     }

    // //     // ------------------------------
    // //     // AGGREGATE MODE (FAST PATH)
    // //     // ------------------------------
    // //     return node.data?.[field];

    // //     // const parts = path.split(".");
    // //     // const field = parts[parts.length - 1];

    // //     // const traversal = parts.slice(0, -1);

    // //     // const node = graph.nodes.get(match.currentId);
    // //     // if (!node) return undefined;

    // //     // // 🔥 KEY FIX: if we are already at the right depth node
    // //     // // OR this is a terminal match node, just read data directly
    // //     // if (traversal.length === 0) {
    // //     //     return node.data?.[field];
    // //     // }

    // //     // // If current node actually contains the field, trust it
    // //     // if (node.data && field in node.data) {
    // //     //     return node.data[field];
    // //     // }

    // //     // // fallback to binding resolution (ONLY for reference chains)
    // //     // const bindingKey =
    // //     //     this.findBindingForPath(match, traversal);

    // //     // if (!bindingKey) return undefined;

    // //     // const targetId =
    // //     //     match.bindings[bindingKey];

    // //     // const targetNode =
    // //     //     graph.nodes.get(targetId);

    // //     // return targetNode?.data?.[field];
    // // }

    // // // getDataValue(
    // // //     graph: ResolvedRecordGraph,
    // // //     match: QueryMatch,
    // // //     path: string
    // // // ): any {

    // // //     const parts = path.split(".");

    // // //     const field =
    // // //         parts[parts.length - 1];

    // // //     const node =
    // // //         graph.nodes.get(match.currentId);

    // // //     if (!node) {
    // // //         return undefined;
    // // //     }

    // // //     return node.data?.[field];

    //     const parts = path.split(".");
    //     let nodes: string[] = [match.currentId];

    //     for (let i = 0; i < parts.length - 1; i++) {

    //         const part = parts[i];
    //         const next: string[] = [];

    //         for (const nodeId of nodes) {

    //             const node = graph.nodes.get(nodeId);
    //             if (!node) continue;

    //             const refs = node.refs.get(part) ?? [];

    //             for (const r of refs) {
    //                 next.push(r);
    //             }
    //         }

    //         nodes = next;
    //     }

    //     const field = parts[parts.length - 1];

    //     const results: any[] = [];

    //     for (const nodeId of nodes) {

    //         const node = graph.nodes.get(nodeId);
    //         if (!node) continue;

    //         results.push(node.data?.[field]);
    //     }

    //     return results.length === 1 ? results[0] : results;
    // }

    // getDataValue(
    //     graph: ResolvedRecordGraph,
    //     match: QueryMatch,
    //     path: string,
    //     mode: ValueMode = "aggregate"
    // ): any {

    //     const {
    //         remainingPath
    //     } = this.splitPathAtMatch(
    //         match,
    //         path
    //     );

    //     let currentNodes = [
    //         graph.nodes.get(match.currentId)
    //     ].filter(Boolean);

    //     if (currentNodes.length === 0) {
    //         return undefined;
    //     }

    //     // ----------------------------------
    //     // Traverse remaining path
    //     // ----------------------------------

    //     for (let i = 0; i < remainingPath.length; i++) {

    //         const part = remainingPath[i];
    //         const isLast =
    //             i === remainingPath.length - 1;

    //         // ------------------------------
    //         // Final field lookup
    //         // ------------------------------

    //         if (isLast) {

    //             const results: any[] = [];

    //             for (const node of currentNodes) {

    //                 if (!node) continue;

    //                 const value =
    //                     node.data?.[part];

    //                 if (Array.isArray(value)) {
    //                     results.push(...value);
    //                 } else if (
    //                     value !== undefined
    //                 ) {
    //                     results.push(value);
    //                 }
    //             }

    //             if (results.length === 0) {
    //                 return undefined;
    //             }

    //             return results.length === 1
    //                 ? results[0]
    //                 : results;
    //         }

    //         // ------------------------------
    //         // Reference traversal
    //         // ------------------------------

    //         const nextNodes: typeof currentNodes = [];

    //         for (const node of currentNodes) {

    //             if (!node) continue;

    //             const refs =
    //                 node.refs.get(part) ?? [];

    //             for (const refId of refs) {

    //                 const nextNode =
    //                     graph.nodes.get(refId);

    //                 if (nextNode) {
    //                     nextNodes.push(nextNode);
    //                 }
    //             }
    //         }

    //         currentNodes = nextNodes;

    //         if (currentNodes.length === 0) {
    //             return undefined;
    //         }
    //     }

    //     return undefined;
    // }

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

        // let currentNodes = [
        //     graph.nodes.get(match.pathNodes[nodeIndex])
        // ].filter(Boolean);

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

// import { QueryMatch } from "../../../types/QueryMatchTypes";
// import { ResolvedRecordGraph } from "../../../types/ResolvedRecordGraph";
// import { Notice } from "obsidian";

// export class QueryMatchNavigator {

//     getValue(
//         graph: ResolvedRecordGraph,
//         match: QueryMatch,
//         path: string
//     ): any {

//         const parts = path.split(".");
//         let node = graph.nodes.get(match.currentId);

//         if (!node) return undefined;

//         for (let i = 0; i < parts.length; i++) {

//             const part = parts[i];
//             const isLast = i === parts.length - 1;

//             if (isLast) {
//                 return node.data?.[part];
//             }

//             const next = node.data?.[part];

//             if (next === undefined || next === null) {
//                 return undefined;
//             }

//             node = graph.nodes.get(next);
//             if (!node) return undefined;
//         }

//         return undefined;

//         // // const parts = path.split(".");
//         // // const field = parts[parts.length - 1];

//         // // // ALWAYS trust match.currentId
//         // // const node = graph.nodes.get(match.currentId);

//         // // if (!node) return undefined;

//         // // return node.data?.[field];

//         // const parts = path.split(".");
//         // let node = graph.nodes.get(match.currentId);

//         // if (!node) return undefined;

//         // for (let i = 0; i < parts.length; i++) {

//         //     const part = parts[i];
//         //     const isLast = i === parts.length - 1;

//         //     if (isLast) {
//         //         return node.data?.[part];
//         //     }

//         //     const refs = node.refs.get(part);

//         //     if (!refs?.length) {
//         //         return undefined;
//         //     }

//         //     // node = graph.nodes.get(refs[0]);
//         //     const nextId = match.pathNodes[i + 1];
//         //     node = graph.nodes.get(nextId);

//         //     if (!node) return undefined;
//         // }

//         // return undefined;
//     }
    
//     // getValue(
//     //     graph: ResolvedRecordGraph,
//     //     match: QueryMatch,
//     //     path: string
//     // ): any {

//     //     const parts = path.split(".");

//     //     // -----------------------------
//     //     // Simple root field
//     //     // -----------------------------

//     //     if (parts.length === 1) {

//     //         const root =
//     //             graph.nodes.get(match.rootId);

//     //         return root?.data?.[parts[0]];
//     //     }

//     //     // -----------------------------
//     //     // Find deepest bound path
//     //     // -----------------------------

//     //     let nodeId: string | undefined;
//     //     let startIndex = 0;

//     //     for (let i = parts.length - 1; i > 0; i--) {

//     //         const bindingPath =
//     //             parts.slice(0, i).join(".");

//     //         const bound =
//     //             match.bindings[bindingPath];

//     //         if (bound) {

//     //             nodeId = bound;
//     //             startIndex = i;
//     //             break;
//     //         }
//     //     }

//     //     new Notice(
//     //         [
//     //             `Path: ${path}`,
//     //             `Resolved NodeId: ${nodeId}`,
//     //             `StartIndex: ${startIndex}`,
//     //             `Bindings: ${JSON.stringify(match.bindings)}`
//     //         ].join("\n")
//     //     );

//     //     let node =
//     //         nodeId
//     //             ? graph.nodes.get(nodeId)
//     //             : graph.nodes.get(match.rootId);

//     //     if (!node) {
//     //         return undefined;
//     //     }

//     //     // -----------------------------
//     //     // Traverse remaining segments
//     //     // -----------------------------

//     //     for (let i = startIndex; i < parts.length; i++) {

//     //         const part = parts[i];
//     //         const isLast =
//     //             i === parts.length - 1;

//     //         if (isLast) {
//     //             // new Notice(
//     //             //     [
//     //             //         `Path: ${path}`,
//     //             //         `NodeId: ${node.id}`,
//     //             //         `Field: ${part}`,
//     //             //         `Value: ${node.data?.[part]}`
//     //             //     ].join("\n")
//     //             // );
//     //             return node.data?.[part];
//     //         }

//     //         const refs =
//     //             node.refs.get(part);

//     //         if (!refs?.length) {
//     //             return undefined;
//     //         }

//     //         const nextId = refs[0];

//     //         node = graph.nodes.get(nextId);

//     //         if (!node) {
//     //             return undefined;
//     //         }
//     //     }

//     //     return undefined;
//     // }
    
//     // getValue(
//     //     graph: ResolvedRecordGraph,
//     //     match: QueryMatch,
//     //     path: string
//     // ): any {

//     //     const parts = path.split(".");

//     //     // Root field
//     //     if (parts.length === 1) {

//     //         const root =
//     //             graph.nodes.get(match.rootId);

//     //         return root?.data?.[parts[0]];
//     //     }

//     //     let sourceId: string | undefined;
//     //     let sourceIndex = 0;

//     //     // Find longest matching binding path
//     //     for (let i = parts.length - 1; i > 0; i--) {

//     //         const bindingPath =
//     //             parts.slice(0, i).join(".");

//     //         const id =
//     //             match.bindings[bindingPath];

//     //         if (id) {

//     //             sourceId = id;
//     //             sourceIndex = i;
//     //             break;
//     //         }
//     //     }

//     //     let node =
//     //         sourceId
//     //             ? graph.nodes.get(sourceId)
//     //             : graph.nodes.get(match.rootId);

//     //     if (!node) {
//     //         return undefined;
//     //     }

//     //     for (let i = 0; i < parts.length; i++) {

//     //         const part = parts[i];
//     //         const isLast = i === parts.length - 1;

//     //         if (isLast) {
//     //             return node.data?.[part];
//     //         }

//     //         const refs = node.refs.get(part);

//     //         if (!refs?.length) return undefined;

//     //         node = graph.nodes.get(refs[0]);

//     //         if (!node) return undefined;
//     //     }

//     //     // for (let i = sourceIndex; i < parts.length; i++) {

//     //     //     const part = parts[i];
//     //     //     const isLast =
//     //     //         i === parts.length - 1;

//     //     //     if (isLast) {
//     //     //         new Notice(
//     //     //         [
//     //     //             `Path: ${path}`,
//     //     //             `Current Node: ${node.id}`,
//     //     //             `Field: ${part}`,
//     //     //             `Value: ${node.data?.[part]}`
//     //     //         ].join("\n")
//     //     //     );

//     //     //         return node.data?.[part];
//     //     //     }

//     //     //     const refs =
//     //     //         node.refs.get(part);

//     //     //     if (!refs?.length) {
//     //     //         return undefined;
//     //     //     }

//     //     //     // node =
//     //     //     //     graph.nodes.get(refs[0]);

//     //     //     const nextId =
//     //     //         match.path?.[i] // or step-based index mapping

//     //     //     new Notice(nextId);

//     //     //     node = graph.nodes.get(nextId);

//     //     //     if (!node) {
//     //     //         return undefined;
//     //     //     }
//     //     // }

//     //     return undefined;
//     // }
    
//     // getValue(
//     //     graph: ResolvedRecordGraph,
//     //     match: QueryMatch,
//     //     path: string
//     // ): any {

//     //     const parts = path.split(".");

//     //     // start at CURRENT node (not root guessing)
//     //     let node = graph.nodes.get(match.currentId);

//     //     if (!node) return undefined;

//     //     for (let i = 0; i < parts.length; i++) {

//     //         const part = parts[i];
//     //         const isLast = i === parts.length - 1;

//     //         if (isLast) {
//     //             return node.data?.[part];
//     //         }

//     //         const refs = node.refs.get(part);

//     //         if (!refs || refs.length === 0) {
//     //             return undefined;
//     //         }

//     //         // deterministic traversal (important)
//     //         const nextId = refs[0];

//     //         node = graph.nodes.get(nextId);

//     //         if (!node) return undefined;
//     //     }

//     //     return undefined;
//     // }
    
//     // getValue(
//     //     graph: ResolvedRecordGraph,
//     //     match: QueryMatch,
//     //     path: string
//     // ): any {

//     //     const parts = path.split(".");

//     //     // find longest binding prefix
//     //     let boundId: string | undefined;
//     //     let startIndex = 0;

//     //     for (let i = parts.length; i > 0; i--) {

//     //         const key =
//     //             parts.slice(0, i).join(".");

//     //         const candidate =
//     //             match.bindings[key];

//     //         if (candidate) {
//     //             boundId = candidate;
//     //             startIndex = i;
//     //             break;
//     //         }
//     //     }

//     //     let currentNode;

//     //     if (boundId) {

//     //         currentNode =
//     //             graph.nodes.get(boundId);

//     //     } else {

//     //         currentNode =
//     //             graph.nodes.get(match.rootId);

//     //         startIndex = 0;
//     //     }

//     //     if (!currentNode) {
//     //         return undefined;
//     //     }

//     //     new Notice(
//     //         [
//     //             `Path: ${path}`,
//     //             `BoundId: ${boundId}`,
//     //             `StartIndex: ${startIndex}`
//     //         ].join("\n")
//     //     );

//     //     for (let i = startIndex; i < parts.length; i++) {

//     //         const part = parts[i];
//     //         const isLast = i === parts.length - 1;

//     //         if (isLast) {
//     //             return currentNode.data?.[part];
//     //         }

//     //         const refs =
//     //             currentNode.refs.get(part);

//     //         if (!refs || refs.length === 0) {
//     //             return undefined;
//     //         }

//     //         currentNode =
//     //             graph.nodes.get(refs[0]);

//     //         if (!currentNode) {
//     //             return undefined;
//     //         }
//     //     }

//     //     return undefined;
//     // }

//     // getValue(
//     //     graph: ResolvedRecordGraph,
//     //     match: QueryMatch,
//     //     path: string
//     // ): any {

//     //     const parts = path.split(".");

//     //     if (parts.length === 1) {

//     //         const root =
//     //             graph.nodes.get(match.rootId);

//     //         return root?.data?.[parts[0]];
//     //     }

//     //     const bindingKey =
//     //         parts.slice(0, -1).join(".");

//     //     const field =
//     //         parts[parts.length - 1];

//     //     const boundId =
//     //         match.bindings[bindingKey]
//     //         ?? match.bindings[parts[0]];

//     //     if (!boundId) {
//     //         return undefined;
//     //     }

//     //     const node =
//     //         graph.nodes.get(boundId);

//     //     return node?.data?.[field];
//     // }
// }