import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cartCount } = useCart();
  // Controls the mobile hamburger menu
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-white font-semibold border-b-2 border-white pb-0.5"
      : "text-navy-100 hover:text-white transition-colors duration-200";

  return (
    <nav className="bg-gradient-to-r from-navy-950 to-navy-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">

        {/* ── Brand ── */}
        <Link to="/" className="flex items-center text-2xl font-extrabold tracking-tight">
          {/* Simple SVG nest icon */}
          <svg className="h-7 w-7 text-navy-200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-11H8l4-4 4 4h-3v6h-2v-6z"/>
          </svg>
          Cloud<span className="text-navy-300">Mart</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink to="/" end className={linkClass}>Home</NavLink>

          {/* Cart with badge */}
          <NavLink to="/cart" className={({ isActive }) =>
            `relative flex items-center gap-1.5 ${linkClass({ isActive })}`
          }>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart
            {/* Badge only shows when cart has items */}
            {cartCount > 0 && (
              <span className="absolute -top-2.5 -right-3 bg-red-500 text-white text-xs
                w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                {cartCount}
              </span>
            )}
          </NavLink>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-navy-700 transition"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="md:hidden bg-navy-900 px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/cart" className={({ isActive }) =>
            `flex items-center gap-1.5 ${linkClass({ isActive })}`
          } onClick={() => setMenuOpen(false)}>
            Cart {cartCount > 0 && <span className="bg-red-500 text-xs px-1.5 rounded-full">{cartCount}</span>}
          </NavLink>
        </div>
      )}
    </nav>
  );
}
