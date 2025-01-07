import { TestAppRequest, TestErrorResponse } from "../utils.js";
import { TestProductsRouteResponse } from "./helpers.js";
import { mock_invalid_format_image_file_path, mock_invalid_size_image_file_path, mock_product_image_1_file_path, mock_product_image_2_file_path } from "./mock.js";

describe("POST /products/upload-main", () => {
  test("should return file error, uploading large size image", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req
      .login("ADMIN")
      .attach("images", mock_invalid_size_image_file_path)
      .send();

    new TestErrorResponse(res).file_error();
  });

  test("should return file error, uploading invalid format image", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    try {
      await req
        .login("ADMIN")
        .attach("images", mock_invalid_format_image_file_path)
        .send();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toContain("Aborted");
      }
    }
  });

  test("admin should upload product images", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req
      .login("ADMIN")
      .attach("images", mock_product_image_1_file_path)
      .attach("images", mock_product_image_2_file_path)
      .send();

    new TestProductsRouteResponse(res).uploaded_product_images(
      mock_product_image_1_file_path,
      mock_product_image_2_file_path
    );
  });

  test("moderator should return permission error when uploading product images", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req.login("MODERATOR").send();

    new TestErrorResponse(res).permission_error();
  });

  test("seller should upload product images", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req
      .login("SELLER")
      .attach("images", mock_product_image_1_file_path)
      .attach("images", mock_product_image_2_file_path)
      .send();

    new TestProductsRouteResponse(res).uploaded_product_images(
      mock_product_image_1_file_path,
      mock_product_image_2_file_path
    );
  });

  test("buyer should return permission error when uploading product images", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req.login("BUYER").send();

    new TestErrorResponse(res).permission_error();
  });

  test("unregistered user should return permission error when uploading product images", async () => {
    const req = new TestAppRequest("POST", "/products/upload-main");

    const res = await req.login("UNREGISTERED").send();

    new TestErrorResponse(res).permission_error();
  });
});
