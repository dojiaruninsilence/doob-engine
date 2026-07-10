import { TraversalStep } from "./TraversalStep";

export interface TraversalPlan {
	rootSchema: string;
	steps: TraversalStep[];
}

export interface TraversalPlanSet {

	groupBy?: TraversalPlan;

	aggregate?: TraversalPlan;

	select: TraversalPlan[];

	where: TraversalPlan[];
}

export interface TraversalBranchPlan {

    anchorPlan: TraversalPlan;

    suffixPlan: TraversalPlan;
}

export interface TraversalExecutionPlan {

    rootSchema: string;

    commonPrefix?: TraversalPlan;

    groupBranch?: TraversalBranchPlan;

    aggregateBranch?: TraversalBranchPlan;
}

export interface TraversalExecutionOptions {

    returnNodes?: boolean;
}