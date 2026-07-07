export interface TraversalResult {
    value?: any;
    values?: any[];
    nodes?: any[];
}

export type ResolvedValue =
    | { type: "value"; value: any }
    | { type: "nodes"; nodes: string[] };