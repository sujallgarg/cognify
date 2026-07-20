'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryLog {
  id: number;
  name: string;
  url: string;
  scan_time: string;
  status_type: 'HIGH ALERT' | 'LOW ALERT' | 'NO CHANGES';
  description: string;
  original_text: string;
  changed_text: string;
  explanation: string;
}

interface TimelineHistoryTabProps {
  userEmail: string;
}

export default function TimelineHistoryTab({ userEmail }: TimelineHistoryTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/api/channels/history?email=${userEmail}`);
        if (response.ok) {
          const data = await response.json();
          setHistoryLogs(data);
        }
      } catch (err) {
        console.error('Failed to load scan history logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userEmail]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Timeline History</h1>
        <p className="text-xs text-[#71717A]">Review historical visual diffs and change detection logs.</p>
      </div>

      <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 flex flex-col space-y-4">
        <div className="flex items-center gap-2 border-b border-[#18181B] pb-4">
          <Clock className="h-4.5 w-4.5 text-[#A1A1AA]" />
          <h3 className="font-semibold text-white text-sm">Visual Diff Logs</h3>
        </div>

        {loading ? (
          <p className="text-xs text-[#71717A] italic text-center py-4 animate-pulse">Loading logs...</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {historyLogs.length > 0 ? (
              historyLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const formattedTime = new Date(log.scan_time).toLocaleString();
                
                return (
                  <div
                    key={log.id}
                    className="p-5 rounded-xl bg-black border border-[#18181B] flex flex-col space-y-4 hover:border-[#27272A] transition-all"
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{log.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              log.status_type === 'HIGH ALERT'
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : log.status_type === 'LOW ALERT'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-[#18181B] text-[#A1A1AA]'
                            }`}
                          >
                            {log.status_type}
                          </span>
                        </div>
                        <p className="text-xs text-[#71717A]">{log.url}</p>
                        <p className="text-xs text-muted mt-1">{log.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-[#71717A]">{formattedTime}</span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="p-1 rounded bg-[#18181B] text-white hover:bg-[#27272A] transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Diff details */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-[#18181B] pt-4 space-y-4 animate-fadeIn">
                        {/* Gemini AI explanation */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                            <span>Gemini Change Intelligence</span>
                          </div>
                          <p className="text-xs text-[#A1A1AA] leading-relaxed">{log.explanation}</p>
                        </div>

                        {/* Diff box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Before</span>
                            <pre className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs font-mono text-red-300 overflow-x-auto whitespace-pre-wrap">
                              {log.original_text}
                            </pre>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">After</span>
                            <pre className="p-3 bg-green-950/20 border border-green-900/30 rounded-lg text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">
                              {log.changed_text}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#71717A] italic text-center py-4">No scan runs recorded yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
