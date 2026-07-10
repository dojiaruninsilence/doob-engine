import { CacheManager } from "../../managers/CacheManager";
import { ContextFactory } from "../../managers/ContextFactory";
import { DataManager } from "../../managers/DataManager";
import { Logger } from "../../managers/logging/Logger";
import { LoggerFactory } from "../../managers/logging/LoggerFactory";
import { TraceLogger } from "../../managers/logging/TraceLogger";
import { MutationExecutor } from "../../managers/mutation/MutationExecutor";
import { QueryExecutionPlanRunner } from "../../managers/query/QueryExecutionPlanRunner";
import { QueryExecutor } from "../../managers/query/QueryExecutor";
import { QueryManager } from "../../managers/query/QueryManager";
import { RulesetManager } from "../../managers/RulesetManager";
import { SchemaManager } from "../../managers/SchemaManager";
import { ResolvedRecordGraphBuilder } from "../../managers/traversal/ResolvedRecordGraphBuilder";
import { TraversalExecutor } from "../../managers/traversal/TraversalExecutor";
import { TraversalPlanBuilder } from "../../managers/traversal/TraversalPlanBuilder";
import { TraversalPlanner } from "../../managers/traversal/TraversalPlanner";
import { TraversalRequestBuilder } from "../../managers/traversal/TraversalRequestBuilder";

export interface EngineServices {
	loggerFactory: LoggerFactory;
	engineLog: Logger;

	cacheManager: CacheManager;
	rulesetManager: RulesetManager;
	schemaManager: SchemaManager;
	dataManager: DataManager;
	contextFactory: ContextFactory;

	traceLogger: TraceLogger;

	traversalPlanner: TraversalPlanner;
	traversalExecutor: TraversalExecutor;
	traversalPlanBuilder: TraversalPlanBuilder;
	traversalRequestBuilder: TraversalRequestBuilder;

	resolvedRecordGraphBuilder: ResolvedRecordGraphBuilder;

	queryExecutionPlanRunner: QueryExecutionPlanRunner;
	queryExecutor: QueryExecutor;
	queryManager: QueryManager;

	mutationExecutor: MutationExecutor;
}