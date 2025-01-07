import BaseError, { ErrorDetails } from "./base_error.js";
import {
	AuthErrorMessages,
	DatabaseErrorMessages,
	FileErrorMessages,
	ImageStorageErrorMessages,
	OrderErrorMessages,
	PaymentErrorMessages,
	PermissionErrorMessages,
	ResourceNotFoundErrorMessages,
	UnhandledErrorMessages,
	ValidationErrorMessages,
} from "./messages.js";

export class AuthError extends BaseError<typeof AuthErrorMessages> {
	constructor(
		error_code: keyof typeof AuthErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 401,
			error_code,
			error_type: "AUTH_ERROR",
			error_message: AuthErrorMessages[error_code],
			details,
		});
	}
}

export class DatabaseError extends BaseError<typeof DatabaseErrorMessages> {
	constructor(
		error_code: keyof typeof DatabaseErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 500,
			error_code,
			error_type: "DATABASE_ERROR",
			error_message: DatabaseErrorMessages[error_code],
			details,
		});
	}
}

export class FileError extends BaseError<typeof FileErrorMessages> {
	constructor(
		error_code: keyof typeof FileErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 400,
			error_code,
			error_type: "FILE_ERROR",
			error_message: FileErrorMessages[error_code],
			details,
		});
	}
}

export class OrderError extends BaseError<typeof OrderErrorMessages> {
	constructor(
		error_code: keyof typeof OrderErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 400,
			error_code,
			error_type: "ORDER_ERROR",
			error_message: OrderErrorMessages[error_code],
			details,
		});
	}
}

export class PaymentError extends BaseError<typeof PaymentErrorMessages> {
	constructor(
		error_code: keyof typeof PaymentErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 500,
			error_code,
			error_type: "PAYMENT_ERROR",
			error_message: PaymentErrorMessages[error_code],
			details,
		});
	}
}

export class ValidationError extends BaseError<typeof ValidationErrorMessages> {
	constructor(
		error_code: keyof typeof ValidationErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 400,
			error_type: "VALIDATION_ERROR",
			error_code,
			error_message: ValidationErrorMessages[error_code],
			details,
		});
	}
}

export class PermissionError extends BaseError<typeof PermissionErrorMessages> {
	constructor(
		error_code: keyof typeof PermissionErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 403,
			error_type: "PERMISSION_ERROR",
			error_code,
			error_message: PermissionErrorMessages[error_code],
			details,
		});
	}
}

export class ResourceNotFoundError extends BaseError<
	typeof ResourceNotFoundErrorMessages
> {
	constructor(
		error_code: keyof typeof ResourceNotFoundErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 404,
			error_type: "RESOURCE_NOT_FOUND_ERROR",
			error_code,
			error_message: ResourceNotFoundErrorMessages[error_code],
			details,
		});
	}
}

export class ImageStorageError extends BaseError<
	typeof ImageStorageErrorMessages
> {
	constructor(
		error_code: keyof typeof ImageStorageErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 404,
			error_type: "IMAGE_STORAGE_ERROR",
			error_code,
			error_message: ImageStorageErrorMessages[error_code],
			details,
		});
	}
}

export class UnhandledError extends BaseError<typeof UnhandledErrorMessages> {
	constructor(
		error_code: keyof typeof UnhandledErrorMessages,
		details: ErrorDetails = {}
	) {
		super({
			status: 500,
			error_type: "UNHANDLED_ERROR",
			error_code,
			error_message: UnhandledErrorMessages[error_code],
			details,
		});
	}
}
