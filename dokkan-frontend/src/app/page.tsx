'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import OrderStatusFeed from '@/components/OrderStatusFeed';
import ProductList from '@/components/ProductList';
import CartDrawer from '@/components/CartDrawer';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/10 px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-blue-400">Dokkan</span>
            <span className="text-white/40 font-normal ml-2 text-sm">Marketplace</span>
          </h1>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <nav className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'products'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  Catalog
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'orders'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  My Orders
                </button>
              </nav>

              <div className="w-px h-6 bg-white/10 hidden sm:block" />

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Open cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-blue-500 text-white rounded-full animate-in zoom-in duration-200">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              <span className="text-sm text-white/50 hidden md:block">{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div>
          {activeTab === 'products' ? (
            <ProductList />
          ) : (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1">My Orders</h2>
                <p className="text-sm text-white/40">
                  Your order history with real-time status updates.
                </p>
              </div>
              <OrderStatusFeed />
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Drawer (always mounted, visibility controlled internally) ── */}
      <CartDrawer />
    </main>
  );
}
