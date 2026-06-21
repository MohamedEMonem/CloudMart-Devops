'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex-1 max-w-sm w-full mx-auto px-6 py-8 mt-20">
        <h2 className="text-2xl font-bold mb-2">
          {isRegistering ? 'Create an account' : 'Sign in'}
        </h2>
        <p className="text-sm text-white/40 mb-8">
          {isRegistering
            ? 'Join Dokkan to start tracking your orders.'
            : 'Authenticate to receive real-time order updates.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                             text-white placeholder-white/20 outline-none
                             focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                  placeholder="John"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                             text-white placeholder-white/20 outline-none
                             focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-white/20 outline-none
                         focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-white/20 outline-none
                         focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition"
              placeholder="••••••••"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
              {authSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       font-medium text-sm transition-colors"
          >
            {isSubmitting
              ? (isRegistering ? 'Creating account…' : 'Signing in…')
              : (isRegistering ? 'Register' : 'Sign in')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/50">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            {isRegistering ? 'Sign in' : 'Register here'}
          </button>
        </div>
      </div>
    </main>
  );
}
