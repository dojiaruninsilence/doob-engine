import { EngineTestRunner } from "../../tests/EngineTestRunner";
import { ITool } from "./ITool";

export class TestRunnerTool
	implements ITool {

	id = "test-runner";

	title = "Test Runner";

	constructor(
		private testRunner: EngineTestRunner
	) {}

	create(
		container: HTMLElement
	): void {

		container.empty();

		const button =
			container.createEl(
				"button"
			);

		button.textContent =
			"Run Tests";

		button.onclick =
			async () => {

				await this.testRunner.runAll();
			};
	}
}