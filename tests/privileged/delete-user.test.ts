import { Response } from "supertest";
import { TestUserIds } from "../../src/service/auth.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import {
	clean_mock_privileged_users,
	setup_mock_privileged_users_users as setup_mock_privileged_users,
	TestPrivilegedUsersRouteResponse,
} from "./setup.js";
import { mock_admin, mock_moderator } from "../users/mocks.js";

async function create_deleting_privileged_user_response(
	access_rights: keyof typeof TestUserIds
): Promise<[admin_res: Response, moderator_res: Response]> {
	const admin_req = new TestAppRequest(
		"DELETE",
		`/privileged/users/${mock_admin.id}`
	);
	const moderator_req = new TestAppRequest(
		"DELETE",
		`/privileged/users/${mock_moderator.id}`
	);

	return await Promise.all([
		admin_req.login(access_rights).send(),
		moderator_req.login(access_rights).send(),
	]);
}

describe("DELETE /privileged/users/:user_id", () => {
	beforeAll(async () => await setup_mock_privileged_users());
	afterAll(async () => await clean_mock_privileged_users());

	test("Admin should delete privileged user", async () => {
		const [admin_res, moderator_res] =
			await create_deleting_privileged_user_response("ADMIN");

		await Promise.all([
			new TestPrivilegedUsersRouteResponse(admin_res).deleted_user(mock_admin),
			new TestPrivilegedUsersRouteResponse(moderator_res).deleted_user(
				mock_moderator
			),
		]);
	});

	test("Moderator should return permission error when deleting privileged user", async () => {
		const [admin_res, moderator_res] =
			await create_deleting_privileged_user_response("MODERATOR");

		new TestErrorResponse(admin_res).permission_error();
		new TestErrorResponse(moderator_res).permission_error();
	});

	test("Non-priviledged user should return permission error when deletign privileged user", async () => {
		const [admin_res, moderator_res] =
			await create_deleting_privileged_user_response("BUYER");

		new TestErrorResponse(admin_res).permission_error();
		new TestErrorResponse(moderator_res).permission_error();
	});
});
