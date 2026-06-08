'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrderSync } from '@/hooks/useOrderSync';
import type { ConnectionState } from '@/hooks/useOrderSync';
import api from '@/lib/api/client';

// ── Types ────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  vendorId: string;
  quantity: number;
  unitPrice: string | number;
}

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: string | number;
  shippingAddress: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// ── Helpers ──────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  paid:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  shipped:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const connectionIndicator: Record<ConnectionState, { color: string; label: string }> = {
  disconnected: { color: 'bg-gray-400', label: 'Disconnected' },
  connecting:   { color: 'bg-yellow-400 animate-pulse', label: 'Connecting…' },
  connected:    { color: 'bg-green-400', label: 'Live' },
  error:        { color: 'bg-red-400', label: 'Error' },
};

function StatusBadge({ status }: { status: string }) {
  const classes = statusColors[status.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${classes}`}>
      {status}
    </span>
  );
}

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
        const { data } = await api.get<Order[]>('/orders', {
          params: { userId: user!.id },
        });
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
    <div className="w-full max-w-3xl mx-auto">
      {/* ── Connection status bar ── */}
      <div className="flex items-center justify-between mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${indicator.color}`} />
          <span className="text-sm text-white/60 font-medium">{indicator.label}</span>
          <span className="text-xs text-white/30">· Real-time updates</span>
        </div>
        {connectionState !== 'connected' && (
          <button
            onClick={reconnect}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Reconnect
          </button>
        )}
      </div>

      {wsError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          WebSocket: {wsError}
        </div>
      )}

      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {fetchError}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-xl bg-white/5 border border-white/10 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-5 bg-white/10 rounded w-40" />
                <div className="h-5 bg-white/10 rounded w-20" />
              </div>
              <div className="h-4 bg-white/10 rounded w-32 mb-2" />
              <div className="h-4 bg-white/10 rounded w-24" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-4">📋</span>
          <p className="text-lg text-white/40">No orders yet</p>
          <p className="text-sm text-white/30 mt-1">
            Place an order from the Catalog to see it here.
          </p>
        </div>
      ) : (
        /* ── Order cards ── */
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-white/50">
                    #{order.id.substring(0, 8)}…
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">
                      {item.productName}
                      <span className="text-white/30 ml-2">× {item.quantity}</span>
                    </span>
                    <span className="text-white/50">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-white/30">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-xs text-white/30">
                  {order.shippingAddress?.city}, {order.shippingAddress?.country}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
