import type { MockProduct } from "@/modules/catalog/mockData";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: {
  products: MockProduct[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
        <p className="text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
