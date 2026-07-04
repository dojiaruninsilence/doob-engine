// import { SchemaContext } from "../../types/ContextTypes";
// import { MutationRequest } from "../../types/mutation/MutationTypes";
// import { MutationPlan, MutationPlanStep } from "../../types/mutation/MutationPlanTypes";

// export class MutationPlanner {

//     async plan(
//         context: SchemaContext,
//         request: MutationRequest
//     ): Promise<MutationPlan> {

//         const steps: MutationPlanStep[] = [];

//         const select = request.select;

//         const parts = select.split(".");
//         if (parts.length === 0) {
//             return { steps };
//         }

//         const field = parts[parts.length - 1];
//         const traversal = parts.slice(0, -1);

//         const operationType = request.operation.type;

//         steps.push({
//             select,
//             traversal,
//             field,
//             operationType,
//             safe: true // we can upgrade this later with schema validation
//         });

//         return { steps };
//     }
// }