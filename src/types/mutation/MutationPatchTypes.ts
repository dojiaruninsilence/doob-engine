export interface MutationPatchEntry {
    path: string;
    value: any;
}

export interface MutationPatch {
    recordId: string;
    schemaName: string;
    changes: Map<string, any>;
}

export interface MutationBatchResult {
    patches: MutationPatch[];
    updated: number;
    skipped: number;
    errors: any[];
}