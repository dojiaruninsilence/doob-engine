import { App, TFile, normalizePath } from "obsidian";
import { Logger } from "./Logger";

import {
	LoggerConfig,
	LoggerFactoryConfig,
	LogWriteMode,
	LogEntry
} from "../../types/LoggerTypes";

type LogStrategy = (entries: LogEntry[]) => Promise<void>;

export class LoggerFactory {

	constructor(
		private app: App,
		private config: LoggerFactoryConfig
	) {}

	async create(config: LoggerConfig): Promise<Logger> {

		const fullPath = this.resolvePath(config.filePath);
		await this.ensureFoldersExist(fullPath);

		const mode = config.mode ?? "append";

		// --------------------------------------------------
		// APPEND MODE = immediate writes
		// --------------------------------------------------
		if (mode === "append") {

			const strategy: LogStrategy = async (entries) => {
				await this.writeAppend(fullPath, entries);
			};

			return new Logger(config, strategy);
		}

		// --------------------------------------------------
		// REPLACE MODE = buffered writes (WRITE ON FLUSH ONLY)
		// --------------------------------------------------
		const buffer: LogEntry[] = [];

		const strategy: LogStrategy = async (entries) => {
			buffer.push(...entries);
		};

		const flush = async () => {
			await this.writeReplace(fullPath, buffer);
			buffer.length = 0;
		};

		return new Logger(config, strategy, flush);
	}

	// ==================================================
	// WRITE STRATEGIES
	// ==================================================

	private async writeAppend(filePath: string, entries: LogEntry[]) {

		if (entries.length === 0) return;

		const content =
			entries.map(e => JSON.stringify(e)).join("\n") + "\n";

		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.append(file, content);
		} else {
			await this.app.vault.create(filePath, content);
		}
	}

	private async writeReplace(filePath: string, entries: LogEntry[]) {

		if (entries.length === 0) return;

		const content =
			entries.map(e => JSON.stringify(e)).join("\n") + "\n";

		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
		} else {
			await this.app.vault.create(filePath, content);
		}
	}

	// ==================================================
	// PATH HANDLING
	// ==================================================

	private resolvePath(filePath: string): string {
		return normalizePath(
			`${this.config.rootFolder}/${filePath}`
		);
	}

	private async ensureFoldersExist(fullPath: string): Promise<void> {

		const parts = fullPath.split("/");
		parts.pop(); // remove filename

		let current = "";

		for (const part of parts) {

			current = current
				? `${current}/${part}`
				: part;

			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}