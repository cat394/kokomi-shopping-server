import type { Response } from "supertest";
import { ReviewDocument } from "../../../src/validator/schema.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer, mock_buyer_review, mock_other_uid } from "../mocks.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { setup_reviews } from "./setup.js";

describe("PATCH /users/:user_id/reviews/:review_id", () => {
	setup_reviews();

	const updated: Partial<ReviewDocument> = {
		title: "updated title",
	};

	async function assert_success_updating_buyer_review(res: Response) {
		await new TestUsersRouteResponse(res).reviews.updated_review(
			mock_buyer.id,
			mock_buyer_review.id,
			updated
		);
	}

	test("admin should update reviews", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("ADMIN").send(updated);

		await assert_success_updating_buyer_review(res);
	});

	test("moderator should return permission error when updating reviews", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("MODERATOR").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should update their own reviews", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("BUYER").send(updated);

		await assert_success_updating_buyer_review(res);
	});

	test("buyer should return permission error when updating other user's review", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_other_uid}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("BUYER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when updating review", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("SELLER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when updating review", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("UNREGISTERED").send(updated);

		new TestErrorResponse(res).permission_error();
	});
});
