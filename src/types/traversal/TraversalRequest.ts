import { TraversalStep } from "./TraversalStep";

export interface TraversalRequest {
	rootSchema: string;
	steps: TraversalStep[];
}

export interface TraversalRequestSet {

	groupBy?: TraversalRequest;

	aggregate?: TraversalRequest;

	select: TraversalRequest[];

	where: TraversalRequest[];
}