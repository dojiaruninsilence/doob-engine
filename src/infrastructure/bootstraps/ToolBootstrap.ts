import { ToolRegistry } from "../../ui/ToolRegistry";
import { TestTool } from "../../ui/tools/TestTool";
import { EngineServices } from "../../types";
import { TraceLogger } from "../../managers/logging/TraceLogger";

export class ToolBootstrap {

	static build(
		// services: EngineServices
        trace: TraceLogger
	): ToolRegistry {

		const registry =
			new ToolRegistry();

		registry.register(
			new TestTool(
				// services
                trace
			)
		);

		return registry;
	}
}