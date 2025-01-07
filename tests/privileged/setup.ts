import { Response } from "supertest";
import db from "../../src/service/db.js";
import {
	PrivilegedUserDocument,
	PrivilegedUserToCreate,
} from "../../src/validator/schema.js";
import { mock_admin, mock_moderator } from "../users/mocks.js";
import { TestDatabaseResponse } from "../utils.js";

export async function setup_mock_privileged_users_users() {
	try {
		await Promise.all([
			db.privileged_users.create(mock_admin),
			db.privileged_users.create(mock_moderator),
		]);
	} catch {
		throw new Error("Setup priviledged users failed.");
	}
}

export async function clean_mock_privileged_users() {
	try {
		await db.privileged_users.delete_list();
	} catch {
		throw new Error("Failed to delete mock privileged users.");
	}
}

export class TestPrivilegedUsersRouteResponse {
	private db_response: TestDatabaseResponse<PrivilegedUserDocument>;

	constructor(res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	async #check_user_in_db(user: PrivilegedUserToCreate) {
		const user_in_db = await db.privileged_users.get(user.id);
		expect(user_in_db).toEqual(expect.objectContaining(user));
	}

	async created_user(user: PrivilegedUserToCreate) {
		await this.#check_user_in_db(user);
		await this.db_response.created_data(db.privileged_users.collection, user);
	}

	retrieve_users() {
		this.db_response.retrieved_list([mock_admin, mock_moderator]);
	}

	retrieve_user(user: PrivilegedUserDocument) {
		this.db_response.retrieved_single(user);
	}

	async updated_user(
		user_id: PrivilegedUserDocument["id"],
		updated: Partial<PrivilegedUserDocument>
	) {
		await this.db_response.updated_data(
			db.privileged_users.doc(user_id),
			updated
		);
	}

	async deleted_user(user: PrivilegedUserDocument) {
		await this.db_response.deleted_data(
			db.privileged_users.collection.doc(user.id)
		);
	}
}
