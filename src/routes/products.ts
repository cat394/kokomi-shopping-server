import Router from "@koa/router";
import {
	type AuthState,
	auth_user,
	check_modification_rights,
	check_product_owner,
	check_user_role,
} from "../middlewares/index.js";
import {
	DataModifier,
	convert_timestamp_to_isostring,
} from "../utils/index.js";
import { check_resource_owner } from "../middlewares/index.js";
import { db, product_image_service } from "../service/index.js";
import {
	uplaod_thumb_image,
	upload_product_images,
} from "../uploader/index.js";
import { FileError } from "../errors/index.js";
import validator from "../validator/index.js";
import { emit_event } from "../events/index.js";

const router = new Router({ prefix: "/products" });

const public_router = new Router();

const private_router = new Router<AuthState>();

public_router
	.get("/", async (ctx) => {
		const products = await db.products.get_list(ctx.query);

		ctx.body = { success: true, data: products };
	})
	.get("/:product_id", async (ctx) => {
		const product_id = ctx.params.product_id!;

		const product = await db.products.get(product_id);

		ctx.body = { success: true, data: product };
	});

private_router
	.use(auth_user, check_modification_rights, check_user_role("seller"))
	.post("/upload-thumb", uplaod_thumb_image, async (ctx) => {
		if (!ctx.file) {
			throw new FileError("FILE_NOT_EXIST");
		}

		const file_path = ctx.file.path;

		const result = await product_image_service.upload_temp(file_path);

		ctx.body = {
			success: true,
			data: result,
		};

		emit_event("upload-completed", ctx, { file_path });
	})
	.post("/upload-main", upload_product_images, async (ctx) => {
		if (!ctx.files || !Array.isArray(ctx.files)) {
			throw new FileError("FILE_NOT_EXIST");
		}

		const file_paths = ctx.files.map(file => file.path);

		const upload_product_images = file_paths.map((file_path) =>
			product_image_service.upload_temp(file_path)
		);

		const result = await Promise.all(upload_product_images);

		ctx.body = {
			success: true,
			data: result,
		};

		emit_event("upload-completed", ctx, { file_paths });
	})
	.post("/", check_resource_owner, async (ctx) => {
		const request_product = validator.product.validate(ctx.request.body);

		let new_product = new DataModifier(request_product)
			.merge_id()
			.merge_timestamp()
			.result();

		new_product = await product_image_service.upload(new_product);

		await db.products.create(new_product);

		ctx.body = {
			success: true,
			data: convert_timestamp_to_isostring(new_product),
		};
	})
	.patch("/:product_id", check_product_owner, async (ctx) => {
		const updated = validator.product.partial_validate(ctx.request.body);

		const product_id = ctx.params.product_id!;

		const updated_product = new DataModifier(updated)
			.delete_undefined_props()
			.merge_updated_at()
			.result();

		await db.products.update(product_id, updated_product);

		ctx.response.body = { success: true };
	})
	.delete("/:product_id", check_product_owner, async (ctx) => {
		const product_id = ctx.params.product_id!;

		await db.products.delete(product_id);

		ctx.body = { success: true };

		emit_event("deleted-product", ctx, { product_id });
	});

router.use(public_router.routes());
router.use(public_router.allowedMethods());
router.use(private_router.routes());
router.use(private_router.allowedMethods());

export default router;
