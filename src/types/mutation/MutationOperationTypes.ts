import { MutationContext } from "./MutationTypes";

export type MutationMode =
	| "single"
	| "all"
	| "distinct"
	| "fanout";

export interface SetOperation {
	type: "set";
	value: any;
}

export interface MathOperation {
	type: "math";

	op:
		| "add"
		| "sub"
		| "mul"
		| "div";

	value: number;
}

export interface TransformOperation {
	type: "transform";

	fn: (
		value: any,
		context: MutationContext
	) => any;
}

export type MutationOperation =
	| SetOperation
	| MathOperation
	| TransformOperation;