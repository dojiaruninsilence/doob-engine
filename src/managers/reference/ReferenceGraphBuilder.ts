import { QueryPlan, QueryPlanStep } from "../../types/QueryPlannerTypes";
import { ReferencePlan } from "../../types/QueryExecutionTypes";

export class ReferenceGraphBuilder {

    build(plan: QueryPlan): ReferencePlan {

        const stepMap = new Map<string, QueryPlanStep[]>();
        const schemaEdges = new Map<string, Set<string>>();

        for (const step of plan.steps) {

            if (!stepMap.has(step.from)) {
                stepMap.set(step.from, []);
            }

            stepMap.get(step.from)!.push(step);

            if (!schemaEdges.has(step.from)) {
                schemaEdges.set(step.from, new Set());
            }

            schemaEdges.get(step.from)!.add(step.to);
        }

        return {
            bySchema: schemaEdges,
            stepMap
        };
    }
}