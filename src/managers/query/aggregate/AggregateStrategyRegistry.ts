import { IAggregateStrategy } from "./IAggregateStrategy";

export class AggregateStrategyRegistry {

    private strategies =
        new Map<string, IAggregateStrategy>();

    register(
        op: string,
        strategy: IAggregateStrategy
    ): void {

        this.strategies.set(
            op,
            strategy
        );
    }

    get(
        op: string
    ): IAggregateStrategy {

        const strategy =
            this.strategies.get(op);

        if (!strategy) {

            throw new Error(
                `No aggregate strategy registered for '${op}'`
            );
        }

        return strategy;
    }
}