import { clear_mock_orders, set_mock_reviews } from "../users/helpers.js"
import { mock_buyer_review, mock_other_user_review } from "../users/mocks.js";
import { TestAppRequest, TestDatabaseResponse } from "../utils.js";

describe("GET /reviews", () => {
  beforeAll(async () => await set_mock_reviews());
  afterAll(async () => await clear_mock_orders());

  test("Admin should retrieve reviews", async () => {
    const req = new TestAppRequest("GET", "/reviews");

    const res = await req.login("ADMIN").send();

    new TestDatabaseResponse(res).retrieved_list([mock_buyer_review, mock_other_user_review]);
  });

  test("Moderator should retrieve reviews", async () => {
    const req = new TestAppRequest("GET", "/reviews");

    const res = await req.login("MODERATOR").send();

    new TestDatabaseResponse(res).retrieved_list([mock_buyer_review, mock_other_user_review]);
  });

  test("Buyer should retrieve reviews", async () => {
    const req = new TestAppRequest("GET", "/reviews");

    const res = await req.login("BUYER").send();

    new TestDatabaseResponse(res).retrieved_list([mock_buyer_review, mock_other_user_review]);
  });

  test("Admin should retrieve reviews", async () => {
    const req = new TestAppRequest("GET", "/reviews");

    const res = await req.login("SELLER").send();

    new TestDatabaseResponse(res).retrieved_list([mock_buyer_review, mock_other_user_review]);
  });
})