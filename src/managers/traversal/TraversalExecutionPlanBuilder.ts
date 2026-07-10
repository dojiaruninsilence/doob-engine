import { TraversalPlan, TraversalPlanSet, TraversalExecutionPlan, TraversalBranchPlan } from "../../types/traversal";

export class TraversalExecutionPlanBuilder {

    build(
        plans: TraversalPlanSet
    ): TraversalExecutionPlan {

        if (!plans.groupBy && !plans.aggregate) {
            throw new Error(
                "TraversalExecutionPlan requires groupBy or aggregate"
            );
        }

        const rootSchema =
            plans.groupBy?.rootSchema ??
            plans.aggregate?.rootSchema;

        if (!rootSchema) {
            throw new Error(
                "TraversalExecutionPlan missing rootSchema"
            );
        }

        const execution: TraversalExecutionPlan = {
            rootSchema
        };

        // ----------------------------------
        // Group + Aggregate
        // ----------------------------------

        if (
            plans.groupBy &&
            plans.aggregate
        ) {

            // ----------------------------------
            // Same traversal
            // ----------------------------------

            if (
                this.plansEquivalent(
                    plans.groupBy,
                    plans.aggregate
                )
            ) {

                execution.groupBranch = {

                    anchorPlan: {
                        rootSchema,
                        steps: []
                    },

                    suffixPlan:
                        plans.groupBy
                };

                // aggregateBranch intentionally omitted
                // executor should reuse group matches

                return execution;
            }

            // ----------------------------------
            // Shared prefix
            // ----------------------------------

            const relationship =
                this.buildBranches(
                    plans.groupBy,
                    plans.aggregate
                );

            execution.commonPrefix =
                relationship.commonPrefix;

            execution.groupBranch =
                relationship.groupBranch;

            execution.aggregateBranch =
                relationship.aggregateBranch;

            return execution;
        }

        // ----------------------------------
        // Group only
        // ----------------------------------

        if (plans.groupBy) {

            execution.groupBranch = {

                anchorPlan: {
                    rootSchema,
                    steps: []
                },

                suffixPlan:
                    plans.groupBy
            };
        }

        // ----------------------------------
        // Aggregate only
        // ----------------------------------

        if (plans.aggregate) {

            execution.aggregateBranch = {

                anchorPlan: {
                    rootSchema,
                    steps: []
                },

                suffixPlan:
                    plans.aggregate
            };
        }

        return execution;
    }

    private plansEquivalent(
        left: TraversalPlan,
        right: TraversalPlan
    ): boolean {

        if (
            left.rootSchema !== right.rootSchema
        ) {
            return false;
        }

        if (
            left.steps.length !==
            right.steps.length
        ) {
            return false;
        }

        for (
            let i = 0;
            i < left.steps.length;
            i++
        ) {

            const a = left.steps[i];
            const b = right.steps[i];

            if (
                a.kind !== b.kind
            ) {
                return false;
            }

            if (
                a.field !== b.field
            ) {
                return false;
            }

            if (
                a.kind === "collection" &&
                b.kind === "collection" &&
                a.mode !== b.mode
            ) {
                return false;
            }
        }

        return true;
    }

    private buildBranches(
        groupPlan: TraversalPlan,
        aggregatePlan: TraversalPlan
    ): {
        commonPrefix?: TraversalPlan;

        groupBranch: TraversalBranchPlan;

        aggregateBranch: TraversalBranchPlan;
    } {

        const commonSteps = [];

        let index = 0;

        while (
            index < groupPlan.steps.length &&
            index < aggregatePlan.steps.length
        ) {

            const groupStep =
                groupPlan.steps[index];

            const aggregateStep =
                aggregatePlan.steps[index];

            if (
                groupStep.kind !== aggregateStep.kind ||
                groupStep.field !== aggregateStep.field
            ) {
                break;
            }

            if (
                groupStep.kind === "collection" &&
                aggregateStep.kind === "collection" &&
                groupStep.mode !== aggregateStep.mode
            ) {
                break;
            }

            commonSteps.push(
                groupStep
            );

            index++;
        }

        const commonPrefix =
            commonSteps.length
                ? {
                    rootSchema:
                        groupPlan.rootSchema,

                    steps:
                        commonSteps
                }
                : undefined;

        const groupSuffix: TraversalPlan = {

            rootSchema:
                groupPlan.rootSchema,

            steps:
                groupPlan.steps.slice(index)
        };

        const aggregateSuffix: TraversalPlan = {

            rootSchema:
                aggregatePlan.rootSchema,

            steps:
                aggregatePlan.steps.slice(index)
        };

        return {

            commonPrefix,

            groupBranch: {

                anchorPlan:
                    commonPrefix ??
                    {
                        rootSchema:
                            groupPlan.rootSchema,

                        steps: []
                    },

                suffixPlan:
                    groupSuffix
            },

            aggregateBranch: {

                anchorPlan:
                    commonPrefix ??
                    {
                        rootSchema:
                            aggregatePlan.rootSchema,

                        steps: []
                    },

                suffixPlan:
                    aggregateSuffix
            }
        };
    }
}