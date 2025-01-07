import { Response } from "supertest";
import type {
	CartItemDocument,
	BuyerOrderDocument,
	ReviewDocument,
	UserDocument,
	UserToCreate,
	CartUpdated,
	CartPopulated,
	SellerOrderDocument,
	ReviewToCreate,
} from "../../src/validator/schema.js";
import { TestDatabaseResponse } from "../utils.js";
import { db, TestUserIds } from "../../src/service/index.js";
import {
	mock_buyer,
	mock_buyer_order,
	mock_buyer_order_doc_ref,
	mock_buyer_review,
	mock_buyer_review_ref,
	mock_cart_item_1,
	mock_cart_item_2,
	mock_cart_product_1,
	mock_cart_product_2,
	mock_other_user_review,
	mock_other_user_review_ref,
	mock_seller,
	mock_seller_order,
	mock_seller_order_doc_ref,
} from "./mocks.js";
import { clear_mock_products } from "../products/helpers.js";

export async function set_mock_users(): Promise<void> {
	try {
		const batch = db.batch();

		db.users.create(mock_buyer, { batch });
		db.users.create(mock_seller, { batch });

		await batch.commit();
	} catch {
		throw new Error("Failed to set mock user data for user route.");
	}
}

export async function set_mock_reviews(): Promise<void> {
	const batch = db.batch();

	batch.set(mock_buyer_review_ref, mock_buyer_review);
	batch.set(mock_other_user_review_ref, mock_other_user_review);

	try {
		await batch.commit();
	} catch {
		throw new Error("Failed to set mock review data for user route.");
	}
}

export async function set_mock_cart(): Promise<void> {
	try {
		const batch = db.batch();

		db.products.create(mock_cart_product_1, { batch });
		db.products.create(mock_cart_product_2, { batch });

		db.users.cart(TestUserIds.BUYER).add(mock_cart_item_1, { batch });
		db.users.cart(TestUserIds.BUYER).add(mock_cart_item_2, { batch });

		await batch.commit();
	} catch {
		throw new Error("Failed to set mock cart data for user route.");
	}
}

export async function set_mock_orders(): Promise<void> {
	try {
		const batch = db.batch();

		batch.set(mock_buyer_order_doc_ref, mock_buyer_order);
		batch.set(mock_seller_order_doc_ref, mock_seller_order);

		await batch.commit();
	} catch {
		throw new Error("Failed to set mock cart data for user route.");
	}
}

export async function clear_mock_users(): Promise<void> {
	try {
		await db.users.delete_list();
	} catch {
		throw new Error("Failed to delete mock user data for user route.");
	}
}

export async function clear_mock_cart(): Promise<void> {
	await Promise.all([
		db.users.cart(TestUserIds.BUYER).delete_list(),
		clear_mock_products(),
	]);
}

export async function clear_mock_orders() {
	await Promise.all([
		db.orders.buyer(TestUserIds.BUYER).delete_list(),
		db.orders.seller(TestUserIds.SELLER).delete_list(),
	]);
}

export async function clear_mock_reviews() {
	const batch = db.batch();

	batch.delete(mock_buyer_review_ref);
	batch.delete(mock_other_user_review_ref);

	try {
		await batch.commit();
	} catch {
		throw new Error("Failed to set mock review data for user route.");
	}
}

class TestUserRouteResponse {
	private db_response: TestDatabaseResponse<UserDocument, UserToCreate>;

	constructor(res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	#get_user_ref(user_id: string) {
		return db.users.doc(user_id);
	}

	retrieved_user(user: UserDocument | null) {
		this.db_response.retrieved_single(user);
	}

	async created_user(user: UserToCreate) {
		await this.db_response.created_data(db.users.collection, user);
	}

	async updated_user(
		product_id: UserDocument["id"],
		updated_product: Partial<UserDocument>
	) {
		const product_ref = this.#get_user_ref(product_id);

		await this.db_response.updated_data(product_ref, updated_product);
	}

	async deleted_user(user_id: UserDocument["id"]) {
		const user_ref = this.#get_user_ref(user_id);

		await this.db_response.deleted_data(user_ref);
	}
}

class TestBuyerOrderResponse {
	private db_response: TestDatabaseResponse<BuyerOrderDocument>;

	constructor(res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	retrieved_order(order: BuyerOrderDocument) {
		this.db_response.retrieved_single(order);
	}

	retrieved_orders(orders: BuyerOrderDocument[]) {
		this.db_response.retrieved_list(orders);
	}
}

class TestSellerOrderResponse {
	private db_response: TestDatabaseResponse<SellerOrderDocument>;

	constructor(res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	#get_order_ref(
		role: UserDocument["role"],
		user_id: string,
		order_id: string
	) {
		switch (role) {
			case "buyer":
				return db.orders.buyer(user_id).doc(order_id);
			case "seller":
				return db.orders.seller(user_id).doc(order_id);
		}
	}

	retrieved_order(order: SellerOrderDocument) {
		this.db_response.retrieved_single(order);
	}

	retrieved_orders(orders: SellerOrderDocument[]) {
		this.db_response.retrieved_list(orders);
	}

	async updated_order(
		seller_id: UserDocument["id"],
		buyer_id: UserDocument["id"],
		order_id: SellerOrderDocument["id"],
		updated_order: Pick<SellerOrderDocument, "status">
	) {
		const seller_order_ref = this.#get_order_ref("seller", seller_id, order_id);

		const buyer_order_ref = this.#get_order_ref("buyer", buyer_id, order_id);

		await this.db_response.updated_data(seller_order_ref, updated_order);

		await this.db_response.updated_data(buyer_order_ref, updated_order);
	}
}

class TestOrdersRouteResponse {
	constructor(private readonly res: Response) {}

	get buyer() {
		return new TestBuyerOrderResponse(this.res);
	}

	get seller() {
		return new TestSellerOrderResponse(this.res);
	}
}

class TestCartRouteResponse {
	private db_response: TestDatabaseResponse<CartItemDocument>;

	constructor(private readonly res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	#get_cart_ref(user_id: UserDocument["id"]) {
		return db.users.cart(user_id).collection;
	}

	retrieved_cart(cart_populated: CartPopulated[]) {
		expect(this.res.status).toBe(200);

		expect(this.res.body.cart).toEqual(cart_populated);
	}

	async created_cart(user_id: UserDocument["id"], cart: CartItemDocument) {
		await this.db_response.created_data(this.#get_cart_ref(user_id), cart);
	}

	async updated_cart(
		user_id: UserDocument["id"],
		product_id: CartUpdated["product_id"],
		updated_cart: Partial<CartItemDocument>
	) {
		const cart_ref = this.#get_cart_ref(user_id);

		await this.db_response.updated_data(cart_ref.doc(product_id), updated_cart);
	}

	async deleted_cart_item(
		user_id: UserDocument["id"],
		product_id: CartUpdated["product_id"]
	) {
		const cart_item = await db.users.cart(user_id).get(product_id);

		this.db_response.modified_successful();

		expect(cart_item).toBe(null);
	}

	async reset_cart(user_id: ReviewDocument["id"]) {
		const cart = await db.users.cart(user_id).get_list();

		this.db_response.modified_successful();

		expect(cart).toEqual([]);
	}
}

class TestReviewsRouteResponse {
	private db_response: TestDatabaseResponse<ReviewDocument>;

	constructor(res: Response) {
		this.db_response = new TestDatabaseResponse(res);
	}

	#get_review_ref(
		user_id: UserDocument["id"],
		review_id: ReviewDocument["id"]
	) {
		return db.users.reviews(user_id).doc(review_id);
	}

	retrieved_review(review: ReviewDocument) {
		this.db_response.retrieved_single(review);
	}

	retrieved_reviews(reviews: ReviewDocument[]) {
		this.db_response.retrieved_list(reviews);
	}

	async created_review(user_id: string, review: ReviewToCreate) {
		await this.db_response.created_data(db.users.reviews(user_id).collection, {
			...review,
			author_id: user_id,
		});
	}

	async updated_review(
		user_id: UserDocument["id"],
		review_id: ReviewDocument["id"],
		updated_cart: Partial<ReviewDocument>
	) {
		const cart_ref = this.#get_review_ref(user_id, review_id);

		await this.db_response.updated_data(cart_ref, updated_cart);
	}

	async deleted_review(
		user_id: UserDocument["id"],
		review_id: ReviewDocument["id"]
	) {
		const review_ref = db.users.reviews(user_id).doc(review_id);

		await this.db_response.deleted_data(review_ref);
	}
}

export class TestUsersRouteResponse {
	constructor(private res: Response) {}

	get user() {
		return new TestUserRouteResponse(this.res);
	}

	get orders() {
		return new TestOrdersRouteResponse(this.res);
	}

	get cart() {
		return new TestCartRouteResponse(this.res);
	}

	get reviews() {
		return new TestReviewsRouteResponse(this.res);
	}
}
