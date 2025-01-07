export type ErrorType =
	| "FIREBASE_ERROR"
	| "STRIPE_ERROR"
	| "AUTH_ERROR"
	| "DATABASE_ERROR"
	| "PAYMENT_ERROR"
	| "ORDER_ERROR"
	| "VALIDATION_ERROR"
	| "PERMISSION_ERROR"
	| "UNKNOWN_ERROR"
	| "FILE_ERROR"
	| "RESOURCE_NOT_FOUND_ERROR"
	| "UNHANDLED_ERROR"
	| "IMAGE_STORAGE_ERROR";

export type ErrorDetails = Partial<{
	bubbled_error: unknown;
	additional_message: string;
}>;

export type BaseErrorArgs<ErrorEnum> = {
	status: number;
	error_type: ErrorType;
	error_code: keyof ErrorEnum;
	error_message: ErrorEnum[keyof ErrorEnum];
	details: ErrorDetails;
};

export default class BaseError<ErrorMessages> extends Error {
	readonly status: number;
	readonly error_code: string;
	readonly error_type: ErrorType;
	readonly bubbled_error: ErrorDetails["bubbled_error"];

	constructor({
		status,
		error_type,
		error_code,
		error_message,
		details,
	}: BaseErrorArgs<ErrorMessages>) {
		super();

		this.status = status;

		this.error_type = error_type;

		this.error_code = error_code as string;

		this.message = error_message + " " + (details.additional_message ?? "");

		this.bubbled_error = details.bubbled_error;
	}
}
