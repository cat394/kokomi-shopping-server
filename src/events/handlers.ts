import App, { Context } from "koa";
import fs from "fs/promises";
import { Events } from "./types.js";
import { product_image_service } from "../service/storage.js";
import { logger } from "../logger.js";

export function listen_events(app: App) {
	app.on("error", (ctx: Context, { err }: Events["error"]) => {
		logger.error.error("Error occured!", err.message);
	});

	app.on(
		"upload-completed",
		async (ctx: Context, details: Events["upload-completed"]) => {
			if ("file_path" in details) {
				await fs.unlink(details.file_path);
			} else {
				const promises = [];

				for (const file_path of details.file_paths) {
					promises.push(fs.unlink(file_path));
				}

				await Promise.all(promises);
			}
		}
	);

	app.on(
		"deleted-product",
		async (ctx: Context, { product_id }: Events["deleted-product"]) => {
			await product_image_service.delete(product_id);
		}
	);
}
