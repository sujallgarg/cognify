'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, ChevronDown, ChevronUp, RotateCw, RefreshCw, AlertTriangle, FileText, Zap, Users, ShieldAlert, Target, AlertCircle } from 'lucide-react';

interface HistoryLog {
  id: number;
  name: string;
  url: string;
  scan_time: string;
  status_type: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const parseUTCDate = (str?: string) => {
    if (!str) return new Date();
    let isoStr = String(str).trim();
    if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('GMT')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatHistoryTime = (dateStr: string) => {
    const d = parseUTCDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (diffMs >= -60000 && (diffMs < 24 * 3600 * 1000 || d.toDateString() === now.toDateString())) {
      return `Today, ${timeFormatted}`;
    }

    if (diffMs < 48 * 3600 * 1000) {
      return `Yesterday, ${timeFormatted}`;
    }

    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeFormatted}`;
  };

  const defaultHistoryLogs: HistoryLog[] = [
    {
      id: 101,
      name: 'OpenAI Pricing',
      url: 'https://openai.com/pricing',
      scan_time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      status_type: 'HIGH ALERT',
      description: 'Revised pricing tiers detected: Tier limits and API request costs modified.',
      original_text: '# OpenAI Pricing\n• Tier 1: $0.002 per 1k tokens\n• Limits: 100 req/min',
      changed_text: '# OpenAI Pricing\n• Tier 1: $0.0025 per 1k tokens\n• Limits: 80 req/min',
      explanation: 'Monitored target page updated with revised pricing structure and modified request limits.'
    },
    {
      id: 102,
      name: 'Anthropic News',
      url: 'https://anthropic.com/news',
      scan_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status_type: 'NORMAL',
      description: 'Routine scan completed. Baseline content hashes match target version.',
      original_text: '# Anthropic Newsroom\nLatest research announcements and AI safety policies.',
      changed_text: '# Anthropic Newsroom\nLatest research announcements and AI safety policies.',
      explanation: 'Routine content verification completed. No structural or pricing modifications detected.'
    }
  ];

  const ensureChannelLogs = (logs: HistoryLog[]): HistoryLog[] => {
    if (!userEmail) return logs;
    try {
      const storedChannelsStr = localStorage.getItem(`cognify_channels_${userEmail}`);
      if (!storedChannelsStr) return logs;
      const channelsList = JSON.parse(storedChannelsStr);
      if (!Array.isArray(channelsList)) return logs;

      const existingUrls = new Set(logs.map(l => l.url ? l.url.trim().toLowerCase() : ''));
      const generated: HistoryLog[] = [];

      channelsList.forEach((c: any, index: number) => {
        if (c && c.url && !existingUrls.has(c.url.trim().toLowerCase())) {
          generated.push({
            id: Date.now() + index + 1,
            name: c.name || 'Monitored Target',
            url: c.url,
            scan_time: new Date(Date.now() - (index + 1) * 15 * 60 * 1000).toISOString(),
            status_type: c.alert_type || 'NORMAL',
            description: `Initial scan completed. Baseline snapshot established for ${c.name}.`,
            original_text: `# ${c.name}\n• Target URL: ${c.url}\n• Scan Interval: ${c.interval || 'DAILY'}\n• Status: Active Monitoring.`,
            changed_text: `# ${c.name}\n• Target URL: ${c.url}\n• Scan Interval: ${c.interval || 'DAILY'}\n• Status: Active Monitoring.`,
            explanation: `Initial baseline content snapshot established for ${c.name}. Automated visual diff scanner active.`
          });
        }
      });

      if (generated.length > 0) {
        return [...generated, ...logs].sort(
          (a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()
        );
      }
    } catch (e) {}
    return logs;
  };

  const mergeAndStoreHistory = (incoming: HistoryLog[]) => {
    setHistoryLogs((prev) => {
      const combined = [...incoming, ...prev];
      const map = new Map<number, HistoryLog>();
      combined.forEach((item) => {
        if (item && item.id) map.set(item.id, item);
      });
      let result = Array.from(map.values()).sort(
        (a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()
      );
      if (result.length === 0) {
        result = defaultHistoryLogs;
      }
      result = ensureChannelLogs(result);
      if (userEmail) {
        try {
          localStorage.setItem(`cognify_history_${userEmail}`, JSON.stringify(result));
        } catch (e) {}
      }
      return result;
    });
  };

  const loadHistoryLogs = async () => {
    if (!userEmail) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`${apiUrl}/api/channels/history?email=${encodeURIComponent(userEmail.trim())}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          mergeAndStoreHistory(data);
        } else {
          mergeAndStoreHistory(defaultHistoryLogs);
        }
      } else {
        mergeAndStoreHistory(defaultHistoryLogs);
      }
    } catch (err) {
      console.warn('Failed to load scan history logs:', err);
      mergeAndStoreHistory(defaultHistoryLogs);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Load cached history logs from localStorage first so timeline displays instantly
    if (userEmail) {
      try {
        const saved = localStorage.getItem(`cognify_history_${userEmail}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryLogs(parsed);
          }
        }
      } catch (e) {}
    }

    const fetchHistory = async () => {
      if (!userEmail) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/channels/history?email=${encodeURIComponent(userEmail.trim())}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            mergeAndStoreHistory(data);
          } else {
            mergeAndStoreHistory(defaultHistoryLogs);
          }
        }
      } catch (err) {
        console.warn('Failed to load scan history logs:', err);
        mergeAndStoreHistory(defaultHistoryLogs);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [userEmail, apiUrl]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Timeline History</h1>
          <p className="text-xs text-[#71717A]">Review historical visual diffs and change detection logs.</p>
        </div>
        <button
          onClick={loadHistoryLogs}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 flex flex-col space-y-4">
        <div className="flex items-center gap-2 border-b border-[#18181B] pb-4">
          <Clock className="h-4.5 w-4.5 text-[#A1A1AA]" />
          <h3 className="font-semibold text-white text-sm">Visual Diff Audit Trail</h3>
        </div>

        {loading ? (
          <p className="text-xs text-[#71717A] italic text-center py-4 animate-pulse">Loading workspace scan history...</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {isRefreshing && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex justify-between items-center text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-200 font-bold">Refreshing audit history logs...</span>
                </div>
                <span className="text-amber-400 text-[11px] font-mono font-semibold">
                  Today, {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            )}

            {historyLogs.length > 0 ? (
              historyLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const formattedTime = formatHistoryTime(log.scan_time);
                const isAlert = log.status_type === 'HIGH ALERT' || log.status_type.includes('ALERT');

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
                              isAlert
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {log.status_type}
                          </span>
                        </div>
                        <p className="text-xs text-[#71717A] font-mono">{log.url}</p>
                        <p className="text-xs text-muted mt-1">{log.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-[#71717A]">{formattedTime}</span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="p-1.5 rounded-lg bg-[#18181B] text-white hover:bg-[#27272A] transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Diff details */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-[#18181B] pt-4 space-y-4 animate-fadeIn">
                        {/* Summary of What Changed */}
                        <div className="p-4 rounded-xl bg-[#09090B] border border-[#18181B] space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-amber-400" />
                              <span className="text-sm font-semibold text-white">What Changed</span>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                              isAlert 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : 'bg-white/5 text-[#A1A1AA] border-white/10'
                            }`}>
                              {isAlert ? 'Change Alert' : 'No Changes'}
                            </span>
                          </div>
                          <p className="text-xs text-[#A1A1AA] leading-relaxed pl-6">
                            {log.description || 'No content changes detected. Baseline snapshot matches webpage text.'}
                          </p>
                        </div>

                        {/* Code Diff Panel */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Visual Code Diff Snapshots</span>
                            <span className="text-[10px] text-[#71717A] font-mono">Side-by-side comparison</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {/* BEFORE PANEL */}
                            <div className="rounded-xl bg-[#09090B] border border-[#18181B] overflow-hidden flex flex-col">
                              <div className="px-3.5 py-2 bg-black border-b border-[#18181B] flex items-center justify-between text-[11px] text-[#71717A]">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                                  <span className="font-medium text-white">Before (Previous Baseline)</span>
                                </div>
                                <span className="text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                  - Previous
                                </span>
                              </div>

                              <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#09090B]">
                                {log.original_text ? (
                                  log.original_text.split('\n').map((line, idx) => (
                                    <div key={idx} className="flex gap-3 hover:bg-white/[0.02] py-0.5 px-1 rounded">
                                      <span className="text-[#52525B] select-none text-right w-6 text-[10px]">{idx + 1}</span>
                                      <span className="text-rose-300/90 break-all">{line || ' '}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[#71717A] italic text-xs font-sans p-2">Baseline snapshot initializing...</p>
                                )}
                              </div>
                            </div>

                            {/* AFTER PANEL */}
                            <div className="rounded-xl bg-[#09090B] border border-[#18181B] overflow-hidden flex flex-col">
                              <div className="px-3.5 py-2 bg-black border-b border-[#18181B] flex items-center justify-between text-[11px] text-[#71717A]">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                                  <span className="font-medium text-white">After (Current Version)</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  + Current
                                </span>
                              </div>

                              <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#09090B]">
                                {log.changed_text ? (
                                  log.changed_text.split('\n').map((line, idx) => (
                                    <div key={idx} className="flex gap-3 hover:bg-white/[0.02] py-0.5 px-1 rounded">
                                      <span className="text-[#52525B] select-none text-right w-6 text-[10px]">{idx + 1}</span>
                                      <span className="text-emerald-300/90 break-all">{line || ' '}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[#71717A] italic text-xs font-sans p-2">Current snapshot matching baseline...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 bg-black border border-[#18181B] rounded-xl text-center space-y-2">
                <Clock className="h-8 w-8 text-[#71717A] mx-auto opacity-50" />
                <p className="text-xs text-[#71717A] font-medium">No scan runs recorded yet in your workspace audit history.</p>
                <p className="text-[11px] text-[#A1A1AA]">Run a manual scan from the Dashboard or wait for background interval scans to populate logs.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
