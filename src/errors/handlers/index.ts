import { type Middleware } from "koa";
import BaseError from "../base_error.js";
import { ErrorResponse } from "./types.js";
import { emit_event } from "../../events/emittor.js";
import { logger } from "../../logger.js";

export enum OtherErrorMessages {
	INTERNAL_SERVER_ERROR = "Internal server error.",
	UNKONWN_ERROR = "Unknown error occured.",
}

export const handle_error: Middleware = async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof BaseError) {
			ctx.status = err.status;

			if (err.status !== 500) {
				ctx.body = {
					error_type: err.error_type,
					message: err.message,
				} satisfies ErrorResponse;
			}
		} else if (err instanceof Error) {
			ctx.status = 500;

			ctx.body = {
				error_type: "UNKNOWN_ERROR",
				message: OtherErrorMessages.INTERNAL_SERVER_ERROR,
			} satisfies ErrorResponse;

			emit_event("error", ctx, { err });
		} else {
			ctx.status = 500;

			ctx.body = {
				error_type: "UNKNOWN_ERROR",
				message: OtherErrorMessages.UNKONWN_ERROR,
			} satisfies ErrorResponse;
		}

		logger.error.error("Unknown error occured!");
	}
};
