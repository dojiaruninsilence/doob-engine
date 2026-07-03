import { ResolvedRecordGraphNavigator } from "../graph/ResolvedRecordGraphNavigator";
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

export class AggregateBootstrap {

    static build(
        // navigator: ResolvedRecordGraphNavigator,
        matchNavigator: QueryMatchNavigator
    ): AggregateResolver {

        const registry =
            new AggregateStrategyRegistry();

        registry.register("count-matches", new CountMatchesStrategy());
        registry.register("count-roots", new CountRootsStrategy());
        registry.register("sum", new SumStrategy(matchNavigator));
        registry.register("avg", new AvgStrategy(matchNavigator));
        registry.register("min", new MinStrategy(matchNavigator));
        registry.register("max", new MaxStrategy(matchNavigator));
        registry.register("distinct-count", new DistinctCountStrategy(matchNavigator));
        registry.register("distinct-values", new DistinctValuesStrategy(matchNavigator));

        return new AggregateResolver(registry);
    }
}