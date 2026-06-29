'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckout, type PaymentDetails } from '@/modules/checkout/CheckoutContext';
import Button from '@/components/ui/Button';

export default function PaymentPage() {
  const router = useRouter();
  const { shippingAddress, paymentDetails, setPaymentDetails } = useCheckout();
  const [method, setMethod] = useState<PaymentDetails['method']>(paymentDetails?.method ?? 'card');
  const [cardName, setCardName] = useState(paymentDetails?.cardName ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!shippingAddress) router.replace('/checkout/shipping');
  }, [shippingAddress, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentDetails({
      method,
      cardName: method === 'card' ? cardName : undefined,
      cardLast4: method === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) : undefined,
    });
    router.push('/checkout/review');
  };

  if (!shippingAddress) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-50">Payment method</h1>

      <div className="flex gap-2">
        {(['card', 'paypal'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              method === m
                ? 'border-accent-500/40 bg-accent-500/15 text-accent-300'
                : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600'
            }`}
          >
            {m === 'card' ? 'Credit / Debit card' : 'PayPal'}
          </button>
        ))}
      </div>

      {method === 'card' ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-neutral-400" htmlFor="cardName">
              Name on card
            </label>
            <input
              id="cardName"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-50 placeholder-neutral-600 outline-none transition focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-neutral-400" htmlFor="cardNumber">
              Card number
            </label>
            <input
              id="cardNumber"
              required
              inputMode="numeric"
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-50 placeholder-neutral-600 outline-none transition focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-neutral-400" htmlFor="expiry">
                Expiry
              </label>
              <input
                id="expiry"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-50 placeholder-neutral-600 outline-none transition focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-neutral-400" htmlFor="cvc">
                CVC
              </label>
              <input
                id="cvc"
                required
                inputMode="numeric"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-50 placeholder-neutral-600 outline-none transition focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            This is a demo checkout — no real payment is processed.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
          You&apos;ll be redirected to PayPal to complete payment. (Demo only — no real redirect.)
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to review
        </Button>
      </div>
    </form>
  );
}
