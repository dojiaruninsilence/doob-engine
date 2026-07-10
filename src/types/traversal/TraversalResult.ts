import { TraversalMatch } from "./TraversalMatch";

export interface TraversalResult {
    // value?: any;
    // values?: any[];
    // //nodes?: any[];
    // nodeIds?: string[];
    // sourceIds?: string[];
    matches: TraversalMatch[];
}

export type ResolvedValue =
    | { type: "value"; value: any }
    | { type: "nodes"; nodes: string[] };