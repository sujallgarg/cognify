'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Download, AlertTriangle } from 'lucide-react';

interface BillingTabProps {
  userEmail: string;
  scansCount: number;
  summariesCount: number;
  onAddNotification?: (title: string, desc: string) => void;
}

export default function BillingTab({ userEmail, scansCount, summariesCount, onAddNotification }: BillingTabProps) {
  const [plan, setPlan] = useState<'FREE' | 'PROFESSIONAL'>('FREE');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const subKey = `cognify_sub_${userEmail}`;

  useEffect(() => {
    const savedSub = localStorage.getItem(subKey);
    if (savedSub) {
      setPlan(savedSub as 'FREE' | 'PROFESSIONAL');
    } else {
      localStorage.setItem(subKey, 'FREE');
      setPlan('FREE');
    }
  }, [subKey]);

  const handleUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setPlan('PROFESSIONAL');
      localStorage.setItem(subKey, 'PROFESSIONAL');
      if (onAddNotification) {
        onAddNotification('Subscription Upgraded', 'Successfully subscribed to the Professional Plan.');
      }
      alert('Congratulations! You have upgraded to the Professional Plan.');
    }, 1500);
  };

  const handleDowngrade = () => {
    if (confirm('Are you sure you want to cancel your Professional subscription?')) {
      setPlan('FREE');
      localStorage.setItem(subKey, 'FREE');
      if (onAddNotification) {
        onAddNotification('Subscription Cancelled', 'Your account has been downgraded to the Free Starter plan.');
      }
      alert('Subscription cancelled. You have returned to the Free Starter plan.');
    }
  };

  const invoices = [
    { date: 'Jul 15, 2026', amount: '$49.00', status: 'Paid' },
    { date: 'Jun 15, 2026', amount: '$49.00', status: 'Paid' },
    { date: 'May 15, 2026', amount: '$49.00', status: 'Paid' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing & Usage</h1>
        <p className="text-xs text-[#71717A]">Manage subscription plans, check credits, and view usage metrics.</p>
      </div>

      {/* Free Plan Alert Banner */}
      {plan === 'FREE' && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-left flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white">Upgrade Required</h4>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              You are currently on the <strong className="text-white">Free Starter</strong> plan. Automated hourly scanning, Slack/Discord alerts, and custom Gemini API keys are premium features. Upgrade to unlock the full potential of Cognify!
            </p>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg transition-all cursor-pointer"
            >
              {isUpgrading ? 'Upgrading...' : 'Upgrade to Professional ($49/mo)'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active plan */}
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-[#18181B] pb-4">
              <CreditCard className="h-4.5 w-4.5 text-[#A1A1AA]" />
              <h3 className="font-semibold text-white text-sm">Active Plan Details</h3>
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-sm font-bold text-white">
                  {plan === 'PROFESSIONAL' ? 'Professional Plan' : 'Free Starter Plan'}
                </span>
                <p className="text-xs text-[#71717A]">
                  {plan === 'PROFESSIONAL' ? 'Next renewal date: August 15, 2026' : 'Free tier limitations apply'}
                </p>
              </div>
              <span className="text-2xl font-extrabold text-white">
                {plan === 'PROFESSIONAL' ? '$49' : '$0'}
                <span className="text-xs text-[#71717A] font-normal">/mo</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#18181B]">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#71717A]">
                  <span>Scans Usage</span>
                  <span>{scansCount} / {plan === 'PROFESSIONAL' ? '10,000' : '100'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scansCount / (plan === 'PROFESSIONAL' ? 10000 : 100)) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#71717A]">
                  <span>AI Summaries Generated</span>
                  <span>{summariesCount} / {plan === 'PROFESSIONAL' ? '1,000' : '15'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (summariesCount / (plan === 'PROFESSIONAL' ? 1000 : 15)) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <h3 className="font-semibold text-white text-sm">Billing History</h3>
            <div className="overflow-x-auto">
              {plan === 'PROFESSIONAL' ? (
                <table className="w-full text-left text-xs text-[#71717A]">
                  <thead>
                    <tr className="border-b border-[#18181B] pb-2">
                      <th className="py-2 font-semibold">Date</th>
                      <th className="py-2 font-semibold">Amount</th>
                      <th className="py-2 font-semibold">Status</th>
                      <th className="py-2 font-semibold text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => (
                      <tr key={idx} className="border-b border-[#18181B]/50 hover:bg-white/[0.01]">
                        <td className="py-3 text-white font-medium">{inv.date}</td>
                        <td className="py-3 text-white">{inv.amount}</td>
                        <td className="py-3">
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="p-1 rounded hover:bg-white/5 text-white inline-flex items-center gap-1 cursor-pointer">
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-[#71717A] italic py-2">No paid invoices recorded on Free plan.</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="space-y-6">
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <h3 className="font-semibold text-white text-sm border-b border-[#18181B] pb-3">Payment Method</h3>
            {plan === 'PROFESSIONAL' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-12 rounded border border-[#18181B] bg-black flex items-center justify-center font-bold text-xs text-white">
                    VISA
                  </div>
                  <div>
                    <p className="text-xs text-white font-medium">Visa ending in 4242</p>
                    <p className="text-[10px] text-[#71717A]">Expiry: 12/2028</p>
                  </div>
                </div>
                <button
                  onClick={handleDowngrade}
                  className="w-full bg-[#18181B] hover:bg-red-500/10 hover:text-red-400 border border-[#27272A] text-white text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer"
                >
                  Cancel Subscription
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#71717A]">No payment details configured.</p>
                <button 
                  onClick={handleUpgrade}
                  className="w-full bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer"
                >
                  Add Billing Card
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
