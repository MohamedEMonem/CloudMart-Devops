const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;