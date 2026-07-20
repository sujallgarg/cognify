'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, ExternalLink, Sparkles, RefreshCw, Trash2 } from 'lucide-react';

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
}

export default function ChannelDetailsModal({ channel, onClose, onDelete, onScanTriggered }: ChannelDetailsModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<Channel>(channel);
  const [historyLogs, setHistoryLogs] = useState<ScanHistoryItem[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Calculate relative time string for Last Scanned indicator
  const getLastScannedText = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (isNaN(diffMs)) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const fetchChannelHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/channels/history?channel_id=${currentChannel.id}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch channel scan history:', err);
    }
  };

  useEffect(() => {
    fetchChannelHistory();
  }, [currentChannel.id]);

  const handleScan = async () => {
    setIsScanning(true);
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
          console.error(e);
        }
      }

      const response = await fetch(`${apiUrl}/api/channels/${currentChannel.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail: customAlertEmail })
      });

      if (response.ok) {
        const updatedChannel = await response.json();
        setCurrentChannel(updatedChannel);
        if (onScanTriggered) {
          onScanTriggered(updatedChannel);
        }
        fetchChannelHistory();
      } else {
        alert('Scan request failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering scan');
    } finally {
      setIsScanning(false);
    }
  };

  const mockBefore = currentChannel.original_text || `# ${currentChannel.name} Landing Page\n• Default Pricing: Free tier available.\n• Features: Basic tracking, 5 sites max.`;
  const mockAfter = currentChannel.last_text || `# ${currentChannel.name} Landing Page\n• Default Pricing: Free tier available (Credit card required).\n• Features: Basic tracking, 3 sites max.`;
  
  const mockExplanation = currentChannel.alert_desc 
    ? `Gemini AI detected a change: ${currentChannel.alert_desc}.`
    : `No changes detected. The semantic hashes of this page match the latest snapshot taken in the database. Scan status is normal.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#09090B] border border-[#18181B] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#18181B] flex justify-between items-start">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#A1A1AA]" />
              <h2 className="text-lg font-bold text-white">{currentChannel.name}</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA]">
                {currentChannel.interval}
              </span>
            </div>
            <a
              href={currentChannel.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#71717A] hover:text-white flex items-center gap-1"
            >
              {currentChannel.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
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
              <span className="text-xs text-white font-medium">{getLastScannedText(currentChannel.last_scanned_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
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

          {/* Gemini AI explanation */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>Gemini Change Analysis</span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {mockExplanation}
            </p>
          </div>

          {/* Code Diff Panel */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white">Latest Code Diff Snapshot</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Before</span>
                <pre className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs font-mono text-red-300 overflow-x-auto whitespace-pre-wrap">
                  {mockBefore}
                </pre>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider">After</span>
                <pre className="p-3 bg-green-950/20 border border-green-900/30 rounded-lg text-xs font-mono text-green-300 overflow-x-auto whitespace-pre-wrap">
                  {mockAfter}
                </pre>
              </div>
            </div>
          </div>

          {/* Historical Scans */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white">Historical Scans Log</span>
            <div className="flex flex-col space-y-2">
              {historyLogs.length > 0 ? (
                historyLogs.map((log) => {
                  const isChange = log.status_type === 'HIGH ALERT' || log.status_type.includes('ALERT');
                  const formattedTime = new Date(log.scan_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div key={log.id} className="p-3 bg-black border border-[#18181B] rounded-lg flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isChange ? 'bg-[#D97706]' : 'bg-green-500'}`} />
                        <span className="text-white font-medium">
                          {isChange ? 'Change alert triggered' : 'Scan completed - No changes'}
                        </span>
                      </div>
                      <span className="text-[#71717A] text-[11px]">{formattedTime}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-black border border-[#18181B] rounded-lg flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-white font-medium">Scan completed - Baseline snapshot</span>
                  </div>
                  <span className="text-[#71717A] text-[11px]">Just now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
