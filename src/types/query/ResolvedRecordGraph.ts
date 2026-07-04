import { DataRecord } from "../DataTypes";

export type ResolvedRecordGraph = {
    rootSchema: string;

    nodes: Map<string, ResolvedNode>; // id → node

    roots: string[]; // root record ids
};

export type ResolvedNode = {
    id: string;
    schema: string;

    // data: any;
    record: DataRecord;

    refs: Map<string, string[]>; 
};