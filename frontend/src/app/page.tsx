'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Activity,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import Header from '../components/Header';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoState, setDemoState] = useState<'original' | 'changed' | 'ai'>('original');

  useEffect(() => {
    const savedUser = localStorage.getItem('cognify_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('cognify_user');
      }
    }
  }, []);

  const faqs = [
    {
      q: "How is Cognify AI different from standard visual diff checkers?",
      a: "Standard tools compare simple visual grids or HTML structures, resulting in false alerts from ads, cookie notices, and layout modifications. Cognify AI extracts actual semantic content, converts it to clean markdown, hashes it to detect updates, and uses Gemini AI to describe the exact business implications."
    },
    {
      q: "Can I connect Cognify AI to my Slack or Discord workspace?",
      a: "Yes! Cognify AI supports webhooks for Slack and Discord. You can configure it to notify specific channels immediately whenever medium-to-critical importance updates are detected on monitored pages."
    },
    {
      q: "What is Competitor Mode?",
      a: "Competitor Mode automatically scans pricing pages, docs, careers portals, and blogs of your competitors, detecting additions such as pricing tiers, newly launched features, hiring trends, or announcements, consolidating them into a weekly summary report."
    },
    {
      q: "Does it support enterprise Single Sign-On (SSO)?",
      a: "Absolutely. Our Enterprise plan includes custom SAML/OIDC SSO integration, dedicated crawling nodes, custom scan rates, and role-based audit logging."
    }
  ];

  const pricingPlans = [
    {
      name: "Free Starter",
      price: "$0",
      description: "Basic change monitoring for personal projects.",
      features: [
        "Monitor up to 5 websites",
        "Daily scan intervals",
        "7-day history storage",
        "Basic email notifications"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Professional",
      price: "$49",
      description: "Production-grade change intelligence for scaling businesses.",
      features: [
        "Monitor up to 100 websites",
        "Hourly scan intervals",
        "Unlimited history archives",
        "Gemini AI Change explanations",
        "Slack & Discord webhooks",
        "Competitor Mode reporting"
      ],
      cta: "Start 14-day Free Trial",
      popular: true
    },
    {
      name: "Team Workspace",
      price: "$149",
      description: "Advanced intelligence sharing for product and sales teams.",
      features: [
        "Unlimited monitored websites",
        "On-demand manual scans",
        "Shared team dashboards",
        "Custom API & webhook access",
        "Stripe billing integrations"
      ],
      cta: "Join Team Workspace",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[150px] -z-10 pointer-events-none" />

      <Header />

      {/* Hero Section */}
      <section id="hero" className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6"
        >
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-xs font-semibold text-muted tracking-wide uppercase">Powered by Gemini 2.5 Flash</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-[1.1] mb-8"
        >
          Website Change Intelligence,{' '}
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Explained by AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted text-base md:text-xl max-w-2xl mb-10 font-normal leading-relaxed"
        >
          Stop comparing raw HTML. Cognify AI extracts semantic content changes, removes noise, and explains the business impact instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full"
        >
          <Link href={user ? "/dashboard" : "/register"} className="bg-primary hover:bg-primary-hover text-black text-base font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2">
            Start Monitoring Free <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#demo" className="glass hover:bg-white/5 text-foreground text-base font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2">
            See AI Diff Demo
          </a>
        </motion.div>

        {/* Hero Interactive UI Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl rounded-2xl glass p-1 border border-white/10 shadow-2xl relative"
        >
          <div className="bg-[#09090B] rounded-xl overflow-hidden aspect-[16/9] border border-white/5 flex flex-col">
            <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 justify-between">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-white/5 rounded-md px-3 py-0.5 text-xs text-muted flex items-center gap-2 border border-white/5">
                <Shield className="h-3 w-3 text-white" />
                <span>cognify.co/dashboard</span>
              </div>
              <div className="w-6" />
            </div>
            {/* Dashboard Mock Screen */}
            <div className="flex-1 p-6 text-left flex gap-6">
              <div className="w-1/4 border-r border-white/5 pr-4 flex flex-col space-y-3">
                <div className="h-6 w-32 bg-white/5 rounded-md" />
                <div className="h-10 w-full bg-white/10 border border-white/20 rounded-xl px-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-white" />
                  <div className="h-3 w-16 bg-white/20 rounded" />
                </div>
                <div className="h-10 w-full hover:bg-white/5 rounded-xl px-3 flex items-center gap-2 cursor-pointer transition-colors">
                  <Layers className="h-4 w-4 text-muted" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                </div>
              </div>
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="h-5 w-40 bg-white/10 rounded-md" />
                    <div className="h-3 w-24 bg-white/5 rounded-md" />
                  </div>
                  <div className="h-8 w-24 bg-white rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-20 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-between">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-6 w-10 bg-white/20 rounded" />
                  </div>
                  <div className="h-20 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-between">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-6 w-8 bg-white/20 rounded" />
                  </div>
                  <div className="h-20 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-between">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-6 w-12 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-40 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-12 bg-white/5 rounded" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-[90%] bg-white/5 rounded" />
                    <div className="h-3 w-[75%] bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white/[0.01] border-y border-white/5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Standard Crawling is Broken</h2>
            <p className="text-muted text-base md:text-lg">We designed a noise-free pipeline to extract clean insights directly from target pages.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-interactive p-8 rounded-xl flex flex-col space-y-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Semantic Snapshot Engine</h3>
              <p className="text-muted text-sm leading-relaxed">
                Uses Playwright to render JavaScript, strips tracking scripts, ads, headers, and footers via Mozilla Readability, then converts to clean markdown.
              </p>
            </div>
            <div className="glass-interactive p-8 rounded-xl flex flex-col space-y-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Gemini AI Diff Insights</h3>
              <p className="text-muted text-sm leading-relaxed">
                Analyzes text updates and provides structure: What changed, why it matters, who is affected, importance levels, and clear recommended actions.
              </p>
            </div>
            <div className="glass-interactive p-8 rounded-xl flex flex-col space-y-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Multi-Channel Alerts</h3>
              <p className="text-muted text-sm leading-relaxed">
                Receive notifications when medium-to-critical events occur. Integrated natively with Slack, Discord, Telegram, and traditional Email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Explanation Demo Section */}
      <section id="demo" className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">See It in Action</h2>
          <p className="text-muted max-w-xl mx-auto">Simulate how Cognify AI analyzes a pricing change on a monitored SaaS competitor.</p>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col space-y-6">
          <div className="flex border-b border-white/5 pb-4 justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setDemoState('original')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${demoState === 'original' ? 'bg-primary text-black' : 'hover:bg-white/5 text-muted'}`}
              >
                Original Page
              </button>
              <button
                onClick={() => setDemoState('changed')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${demoState === 'changed' ? 'bg-primary text-black' : 'hover:bg-white/5 text-muted'}`}
              >
                Changed Page (New Version)
              </button>
              <button
                onClick={() => setDemoState('ai')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${demoState === 'ai' ? 'bg-primary text-black shadow-lg shadow-white/15' : 'hover:bg-white/5 text-muted'}`}
              >
                <Sparkles className="h-3 w-3" /> Explain Changes (Gemini)
              </button>
            </div>
            <div className="text-xs text-muted font-mono flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
              <span>Real-time extraction</span>
            </div>
          </div>

          <div className="min-h-[220px] font-mono text-sm leading-relaxed p-4 bg-black/40 rounded-xl border border-white/5 overflow-auto">
            <AnimatePresence mode="wait">
              {demoState === 'original' && (
                <motion.div
                  key="original"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-muted"># SaaS API Pricing Plans</p>
                  <p className="mt-2">• Free Plan: 1,000 API requests / month</p>
                  <p>• Developer Plan: $19/mo for 50,000 requests</p>
                  <p>• Growth Plan: $49/mo for 200,000 requests</p>
                </motion.div>
              )}
              {demoState === 'changed' && (
                <motion.div
                  key="changed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-muted"># SaaS API Pricing Plans</p>
                  <p className="mt-2">• Free Plan: 1,000 API requests / month</p>
                  <p className="text-red-400 line-through">• Developer Plan: $19/mo for 50,000 requests</p>
                  <p className="text-green-400 bg-white/5 inline-block px-1 rounded">• Developer Plan: $29/mo for 40,000 requests</p>
                  <p className="mt-1">• Growth Plan: $49/mo for 200,000 requests</p>
                </motion.div>
              )}
              {demoState === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-sans space-y-4"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 text-xs font-bold uppercase">Importance: HIGH</span>
                    <span className="text-xs text-muted">Confidence Score: 98%</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Summary of Change:</p>
                    <p className="text-muted text-sm">Developer Plan pricing increased from $19 to $29 per month, while API request limits were decreased from 50k to 40k.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Why It Matters:</p>
                    <p className="text-muted text-sm">This is a 52% cost-per-request rate hike on the entry tier. It indicates margin pressures or prep for higher tier expansion.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Recommended Action:</p>
                    <p className="text-muted text-sm">Update comparative sales collateral and alert marketing teams of competitor pricing revision.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white/[0.01] border-y border-white/5 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Flexible SaaS Pricing</h2>
            <p className="text-muted text-base md:text-lg">Scale change monitoring smoothly from small side projects to enterprise scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`glass p-8 rounded-xl flex flex-col justify-between relative border ${plan.popular ? 'border-white shadow-xl shadow-white/5' : 'border-white/5'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 bg-white text-black text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/10">
                    Most Popular
                  </span>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-muted text-xs mt-1">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl md:text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-muted text-sm">/month</span>
                  </div>
                  <ul className="space-y-3 border-t border-white/5 pt-6 text-sm text-muted">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-white shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={user ? "/dashboard" : "/register"}
                  className={`mt-8 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1 ${plan.popular ? 'bg-white hover:bg-primary-hover text-black shadow-md' : 'glass hover:bg-white/5 text-foreground'}`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="glass rounded-xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-white flex items-center gap-2.5">
                  <HelpCircle className="h-4.5 w-4.5 text-white" />
                  {faq.q}
                </span>
                <ChevronDown className={`h-5 w-5 text-muted transition-transform duration-300 ${activeFaq === index ? 'rotate-180 text-white' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 border-t border-white/5 text-muted text-sm leading-relaxed bg-black/20">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 bg-black/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center">
              <Eye className="h-4.5 w-4.5 text-black" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Cognify <span className="text-primary font-medium text-xs">AI</span>
            </span>
          </div>
          <p className="text-muted text-xs">&copy; 2026 Cognify AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
