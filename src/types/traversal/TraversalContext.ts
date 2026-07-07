import { ResolvedRecordGraph } from "../query/ResolvedRecordGraph";
import { Schema } from "../SchemaTypes";

export interface TraversalContext {
    schema: Schema;
    graph?: ResolvedRecordGraph;
}