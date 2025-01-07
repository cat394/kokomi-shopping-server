import {
	ProductDocument,
	ProductToCreate,
} from "../../src/validator/schema.js";
import { clear_collection_data } from "../../src/utils/index.js";
import { TestDatabaseResponse, TestResponseStatus } from "../utils.js";
import type { Response } from "supertest";
import { db } from "../../src/service/index.js";
import {
	mock_admin_product,
	mock_product1_ref,
	mock_product2_ref,
	mock_seller_product,
} from "./mock.js";

export async function set_mock_products(): Promise<void> {
	const batch = db.batch();

	batch.set(mock_product1_ref, mock_admin_product);
	batch.set(mock_product2_ref, mock_seller_product);

	await batch.commit();
}

export async function clear_mock_products(): Promise<void> {
	await clear_collection_data(db.products.collection);
}

export class TestProductsRouteResponse {
	private temp_folder_regex = /^https:\/\/image\.com/;
	private response_status: TestResponseStatus;
	private db_response: TestDatabaseResponse<ProductDocument>;

	constructor(private readonly res: Response) {
		this.response_status = new TestResponseStatus(res.status);
		this.db_response = new TestDatabaseResponse(res);
	}

	#get_product_ref(product_id: string) {
		return db.products.doc(product_id);
	}

	retrieved_product(product: ProductDocument) {
		this.db_response.retrieved_single(product);
	}

	retrieved_products(products: ProductDocument[]) {
		this.db_response.retrieved_list(products);
	}

	async created_product(product: ProductToCreate) {
		this.db_response.exists_document(db.products.collection);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { thumbnail, images, ...test_data } = product;

		expect(this.db_response.response_data).toHaveProperty("thumbnail");
		expect(this.db_response.response_data).toHaveProperty("images");
		expect(this.db_response.response_data).toEqual(
			expect.objectContaining(test_data)
		);
	}

	async updated_product(
		product_id: ProductDocument["id"],
		updated_product: Partial<ProductDocument>
	) {
		const product_ref = this.#get_product_ref(product_id);

		await this.db_response.updated_data(product_ref, updated_product);
	}

	async deleted_product(product_id: ProductDocument["id"]) {
		const product_ref = this.#get_product_ref(product_id);

		this.db_response.deleted_data(product_ref);
	}

	uploaded_thumbnail() {
		this.response_status.ok();

		expect(this.res.body.data).toHaveProperty("public_id");
		expect(this.res.body.data).toHaveProperty("image_url");
		expect(this.res.body.data.image_url).toMatch(this.temp_folder_regex);
	}

	uploaded_product_images(...file_paths: string[]) {
		this.response_status.ok();

		const images_data = this.res.body.data;

		expect(images_data.length).toBe(file_paths.length);

		file_paths.forEach((_, index) => {
			const image = images_data[index];
			expect(image).toHaveProperty("public_id");
			expect(image).toHaveProperty("image_url");
			expect(image.image_url).toMatch(this.temp_folder_regex);
		});
	}
}
