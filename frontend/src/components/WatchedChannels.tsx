'use client';

import React, { useState } from 'react';
import { Globe, ExternalLink, RotateCw, ChevronRight, Trash2, Sparkles } from 'lucide-react';

interface Channel {
  id: string | number;
  name: string;
  url: string;
  interval: string;
  alert_type?: string;
  alert_desc?: string;
  original_text?: string;
  last_text?: string;
  last_scanned_at?: string;
}

interface WatchedChannelsProps {
  channels: Channel[];
  onDeleteChannel: (id: string | number) => void;
  onSelectDetails: (channel: Channel) => void;
  onScanChannel: (channel: Channel) => void;
  onSummarizeChannel?: (channel: Channel) => void;
}

export default function WatchedChannels({ channels, onDeleteChannel, onSelectDetails, onScanChannel, onSummarizeChannel }: WatchedChannelsProps) {
  const [activeScanningId, setActiveScanningId] = useState<string | number | null>(null);

  const handleScanClick = async (channel: Channel) => {
    setActiveScanningId(channel.id);
    try {
      await onScanChannel(channel);
    } finally {
      setActiveScanningId(null);
    }
  };

  const parseUTCDate = (str?: string) => {
    if (!str) return new Date();
    let isoStr = str.trim();
    if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('GMT')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const getFormattedScanTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const dateObj = parseUTCDate(timestamp);
    const diffMs = Date.now() - dateObj.getTime();
    if (diffMs < 0 || diffMs < 30000) return 'Just now';
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
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
        {channels.length > 0 ? (
          channels.map((channel) => {
            const isScanningThis = activeScanningId === channel.id;
            const formattedTime = getFormattedScanTime(channel.last_scanned_at);

            return (
              <div
                key={channel.id}
                className="p-4 rounded-xl bg-black border border-[#18181B] flex items-center justify-between gap-4 text-sm hover:border-[#27272A] transition-all overflow-hidden"
              >
                <div className="flex flex-col space-y-1 text-left min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">{channel.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] shrink-0">
                      {channel.interval}
                    </span>
                    <span className="text-[9px] text-[#71717A] bg-[#18181B]/60 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      {isScanningThis ? (
                        <>
                          <RotateCw className="h-2.5 w-2.5 animate-spin text-white" />
                          <span className="text-white font-semibold">Scanning...</span>
                        </>
                      ) : (
                        `Last scan: ${formattedTime}`
                      )}
                    </span>
                  </div>
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#71717A] hover:text-white flex items-center gap-1 min-w-0 max-w-full"
                    title={channel.url}
                  >
                    <span className="truncate flex-1 max-w-[220px] sm:max-w-[340px] md:max-w-[420px]">{channel.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>

                  {channel.alert_type && (
                    <div className="mt-2 flex items-start gap-2 max-w-full">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        channel.alert_type === 'UNTRACKABLE'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-[#FEF3C7] border-transparent text-[#D97706]'
                      }`}>
                        {channel.alert_type}
                      </span>
                      <span className="text-xs text-[#E4E4E7] font-medium leading-relaxed truncate max-w-[220px] sm:max-w-[340px] md:max-w-[420px]">
                        {channel.alert_desc}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {onSummarizeChannel && (
                    <button
                      onClick={() => onSummarizeChannel(channel)}
                      className="px-3 py-1.5 rounded-xl border border-[#27272A] text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] hover:border-white/40 shadow-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                      title="Summarize website changes with AI"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-white group-hover:rotate-12 transition-transform duration-200" />
                      <span>Summarize</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleScanClick(channel)}
                    disabled={isScanningThis}
                    className="p-2 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer"
                    title="Scan website target now"
                  >
                    <RotateCw className={`h-4 w-4 ${isScanningThis ? 'animate-spin text-white' : ''}`} />
                  </button>
                  <button 
                    onClick={() => onSelectDetails(channel)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46] text-xs font-semibold text-white hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Details <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDeleteChannel(channel.id)}
                    className="p-2 rounded-lg text-[#71717A] hover:text-red-500 hover:bg-white/5 transition-all cursor-pointer"
                    title="Delete channel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-[#71717A] italic text-center py-4">No channels added yet. Use Quick Monitor on the right to start watching!</p>
        )}
      </div>
    </div>
  );
}
