export interface MutationPlanStep {
	from: string;
	field: string;
	to: string;

	path: string;

	cardinality:
		| "one"
		| "many";

	refType:
		| "reference"
		| "referenceCollection";
}

export interface MutationPlan {
	rootSchema: string;
	steps: MutationPlanStep[];
}