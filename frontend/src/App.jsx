import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// App is the root component that wires together:
// 1. BrowserRouter — enables client-side routing (URL changes without page reload)
// 2. CartProvider  — makes cart state available to every child component
// 3. Navbar        — sticky top bar, always visible
// 4. Routes        — maps URL paths to page components
// 5. Footer        — site-wide footer with links
export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen flex flex-col">

          {/* Sticky navigation bar */}
          <Navbar />

          {/* Page content — flex-1 makes it fill remaining vertical space */}
          <div className="flex-1">
            <Routes>
              {/* Home: product grid with hero + category filter + pagination */}
              <Route path="/" element={<Home />} />

              {/* Product detail: :id is extracted by useParams() in the component */}
              <Route path="/products/:id" element={<ProductDetails />} />

              {/* Cart: shows items, totals, and a link to /checkout */}
              <Route path="/cart" element={<Cart />} />

              {/* Checkout: shipping form + payment method selector */}
              <Route path="/checkout" element={<Checkout />} />

              {/* 404 fallback */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
                    <span className="text-6xl">🔍</span>
                    <p className="text-xl font-semibold">404 — Page not foun</p>
                  </div>
                }
              />
            </Routes>
          </div>

          {/* Site-wide footer */}
          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
