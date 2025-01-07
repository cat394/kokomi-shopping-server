import type { Response } from "supertest";
import { setup_users } from "./setup.js";
import { TestUsersRouteResponse } from "../helpers.js";
import { mock_buyer, mock_seller } from "../mocks.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe.only("DELETE /users/:user_id", () => {
	setup_users();

	async function assert_success_deleting_buyer(res: Response) {
		await new TestUsersRouteResponse(res).user.deleted_user(mock_buyer.id);
	}

	async function assert_success_deleting_seller(res: Response) {
		await new TestUsersRouteResponse(res).user.deleted_user(mock_seller.id);
	}

	test("admin should delete an user", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}`);

		const res = await req.login("ADMIN").send();

		await assert_success_deleting_buyer(res);
	});

	test("moderator should return permission error when deleting an user", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}`);

		const res = await req.login("MODERATOR").send();

		new TestErrorResponse(res).permission_error();
	});

	test("seller should delete their own user data", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_seller.id}`);

		const res = await req.login("SELLER").send();

		await assert_success_deleting_seller(res);
	});

	test("seller should return permission error when deleting other user data", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}`);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("buyer should delete their own user data", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}`);

		const res = await req.login("BUYER").send();

		await assert_success_deleting_buyer(res);
	});

	test("buyer should return permission error when deleting other user data", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_seller.id}`);

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("unregistered user should return permission error when deleting an user", async () => {
		const req = new TestAppRequest("DELETE", `/users/${mock_buyer.id}`);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
