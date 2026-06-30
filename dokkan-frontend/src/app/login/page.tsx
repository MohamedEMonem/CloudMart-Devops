'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/useAuth';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register({ firstName, lastName, email, password });
        setAuthSuccess('Account created successfully! Please sign in.');
        setIsRegistering(false);
        setPassword('');
        setFirstName('');
        setLastName('');
      } else {
        await login({ email, password });
        router.push('/');
      }
    } catch (err: any) {
      const apiMessage = err.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage[0]
        : typeof apiMessage === 'string'
          ? apiMessage
          : err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 max-w-sm w-full mx-auto px-6 py-8 mt-20">
        <h2 className="text-2xl font-bold mb-2 text-neutral-50">
          {isRegistering ? 'Create an account' : 'Sign in'}
        </h2>
        <p className="text-sm text-neutral-400 mb-8">
          {isRegistering
            ? 'Join Dokkan to start tracking your orders.'
            : 'Authenticate to receive real-time order updates.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-neutral-400 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700
                             text-neutral-50 placeholder-neutral-600 outline-none
                             focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition"
                  placeholder="John"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-400 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700
                             text-neutral-50 placeholder-neutral-600 outline-none
                             focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700
                         text-neutral-50 placeholder-neutral-600 outline-none
                         focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700
                         text-neutral-50 placeholder-neutral-600 outline-none
                         focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition"
              placeholder="••••••••"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
              {authSuccess}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? (isRegistering ? 'Creating account…' : 'Signing in…')
              : (isRegistering ? 'Register' : 'Sign in')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-400">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-2 text-accent-400 hover:text-accent-300 font-medium"
          >
            {isRegistering ? 'Sign in' : 'Register here'}
          </button>
        </div>
      </div>
    </main>
  );
}
