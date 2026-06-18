import { ResolvedRecordGraphNavigator } from "../graph/ResolvedRecordGraphNavigator";
import { AggregateResolver } from "./AggregateResolver";
import { AggregateStrategyRegistry } from "./AggregateStrategyRegistry";
import { CountStrategy } from "./strategies/CountStrategy";
import { SumStrategy } from "./strategies/SumStrategy";
import { AvgStrategy } from "./strategies/AvgStrategy";
import { MinStrategy } from "./strategies/MinStrategy";
import { MaxStrategy } from "./strategies/MaxStrategy";
import { DistinctStrategy } from "./strategies/DistinctStrategy";

export class AggregateBootstrap {

    static build(
        navigator: ResolvedRecordGraphNavigator
    ): AggregateResolver {

        const registry =
            new AggregateStrategyRegistry();

        registry.register("count", new CountStrategy());
        registry.register("sum", new SumStrategy(navigator));
        registry.register("avg", new AvgStrategy(navigator));
        registry.register("min", new MinStrategy(navigator));
        registry.register("max", new MaxStrategy(navigator));
        registry.register("distinct", new DistinctStrategy(navigator));

        return new AggregateResolver(registry);
    }
}