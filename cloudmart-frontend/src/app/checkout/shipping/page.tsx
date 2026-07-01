'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/modules/cart/useCart';
import { useCheckout, type ShippingAddress } from '@/modules/checkout/CheckoutContext';
import Button from '@/components/ui/Button';

const fields: { name: keyof ShippingAddress; label: string; placeholder: string }[] = [
  { name: 'fullName', label: 'Full name', placeholder: 'Jane Doe' },
  { name: 'street', label: 'Street address', placeholder: '123 Demo Street' },
  { name: 'city', label: 'City', placeholder: 'Cairo' },
  { name: 'country', label: 'Country', placeholder: 'Egypt' },
  { name: 'postalCode', label: 'Postal code', placeholder: '12345' },
  { name: 'phone', label: 'Phone number', placeholder: '+20 100 000 0000' },
];

export default function ShippingPage() {
  const router = useRouter();
  const { cart, isCartLoading } = useCart();
  const { shippingAddress, setShippingAddress } = useCheckout();
  const [form, setForm] = useState<ShippingAddress>(
    shippingAddress ?? { fullName: '', street: '', city: '', country: '', postalCode: '', phone: '' },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingAddress(form);
    router.push('/checkout/payment');
  };

  if (!isCartLoading && cart.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center">
        <p className="text-neutral-300">Your cart is empty.</p>
        <Button href="/products" className="mt-4">
          Browse the catalog
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold text-neutral-50">Shipping address</h1>

      {fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1.5 block text-xs text-neutral-400" htmlFor={field.name}>
            {field.label}
          </label>
          <input
            id={field.name}
            required
            value={form[field.name]}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-neutral-50 placeholder-neutral-600 outline-none transition focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
          />
        </div>
      ))}

      <Button type="submit" className="w-full">
        Continue to payment
      </Button>
    </form>
  );
}
