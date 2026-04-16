const express = require("express");
const router = express.Router();
const products = require("../data/products");

// GET /api/products
// Returns the full list of products
router.get("/", (req, res) => {
  res.json(products);
});

// GET /api/products/:id
// Returns a single product by its ID
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));

  if (!product) {
    // 404 if no product matches the given ID
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
});

module.exports = router;
