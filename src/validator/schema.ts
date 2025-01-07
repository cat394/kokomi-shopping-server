import { z } from "zod";
import {
	trimmed_string,
	document_id,
	user_input_string,
	positive_int,
	datetime_string,
	url_format,
} from "./utils.js";
import { Timestamp } from "firebase-admin/firestore";
import { DocumentResponse } from "../utils/firestore.js";

export type BaseDocumentFields = {
	id: string;
	created_at: Timestamp;
	updated_at: Timestamp;
};

export type DocumentToCreate<T extends object> = Omit<
	T,
	keyof BaseDocumentFields
>;

export type UserDocument = BaseDocumentFields & z.infer<typeof UserSchema>;

export type CartUpdated = z.infer<typeof CartUpdatedSchema>;

export type CartItemDocument = BaseDocumentFields & {
	quantity: number;
};

export type CartPopulated = Omit<
	DocumentResponse<CartItemDocument>,
	"id" | "created_at" | "updated_at"
> & {
	product: DocumentResponse<ProductDocument>;
};

export type CartDocument = CartItemDocument[];

export type ProductDocument = BaseDocumentFields &
	z.infer<typeof ProductSchema>;

export type Address = z.infer<typeof AddressSchema>;

type OrderProducts = {
	[seller_id: string]: {
		product: DocumentResponse<ProductDocument>;
		quantity: number;
	}[];
};

export type OrderDocument = BaseDocumentFields &
	z.infer<typeof OrderStatusSchema> & {
		amount_total: number;
		shipping_address: Address;
		session_id?: string;
	};

export type BuyerOrderDocument = OrderDocument & {
	products: OrderProducts;
};

export type SellerOrderDocument = OrderDocument & {
	buyer_id: string;
	products: BuyerOrderDocument["products"][string];
};

export type ReviewDocument = BaseDocumentFields &
	z.infer<typeof ReviewSchema> & { author_id: string };

export type ShippingDocument = BaseDocumentFields &
	z.infer<typeof ShippingDetailsSchema>;

export type PaymentDetail = z.infer<typeof PaymentSchema>;

export type AccessRights = z.infer<typeof AccessRightsSchema>["access_rights"];

export type PrivilegedUserDocument = BaseDocumentFields &
	z.infer<typeof PrivilegedUserSchema>;

export type UserToCreate = DocumentToCreate<UserDocument>;

export type PrivilegedUserToCreate =
	DocumentToCreate<PrivilegedUserDocument> & { id: string };

export type ProductToCreate = DocumentToCreate<ProductDocument>;

export type CartToCreate = DocumentToCreate<CartItemDocument>;

export type ReviewToCreate = Omit<
	DocumentToCreate<ReviewDocument>,
	"author_id"
>;

export type ShippingToCreate = DocumentToCreate<ShippingDocument>;

export const CreatedBySchema = z.object({
	created_by: document_id,
});

const UserRoleSchema = z.enum(["buyer", "seller"]);

export const AccessRightsSchema = z.object({
	access_rights: z.enum(["admin", "moderator"]),
});

export const OrderStatusSchema = z.object({
	status: z.enum(["unpaid", "paid", "shipped", "delivered"]),
});

const AddressSchema = z.object({
	recipient_name: user_input_string,
	zip_code: trimmed_string.regex(/^\d{3}-\d{4}$/),
	address: z.object({
		address1: user_input_string,
		address2: user_input_string,
		address3: user_input_string,
	}),
});

export const PrivilegedUserSchema = z.object({
	id: user_input_string,
	name: user_input_string,
	email: z.string().email(),
	access_rights: z.enum(["admin", "moderator"]),
});

export const UserSchema = z.object({
	name: user_input_string,
	email: z.string().email(),
	addresses: z.array(AddressSchema.extend({ default: z.boolean() })).nonempty(),
	role: UserRoleSchema,
});

export const ProductSchema = z
	.object({
		name: user_input_string,
		thumbnail: user_input_string,
		images: z.array(user_input_string),
		short_description: user_input_string.pipe(z.string().min(5)),
		long_description: user_input_string.pipe(z.string().min(10)),
		price: positive_int.min(100),
		category_id: user_input_string,
		stock: positive_int,
	})
	.merge(CreatedBySchema);

export const CartUpdatedSchema = z.object({
	product_id: document_id,
	quantity: positive_int,
});

export const ReviewSchema = z.object({
	product_id: document_id,
	title: user_input_string.pipe(z.string().min(5)),
	description: user_input_string,
});

export const ShippingDetailsSchema = z.object({
	tracking_number: positive_int,
	carrier: user_input_string,
	status: z.enum(["shipped", "in transit", "delivered"]),
	estimated_delivery_start: datetime_string,
	estimated_delivery_end: datetime_string,
});

export const PaymentSchema = z.object({
	shipping_address: AddressSchema,
	success_url: url_format,
	cancel_url: url_format,
});
