"use client";

import Link from "next/link";
import { useAuth } from "@/modules/auth/useAuth";
import { useCart } from "@/modules/cart/useCart";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-accent-400 to-accent2-400 bg-clip-text text-transparent">
            cloudmart
          </span>
          <span className="ml-2 text-sm font-normal text-neutral-400">Electronics</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          <Link
            href="/products"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
          >
            Catalog
          </Link>
          {isAuthenticated && (
            <Link
              href="/orders"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
            >
              My Orders
            </Link>
          )}
        </nav>

        <form
          action="/search"
          className="hidden flex-1 max-w-xs items-center md:flex mx-4"
        >
          <div className="relative w-full">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Search electronics…"
              aria-label="Search products"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none transition-colors focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            className="relative rounded-lg p-2 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
            aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <div className="hidden h-6 w-px bg-neutral-800 sm:block" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="hidden text-sm text-neutral-400 hover:text-neutral-100 md:block"
              >
                {user?.name || user?.email}
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-accent-500 to-accent2-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:brightness-110"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
