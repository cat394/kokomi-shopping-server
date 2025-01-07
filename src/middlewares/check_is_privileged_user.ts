import type { Middleware } from "koa";
import type { AuthState } from "./auth_user.js";
import { PermissionError } from "../errors/index.js";
import { has_priviledged_rights as has_privileged_access_rights } from "../utils/index.js";

export const check_is_privileged_user: Middleware<AuthState> = async (
	ctx,
	next
) => {
	if (!has_privileged_access_rights(ctx.state.user)) {
		throw new PermissionError("ROLE_PERMISSION_DENIED");
	}

	await next();
};
