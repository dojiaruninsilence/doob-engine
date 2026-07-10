import { MutationOperation, SetOperation, MathOperation, TransformOperation } from "../../../types/mutation/MutationOperationTypes";
import { MutationContext } from "../../../types/mutation/MutationTypes";
import { TraceLogger } from "../../logging/TraceLogger";

export class MutationOperationResolver {

    constructor(trace: TraceLogger) {}

    apply(
        currentValue: any,
        operation: MutationOperation,
        context: MutationContext
    ): any {

        switch (operation.type) {

            case "set":
                return this.applySet(
                    currentValue,
                    operation,
                    context
                );

            case "math":
                return this.applyMath(
                    currentValue,
                    operation,
                    context
                );

            case "transform":
                return this.applyTransform(
                    currentValue,
                    operation,
                    context
                );

            default:
                throw new Error(
                    `Unknown mutation operation`
                );
        }
    }

    // --------------------------------------------------
    // SET
    // --------------------------------------------------

    private applySet(
        currentValue: any,
        operation: SetOperation,
        context: MutationContext
    ): any {

        return operation.value;
    }

    // --------------------------------------------------
    // MATH
    // --------------------------------------------------

    private applyMath(
        currentValue: any,
        operation: MathOperation,
        context: MutationContext
    ): any {

        if (typeof currentValue !== "number") {
            throw new Error(
                `Math mutation requires numeric value`
            );
        }

        switch (operation.op) {

            case "add":
                return currentValue + operation.value;

            case "sub":
                return currentValue - operation.value;

            case "mul":
                return currentValue * operation.value;

            case "div":

                if (operation.value === 0) {
                    throw new Error(
                        "Division by zero"
                    );
                }

                return currentValue / operation.value;

            default:
                throw new Error(
                    `Unknown math operation`
                );
        }
    }

    // --------------------------------------------------
    // TRANSFORM
    // --------------------------------------------------

    private applyTransform(
        currentValue: any,
        operation: TransformOperation,
        context: MutationContext
    ): any {

        return operation.fn(
            currentValue,
            context
        );
    }
}