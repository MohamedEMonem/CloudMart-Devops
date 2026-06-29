'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getCart, addCartItem, removeCartItem, type Cart, type CartItem } from './api';
import { useAuth } from '@/modules/auth/useAuth';

// ── Types ────────────────────────────────────────────────────

/** CartItem enriched with product metadata for display */
export interface EnrichedCartItem extends CartItem {
  productName: string;
  vendorId: string;
  vendorName: string;
}

interface CartContextValue {
  cart: EnrichedCartItem[];
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  isCartLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: EnrichedCartItem) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<EnrichedCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  // ── Derived values ──
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ── Fetch cart on auth ──
  const refreshCart = useCallback(async () => {
    if (!user?.id) return;
    setIsCartLoading(true);
    try {
      const data = await getCart(user.id);
      // Merge with any local enrichment stored in sessionStorage
      const enrichmentRaw = sessionStorage.getItem('cart_enrichment');
      const enrichment: Record<string, { productName: string; vendorId: string; vendorName: string }> =
        enrichmentRaw ? JSON.parse(enrichmentRaw) : {};

      const enrichedItems: EnrichedCartItem[] = data.items.map((item) => ({
        ...item,
        productName: enrichment[item.productId]?.productName || 'Product',
        vendorId: enrichment[item.productId]?.vendorId || '',
        vendorName: enrichment[item.productId]?.vendorName || 'Vendor',
      }));

      setCart(enrichedItems);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setIsCartLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) refreshCart();
  }, [isAuthenticated, refreshCart]);

  // ── Actions ──
  const addToCart = useCallback(
    async (item: EnrichedCartItem) => {
      if (!user?.id) return;

      // Store enrichment data client-side (since the Redis cart only stores productId/qty/price)
      const enrichmentRaw = sessionStorage.getItem('cart_enrichment');
      const enrichment = enrichmentRaw ? JSON.parse(enrichmentRaw) : {};
      enrichment[item.productId] = {
        productName: item.productName,
        vendorId: item.vendorId,
        vendorName: item.vendorName,
      };
      sessionStorage.setItem('cart_enrichment', JSON.stringify(enrichment));

      // Optimistic update
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
          return updated;
        }
        return [...prev, item];
      });

      try {
        await addCartItem(user.id, {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      } catch (err) {
        console.error('Failed to add item', err);
        await refreshCart(); // rollback
      }
    },
    [user?.id, refreshCart],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!user?.id) return;

      // Optimistic update
      setCart((prev) => prev.filter((i) => i.productId !== productId));

      try {
        await removeCartItem(user.id, productId);
      } catch (err) {
        console.error('Failed to remove item', err);
        await refreshCart(); // rollback
      }
    },
    [user?.id, refreshCart],
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        isCartOpen,
        isCartLoading,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
