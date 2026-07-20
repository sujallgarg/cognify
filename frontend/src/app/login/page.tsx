'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, ArrowRight, Lock, Mail } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        router.push('/dashboard');
      } catch (e) {
        localStorage.removeItem('cognify_user');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('cognify_user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden text-foreground">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[150px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[150px] -z-10" />

      <div className="w-full max-w-md glass p-8 rounded-xl border border-white/10 flex flex-col space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/20 mb-2">
            <Eye className="h-6 w-6 text-black" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-sm text-muted">Sign in to your Cognify AI account</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-black/40 border border-white/5 focus:border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-muted focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted">Password</label>
              <a href="#" className="text-xs text-white hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/5 focus:border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-muted focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-primary-hover disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </form>

        <div className="border-t border-white/5 pt-4 text-center">
          <p className="text-xs text-muted">
            Don't have an account?{' '}
            <Link href="/register" className="text-white hover:underline font-semibold">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
