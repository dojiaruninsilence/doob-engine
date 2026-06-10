import { IReferenceResolver } from "../interfaces/IReferenceResolver";
import { ReferenceManager } from "../managers/ReferenceManager";
import { SchemaContext } from "../types/ContextTypes";

export class ReferenceResolverAdapter implements IReferenceResolver {

	constructor(private referenceManager: ReferenceManager) {}

	async resolve(context: SchemaContext, id: string) {
		return this.referenceManager.resolveById(context, id);
	}
}