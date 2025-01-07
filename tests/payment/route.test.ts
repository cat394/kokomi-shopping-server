import { clear_mock_products, set_mock_products } from "../products/helpers.js";
import {
	clear_mock_cart,
	clear_mock_orders,
	clear_mock_users,
	set_mock_cart,
	set_mock_users,
} from "../users/helpers.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import { TestPaymentRouteResponse } from "./helpers.js";
import { mock_invalid_payment, mock_payment } from "./mock.js";

describe("Payment route test", () => {
	beforeAll(async () => await Promise.all([set_mock_users(), set_mock_cart()]));

	beforeEach(async () => await set_mock_products());

	afterEach(
		async () => await Promise.all([clear_mock_products(), clear_mock_orders()])
	);

	afterAll(
		async () => await Promise.all([clear_mock_users(), clear_mock_cart()])
	);

	test("admin should return resource not found error because the administrator does not have a cart.", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("ADMIN").send(mock_payment);

		new TestErrorResponse(res).resource_not_found_error();
	});

	test("moderator should return permission error when creating payment session", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("MODERATOR").send(mock_payment);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should redirect success url", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("BUYER").send(mock_payment);

		await new TestPaymentRouteResponse(res).success_creating_session_url();
	});

	test("seller should return permission error when creating payment session", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("SELLER").send(mock_payment);

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when creating payment session", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("UNREGISTERED").send(mock_payment);

		new TestErrorResponse(res).permission_error();
	});

	test("should return validation error, sent invalid payment", async () => {
		const req = new TestAppRequest("POST", "/payment");

		const res = await req.login("BUYER").send(mock_invalid_payment);

		new TestErrorResponse(res).validation_error();
	});
});
