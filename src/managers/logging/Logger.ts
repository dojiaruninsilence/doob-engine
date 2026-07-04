import { ILogger, LoggerConfig, LogOptions, LogEntry } from "../../types/LoggerTypes";

type WriteHandler = (entries: LogEntry[]) => Promise<void>;
type FlushHandler = (() => Promise<void>) | null;

export class Logger implements ILogger {

	private entries: LogEntry[] = [];

	constructor(
		private config: LoggerConfig,
		private writeHandler: WriteHandler,
		private flushHandler: FlushHandler = null
	) {}

	// --------------------------------------------------
	// LOG
	// --------------------------------------------------

	log(options?: LogOptions): void {

		const entry: LogEntry = {
			timestamp:
				this.config.includeTimestamp !== false
					? new Date().toISOString()
					: undefined,

			level:
				options?.level ??
				this.config.defaultLevel ??
				"info",

			scope: this.resolveScope(options?.scope),

			message:
				options?.message ??
				this.config.defaultMessage ??
				"Log Entry",

			data:
				options?.data
		};

		// --------------------------------------------------
		// REPLACE MODE (buffered)
		// --------------------------------------------------

		if (this.flushHandler) {
			this.entries.push(entry);
			return;
		}

		// --------------------------------------------------
		// APPEND MODE (immediate)
		// --------------------------------------------------

		this.writeHandler([entry]);
	}

	// --------------------------------------------------
	// SCOPE RESOLUTION
	// --------------------------------------------------

	private resolveScope(scope?: string): string {

		const base = this.config.defaultScope ?? "General";

		if (!scope) return base;

		// if user passes absolute scope → use it
		// otherwise treat it as child scope
		if (scope.includes(".")) {
			return scope;
		}

		return `${base}.${scope}`;
	}

	// --------------------------------------------------
	// INSPECTION
	// --------------------------------------------------

	getEntries(): LogEntry[] {
		return structuredClone(this.entries);
	}

	clear(): void {
		this.entries = [];
	}

	serialize(): string {
		return this.entries
			.map(e => JSON.stringify(e))
			.join("\n");
	}

	// --------------------------------------------------
	// FLUSH
	// --------------------------------------------------

	async flush(): Promise<void> {

		if (!this.flushHandler) return;
		if (this.entries.length === 0) return;

		await this.writeHandler(
			structuredClone(this.entries)
		);

		await this.flushHandler();

		this.clear();
	}
}