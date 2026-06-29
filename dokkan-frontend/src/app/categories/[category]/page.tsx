import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { categories, getCategoryBySlug, getProductsByCategory } from "@/modules/catalog/mockData";
import ProductGrid from "@/modules/catalog/components/ProductGrid";

const categoryBlurb: Record<string, string> = {
  Audio: "Headphones, earbuds, and speakers tuned for sound that moves you.",
  Computing: "Laptops, peripherals, and storage built for work and play.",
  Mobile: "Phones and accessories to keep you powered up and connected.",
  Wearables: "Smartwatches and fitness bands that track every move.",
  "Smart Home": "Connected devices that make your home work smarter.",
};

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const match = getCategoryBySlug(category);
  return { title: match ? `${match} — Dokkan Electronics` : "Category not found" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const match = getCategoryBySlug(category);

  if (!match) notFound();

  const products = getProductsByCategory(match);

  return (
    <main className="flex-1">
      <section className="border-b border-neutral-800 bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h1 className="text-3xl font-bold text-neutral-50 sm:text-4xl">{match}</h1>
          <p className="mt-2 max-w-xl text-neutral-400">
            {categoryBlurb[match] || `Browse our ${match.toLowerCase()} collection.`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Other categories">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/categories/${encodeURIComponent(c.toLowerCase())}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                c === match
                  ? "border-accent-500/40 bg-accent-500/15 text-accent-300"
                  : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-neutral-50"
              }`}
            >
              {c}
            </Link>
          ))}
        </nav>

        <ProductGrid products={products} emptyMessage="No products in this category yet." />
      </div>
    </main>
  );
}
