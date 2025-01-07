import dotenv from "dotenv";
import {
	v2 as cloudinary,
	UpdateApiOptions,
	UploadApiOptions,
} from "cloudinary";
import _ from "lodash";
import { is_production } from "../utils/index.js";
import { ImageStorageError } from "../errors/index.js";
import { ProductDocument } from "../validator/schema.js";

dotenv.config();

type ImageData = {
	public_id: string;
	image_url: string;
};

interface ImageStorageAdapter {
	upload(file_path: string, options?: UpdateApiOptions): Promise<ImageData>;
	delete_folder(path: ImageData["public_id"]): Promise<void>;
	rename(from_public_id: string, to_public_id: string): Promise<ImageData>;
}

class CloudinaryAdapter implements ImageStorageAdapter {
	private _cloudinary_api_secret?: string;

	constructor() {
		cloudinary.config({
			cloud_name: "kokomi",
			api_key: "876668542584974",
			api_secret: process.env.CLOUDINARY_API_SECRET!,
		});
	}

	get cloudinary_api_secret() {
		if (this._cloudinary_api_secret) {
			return this._cloudinary_api_secret;
		}

		const secret = cloudinary.config().api_secret;

		if (!secret) {
			throw new Error("Cloudinary not initialized.");
		}

		this._cloudinary_api_secret = secret;

		return secret;
	}

	async upload(
		file_path: string,
		options?: UploadApiOptions
	): Promise<ImageData> {
		const result = await cloudinary.uploader.upload(file_path, options);

		return {
			public_id: result.public_id,
			image_url: result.secure_url,
		};
	}

	async delete_folder(path: string): Promise<void> {
		await cloudinary.api.delete_folder(path);
	}

	async rename(
		from_public_id: string,
		to_public_id: string
	): Promise<ImageData> {
		const result = await cloudinary.uploader.rename(
			from_public_id,
			to_public_id
		);

		return {
			public_id: result.public_id,
			image_url: result.secure_url,
		};
	}
}

class MockImageStorageAdapter implements ImageStorageAdapter {
	readonly mock_domain = "https://image.com";

	async upload(
		file_path: string,
		options?: UpdateApiOptions
	): Promise<ImageData> {
		const get_file_name = (file_path: string) => {
			const last_part = file_path.split("/").pop();

			const file_name = last_part?.split(".")[0] ?? "no-file-name";

			return file_name;
		};

		const image_id = _.random(1, 10000);

		const public_id = options?.folder
			? `${options.folder}/${image_id}-${get_file_name(file_path)}`
			: `default/${image_id}-${get_file_name(file_path)}`;

		return await Promise.resolve({
			public_id,
			image_url: `${this.mock_domain}/${public_id}.jpg`,
		});
	}

	async delete_folder(): Promise<void> {
		await Promise.resolve();
	}

	async rename(
		from_public_id: string,
		to_public_id: string
	): Promise<ImageData> {
		return {
			public_id: to_public_id,
			image_url: `${this.mock_domain}/${to_public_id}.jpg`,
		};
	}
}

class ImageStorageService {
	#adapter: ImageStorageAdapter;

	constructor() {
		this.#adapter = is_production
			? new CloudinaryAdapter()
			: new MockImageStorageAdapter();
	}

	async upload(
		public_id: string,
		options?: UploadApiOptions
	): Promise<ImageData> {
		try {
			return await this.#adapter.upload(public_id, options);
		} catch {
			throw new ImageStorageError("UPLOAD_FAILED");
		}
	}

	async delete_folder(folder_path: string): Promise<void> {
		try {
			return await this.#adapter.delete_folder(folder_path);
		} catch {
			throw new ImageStorageError("DELETE_FAILED");
		}
	}

	async rename(
		from_public_id: string,
		to_public_id: string
	): Promise<ImageData> {
		try {
			return await this.#adapter.rename(from_public_id, to_public_id);
		} catch {
			throw new ImageStorageError("RENAME_FAILED");
		}
	}
}

const image_storage_service = new ImageStorageService();

class ProductImageService {
	async upload_temp(file_path: string): Promise<ImageData> {
		const result = await image_storage_service.upload(file_path, {
			folder: "temp",
			tags: ["temporary"],
			invalidate: true,
		});

		return {
			public_id: result.public_id,
			image_url: result.image_url,
		};
	}

	async upload(product: ProductDocument): Promise<ProductDocument> {
		function get_new_public_id(temp_public_id: string): string {
			const image_name = temp_public_id.split("/").pop();

			return `products/${product.id}/${image_name}`;
		}

		try {
			const upload_thumbnail = image_storage_service.rename(
				product.thumbnail,
				get_new_public_id(product.thumbnail)
			);

			const upload_product_images = product.images.map(
				(image_temp_public_id) => {
					return image_storage_service.rename(
						image_temp_public_id,
						get_new_public_id(image_temp_public_id)
					);
				}
			);

			const [thubmnail, product_images] = await Promise.all([
				upload_thumbnail,
				Promise.all(upload_product_images),
			]);

			return {
				...product,
				thumbnail: thubmnail.public_id,
				images: product_images.map((image) => image.public_id),
			};
		} catch {
			throw new ImageStorageError("UPLOAD_FAILED");
		}
	}

	async delete(product_id: ProductDocument["id"]): Promise<void> {
		try {
			await image_storage_service.delete_folder(`products/${product_id}`);
		} catch {
			throw new ImageStorageError("DELETE_FAILED", {
				additional_message: "Failed to delete product images.",
			});
		}
	}
}

const product_image_service = new ProductImageService();

export { ImageStorageService, image_storage_service, product_image_service };
