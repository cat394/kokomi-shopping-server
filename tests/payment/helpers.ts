import db from "../../src/service/db.js";
import { type Response } from "supertest";
import { TestUserIds } from "../../src/service/auth.js";
import { mock_payment } from "./mock.js";

export class TestPaymentRouteResponse {
	constructor(private readonly res: Response) {}

	async success_creating_session_url(user_id?: TestUserIds) {
		expect(this.res.status).toBe(302);

		expect(this.res.headers.location).toBe(
			"https://test.com/payment-page/12345"
		);

		const order = (
			await db.orders.buyer(user_id || TestUserIds.BUYER).get_list()
		)[0]!;

		expect(order).toEqual(
			expect.objectContaining({ status: "unpaid", amount_total: 550 })
		);
	}

	redirect_success_url() {
		expect(this.res.status).toBe(302);

		expect(this.res.headers.location).toBe(mock_payment.success_url);
	}
}
