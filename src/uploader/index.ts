import { Middleware } from "koa";
import multer from "@koa/multer";
import path from "path";
import _ from "lodash";
import { FileError } from "../errors/index.js";
import { MAX_NUMBER_OF_PRODUCT_IMAGES, ROOT_DIRECTORY } from "../const.js";
import { logger } from "../logger.js";

export const uploaded_temp_folder = path.resolve(ROOT_DIRECTORY, "temp");

const storage = multer.diskStorage({
	destination(req, file, callback) {
		callback(null, uploaded_temp_folder);
	},
	filename(req, file, callback) {
		const filename = `${_.random(1, 10000)}-${file.originalname}`;
		callback(null, filename);
	},
});

const upload_image = multer({
	storage,
	fileFilter(req, file, callback) {
		if (["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
			callback(null, true);
		} else {
			logger.system.warn({
				message: "File rejected due to invalid format",
				file,
			});

			callback(new FileError("INVALID_FORMAT"), false);
		}
	},
	limits: { fileSize: 500 * 1024 }, // 500KB
});

export const uplaod_thumb_image: Middleware = async (ctx, next) => {
	try {
		logger.system.info("Uploading thumbnail...");

		await upload_image.single("thumbnail")(ctx, next);

		logger.system.info("Upload thumbnail completed!");
	} catch {
		throw new FileError("UPLOAD_FAILED");
	}
};

export const upload_product_images: Middleware = async (ctx, next) => {
	try {
		logger.system.info("Uploading product images...");

		await upload_image.array("images", MAX_NUMBER_OF_PRODUCT_IMAGES)(ctx, next);

		logger.system.info("Upload product images completed!");
	} catch {
		throw new FileError("UPLOAD_FAILED");
	}
};
