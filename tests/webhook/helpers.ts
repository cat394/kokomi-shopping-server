import { MethodName, TestAppRequest } from "../utils.js";

export class WebhookRouteRequest extends TestAppRequest{
  constructor(method_name: MethodName, endpoint: string) {
    super(method_name, endpoint);
  }

  with_stripe_signature() {
    this.request.set("stripe-signature", "mock");

    return this;
  }
}