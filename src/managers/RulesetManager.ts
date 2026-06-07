import { App, normalizePath, TFolder } from "obsidian";

export class RulesetManager {

	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	getRulesetsRoot(): string {

		return normalizePath(
			"Doob Engine/Rulesets"
		);
	}

	getRulesetPath(
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
			`${this.getRulesetPath(ruleset)}/Schemas`
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

		const rulesetPath =
			this.getRulesetPath(ruleset);

		if (
			!this.app.vault.getAbstractFileByPath(
				rulesetPath
			)
		) {
			await this.app.vault.createFolder(
				rulesetPath
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