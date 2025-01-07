import { clear_mock_users, set_mock_users } from "../helpers.js";

export function setup_users() {
	beforeEach(async () => await set_mock_users());

	afterEach(async () => await clear_mock_users());
}
