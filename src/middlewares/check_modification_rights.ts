import type { Middleware } from "@koa/router";
import type { AuthState } from "./auth_user.js";
import { PermissionError } from "../errors/index.js";

export const check_modification_rights: Middleware<AuthState> = async (
	ctx,
	next
) => {
	if (ctx.method !== "GET" && ctx.state.user.access_rights === "moderator") {
		throw new PermissionError("PERMISSION_DENIED");
	}

	await next();
};
