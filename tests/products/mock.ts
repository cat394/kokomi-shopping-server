import path from "path";
import { ROOT_DIRECTORY } from "../../src/const.js";
import { TestUserIds } from "../../src/service/auth.js";
import db from "../../src/service/db.js";
import { get_timestamp } from "../../src/utils/timestamp.js";
import { ProductDocument } from "../../src/validator/schema.js";

export const mock_admin_product_id = "mock-product-1";
export const mock_seller_product_id = "mock-product-2";

export const mock_product1_ref = db.products.doc(mock_admin_product_id);
export const mock_product2_ref = db.products.doc(mock_seller_product_id);

const timestamp = get_timestamp();

export const mock_admin_product: ProductDocument = {
	id: mock_admin_product_id,
	name: "Test Product 1",
	short_description: "Test Short Description 1",
	long_description: "Test Long Description 1",
	price: 100,
	category: "category-1",
	thumbnail: "TEST_THUMBNAIL_1",
	images: ["TEST_PRODUCUT_IMAGE1"],
	stock: 10,
	created_by: TestUserIds.ADMIN,
	created_at: timestamp,
	updated_at: timestamp,
};

export const mock_seller_product: ProductDocument = {
	id: mock_seller_product_id,
	name: "Test Product 2",
	short_description: "Test Short Description 2",
	long_description: "Test Long Description 2",
	price: 200,
	category: "category-2",
	thumbnail: "TEST_THUMBNAIL_2",
	images: ["TEST_PRODUCT_IMAGE2"],
	stock: 20,
	created_by: TestUserIds.SELLER,
	created_at: timestamp,
	updated_at: timestamp,
};

export const mock_thumbnail_file_path = path.resolve(
	ROOT_DIRECTORY,
	"tests/mock_images/product-thumb.webp"
);

export const mock_product_image_1_file_path = path.resolve(
	ROOT_DIRECTORY,
	"tests/mock_images/product-image-1.webp"
);

export const mock_product_image_2_file_path = path.resolve(
	ROOT_DIRECTORY,
	"tests/mock_images/product-image-2.webp"
);

export const mock_invalid_size_image_file_path = path.resolve(
	ROOT_DIRECTORY,
	"tests/mock_images/invalid_size.png"
);

export const mock_invalid_format_image_file_path = path.resolve(
	ROOT_DIRECTORY,
	"tests/mock_images/invalid_format.bmp"
);
