import { TestUserIds } from "../../src/service/auth.js";
import { mock_admin, mock_moderator } from "../users/mocks.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import {
	clean_mock_privileged_users,
	setup_mock_privileged_users_users,
	TestPrivilegedUsersRouteResponse,
} from "./setup.js";

async function assert_success_retrieved_user(
	access_rights: keyof typeof TestUserIds
) {
	const admin_req = new TestAppRequest(
		"GET",
		`/privileged/users/${mock_admin.id}`
	);
	const moderator_req = new TestAppRequest(
		"GET",
		`/privileged/users/${mock_moderator.id}`
	);

	const [admin_res, moderator_res] = await Promise.all([
		admin_req.login(access_rights).send(),
		moderator_req.login(access_rights).send(),
	]);

	new TestPrivilegedUsersRouteResponse(admin_res).retrieve_user(mock_admin);
	new TestPrivilegedUsersRouteResponse(moderator_res).retrieve_user(
		mock_moderator
	);
}

describe("GET /privileged/users/:user_id", () => {
	beforeAll(async () => await setup_mock_privileged_users_users());
	afterAll(async () => await clean_mock_privileged_users());

	test("Admin should retrieve priviledged user", async () => {
		await assert_success_retrieved_user("ADMIN");
	});

	test("Moderator should retrieve priviledged user", async () => {
		await assert_success_retrieved_user("MODERATOR");
	});

	test("Non-priviledged user should return permission error when retrieving user", async () => {
		const req = new TestAppRequest("GET", `/privileged/users/${mock_admin.id}`);
		const res = await req.login("BUYER").send();

		new TestErrorResponse(res).permission_error();
	});
});
