import ratelimit from "koa-ratelimit";
import cors from "@koa/cors";
import { Redis } from "ioredis";
import { start_cron_tasks, stop_cron_tasks } from "./cron/index.js";
import { create_app } from "./app.js";
import { logger } from "./logger.js";

if (
	!process.env.REDIS_HOST ||
	!process.env.REDIS_PORT ||
	!process.env.REDIS_USERNAME ||
	!process.env.REDIS_PASSWORD
) {
	throw new Error("Missing required Redis environment variables!");
}

const app = create_app();

const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: Number(process.env.REDIS_PORT) as number,
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	tls: {},
});

app.use(
	ratelimit({
		driver: "redis",
		db: redis,
		duration: 60000,
		errorMessage: "Too many requests!",
		id: (ctx) => ctx.ip,
		headers: {
			remaining: "Rate-Limit-Remaining",
			reset: "Rate-Limit-Reset",
			total: "Rate-Limit-Total",
		},
		max: 100,
		disableHeader: false,
	})
);

app.use(
	cors({
		origin: "https://kokomi-shopping-app.netlify.app",
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "stripe-signature"],
		credentials: true,
	})
);

app.listen(3000);

start_cron_tasks();

process.on("SIGTERM", async () => {
	logger.system.info("Shutting down gracefully...");

	await redis.quit();

	stop_cron_tasks();

	process.exit(0);
});
