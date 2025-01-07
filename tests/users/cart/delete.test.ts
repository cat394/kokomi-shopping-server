import type { Response } from "supertest";
import { TestUsersRouteResponse } from "../helpers.js";
import { setup_cart_and_products } from "./setup.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { mock_buyer, mock_other_uid } from "../mocks.js";

describe("DELETE /users/:user_id/cart", () => {
	setup_cart_and_products();

	async function assert_success_reset_cart(res: Response) {
		await new TestUsersRouteResponse(res).cart.reset_cart(mock_buyer.id);
	}

	test("should reduce product from cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("ADMIN").send();

		await assert_success_reset_cart(res);
	});

	test("moderator should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("MODERATOR").send();

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should reset cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("BUYER").send();

		await assert_success_reset_cart(res);
	});

	test("buyer should return permission error when reducing product from their own cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("BUYER").send();

		await assert_success_reset_cart(res);
	});

	test("buyer should return permission error when reducing product from other user's cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_other_uid}/cart`);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_other_uid}/cart`);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when reducing product from cart", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_other_uid}/cart`);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
