import { Response } from "supertest";
import { TestUserIds } from "../../src/service/auth.js";
import { ProductToCreate } from "../../src/validator/schema.js";
import { clear_mock_products, TestProductsRouteResponse } from "./helpers.js";
import { TestAppRequest, TestErrorResponse } from "../utils.js";

describe("POST /products", () => {
	afterEach(async () => await clear_mock_products());

	const new_product: ProductToCreate = {
		name: "new-product",
		thumbnail: "NEW_PRODUCT_THUMBNAIL_1",
		short_description: "This is a short description.",
		long_description: "This is a long description.",
		price: 100,
		category: "category",
		images: ["NEW_PRODUCT_IMAGE_1"],
		stock: 1,
	};

	const invalid_product: ProductToCreate = {
		...new_product,
		price: -100,
		stock: -10,
	};

	async function assert_success_creating_a_product(res: Response) {
		await new TestProductsRouteResponse(res).created_product(new_product);
	}

	test("admin should create a product", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("ADMIN").send(new_product);

		await assert_success_creating_a_product(res);
	});

	test("moderator should return permission error when creating products", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("MODERATOR").send(new_product);

		new TestErrorResponse(res).permission_error();
	});

	test("seller should create a product", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("SELLER").send(new_product);

		await assert_success_creating_a_product(res);
	});

	test("validation error if product validation fails", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("SELLER").send(invalid_product);

		new TestErrorResponse(res).validation_error();
	});

	test("Buyer should return permission error when creating a product", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("BUYER").send(new_product);

		new TestErrorResponse(res).permission_error();
	});

	test("Unregisered user should return permission error, when creating a product", async () => {
		const req = new TestAppRequest("POST", "/products");

		const res = await req.login("UNREGISTERED").send(new_product);

		new TestErrorResponse(res).permission_error();
	});
});
