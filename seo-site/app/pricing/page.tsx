import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Rocket, 
  Gavel,
  ArrowRight, 
  Users, 
  Brain, 
  MessageSquare, 
  CreditCard, 
  MapPin,
  Calculator,
  Shield,
  Star
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import AuctionCTAButton from '@/components/AuctionCTAButton';

export const metadata: Metadata = {
  title: 'Pricing - Free Cricket Team Management Platform',
  description: 'CricSmart is free for teams up to 50 players. AI-powered payment verification, WhatsApp automation, match scheduling, and cricket ground discovery. No credit card required.',
  keywords: [
    'cricket team management free',
    'cricket app pricing',
    'free cricket software',
    'cricket team app',
    'cricket management platform cost',
    'cricsmart pricing',
  ],
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
  openGraph: {
    title: 'Pricing - Free Cricket Team Management | CricSmart',
    description: 'Free for teams up to 50 players. AI payments, WhatsApp automation, match scheduling, and more.',
    url: `${siteConfig.url}/pricing`,
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'CricSmart Pricing',
      },
    ],
  },
};

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for local cricket teams getting started',
    icon: Zap,
    gradient: 'from-slate-600 to-slate-700',
    shadowColor: 'shadow-slate-500/10',
    popular: false,
    service: 'team' as const,
    features: [
      { text: 'up to 50 players', included: true },
      { text: 'Unlimited matches', included: true },
      { text: 'Player availability tracking', included: true },
      { text: 'Match scheduling', included: true },
      { text: 'Basic payment tracking', included: true },
      { text: 'Cricket ground discovery', included: true },
      { text: 'All cricket tools & calculators', included: true },
      { text: 'WhatsApp notifications (limited)', included: true },
      { text: 'AI payment verification', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    description: 'For serious teams that want the full AI experience',
    icon: Crown,
    gradient: 'from-emerald-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/25',
    popular: true,
    badge: 'Most Popular',
    service: 'team' as const,
    features: [
      { text: 'Unlimited players', included: true },
      { text: 'Unlimited matches', included: true },
      { text: 'Player availability tracking', included: true },
      { text: 'Match scheduling', included: true },
      { text: 'Advanced payment tracking', included: true },
      { text: 'Cricket ground discovery', included: true },
      { text: 'All cricket tools & calculators', included: true },
      { text: 'Unlimited WhatsApp notifications', included: true },
      { text: 'AI payment verification', included: true },
      { text: 'Advanced analytics & insights', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    name: 'Tournament',
    price: '₹999',
    period: '/tournament',
    description: 'Run cricket tournaments like a pro with full management tools',
    icon: Rocket,
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/25',
    popular: false,
    service: 'tournament' as const,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Tournament management', included: true },
      { text: 'Team registration portal', included: true },
      { text: 'Live scoring & leaderboards', included: true },
      { text: 'Tournament brackets', included: true },
      { text: 'Multi-admin support', included: true },
      { text: 'Payment & balance tracking', included: true },
      { text: 'Spectator view', included: true },
      { text: 'Export & reports', included: true },
      { text: 'Dedicated support', included: true },
    ],
  },
  {
    name: 'Auction',
    price: '₹1,999',
    period: '/auction',
    description: 'AI-powered player auctions matching international standards',
    icon: Gavel,
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/25',
    popular: false,
    service: 'auction' as const,
    badge: 'Free for < 5 teams',
    features: [
      { text: 'Free for auctions under 5 teams', included: true },
      { text: '₹1,999 for 5+ teams per auction', included: true },
      { text: 'AI-powered player valuation', included: true },
      { text: 'Live auction room', included: true },
      { text: 'Real-time bidding interface', included: true },
      { text: 'Team budget management', included: true },
      { text: 'Player categorization', included: true },
      { text: 'Auction analytics & insights', included: true },
      { text: 'Spectator mode', included: true },
      { text: 'Export auction results', included: true },
    ],
  },
];

const freeFeatures = [
  {
    icon: Users,
    title: 'Team Management',
    description: 'Manage up to 50 players with role assignments and profiles.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Notifications',
    description: 'Send availability requests and reminders via WhatsApp.',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track match fees, dues, and payments for your team.',
  },
  {
    icon: MapPin,
    title: 'Ground Discovery',
    description: 'Find and review cricket grounds across India.',
  },
  {
    icon: Calculator,
    title: 'Cricket Tools',
    description: 'DLS calculator, run rate, team picker, and more — all free.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: '99.9% uptime with enterprise-grade security for your data.',
  },
];

const faqs = [
  {
    question: 'Is CricSmart really free?',
    answer: 'Yes! CricSmart is completely free for teams with up to 50 players. You get match scheduling, availability tracking, payment management, and WhatsApp notifications at no cost. No credit card required.',
  },
  {
    question: 'What happens when my team grows beyond 50 players?',
    answer: 'You can upgrade to our Pro plan which supports unlimited players. Your existing data and settings are preserved during the upgrade.',
  },
  {
    question: 'Can I try Pro features before paying?',
    answer: 'We offer a 14-day free trial of Pro features for all new teams. Experience AI payment verification, advanced analytics, and unlimited WhatsApp notifications before committing.',
  },
  {
    question: 'How does the Tournament plan work?',
    answer: 'The Tournament plan is ₹999 per tournament — a one-time fee. It includes everything in Pro plus tournament brackets, live scoring, leaderboards, team registration, and payment tracking.',
  },
  {
    question: 'How does Auction pricing work?',
    answer: 'Auctions with fewer than 5 teams are completely free. For auctions with 5 or more teams, the fee is ₹1,999 per auction. You get AI-powered player valuation, live bidding, budget management, and full analytics.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no long-term contracts. You can downgrade to the Free plan anytime and keep all your data.',
  },
];

export default function PricingPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'Pricing - Free Cricket Team Management Platform',
    description: 'CricSmart is free for teams up to 50 players. AI-powered payment verification, WhatsApp automation, and match scheduling.',
    url: `${siteConfig.url}/pricing`,
    breadcrumb: [{ name: 'Pricing', url: `${siteConfig.url}/pricing` }],
  });

  const pricingFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <SchemaScript schema={[webPageSchema, pricingFaqSchema]} />

      <div>
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'Pricing', href: '/pricing' }]} />

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                <Star className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Simple Pricing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Free for Most Teams
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Start managing your cricket team for free. 
                Upgrade only when you need advanced AI features or tournament management.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-slate-900" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-slate-800/30 backdrop-blur-sm border rounded-2xl p-6 lg:p-8 transition-all hover:scale-[1.02] ${
                    plan.popular
                      ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {'badge' in plan && plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`inline-block px-3 py-1 text-white text-xs font-bold rounded-full uppercase tracking-wider whitespace-nowrap ${
                        plan.gradient === 'from-amber-500 to-orange-500' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : plan.gradient === 'from-violet-500 to-purple-500'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center mb-4`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>

                  {plan.service === 'auction' ? (
                    <AuctionCTAButton
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-700/50 hover:bg-slate-700 text-white border border-white/10'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </AuctionCTAButton>
                  ) : (
                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(
                        plan.service === 'tournament' ? siteConfig.tournamentUrl :
                        siteConfig.appUrl
                      )}&service=${plan.service}`}
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-700/50 hover:bg-slate-700 text-white border border-white/10'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature.text} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included Free */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Everything You Need,{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Completely Free
                </span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Most cricket teams never need to pay. Our free plan includes everything 
                you need to manage your team effectively.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-950" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white mb-4">
                Pricing FAQ
              </h2>
              <p className="text-slate-400">
                Common questions about CricSmart pricing
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 group"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="font-medium text-white group-open:text-emerald-400 transition-colors pr-4">
                      {faq.question}
                    </h3>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-4 text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-8 lg:p-12">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-slate-300 mb-8 max-w-lg mx-auto">
                Join hundreds of cricket teams already using CricSmart. 
                Free to start, no credit card required.
              </p>
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
              >
                <Users className="w-5 h-5" />
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
