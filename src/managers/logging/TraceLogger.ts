import { Logger } from "./Logger";

export class TraceLogger {

    constructor(private logger: Logger) {}

    debug(scope: string, message: string, data?: any) {
        this.logger.log({
            level: "debug",
            scope,
            message,
            data
        });
    }

    info(scope: string, message: string, data?: any) {
        this.logger.log({
            level: "info",
            scope,
            message,
            data
        });
    }

    warn(scope: string, message: string, data?: any) {
        this.logger.log({
            level: "warn",
            scope,
            message,
            data
        });
    }

    error(scope: string, message: string, data?: any) {
        this.logger.log({
            level: "error",
            scope,
            message,
            data
        });
    }
}