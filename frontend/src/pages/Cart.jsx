import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";

export default function Cart() {
  const { cart, cartTotal, cartCount } = useCart();

  // Empty cart state
  if (cart.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 text-center flex flex-col items-center justify-center min-h-screen">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-navy-50 mb-6">
          <svg className="h-12 w-12 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-400 mt-2">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 bg-navy-700 text-white
            px-6 py-3 rounded-xl hover:bg-navy-800 transition font-semibold shadow"
        >
          Start Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
      <p className="text-gray-500 text-sm mb-8">{cartCount} item{cartCount !== 1 ? "s" : ""} in your cart</p>

      <div className="lg:flex gap-8">

        {/* ── Left: cart items list ── */}
        <div className="flex-1 space-y-4">
          {cart.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}

          {/* Continue shopping link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-navy-700 hover:text-navy-900 transition mt-2"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Right: order summary ── */}
        <div className="mt-8 lg:mt-0 lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-medium text-gray-800">${cartTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span className="font-medium text-gray-800">
                  ${(parseFloat(cartTotal) * 0.1).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between text-xl font-extrabold text-gray-900">
              <span>Total</span>
              <span>${(parseFloat(cartTotal) * 1.1).toFixed(2)}</span>
            </div>

            {/* "Proceed to Checkout" routes to the checkout page */}
            <Link
              to="/checkout"
              className="mt-6 block w-full text-center bg-navy-700 hover:bg-navy-800
                text-white py-3 rounded-xl font-bold transition shadow-md"
            >
              Proceed to Checkout →
            </Link>

            {/* Trust badges */}
            <div className="mt-5 flex justify-around text-xs text-gray-400">
              <span>🔒 Secure</span>
              <span>🚚 Free Shipping</span>
              <span>↩️ Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
