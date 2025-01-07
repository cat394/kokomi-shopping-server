import { clean_temp_image_task } from "./clean_image.js";
import { restore_unpaid_orders } from "./restore_payment.js";

export function start_cron_tasks() {
	clean_temp_image_task.start();
	restore_unpaid_orders.start();
}

export function stop_cron_tasks() {
	clean_temp_image_task.stop();
	restore_unpaid_orders.stop();
}
