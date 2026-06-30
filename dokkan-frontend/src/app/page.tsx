import Link from "next/link";
import { getFeaturedProducts, categories } from "@/modules/catalog/mockData";
import ProductGrid from "@/modules/catalog/components/ProductGrid";
import Button from "@/components/ui/Button";

export default function HomePage() {
  const featured = getFeaturedProducts(4);

  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-accent2-500/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
          <span className="inline-flex items-center rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-300">
            Live order tracking, powered by real-time microservices
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-50 sm:text-5xl lg:text-6xl">
            The latest tech,
            <br />
            from vendors you trust.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-neutral-400 sm:text-lg">
            Dokkan brings together independent electronics vendors into one marketplace —
            with instant order updates the moment your package moves.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/products" size="lg">
              Browse the catalog
            </Button>
            <Button href="/orders" size="lg" variant="secondary">
              Track an order
            </Button>
          </div>
        </div>
      </section>

      {/* ── Category strip ───────────────────────────────────── */}
      <section className="border-b border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-6">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/categories/${encodeURIComponent(category.toLowerCase())}`}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured products ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-50 sm:text-3xl">
              Featured products
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Top-rated picks from across our vendors.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-accent-300 hover:text-accent-200 sm:inline-flex"
          >
            View all →
          </Link>
        </div>

        <ProductGrid products={featured} />
      </section>
    </main>
  );
}
