import type { Response } from "supertest";
import { setup_users } from "./setup.js";
import type { UserDocument } from "../../../src/validator/schema.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";
import { mock_buyer, mock_seller } from "../mocks.js";

describe("PATCH /users/:user_id", () => {
	setup_users();

	const updated: Partial<UserDocument> = { name: "updated name" };

	const invalid_updated: Partial<UserDocument> = {
		name: "",
	};

	async function assert_success_updating_buyer(res: Response) {
		await new TestUsersRouteResponse(res).user.updated_user(
			mock_buyer.id,
			updated
		);
	}

	async function assert_success_updating_seller(res: Response) {
		await new TestUsersRouteResponse(res).user.updated_user(
			mock_seller.id,
			updated
		);
	}

	test("admin should update any user data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}`);

		const res = await req.login("ADMIN").send(updated);

		await assert_success_updating_buyer(res);
	});

	test("should return validation error on invalid input", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}`);

		const res = await req.login("ADMIN").send(invalid_updated);

		new TestErrorResponse(res).validation_error();
	});

	test("moderator should return permission error when updating user data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}`);

		const res = await req.login("MODERATOR").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should update their own data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}`);

		const res = await req.login("BUYER").send(updated);

		await assert_success_updating_buyer(res);
	});

	test("buyer should return permission error when update other user data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_seller.id}`);

		const res = await req.login("BUYER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should update their own data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_seller.id}`);

		const res = await req.login("SELLER").send(updated);

		await assert_success_updating_seller(res);
	});

	test("seller should return permission error when update other user data", async () => {
		const req = new TestAppRequest("PATCH", `/users/${mock_buyer.id}`);

		const res = await req.login("SELLER").send(updated);

		new TestErrorResponse(res).permission_error();
	});
});
