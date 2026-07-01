'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/useAuth';
import { useOrderSync } from '@/modules/orders/useOrderSync';
import { getOrderById, type Order } from '@/modules/orders/api';
import StatusBadge from '@/modules/orders/components/StatusBadge';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { updates } = useOrderSync();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then(setOrder)
      .catch(() => setError('Failed to load this order. It may not exist.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  // Apply real-time status updates for this specific order
  useEffect(() => {
    const latest = updates.find((u) => u.orderId === orderId);
    if (!latest) return;
    setOrder((prev) => (prev ? { ...prev, status: latest.status, updatedAt: latest.updatedAt } : prev));
  }, [updates, orderId]);

  if (isAuthLoading || !isAuthenticated || isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-200" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-10 text-center">
        <p className="text-neutral-400">{error || 'Order not found.'}</p>
        <Link href="/orders" className="mt-4 inline-block text-sm text-accent-400 hover:text-accent-300">
          ← Back to my orders
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-6 py-10">
      <Link href="/orders" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← My orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-50 sm:text-3xl">
            Order #{order.id.substring(0, 8)}…
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Placed{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-neutral-200">
            Items ({order.items.length})
          </h2>
          <ul className="divide-y divide-neutral-800">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent-500/20 to-accent2-500/20" />
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{item.productName}</p>
                    <p className="text-xs text-neutral-500">
                      Qty {item.quantity} · ${Number(item.unitPrice).toFixed(2)} each
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-neutral-300">
                  ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-200">Summary</h2>
            <div className="flex items-center justify-between border-t border-neutral-800 pt-4 text-sm">
              <span className="text-neutral-400">Total</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-400 to-accent2-400">
                ${Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </section>

          {order.shippingAddress && (
            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-2 text-sm font-semibold text-neutral-200">Shipping address</h2>
              <p className="text-sm text-neutral-400">
                {order.shippingAddress.fullName && (
                  <>
                    {order.shippingAddress.fullName}
                    <br />
                  </>
                )}
                {order.shippingAddress.street}
                {order.shippingAddress.street ? ', ' : ''}
                {order.shippingAddress.city}
                <br />
                {order.shippingAddress.country} {order.shippingAddress.postalCode}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
