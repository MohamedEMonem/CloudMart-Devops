'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, type EnrichedCartItem } from '@/modules/cart/useCart';
import { useAuth } from '@/modules/auth/useAuth';
import { mockProducts } from '@/modules/catalog/mockData';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function CartDrawer() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const {
    cart,
    cartCount,
    subtotal,
    isCartOpen,
    isCartLoading,
    closeCart,
    removeFromCart,
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    router.push(isAuthenticated ? '/checkout/shipping' : '/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-50">Shopping Cart</h2>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-500/15 text-accent-300 border border-accent-500/30">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isCartLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-200 rounded-full animate-spin" />
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-neutral-400 text-sm">Your cart is empty.</p>
              <p className="text-neutral-500 text-xs mt-1">Browse the catalog and add some products!</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemRow key={item.productId} item={item} onRemove={removeFromCart} />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-800 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Subtotal</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-400 to-accent2-400">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <Button onClick={handleCheckout} className="w-full" size="lg">
              Proceed to Checkout — ${subtotal.toFixed(2)}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

// ── CartItemRow Sub-component ─────────────────────────────────
function CartItemRow({
  item,
  onRemove,
}: {
  item: EnrichedCartItem;
  onRemove: (productId: string) => Promise<void>;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(item.productId);
    setIsRemoving(false);
  };

  // TODO: cart items are keyed by mock product IDs for now — swap this
  // lookup once cart enrichment stores a real image URL from the catalog API.
  const mockMatch = mockProducts.find((p) => p.id === item.productId);

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 transition-colors">
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
        {mockMatch ? (
          <Image src={mockMatch.images[0]} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent-500/20 to-accent2-500/20" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-neutral-50 truncate">{item.productName}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{item.vendorName}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-neutral-400">Qty: {item.quantity}</span>
          <span className="text-xs text-neutral-600">·</span>
          <span className="text-sm font-semibold text-accent-300">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="p-1.5 rounded-lg text-neutral-500 hover:text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
        aria-label={`Remove ${item.productName}`}
      >
        {isRemoving ? (
          <div className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}
