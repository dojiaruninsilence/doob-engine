import { TraversalMatch } from "./TraversalMatch";

export interface TraversalResult {
    matches: TraversalMatch[];
}

export type ResolvedValue =
    | { type: "value"; value: any }
    | { type: "nodes"; nodes: string[] };