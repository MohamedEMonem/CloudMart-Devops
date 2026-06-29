import Link from "next/link";
import type { Metadata } from "next";
import { categories, getProductsByCategory } from "@/modules/catalog/mockData";
import ProductGrid from "@/modules/catalog/components/ProductGrid";

export const metadata: Metadata = {
  title: "Catalog — Dokkan Electronics",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && (categories as readonly string[]).includes(category) ? category : "All";
  const products = getProductsByCategory(activeCategory === "All" ? undefined : activeCategory);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-50 sm:text-3xl">Catalog</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Browse products across all vendors. Sign in to add items to your cart.
        </p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Filter by category">
        {["All", ...categories].map((c) => (
          <Link
            key={c}
            href={c === "All" ? "/products" : `/products?category=${encodeURIComponent(c)}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === c
                ? "border-accent-500/40 bg-accent-500/15 text-accent-300"
                : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-neutral-50"
            }`}
          >
            {c}
          </Link>
        ))}
      </nav>

      <ProductGrid products={products} emptyMessage="No products in this category yet." />
    </main>
  );
}
