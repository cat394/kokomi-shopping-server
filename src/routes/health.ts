import Router from "@koa/router";

const router = new Router();

router.get("/health", async (ctx) => {
	ctx.status = 200;
	ctx.body = "OK";
});

export default router;
