import {
	clear_mock_orders,
	clear_mock_users,
	set_mock_orders,
	set_mock_users,
} from "../helpers.js";

export function setup_orders() {
	beforeEach(
		async () => await Promise.all([set_mock_users(), set_mock_orders()])
	);

	afterEach(
		async () => await Promise.all([clear_mock_users(), clear_mock_orders()])
	);
}
