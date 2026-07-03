export type QueryMatch = {
    rootId: string;
    currentId: string;
    pathIndexes: number[];
    pathNodes: string[];
    bindings: Record<string, string>;
};

export type ValueMode = "aggregate" | "group";
