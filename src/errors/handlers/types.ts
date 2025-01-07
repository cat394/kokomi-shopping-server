import type { ErrorType } from "../base_error.js";

export type ErrorResponse = {
	error_type: ErrorType;
	message: string;
};
