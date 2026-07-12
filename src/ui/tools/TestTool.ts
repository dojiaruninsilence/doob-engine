import { TraceLogger } from "../../managers/logging/TraceLogger";
import { ITool } from "./ITool";
// import { EngineServices } from "../../types";

export class TestTool implements ITool {

	id = "test";

	title = "Test Tool";

	constructor(
		// private services: EngineServices
        private trace: TraceLogger
	) {}

	create(
		container: HTMLElement
	): void {

		container.empty();

		const title =
			container.createEl("h2");

		title.textContent =
			"Test Tool";

		const button =
			container.createEl(
				"button"
			);

		button.textContent =
			"Run Test";

        this.trace.debug("TestTool.create", "Test Tool Created");
	}
}