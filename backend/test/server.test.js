const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../server");

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        let responseBody = "";

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: responseBody ? JSON.parse(responseBody) : null,
          });
        });
      }
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

test("backend API responds with expected health and catalog data", async () => {
  const server = app.listen(0);

  try {
    const health = await request(server, "GET", "/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.status, "ok");
    assert.match(health.body.timestamp, /\d{4}-\d{2}-\d{2}T/);

    const products = await request(server, "GET", "/api/products");
    assert.equal(products.status, 200);
    assert.ok(Array.isArray(products.body));
    assert.ok(products.body.length > 0);

    const product = await request(server, "GET", "/api/products/1");
    assert.equal(product.status, 200);
    assert.equal(product.body.id, 1);

    const missingProduct = await request(server, "GET", "/api/products/9999");
    assert.equal(missingProduct.status, 404);
    assert.equal(missingProduct.body.message, "Product not found");

    const cartValidation = await request(server, "POST", "/api/cart", { quantity: 1 });
    assert.equal(cartValidation.status, 400);
    assert.equal(cartValidation.body.message, "productId is required");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});