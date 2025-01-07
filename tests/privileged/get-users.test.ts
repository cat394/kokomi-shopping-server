import { TestAppRequest, TestErrorResponse } from "../utils.js";
import {
	clean_mock_privileged_users,
	setup_mock_privileged_users_users,
	TestPrivilegedUsersRouteResponse,
} from "./setup.js";

describe("GET /privileged/users", () => {
	beforeAll(async () => await setup_mock_privileged_users_users());
	afterAll(async () => await clean_mock_privileged_users());

	test("Admin should retrieve privileged users", async () => {
		const req = new TestAppRequest("GET", "/privileged/users");

		const res = await req.login("ADMIN").send();

		new TestPrivilegedUsersRouteResponse(res).retrieve_users();
	});

	test("Moderator should retrieve privileged users", async () => {
		const req = new TestAppRequest("GET", "/privileged/users");

		const res = await req.login("MODERATOR").send();

		new TestPrivilegedUsersRouteResponse(res).retrieve_users();
	});

	test("Non-privileged user should return permission error when retrieving users", async () => {
		const req = new TestAppRequest("GET", "/privileged/users");

		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});
});
