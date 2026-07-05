import { TraversalPlan, TraversalStep, TraversalResult, TraversalContext } from "../../types/traversal/index";

export class TraversalExecutor {

    execute(
        context: TraversalContext,
        root: any,
        plan: TraversalPlan
    ): TraversalResult {

        let current: any = root;
        let parent: any = null;

        for (const step of plan.steps) {

            parent = current;

            switch (step.kind) {

                // ---------------------------------
                // OBJECT TRAVERSAL
                // ---------------------------------
                case "object": {
                    if (current == null) {
                        return { value: undefined };
                    }

                    current = current?.[step.field];

                    break;
                }

                // ---------------------------------
                // REFERENCE TRAVERSAL (STUB)
                // ---------------------------------
                case "reference": {
                    // For now we assume references are already resolved
                    // later: hook into graph or DataManager

                    if (current == null) {
                        return { value: undefined };
                    }

                    current = current?.[step.field];

                    break;
                }

                // ---------------------------------
                // COLLECTION TRAVERSAL (STUB)
                // ---------------------------------
                case "collection": {
                    // NOT IMPLEMENTED YET
                    // we intentionally fail soft so systems can evolve

                    if (!Array.isArray(current?.[step.field])) {
                        return { value: undefined };
                    }

                    const arr = current[step.field];

                    if (step.mode === "first") {
                        current = arr[0];
                    } else {
                        current = arr;
                    }

                    break;
                }

                default:
                    return { value: undefined };
            }
        }

        return {
            value: current,
            nodes: parent ? [parent] : undefined
        };
    }
}