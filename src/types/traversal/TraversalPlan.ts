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