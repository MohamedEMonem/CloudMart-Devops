import { useCart } from "../context/CartContext";

// Renders a single row in the Cart page
export default function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">

      {/* Product thumbnail */}
      <img
        src={product.image}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
      />

      {/* Product name + category */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
        <p className="text-xs text-navy-600 font-medium mt-0.5">{product.category}</p>
        <p className="text-base font-extrabold text-gray-800 mt-1">
          ${product.price.toFixed(2)}
          <span className="text-xs font-normal text-gray-400 ml-1">each</span>
        </p>
      </div>

      {/* Quantity stepper — calls PUT /api/cart/:productId when quantity changes */}
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => updateQuantity(product.id, quantity - 1)}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition text-base font-semibold"
          aria-label="Decrease quantity"
        >−</button>
        <span className="px-3 py-2 font-bold text-gray-800 text-sm border-x border-gray-200">
          {quantity}
        </span>
        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition text-base font-semibold"
          aria-label="Increase quantity"
        >+</button>
      </div>

      {/* Line total (price × quantity) */}
      <p className="font-extrabold text-gray-900 w-20 text-right text-sm">
        ${(product.price * quantity).toFixed(2)}
      </p>

      {/* Remove button — calls DELETE /api/cart/:productId */}
      <button
        onClick={() => removeFromCart(product.id)}
        className="text-gray-300 hover:text-red-500 transition ml-1 flex-shrink-0"
        aria-label="Remove item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
