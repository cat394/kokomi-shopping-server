export enum AuthErrorMessages {
	NO_AUTHORIZATION_TOKEN = "Request header missing authorization token.",
	NO_BEARER_TOKEN = "Token should be in the format 'Bearer <USER_TOKEN>'. Ensure there is a space after 'Bearer'.",
	INVALID_TOKEN = "Authorization token is invalid.",
	NO_ACCESS_RIGHTS = "Access denied. Insufficient permissions.",
	CUSTOM_CLAIMS_CREATION_FAILED = "Failed to create custom claims.",
}

export enum DatabaseErrorMessages {
	CREATE_FAILED = "Data creation failed.",
	UPDATE_FAILED = "Data update failed.",
	RETRIEVE_FAILED = "Data retrieval failed.",
	DELETE_FAILED = "Data deletion failed.",
	TRANSACTION_FAILED = "Transaction process encountered an error.",
	UNPAID_ORDER_DELETE_FAILED = "Failed to delete unpaid order.",
}

export enum FileErrorMessages {
	FILE_NOT_EXIST = "Please attach a file to your request.",
	UPLOAD_FAILED = "File upload failed.",
	DELETE_FAILED = "File deletion failed.",
	INVALID_FORMAT = "Unsupported file format.",
	RENAME_FAILED = "Failed to rename the file reference.",
}

export enum OrderErrorMessages {
	PRODUCT_NOT_FOUND = "The requested product could not be found.",
	OUT_OF_STOCK = "Requested quantity exceeds available stock.",
}

export enum PaymentErrorMessages {
	SESSION_CREATION_FAILED = "Payment session creation failed.",
	MISSING_SIGNATURE = "Payment signature is missing.",
	INVALID_SIGNATURE = "Payment signature is invalid.",
	MISSING_METADATA = "Required payment metadata is missing.",
	UNHANDLED_EVENT = "Unhandled event type.",
	EMPTY_CART = "There are no products in your cart.",
}

export enum PermissionErrorMessages {
	PERMISSION_DENIED = "You lack the permission to perform this action.",
	ROLE_PERMISSION_DENIED = "Your role does not permit this action.",
	RESOURCE_OWNER_ERROR = "You are not the owner of this resource.",
}

export enum ValidationErrorMessages {
	BODY_VALIDATION_ERROR = "Request body validation failed.",
}

export enum ResourceNotFoundErrorMessages {
	USER_DATA_NOT_FOUND = "Your data could not be found.",
	PRODUCT_NOT_FOUND = "The product you are looking for could not be found.",
}

export enum ImageStorageErrorMessages {
	UPLOAD_FAILED = "Image upload failed.",
	DELETE_FAILED = "Image folder deletion failed.",
	INVALID_SIGNATURE = "Image signature is invalid.",
	INVALID_URL = "Invalid image URL format.",
	THUMBNAIL_UPLOAD_FAILED = "Thumbnail upload failed.",
	PRODUCT_IMAGES_UPLOAD_FAILED = "Product images upload failed.",
	PRODUCT_FOLDER_DELETE_FAILED = "Failed to delete product images folder.",
	RENAME_FAILED = "Image URL persistence failed."
}

export enum UnhandledErrorMessages {
	UNHANDLED_ERROR = "Unhandled error occured.",
	ROUTE_ERROR = "Something went wrong at the route destination.",
}
