import Router from "@koa/router";
import {
	type AuthState,
	auth_user,
	check_modification_rights,
	check_own_user_id,
	check_user_role,
} from "../middlewares/index.js";
import type { UserDocument } from "../validator/schema.js";
import { ResourceNotFoundError, ValidationError } from "../errors/index.js";
import {
	DataModifier,
	convert_timestamp_to_isostring,
	has_priviledged_rights,
} from "../utils/index.js";
import { auth_service, db } from "../service/index.js";
import validator from "../validator/index.js";

const router = new Router<AuthState>({ prefix: "/users" });

const public_router = new Router();

const private_router = new Router<AuthState>();

public_router
	.get("/:user_id/reviews", async (ctx) => {
		const user_id = ctx.params.user_id!;

		const reviews = await db.users.reviews(user_id).get_list(ctx.query);

		ctx.body = { success: true, data: reviews };
	})
	.get("/:user_id/reviews/:review_id", async (ctx) => {
		const user_id = ctx.params.user_id!;

		const review_id = ctx.params.review_id!;

		const review = await db.users.reviews(user_id).get(review_id);

		ctx.body = { success: true, data: review };
	});

private_router
	.use(auth_user, check_modification_rights)
	.get("/:user_id", async (ctx) => {
		const user_id = ctx.params.user_id!;

		let user = await db.users.get(user_id);

		if (
			user_id !== ctx.state.user.uid &&
			!has_priviledged_rights(ctx.state.user) &&
			user?.role &&
			user.role !== "seller"
		) {
			user = null;
		}

		ctx.body = { success: true, data: user };
	})
	.post("/", async (ctx) => {
		const user = validator.user.validate(ctx.request.body);

		const user_id = ctx.state.user.uid;

		const new_user: UserDocument = new DataModifier(user)
			.merge_id(user_id)
			.merge_timestamp()
			.result();

		const user_ref = db.users.doc(new_user.id);

		const batch = db.batch();

		batch.set(user_ref, new_user, { merge: true });

		await Promise.all([
			batch.commit(),
			auth_service.set_role(user_id, user.role),
		]);

		ctx.body = { success: true, data: new_user };
	})
	.patch("/:user_id", check_own_user_id, async (ctx) => {
		const updated = validator.user.partial_validate(ctx.request.body);

		const user_id = ctx.params.user_id!;

		await db.users.update(user_id, updated);

		ctx.body = { success: true };
	})
	.delete("/:user_id", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		await db.users.delete(user_id);

		await db.users.cart(user_id).reset();

		ctx.body = { success: true };
	})
	.get("/:user_id/orders", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		const role = await db.users.get_role(user_id);

		const orders = await db.orders[role](user_id).get_list(ctx.query);

		ctx.body = { success: true, data: orders };
	})
	.get("/:user_id/orders/:order_id", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		const order_id = ctx.params.order_id!;

		const role = await db.users.get_role(user_id);

		const order = await db.orders[role](user_id).get(order_id);

		ctx.body = { success: true, data: order };
	})
	.patch(
		"/:user_id/orders/:order_id",
		check_own_user_id,
		check_user_role("seller"),
		async (ctx) => {
			const { status } = validator.order_status.validate(ctx.request.body);

			const user_role = ctx.state.user.role;

			if (user_role === "buyer" && status === "shipped") {
				throw new ValidationError("BODY_VALIDATION_ERROR", {
					additional_message:
						"Buyers cannot mark the order history as 'shipped'.",
				});
			} else if (user_role === "seller" && status === "delivered") {
				throw new ValidationError("BODY_VALIDATION_ERROR", {
					additional_message:
						"Sellers cannot mark the order history as 'delivered'.",
				});
			}

			const user_id = ctx.params.user_id!;

			const order_id = ctx.params.order_id!;

			const seller_order = await db.orders.seller(user_id).get(order_id);

			if (!seller_order) {
				throw new ResourceNotFoundError("USER_DATA_NOT_FOUND", {
					additional_message: `seller ${user_id} order not found.`,
				});
			}

			const batch = db.batch();

			const updated = new DataModifier({ status }).merge_updated_at().result();

			db.orders.seller(user_id).update(order_id, updated, { batch });

			db.orders
				.buyer(seller_order.buyer_id)
				.update(order_id, updated, { batch });

			await batch.commit();

			ctx.body = { success: true };
		}
	)
	.use(check_user_role("buyer"))
	.get("/:user_id/cart", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		const populated_cart = await db.users
			.cart(user_id)
			.get_list_populated_product(ctx.query);

		ctx.body = { success: true, data: populated_cart };
	})
	.patch("/:user_id/cart/add", check_own_user_id, async (ctx) => {
		const updated = validator.cart_updated.validate(ctx.request.body);

		const user_id = ctx.params.user_id!;

		await db.users.cart(user_id).add(updated);

		ctx.body = { success: true };
	})
	.patch("/:user_id/cart/subtract", check_own_user_id, async (ctx) => {
		const updated = validator.cart_updated.validate(ctx.request.body);

		const user_id = ctx.params.user_id!;

		await db.users.cart(user_id).reduce(updated);

		ctx.body = { success: true };
	})
	.delete("/:user_id/cart", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		await db.users.cart(user_id).reset();

		ctx.body = { success: true };
	})
	.post("/:user_id/reviews", check_own_user_id, async (ctx) => {
		const review = validator.review.validate(ctx.request.body);

		const product = await db.products.get(review.product_id);

		if (!product) {
			throw new ResourceNotFoundError("PRODUCT_NOT_FOUND");
		}

		const user_id = ctx.params.user_id!;

		const new_review = new DataModifier(review)
			.merge_id(review.product_id)
			.merge_timestamp()
			.merge_props({ created_by: user_id })
			.result();

		await db.users.reviews(user_id).create(new_review);

		ctx.body = {
			suuccess: true,
			data: convert_timestamp_to_isostring(new_review),
		};
	})
	.patch("/:user_id/reviews/:review_id", check_own_user_id, async (ctx) => {
		const request_review = validator.review.partial_validate(ctx.request.body);

		const user_id = ctx.params.user_id!;

		const review_id = ctx.params.review_id!;

		const updated_review = new DataModifier(request_review)
			.delete_undefined_props()
			.merge_updated_at()
			.result();

		await db.users.reviews(user_id).update(review_id, updated_review);

		ctx.body = { success: true };
	})
	.delete("/:user_id/reviews/:review_id", check_own_user_id, async (ctx) => {
		const user_id = ctx.params.user_id!;

		const review_id = ctx.params.review_id!;

		await db.users.reviews(user_id).delete(review_id);

		ctx.body = { success: true };
	});

router.use(public_router.routes());
router.use(public_router.allowedMethods());
router.use(private_router.routes());
router.use(private_router.allowedMethods());

export default router;
