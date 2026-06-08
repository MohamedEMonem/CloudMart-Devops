'use client';

import { useState } from 'react';
import { useCart, type EnrichedCartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { placeOrder } from '@/lib/api/checkout';

export default function CartDrawer() {
  const { user } = useAuth();
  const {
    cart,
    cartCount,
    subtotal,
    isCartOpen,
    isCartLoading,
    closeCart,
    removeFromCart,
    refreshCart,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async () => {
    if (!user?.id || cart.length === 0) return;

    setIsCheckingOut(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    try {
      const orderItems = cart.map((item) => ({
        vendorId: item.vendorId || 'unknown',
        vendorName: item.vendorName || 'Unknown Vendor',
        productId: item.productId,
        productName: item.productName || 'Product',
        quantity: item.quantity,
        unitPrice: item.price,
      }));

      await placeOrder({
        userId: user.id,
        items: orderItems,
        shippingAddress: {
          street: '123 Demo Street',
          city: 'Cairo',
          country: 'Egypt',
        },
      });

      setCheckoutSuccess('Order placed! Check "My Orders" for real-time status updates.');
      // Clear local cart after successful order
      sessionStorage.removeItem('cart_enrichment');
      await refreshCart();

      setTimeout(() => {
        setCheckoutSuccess('');
        closeCart();
      }, 3000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.[0] ||
        err.response?.data?.message ||
        'Failed to place order. Please try again.';
      setCheckoutError(typeof msg === 'string' ? msg : 'Checkout failed.');
    } finally {
      setIsCheckingOut(false);
    }
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
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#111111] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Shopping Cart</h2>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-4xl mb-3">🛒</span>
              <p className="text-white/40 text-sm">Your cart is empty.</p>
              <p className="text-white/30 text-xs mt-1">Browse the catalog and add some products!</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemRow key={item.productId} item={item} onRemove={removeFromCart} />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5 space-y-4">
            {checkoutError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {checkoutError}
              </div>
            )}
            {checkoutSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                {checkoutSuccess}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Subtotal</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || cart.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Placing Order…
                </>
              ) : (
                <>Proceed to Checkout — ${subtotal.toFixed(2)}</>
              )}
            </button>
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

  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      {/* Thumbnail placeholder */}
      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">📦</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white truncate">{item.productName}</h4>
        <p className="text-xs text-white/40 mt-0.5">{item.vendorName}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-white/50">Qty: {item.quantity}</span>
          <span className="text-xs text-white/30">·</span>
          <span className="text-sm font-semibold text-blue-300">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
        aria-label={`Remove ${item.productName}`}
      >
        {isRemoving ? (
          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}
