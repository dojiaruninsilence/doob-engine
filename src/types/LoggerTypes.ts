export type LogWriteMode =
	| "append"
	| "replace";

export type LogLevel =
	| "trace"
	| "debug"
	| "info"
	| "warn"
	| "error"
	| "fatal";

export interface LoggerConfig {
	filePath: string;

	mode?: LogWriteMode;

	defaultLevel?: LogLevel;
	defaultScope?: string;
	defaultMessage?: string;

	includeTimestamp?: boolean;
}

export interface LogEntry {
	timestamp?: string;

	level: LogLevel;

	scope: string;

	message: string;

	data?: unknown;
}

export interface LogOptions {
	level?: LogLevel;

	scope?: string;

	message?: string;

	data?: unknown;
}

export interface ILogger {
	log(options?: LogOptions): void;

	flush(): Promise<void>;
}

export interface LoggerFactoryConfig {
	rootFolder: string;
}