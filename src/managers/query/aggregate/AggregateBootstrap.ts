import { AggregateResolver } from "./AggregateResolver";
import { AggregateStrategyRegistry } from "./AggregateStrategyRegistry";
import { CountMatchesStrategy } from "./strategies/CountMatchesStrategy";
import { SumStrategy } from "./strategies/SumStrategy";
import { AvgStrategy } from "./strategies/AvgStrategy";
import { MinStrategy } from "./strategies/MinStrategy";
import { MaxStrategy } from "./strategies/MaxStrategy";
import { DistinctCountStrategy } from "./strategies/DistinctCountStrategy";
import { DistinctValuesStrategy } from "./strategies/DistinctValuesStrategy";
import { CountRootsStrategy } from "./strategies/CountRootsStrategy";
import { TraceLogger } from "../../logging/TraceLogger";

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

        return new AggregateResolver(registry);
    }
}