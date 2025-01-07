import { Middleware } from "koa";
import { logger } from "../logger.js";

export const log_req_and_res: Middleware = async (ctx, next) => {
	let start = Date.now();

	logger.request.info(`Request: ${ctx.method} ${ctx.url}`);

	logger.request.debug(`Headers: ${JSON.stringify(ctx.headers)}`);

	logger.request.debug(`Query: ${JSON.stringify(ctx.query)}`);

	if (ctx.method !== "GET" && ctx.request.body) {
		logger.request.debug(`Body: ${JSON.stringify(ctx.request.body)}`);
	}

	try {
		await next();
	} finally {
		const response_time = Date.now() - start;

		logger.response.info(
			`Response: ${ctx.method} ${ctx.url} - ${ctx.status} ${
				ctx.length || 0
			} bytes - ${response_time}ms`
		);

		logger.response.info(`Response Body: ${JSON.stringify(ctx.body)}`);
	}
};
