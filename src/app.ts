import App from "koa";
import { bodyParser } from "@koa/bodyparser";
import {
	payment_router,
	products_router,
	users_router,
	webhook_router,
	health_router,
	privileged_router,
} from "./routes/index.js";
import { handle_error } from "./errors/handlers/index.js";
import { listen_events } from "./events/handlers.js";
import { log_req_and_res } from "./middlewares/log.js";

export function create_app(): App {
	const app = new App();

	app.use(handle_error);
	app.use(bodyParser());
	app.use(log_req_and_res);
	app.use(health_router.routes());
	app.use(health_router.allowedMethods());
	app.use(users_router.routes());
	app.use(users_router.allowedMethods());
	app.use(products_router.routes());
	app.use(products_router.allowedMethods());
	app.use(payment_router.routes());
	app.use(payment_router.allowedMethods());
	app.use(webhook_router.routes());
	app.use(webhook_router.allowedMethods());
	app.use(privileged_router.routes());
	app.use(privileged_router.allowedMethods());

	listen_events(app);

	return app;
}
