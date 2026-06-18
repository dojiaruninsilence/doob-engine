export type AggregateOp =
    | "count"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "distinct";

export type AggregateRequest = {
    op: AggregateOp;
    field?: string; // required for everything except count
};