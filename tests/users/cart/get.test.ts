import type { Response } from "supertest";
import {
	clear_mock_cart,
	set_mock_cart,
	TestUsersRouteResponse,
} from "../helpers.js";
import {
	mock_buyer,
	mock_cart_item_2,
	mock_cart_product_2,
	mock_other_uid,
} from "../mocks.js";
import { convert_timestamp_to_isostring } from "../../../src/utils/firestore.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe("GET /users/:user_id/cart", () => {
	beforeAll(async () => await set_mock_cart());

	afterAll(async () => await clear_mock_cart());

	function assert_success_retrieving_buyer_cart(res: Response) {
		new TestUsersRouteResponse(res).cart.retrieved_cart([
			{
				product: convert_timestamp_to_isostring(mock_cart_product_2),
				quantity: mock_cart_item_2.quantity,
			},
		]);
	}

	test("admin should retrieve cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_buyer_cart(res);
	});

	test("moderator should retrieve cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer_cart(res);
	});

	test("buyer should retrieve cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_buyer_cart(res);
	});

	test("buyer should return permission error when retrieving other user cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_other_uid}/cart`);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when retrieving cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when retrieving cart", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/cart`);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
