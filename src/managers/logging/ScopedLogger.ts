import { Logger } from "./Logger";
import { LogOptions } from "../../types/LoggerTypes";

export class ScopedLogger {

	constructor(
		private logger: Logger,
		private scopePrefix: string
	) {}

	log(options?: LogOptions): void {

		this.logger.log({
			...options,
			scope: this.combineScope(options?.scope)
		});
	}

	trace(msg?: string, data?: any) {
		this.log({ level: "trace", message: msg, data });
	}

	debug(msg?: string, data?: any) {
		this.log({ level: "debug", message: msg, data });
	}

	info(msg?: string, data?: any) {
		this.log({ level: "info", message: msg, data });
	}

	warn(msg?: string, data?: any) {
		this.log({ level: "warn", message: msg, data });
	}

	error(msg?: string, data?: any) {
		this.log({ level: "error", message: msg, data });
	}

	fatal(msg?: string, data?: any) {
		this.log({ level: "fatal", message: msg, data });
	}

	scope(child: string): ScopedLogger {
		return new ScopedLogger(
			this.logger,
			`${this.scopePrefix}.${child}`
		);
	}

	private combineScope(optional?: string): string {
		if (!optional) return this.scopePrefix;
		return `${this.scopePrefix}.${optional}`;
	}
}