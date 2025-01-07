import Router from "@koa/router";
import { auth_user, AuthState } from "../middlewares/auth_user.js";
import db from "../service/db.js";
import { check_is_privileged_user } from "../middlewares/check_is_privileged_user.js";
import { DataModifier } from "../utils/data_modifier.js";
import validator from "../validator/index.js";
import { auth_service } from "../service/auth.js";
import { check_is_admin } from "../middlewares/check_admin_email.js";

const router = new Router<AuthState>({
	prefix: "/privileged",
});

router
	.use(auth_user)
	.get("/user-id", async (ctx) => {
		return { id: ctx.state.user.uid };
	})
	.use(check_is_privileged_user)
	.get("/users", async (ctx) => {
		const users = await db.privileged_users.get_list(ctx.query);

		ctx.body = { users };
	})
	.get("/users/:user_id", async (ctx) => {
		const user_id = ctx.params.user_id!;

		const user = await db.privileged_users.get(user_id);

		ctx.body = { user };
	})
	.use(check_is_admin)
	.post("/users", async (ctx) => {
		const privileged_user = validator.privileged_user.validate(
			ctx.request.body
		);

		const new_user = new DataModifier(privileged_user)
			.merge_timestamp()
			.result();

		await Promise.all([
			db.privileged_users.create(new_user),
			auth_service.set_access_rights(
				privileged_user.id,
				new_user.access_rights
			),
		]);

		ctx.body = { user: new_user };
	})
	.patch("/users/:user_id", async (ctx) => {
		const privileged_user = validator.privileged_user.partial_validate(
			ctx.request.body
		);

		const user_id = ctx.params.user_id!;

		const updated = new DataModifier(privileged_user)
			.delete_undefined_props()
			.merge_updated_at()
			.result();

		await db.privileged_users.update(user_id, updated);

		ctx.body = { user: updated, success: true };
	})
	.delete("/users/:user_id", async (ctx) => {
		const user_id = ctx.params.user_id!;

		await db.privileged_users.delete(user_id);

		ctx.body = { success: true };
	});

export default router;
