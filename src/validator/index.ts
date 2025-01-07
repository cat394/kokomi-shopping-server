import { z, ZodRawShape } from "zod";
import { ValidationError } from "../errors/index.js";
import {
	CartUpdatedSchema,
	OrderStatusSchema,
	PaymentSchema,
	PrivilegedUserSchema,
	ProductSchema,
	ProductToCreate,
	ReviewSchema,
	UserSchema,
} from "./schema.js";

export class BodyValidator<T extends z.ZodObject<ZodRawShape>> {
	constructor(private readonly schema: T) {}

	static format_zod_error(err: z.ZodError): string {
		return err.errors
			.map((err) => `${err.path.join(".")} - ${err.message}`)
			.join(", ");
	}

	validate(data: unknown): z.infer<T> {
		const validation_result = this.schema.safeParse(data);

		if (!validation_result.success) {
			const error_message = BodyValidator.format_zod_error(
				validation_result.error
			);

			throw new ValidationError("BODY_VALIDATION_ERROR", {
				additional_message: error_message,
			});
		}

		return validation_result.data;
	}

	partial_validate(data: unknown): Partial<z.infer<T>> {
		const validation_result = this.schema.partial().safeParse(data);

		if (!validation_result.success) {
			const error_message = BodyValidator.format_zod_error(
				validation_result.error
			);

			throw new ValidationError("BODY_VALIDATION_ERROR", {
				additional_message: error_message,
			});
		}

		return validation_result.data;
	}
}

class ProductBodyValidator extends BodyValidator<typeof ProductSchema> {
	constructor() {
		super(ProductSchema);
	}

	override validate(data: unknown): ProductToCreate {
		const schema_validation_result = super.validate(data);

		return schema_validation_result;
	}
}

const user_validator = new BodyValidator(UserSchema);

const user_updated_validator = new BodyValidator(
	UserSchema.omit({ role: true })
);

const cart_updated_validator = new BodyValidator(CartUpdatedSchema);

const product_validator = new ProductBodyValidator();

const review_validator = new BodyValidator(ReviewSchema);

const payment_validator = new BodyValidator(PaymentSchema);

const privileged_user_validator = new BodyValidator(PrivilegedUserSchema);

const order_status_validator = new BodyValidator(OrderStatusSchema);

const validator = {
	user: user_validator,
	user_updated: user_updated_validator,
	cart_updated: cart_updated_validator,
	product: product_validator,
	review: review_validator,
	payment: payment_validator,
	order_status: order_status_validator,
	privileged_user: privileged_user_validator,
};

export default validator;
