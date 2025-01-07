import type { Response } from "supertest";
import { setup_orders } from "./setup.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer_order, mock_seller, mock_seller_order } from "../mocks.js";
import { TestUserIds } from "../../../src/service/auth.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe("PATCH /users/:user_id/orders/:order_id", () => {
	setup_orders();

	async function assert_success_updating_order_status(res: Response) {
		await new TestUsersRouteResponse(res).orders.seller.updated_order(
			TestUserIds.SELLER,
			TestUserIds.BUYER,
			mock_buyer_order.id,
			{ status: "paid" }
		);
	}

	test("admin should update order status", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_seller.id}/orders/${mock_seller_order.id}`
		);

		const res = await req.login("ADMIN").send({ status: "paid" });

		await assert_success_updating_order_status(res);
	});

	test("moderator should return permission error when updating order status", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_seller.id}/orders/${mock_seller_order.id}`
		);

		const res = await req.login("MODERATOR").send({ status: "paid" });

		new TestErrorResponse(res).permission_error();
	});

	test("moderator should return permission error when updating order status", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_seller.id}/orders/${mock_seller_order.id}`
		);

		const res = await req.login("BUYER").send({ status: "paid" });

		new TestErrorResponse(res).permission_error();
	});

	test("seller should update order status", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_seller.id}/orders/${mock_seller_order.id}`
		);

		const res = await req.login("SELLER").send({ status: "paid" });

		await assert_success_updating_order_status(res);
	});
});
