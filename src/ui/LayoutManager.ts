import { GoldenLayout, LayoutConfig } from "golden-layout";
import { ToolRegistry } from "./ToolRegistry";
import { ToolComponentState } from "../types/ui";
import { TraceLogger } from "../managers/logging/TraceLogger";

export class LayoutManager {

	constructor(private toolRegistry: ToolRegistry, private trace: TraceLogger) {}

	private layout?: GoldenLayout;

	private isToolState(
		value: unknown
	): value is ToolComponentState {

		return (
			typeof value === "object" &&
			value !== null &&
			"toolId" in value
		);
	}

	initialize(
		container: HTMLElement
	): void {

		this.trace.debug("LayoutManager.initialize", "initialized called");

		if (this.layout) {
			return;
		}

		this.layout =
			new GoldenLayout(
				container
			);

		this.layout.registerComponentFactoryFunction(
			"tool",
			(container, state) => {

				this.trace.debug("LayoutManager.initialize", "Factory Called", { container, state });

				if (!this.isToolState(state)) {
					return;
				}

				const tool =
					this.toolRegistry.get(
						state.toolId
					);

				if (!tool) {
					return;
				}

				tool.create(
					container.element
				);
			}
		);

		const config: LayoutConfig = {
			root: {
				type: "row",
				content: [
					{
						type: "component",
						componentType: "tool",
						componentState: {
							toolId: "test"
						},
						title: "Test Runner"
					}
				]
			}
		};

		this.layout.loadLayout(
			config
		);

		this.layout.resizeWithContainerAutomatically =
			true;
	}

	get instance(): GoldenLayout | undefined {
		return this.layout;
	}

	destroy(): void {

		this.layout?.destroy();

		this.layout = undefined;
	}
}
