import { clear_mock_products } from "../../products/helpers.js";
import {
	clear_mock_cart,
	clear_mock_users,
	set_mock_cart,
	set_mock_users,
} from "../helpers.js";

export function setup_cart_and_products() {
	beforeEach(
		async () => await Promise.all([set_mock_cart(), set_mock_users()])
	);

	afterEach(
		async () =>
			await Promise.all([
				clear_mock_cart(),
				clear_mock_products(),
				clear_mock_users(),
			])
	);
}
