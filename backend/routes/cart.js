const express = require("express");
const router = express.Router();
const products = require("../data/products");

// In-memory cart — resets on server restart
// In production you'd use a database or session store
let cart = [];

function resetCart() {
  cart = [];
}

// GET /api/cart
// Returns the current cart contents
router.get("/", (req, res) => {
  res.json(cart);
});

// POST /api/cart
// Adds a product to the cart, or increments quantity if it already exists
router.post("/", (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Validate that productId was provided
  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  // Check that the product actually exists in our catalog
  const product = products.find((p) => p.id === parseInt(productId));
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // If the item is already in the cart, just increase its quantity
  const existingItem = cart.find((item) => item.productId === parseInt(productId));
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // Otherwise add a new cart entry
    cart.push({ productId: parseInt(productId), quantity, product });
  }

  res.status(200).json({ message: "Cart updated", cart });
});

// DELETE /api/cart/:productId
// Removes a product from the cart entirely
router.delete("/:productId", (req, res) => {
  const productId = parseInt(req.params.productId);
  cart = cart.filter((item) => item.productId !== productId);
  res.json({ message: "Item removed", cart });
});

// PUT /api/cart/:productId
// Updates the quantity of a specific cart item
router.put("/:productId", (req, res) => {
  const productId = parseInt(req.params.productId);
  const { quantity } = req.body;

  const item = cart.find((item) => item.productId === productId);
  if (!item) {
    return res.status(404).json({ message: "Item not in cart" });
  }

  if (quantity <= 0) {
    // Remove the item if quantity drops to zero or below
    cart = cart.filter((item) => item.productId !== productId);
  } else {
    item.quantity = quantity;
  }

  res.json({ message: "Cart updated", cart });
});

module.exports = router;
module.exports.resetCart = resetCart;
