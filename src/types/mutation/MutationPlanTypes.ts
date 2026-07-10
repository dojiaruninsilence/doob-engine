import { TraversalPlan, TraversalPlanSet } from "../traversal";

export interface MutationPlan {
    steps: MutationPlanStep[];
}

export interface MutationPlanStep {
    select: string;

    traversal: string[];
    field: string;

    operationType: string;

    safe: boolean;
}

export interface MutationPlanSet {

    // targetPath: string;
     target: TraversalPlan;

    traversals: TraversalPlanSet;
}