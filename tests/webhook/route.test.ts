import db from "../../src/service/db.js";
import type { Response } from "supertest";
import { clear_mock_products, set_mock_products } from "../products/helpers.js";
import { clear_mock_orders, set_mock_orders } from "../users/helpers.js";
import { mock_seller } from "../users/mocks.js";
import { WebhookRouteRequest } from "./helpers.js";
import { MockPaymentAdapter } from "../../src/service/payment.js";
import { SellerOrderDocument } from "../../src/validator/schema.js";
import { TestUserIds } from "../../src/service/auth.js";
import { mock_seller_product } from "../products/mock.js";

describe("POST /webhook", () => {
	beforeAll(
		async () => await Promise.all([set_mock_products(), set_mock_orders()])
	);

	async function assert_success_purchasing_products(res: Response) {
		const seller_product = (await db.products.get(mock_seller_product.id))!;

		const buyer_order = (
			await db.orders.buyer(TestUserIds.BUYER).get_list()
		)[0]!;

		const seller_order = (
			await db.orders.seller(mock_seller.id).get_list()
		)[0]!;

		const session = MockPaymentAdapter.mock_payment_session;

		const expected_seller_order: Partial<SellerOrderDocument> = {
			amount_total: 300,
			buyer_id: TestUserIds.BUYER,
			session_id: session.session_id,
			shipping_address: session.order_detail.shipping_address,
			status: "paid",
			products: session.order_detail.products[TestUserIds.SELLER],
		};

		expect(res.body.success).toBe(true);

		expect(buyer_order.status).toEqual("paid");

		expect(seller_product.stock).toBe(mock_seller_product.stock);

		expect(seller_order).toEqual(
			expect.objectContaining(expected_seller_order)
		);
	}

	afterAll(
		async () => await Promise.all([clear_mock_products(), clear_mock_orders()])
	);

	test("should create own order and seller orders", async () => {
		const req = new WebhookRouteRequest("POST", "/webhook");

		const res = await req.with_stripe_signature().send();

		await assert_success_purchasing_products(res);

		expect(true).toBe(true);
	});
});
