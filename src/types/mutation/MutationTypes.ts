import { DataRecord } from "../DataTypes";
import { QueryFilter } from "../query/QueryTypes";
import { MutationMode } from "./MutationOperationTypes";
import { MutationOperation } from "./MutationOperationTypes";

export interface MutationContext {
	record: DataRecord;
	fieldPath: string;
	currentValue: any;
}

export interface MutationRequest {

	select: string;

	where?: QueryFilter[];

	operation: MutationOperation;

	mode?: MutationMode;
}




// export interface MutationContext {
//     record: DataRecord;
//     fieldPath: string;
//     currentValue: any;
// }

// export type MutationMode =
//     | "single"      // first match only
//     | "all"         // default: mutate all matches
//     | "distinct"    // unique root-level targets only
//     | "fanout";     // full graph expansion (advanced)

// export interface SetOperation {
//     type: "set";
//     value: any;
// }

// export interface MathOperation {
//     type: "math";

//     op: "add" | "sub" | "mul" | "div";

//     value: number;
// }

// export interface TransformOperation {
//     type: "transform";

//     fn: (value: any, context: MutationContext) => any;
// }

// export type MutationOperation =
//     | SetOperation
//     | MathOperation
//     | TransformOperation;

// export interface MutationRequest {

//     // field path to mutate
//     select: string;

//     // optional filtering (reuse query system)
//     where?: QueryFilter[];

//     // operation to apply
//     operation: MutationOperation;

//     // optional safety / behavior controls
//     mode?: MutationMode;
// }

// export interface MutationError {
//     rootId: string;
//     path: string;
//     message: string;
// }

// export interface MutationResult {
//     updated: number;
//     skipped: number;
//     errors: MutationError[];
// }

// export interface MutationTarget {
//     rootId: string;
//     nodeId: string;
//     path: string[];
// }

// export interface MutationPlanStep {
//     from: string;
//     field: string;
//     to: string;

//     path: string;

//     cardinality: "one" | "many";

//     refType: "reference" | "referenceCollection";
// }

// export interface MutationPlan {
//     rootSchema: string;
//     steps: MutationPlanStep[];
// }