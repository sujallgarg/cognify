'use client';

import React from 'react';
import { Globe, ExternalLink, RotateCw, ChevronRight, Trash2 } from 'lucide-react';

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
}

export default function WatchedChannels({ channels, onDeleteChannel, onSelectDetails, onScanChannel }: WatchedChannelsProps) {
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
            const formattedTime = channel.last_scanned_at 
              ? new Date(channel.last_scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now';

            return (
              <div
                key={channel.id}
                className="p-4 rounded-xl bg-black border border-[#18181B] flex items-center justify-between text-sm hover:border-[#27272A] transition-all"
              >
                <div className="flex flex-col space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{channel.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA]">
                      {channel.interval}
                    </span>
                    <span className="text-[9px] text-[#71717A] bg-[#18181B]/60 px-1.5 py-0.5 rounded">
                      Last scan: {formattedTime}
                    </span>
                  </div>
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#71717A] hover:text-white flex items-center gap-1"
                  >
                    {channel.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {channel.alert_type && (
                    <div className="mt-2 flex items-start gap-2">
                      <span className="text-[9px] font-bold bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded shrink-0">
                        {channel.alert_type}
                      </span>
                      <span className="text-xs text-[#E4E4E7] font-medium leading-relaxed">
                        {channel.alert_desc}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => onScanChannel(channel)}
                    className="p-2 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <RotateCw className="h-4 w-4" />
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
