import type { Middleware } from "@koa/router";
import type { AuthState } from "./auth_user.js";
import type { AuthUserInfo } from "../service/index.js";
import { PermissionError } from "../errors/index.js";
import { has_priviledged_rights } from "../utils/index.js";
import { logger } from "../logger.js";

export const check_user_role = (
	role: AuthUserInfo["role"]
): Middleware<AuthState> => {
	return async (ctx, next) => {
		if (!has_priviledged_rights(ctx.state.user)) {
			logger.auth.warn("You are logged in as a user.");

			const user_role = ctx.state.user.role;

			if (!user_role || (user_role && user_role !== role)) {
				logger.auth.warn(
					"You do not have the user role or you do not have the required role privileges to access it."
				);

				throw new PermissionError("ROLE_PERMISSION_DENIED");
			}
		}

		await next();
	};
};
