import type { Middleware } from "@koa/router";
import type { AuthState } from "./auth_user.js";
import { PermissionError } from "../errors/index.js";
import { db } from "../service/index.js";

export const check_product_owner: Middleware<AuthState> = async (ctx, next) => {
	const product_id = ctx.params.product_id!;

	const product = await db.products.get(product_id);

	if (!product) {
		throw new PermissionError("RESOURCE_OWNER_ERROR");
	}

	if (ctx.state.user.access_rights !== "admin") {
		const resource_owner = product.created_by;
		const request_user_id = ctx.state.user.uid;

		if (resource_owner !== request_user_id) {
			throw new PermissionError("RESOURCE_OWNER_ERROR");
		}
	}
	await next();
};
