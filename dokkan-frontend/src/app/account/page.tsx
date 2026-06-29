'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/useAuth';
import Button from '@/components/ui/Button';

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-200" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-neutral-50 sm:text-3xl">My Account</h1>

      <section className="mt-8 flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent2-500 text-lg font-bold text-white">
          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-neutral-50">{user?.name || 'Dokkan customer'}</p>
          <p className="text-sm text-neutral-400">{user?.email}</p>
          {user?.role && (
            <span className="mt-1 inline-block rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-400">
              {user.role}
            </span>
          )}
        </div>
      </section>

      <section className="mt-6 divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
        <Link
          href="/orders"
          className="flex items-center justify-between px-5 py-4 text-sm text-neutral-300 transition-colors hover:bg-neutral-800/50"
        >
          My orders
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/products"
          className="flex items-center justify-between px-5 py-4 text-sm text-neutral-300 transition-colors hover:bg-neutral-800/50"
        >
          Browse catalog
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <Button variant="danger" onClick={logout} className="mt-6">
        Log out
      </Button>
    </main>
  );
}
