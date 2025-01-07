import type { Response } from "supertest";
import { setup_orders } from "./setup.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { mock_buyer, mock_buyer_order, mock_seller } from "../mocks.js";

describe("GET /users/:buyer_id/orders", () => {
	setup_orders();

	function assert_success_retrieving_buyer_orders(res: Response) {
		new TestUsersRouteResponse(res).orders.buyer.retrieved_orders([
			mock_buyer_order,
		]);
	}

	test("admin should retrieve orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/orders`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_buyer_orders(res);
	});

	test("moderator should retrieve orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/orders`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer_orders(res);
	});

	test("buyer should retrieve their own orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/orders`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_buyer_orders(res);
	});

	test("buyer should return permission error when retrieving other orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}/orders`);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when retrieving user's orders", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/orders`);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
