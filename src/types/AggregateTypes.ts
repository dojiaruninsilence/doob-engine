export type AggregateOp =
    | "count"
    | "count-matches"
    | "count-roots"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "distinct"
    | "distinct-count"
    | "distinct-values";

export type AggregateRequest = {
    op: AggregateOp;
    field?: string; // required for everything except count
    mode?: "data" | "structural"
};