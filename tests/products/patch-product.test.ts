import { Response } from "supertest";
import { ProductDocument } from "../../src/validator/schema.js";
import {
	clear_mock_products,
	set_mock_products,
	TestProductsRouteResponse,
} from "./helpers.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";
import { mock_admin_product, mock_seller_product } from "./mock.js";

describe("PATCH /products/:product_id", () => {
	beforeEach(async () => await set_mock_products());
	afterEach(async () => await clear_mock_products());

	const updated: Partial<ProductDocument> = {
		price: 250,
		stock: 15,
	};

	const invalid_updated: Partial<ProductDocument> = {
		price: -50,
		stock: -5,
	};

	async function assert_success_updating_product(
		res: Response,
		updated_product: Partial<ProductDocument> & Pick<ProductDocument, "id">
	) {
		await new TestProductsRouteResponse(res).updated_product(
			updated_product.id,
			updated_product
		);
	}

	test("admin should update a product", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("ADMIN").send(updated);

		await assert_success_updating_product(res, {
			id: mock_admin_product.id,
			...updated,
		});
	});

	test("moderator should return permission error when updating a product", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("MODERATOR").send(updated);

		return new TestErrorResponse(res).permission_error();
	});

	test("seller should update their own product", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/products/${mock_seller_product.id}`
		);

		const res = await req.login("SELLER").send(updated);

		await assert_success_updating_product(res, {
			id: mock_seller_product.id,
			...updated,
		});
	});

	test("buyer should return permission error when updating a product", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("BUYER").send(updated);

		new TestErrorResponse(res).permission_error();
	});

	test("should return validation error when product validation failed", async () => {
		const req = new TestAppRequest(
			"PATCH",
			`/products/${mock_admin_product.id}`
		);

		const res = await req.login("ADMIN").send(invalid_updated);

		new TestErrorResponse(res).validation_error();
	});
});
