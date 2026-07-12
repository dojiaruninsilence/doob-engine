import { AggregateResolver } from "../../managers/query/aggregate/AggregateResolver";
import { AggregateStrategyRegistry } from "../../managers/query/aggregate/AggregateStrategyRegistry";
import { CountMatchesStrategy } from "../../managers/query/aggregate/strategies/CountMatchesStrategy";
import { SumStrategy } from "../../managers/query/aggregate/strategies/SumStrategy";
import { AvgStrategy } from "../../managers/query/aggregate/strategies/AvgStrategy";
import { MinStrategy } from "../../managers/query/aggregate/strategies/MinStrategy";
import { MaxStrategy } from "../../managers/query/aggregate/strategies/MaxStrategy";
import { DistinctCountStrategy } from "../../managers/query/aggregate/strategies/DistinctCountStrategy";
import { DistinctValuesStrategy } from "../../managers/query/aggregate/strategies/DistinctValuesStrategy";
import { CountRootsStrategy } from "../../managers/query/aggregate/strategies/CountRootsStrategy";
import { TraceLogger } from "../../managers/logging/TraceLogger";

export class AggregateBootstrap {

    static build(
        trace: TraceLogger
    ): AggregateResolver {

        const registry =
            new AggregateStrategyRegistry();

        registry.register("count-matches", new CountMatchesStrategy(trace));
        registry.register("count-roots", new CountRootsStrategy(trace));
        registry.register("sum", new SumStrategy(trace));
        registry.register("avg", new AvgStrategy(trace));
        registry.register("min", new MinStrategy(trace));
        registry.register("max", new MaxStrategy(trace));
        registry.register("distinct-count", new DistinctCountStrategy(trace));
        registry.register("distinct-values", new DistinctValuesStrategy(trace));

        return new AggregateResolver(registry, trace);
    }
}