import { SchemaContext } from "../../../types/ContextTypes";
import { MutationValidationResult } from "../../../types/mutation/MutationValidationTypes";
import { ContextFactory } from "../../ContextFactory";
import { MutationTraceLogger } from "../debug/MutationTraceLogger";

export class MutationValidationLayer {

    constructor(
        private contextFactory: ContextFactory,
        private trace: MutationTraceLogger
    ) {}

    async validate(
        context: SchemaContext,
        select: string
    ): Promise<MutationValidationResult> {

        const errors: MutationValidationResult["errors"] = [];

        const parts = select.split(".");
        let schema = context.schema;

        for (let i = 0; i < parts.length; i++) {

            const part = parts[i];
            const field = schema.fields?.[part];

            // ---------------------------------
            // FIELD MUST EXIST
            // ---------------------------------
            if (!field) {
                errors.push({
                    path: parts.slice(0, i + 1).join("."),
                    message: `Field does not exist: ${part}`
                });
                break;
            }

            const isLast = i === parts.length - 1;

            if (isLast) {

                const capability =
                    field.capability ?? "mutable";

                if (capability !== "mutable") {

                    errors.push({
                        path: select,
                        message:
                            `Field is not mutable: ${part} (${capability})`
                    });
                }

                continue;
            }

            // ---------------------------------
            // TRAVERSAL STEP
            // ---------------------------------

            const isReference =
                field.type === "reference" ||
                field.type === "referenceCollection";

            if (!isReference) {
                errors.push({
                    path: parts.slice(0, i + 1).join("."),
                    message: `Cannot traverse non-reference field: ${part}`
                });
                break;
            }

            // ---------------------------------
            // 🔥 REAL FIX: use referenceTarget
            // ---------------------------------
            const target = field.referenceTarget;

            if (!target?.schema) {
                errors.push({
                    path: parts.slice(0, i + 1).join("."),
                    message: `Missing referenceTarget schema on: ${part}`
                });
                break;
            }

            const nextContext =
                await this.contextFactory.getSchemaContext(
                    target.ruleset,
                    target.schema
                );

            schema = nextContext.schema;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}