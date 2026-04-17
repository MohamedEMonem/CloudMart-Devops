const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the React dev server (port 5173) and any other origin
// In production, restrict this to your actual frontend domain
app.use(cors({ origin: "*" }));

// Parse incoming JSON request bodies (needed for POST/PUT endpoints)
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────

// All product-related endpoints are prefixed with /api/products
app.use("/api/products", productRoutes);

// All cart-related endpoints are prefixed with /api/cart
app.use("/api/cart", cartRoutes);

// Health-check endpoint — useful for Docker / load-balancer probes
app.get("/health", (req, res) => {
  res.json({ status: "okkkk", timestamp: new Date().toISOString() });
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
