import { DataRecord } from "./DataTypes";

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

export interface QueryAggregate {
	op:
		| "count"
		| "sum"
		| "avg"
		| "min"
		| "max";

	field?: string;
}

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
	aggregate?: QueryAggregate;
	groupBy?: string;
}

export interface QueryGroupResult {
	key: any;
	records: DataRecord[];
	value: number; // aggregation result
}