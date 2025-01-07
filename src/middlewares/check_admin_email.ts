import dotenv from "dotenv";
import type { Middleware } from "koa";
import type { AuthState } from "./auth_user.js";
import { PermissionError } from "../errors/index.js";
import { is_production } from "../utils/check_env.js";
import { TEST_FIRST_USER_EMAIL } from "../../tests/const.js";

dotenv.config();

export const check_is_admin: Middleware<AuthState> = async (ctx, next) => {
	const { email, access_rights } = ctx.state.user;

	const first_user_email = is_production
		? process.env.FIRST_USER_EMAIL
		: TEST_FIRST_USER_EMAIL;

	if (!email || email !== first_user_email || access_rights !== "admin") {
		throw new PermissionError("PERMISSION_DENIED");
	}

	await next();
};
