import cron from "node-cron";
import db from "../service/db.js";
import { logger } from "../logger.js";

const every_24_hours = "0 0 * * *";

export const restore_unpaid_orders = cron.schedule(every_24_hours, async () => {
	try {
		await db.orders.restore_unpaid_orders();
	} catch (err) {
		logger.system.error({
			message: "Error cleaning up unpaid payments:",
			error: err,
		});
	}
});
