import type { Response } from "supertest";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer, mock_buyer_review } from "../mocks.js";
import { setup_reviews } from "./setup.js";
import { TestAppRequest } from "../../utils.js";

describe("GET /users/:user_id/reviews", () => {
	setup_reviews();

	function assert_success_retrieving_reviews(res: Response) {
		new TestUsersRouteResponse(res).reviews.retrieved_reviews([
			mock_buyer_review,
		]);
	}

	test("admin should retrieve reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_reviews(res);
	});

	test("moderator should retrieve reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_reviews(res);
	});

	test("buyer should retrieve all reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_reviews(res);
	});

	test("buyer should retrieve all reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_reviews(res);
	});

	test("seller should retrieve all reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_reviews(res);
	});

	test("unregistered user should retrieve all reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_reviews(res);
	});

	test("no auth user should retrieve all reviews", async () => {
		const req = new TestAppRequest("GET", `/users/${mock_buyer.id}/reviews`);

		const res = await req.send();

		assert_success_retrieving_reviews(res);
	});
});
