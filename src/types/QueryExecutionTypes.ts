import { DataRecord } from "./DataTypes";
import { QueryPlanStep } from "./QueryPlannerTypes";

export type SchemaDependencyMap =
    Map<string, Set<string>>;

export type SchemaIdMap =
    Map<string, Set<string>>;

export type HydrationMap =
    Map<string, Map<string, DataRecord>>;

export type ReferencePlan = {
    bySchema: SchemaDependencyMap;
    stepMap: Map<string, QueryPlanStep[]>;
};