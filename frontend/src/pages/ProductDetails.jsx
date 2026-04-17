import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import StarRating from "../components/StarRating";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, loading: cartLoading } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  // Active tab — kept as state so we could add multiple images later
  const [activeTab, setActiveTab] = useState("description");
  const addedResetTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError("Product not found or server is offline."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity);
    setAdded(true);

    if (addedResetTimer.current) {
      clearTimeout(addedResetTimer.current);
    }

    addedResetTimer.current = setTimeout(() => setAdded(false), 2500);
  };

  useEffect(() => {
    return () => {
      if (addedResetTimer.current) {
        clearTimeout(addedResetTimer.current);
      }
    };
  }, []);

  // ── Loading skeleton ──
  if (loading)
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-6 md:flex gap-10 animate-pulse">
          <div className="w-full md:w-96 h-80 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 mt-6 md:mt-0 space-y-4">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mt-6" />
          </div>
        </div>
      </main>
    );

  if (error)
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Link to="/" className="text-navy-700 underline font-medium">← Back to products</Link>
      </div>
    );

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-navy-700 transition">Home</Link>
        <span>/</span>
        <span className="text-gray-400">{product.category}</span>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </nav>

      {/* ── Main product card ── */}
      <div className="bg-white rounded-2xl shadow-md p-6 md:flex gap-10">

        {/* Product image */}
        <div className="md:w-96 flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-80 object-cover rounded-2xl shadow-sm"
          />
        </div>

        {/* Product details */}
        <div className="mt-6 md:mt-0 flex flex-col flex-1">

          {/* Category + name */}
          <span className="text-xs font-bold text-navy-700 uppercase tracking-widest">
            {product.category}
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Rating row */}
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.rating} size="lg" />
            <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {/* Crossed-out "was" price — cosmetic, for learning UI purposes */}
            <span className="text-lg text-gray-400 line-through">
              ${(product.price * 1.2).toFixed(2)}
            </span>
            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              17% off
            </span>
          </div>

          {/* Stock status */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
            <p className={`text-sm font-medium ${product.stock < 5 ? "text-red-500" : "text-green-600"}`}>
              {product.stock === 0
                ? "Out of stock"
                : product.stock < 5
                ? `Only ${product.stock} left!`
                : `In stock (${product.stock} available)`}
            </p>
          </div>

          {/* Quick-feature icons */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: "🚚", label: "Free Shipping" },
              { icon: "↩️", label: "30-Day Returns" },
              { icon: "🛡️", label: "2-Year Warranty" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl p-3 text-center">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-500 mt-1 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Quantity picker + Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition text-lg font-semibold"
              >−</button>
              <span className="px-5 py-2.5 font-bold text-lg border-x border-gray-300">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition text-lg font-semibold disabled:opacity-30"
              >+</button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={cartLoading || product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                text-white font-bold text-base transition-all duration-200 shadow-md
                ${added
                  ? "bg-green-500"
                  : "bg-navy-700 hover:bg-navy-800 active:scale-95 disabled:opacity-50"
                }`}
            >
              {added ? (
                <>✓ Added to Cart!</>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Specs / Reviews ── */}
      <div className="mt-8 bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          {["description", "specs", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-navy-700 text-navy-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "description" && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {activeTab === "specs" && (
            <table className="w-full text-sm text-gray-600">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Category", product.category],
                  ["Price", `$${product.price.toFixed(2)}`],
                  ["Stock", `${product.stock} units`],
                  ["Rating", `${product.rating} / 5`],
                  ["Reviews", `${product.reviewCount} customer reviews`],
                  ["Shipping", "Free standard shipping"],
                  ["Returns", "30-day return policy"],
                ].map(([key, val]) => (
                  <tr key={key}>
                    <td className="py-2.5 pr-4 font-semibold text-gray-700 w-40">{key}</td>
                    <td className="py-2.5 text-gray-500">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {/* Static sample reviews — replace with real review data later */}
              {[
                { name: "Alex M.", stars: 5, text: "Absolutely love this product! Great quality and fast shipping.", date: "March 2025" },
                { name: "Sara K.", stars: 4, text: "Really good value for the price. Would buy again.", date: "February 2025" },
                { name: "Omar T.", stars: 4, text: "Solid build quality. Minor packaging issue but product is perfect.", date: "January 2025" },
              ].map((r) => (
                <div key={r.name} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{r.name}</span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <StarRating rating={r.stars} />
                  <p className="mt-2 text-sm text-gray-600">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-gray-400 hover:text-navy-700 transition">
          ← Continue Shopping
        </Link>
      </div>
    </main>
  );
}
