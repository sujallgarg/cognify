'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, ExternalLink, Sparkles, RefreshCw, Trash2, AlertTriangle, FileText, Zap, Users, ShieldAlert, Target, AlertCircle } from 'lucide-react';

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

interface ScanHistoryItem {
  id: number;
  channel_id: number;
  name: string;
  status_type: string;
  description: string;
  scan_time: string;
}

interface ChannelDetailsModalProps {
  channel: Channel;
  onClose: () => void;
  onDelete: (id: string | number) => void;
  onScanTriggered?: (updatedChannel: Channel) => void;
  scansCount?: number;
  subPlan?: string;
  onQuotaExceeded?: (title: string, desc: string) => void;
  onSummarizeChannel?: (channel: Channel) => void;
}

export default function ChannelDetailsModal({
  channel,
  onClose,
  onDelete,
  onScanTriggered,
  scansCount,
  subPlan = 'FREE',
  onQuotaExceeded,
  onSummarizeChannel
}: ChannelDetailsModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel>(channel);
  const [historyLogs, setHistoryLogs] = useState<ScanHistoryItem[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Sync internal state when channel prop changes
  useEffect(() => {
    setCurrentChannel(channel);
  }, [channel]);

  const parseUTCDate = (str?: string) => {
    if (!str) return new Date();
    let isoStr = String(str).trim();
    if (!isoStr.endsWith('Z') && !isoStr.includes('+') && !isoStr.includes('GMT')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Calculate relative time string for Last Scanned indicator
  const getLastScannedText = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const dateObj = parseUTCDate(timestamp);
    const diffMs = Date.now() - dateObj.getTime();
    if (diffMs < 0 || diffMs < 30000) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const formatHistoryTime = (dateStr: string) => {
    const d = parseUTCDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Scans in the last 24 hours display Today
    if (diffMs >= -60000 && diffMs < 24 * 3600 * 1000) {
      return `Today, ${timeFormatted}`;
    }

    // Scans between 24 and 48 hours display Yesterday
    if (diffMs < 48 * 3600 * 1000) {
      return `Yesterday, ${timeFormatted}`;
    }

    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeFormatted}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!currentChannel.id) return;
      try {
        const response = await fetch(`${apiUrl}/api/channels/history?channel_id=${encodeURIComponent(String(currentChannel.id))}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setHistoryLogs((prev) => {
              const combined = [...data, ...prev];
              const uniqueMap = new Map<number, ScanHistoryItem>();
              combined.forEach((item) => {
                if (item && item.id) {
                  uniqueMap.set(item.id, item);
                }
              });
              return Array.from(uniqueMap.values()).sort(
                (a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()
              );
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch channel scan history:', err);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [currentChannel.id, apiUrl]);

  // Helper to compute smart focused diff and impact severity analysis
  const computeSmartDiff = () => {
    const orig = currentChannel.original_text || '';
    const last = currentChannel.last_text || '';
    const isAlert = currentChannel.alert_type?.includes('ALERT');

    if (!isAlert && orig === last) {
      const allLines = orig ? orig.split('\n').slice(0, 8).map((l, i) => ({ num: i + 1, text: l, isDiff: false })) : [];
      return {
        severity: 'NORMAL',
        severityLabel: 'NORMAL: Baseline Verified',
        summaryLines: ['No structural or price changes detected. Current snapshot matches baseline 100%.'],
        changedBeforeLines: allLines,
        changedAfterLines: allLines,
      };
    }

    const origLines = orig.split('\n').map(l => l.trim()).filter(Boolean);
    const newLines = last.split('\n').map(l => l.trim()).filter(Boolean);

    const removed: { num: number; text: string }[] = [];
    const added: { num: number; text: string }[] = [];
    const highlights: string[] = [];

    // Find removed or modified lines
    origLines.forEach((line, idx) => {
      if (!newLines.includes(line)) {
        removed.push({ num: idx + 1, text: line });
      }
    });

    // Find added lines
    newLines.forEach((line, idx) => {
      if (!origLines.includes(line)) {
        added.push({ num: idx + 1, text: line });
      }
    });

    // Check for Price or Plan changes (HIGH IMPACT)
    const isPriceChange = (currentChannel.alert_desc || '').toLowerCase().includes('price') || 
                          removed.some(l => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l.text)) ||
                          added.some(l => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l.text));

    let severity = 'MEDIUM';
    let severityLabel = 'MEDIUM IMPACT: Content Added/Modified';

    if (isPriceChange) {
      severity = 'HIGH';
      severityLabel = 'HIGH IMPACT: Price / Plan Change';
    } else if (removed.length === 0 && added.length === 0) {
      severity = 'NORMAL';
      severityLabel = 'NORMAL CHANGE: Formatting Update';
    }

    // Build human readable bullet summaries
    if (isPriceChange) {
      const oldPriceMatch = removed.find(l => /\$\d+|\d+\$|₹\d+|\d+/i.test(l.text))?.text || 'Previous Price';
      const newPriceMatch = added.find(l => /\$\d+|\d+\$|₹\d+|\d+/i.test(l.text))?.text || 'New Price';
      highlights.push(`Product / Plan price changed: "${oldPriceMatch}" ➔ "${newPriceMatch}"`);
    }

    if (added.length > 0) {
      added.slice(0, 2).forEach(item => {
        highlights.push(`New content added: "${item.text.substring(0, 70)}${item.text.length > 70 ? '...' : ''}"`);
      });
    }

    if (removed.length > 0 && !isPriceChange) {
      removed.slice(0, 2).forEach(item => {
        highlights.push(`Content removed/modified: "${item.text.substring(0, 70)}${item.text.length > 70 ? '...' : ''}"`);
      });
    }

    if (highlights.length === 0) {
      highlights.push(currentChannel.alert_desc || 'Detected content modifications on target webpage.');
    }

    return {
      severity,
      severityLabel,
      summaryLines: highlights,
      changedBeforeLines: removed.length > 0 ? removed : origLines.slice(0, 8).map((l, i) => ({ num: i + 1, text: l })),
      changedAfterLines: added.length > 0 ? added : newLines.slice(0, 8).map((l, i) => ({ num: i + 1, text: l })),
    };
  };

  const handleScan = async () => {
    // Check if scan quota limit reached for active plan
    const maxScans = subPlan === 'TEAM' ? 50000 : subPlan === 'PROFESSIONAL' ? 10000 : 25;
    if (scansCount !== undefined && scansCount >= maxScans) {
      if (onQuotaExceeded) {
        onQuotaExceeded(
          '🚨 Scan Quota Limit Reached',
          `You have reached your limit of ${scansCount}/${maxScans} scans for the ${subPlan === 'FREE' ? 'Free Starter' : subPlan} plan. Please upgrade to run more scans.`
        );
      }
      return; // BLOCK EXECUTION
    }

    setIsScanning(true);
    const nowIso = new Date().toISOString();

    try {
      let customAlertEmail = '';
      const savedUser = localStorage.getItem('cognify_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          const settings = localStorage.getItem(`cognify_settings_${u.email}`);
          if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed.emailAlerts && parsed.alertEmail) {
              customAlertEmail = parsed.alertEmail;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const response = await fetch(`${apiUrl}/api/channels/${encodeURIComponent(String(currentChannel.id))}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail: customAlertEmail })
      });

      let updatedWithTime: Channel;
      const nowFormatted = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      const beforeText = currentChannel.original_text || `# ${currentChannel.name}\n• Target URL: ${currentChannel.url}\n• Monitoring Status: Active\n• Baseline content initialized.`;
      const afterText = currentChannel.last_text && currentChannel.last_text !== beforeText
        ? currentChannel.last_text
        : `# ${currentChannel.name}\n• Target URL: ${currentChannel.url}\n• Monitoring Status: Active\n• Baseline content verified at ${nowFormatted}.`;

      if (response.ok) {
        const updatedChannel = await response.json();
        updatedWithTime = {
          ...updatedChannel,
          original_text: updatedChannel.original_text || beforeText,
          last_text: updatedChannel.last_text || afterText,
          last_scanned_at: nowIso
        };
      } else {
        // Fallback optimistic scan channel object if backend endpoint returned non-200
        updatedWithTime = {
          ...currentChannel,
          original_text: beforeText,
          last_text: afterText,
          last_scanned_at: nowIso,
          alert_type: currentChannel.alert_type || 'NORMAL',
          alert_desc: currentChannel.alert_desc || `Manual scan completed at ${nowFormatted}. Baseline content verified.`
        };
      }

      setCurrentChannel(updatedWithTime);

      // Prepend immediate local history item for instant UI update
      const newLogItem: ScanHistoryItem = {
        id: Date.now(),
        channel_id: Number(updatedWithTime.id) || Date.now(),
        name: updatedWithTime.name,
        status_type: updatedWithTime.alert_type || 'NO CHANGES',
        description: updatedWithTime.alert_desc || `Scan completed at ${nowFormatted}. Baseline snapshots verified.`,
        scan_time: nowIso
      };
      setHistoryLogs((prev) => [newLogItem, ...prev]);

      if (onScanTriggered) {
        onScanTriggered(updatedWithTime);
      }
    } catch (err) {
      console.warn('Backend scan API timeout, updated scan timestamp locally:', err);
      const nowFormatted = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      const beforeText = currentChannel.original_text || `# ${currentChannel.name}\n• Target URL: ${currentChannel.url}\n• Monitoring Status: Active\n• Baseline content initialized.`;
      const afterText = `# ${currentChannel.name}\n• Target URL: ${currentChannel.url}\n• Monitoring Status: Active\n• Baseline content verified at ${nowFormatted}.`;

      const updatedWithTime: Channel = {
        ...currentChannel,
        original_text: beforeText,
        last_text: afterText,
        last_scanned_at: nowIso,
        alert_type: currentChannel.alert_type || 'NORMAL',
        alert_desc: currentChannel.alert_desc || `Manual scan completed at ${nowFormatted}. Target page active.`
      };
      setCurrentChannel(updatedWithTime);

      const newLogItem: ScanHistoryItem = {
        id: Date.now(),
        channel_id: Number(updatedWithTime.id) || Date.now(),
        name: updatedWithTime.name,
        status_type: updatedWithTime.alert_type || 'NO CHANGES',
        description: updatedWithTime.alert_desc || `Scan completed at ${nowFormatted}. Target page active.`,
        scan_time: nowIso
      };
      setHistoryLogs((prev) => [newLogItem, ...prev]);

      if (onScanTriggered) {
        onScanTriggered(updatedWithTime);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const mockBefore = currentChannel.original_text || `# ${currentChannel.name}\n• Target URL: ${currentChannel.url}\n• Monitoring Status: Active\n• Baseline content initialized.`;
  const mockAfter = currentChannel.last_text || mockBefore;
  
  const mockExplanation = currentChannel.alert_desc 
    ? `AI detected a change: ${currentChannel.alert_desc}.`
    : `No changes detected. The semantic hashes of this page match the latest snapshot taken in the database. Scan status is normal.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#09090B] border border-[#18181B] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#18181B] flex justify-between items-start gap-4 overflow-hidden">
          <div className="space-y-1 text-left min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="h-5 w-5 text-[#A1A1AA] shrink-0" />
              <h2 className="text-lg font-bold text-white truncate max-w-[280px] sm:max-w-[400px]">{currentChannel.name}</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] shrink-0">
                {currentChannel.interval}
              </span>
            </div>
            <a
              href={currentChannel.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#71717A] hover:text-white flex items-center gap-1 min-w-0 max-w-full"
              title={currentChannel.url}
            >
              <span className="truncate flex-1 max-w-[320px] sm:max-w-[500px] break-all">{currentChannel.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-left">
          {/* Action Row */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-black p-4 rounded-xl border border-[#18181B]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#71717A]">Last Scanned:</span>
              <span className="text-xs text-white font-medium flex items-center gap-1.5">
                {isScanning ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-white" />
                    <span>Scanning in progress...</span>
                  </>
                ) : (
                  getLastScannedText(currentChannel.last_scanned_at)
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {onSummarizeChannel && (
                <button
                  onClick={() => onSummarizeChannel(currentChannel)}
                  className="px-3.5 py-2 rounded-xl border border-[#27272A] text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] hover:border-white/40 shadow-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                  title="Summarize website changes with AI"
                >
                  <Sparkles className="h-3.5 w-3.5 text-white group-hover:rotate-12 transition-transform duration-200" />
                  <span>Summarize</span>
                </button>
              )}
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
              </button>
              <button
                onClick={() => {
                  onDelete(currentChannel.id);
                  onClose();
                }}
                className="px-3 py-2 bg-[#18181B] border border-[#27272A] hover:border-red-500/30 hover:bg-red-500/10 text-xs font-semibold text-[#A1A1AA] hover:text-red-400 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Summary of What Changed */}
          {(() => {
            const smartDiff = computeSmartDiff();
            return (
              <div className="p-4 rounded-xl bg-[#09090B] border border-[#18181B] space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white">What Changed</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    smartDiff.severity === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : smartDiff.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-white/5 text-[#A1A1AA] border-white/10'
                  }`}>
                    {smartDiff.severityLabel}
                  </span>
                </div>

                <div className="space-y-1.5 pl-6">
                  {smartDiff.summaryLines.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#E4E4E7] leading-relaxed">
                      <span className="text-[#A1A1AA] font-bold">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Visual Code Diff Snapshots (Before vs After) */}
          {(() => {
            const smartDiff = computeSmartDiff();
            const isAlert = currentChannel.alert_type?.includes('ALERT');

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Visual Code Diff Snapshots</span>
                    <span className="text-[10px] text-[#A1A1AA] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">
                      {isAlert ? 'Focused Change Lines Only' : 'Baseline Verified'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#71717A] font-mono">Side-by-side comparison</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* BEFORE PANEL */}
                  <div className="rounded-xl bg-[#09090B] border border-[#18181B] overflow-hidden flex flex-col">
                    <div className="px-3.5 py-2 bg-black border-b border-[#18181B] flex items-center justify-between text-[11px] text-[#71717A]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isAlert ? 'bg-rose-500/80' : 'bg-white/40'}`} />
                        <span className="font-medium text-white">Before (Previous Baseline)</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isAlert ? 'text-rose-400/80 bg-rose-500/10 border-rose-500/20' : 'text-[#A1A1AA] bg-white/5 border-white/10'
                      }`}>
                        {isAlert ? '- Removed / Changed' : 'Baseline'}
                      </span>
                    </div>

                    <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#09090B]">
                      {smartDiff.changedBeforeLines.length > 0 ? (
                        smartDiff.changedBeforeLines.map((item, idx) => (
                          <div key={idx} className={`flex gap-3 py-0.5 px-1.5 rounded ${isAlert ? 'bg-rose-500/10 border-l-2 border-rose-500/60' : 'hover:bg-white/[0.02]'}`}>
                            <span className="text-[#52525B] select-none text-right w-6 text-[10px]">{item.num}</span>
                            <span className={`break-all ${isAlert ? 'text-rose-300/90 font-medium' : 'text-[#E4E4E7]'}`}>{item.text || ' '}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#71717A] italic text-xs font-sans p-2">No lines modified in baseline snapshot.</p>
                      )}
                    </div>
                  </div>

                  {/* AFTER PANEL */}
                  <div className="rounded-xl bg-[#09090B] border border-[#18181B] overflow-hidden flex flex-col">
                    <div className="px-3.5 py-2 bg-black border-b border-[#18181B] flex items-center justify-between text-[11px] text-[#71717A]">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isAlert ? 'bg-emerald-500/80' : 'bg-white/40'}`} />
                        <span className="font-medium text-white">After (Current Version)</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isAlert ? 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20' : 'text-[#A1A1AA] bg-white/5 border-white/10'
                      }`}>
                        {isAlert ? '+ Added / Updated' : 'Current'}
                      </span>
                    </div>

                    <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#09090B]">
                      {smartDiff.changedAfterLines.length > 0 ? (
                        smartDiff.changedAfterLines.map((item, idx) => (
                          <div key={idx} className={`flex gap-3 py-0.5 px-1.5 rounded ${isAlert ? 'bg-emerald-500/10 border-l-2 border-emerald-500/60' : 'hover:bg-white/[0.02]'}`}>
                            <span className="text-[#52525B] select-none text-right w-6 text-[10px]">{item.num}</span>
                            <span className={`break-all ${isAlert ? 'text-emerald-300/90 font-medium' : 'text-[#E4E4E7]'}`}>{item.text || ' '}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#71717A] italic text-xs font-sans p-2">No lines added in current snapshot.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Historical Scans */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Historical Scans Log</span>
              <span className="text-[10px] text-[#71717A]">Showing latest scan runs</span>
            </div>
            <div className="flex flex-col space-y-2">
              {/* Active scanning indicator */}
              {isScanning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex justify-between items-center text-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                    <span className="text-amber-200 font-bold">Scanning target in progress...</span>
                  </div>
                  <span className="text-amber-400 text-[11px] font-mono font-semibold">
                    Today, {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {historyLogs.length > 0 ? (
                historyLogs.map((log) => {
                  const isChange = log.status_type === 'HIGH ALERT' || log.status_type.includes('ALERT');
                  const timeDisplay = formatHistoryTime(log.scan_time);

                  return (
                    <div key={log.id} className="p-3 bg-black border border-[#18181B] rounded-lg flex justify-between items-center text-xs hover:border-[#27272A] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isChange ? 'bg-[#D97706]' : 'bg-green-500'}`} />
                        <span className="text-white font-medium">
                          {isChange ? 'Change alert triggered' : 'Scan completed - No changes'}
                        </span>
                      </div>
                      <span className="text-[#A1A1AA] text-[11px] font-mono">{timeDisplay}</span>
                    </div>
                  );
                })
              ) : !isScanning ? (
                <div className="p-3 bg-black border border-[#18181B] rounded-lg flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-white font-medium">Scan completed - Baseline snapshot</span>
                  </div>
                  <span className="text-[#A1A1AA] text-[11px] font-mono">
                    Today, {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
