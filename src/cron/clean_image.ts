import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import { uploaded_temp_folder } from "../uploader/index.js";
import { logger } from "../logger.js";

const every_3_hours = "0 */3 * * *";

export const clean_temp_image_task = cron.schedule(every_3_hours, async () => {
	try {
		const now = Date.now();

		const files = await fs.readdir(uploaded_temp_folder);

		if (files.length === 0) {
			return;
		}

		for (const file of files) {
			const file_path = path.join(uploaded_temp_folder, file);

			const stats = await fs.stat(file_path);

			const file_age = now - stats.mtimeMs;

			const max_age = 86400000;

			if (file_age > max_age) {
				await fs.unlink(file_path);

				logger.system.info(`Remove image complete: ${file_path}`);
			}
		}
	} catch (err) {
		logger.system.error({
			message: "Error cleaning up unused images",
			error: err,
		});
	}
});
