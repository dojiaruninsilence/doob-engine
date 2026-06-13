import { SchemaContext } from "./ContextTypes";
import { QueryPlan } from "./QueryPlannerTypes";
import { QueryRequest } from "./QueryTypes";

export interface QueryExecutionContext {
    rootContext: SchemaContext;
    request: QueryRequest;
    plan: QueryPlan;
}

export interface ReferenceBatch {
    context: SchemaContext;
    field: string;
    ids: Set<string>;
}