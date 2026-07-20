'use client';

import React from 'react';

interface StatsCardsProps {
  channelsCount: number;
  summariesCount: number;
  timeSavedMins: number;
  scansCount: number;
}

export default function StatsCards({
  channelsCount,
  summariesCount,
  timeSavedMins,
  scansCount,
}: StatsCardsProps) {
  const stats = [
    { label: 'Websites Monitored', value: channelsCount, color: 'text-white' },
    { label: 'AI Summaries Generated', value: summariesCount.toString(), color: 'text-white' },
    { label: 'Reading Time Saved', value: `${timeSavedMins} mins`, color: 'text-white' },
    { label: 'Total Scans Performed', value: scansCount.toString(), color: 'text-[#22C55E]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-[#09090B] p-5 rounded-xl border border-[#18181B] flex flex-col justify-between min-h-[92px] hover:border-[#27272A] transition-all"
        >
          <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">{stat.label}</span>
          <span className={`text-2xl font-extrabold mt-2 ${stat.color}`}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
