import { Response } from "supertest";
import { ProductDocument } from "../../src/validator/schema.js";
import {
	clear_mock_products,
	set_mock_products,
	TestProductsRouteResponse,
} from "./helpers.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import { mock_admin_product, mock_seller_product } from "./mock.js";

describe("DELETE /products/:product_id", () => {
	beforeEach(async () => await set_mock_products());
	afterEach(async () => await clear_mock_products());

	async function assert_success_deleting_product(
		res: Response,
		deleted_product: ProductDocument
	) {
		await new TestProductsRouteResponse(res).deleted_product(
			deleted_product.id
		);
	}

	test("Admin should delete a product", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("ADMIN").send();

		await assert_success_deleting_product(res, mock_admin_product);
	});

	test("Moderator should return permission error when deleting a product", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("MODERATOR").send();

		new TestErrorResponse(res).permission_error();
	});

	test("Seller should delete their own product", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/products/${mock_seller_product.id}`
		);

		const res = await req.login("SELLER").send();

		await assert_success_deleting_product(res, mock_seller_product);
	});

	test("Seller should return validation error when deleting other user's product", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("SELLER").send();

		new TestErrorResponse(res).permission_error();
	});

	test("Unregistered user return permission error, when deleting a product", async () => {
		const req = new TestAppRequest(
			"DELETE",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("UNREGISTERED").send();

		new TestErrorResponse(res).permission_error();
	});
});
