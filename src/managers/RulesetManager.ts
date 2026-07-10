import { App, normalizePath, TFolder } from "obsidian";
import { TraceLogger } from "./logging/TraceLogger";

export class RulesetManager {

	private app: App;

	constructor(app: App, private trace: TraceLogger) {
		this.app = app;
	}

	// --------------------------------------------------
	// PATHS
	// --------------------------------------------------

	getRulesetsRoot(): string {
		return normalizePath(
			"Doob Engine/Rulesets"
		);
	}

	getRulesetFolder(
		ruleset: string
	): string {

		return normalizePath(
			`${this.getRulesetsRoot()}/${ruleset}`
		);
	}

	getSchemaFolder(
		ruleset: string
	): string {

		return normalizePath(
			`${this.getRulesetFolder(
				ruleset
			)}/Schemas`
		);
	}

	getDataFolder(
		ruleset: string
	): string {

		return normalizePath(
			`${this.getRulesetFolder(
				ruleset
			)}/Data`
		);
	}

	async ensureRulesetExists(
		ruleset: string
	): Promise<void> {

		const root =
			this.getRulesetsRoot();

		if (
			!this.app.vault.getAbstractFileByPath(root)
		) {
			await this.app.vault.createFolder(root);
		}

		const rulesetFolder =
			this.getRulesetFolder(ruleset);

		if (
			!this.app.vault.getAbstractFileByPath(
				rulesetFolder
			)
		) {
			await this.app.vault.createFolder(
				rulesetFolder
			);
		}

		const schemaFolder =
			this.getSchemaFolder(ruleset);

		if (
			!this.app.vault.getAbstractFileByPath(
				schemaFolder
			)
		) {
			await this.app.vault.createFolder(
				schemaFolder
			);
		}
	}

	async listRulesets(): Promise<string[]> {

		const root =
			this.app.vault.getAbstractFileByPath(
				this.getRulesetsRoot()
			);

		if (!(root instanceof TFolder)) {
			return [];
		}

		return root.children
			.filter(
				child => child instanceof TFolder
			)
			.map(
				child => child.name
			);
	}
}