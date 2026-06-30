import type { Metadata } from "next";
import { searchProducts } from "@/modules/catalog/mockData";
import ProductGrid from "@/modules/catalog/components/ProductGrid";

export const metadata: Metadata = {
  title: "Search — Dokkan Electronics",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchProducts(q);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-50 sm:text-3xl">
          {q ? `Search results for “${q}”` : "Search"}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {q
            ? `${results.length} ${results.length === 1 ? "product" : "products"} found.`
            : "Enter a search term to find products."}
        </p>
      </div>

      <ProductGrid
        products={results}
        emptyMessage={
          q ? `No products match “${q}”. Try a different search.` : "Start typing to search the catalog."
        }
      />
    </main>
  );
}
