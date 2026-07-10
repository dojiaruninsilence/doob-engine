import { App } from "obsidian";

import { CacheManager } from "../managers/CacheManager";
import { ContextFactory } from "../managers/ContextFactory";
import { DataManager } from "../managers/DataManager";
import { LoggerFactory } from "../managers/logging/LoggerFactory";
import { TraceLogger } from "../managers/logging/TraceLogger";
import { MutationExecutor } from "../managers/mutation/MutationExecutor";
import { MutationPlanner } from "../managers/mutation/MutationPlanner";
import { MutationRequestBuilder } from "../managers/mutation/MutationRequestBuilder";
import { MutationTargetResolver } from "../managers/mutation/MutationTargetResolver";
import { MutationOperationResolver } from "../managers/mutation/operations/MutationOperationResolver";
import { MutationValidationLayer } from "../managers/mutation/validation/MutationValidationLayer";
import { AggregateBootstrap } from "../managers/query/aggregate/AggregateBootstrap";
import { QueryExecutionPlanRunner } from "../managers/query/QueryExecutionPlanRunner";
import { QueryExecutor } from "../managers/query/QueryExecutor";
import { QueryManager } from "../managers/query/QueryManager";
import { RulesetManager } from "../managers/RulesetManager";
import { SchemaManager } from "../managers/SchemaManager";
import { LegacyTraversalAdapter } from "../managers/traversal/LegacyTraversalAdapter";
import { ResolvedRecordGraphBuilder } from "../managers/traversal/ResolvedRecordGraphBuilder";
import { TraversalExecutionPlanBuilder } from "../managers/traversal/TraversalExecutionPlanBuilder";
import { TraversalExecutor } from "../managers/traversal/TraversalExecutor";
import { TraversalPlanBuilder } from "../managers/traversal/TraversalPlanBuilder";
import { TraversalPlanner } from "../managers/traversal/TraversalPlanner";
import { TraversalRequestBuilder } from "../managers/traversal/TraversalRequestBuilder";
import { ValueResolver } from "../managers/traversal/resolver/ValueResolver";

import { EngineServices } from "../types";

export class EngineBootstrap {

	static async build(app: App): Promise<EngineServices> {

		const loggerFactory = new LoggerFactory(app, {
			rootFolder: "Doob Engine/Logs"
		});

		const engineLog = await loggerFactory.create({
			filePath: "Engine/main.jsonl",
			mode: "append",
			defaultScope: "ENGINE",
			includeTimestamp: true
		});

		const cacheManager = new CacheManager(engineLog);

		const rulesetManager = new RulesetManager(app);

		const schemaManager = new SchemaManager(
			app,
			rulesetManager,
			cacheManager
		);

		const dataManager = new DataManager(
			app,
			schemaManager,
			rulesetManager,
			cacheManager
		);

		const contextFactory = new ContextFactory(
			schemaManager
		);

		const traceLogger = new TraceLogger(engineLog);

		const mutationOperationResolver =
			new MutationOperationResolver();

		const mutationTargetResolver =
			new MutationTargetResolver(traceLogger);

		const mutationValidationLayer =
			new MutationValidationLayer(
				contextFactory,
				traceLogger
			);

		const traversalAdapter =
			new LegacyTraversalAdapter(
				contextFactory
			);

		const valueResolver =
			new ValueResolver();

		const traversalExecutionPlanBuilder =
			new TraversalExecutionPlanBuilder();

		const traversalPlanner =
			new TraversalPlanner(
				traceLogger
			);

		const traversalExecutor =
			new TraversalExecutor(
				traceLogger,
				valueResolver
			);

		const traversalPlanBuilder =
			new TraversalPlanBuilder(
				traversalPlanner
			);

		const traversalRequestBuilder =
			new TraversalRequestBuilder(
				traversalAdapter
			);

		const mutationPlanner =
			new MutationPlanner(
				new MutationRequestBuilder(
					traversalAdapter
				),
				traversalPlanBuilder
			);

		const aggregateResolver =
			AggregateBootstrap.build(
				traceLogger
			);

		const resolvedRecordGraphBuilder =
			new ResolvedRecordGraphBuilder(
				dataManager,
				contextFactory,
				traceLogger
			);

		const queryExecutionPlanRunner =
			new QueryExecutionPlanRunner(
				resolvedRecordGraphBuilder
			);

		const queryExecutor =
			new QueryExecutor(
				dataManager,
				queryExecutionPlanRunner,
				aggregateResolver,
				traversalExecutor,
				traversalRequestBuilder,
				traversalPlanBuilder,
				traversalExecutionPlanBuilder,
				traceLogger
			);

		const queryManager =
			new QueryManager(
				queryExecutor
			);

		const mutationExecutor =
			new MutationExecutor(
				dataManager,
				dataManager,
				resolvedRecordGraphBuilder,
				mutationPlanner,
				mutationTargetResolver,
				mutationOperationResolver,
				traceLogger,
				contextFactory,
				mutationValidationLayer,
				traversalExecutor
			);

		return {
			loggerFactory,
			engineLog,

			cacheManager,
			rulesetManager,
			schemaManager,
			dataManager,
			contextFactory,

			traceLogger,

			traversalPlanner,
			traversalExecutor,
			traversalPlanBuilder,
			traversalRequestBuilder,

			resolvedRecordGraphBuilder,

			queryExecutionPlanRunner,
			queryExecutor,
			queryManager,

			mutationExecutor
		};
	}
}