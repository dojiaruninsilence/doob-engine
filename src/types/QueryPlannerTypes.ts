export interface QueryPlan {
	rootSchema: string;

	steps: QueryPlanStep[];
}

export interface QueryPlanStep {
	from: string;      // schema
	field: string;     // field name
	to: string;        // target schema
	isReference: boolean;
    toRuleset: string;
}