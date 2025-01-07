import dotenv from "dotenv";
import Stripe from "stripe";
import { is_production } from "./utils/index.js";

dotenv.config();

function get_stripe_api_secret(): string {
	const secret = (
		is_production
			? process.env.STRIPE_API_SECRET
			: process.env.STRIPE_TEST_API_SECRET
	) as string;

	return secret;
}

const stripe = new Stripe(get_stripe_api_secret());

export default stripe;
