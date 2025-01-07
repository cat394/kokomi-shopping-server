import type { Response } from "supertest";
import type { UserToCreate } from "../../../src/validator/schema.js";
import { clear_mock_users, TestUsersRouteResponse } from "../helpers.js";
import { TestAppRequest, TestErrorResponse } from "../../utils.js";

describe("POST /users", () => {
	afterAll(async () => await clear_mock_users());

	const new_user: UserToCreate = {
		name: "new-user",
		email: "test-user@example.com",
		role: "buyer",
		addresses: [
			{
				recipient_name: "test-user",
				zip_code: "123-4567",
				address: {
					address1: "prefecture-1",
					address2: "city-1",
					address3: "town-1",
				},
				default: true,
			},
		],
	};

	const invalid_user: UserToCreate = {
		...new_user,
		name: "",
		email: "not-email-format",
	};

	async function assert_success_creating_user(res: Response) {
		await new TestUsersRouteResponse(res).user.created_user(new_user);
	}

	test("admin should create a new user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("ADMIN").send(new_user);

		await assert_success_creating_user(res);
	});

	test("should return validation error on invalid input", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("ADMIN").send(invalid_user);

		new TestErrorResponse(res).validation_error();
	});

	test("moderator should return permission error when creating an user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("MODERATOR").send(new_user);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should create an user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("SELLER").send(new_user);

		await assert_success_creating_user(res);
	});

	test("buyer should create a new user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("BUYER").send(new_user);

		await assert_success_creating_user(res);
	});

	test("unregistered user should create a new user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.login("UNREGISTERED").send(new_user);

		await assert_success_creating_user(res);
	});

	test("unauthenticated user should return auth error when creating a new user", async () => {
		const req = new TestAppRequest("POST", `/users`);

		const res = await req.send(new_user);

		new TestErrorResponse(res).auth_error();
	});
});
