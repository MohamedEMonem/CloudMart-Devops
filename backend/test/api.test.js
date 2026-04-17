const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");
const { resetCart } = require("../routes/cart");

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => resolve(server));
  });
}

async function request(server, path, options = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

test.beforeEach(() => {
  resetCart();
});

test("health endpoint reports ok", async () => {
  const server = await startServer();

  try {
    const { response, body } = await request(server, "/health");

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.ok(body.timestamp);
  } finally {
    server.close();
  }
});

test("products endpoint returns seeded catalog", async () => {
  const server = await startServer();

  try {
    const { response, body } = await request(server, "/api/products");

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.length > 0);
    assert.equal(body[0].id, 1);
  } finally {
    server.close();
  }
});

test("cart lifecycle supports add and remove", async () => {
  const server = await startServer();

  try {
    let result = await request(server, "/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId: 1, quantity: 2 }),
    });

    assert.equal(result.response.status, 200);
    assert.equal(result.body.cart.length, 1);
    assert.equal(result.body.cart[0].quantity, 2);

    result = await request(server, "/api/cart/1", { method: "DELETE" });

    assert.equal(result.response.status, 200);
    assert.equal(result.body.cart.length, 0);
  } finally {
    server.close();
  }
});