'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import OrderStatusFeed from '@/components/OrderStatusFeed';
import ProductList from '@/components/ProductList';
import CartDrawer from '@/components/CartDrawer';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register({ firstName, lastName, email, password });
        setAuthSuccess('Account created successfully! Please sign in.');
        setIsRegistering(false);
        setPassword('');
        setFirstName('');
        setLastName('');
      } else {
        await login({ email, password });
      }
    } catch (err: any) {
      const apiMessage = err.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage[0]
        : typeof apiMessage === 'string'
          ? apiMessage
          : err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
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
        {!isAuthenticated ? (
          <div className="max-w-sm mx-auto mt-20">
            <h2 className="text-2xl font-bold mb-2">
              {isRegistering ? 'Create an account' : 'Sign in'}
            </h2>
            <p className="text-sm text-white/40 mb-8">
              {isRegistering
                ? 'Join Dokkan to start tracking your orders.'
                : 'Authenticate to receive real-time order updates.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-white/50 mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                                 text-white placeholder-white/20 outline-none
                                 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-white/50 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                                 text-white placeholder-white/20 outline-none
                                 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                             text-white placeholder-white/20 outline-none
                             focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                             text-white placeholder-white/20 outline-none
                             focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                  {authSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           font-medium text-sm transition-colors"
              >
                {isSubmitting
                  ? (isRegistering ? 'Creating account…' : 'Signing in…')
                  : (isRegistering ? 'Register' : 'Sign in')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-white/50">
              {isRegistering ? 'Already have an account?' : 'Need an account?'}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-medium"
              >
                {isRegistering ? 'Sign in' : 'Register here'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Authenticated: show active tab ───────────────  */
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
        )}
      </div>

      {/* ── Cart Drawer (always mounted, visibility controlled internally) ── */}
      <CartDrawer />
    </main>
  );
}
