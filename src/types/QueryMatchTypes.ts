export type QueryMatch = {
    rootId: string;
    currentId: string;
    pathIndexes: number[];
    pathNodes: string[];
    bindings: Record<string, string>;
};

export type ValueMode = "aggregate" | "group";

// export type MatchIdentity = {
//     rootId: string;
//     leafId: string;
//     pathKey: string;
// };

// export type NormalizedMatchGroup = {
//     key: string;
//     matches: QueryMatch[];
// };