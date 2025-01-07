import type { Response } from "supertest";
import { ReviewToCreate } from "../../../src/validator/schema.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer, mock_other_uid } from "../mocks.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { TestUserIds } from "../../../src/service/auth.js";
import {
	clear_mock_products,
	set_mock_products,
} from "../../products/helpers.js";
import { clear_reviews } from "./setup.js";
import { mock_seller_product } from "../../products/mock.js";

describe("POST /users/:user_id/reviews", () => {
	beforeAll(async () => await set_mock_products());
	afterAll(
		async () => await Promise.all([clear_mock_products(), clear_reviews()])
	);

	const new_review: ReviewToCreate = {
		product_id: mock_seller_product.id,
		title: "Admin product reviw",
		description: "----------LONG DESCRIPTION----------",
	};

	async function assert_success_creating_review(res: Response) {
		await new TestUsersRouteResponse(res).reviews.created_review(
			TestUserIds.BUYER,
			new_review
		);
	}

	test("admin should update reviews", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("ADMIN").send(new_review);

		await assert_success_creating_review(res);
	});

	test("moderator should return permission error when updating reviews", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("MODERATOR").send(new_review);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should create new review", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("BUYER").send(new_review);

		await assert_success_creating_review(res);
	});

	test("user should return permission error when creating other user's review", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_other_uid}/reviews`);

		const res = await req.login("BUYER").send(new_review);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should return permission error when creating a review", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_other_uid}/reviews`);

		const res = await req.login("SELLER").send(new_review);

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when updating review", async () => {
		const req = new TestAppRequest("POST", `/users/${mock_buyer.id}/reviews`);

		const res = await req.login("UNREGISTERED").send(new_review);

		new TestErrorResponse(res).permission_error();
	});
});
