export interface MutationValidationError {
    path: string;
    message: string;
}

export interface MutationValidationResult {
    valid: boolean;
    errors: MutationValidationError[];
}