import Router from "@koa/router";
import db from "../service/db.js";

const router = new Router();

router.get("/reviews", async (ctx) => {
	const reviews = await db.reviews.get_list(ctx.query);

	ctx.body = { success: true, data: reviews };
});

export default router;
