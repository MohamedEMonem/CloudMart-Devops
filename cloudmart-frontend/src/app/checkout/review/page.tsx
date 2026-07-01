'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/useAuth';
import { useCart } from '@/modules/cart/useCart';
import { useCheckout } from '@/modules/checkout/CheckoutContext';
import { placeOrder } from '@/modules/checkout/api';
import Button from '@/components/ui/Button';

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, subtotal, refreshCart } = useCart();
  const { shippingAddress, paymentDetails } = useCheckout();

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shippingAddress || !paymentDetails) router.replace('/checkout/shipping');
  }, [shippingAddress, paymentDetails, router]);

  if (!shippingAddress || !paymentDetails) return null;

  const handlePlaceOrder = async () => {
    if (!user?.id || cart.length === 0) return;
    setIsPlacing(true);
    setError('');

    try {
      const order = await placeOrder({
        userId: user.id,
        items: cart.map((item) => ({
          vendorId: item.vendorId || 'unknown',
          vendorName: item.vendorName || 'Unknown Vendor',
          productId: item.productId,
          productName: item.productName || 'Product',
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        shippingAddress,
      });

      sessionStorage.removeItem('cart_enrichment');
      await refreshCart();
      router.push(`/checkout/confirmation?orderId=${order.id}`);
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
        ?.message;
      const msg = Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
      setError(typeof msg === 'string' ? msg : 'Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-50">Review your order</h1>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Items</h2>
        <ul className="space-y-2">
          {cart.map((item) => (
            <li key={item.productId} className="flex items-center justify-between text-sm">
              <span className="text-neutral-300">
                {item.productName}
                <span className="ml-2 text-neutral-500">× {item.quantity}</span>
              </span>
              <span className="text-neutral-400">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
          <span className="text-sm text-neutral-400">Total</span>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-400 to-accent2-400">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Shipping to</h2>
          <button
            onClick={() => router.push('/checkout/shipping')}
            className="text-xs font-medium text-accent-400 hover:text-accent-300"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          {shippingAddress.fullName}
          <br />
          {shippingAddress.street}, {shippingAddress.city}
          <br />
          {shippingAddress.country} {shippingAddress.postalCode}
          <br />
          {shippingAddress.phone}
        </p>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">Payment</h2>
          <button
            onClick={() => router.push('/checkout/payment')}
            className="text-xs font-medium text-accent-400 hover:text-accent-300"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          {paymentDetails.method === 'card'
            ? `Card ending in ${paymentDetails.cardLast4 || '****'}`
            : 'PayPal'}
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPlacing}>
          Back
        </Button>
        <Button onClick={handlePlaceOrder} disabled={isPlacing || cart.length === 0} className="flex-1">
          {isPlacing ? 'Placing order…' : `Place order — $${subtotal.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
