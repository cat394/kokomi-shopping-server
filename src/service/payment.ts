import dotEnv from "dotenv";
import Stripe from "stripe";
import _ from "lodash";
import db from "./db.js";
import stripe from "../stripe.js";
import { Request } from "koa";
import {
	OrderError,
	PaymentError,
	ResourceNotFoundError,
} from "../errors/index.js";
import {
	BuyerOrderDocument,
	OrderDocument,
	PaymentDetail,
	SellerOrderDocument,
	UserDocument,
} from "../validator/schema.js";
import {
	is_production,
	DataModifier,
	get_timestamp,
	convert_timestamp_to_isostring,
} from "../utils/index.js";
import { TestUserIds } from "./auth.js";
import { TEST_CHECKOUT_SESSION_URL } from "../../tests/const.js";

dotEnv.config();

type OrderDetail = {
	order_id: OrderDocument["id"];
	buyer_id: UserDocument["id"];
} & Pick<BuyerOrderDocument, "products" | "shipping_address">;

type PaymentSession = {
	session_id: string;
} & { order_detail: OrderDetail };

type PaymentType = "checkout_completed";

type PaymentEvent = {
	type: PaymentType;
	session: PaymentSession;
};

interface PaymentAdapter {
	construct_event(raw_body: string, signature: string): PaymentEvent;
	get_session_detail(session: object): PaymentSession;
	get_session_url(params: Stripe.Checkout.SessionCreateParams): Promise<string>;
}

export class StripeAdapter implements PaymentAdapter {
	construct_event(raw_body: string, signature: string): PaymentEvent {
		try {
			const event = stripe.webhooks.constructEvent(
				raw_body,
				signature,
				process.env.STRIPE_TEST_SECRET_KEY!
			);

			switch (event.type) {
				case "checkout.session.completed": {
					const session_details = this.get_session_detail(event.data.object);

					return {
						type: "checkout_completed",
						session: session_details,
					};
				}

				default:
					throw new PaymentError("UNHANDLED_EVENT", {
						additional_message: `Event: ${event.type}`,
					});
			}
		} catch (err) {
			throw new PaymentError("INVALID_SIGNATURE", { bubbled_error: err });
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get_session_detail(session: any): PaymentSession {
		const { id: session_id, metadata } = session;

		if (!(metadata && metadata.order_detail)) {
			throw new PaymentError("MISSING_METADATA");
		}

		return {
			session_id,
			order_detail: metadata.order_detail,
		};
	}

	async get_session_url(
		params: Stripe.Checkout.SessionCreateParams
	): Promise<string> {
		const { url: session_url } = await stripe.checkout.sessions.create(params);

		if (!session_url) {
			throw new PaymentError("SESSION_CREATION_FAILED");
		}

		return session_url;
	}
}

export class MockPaymentAdapter implements PaymentAdapter {
	static mock_payment_session: PaymentSession = {
		session_id: "mock-session-id",
		order_detail: {
			order_id: "test-order",
			buyer_id: TestUserIds.BUYER,
			products: {
				[TestUserIds.SELLER]: [
					{
						product: convert_timestamp_to_isostring({
							id: "123",
							name: "mock-product-1",
							thumbnail: "https://image.com/thumbnail-1.webp",
							images: ["https://image.com/image-1.webp"],
							short_description: "---SHORT DESCRIPTION---",
							long_description: "-----------LONG_DESCRIPTION--------------",
							price: 100,
							category: "category-1",
							stock: 100,
							created_by: TestUserIds.SELLER,
							created_at: get_timestamp(),
							updated_at: get_timestamp(),
						}),
						quantity: 3,
					},
				],
			},
			shipping_address: {
				recipient_name: "mock-recipient",
				zip_code: "123-4567",
				address: {
					address1: "mock-address-1",
					address2: "mock-address-2",
					address3: "mock-address-3",
				},
			},
		},
	};

	construct_event(): PaymentEvent {
		return {
			type: "checkout_completed",
			session: this.get_session_detail(),
		};
	}

	get_session_detail(): PaymentSession {
		return MockPaymentAdapter.mock_payment_session;
	}

	async get_session_url(): Promise<string> {
		return await Promise.resolve(TEST_CHECKOUT_SESSION_URL);
	}
}

export class PaymentService {
	order_id = "";

	constructor(private readonly adapter: PaymentAdapter) {}

	static get_signature(headers: Request["headers"]): string {
		const signature = headers["stripe-signature"];

		if (typeof signature !== "string") {
			throw new PaymentError("MISSING_SIGNATURE");
		}

		return signature;
	}

	construct_event(raw_body: string, signature: string): PaymentEvent {
		try {
			return this.adapter.construct_event(raw_body, signature);
		} catch (err) {
			throw new PaymentError("INVALID_SIGNATURE", { bubbled_error: err });
		}
	}

	async complete_the_payment({
		session_id,
		order_detail,
	}: PaymentEvent["session"]): Promise<void> {
		const { order_id, buyer_id, products, shipping_address } = order_detail;

		await db.run_transaction(async (transaction) => {
			db.orders
				.buyer(buyer_id)
				.update(order_id, { session_id, status: "paid" }, { transaction });

			for (const [seller_id, seller_products] of Object.entries(products)) {
				let amount_total = 0;

				seller_products.forEach(
					({ product, quantity }) => (amount_total += product.price * quantity)
				);

				const order: SellerOrderDocument = new DataModifier({
					buyer_id,
					amount_total,
					shipping_address,
					status: "paid",
					products: seller_products,
					session_id,
				})
					.merge_id(order_id)
					.merge_timestamp()
					.result();

				db.orders.seller(seller_id).create(order, { transaction });
			}
		});
	}

	async create_session_url(
		user_id: string,
		{ shipping_address, success_url, cancel_url }: PaymentDetail
	): Promise<string> {
		const user = await db.users.get(user_id);

		const cart = await db.users.cart(user_id).get_list_populated_product();

		if (!user) {
			throw new ResourceNotFoundError("USER_DATA_NOT_FOUND");
		}

		if (cart.length === 0) {
			throw new PaymentError("EMPTY_CART");
		}

		const transaction_result = await db.run_transaction<{
			line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
			order_detail: OrderDetail;
		}>(async (transaction) => {
			let amount_total = 0;

			const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

			for (const { product, quantity } of cart) {
				const rest_stock = product.stock - quantity;

				if (rest_stock < 0) {
					throw new OrderError("OUT_OF_STOCK", {
						additional_message: `The quantity ${product.name} for  has exceeded the stock available.`,
					});
				}

				await db.products.update(
					product.id,
					{ stock: rest_stock },
					{ transaction }
				);

				amount_total += product.price * quantity;

				line_items.push({
					price_data: {
						currency: "jpy",
						product_data: {
							name: product.name,
						},
						unit_amount: product.price,
					},
					quantity,
				});
			}

			const purchased_products_grouped_by_seller_id = _.groupBy(
				cart,
				(cart_item) => cart_item.product.created_by
			);

			const order: BuyerOrderDocument = new DataModifier({
				amount_total,
				shipping_address,
				status: "unpaid",
				products: purchased_products_grouped_by_seller_id,
			})
				.merge_id()
				.merge_timestamp()
				.result();

			await db.orders.buyer(user_id).create(order, { transaction });

			return {
				line_items,
				order_detail: {
					order_id: order.id,
					buyer_id: user.id,
					products: order.products,
					shipping_address: order.shipping_address,
				},
			};
		});

		const session_url = await this.adapter.get_session_url({
			mode: "payment",
			line_items: transaction_result.line_items,
			customer_email: user.email,
			metadata: {
				order_detail: JSON.stringify(transaction_result.order_detail),
			},
			success_url,
			cancel_url,
		});

		return session_url;
	}
}

function get_payment_service(): PaymentService {
	const adapter = is_production
		? new StripeAdapter()
		: new MockPaymentAdapter();

	return new PaymentService(adapter);
}

export const payment_service = get_payment_service();
