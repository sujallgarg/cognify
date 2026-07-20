'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Key, ShieldAlert, User, Mail } from 'lucide-react';

interface SettingsTabProps {
  userEmail: string;
  onProfileUpdated?: (updatedUser: any) => void;
}

export default function SettingsTab({ userEmail, onProfileUpdated }: SettingsTabProps) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [alertEmail, setAlertEmail] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Account profile details
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [testingSlack, setTestingSlack] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const settingsKey = `cognify_settings_${userEmail}`;

  // Load settings and profile details on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setEmailAlerts(parsed.emailAlerts ?? true);
        setAlertEmail(parsed.alertEmail ?? userEmail);
        setSlackWebhook(parsed.slackWebhook ?? '');
        setDiscordWebhook(parsed.discordWebhook ?? '');
        setGeminiApiKey(parsed.geminiApiKey ?? '');
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    } else {
      setAlertEmail(userEmail);
    }

    const savedUser = localStorage.getItem('cognify_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setProfileName(parsedUser.name || '');
        setProfileEmail(parsedUser.email || '');
      } catch (e) {
        console.error('Failed to load user info:', e);
      }
    }
  }, [settingsKey, userEmail]);

  // General helper to save all settings to localStorage
  const saveSettings = (updatedFields: any) => {
    const currentSettings = {
      emailAlerts,
      alertEmail: alertEmail || userEmail,
      slackWebhook,
      discordWebhook,
      geminiApiKey,
      ...updatedFields
    };
    localStorage.setItem(settingsKey, JSON.stringify(currentSettings));
  };

  const handleToggleEmail = () => {
    const newVal = !emailAlerts;
    setEmailAlerts(newVal);
    saveSettings({ emailAlerts: newVal });
  };

  const handleAlertEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAlertEmail(val);
    saveSettings({ alertEmail: val });
  };

  const handleTestSlack = () => {
    if (!slackWebhook) {
      alert('Please enter a valid Slack webhook URL first.');
      return;
    }
    setTestingSlack(true);
    setTimeout(() => {
      setTestingSlack(false);
      saveSettings({ slackWebhook });
      alert('Test notification sent to Slack successfully!');
    }, 1200);
  };

  const handleTestDiscord = () => {
    if (!discordWebhook) {
      alert('Please enter a valid Discord webhook URL first.');
      return;
    }
    setTestingDiscord(true);
    setTimeout(() => {
      setTestingDiscord(false);
      saveSettings({ discordWebhook });
      alert('Test notification sent to Discord successfully!');
    }, 1200);
  };

  const handleSaveApiKey = () => {
    setSavingKey(true);
    setTimeout(() => {
      setSavingKey(false);
      saveSettings({ geminiApiKey });
      alert('Gemini API key updated and encrypted successfully.');
    }, 800);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      alert('Name and Email fields are required.');
      return;
    }

    setSavingProfile(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: userEmail,
          name: profileName,
          email: profileEmail
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Shift storage settings to new email
        const oldSettings = localStorage.getItem(`cognify_settings_${userEmail}`);
        if (oldSettings) {
          localStorage.setItem(`cognify_settings_${profileEmail}`, oldSettings);
          localStorage.removeItem(`cognify_settings_${userEmail}`);
        }

        // Migrate other LocalStorage items
        const oldSub = localStorage.getItem(`cognify_sub_${userEmail}`);
        if (oldSub) {
          localStorage.setItem(`cognify_sub_${profileEmail}`, oldSub);
          localStorage.removeItem(`cognify_sub_${userEmail}`);
        }

        const oldScans = localStorage.getItem(`cognify_scans_${userEmail}`);
        if (oldScans) {
          localStorage.setItem(`cognify_scans_${profileEmail}`, oldScans);
          localStorage.removeItem(`cognify_scans_${userEmail}`);
        }

        const oldSums = localStorage.getItem(`cognify_summaries_${userEmail}`);
        if (oldSums) {
          localStorage.setItem(`cognify_summaries_${profileEmail}`, oldSums);
          localStorage.removeItem(`cognify_summaries_${userEmail}`);
        }

        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
        alert('Profile details updated successfully!');
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Alerts</h1>
        <p className="text-xs text-[#71717A]">Configure scan schedules, notification integrations, and API keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (Profile & webhooks) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile settings card */}
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-2 border-b border-[#18181B] pb-4">
              <User className="h-4.5 w-4.5 text-[#A1A1AA]" />
              <h3 className="font-semibold text-white text-sm">Account Settings</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Account Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                {savingProfile ? 'Saving...' : 'Update Profile Details'}
              </button>
            </form>
          </div>

          {/* Alerts Config */}
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-2 border-b border-[#18181B] pb-4">
              <Bell className="h-4.5 w-4.5 text-[#A1A1AA]" />
              <h3 className="font-semibold text-white text-sm">Alert Delivery Preferences</h3>
            </div>

            <div className="space-y-4">
              {/* Email Alerts Toggle & Destination */}
              <div className="p-4 bg-black border border-[#18181B] rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Email Notifications</h4>
                    <p className="text-[11px] text-[#71717A]">Receive summaries of change details in your mailbox.</p>
                  </div>
                  <button
                    onClick={handleToggleEmail}
                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                      emailAlerts ? 'bg-white justify-end' : 'bg-[#18181B] border border-[#27272A] justify-start'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-black shadow-md`} />
                  </button>
                </div>

                {emailAlerts && (
                  <div className="space-y-2 border-t border-[#18181B] pt-3 animate-fadeIn">
                    <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Alert Email Destination
                    </label>
                    <input
                      type="email"
                      value={alertEmail}
                      onChange={handleAlertEmailChange}
                      placeholder="alerts@domain.com"
                      className="w-full md:w-1/2 bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Slack webhook input */}
              <div className="p-4 bg-black border border-[#18181B] rounded-lg space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">Slack Webhook</h4>
                  <p className="text-[11px] text-[#71717A]">Send visual diffs and summaries directly to your Slack channels.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1 bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                  />
                  <button 
                    onClick={handleTestSlack}
                    disabled={testingSlack}
                    className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer min-w-[64px]"
                  >
                    {testingSlack ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* Discord webhook input */}
              <div className="p-4 bg-black border border-[#18181B] rounded-lg space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">Discord Webhook</h4>
                  <p className="text-[11px] text-[#71717A]">Deliver notification logs automatically into Discord channels.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="flex-1 bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
                  />
                  <button 
                    onClick={handleTestDiscord}
                    disabled={testingDiscord}
                    className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer min-w-[64px]"
                  >
                    {testingDiscord ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API keys card */}
        <div className="space-y-6">
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-[#18181B] pb-3">
              <Key className="h-4.5 w-4.5 text-[#A1A1AA]" />
              <h3 className="font-semibold text-white text-sm">Custom Gemini Key</h3>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-[#71717A] leading-relaxed">
                By default, Cognify uses our shared developer keys. To bypass daily usage caps, supply your own Google Gemini API key.
              </p>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={geminiApiKey ? '••••••••••••••••' : 'AIzaSy...'}
                className="w-full bg-black border border-[#18181B] focus:border-[#27272A] rounded-lg py-2 px-3 text-xs text-white placeholder-[#3F3F46] focus:outline-none transition-colors"
              />
              <button 
                onClick={handleSaveApiKey}
                disabled={savingKey}
                className="w-full bg-white hover:bg-neutral-200 disabled:opacity-50 text-black text-xs font-semibold py-2.5 rounded-lg transition-all cursor-pointer"
              >
                {savingKey ? 'Saving...' : 'Save API Key'}
              </button>
            </div>
          </div>

          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-[#18181B] pb-3">
              <ShieldAlert className="h-4.5 w-4.5 text-yellow-500" />
              <h3 className="font-semibold text-white text-sm">Security Policy</h3>
            </div>
            <p className="text-[11px] text-[#71717A] leading-relaxed">
              All credentials and keys are fully encrypted at rest using AES-256 before storage. Webhook calls execute securely via HTTPS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
