import { TraversalMatch } from "../traversal";

export interface MutationTarget {
    match: TraversalMatch;
    field: string;
	valid: boolean;
}

export interface MutationTargetSet {
    targets: MutationTarget[];
    whereMatches: TraversalMatch[];
}