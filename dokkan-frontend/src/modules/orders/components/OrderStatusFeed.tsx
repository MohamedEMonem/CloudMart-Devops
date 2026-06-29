'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/useAuth';
import { useOrderSync } from '@/modules/orders/useOrderSync';
import type { ConnectionState } from '@/modules/orders/useOrderSync';
import { getOrdersByUser, type Order } from '@/modules/orders/api';
import StatusBadge from './StatusBadge';

// ── Helpers ──────────────────────────────────────────────────
const connectionIndicator: Record<ConnectionState, { color: string; label: string }> = {
  disconnected: { color: 'bg-neutral-500', label: 'Disconnected' },
  connecting:   { color: 'bg-warning animate-pulse', label: 'Connecting…' },
  connected:    { color: 'bg-success', label: 'Live' },
  error:        { color: 'bg-danger', label: 'Error' },
};

// ── Component ────────────────────────────────────────────────
export default function OrderStatusFeed() {
  const { user } = useAuth();
  const { updates, connectionState, error: wsError, reconnect } = useOrderSync();
  const indicator = connectionIndicator[connectionState];

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // ── Fetch order history on mount ──
  useEffect(() => {
    if (!user?.id) return;

    async function loadOrders() {
      try {
        const data = await getOrdersByUser(user!.id);
        setOrders(data);
      } catch (err: any) {
        console.error('Failed to fetch orders', err);
        setFetchError('Failed to load order history.');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [user?.id]);

  // ── Apply real-time WebSocket updates to orders ──
  useEffect(() => {
    if (updates.length === 0) return;
    const latest = updates[0];

    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === latest.orderId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status: latest.status, updatedAt: latest.updatedAt };
        return updated;
      }
      return prev;
    });
  }, [updates]);

  return (
    <div className="w-full">
      {/* ── Connection status bar ── */}
      <div className="flex items-center justify-between mb-6 px-5 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${indicator.color}`} />
          <span className="text-sm text-neutral-300 font-medium">{indicator.label}</span>
          <span className="text-xs text-neutral-500">· Real-time updates</span>
        </div>
        {connectionState !== 'connected' && (
          <button
            onClick={reconnect}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors font-medium"
          >
            Reconnect
          </button>
        )}
      </div>

      {wsError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
          WebSocket: {wsError}
        </div>
      )}

      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
          {fetchError}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-neutral-800 rounded w-48" />
                <div className="h-5 bg-neutral-800 rounded w-24" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="h-4 bg-neutral-800 rounded" />
                <div className="h-4 bg-neutral-800 rounded" />
                <div className="h-4 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-neutral-800 bg-neutral-900">
          <p className="text-lg text-neutral-400">No orders yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Place an order from the Catalog to see it here.
          </p>
        </div>
      ) : (
        /* ── Order cards ── */
        <div className="space-y-5">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">Order</p>
                    <p className="text-sm font-mono text-neutral-300">#{order.id.substring(0, 8)}…</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-neutral-500">Placed</p>
                    <p className="text-sm text-neutral-300">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-neutral-500">Ships to</p>
                    <p className="text-sm text-neutral-300">
                      {order.shippingAddress?.city}, {order.shippingAddress?.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-400 to-accent2-400">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300 truncate pr-3">
                      {item.productName}
                      <span className="text-neutral-500 ml-2">× {item.quantity}</span>
                    </span>
                    <span className="text-neutral-400 flex-shrink-0">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
