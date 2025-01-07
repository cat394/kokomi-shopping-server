import type { Context } from "koa";
import { Middleware } from "@koa/router";
import { AuthError } from "../errors/index.js";
import { auth_service, type AuthUserInfo } from "../service/index.js";
import { logger } from "../logger.js";

export type AuthState = {
	user: AuthUserInfo;
};

export function get_bearer_token(headers: Context["headers"]): string {
	const authorization_header = headers["authorization"];

	if (!authorization_header) {
		throw new AuthError("NO_AUTHORIZATION_TOKEN");
	}

	const bearer_token = authorization_header.split("Bearer ")[1];

	if (!bearer_token) {
		throw new AuthError("NO_BEARER_TOKEN");
	}

	return bearer_token;
}

export const auth_user: Middleware = async (ctx, next) => {
	try {
		const bearer_token = get_bearer_token(ctx.headers);

		const user = await auth_service.get_user_info(bearer_token);

		logger.auth.info(
			`Authentication successful for user: ${user.uid} from IP: ${ctx.ip}`
		);

		ctx.state.user = user;

		await next();
	} catch (err) {
		if (err instanceof Error) {
			logger.auth.error(
				`Authentication failed: ${err.message} - IP: ${ctx.ip}`
			);
		}

		throw err;
	}
};
