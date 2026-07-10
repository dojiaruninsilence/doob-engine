import { TraversalMatch } from "../traversal";

export interface MutationTarget {
    match: TraversalMatch;
    // rootId: string;
    // nodeId: string;
    field: string;
	valid: boolean;
}

export interface MutationTargetSet {
    targets: MutationTarget[];
    whereMatches: TraversalMatch[];
}