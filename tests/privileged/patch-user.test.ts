import { PrivilegedUserDocument } from "../../src/validator/schema.js";
import { mock_admin } from "../users/mocks.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import {
	clean_mock_privileged_users,
	setup_mock_privileged_users_users,
	TestPrivilegedUsersRouteResponse,
} from "./setup.js";

describe("PATCH /privileged/users/:user_id", () => {
	beforeAll(async () => await setup_mock_privileged_users_users());
	afterAll(async () => await clean_mock_privileged_users());

	const updated: Partial<PrivilegedUserDocument> = {
		name: "Updated name",
	};

	test("Admin should update priviledged user data", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/privileged/users/${mock_admin.id}`
		);

		const res = await req.login("ADMIN").send(updated);

		await new TestPrivilegedUsersRouteResponse(res).updated_user(
			mock_admin.id,
			updated
		);
	});

	test("Moderator should return permission error when updating user data", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/privileged/users/${mock_admin.id}`
		);

		const res = await req.login("MODERATOR").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("Non-privileged user should return permission error when updating user data", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/privileged/users/${mock_admin.id}`
		);

		const res = await req.login("BUYER").send(updated);

		new TestErrorResponse(res).permission_error();
	});
});
