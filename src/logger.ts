import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

class Logger {
  private is_test_env = process.env.NODE_ENV === "test";

  request = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: this.get_transports("../logs/request-%DATE%.log"),
  });

  response = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
      })
    ),
    transports: this.get_transports("../logs/response-%DATE%.log"),
  });

  error = createLogger({
    level: "error",
    format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.json()),
    transports: this.get_transports("../logs/error-%DATE%.log"),
  });

  system = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: [new transports.Console()],
  });

	auth = createLogger({
		level: "info",
		format: format.combine(
			format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
			format.printf(({ timestamp, level, message }) => {
				return `[${timestamp}] ${level}: ${message}`;
			})
		),
		transports: this.get_transports("../logs/auth-%DATE%.log"),
	});

  private get_transports(filename: string) {
    const common_transports: (
      | transports.ConsoleTransportInstance
      | DailyRotateFile
    )[] = [new transports.Console()];

    if (!this.is_test_env) {
      common_transports.push(
        new DailyRotateFile({
          filename: path.resolve(__dirname, filename),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",
        })
      );
    }

    return common_transports;
  }
}

export const logger = new Logger();
