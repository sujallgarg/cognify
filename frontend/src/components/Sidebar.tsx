'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, LayoutDashboard, History, Settings, CreditCard, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', name: 'Timeline History', icon: History },
    { id: 'settings', name: 'Settings & Alerts', icon: Settings },
    { id: 'billing', name: 'Billing & Usage', icon: CreditCard },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-[#09090B] border-r border-[#18181B] flex-col justify-between p-4 shrink-0">
      <div className="flex flex-col space-y-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 px-2 py-1 cursor-pointer hover:opacity-85 transition-opacity">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-white to-[#A1A1AA] flex items-center justify-center shadow-md">
            <Eye className="h-4.5 w-4.5 text-black" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-[#E4E4E7] bg-clip-text text-transparent flex items-center gap-1.5">
            Cognify <span className="text-xs font-normal border border-white/20 px-1.5 py-0.25 rounded-md bg-white/5">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-all text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[#18181B] pt-4">
        <button
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2 flex items-center gap-3 text-left text-sm font-medium text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
