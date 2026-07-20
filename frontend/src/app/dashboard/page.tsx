'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  LayoutDashboard, 
  History, 
  Settings, 
  CreditCard, 
  LogOut, 
  Bell, 
  ChevronRight, 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Trash2, 
  ArrowRight, 
  Activity 
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

interface Channel {
  id: string;
  name: string;
  url: string;
  interval: string;
  alertType?: string;
  alertDesc?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Quick Monitor states
  const [targetUrl, setTargetUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [scanInterval, setScanInterval] = useState('Daily scans');

  // Channels state
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'OpenAI Pricing',
      url: 'https://openai.com/pricing',
      interval: 'DAILY',
      alertType: 'HIGH ALERT',
      alertDesc: 'API prompt caching pricing models updated'
    },
    {
      id: '2',
      name: 'Anthropic News',
      url: 'https://anthropic.com/news',
      interval: 'DAILY'
    }
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch (e) {
        localStorage.removeItem('cognify_user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('cognify_user');
    setUser(null);
    router.push('/');
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: channelName || new URL(targetUrl).hostname || 'New Channel',
      url: targetUrl,
      interval: scanInterval.split(' ')[0].toUpperCase()
    };

    setChannels([...channels, newChannel]);
    setTargetUrl('');
    setChannelName('');
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-foreground">
        <p className="text-sm font-semibold tracking-wider text-muted animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#F4F4F5] flex font-sans overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#09090B] border-r border-[#18181B] flex flex-col justify-between p-4 shrink-0">
        <div className="flex flex-col space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2 px-2 py-1">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-white to-[#A1A1AA] flex items-center justify-center shadow-md">
              <Eye className="h-4.5 w-4.5 text-black" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-[#E4E4E7] bg-clip-text text-transparent flex items-center gap-1.5">
              Cognify <span className="text-xs font-normal border border-white/20 px-1.5 py-0.25 rounded-md bg-white/5">AI</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-colors text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-colors text-sm font-medium ${
                activeTab === 'history'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <History className="h-4.5 w-4.5" />
              <span>Timeline History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-colors text-sm font-medium ${
                activeTab === 'settings'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Settings & Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-colors text-sm font-medium ${
                activeTab === 'billing'
                  ? 'bg-[#18181B] text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <CreditCard className="h-4.5 w-4.5" />
              <span>Billing & Usage</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-[#18181B] pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 flex items-center gap-3 text-left text-sm font-medium text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#18181B] bg-black px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-[#71717A] font-medium">
            <span>Workspace</span>
            <ChevronRight className="h-3 w-3" />
            {/* <span className="text-[#F4F4F5]">Demo Workspace</span> */}
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <div className="h-7 w-7 rounded-full bg-[#E4E4E7] border border-[#27272A] flex items-center justify-center font-semibold text-xs text-black shadow-inner select-none cursor-pointer">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-8 flex flex-col space-y-6 max-w-7xl w-full mx-auto text-left">
          
          {/* Header text */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Intelligence Center</h1>
            <p className="text-xs text-[#71717A]">Real-time status updates and monitored website channels.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#09090B] p-5 rounded-xl border border-[#18181B] flex flex-col justify-between min-h-[92px]">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Websites Monitored</span>
              <span className="text-2xl font-extrabold text-white mt-2">{channels.length}</span>
            </div>
            
            <div className="bg-[#09090B] p-5 rounded-xl border border-[#18181B] flex flex-col justify-between min-h-[92px]">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">AI Summaries Generated</span>
              <span className="text-2xl font-extrabold text-white mt-2">4</span>
            </div>

            <div className="bg-[#09090B] p-5 rounded-xl border border-[#18181B] flex flex-col justify-between min-h-[92px]">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Reading Time Saved</span>
              <span className="text-2xl font-extrabold text-white mt-2">60 mins</span>
            </div>

            <div className="bg-[#09090B] p-5 rounded-xl border border-[#18181B] flex flex-col justify-between min-h-[92px]">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Total Scans Performed</span>
              <span className="text-2xl font-extrabold text-[#22C55E] mt-2">22</span>
            </div>
          </div>

          {/* Main Workspace Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Columns (Watched Channels) */}
            <div className="lg:col-span-2 bg-[#09090B] border border-[#18181B] rounded-xl p-6 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-[#18181B] pb-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-[#A1A1AA]" />
                  <h3 className="font-semibold text-white text-sm">Watched Channels</h3>
                </div>
                <span className="text-xs text-[#71717A]">{channels.length} Channels Total</span>
              </div>

              {/* Channels List */}
              <div className="flex flex-col space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="p-4 rounded-xl bg-black border border-[#18181B] flex items-center justify-between text-sm hover:border-[#27272A] transition-all">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{channel.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA]">
                          {channel.interval}
                        </span>
                      </div>
                      <a href={channel.url} target="_blank" rel="noreferrer" className="text-xs text-[#71717A] hover:text-white flex items-center gap-1">
                        {channel.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      
                      {channel.alertType && (
                        <div className="mt-2 flex items-start gap-2">
                          <span className="text-[9px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded shrink-0">
                            {channel.alertType}
                          </span>
                          <span className="text-xs text-[#E4E4E7] font-medium leading-relaxed">
                            {channel.alertDesc}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-all">
                        <RotateCw className="h-4 w-4" />
                      </button>
                      <button className="px-3.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46] text-xs font-semibold text-white hover:bg-white/5 transition-all flex items-center gap-1">
                        Details <ChevronRight className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteChannel(channel.id)} 
                        className="p-2 rounded-lg text-[#71717A] hover:text-red-500 hover:bg-white/5 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Forms & Activity) */}
            <div className="flex flex-col space-y-6">
              
              {/* Quick Monitor Card */}
              <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6">
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                  <span>+</span> Quick Monitor
                </h3>
                <form onSubmit={handleAddChannel} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Target URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/pricing"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Channel Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Stripe Pricing"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Scan Interval</label>
                    <select
                      value={scanInterval}
                      onChange={(e) => setScanInterval(e.target.value)}
                      className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                    >
                      <option>Daily scans</option>
                      <option>Hourly scans</option>
                      <option>Weekly scans</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <span>Launch Cognify</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

              {/* Recent Operations */}
              <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 flex flex-col space-y-4">
                <div className="flex items-center gap-2 border-b border-[#18181B] pb-3">
                  <Activity className="h-4.5 w-4.5 text-[#22C55E]" />
                  <h3 className="font-semibold text-white text-sm">Recent Operations</h3>
                </div>

                <div className="flex flex-col space-y-4 text-xs">
                  <div className="flex gap-3">
                    <div className="w-0.5 bg-[#18181B] relative">
                      <div className="absolute top-1.5 left-[-3px] w-2 h-2 rounded-full bg-[#22C55E]" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-white font-medium">Competitor pricing scan completed</p>
                      <p className="text-[#71717A]">12 minutes ago • OpenAI Pricing</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-0.5 bg-[#18181B] relative">
                      <div className="absolute top-1.5 left-[-3px] w-2 h-2 rounded-full bg-[#22C55E]" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-white font-medium">Gemini AI diff analysis generated</p>
                      <p className="text-[#71717A]">1 hour ago • Anthropic News</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}

