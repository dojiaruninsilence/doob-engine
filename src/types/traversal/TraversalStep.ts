export type TraversalStep =
    | ReferenceStep
    | ObjectStep
    | CollectionStep;

export interface ReferenceStep {
    kind: "reference";
    field: string;
}

export interface ObjectStep {
    kind: "object";
    field: string;
}

export interface CollectionStep {
    kind: "collection";
    field: string;
    mode: "first" | "all" | "expand";
}

export type ResolvedStepResult =
    | { type: "value"; value: any }
    | { type: "nodes"; value: string[] }