import { TraversalMatch } from "../traversal";

export interface FilterResult {
	keep: boolean;
	matches: TraversalMatch[];
}