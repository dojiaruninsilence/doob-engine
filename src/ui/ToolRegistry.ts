import { ITool } from "./tools/ITool";

export class ToolRegistry {

	private tools =
		new Map<string, ITool>();

	register(
		tool: ITool
	): void {

		this.tools.set(
			tool.id,
			tool
		);
	}

	get(
		id: string
	): ITool | undefined {

		return this.tools.get(id);
	}

	getAll(): ITool[] {

		return [
			...this.tools.values()
		];
	}
}