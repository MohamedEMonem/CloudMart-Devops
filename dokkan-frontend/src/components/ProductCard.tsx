'use client';

import { useState } from 'react';
import type { Product } from '@/lib/api/products';
import { useCart } from '@/hooks/useCart';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart({
        productId: product._id,
        productName: product.name,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        quantity: 1,
        price: product.price,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Image area */}
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-white/[0.03] to-white/[0.08] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl select-none">📦</span>
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-white leading-tight mb-1 group-hover:text-blue-300 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-white/40 font-medium">
            By {product.vendorName}
          </p>
        </div>

        <p className="text-sm text-white/50 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            ${product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`
              relative overflow-hidden rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300
              ${justAdded
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isAdding
                  ? 'bg-white/5 text-white/50 border border-white/10'
                  : 'bg-white/10 text-white border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              {justAdded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added!
                </>
              ) : isAdding ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding…
                </>
              ) : (
                <>Add to Cart</>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
