export interface MutationError {
	rootId: string;
	path: string;
	message: string;
}

export interface MutationResult {
	updated: number;
	skipped: number;
	errors: MutationError[];
}