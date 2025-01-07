import { Response } from "supertest";
import {
	clear_mock_products,
	set_mock_products,
	TestProductsRouteResponse,
} from "./helpers.js";
import { mock_admin_product, mock_seller_product } from "./mock.js";
import { TestAppRequest } from "../utils.js";

describe("GET /products", () => {
	beforeAll(async () => await set_mock_products());
	afterAll(async () => await clear_mock_products());

	function assert_success_retrieving_products(res: Response) {
		new TestProductsRouteResponse(res).retrieved_products([
			mock_admin_product,
			mock_seller_product,
		]);
	}

	test("admin should retrieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_products(res);
	});

	test("moderator should retrieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_products(res);
	});

	test("seller should retrieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.login("SELLER").send();

		assert_success_retrieving_products(res);
	});

	test("buyer should retrieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.login("BUYER").send();

		assert_success_retrieving_products(res);
	});

	test("unregistered user should retrieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.login("UNREGISTERED").send();

		assert_success_retrieving_products(res);
	});

	test("unauthenticated user should retieve all products", async () => {
		const req = new TestAppRequest("GET", "/products");

		const res = await req.send();

		assert_success_retrieving_products(res);
	});
});
