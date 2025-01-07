import type { Middleware } from "koa";
import type { AuthState } from "./auth_user.js";
import { PermissionError, ValidationError } from "../errors/index.js";
import { CreatedBySchema } from "../validator/schema.js";
import { has_top_access_rights } from "../utils/index.js";

export const check_resource_owner: Middleware<AuthState> = async (
	ctx,
	next
) => {
	if (!has_top_access_rights(ctx.state.user)) {
		const validation_result = CreatedBySchema.safeParse(ctx.request.body);

		if (!validation_result.success) {
			throw new ValidationError("BODY_VALIDATION_ERROR", {
				additional_message: "Body does not contains created_by field.",
			});
		}

		const resource_owner = validation_result.data.created_by;

		const request_user = ctx.state.user.uid;

		if (resource_owner !== request_user) {
			throw new PermissionError("RESOURCE_OWNER_ERROR");
		}
	}

	await next();
};
