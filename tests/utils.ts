import request, { Test, type Response } from "supertest";
import path from "path";
import fs from "fs/promises";
import type { ErrorResponse } from "../src/errors/handlers/types.js";
import {
	CollectionReference,
	DocumentReference,
} from "firebase-admin/firestore";
import { create_app } from "../src/app.js";
import { TestUserIds } from "../src/service/index.js";
import {
	BaseDocumentFields,
	DocumentToCreate,
} from "../src/validator/schema.js";
import { ROOT_DIRECTORY } from "../src/const.js";
import { convert_timestamp_to_isostring } from "../src/utils/firestore.js";
import { logger } from "../src/logger.js";

const temp_directory = path.resolve(ROOT_DIRECTORY, "temp");

const express_app = create_app().callback();

export const cloudinary_temp_image_url =
	"https://res.cloudinary.com/my-cloud/image/upload/s--abcd12345--/v1698743671/signed_images/sample.jpg";

export class TestResponseStatus {
	constructor(private readonly status: Response["status"]) {}

	private check_status(status_number: number) {
		expect(this.status).toBe(status_number);
	}

	ok() {
		this.check_status(200);
	}

	bad_request() {
		this.check_status(400);
	}

	forbidden() {
		this.check_status(403);
	}

	unauthorized() {
		this.check_status(401);
	}

	not_found() {
		this.check_status(404);
	}
}

export class TestErrorResponse {
	private status: Response["status"];
	private error_type: ErrorResponse["error_type"];
	private response_status: TestResponseStatus;

	constructor(res: Response) {
		this.status = res.status;
		this.error_type = res.body.error_type;
		this.response_status = new TestResponseStatus(res.status);
	}

	auth_error() {
		this.response_status.unauthorized();
		expect(this.error_type).toBe("AUTH_ERROR");
	}

	permission_error() {
		this.response_status.forbidden();
		expect(this.error_type).toBe("PERMISSION_ERROR");
	}

	db_error() {
		this.response_status.bad_request();
		expect(this.error_type).toBe("DATABASE_ERROR");
	}

	validation_error() {
		this.response_status.bad_request();
		expect(this.error_type).toBe("VALIDATION_ERROR");
	}

	payment_error() {
		expect(this.status).toContain(400);
		expect(this.error_type).toBe("PAYMENT_ERROR");
	}

	order_error() {
		this.response_status.bad_request();
		expect(this.error_type).toBe("ORDER_ERROR");
	}

	file_error() {
		this.response_status.bad_request();
		expect(this.error_type).toBe("FILE_ERROR");
	}

	resource_not_found_error() {
		this.response_status.not_found();
		expect(this.error_type).toBe("RESOURCE_NOT_FOUND_ERROR");
	}
}

export class TestDatabaseResponse<
	DataType extends BaseDocumentFields,
	DataToCreate extends object = DataType
> {
	protected response_status: TestResponseStatus;

	constructor(
		protected readonly res: Response,
	) {
		this.response_status = new TestResponseStatus(res.status);
	}

	get response_data() {
		return this.res.body.data;
	}

	modified_successful() {
		this.response_status.ok();

		expect(this.res.body.success).toBe(true);
	}

	retrieved_single(data: DataType | null) {
		this.response_status.ok();

		expect(this.response_data).toEqual(
			data ? convert_timestamp_to_isostring(data) : null
		);
	}

	retrieved_list(data: DataType[]) {
		this.response_status.ok();

		const converted = data.map(convert_timestamp_to_isostring);

		expect(this.response_data).toEqual(converted);
	}

	async exists_document(coll_ref: CollectionReference) {
		const snapshot = await coll_ref.doc(this.response_data.id).get();

		expect(snapshot.exists).toBe(true);

		expect(this.response_data).toHaveProperty("id");

		expect(this.response_data).toHaveProperty("created_at");

		expect(this.response_data).toHaveProperty("updated_at");
	}

	async created_data(
		coll_ref: CollectionReference,
		new_data: DocumentToCreate<DataToCreate>
	) {
		this.response_status.ok();

		await this.exists_document(coll_ref);

		expect(this.response_data).toEqual(
			expect.objectContaining(new_data)
		);
	}

	async updated_data(doc_ref: DocumentReference, updated: Partial<DataType>) {
		this.modified_successful();

		const snap = await doc_ref.get();

		expect(snap.exists).toBe(true);

		expect(snap.data()).toEqual(expect.objectContaining(updated));
	}

	async deleted_data(doc_ref: DocumentReference) {
		this.modified_successful();

		const snapshot = await doc_ref.get();

		expect(snapshot.exists).toBe(false);
	}
}

export type MethodName = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class TestAppRequest {
	protected request: Test;

	constructor(method: MethodName, endpoint: string) {
		const method_name = method.toLowerCase() as Lowercase<MethodName>;

		this.request = request(express_app)[method_name](endpoint);
	}

	login(role: keyof typeof TestUserIds) {
		this.request.set("Authorization", `Bearer ${role}`);

		return this;
	}

	attach(field_name: string, file_path: string) {
		this.request.attach(field_name, file_path);

		return this;
	}

	async send(body?: object) {
		logger.system.info({ Body_sent: body });
		return body ? await this.request.send(body) : await this.request;
	}
}

export async function clear_temp_directory() {
	try {
		const files = await fs.readdir(temp_directory);

		await Promise.all(
			files.map(async (file) => {
				const file_path = path.join(temp_directory, file);

				const stat = await fs.lstat(file_path);

				if (stat.isDirectory()) {
					await fs.rm(file_path, { recursive: true, force: true });
				} else {
					await fs.unlink(file_path);
				}
			})
		);
	} catch (err) {
		logger.system.error({
			message: "Failed to clear temp directory:",
			error: err,
		});
	}
}
