import type { Response } from "supertest";
import { mock_buyer, mock_seller } from "../mocks.js";
import {
	clear_mock_users,
	set_mock_users,
	TestUsersRouteResponse,
} from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe("GET /users/:user_id", () => {
	beforeAll(async () => set_mock_users());
	afterAll(async () => clear_mock_users());

	function assert_success_retrieving_buyer(res: Response) {
		new TestUsersRouteResponse(res).user.retrieved_user(mock_buyer);
	}

	function assert_success_retrieving_seller(res: Response) {
		new TestUsersRouteResponse(res).user.retrieved_user(mock_seller);
	}

	function assert_retrieved_non_seller_user(res: Response) {
		new TestUsersRouteResponse(res).user.retrieved_user(null);
	}

	test("admin should retrieve user data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_buyer(res);
	});

	test("moderator should retrieve user data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer(res);
	});

	test("seller should retrieve their own data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}`);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_seller(res);
	});

	test("user should return null when retrieving buyer data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}`);

		const res = await req.login("SELLER").send();

		assert_retrieved_non_seller_user(res);
	});

	test("buyer should retrieve their own data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_buyer(res);
	});

	test("buyer should return permission error when retrieving other user data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_seller.id}`);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error on retrieving user data", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}`);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});
});
