export type ResolvedRecordGraph = {
    rootSchema: string;

    nodes: Map<string, ResolvedNode>; // id → node

    roots: string[]; // root record ids
};

export type ResolvedNode = {
    id: string;
    schema: string;

    data: any;

    refs: Map<string, string[]>; 
};