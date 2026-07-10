import { TraversalMatch } from "../../types/traversal";
import { MutationTarget } from "../../types/mutation/MutationTargetTypes";
import { TraceLogger } from "../logging/TraceLogger";

export class MutationTargetResolver {

    constructor(trace: TraceLogger) {}

	resolve(
		matches: TraversalMatch[],
		field: string
	): MutationTarget[] {

		const targets: MutationTarget[] = [];

		for (const match of matches) {

			targets.push({
				match,
				field,
				valid: true
			});
		}

		return targets;
	}
}