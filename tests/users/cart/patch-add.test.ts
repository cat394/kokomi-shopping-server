import type { Response } from "supertest";
import type { CartUpdated } from "../../../src/validator/schema.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { setup_cart_and_products } from "./setup.js";
import { mock_buyer, mock_cart_product_1, mock_other_uid } from "../mocks.js";

describe("PATCH /users/:user_id/cart/add", () => {
	setup_cart_and_products();

	const updated: CartUpdated = {
		product_id: mock_cart_product_1.id,
		quantity: 2,
	};

	const new_cart_item: CartUpdated = {
		product_id: "new-cart-item",
		quantity: 5,
	};

	async function assert_success_updating_existing_product(res: Response) {
		await new TestUsersRouteResponse(res).cart.updated_cart(
			mock_buyer.id,
			updated.product_id,
			{
				quantity: 5,
			}
		);
	}

	async function assert_success_adding_new_product(res: Response) {
		await new TestUsersRouteResponse(res).cart.updated_cart(
			mock_buyer.id,
			new_cart_item.product_id,
			{
				quantity: new_cart_item.quantity,
			}
		);
	}

	test("should add new item to cart", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("ADMIN").send(new_cart_item);

		await assert_success_adding_new_product(res);
	});

	test("should increase product quantity", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("ADMIN").send(updated);

		await assert_success_updating_existing_product(res);
	});

	test("moderator should return permission error when updating cart", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("MODERATOR").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should update their own cart", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("BUYER").send(updated);

		await assert_success_updating_existing_product(res);
	});

	test("buyer should return validation error when updating other user's cart", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_other_uid}/cart/add`
		);

		const res = await req.login("BUYER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when updating cart", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("SELLER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when updating cart", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}/cart/add`);

		const res = await req.login("UNREGISTERED").send(updated);

		new TestErrorResponse(res).permission_error();
	});
});
