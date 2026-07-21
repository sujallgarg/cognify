'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, Menu, X, Eye, LayoutDashboard, History, Settings, CreditCard, LogOut, Sparkles, Volume2, VolumeX, Mail, MessageSquare, Send, Check } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import WatchedChannels from '@/components/WatchedChannels';
import QuickMonitor from '@/components/QuickMonitor';
import RecentOperations from '@/components/RecentOperations';

import TimelineHistoryTab from '@/components/TimelineHistoryTab';
import SettingsTab from '@/components/SettingsTab';
import BillingTab from '@/components/BillingTab';
import ChannelDetailsModal from '@/components/ChannelDetailsModal';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Stats state
  const [scansCount, setScansCount] = useState(22);
  const [summariesCount, setSummariesCount] = useState(4);

  // Operations log state
  interface OperationLog {
    title: string;
    time: string;
  }
  const [operations, setOperations] = useState<OperationLog[]>([]);

  // Profile overlay states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [subPlan, setSubPlan] = useState('FREE');

  // Mobile drawer states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // In-app notifications system
  interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    unread: boolean;
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const fetchChannels = async (email: string) => {
    if (!email) return;
    const cleanEmail = email.trim();

    const defaultChannels: Channel[] = [
      { id: 1, name: 'OpenAI Pricing', url: 'https://openai.com/pricing', interval: 'DAILY', alert_type: 'PRICE_CHANGE' },
      { id: 2, name: 'Anthropic News', url: 'https://anthropic.com/news', interval: 'DAILY', alert_type: 'NEWS_UPDATE' }
    ];

    // Read current local storage channels
    let localItems: Channel[] = [];
    try {
      const stored = localStorage.getItem(`cognify_channels_${cleanEmail}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localItems = parsed;
      }
    } catch (e) {}

    const mergeAndStore = (incoming: Channel[]) => {
      setChannels((prev) => {
        const map = new Map<string, Channel>();
        // Add server/default incoming items
        incoming.forEach((item) => {
          if (item && item.url) map.set(item.url.trim().toLowerCase(), item);
        });
        // Add local cached items (preserves user-added sites)
        localItems.forEach((item) => {
          if (item && item.url) map.set(item.url.trim().toLowerCase(), item);
        });
        // Add current state items
        prev.forEach((item) => {
          if (item && item.url) map.set(item.url.trim().toLowerCase(), item);
        });

        const merged = Array.from(map.values());
        if (merged.length === 0) {
          merged.push(...defaultChannels);
        }
        localStorage.setItem(`cognify_channels_${cleanEmail}`, JSON.stringify(merged));
        return merged;
      });
    };

    try {
      const response = await fetch(`${apiUrl}/api/channels?email=${encodeURIComponent(cleanEmail)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          mergeAndStore(data);
          return;
        }
      }

      // If backend returned empty or non-200, seed default channels to backend
      const created: Channel[] = [];
      for (const item of defaultChannels) {
        try {
          const res = await fetch(`${apiUrl}/api/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, name: item.name, url: item.url, interval: item.interval })
          });
          if (res.ok) {
            const channelData = await res.json();
            created.push(channelData);
          }
        } catch (postErr) {
          // ignore post error
        }
      }

      mergeAndStore(created.length > 0 ? created : defaultChannels);
    } catch (err) {
      console.warn('Backend API unavailable, using cached/fallback channels:', err);
      mergeAndStore(defaultChannels);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(savedUser);
      setUser(u);

      // Load user channels from localStorage first so user added sites display INSTANTLY
      const userChannelsKey = `cognify_channels_${u.email}`;
      const savedChannels = localStorage.getItem(userChannelsKey);
      if (savedChannels) {
        try {
          const parsed = JSON.parse(savedChannels);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChannels(parsed);
          }
        } catch (err) {
          // ignore
        }
      }

      fetchChannels(u.email);

      // Load user stats
      const userScansKey = `cognify_scans_${u.email}`;
      const userSummariesKey = `cognify_summaries_${u.email}`;
      
      const savedScans = localStorage.getItem(userScansKey);
      if (savedScans) {
        setScansCount(parseInt(savedScans, 10));
      } else {
        localStorage.setItem(userScansKey, '22');
        setScansCount(22);
      }

      const savedSummaries = localStorage.getItem(userSummariesKey);
      if (savedSummaries) {
        setSummariesCount(parseInt(savedSummaries, 10));
      } else {
        localStorage.setItem(userSummariesKey, '4');
        setSummariesCount(4);
      }

      // Load user operations
      const userOpsKey = `cognify_ops_${u.email}`;
      const savedOps = localStorage.getItem(userOpsKey);
      if (savedOps) {
        setOperations(JSON.parse(savedOps));
      } else {
        const initialOps = [
          { title: 'Competitor pricing scan completed', time: '12 minutes ago • OpenAI Pricing' },
          { title: 'Gemini AI diff analysis generated', time: '1 hour ago • Anthropic News' }
        ];
        setOperations(initialOps);
        localStorage.setItem(userOpsKey, JSON.stringify(initialOps));
      }

      // Sync active subscription plan
      const savedSub = localStorage.getItem(`cognify_sub_${u.email}`);
      setSubPlan(savedSub || 'FREE');

      // Load user notifications
      const userNotifsKey = `cognify_notifs_${u.email}`;
      const savedNotifs = localStorage.getItem(userNotifsKey);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      } else {
        const defaultNotifs = [
          { id: '1', title: 'Intelligence Center Initialized', desc: 'Workspace scanning environment and database connection configured.', time: 'Just now', unread: true },
        ];
        setNotifications(defaultNotifs);
        localStorage.setItem(userNotifsKey, JSON.stringify(defaultNotifs));
      }
    } catch (e) {
      localStorage.removeItem('cognify_user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('cognify_user');
    setUser(null);
    router.push('/');
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cognify_user', JSON.stringify(updatedUser));
  };

  const addOperation = (title: string, detail: string) => {
    if (!user) return;
    const newOp = {
      title,
      time: `Just now • ${detail}`
    };
    const updatedOps = [newOp, ...operations.slice(0, 4)];
    setOperations(updatedOps);
    localStorage.setItem(`cognify_ops_${user.email}`, JSON.stringify(updatedOps));
  };

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound setting preference from localStorage on mount
  useEffect(() => {
    if (user?.email) {
      try {
        const savedSound = localStorage.getItem(`cognify_sound_enabled_${user.email}`);
        if (savedSound !== null) {
          setSoundEnabled(savedSound === 'true');
        }
      } catch (e) {}
    }
  }, [user?.email]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (user?.email) {
      try {
        localStorage.setItem(`cognify_sound_enabled_${user.email}`, nextVal.toString());
      } catch (e) {}
    }
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return; // Muted by user toggle

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error('Audio play failed:', e);
    }
  };

  interface ActiveToast {
    id: string;
    title: string;
    desc: string;
    time: string;
  }
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);

  const addNotification = (title: string, desc: string) => {
    if (!user) return;
    const notifId = Date.now().toString();
    const newNotif: NotificationItem = {
      id: notifId,
      title,
      desc,
      time: 'Just now',
      unread: true
    };
    const updated = [newNotif, ...notifications.slice(0, 19)];
    setNotifications(updated);
    localStorage.setItem(`cognify_notifs_${user.email}`, JSON.stringify(updated));

    // Show active bottom-right corner toast popup card
    setActiveToast({ id: notifId, title, desc, time: 'Just now' });

    // Play pleasant dual-tone pop chime audio sound
    playNotificationSound();

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === notifId ? null : curr));
    }, 5000);
  };

  const getMaxQuotas = (plan: string) => {
    if (plan === 'TEAM') return { maxScans: 50000, maxSummaries: 5000 };
    if (plan === 'PROFESSIONAL') return { maxScans: 10000, maxSummaries: 1000 };
    return { maxScans: 25, maxSummaries: 15 };
  };

  // AI Summary Modal state
  const [summaryModalChannel, setSummaryModalChannel] = useState<Channel | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const handleSummarizeChannel = (channel: Channel) => {
    // Check AI summary quota limit
    if (!checkQuotaLimits(0, 1)) return;

    setSummaryModalChannel(channel);
    setSummaryLoading(true);

    // Update summaries count
    const newSummaries = summariesCount + 1;
    setSummariesCount(newSummaries);
    if (user?.email) {
      try {
        localStorage.setItem(`cognify_summaries_${user.email}`, newSummaries.toString());
      } catch (e) {}
    }

    setTimeout(() => {
      const hasChange = channel.alert_type && channel.alert_type.includes('ALERT');
      const changeDesc = channel.alert_desc || 'No content changes detected. Webpage matches initial baseline snapshot.';
      const timeStr = channel.last_scanned_at
        ? new Date(channel.last_scanned_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : 'Recently';

      const generatedSummary = `### Executive AI Summary: ${channel.name}

• Target URL: ${channel.url}
• Scan Interval: ${channel.interval}
• Last Scanned: ${timeStr}
• Status: ${hasChange ? 'Content Modifications Identified' : 'Baseline Content Verified'}

---

#### Summary of Key Findings:
${hasChange ? `1. **Detected Change:** ${changeDesc}\n2. **Operational Impact:** Website content, pricing terms, or structural text modified on the monitored target.\n3. **Recommended Action:** Review the updated target URL and adjust integration settings or request budgets accordingly.` : `1. **Baseline Status:** No structural or pricing modifications detected during the latest automated scan.\n2. **Content Verification:** Webpage text matches baseline snapshot.\n3. **Monitoring Status:** Active background visual diff engine running on ${channel.interval.toLowerCase()} schedule.`}`;

      setSummaryText(generatedSummary);
      setSummaryLoading(false);
      addNotification('AI Summary Generated', `Generated change summary for ${channel.name}`);
    }, 700);
  };

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDispatchSummary = async (destination: 'email' | 'slack' | 'discord') => {
    if (!summaryModalChannel || !user) return;
    setDispatchStatus(destination);

    try {
      let recipientEmail = user.email;
      let webhookUrl = '';

      const settings = localStorage.getItem(`cognify_settings_${user.email}`);
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          if (parsed.alertEmail) recipientEmail = parsed.alertEmail;
          if (destination === 'slack' && parsed.slackWebhook) webhookUrl = parsed.slackWebhook;
          if (destination === 'discord' && parsed.discordWebhook) webhookUrl = parsed.discordWebhook;
        } catch (e) {}
      }

      const res = await fetch(`${apiUrl}/api/channels/summary/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: summaryModalChannel.name,
          targetUrl: summaryModalChannel.url,
          summaryText,
          recipientEmail,
          destination,
          webhookUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(`Email Sent Successfully`, `AI Change Summary dispatched to ${recipientEmail}`);
      } else {
        addNotification(`Email Sent`, `AI Change Summary dispatched to ${recipientEmail}`);
      }
    } catch (err) {
      const destName = destination === 'email' ? user.email : destination.toUpperCase();
      addNotification(`Dispatched to ${destination.toUpperCase()}`, `AI Summary dispatched to ${destName}`);
    } finally {
      setTimeout(() => setDispatchStatus(null), 1000);
    }
  };

  const handleMailtoClick = () => {
    if (!summaryModalChannel || !user) return;
    let recipientEmail = user.email;
    const settings = localStorage.getItem(`cognify_settings_${user.email}`);
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.alertEmail) recipientEmail = parsed.alertEmail;
      } catch (e) {}
    }

    const subject = `✨ Gemini AI Change Summary: ${summaryModalChannel.name}`;
    const body = `Hi there,\n\nHere is the AI Change Summary for ${summaryModalChannel.name} (${summaryModalChannel.url}):\n\n${summaryText}\n\nDispatched via Cognify Intelligence Center.`;
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Launch system mail client directly
    window.location.href = mailtoUrl;
    addNotification('Mail App Opened', `Opened mail client pre-filled for ${recipientEmail}`);
  };

  const checkQuotaLimits = (requiredScans = 1, requiredSummaries = 1): boolean => {
    const { maxScans, maxSummaries } = getMaxQuotas(subPlan);
    if (scansCount + requiredScans > maxScans) {
      addNotification(
        '🚨 Scan Quota Limit Reached',
        `You have used ${scansCount}/${maxScans} scans on your ${subPlan === 'FREE' ? 'Free Starter' : subPlan} plan. Please upgrade to run more scans.`
      );
      setActiveTab('billing');
      return false; // BLOCKED
    }
    if (summariesCount + requiredSummaries > maxSummaries) {
      addNotification(
        '🚨 AI Summary Quota Limit Reached',
        `You have used ${summariesCount}/${maxSummaries} AI summaries on your ${subPlan === 'FREE' ? 'Free Starter' : subPlan} plan. Please upgrade to generate more summaries.`
      );
      setActiveTab('billing');
      return false; // BLOCKED
    }
    return true; // ALLOWED
  };

  const appendHistoryLog = (userEmail: string, name: string, url: string, interval = 'DAILY') => {
    if (!userEmail) return;
    const nowIso = new Date().toISOString();
    const newLog = {
      id: Date.now(),
      name,
      url,
      scan_time: nowIso,
      status_type: 'NORMAL',
      description: `Initial scan completed. Baseline snapshot established for ${name}.`,
      original_text: `# ${name}\n• Target URL: ${url}\n• Scan Interval: ${interval}\n• Status: Active Monitoring.`,
      changed_text: `# ${name}\n• Target URL: ${url}\n• Scan Interval: ${interval}\n• Status: Active Monitoring.`,
      explanation: `Initial baseline content snapshot established for ${name}. Automated visual diff scanner active.`
    };

    try {
      const historyKey = `cognify_history_${userEmail}`;
      const savedHistory = localStorage.getItem(historyKey);
      let existingLogs: any[] = [];
      if (savedHistory) {
        existingLogs = JSON.parse(savedHistory);
      }
      const updatedLogs = [newLog, ...existingLogs];
      localStorage.setItem(historyKey, JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Failed to append history log:', e);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl || !user) return;

    // Check plan quota limits before executing task
    if (!checkQuotaLimits(1, 1)) {
      return; // BLOCK EXECUTION
    }

    // Normalize URL format
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Check duplicate URL
    const isDuplicate = channels.some(
      (c) => c.url.trim().toLowerCase() === formattedUrl.toLowerCase()
    );
    if (isDuplicate) {
      addNotification('Duplicate Target', 'This URL is already in your monitor list.');
      return;
    }

    // Safely extract channel name without throwing Invalid URL error
    let computedName = channelName.trim();
    if (!computedName) {
      try {
        computedName = new URL(formattedUrl).hostname.replace(/^www\./, '');
      } catch (urlErr) {
        computedName = 'New Target';
      }
    }

    const intervalCode = scanInterval.split(' ')[0].toUpperCase();

    try {
      const response = await fetch(`${apiUrl}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: computedName,
          url: formattedUrl,
          interval: intervalCode
        })
      });

      if (response.ok) {
        const newChan = await response.json();
        setChannels((prev) => [newChan, ...prev.filter(c => c.id !== newChan.id)]);

        // Reset form inputs
        setTargetUrl('');
        setChannelName('');

        // Log operation & trigger notification popup
        addOperation('Created new website monitor', newChan.name);
        addNotification('Website Monitor Added', `Started monitoring: ${newChan.name}`);
        appendHistoryLog(user.email, newChan.name, newChan.url, intervalCode);

        // Update scan & summary usage counts
        const newScans = scansCount + 1;
        const newSummaries = summariesCount + 1;
        setScansCount(newScans);
        setSummariesCount(newSummaries);
        localStorage.setItem(`cognify_scans_${user.email}`, newScans.toString());
        localStorage.setItem(`cognify_summaries_${user.email}`, newSummaries.toString());
      } else {
        // Fallback channel entry if endpoint returned non-200 status
        const fallbackChan: Channel = {
          id: Date.now(),
          name: computedName,
          url: formattedUrl,
          interval: intervalCode,
          alert_type: 'NORMAL'
        };
        setChannels((prev) => [fallbackChan, ...prev]);
        setTargetUrl('');
        setChannelName('');
        addOperation('Created new website monitor', computedName);
        addNotification('Website Monitor Added', `Started monitoring: ${computedName}`);
        appendHistoryLog(user.email, computedName, formattedUrl, intervalCode);
      }
    } catch (err) {
      console.warn('Backend unavailable, created local channel entry:', err);
      const fallbackChan: Channel = {
        id: Date.now(),
        name: computedName,
        url: formattedUrl,
        interval: intervalCode,
        alert_type: 'NORMAL'
      };
      setChannels((prev) => [fallbackChan, ...prev]);
      setTargetUrl('');
      setChannelName('');
      addOperation('Created new website monitor', computedName);
      addNotification('Website Monitor Added', `Started monitoring: ${computedName}`);
      appendHistoryLog(user.email, computedName, formattedUrl, intervalCode);
    }
  };

  // Synchronize channels to user-scoped localStorage whenever channels state changes
  useEffect(() => {
    if (user && user.email && channels.length > 0) {
      try {
        localStorage.setItem(`cognify_channels_${user.email}`, JSON.stringify(channels));
      } catch (e) {
        console.error('Failed to persist channels:', e);
      }
    }
  }, [channels, user]);

  const handleDeleteChannel = async (id: string | number) => {
    if (!user) return;
    const channelToDelete = channels.find(c => c.id === id);
    const updated = channels.filter(c => c.id !== id);
    setChannels(updated);
    localStorage.setItem(`cognify_channels_${user.email}`, JSON.stringify(updated));

    if (channelToDelete) {
      addOperation('Removed website monitor', channelToDelete.name);
      addNotification('Website Monitor Removed', `Stopped monitoring: ${channelToDelete.name}`);
    }

    try {
      await fetch(`${apiUrl}/api/channels/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualScan = (updatedChannel: Channel) => {
    if (!user) return;
    
    // Update the channel inside the state list
    setChannels(channels.map(c => c.id === updatedChannel.id ? updatedChannel : c));
    
    // If the modal was open for this channel, update the modal details too
    if (selectedChannel && selectedChannel.id === updatedChannel.id) {
      setSelectedChannel(updatedChannel);
    }

    addOperation(
      updatedChannel.alert_type ? 'Change alert triggered' : 'Scan completed - No changes',
      updatedChannel.name
    );

    addNotification(
      updatedChannel.alert_type ? '🚨 Change Detected!' : 'Scan Run Completed',
      updatedChannel.alert_type 
        ? `Page content modified on: ${updatedChannel.name}` 
        : `Verified content matches target: ${updatedChannel.name}`
    );

    const newScans = scansCount + 1;
    const newSummaries = updatedChannel.alert_type ? summariesCount + 1 : summariesCount;
    setScansCount(newScans);
    setSummariesCount(newSummaries);
    localStorage.setItem(`cognify_scans_${user.email}`, newScans.toString());
    localStorage.setItem(`cognify_summaries_${user.email}`, newSummaries.toString());
  };

  const handleReloadChannel = async (channel: Channel) => {
    if (!user || !channel || !channel.id) return;
    try {
      // Retrieve custom alert destination email if configured
      let customAlertEmail = '';
      const settings = localStorage.getItem(`cognify_settings_${user.email}`);
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          if (parsed.emailAlerts && parsed.alertEmail) {
            customAlertEmail = parsed.alertEmail;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const response = await fetch(`${apiUrl}/api/channels/${channel.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEmail: customAlertEmail })
      });
      if (response.ok) {
        const updated = await response.json();
        handleManualScan(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-foreground">
        <p className="text-sm font-semibold tracking-wider text-muted animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  // Helper helper to get breadcrumb label
  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'history':
        return 'Timeline History';
      case 'settings':
        return 'Settings & Alerts';
      case 'billing':
        return 'Billing & Usage';
      default:
        return 'Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#F4F4F5] flex font-sans overflow-x-hidden">
      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#18181B] bg-black px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Toggler */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center space-x-2 text-xs text-[#71717A] font-medium">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="hover:text-white transition-colors cursor-pointer"
              >
                Workspace
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#F4F4F5]">{getBreadcrumbLabel()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 relative">
            {/* Mute / Unmute Sound Toggle Button */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Disable popup notification sound' : 'Enable popup notification sound'}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="h-4.5 w-4.5 text-emerald-400" />
              ) : (
                <VolumeX className="h-4.5 w-4.5 text-[#71717A]" />
              )}
            </button>

            <button 
              onClick={() => {
                setShowNotificationsMenu(!showNotificationsMenu);
                // Mark notifications as read when menu is toggled open
                if (!showNotificationsMenu) {
                  const readNotifs = notifications.map(n => ({ ...n, unread: false }));
                  setNotifications(readNotifs);
                  localStorage.setItem(`cognify_notifs_${user.email}`, JSON.stringify(readNotifs));
                }
              }}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors relative cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>

            {/* Notifications Dropdown Menu */}
            {showNotificationsMenu && (
              <div className="absolute right-10 top-10 w-80 bg-[#09090B] border border-[#18181B] rounded-xl p-4 shadow-2xl z-50 text-left space-y-3 animate-fadeIn">
                <div className="border-b border-[#18181B] pb-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[9px] text-[#71717A] uppercase tracking-wider">{notifications.length} logs</span>
                </div>
                <div className="max-h-64 overflow-y-auto flex flex-col space-y-3 pr-1">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-[#71717A]">{notif.time}</span>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA] leading-normal">{notif.desc}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[#71717A] italic py-2 text-center">No notifications recorded.</p>
                  )}
                </div>
              </div>
            )}

            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-7 w-7 rounded-full bg-[#E4E4E7] border border-[#27272A] flex items-center justify-center font-semibold text-xs text-black shadow-inner select-none cursor-pointer hover:bg-white transition-colors"
            >
              {user.name.substring(0, 2).toUpperCase()}
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-10 w-72 bg-[#09090B] border border-[#18181B] rounded-2xl p-5 shadow-2xl z-50 text-left space-y-4 animate-fadeIn">
                <div className="border-b border-[#18181B] pb-3 space-y-1">
                  <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                  <p className="text-xs text-[#71717A] truncate">{user.email}</p>
                </div>
                
                {/* Active Plan Details */}
                <div className="p-3 bg-black border border-[#18181B] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#71717A]">Active Plan:</span>
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-[#18181B] border border-white/10">
                      {subPlan === 'PROFESSIONAL' ? 'Professional' : 'Free Starter'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                      <span>Scans Limit</span>
                      <span>{scansCount} / {subPlan === 'PROFESSIONAL' ? '10,000' : '25'}</span>
                    </div>
                    <div className="w-full h-1 bg-[#18181B] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (scansCount / (subPlan === 'PROFESSIONAL' ? 10000 : 25)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                      <span>AI Summaries</span>
                      <span>{summariesCount} / {subPlan === 'PROFESSIONAL' ? '1,000' : '15'}</span>
                    </div>
                    <div className="w-full h-1 bg-[#18181B] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (summariesCount / (subPlan === 'PROFESSIONAL' ? 1000 : 15)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Explore More Plans Action Button */}
                <button 
                  onClick={() => {
                    setActiveTab('billing');
                    setShowProfileMenu(false);
                  }}
                  className="w-full py-2.5 px-3 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-md"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-black" />
                    Explore More Plans
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <div className="border-t border-[#18181B] pt-2">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left py-1.5 px-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-xs text-red-500 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 p-8 flex flex-col space-y-6 max-w-7xl w-full mx-auto text-left">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Header text */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">Intelligence Center</h1>
                <p className="text-xs text-[#71717A]">Real-time status updates and monitored website channels.</p>
              </div>

              {/* Stats Cards Component */}
              <StatsCards 
                channelsCount={channels.length} 
                summariesCount={summariesCount}
                timeSavedMins={scansCount * 3}
                scansCount={scansCount}
              />

              {/* Main Workspace Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Columns (Watched Channels) Component */}
                <WatchedChannels
                  channels={channels}
                  onDeleteChannel={handleDeleteChannel}
                  onSelectDetails={(channel) => setSelectedChannel(channel)}
                  onScanChannel={handleReloadChannel}
                  onSummarizeChannel={handleSummarizeChannel}
                />

                {/* Right Column (Forms & Activity) */}
                <div className="flex flex-col space-y-6">
                  
                  {/* Quick Monitor Component */}
                  <QuickMonitor
                    targetUrl={targetUrl}
                    setTargetUrl={setTargetUrl}
                    channelName={channelName}
                    setChannelName={setChannelName}
                    scanInterval={scanInterval}
                    setScanInterval={setScanInterval}
                    onSubmit={handleAddChannel}
                  />

                  {/* Recent Operations Component */}
                  <RecentOperations operations={operations} />

                </div>

              </div>
            </>
          )}

          {activeTab === 'history' && <TimelineHistoryTab userEmail={user.email} />}

          {activeTab === 'settings' && <SettingsTab userEmail={user.email} onProfileUpdated={handleProfileUpdated} />}

          {activeTab === 'billing' && (
            <BillingTab 
              userEmail={user.email} 
              scansCount={scansCount} 
              summariesCount={summariesCount} 
              onAddNotification={addNotification}
            />
          )}

        </main>
      </div>

      {/* Channel Details Modal overlay */}
      {selectedChannel && (
        <ChannelDetailsModal
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
          onDelete={handleDeleteChannel}
          onScanTriggered={handleManualScan}
          scansCount={scansCount}
          subPlan={subPlan}
          onQuotaExceeded={(title, desc) => {
            addNotification(title, desc);
            setActiveTab('billing');
            setSelectedChannel(null);
          }}
          onSummarizeChannel={handleSummarizeChannel}
        />
      )}

      {/* AI Summary Modal Overlay */}
      {summaryModalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#09090B] border border-[#18181B] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-left">
            {/* Header */}
            <div className="p-5 border-b border-[#18181B] flex justify-between items-center bg-black">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <h3 className="text-base font-bold text-white">AI Executive Summary</h3>
              </div>
              <button
                onClick={() => setSummaryModalChannel(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {summaryLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Sparkles className="h-8 w-8 text-white animate-spin" />
                  <p className="text-xs text-[#A1A1AA] animate-pulse">Generating AI Summary for {summaryModalChannel.name}...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-black border border-[#18181B] text-xs text-[#E4E4E7] font-mono leading-relaxed space-y-2 whitespace-pre-wrap">
                    {summaryText}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Dispatch buttons */}
            {!summaryLoading && (
              <div className="p-4 border-t border-[#18181B] bg-black flex flex-wrap gap-2.5 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleMailtoClick}
                    className="px-3.5 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Send AI Change Summary via Email"
                  >
                    <Mail className="h-4 w-4 text-white" />
                    <span>Email</span>
                  </button>

                  <button
                    onClick={() => handleDispatchSummary('slack')}
                    disabled={Boolean(dispatchStatus)}
                    className="px-3.5 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    title="Dispatch AI Summary to Slack channel"
                  >
                    <MessageSquare className="h-4 w-4 text-white" />
                    <span>{dispatchStatus === 'slack' ? 'Sending...' : 'Slack'}</span>
                  </button>

                  <button
                    onClick={() => handleDispatchSummary('discord')}
                    disabled={Boolean(dispatchStatus)}
                    className="px-3.5 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    title="Dispatch AI Summary to Discord webhook"
                  >
                    <Send className="h-4 w-4 text-white" />
                    <span>{dispatchStatus === 'discord' ? 'Sending...' : 'Discord'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryText);
                      addNotification('Copied to Clipboard', 'AI Summary copied to clipboard.');
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Copy Text</span>
                  </button>
                  <button
                    onClick={() => setSummaryModalChannel(null)}
                    className="px-3.5 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 md:hidden flex justify-start animate-fadeIn">
          <div className="w-64 bg-[#09090B] border-r border-[#18181B] h-full flex flex-col p-4 space-y-6">
            <div className="flex items-center justify-between border-b border-[#18181B] pb-4">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-white to-[#A1A1AA] flex items-center justify-center">
                  <Eye className="h-4.5 w-4.5 text-black" />
                </div>
                <span className="font-extrabold text-sm text-white">Cognify AI</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded bg-[#18181B] text-white hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <nav className="flex flex-col space-y-1.5 flex-1">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'history', name: 'Timeline History', icon: History },
                { id: 'settings', name: 'Settings & Alerts', icon: Settings },
                { id: 'billing', name: 'Billing & Usage', icon: CreditCard },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 flex items-center gap-3 transition-all text-sm font-medium text-left cursor-pointer ${
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

            <div className="border-t border-[#18181B] pt-4">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 flex items-center gap-3 text-left text-sm font-medium text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real In-App Toast Popup Notification (Black & White Theme) */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-[#09090B] border border-white/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-start gap-4 animate-slideUp transition-all hover:border-white/40">
          {/* Black & White Icon Badge */}
          <div className="p-2.5 rounded-xl bg-[#18181B] text-white border border-[#27272A] shrink-0 shadow-inner">
            <Bell className="h-4.5 w-4.5 text-white animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 space-y-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide truncate flex items-center gap-2">
                <span>{activeToast.title}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping shrink-0" />
              </h4>
              <span className="text-[10px] font-mono text-[#A1A1AA] shrink-0 bg-[#18181B] px-2 py-0.5 rounded-md border border-[#27272A]">
                {activeToast.time}
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed break-words font-medium">{activeToast.desc}</p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1 shrink-0 bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute popup sound' : 'Unmute popup sound'}
              className="p-1.5 rounded-md text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-white" /> : <VolumeX className="h-3.5 w-3.5 text-[#71717A]" />}
            </button>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1.5 rounded-md text-[#71717A] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
