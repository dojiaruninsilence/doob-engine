import { AggregateRequest } from "./AggregateTypes";
import { DataRecord } from "../DataTypes";
import { QueryMatch } from "./QueryMatchTypes";

export interface Query {
	where?: Record<string, any>;
	sort?: {
		field: string;
		direction: "asc" | "desc";
	};
	limit?: number;
	offset?: number;
}

export type QueryOperator =
	| "="
	| "!="
	| ">"
	| ">="
	| "<"
	| "<="
	| "in"
	| "contains"
	| "exists";

export interface QueryFilter {
	field: string;
	op: QueryOperator;
	value?: any;
}

export interface QueryRequest {
	where?: QueryFilter[];
	limit?: number;
	offset?: number;
	sort?: {
		field: string;
		dir: "asc" | "desc";
	};
	select?: string[];
	aggregate?: AggregateRequest;
	groupBy?: string;
	groupByMode?: "fanout" | "collapse" | "first" | "distinct";
	having?: QueryFilter[];
}

export interface QueryGroupResult {
	key: any;
	records: DataRecord[];
	// matches: QueryMatch[];
	value: number; // aggregation result
}