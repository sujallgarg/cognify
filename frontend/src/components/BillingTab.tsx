'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Download, AlertTriangle, Sparkles, Check, ArrowRight } from 'lucide-react';

interface BillingTabProps {
  userEmail: string;
  scansCount: number;
  summariesCount: number;
  onAddNotification?: (title: string, desc: string) => void;
}

export default function BillingTab({ userEmail, scansCount, summariesCount, onAddNotification }: BillingTabProps) {
  const [plan, setPlan] = useState<'FREE' | 'PROFESSIONAL' | 'TEAM'>('FREE');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const subKey = `cognify_sub_${userEmail}`;

  useEffect(() => {
    const savedSub = localStorage.getItem(subKey);
    if (savedSub) {
      setPlan(savedSub as 'FREE' | 'PROFESSIONAL' | 'TEAM');
    } else {
      localStorage.setItem(subKey, 'FREE');
      setPlan('FREE');
    }
  }, [subKey]);

  const handleSelectPlan = (selectedPlan: 'FREE' | 'PROFESSIONAL' | 'TEAM') => {
    if (selectedPlan === plan) return;
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setPlan(selectedPlan);
      localStorage.setItem(subKey, selectedPlan);
      if (onAddNotification) {
        onAddNotification(
          'Subscription Updated',
          `Successfully updated your active plan to ${selectedPlan === 'PROFESSIONAL' ? 'Professional' : selectedPlan === 'TEAM' ? 'Team Workspace' : 'Free Starter'}.`
        );
      }
      alert(`Plan updated successfully! You are now on the ${selectedPlan === 'PROFESSIONAL' ? 'Professional ($49/mo)' : selectedPlan === 'TEAM' ? 'Team Workspace ($149/mo)' : 'Free Starter'} plan.`);
    }, 800);
  };

  const scrollToPlans = () => {
    const el = document.getElementById('plans-selection-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const invoices = [
    { date: 'Jul 15, 2026', amount: plan === 'TEAM' ? '$149.00' : '$49.00', status: 'Paid' },
    { date: 'Jun 15, 2026', amount: plan === 'TEAM' ? '$149.00' : '$49.00', status: 'Paid' },
    { date: 'May 15, 2026', amount: plan === 'TEAM' ? '$149.00' : '$49.00', status: 'Paid' },
  ];

  const availablePlans = [
    {
      id: 'FREE',
      name: 'Free Starter',
      price: '$0',
      period: '/mo',
      description: 'Basic change monitoring for individual sites.',
      features: [
        '100 Scans per month',
        '15 AI Summaries',
        'Daily scan intervals',
        '7-day audit history',
        'Basic email alerts'
      ]
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: '$49',
      period: '/mo',
      description: 'Production-grade change intelligence for scaling businesses.',
      popular: true,
      features: [
        '10,000 Scans per month',
        '1,000 AI Summaries',
        'Hourly automated background scans',
        'Slack & Discord webhook integration',
        'Gemini AI Diff Explanations',
        'Unlimited audit history'
      ]
    },
    {
      id: 'TEAM',
      name: 'Team Workspace',
      price: '$149',
      period: '/mo',
      description: 'Advanced intelligence sharing for product and dev teams.',
      comingSoon: true,
      features: [
        '50,000 Scans per month',
        '5,000 AI Summaries',
        'Real-time automated scanning',
        'Shared workspace team access',
        'Custom Webhook & API endpoints',
        'Priority 24/7 dedicated support'
      ]
    }
  ];

  return (
    <div className="space-y-8">
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
              You are currently on the <strong className="text-white">Free Starter</strong> plan. Automated hourly background scanning, Slack/Discord alerts, and custom Gemini API keys are premium features. Upgrade to unlock the full potential of Cognify!
            </p>
            <button
              onClick={() => handleSelectPlan('PROFESSIONAL')}
              disabled={isUpgrading}
              className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg transition-all cursor-pointer"
            >
              {isUpgrading ? 'Updating Plan...' : 'Upgrade to Professional ($49/mo)'}
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
                  {plan === 'TEAM' ? 'Team Workspace Plan' : plan === 'PROFESSIONAL' ? 'Professional Plan' : 'Free Starter Plan'}
                </span>
                <p className="text-xs text-[#71717A]">
                  {plan === 'FREE' ? 'Free tier limitations apply' : 'Next renewal date: August 15, 2026'}
                </p>
              </div>
              <span className="text-2xl font-extrabold text-white">
                {plan === 'TEAM' ? '$149' : plan === 'PROFESSIONAL' ? '$49' : '$0'}
                <span className="text-xs text-[#71717A] font-normal">/mo</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#18181B]">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#71717A]">
                  <span>Scans Usage</span>
                  <span>{scansCount} / {plan === 'TEAM' ? '50,000' : plan === 'PROFESSIONAL' ? '10,000' : '100'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scansCount / (plan === 'TEAM' ? 50000 : plan === 'PROFESSIONAL' ? 10000 : 100)) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#71717A]">
                  <span>AI Summaries Generated</span>
                  <span>{summariesCount} / {plan === 'TEAM' ? '5,000' : plan === 'PROFESSIONAL' ? '1,000' : '15'}</span>
                </div>
                <div className="w-full h-1.5 bg-[#18181B] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (summariesCount / (plan === 'TEAM' ? 5000 : plan === 'PROFESSIONAL' ? 1000 : 15)) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#18181B] flex justify-end">
              <button 
                onClick={scrollToPlans}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>Explore & Upgrade Plans</span>
              </button>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 space-y-4 text-left">
            <h3 className="font-semibold text-white text-sm">Billing History</h3>
            <div className="overflow-x-auto">
              {plan !== 'FREE' ? (
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
            {plan !== 'FREE' ? (
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
                  onClick={() => handleSelectPlan('FREE')}
                  className="w-full bg-[#18181B] hover:bg-red-500/10 hover:text-red-400 border border-[#27272A] text-white text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer"
                >
                  Switch to Free Plan
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#71717A]">No payment details configured.</p>
                <button 
                  onClick={() => handleSelectPlan('PROFESSIONAL')}
                  className="w-full bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-semibold py-2 rounded-lg transition-all cursor-pointer"
                >
                  Add Billing Card
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans Selection Section */}
      <div id="plans-selection-section" className="pt-6 border-t border-[#18181B] space-y-6 text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-white" />
            Available Subscription Plans
          </h2>
          <p className="text-xs text-[#71717A]">Choose the plan that fits your monitoring and crawling requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((p) => {
            const isCurrent = plan === p.id;

            return (
              <div 
                key={p.id}
                className={`bg-[#09090B] rounded-2xl p-6 border flex flex-col justify-between relative transition-all ${p.popular ? 'border-white shadow-xl shadow-white/5' : 'border-[#18181B]'}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 right-6 bg-white text-black text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-[#71717A] mt-1 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs text-[#71717A]">{p.period}</span>
                  </div>
                  <ul className="space-y-2 border-t border-[#18181B] pt-4 text-xs text-[#A1A1AA]">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-white shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(p.id as any)}
                  disabled={isCurrent || isUpgrading || p.comingSoon}
                  className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    p.comingSoon
                      ? 'bg-[#18181B]/60 text-[#71717A] border border-[#18181B] cursor-not-allowed opacity-60'
                      : isCurrent 
                      ? 'bg-[#18181B] text-[#71717A] border border-[#27272A] cursor-default'
                      : p.popular 
                      ? 'bg-white hover:bg-neutral-200 text-black shadow-md cursor-pointer' 
                      : 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] cursor-pointer'
                  }`}
                >
                  {p.comingSoon ? (
                    'Coming Soon'
                  ) : isCurrent ? (
                    'Current Active Plan'
                  ) : (
                    <>
                      <span>Choose {p.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
