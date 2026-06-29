'use client';

import { AuthProvider } from '@/modules/auth/useAuth';
import { CartProvider } from '@/modules/cart/useCart';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
