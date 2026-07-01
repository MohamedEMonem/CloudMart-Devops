import Image from "next/image";
import Link from "next/link";
import type { MockProduct } from "@/modules/catalog/mockData";
import Badge from "@/components/ui/Badge";
import AddToCartButton from "@/modules/cart/components/AddToCartButton";

export default function ProductCard({ product }: { product: MockProduct }) {
  const discounted = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-card-hover">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-neutral-800">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/60">
            <Badge tone="neutral">Out of stock</Badge>
          </div>
        )}
        {discounted && product.inStock && (
          <Badge tone="accent" className="absolute top-3 left-3">
            Sale
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-neutral-500">{product.vendorName}</p>
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="text-base font-semibold leading-tight text-neutral-50 transition-colors group-hover:text-accent-300">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
          <span aria-hidden="true" className="text-warning">★</span>
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-neutral-600">·</span>
          <span>{product.reviewCount} reviews</span>
        </div>

        <div className="mt-3 flex flex-1 items-end justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold text-neutral-50">
              ${product.price.toFixed(2)}
            </span>
            {discounted && (
              <span className="text-sm text-neutral-500 line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </div>
  );
}
