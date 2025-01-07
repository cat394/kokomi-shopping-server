import type { Response } from "supertest";
import { setup_reviews } from "./setup.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer, mock_buyer_review } from "../mocks.js";
import { TestAppRequest } from "../../utils.js";

describe("GET /users/:user_id/reviews/:review_id", () => {
	setup_reviews();

	function assert_success_retrieving_buyer_review(res: Response) {
		new TestUsersRouteResponse(res).reviews.retrieved_review(mock_buyer_review);
	}

	test("admin should retrieve user's reviews", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_buyer_review(res);
	});

	test("moderator should retrieve user's reviews", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer_review(res);
	});

	test("buyer should retrieve  reviews", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_buyer_review(res);
	});

	test("seller should retrieve reviews", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_buyer_review(res);
	});

	test("unregistered user should retrieve reviews", async () => {
		const req = new TestAppRequest(
			"GET",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("UNREGISTERED").send();

		assert_success_retrieving_buyer_review(res);
	});
});
