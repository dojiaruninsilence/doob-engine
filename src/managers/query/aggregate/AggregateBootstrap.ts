import { AggregateResolver } from "./AggregateResolver";
import { AggregateStrategyRegistry } from "./AggregateStrategyRegistry";
import { CountMatchesStrategy } from "./strategies/CountMatchesStrategy";
import { SumStrategy } from "./strategies/SumStrategy";
import { AvgStrategy } from "./strategies/AvgStrategy";
import { MinStrategy } from "./strategies/MinStrategy";
import { MaxStrategy } from "./strategies/MaxStrategy";
import { DistinctCountStrategy } from "./strategies/DistinctCountStrategy";
import { DistinctValuesStrategy } from "./strategies/DistinctValuesStrategy";
import { QueryMatchNavigator } from "../match/QueryMatchNavigator";
import { CountRootsStrategy } from "./strategies/CountRootsStrategy";
import { TraversalExecutor } from "../../traversal/TraversalExecutor";
import { TraceLogger } from "../../logging/TraceLogger";

export class AggregateBootstrap {

    static build(
        travExecutor: TraversalExecutor,
        trace: TraceLogger
        // matchNavigator: QueryMatchNavigator
    ): AggregateResolver {

        const registry =
            new AggregateStrategyRegistry();

        registry.register("count-matches", new CountMatchesStrategy(trace));
        registry.register("count-roots", new CountRootsStrategy(trace));
        registry.register("sum", new SumStrategy(travExecutor, trace));
        registry.register("avg", new AvgStrategy(travExecutor, trace));
        registry.register("min", new MinStrategy(travExecutor, trace));
        registry.register("max", new MaxStrategy(travExecutor, trace));
        registry.register("distinct-count", new DistinctCountStrategy(travExecutor, trace));
        registry.register("distinct-values", new DistinctValuesStrategy(travExecutor, trace));

        return new AggregateResolver(registry);
    }
}