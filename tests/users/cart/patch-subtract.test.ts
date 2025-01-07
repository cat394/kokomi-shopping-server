import type { Response } from "supertest";
import { CartUpdated } from "../../../src/validator/schema.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { setup_cart_and_products } from "./setup.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import {
	mock_buyer,
	mock_cart_product_1,
	mock_cart_product_2,
	mock_other_uid,
} from "../mocks.js";

describe("PATCH /users/:user_id/cart/subtract", () => {
	setup_cart_and_products();

	const reduced: CartUpdated = {
		product_id: mock_cart_product_1.id,
		quantity: 1,
	};

	const subtractd: CartUpdated = {
		product_id: mock_cart_product_2.id,
		quantity: 1000,
	};

	async function assert_reduce_product_from_buyer_cart(res: Response) {
		await new TestUsersRouteResponse(res).cart.updated_cart(
			mock_buyer.id,
			reduced.product_id,
			{
				quantity: 2,
			}
		);
	}

	async function assert_subtract_product_from_buyer_cart(res: Response) {
		await new TestUsersRouteResponse(res).cart.deleted_cart_item(
			mock_buyer.id,
			subtractd.product_id
		);
	}

	test("should reduce product item", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/cart/subtract`
		);

		const res = await req.login("ADMIN").send(reduced);

		await assert_reduce_product_from_buyer_cart(res);
	});

	test("should subtract product from cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/cart/subtract`
		);

		const res = await req.login("ADMIN").send(subtractd);

		await assert_subtract_product_from_buyer_cart(res);
	});

	test("moderator should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/cart/subtract`
		);

		const res = await req.login("MODERATOR").send(reduced);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should reduce product from their own cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/cart/subtract`
		);

		const res = await req.login("BUYER").send(reduced);

		await assert_reduce_product_from_buyer_cart(res);
	});

	test("buyer should return permission error when reducing product from their own cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/cart/subtract`
		);

		const res = await req.login("BUYER").send(reduced);

		await assert_reduce_product_from_buyer_cart(res);
	});

	test("buyer should return permission error when reducing product from other user's cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_other_uid}/cart/subtract`
		);

		const res = await req.login("BUYER").send(reduced);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_other_uid}/cart/subtract`
		);

		const res = await req.login("SELLER").send(reduced);

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_other_uid}/cart/subtract`
		);

		const res = await req.login("UNREGISTERED").send(reduced);

		new TestErrorResponse(res).permission_error();
	});
});
