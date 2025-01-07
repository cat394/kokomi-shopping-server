import { Response } from "supertest";
import { TestUsersRouteResponse } from "../helpers.js";
import {
	mock_buyer,
	mock_buyer_review,
	mock_other_uid,
	mock_other_user_review,
} from "../mocks.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe("DELETE /users/:user_id/reviews/:review_id", () => {
	async function assert_success_deleting_buyer_review(res: Response) {
		await new TestUsersRouteResponse(res).reviews.deleted_review(
			mock_buyer.id,
			mock_buyer_review.id
		);
	}

	test("admin should delete a review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("ADMIN").send();

		await assert_success_deleting_buyer_review(res);
	});

	test("moderator should return permission error when deleting review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("MODERATOR").send();

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should delete their own review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_buyer.id}/reviews/${mock_buyer_review.id}`
		);

		const res = await req.login("BUYER").send();

		await assert_success_deleting_buyer_review(res);
	});

	test("buyer should return permission error when deleting other user's review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_other_uid}/reviews/${mock_other_user_review.id}`
		);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when deleting other user's review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_other_uid}/reviews/${mock_other_user_review.id}`
		);

		const res = await req.login("MODERATOR").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when deleting other user's review", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/users/${mock_other_uid}/reviews/${mock_other_user_review.id}`
		);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
