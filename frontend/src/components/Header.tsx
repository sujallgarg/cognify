'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, ArrowRight } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('cognify_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cognify_user');
    setUser(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center w-full">
      <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Eye className="h-5 w-5 text-black" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Cognify <span className="text-primary font-medium text-sm border border-primary/20 px-2 py-0.5 rounded-full ml-1 bg-primary/10">AI</span>
        </span>
      </Link>
      <nav className="hidden md:flex space-x-8 text-sm text-muted font-medium">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#demo" className="hover:text-foreground transition-colors">AI Demo</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm font-semibold hover:text-foreground text-muted transition-colors">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-primary hover:bg-primary-hover text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 cursor-pointer"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-semibold hover:text-foreground text-muted transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-primary hover:bg-primary-hover text-black text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-1">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
