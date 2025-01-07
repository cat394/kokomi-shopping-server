import type { Response } from "supertest";
import { TestUsersRouteResponse } from "../helpers.js";
import { setup_orders } from "./setup.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { mock_buyer, mock_seller, mock_seller_order } from "../mocks.js";

describe("GET /users/:seller_id/orders", () => {
	setup_orders();

	function assert_success_retrieving_seller_orders(res: Response) {
		new TestUsersRouteResponse(res).orders.seller.retrieved_orders([
			mock_seller_order,
		]);
	}

	test("admin should retrieve orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}/orders`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_seller_orders(res);
	});

	test("moderator should retrieve orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}/orders`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_seller_orders(res);
	});

	test("seller should retrieve their own orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}/orders`);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_seller_orders(res);
	});

	test("seller should return permission error when retrieving other orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/orders`);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when retrieving user's orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}/orders`);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
