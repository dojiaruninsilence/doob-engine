import { TraversalPlanner } from "./TraversalPlanner";
import { TraversalRequestSet, TraversalPlanSet } from "../../types/traversal";
import { TraceLogger } from "../logging/TraceLogger";

export class TraversalPlanBuilder {

	constructor(
		private planner: TraversalPlanner,
		private trace: TraceLogger
	) {}

	build(
		requests: TraversalRequestSet
	): TraversalPlanSet {

		return {

			groupBy:
				requests.groupBy
					? this.planner.build(
						requests.groupBy
					)
					: undefined,

			aggregate:
				requests.aggregate
					? this.planner.build(
						requests.aggregate
					)
					: undefined,

			select:
				requests.select.map(
					r => this.planner.build(r)
				),

			where:
				requests.where.map(
					r => this.planner.build(r)
				)
		};
	}
}