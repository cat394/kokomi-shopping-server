import { TestAppRequest, TestErrorResponse } from "../utils.js";
import { TestProductsRouteResponse } from "./helpers.js";
import { mock_invalid_format_image_file_path, mock_invalid_size_image_file_path, mock_thumbnail_file_path } from "./mock.js";

describe("POST /products/upload-thumb", () => {
  test("should return file error, uploading large size image", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req
      .login("ADMIN")
      .attach("thumbnail", mock_invalid_size_image_file_path)
      .send();

    new TestErrorResponse(res).file_error();
  });

  test("should return aborted error, uploading invalid format image", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    try {
      await req
        .login("ADMIN")
        .attach("thumbnail", mock_invalid_format_image_file_path)
        .send();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe("Aborted");
      }
    }
  });

  test("admin should upload thumbnail", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req
      .login("ADMIN")
      .attach("thumbnail", mock_thumbnail_file_path)
      .send();

    new TestProductsRouteResponse(res).uploaded_thumbnail();
  });

  test("moderator should return permission error when uploading thumbnail", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req.login("MODERATOR").send();

    new TestErrorResponse(res).permission_error();
  });

  test("seller should upload thumbnail", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req
      .login("SELLER")
      .attach("thumbnail", mock_thumbnail_file_path)
      .send();

    new TestProductsRouteResponse(res).uploaded_thumbnail();
  });

  test("buyer should return permission error when uploading thumbnail", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req.login("BUYER").send();

    new TestErrorResponse(res).permission_error();
  });

  test("unregistered user should return permission error when uploading thumbnail", async () => {
    const req = new TestAppRequest("POST", "/products/upload-thumb");

    const res = await req.login("UNREGISTERED").send();

    new TestErrorResponse(res).permission_error();
  });
});
