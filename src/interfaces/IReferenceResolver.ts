import { SchemaContext } from "../types/ContextTypes";

export interface IReferenceResolver {
	resolve(
		context: SchemaContext,
		id: string
	): Promise<any>;
}