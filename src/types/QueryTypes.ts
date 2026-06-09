export interface Query {
	where?: Record<string, any>;
	sort?: {
		field: string;
		direction: "asc" | "desc";
	};
	limit?: number;
	offset?: number;
}