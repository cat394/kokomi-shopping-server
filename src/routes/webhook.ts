import Router from "@koa/router";
import { db, payment_service, PaymentService } from "../service/index.js";
import { PaymentError } from "../errors/index.js";

const router = new Router();

router.post("/webhook", async (ctx) => {
	const signature = PaymentService.get_signature(ctx.request.headers);

	const event = payment_service.construct_event(ctx.request.rawBody, signature);

	switch (event.type) {
		case "checkout_completed":
			await Promise.all([
				payment_service.complete_the_payment(event.session),
				db.users.cart(event.session.order_detail.buyer_id).reset(),
			]);
			break;

		default:
			throw new PaymentError("UNHANDLED_EVENT", event.type);
	}

	ctx.body = { success: true };
});

export default router;
