'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface PaymentDetails {
  method: 'card' | 'paypal';
  cardName?: string;
  cardLast4?: string;
}

interface CheckoutContextValue {
  shippingAddress: ShippingAddress | null;
  paymentDetails: PaymentDetails | null;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentDetails: (payment: PaymentDetails) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  return (
    <CheckoutContext.Provider
      value={{ shippingAddress, paymentDetails, setShippingAddress, setPaymentDetails }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within <CheckoutProvider>');
  return ctx;
}
