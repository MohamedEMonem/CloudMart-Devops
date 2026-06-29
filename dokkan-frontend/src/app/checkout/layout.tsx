'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/useAuth';
import { CheckoutProvider } from '@/modules/checkout/CheckoutContext';
import CheckoutSteps from '@/modules/checkout/components/CheckoutSteps';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
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
    <CheckoutProvider>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <CheckoutSteps />
        {children}
      </main>
    </CheckoutProvider>
  );
}
