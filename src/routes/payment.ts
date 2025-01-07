import Router from "@koa/router";
import {
	AuthState,
	auth_user,
	check_modification_rights,
	check_user_role,
} from "../middlewares/index.js";
import { payment_service } from "../service/index.js";
import validator from "../validator/index.js";

const router = new Router<AuthState>();

router
	.use(auth_user, check_modification_rights, check_user_role("buyer"))
	.post("/payment", async (ctx) => {
		const payment_details = validator.payment.validate(ctx.request.body);

		const user_id = ctx.state.user.uid!;

		const session_url = await payment_service.create_session_url(
			user_id,
			payment_details
		);

		ctx.redirect(session_url);
	});

export default router;
