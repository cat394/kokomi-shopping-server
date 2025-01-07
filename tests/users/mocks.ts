import { TestUserIds } from "../../src/service/auth.js";
import db from "../../src/service/db.js";
import { DataModifier } from "../../src/utils/data_modifier.js";
import { convert_timestamp_to_isostring } from "../../src/utils/firestore.js";
import { get_timestamp } from "../../src/utils/timestamp.js";
import {
	BuyerOrderDocument,
	CartUpdated,
	PrivilegedUserToCreate,
	ProductDocument,
	ReviewDocument,
	SellerOrderDocument,
	UserDocument,
} from "../../src/validator/schema.js";
import { mock_admin_product, mock_seller_product } from "../products/mock.js";

export const mock_other_uid = "other-uid";
export const mock_buyer_review_doc_id = "test-review-1";
export const mock_other_user_review_doc_id = "test-review-2";
export const mock_order_doc_id = "test-order";
export const mock_buyer_order_doc_ref = db.orders
	.buyer(TestUserIds.BUYER)
	.doc(mock_order_doc_id);
export const mock_seller_order_doc_ref = db.orders
	.seller(TestUserIds.SELLER)
	.doc(mock_order_doc_id);
export const mock_buyer_review_ref = db.users
	.reviews(TestUserIds.BUYER)
	.doc(mock_buyer_review_doc_id);
export const mock_other_user_review_ref = db.users
	.reviews(mock_other_uid)
	.doc(mock_other_user_review_doc_id);

export const timestamp = get_timestamp();

export const mock_buyer: UserDocument = {
	id: TestUserIds.BUYER,
	name: "ABC",
	email: "test-user@example.com",
	role: "buyer",
	addresses: [
		{
			recipient_name: "user1",
			zip_code: "123-4567",
			address: {
				address1: "prefecture",
				address2: "city",
				address3: "town",
			},
		},
	],
	created_at: timestamp,
	updated_at: timestamp,
};

export const mock_seller: UserDocument = {
	...mock_buyer,
	id: TestUserIds.SELLER,
	role: "seller",
};

export const mock_buyer_review: ReviewDocument = {
	id: mock_buyer_review_doc_id,
	product_id: "mock-product-1",
	created_by: TestUserIds.BUYER,
	title: "Product 1 review",
	description: "This is a product1 review.",
	created_at: timestamp,
	updated_at: timestamp,
};

export const mock_other_user_review: ReviewDocument = {
	...mock_buyer_review,
	id: mock_other_user_review_doc_id,
	created_by: mock_other_uid,
};

export const mock_cart_product_1: ProductDocument = {
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
};

export const mock_cart_product_2: ProductDocument = {
	...mock_cart_product_1,
	id: "234",
	name: "mock-product-2",
	thumbnail: "https://image.com/thumbnail-2.webp",
	images: ["https://image.com/image-2.webp"],
	short_description: "---SHORT DESCRIPTION---",
	long_description: "-----------LONG_DESCRIPTION--------------",
	price: 50,
	category: "category-1",
	stock: 10,
	created_by: TestUserIds.SELLER,
};

export const mock_cart_item_1: CartUpdated = {
	product_id: mock_cart_product_1.id,
	quantity: 3,
};

export const mock_cart_item_2: CartUpdated = {
	product_id: mock_cart_product_2.id,
	quantity: 5,
};

export const mock_invalid_quantity_buyer_cart: CartUpdated = {
	product_id: "invalid-product",
	quantity: 10000,
};

export const mock_buyer_order: BuyerOrderDocument = {
	id: mock_order_doc_id,
	session_id: "123",
	status: "unpaid",
	created_at: timestamp,
	updated_at: timestamp,
	amount_total: 500,
	products: {
		[TestUserIds.SELLER]: [
			{
				product: convert_timestamp_to_isostring(mock_seller_product),
				quantity: 1,
			},
		],
	},
	shipping_address: {
		recipient_name: "test-user",
		zip_code: "123-4567",
		address: {
			address1: "prefecture",
			address2: "city",
			address3: "town",
		},
	},
};

export const mock_seller_order: SellerOrderDocument = {
	...mock_buyer_order,
	buyer_id: TestUserIds.BUYER,
	products: [
		{
			product: convert_timestamp_to_isostring(mock_admin_product),
			quantity: 1,
		},
	],
};

export const mock_other_user_order: BuyerOrderDocument = {
	...mock_buyer_order,
	id: mock_other_user_review_doc_id,
};

export const mock_admin_to_create: PrivilegedUserToCreate = {
	id: "admin_id",
	name: "Test user 1",
	email: "test1@example.com",
	access_rights: "admin",
};

export const mock_moderator_to_create: PrivilegedUserToCreate = {
	id: "moderator_id",
	name: "Test user 2",
	email: "test2@example.com",
	access_rights: "moderator",
};

export const mock_admin = new DataModifier(mock_admin_to_create)
	.merge_timestamp()
	.result();

export const mock_moderator = new DataModifier(mock_moderator_to_create)
	.merge_timestamp()
	.result();
