import type { Middleware } from "@koa/router";
import type { AuthState } from "./auth_user.js";
import { PermissionError } from "../errors/index.js";
import { has_priviledged_rights } from "../utils/access_rights.js";

export const check_own_user_id: Middleware<AuthState> = async (ctx, next) => {
	if (!has_priviledged_rights(ctx.state.user)) {
		const user_id = ctx.params.user_id!;

		const request_user_id = ctx.state.user.uid;

		if (user_id !== request_user_id) {
			throw new PermissionError("PERMISSION_DENIED");
		}
	}

	await next();
};
