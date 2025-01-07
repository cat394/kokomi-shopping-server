import type { Response } from "supertest";
import {
	mock_buyer,
	mock_buyer_order,
	mock_seller,
	mock_seller_order,
} from "../mocks.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { setup_orders } from "./setup.js";

describe("GET /users/:buyer_id/orders/:order_id", () => {
	setup_orders();

	function assert_success_retrieving_buyer_order(res: Response) {
		new TestUsersRouteResponse(res).orders.buyer.retrieved_order(
			mock_buyer_order
		);
	}

	test("admin should retrieve order", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/orders/${mock_buyer_order.id}`
		);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_buyer_order(res);
	});

	test("moderator should retrieve orders", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/orders/${mock_buyer_order.id}`
		);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer_order(res);
	});

	test("buyer should retrieve their own order", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/orders/${mock_buyer_order.id}`
		);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_buyer_order(res);
	});

	test("buyer should return permission error, when retrieving other user's order", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_seller.id}/orders/${mock_seller_order.id}`
		);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when retrieving user's orders", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/orders/${mock_buyer_order.id}`
		);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
