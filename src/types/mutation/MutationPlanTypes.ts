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