import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts, mockProducts } from "@/modules/catalog/mockData";
import ProductGallery from "@/modules/catalog/components/ProductGallery";
import AddToCartButton from "@/modules/cart/components/AddToCartButton";
import Badge from "@/components/ui/Badge";
import ProductGrid from "@/modules/catalog/components/ProductGrid";

export function generateStaticParams() {
  return mockProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product ? `${product.name} — cloudmart Electronics` : "Product not found" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const related = getRelatedProducts(product);
  const discounted = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-6 py-10">
      <nav className="mb-6 text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-neutral-300">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/categories/${encodeURIComponent(product.category.toLowerCase())}`}
          className="hover:text-neutral-300"
        >
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-300">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-sm font-medium text-neutral-500">{product.vendorName}</p>
          <h1 className="mt-1 text-3xl font-bold text-neutral-50">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
            <span aria-hidden="true" className="text-warning">★</span>
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-neutral-600">·</span>
            <span>{product.reviewCount} reviews</span>
            {!product.inStock && <Badge tone="neutral">Out of stock</Badge>}
            {discounted && product.inStock && <Badge tone="accent">Sale</Badge>}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-50">
              ${product.price.toFixed(2)}
            </span>
            {discounted && (
              <span className="text-lg text-neutral-500 line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          <p className="mt-6 text-neutral-300">{product.description}</p>

          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-neutral-400">
                <svg className="h-4 w-4 flex-shrink-0 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <AddToCartButton product={product} size="lg" className="w-full sm:w-auto" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-xl font-bold text-neutral-50">You might also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </main>
  );
}
