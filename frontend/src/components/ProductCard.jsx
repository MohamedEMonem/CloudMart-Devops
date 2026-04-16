import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import StarRating from "./StarRating";

// Displays a single product tile in the grid on the Home page
export default function ProductCard({ product }) {
  const { addToCart, loading } = useCart();

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col group">

      {/* Image wrapper — zoom effect on hover */}
      <Link to={`/products/${product.id}`} className="overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Low-stock badge overlaid on the image */}
        {product.stock < 5 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Low Stock
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {/* Category pill */}
        <span className="text-xs text-navy-700 font-semibold uppercase tracking-widest">
          {product.category}
        </span>

        {/* Product name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="mt-1 text-gray-900 font-bold text-base leading-snug hover:text-navy-900 transition line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Star rating + review count */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>

        {/* Description snippet */}
        <p className="mt-2 text-gray-500 text-sm line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xl font-extrabold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product.id)}
            disabled={loading}
            className="flex items-center gap-1 bg-navy-700 hover:bg-navy-800 active:scale-95
              text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
