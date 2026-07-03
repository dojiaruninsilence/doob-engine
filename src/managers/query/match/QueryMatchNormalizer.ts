// import { QueryMatch } from "../../../types/QueryMatchTypes";

// export class QueryMatchNormalizer {

//     dedupe(matches: QueryMatch[]): QueryMatch[] {

//         const seen = new Set<string>();
//         const result: QueryMatch[] = [];

//         for (const match of matches) {

//             const leafId =
//                 match.pathNodes[match.pathNodes.length - 1];

//             const key =
//                 `${match.rootId}:${leafId}`;

//             if (seen.has(key)) {
//                 continue;
//             }

//             seen.add(key);
//             result.push(match);
//         }

//         return result;
//     }
// }