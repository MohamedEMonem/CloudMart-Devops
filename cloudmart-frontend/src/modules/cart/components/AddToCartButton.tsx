"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/useAuth";
import { useCart } from "@/modules/cart/useCart";
import type { MockProduct } from "@/modules/catalog/mockData";
import Button from "@/components/ui/Button";

export default function AddToCartButton({
  product,
  size = "md",
  className = "",
}: {
  product: MockProduct;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsAdding(true);
    try {
      // TODO: productId is mock-only here; swap to the real Product._id
      // returned by getProducts() once the catalog page is wired to the API.
      await addToCart({
        productId: product.id,
        productName: product.name,
        vendorId: product.vendorName,
        vendorName: product.vendorName,
        quantity: 1,
        price: product.price,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant={justAdded ? "secondary" : "primary"}
      size={size}
      onClick={handleClick}
      disabled={isAdding || !product.inStock}
      className={className}
    >
      {!product.inStock
        ? "Out of stock"
        : justAdded
          ? "Added ✓"
          : isAdding
            ? "Adding…"
            : "Add to cart"}
    </Button>
  );
}
