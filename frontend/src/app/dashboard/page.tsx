'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Layers } from 'lucide-react';
import Header from '../../components/Header';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        fetchUsers();
      } catch (e) {
        localStorage.removeItem('cognify_user');
        router.push('/login');
      }
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cognify_user');
    setUser(null);
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <p className="text-sm font-semibold tracking-wider text-muted animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[150px] -z-10 pointer-events-none" />

      <Header />

      <main className="flex-1 p-6 md:p-12 max-w-7xl w-full mx-auto flex gap-6 text-left">
        <div className="w-1/4 border-r border-white/5 pr-6 flex flex-col space-y-3">
          <h2 className="text-lg font-bold text-white">Hi, {user.name}!</h2>
          <p className="text-xs text-muted font-mono truncate">{user.email}</p>
          <div className="h-10 w-full bg-white/10 border border-white/25 rounded-xl px-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">Users Feed</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full hover:bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-colors text-left text-sm text-muted hover:text-white"
          >
            <Layers className="h-4 w-4 text-muted" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Overview</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Active Users</span>
              <span className="text-3xl font-extrabold text-white mt-2">{usersList.length}</span>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">DB Engines</span>
              <span className="text-3xl font-extrabold text-white mt-2">PostgreSQL</span>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Connection Status</span>
              <span className="text-3xl font-extrabold text-green-400 mt-2">Online</span>
            </div>
          </div>

          <div className="glass p-6 rounded-xl border border-white/5 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Registered System Users</h3>
            {usersList.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {usersList.map((u) => (
                  <li key={u.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-sm hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white">{u.name}</span>
                    </div>
                    <span className="text-xs text-muted font-mono">{u.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted italic">No users found.</p>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 px-6 md:px-12 bg-black/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted text-xs">&copy; 2026 Cognify AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
