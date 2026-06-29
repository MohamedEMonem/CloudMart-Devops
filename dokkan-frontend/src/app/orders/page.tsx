"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/useAuth";
import OrderStatusFeed from "@/modules/orders/components/OrderStatusFeed";

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-200" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-50 sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Your order history with real-time status updates.
        </p>
      </div>
      <OrderStatusFeed />
    </main>
  );
}
