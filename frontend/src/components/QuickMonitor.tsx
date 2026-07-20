'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickMonitorProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  channelName: string;
  setChannelName: (name: string) => void;
  scanInterval: string;
  setScanInterval: (interval: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function QuickMonitor({
  targetUrl,
  setTargetUrl,
  channelName,
  setChannelName,
  scanInterval,
  setScanInterval,
  onSubmit,
}: QuickMonitorProps) {
  return (
    <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6">
      <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
        <span>+</span> Quick Monitor
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
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
  );
}
