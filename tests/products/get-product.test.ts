import { Response } from "supertest";
import {
	clear_mock_products,
	set_mock_products,
	TestProductsRouteResponse,
} from "./helpers.js";
import { mock_admin_product } from "./mock.js";
import { TestAppRequest } from "../utils.js";

describe("GET /products/:product_id", () => {
	beforeAll(async () => await set_mock_products());
	afterAll(async () => await clear_mock_products());

	function assert_success_retrieving_a_product(res: Response) {
		new TestProductsRouteResponse(res).retrieved_product(mock_admin_product);
	}

	test("admin should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.login("ADMIN").send();

		assert_success_retrieving_a_product(res);
	});

	test("moderator should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.login("MODERATOR").send();

		assert_success_retrieving_a_product(res);
	});

	test("seller should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.login("SELLER").send();

		assert_success_retrieving_a_product(res);
	});

	test("buyer should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.login("BUYER").send();

		assert_success_retrieving_a_product(res);
	});

	test("unregistered user should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.login("UNREGISTERED").send();

		assert_success_retrieving_a_product(res);
	});

	test("unauthenticated user should retrieve single product", async () => {
		const req = new TestAppRequest("GET", `/products/${mock_admin_product.id}`);

		const res = await req.send();

		assert_success_retrieving_a_product(res);
	});
});
