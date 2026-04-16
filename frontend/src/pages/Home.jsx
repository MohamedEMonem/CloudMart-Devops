import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import StarRating from "../components/StarRating";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

const CATEGORY_ICONS = {
  All: "🛍️", Electronics: "💻", Footwear: "👟",
  Bags: "👜", Accessories: "🕶️", Kitchen: "☕",
  Sports: "🏋️", Home: "🏠",
};

// Featured category tiles — static, decoupled from live API
const FEATURED_CATEGORIES = [
  {
    name: "Electronics",
    tagline: "Cutting-edge gadgets",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    bg: "from-navy-700 to-navy-900",
  },
  {
    name: "Footwear",
    tagline: "Step in style",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    bg: "from-gray-700 to-black",
  },
  {
    name: "Bags",
    tagline: "Carry it beautifully",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    bg: "from-navy-600 to-navy-950",
  },
  {
    name: "Accessories",
    tagline: "Finish your look",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    bg: "from-gray-800 to-navy-950",
  },
];

// Promotional offer cards
const PROMOS = [
  {
    icon: "🚚",
    title: "Free Shipping",
    desc: "On all orders over $50. No minimums on your first purchase.",
    color: "bg-navy-50 border-navy-100",
    accent: "text-navy-700",
  },
  {
    icon: "🎁",
    title: "Welcome Discount",
    desc: "Use code NEST20 at checkout for 20% off your first order.",
    color: "bg-gray-100 border-gray-200",
    accent: "text-navy-700",
  },
  {
    icon: "↩️",
    title: "30-Day Returns",
    desc: "Not happy? Return anything within 30 days, no questions asked.",
    color: "bg-navy-50 border-navy-100",
    accent: "text-navy-700",
  },
  {
    icon: "🛡️",
    title: "2-Year Warranty",
    desc: "Every product is backed by our comprehensive 2-year warranty.",
    color: "bg-gray-100 border-gray-200",
    accent: "text-gray-700",
  },
];

// Static customer testimonials
const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    location: "New York, USA",
    avatar: "SM",
    rating: 5,
    text: "CloudMart has completely changed how I shop online. The product quality is outstanding and delivery was faster than expected. I'll be a customer for life!",
    product: "Wireless Headphones",
    avatarBg: "bg-navy-700",
  },
  {
    name: "Omar Al-Rashid",
    location: "Dubai, UAE",
    avatar: "OR",
    rating: 5,
    text: "Incredible selection and unbeatable prices. The checkout process is smooth, the packaging was beautiful, and customer support replied within minutes.",
    product: "Mechanical Keyboard",
    avatarBg: "bg-navy-900",
  },
  {
    name: "Priya Sharma",
    location: "Mumbai, India",
    avatar: "PS",
    rating: 4,
    text: "I was skeptical at first, but the Smart Watch I ordered exceeded all my expectations. The build quality rivals brands twice the price. Highly recommended!",
    product: "Smart Watch",
    avatarBg: "bg-navy-800",
  },
];

// Brand logos — duplicated in JSX to create a seamless marquee loop
const BRANDS = [
  "Sony", "Apple", "Samsung", "Logitech", "Bose",
  "Nike", "Canon", "JBL", "Anker", "Dell",
  "Philips", "Beats", "Adidas", "Fujifilm", "Razer",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [products, setProducts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [category, setCategory]   = useState("All");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Fetch all products once on mount
  useEffect(() => {
    api.get("/products")
      .then(({ data }) => { setProducts(data); setFiltered(data); })
      .catch(() => setError("Failed to load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  // Category filter + page reset
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  useEffect(() => {
    setFiltered(category === "All" ? products : products.filter((p) => p.category === category));
    setPage(1);
  }, [category, products]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Best sellers = top 4 products sorted by rating
  const bestSellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);

  // ── Loading skeleton (full-page) ──────────────────────────────────────────
  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow animate-pulse">
              <div className="h-52 bg-gray-200 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/20 backdrop-blur text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              New arrivals every week
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Discover Products<br />You'll Love
            </h1>
            <p className="mt-4 text-navy-200 max-w-md">
              Quality goods, honest prices, fast delivery. CloudMart is your one-stop store for everything you need.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => document.getElementById("products-section").scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 bg-white text-navy-900 font-semibold
                  px-6 py-3 rounded-xl shadow-lg hover:bg-navy-50 transition-colors duration-200"
              >
                Shop Now
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => document.getElementById("best-sellers").scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 border border-white/40 hover:border-white
                  text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
              >
                Best Sellers
              </button>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex-1 grid grid-cols-2 gap-4 max-w-xs w-full">
            {[
              { label: "Products", value: `${products.length}+` },
              { label: "Categories", value: `${categories.length - 1}` },
              { label: "Happy Customers", value: "2,400+" },
              { label: "Free Shipping", value: "Always" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                <div className="text-2xl font-extrabold">{value}</div>
                <div className="text-xs text-navy-200 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FEATURED CATEGORIES
          Four colourful tiles — clicking a tile sets the category filter below
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-navy-600 uppercase tracking-widest">Browse</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Featured Categories</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Find exactly what you're looking for — we've sorted our best products into easy-to-browse collections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_CATEGORIES.map(({ name, tagline, image, bg }) => (
              <button
                key={name}
                onClick={() => {
                  setCategory(name);
                  document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl
                  transition-shadow duration-300 text-left h-52 focus:outline-none"
              >
                {/* Background image */}
                <img
                  src={image}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110
                    transition-transform duration-500"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${bg} opacity-75 group-hover:opacity-85 transition-opacity`} />

                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{tagline}</p>
                  <h3 className="text-xl font-extrabold mt-0.5">{name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium mt-1 opacity-90">
                    Shop now →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. PROMOTIONAL OFFERS
          Four benefit cards in a soft-coloured grid
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-navy-600 uppercase tracking-widest">Why CloudMart</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Our Promises to You</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROMOS.map(({ icon, title, desc, color, accent }) => (
              <div
                key={title}
                className={`${color} border rounded-2xl p-6 flex flex-col items-start gap-3
                  hover:shadow-md transition-shadow duration-200`}
              >
                <span className="text-4xl">{icon}</span>
                <h3 className={`text-lg font-bold ${accent}`}>{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Promo banner strip */}
          <div className="mt-8 bg-gradient-to-r from-navy-800 to-navy-900 rounded-2xl p-6
            flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-navy-200">Limited Time</p>
              <h3 className="text-2xl font-extrabold mt-0.5">Get 20% Off Your First Order</h3>
              <p className="text-navy-200 text-sm mt-1">Use code <strong className="text-white">NEST20</strong> at checkout. New customers only.</p>
            </div>
            <button
              onClick={() => document.getElementById("products-section").scrollIntoView({ behavior: "smooth" })}
              className="flex-shrink-0 bg-white text-navy-900 font-bold px-6 py-3 rounded-xl
                hover:bg-navy-50 transition-colors shadow whitespace-nowrap"
            >
              Claim Offer →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. BEST SELLERS
          Top 4 products by rating — dynamically derived from the API response
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="best-sellers" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-navy-600 uppercase tracking-widest">Top Rated</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Best Sellers</h2>
              <p className="text-gray-500 text-sm mt-1">Our highest-rated products, loved by thousands of customers.</p>
            </div>
            <button
              onClick={() => {
                setCategory("All");
                document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold
                text-navy-700 hover:text-navy-900 border border-navy-200 hover:border-navy-400
                px-4 py-2 rounded-xl transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((product, idx) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white border border-gray-100 rounded-2xl shadow-sm
                  hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                {/* Rank badge */}
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center
                    text-xs font-extrabold text-white shadow
                    ${idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : "bg-navy-700"}`}>
                    #{idx + 1}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <span className="text-xs text-navy-600 font-bold uppercase tracking-widest">{product.category}</span>
                  <h3 className="mt-1 font-bold text-gray-900 text-sm leading-snug line-clamp-1
                    group-hover:text-navy-900 transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1">
                    <StarRating rating={product.rating} />
                    <span className="text-xs text-gray-400">({product.reviewCount})</span>
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-navy-700 bg-navy-50
                      px-2 py-1 rounded-lg">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. BRAND LOGOS MARQUEE
          Infinite-scrolling strip of brand names.
          The list is duplicated so the loop is perfectly seamless.
          CSS animation defined in index.css (.animate-marquee).
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 overflow-hidden border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Trusted Brands We Carry
          </span>
        </div>

        {/* Outer container clips overflow; inner track slides left */}
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee gap-0 whitespace-nowrap">
            {/* Two identical sets = one seamless loop */}
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span
                key={i}
                className="inline-flex items-center mx-8 text-2xl font-extrabold tracking-tight
                  text-gray-300 hover:text-navy-600 transition-colors duration-200 cursor-default
                  select-none"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. CUSTOMER TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-navy-600 uppercase tracking-widest">Reviews</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">What Our Customers Say</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Real reviews from real shoppers. We never filter or edit them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, location, avatar, rating, text, product, avatarBg }) => (
              <div
                key={name}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col gap-4
                  hover:shadow-md transition-shadow duration-200"
              >
                {/* Stars */}
                <StarRating rating={rating} />

                {/* Review text */}
                <p className="text-gray-600 text-sm leading-relaxed flex-1">"{text}"</p>

                {/* Product tag */}
                <span className="inline-block self-start text-xs font-semibold text-navy-700
                  bg-navy-50 px-2.5 py-1 rounded-full">
                  Purchased: {product}
                </span>

                {/* Reviewer info */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                  <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center
                    text-white text-sm font-bold flex-shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{name}</p>
                    <p className="text-gray-400 text-xs">{location}</p>
                  </div>
                  {/* Verified badge */}
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-semibold">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate rating strip */}
          <div className="mt-10 bg-gradient-to-r from-navy-800 to-navy-900 rounded-2xl p-6
            flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-extrabold">4.7</span>
              <div>
                <StarRating rating={4.7} size="lg" />
                <p className="text-navy-200 text-sm mt-1">Based on 2,400+ verified reviews</p>
              </div>
            </div>
            {/* Mini bar chart */}
            <div className="flex flex-col gap-1.5 text-xs text-navy-200 min-w-[160px]">
              {[["5★", "72%"], ["4★", "18%"], ["3★", "6%"], ["1-2★", "4%"]].map(([label, pct]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-8 text-right">{label}</span>
                  <div className="flex-1 bg-white/20 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5" style={{ width: pct }} />
                  </div>
                  <span>{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. ALL PRODUCTS GRID  (paginated, with category filter)
      ══════════════════════════════════════════════════════════════════════ */}
      <main id="products-section" className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">

          {/* Section heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <span className="text-xs font-bold text-navy-600 uppercase tracking-widest">Full catalog</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Our Products</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Showing {paginated.length} of {filtered.length} products
              </p>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border
                  transition-all duration-150 ${
                  category === cat
                    ? "bg-navy-700 text-white border-navy-700 shadow-md"
                    : "bg-white text-gray-600 border-gray-300 hover:border-navy-400 hover:text-navy-700"
                }`}
              >
                <span>{CATEGORY_ICONS[cat] ?? "📦"}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {paginated.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">No products in this category.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600
                  hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    page === num
                      ? "bg-navy-700 text-white shadow"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600
                  hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
