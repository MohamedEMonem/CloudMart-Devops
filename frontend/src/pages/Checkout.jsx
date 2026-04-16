import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Simple form field wrapper to reduce repetition
function Field({ label, id, type = "text", placeholder, required, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
      />
    </div>
  );
}

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

export default function Checkout() {
  const { cart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitted, setSubmitted] = useState(false);

  // Controlled form state — all fields in one object
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", address: "", city: "",
    state: "", zip: "", country: "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production you'd POST this to a payment/order API
    // For now we just show a success screen
    setSubmitted(true);
  };

  // ── Order success screen ──
  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500 mt-2">
          Thank you, <strong>{form.firstName}</strong>! Your order has been received and is being processed.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          A confirmation would be sent to <strong>{form.email}</strong> in production.
        </p>

        {/* Payment placeholder notice */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>Payment integration coming soon!</strong><br />
          This is a demo checkout. No real payment was processed.
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-navy-700 text-white
            px-6 py-3 rounded-xl hover:bg-navy-800 transition font-semibold shadow"
        >
          Back to Shop
        </Link>
      </main>
    );
  }

  // If cart is empty, bounce back
  if (cart.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty. Add items before checking out.</p>
        <Link to="/" className="text-navy-700 underline font-medium">Go Shopping</Link>
      </main>
    );
  }

  const tax = (parseFloat(cartTotal) * 0.1).toFixed(2);
  const grandTotal = (parseFloat(cartTotal) * 1.1).toFixed(2);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-navy-700 transition">Home</Link>
        <span>/</span>
        <Link to="/cart" className="hover:text-navy-700 transition">Cart</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Checkout</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="lg:flex gap-10">

        {/* ── Left: form columns ── */}
        <div className="flex-1 space-y-8">

          {/* Contact information */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-navy-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" id="firstName" placeholder="John" required value={form.firstName} onChange={handleChange} />
              <Field label="Last Name" id="lastName" placeholder="Doe" required value={form.lastName} onChange={handleChange} />
              <Field label="Email" id="email" type="email" placeholder="john@example.com" required value={form.email} onChange={handleChange} />
              <Field label="Phone" id="phone" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={handleChange} />
            </div>
          </section>

          {/* Shipping address */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-navy-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Shipping Address
            </h2>
            <div className="space-y-4">
              <Field label="Street Address" id="address" placeholder="123 Main St" required value={form.address} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" id="city" placeholder="New York" required value={form.city} onChange={handleChange} />
                <Field label="State / Province" id="state" placeholder="NY" value={form.state} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ZIP / Postal Code" id="zip" placeholder="10001" required value={form.zip} onChange={handleChange} />
                <Field label="Country" id="country" placeholder="United States" required value={form.country} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-navy-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Payment Method
            </h2>

            <div className="space-y-3">
              {PAYMENT_METHODS.map(({ id, label, icon }) => (
                <label
                  key={id}
                  className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
                    paymentMethod === id
                      ? "border-navy-600 bg-navy-50"
                      : "border-gray-200 hover:border-navy-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                    className="accent-navy-700"
                  />
                  <span className="text-xl">{icon}</span>
                  <span className="font-medium text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Payment placeholder notice */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
              <span className="text-lg leading-none">ℹ️</span>
              <span>
                <strong>Payment integration coming soon.</strong> No real payment will be charged.
                This demo simulates an order confirmation only.
              </span>
            </div>
          </section>
        </div>

        {/* ── Right: order summary ── */}
        <div className="mt-8 lg:mt-0 lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Order Summary ({cartCount} items)
            </h2>

            {/* Item list */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-3">
                  <img src={product.image} alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">Qty: {quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>${cartTotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-600 font-semibold">Free</span></div>
              <div className="flex justify-between"><span>Tax (10%)</span><span>${tax}</span></div>
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-lg font-extrabold text-gray-900">
              <span>Total</span>
              <span>${grandTotal}</span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="mt-6 w-full bg-navy-700 hover:bg-navy-800 active:scale-95
                text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md"
            >
              Place Order →
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              🔒 Your information is secure and encrypted
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
