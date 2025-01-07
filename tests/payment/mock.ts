import { PaymentDetail } from "../../src/validator/schema.js";

export const mock_payment: PaymentDetail = {
	shipping_address: {
		address: {
			address1: "address-1",
			address2: "address-2",
			address3: "address-3",
		},
		recipient_name: "bob",
		zip_code: "123-4567",
	},
	success_url: "https://test.com/success",
	cancel_url: "https://test.com/cancel",
};

export const mock_invalid_payment: PaymentDetail = {
	shipping_address: {
		address: {
			address1: "address-1",
			address2: "address-2",
			address3: "address-3",
		},
		recipient_name: "",
		zip_code: "",
	},
	success_url: "",
	cancel_url: "",
};
