import { TestAppRequest, TestErrorResponse } from "../utils.js";
import {
	mock_admin_to_create,
	mock_moderator_to_create,
} from "../users/mocks.js";
import {
	clean_mock_privileged_users,
	TestPrivilegedUsersRouteResponse,
} from "./setup.js";

describe("POST /privileged/users", () => {
	afterAll(async () => await clean_mock_privileged_users());

	test("Admin should create admin user", async () => {
		const req = new TestAppRequest("POST", "/privileged/users");

		const res = await req.login("ADMIN").send(mock_admin_to_create);

		await new TestPrivilegedUsersRouteResponse(res).created_user(
			mock_admin_to_create
		);
	});

	test("Admin should create moderator user", async () => {
		const req = new TestAppRequest("POST", "/privileged/users");

		const res = await req.login("ADMIN").send(mock_moderator_to_create);

		await new TestPrivilegedUsersRouteResponse(res).created_user(
			mock_moderator_to_create
		);
	});

	test("Non-admin users cannot create accounts", async () => {
		const req = new TestAppRequest("POST", "/privileged/users");

		const res = await req.login("BUYER").send(mock_admin_to_create);

		new TestErrorResponse(res).permission_error();
	});
});
