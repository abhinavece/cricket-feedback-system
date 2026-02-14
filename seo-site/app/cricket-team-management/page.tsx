import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Brain, 
  MessageSquare, 
  CreditCard, 
  Users, 
  CalendarCheck, 
  MapPin, 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowRight,
  Smartphone,
  Bell,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Cricket Team Management App - AI Payment & WhatsApp Automation',
  description: 'Free cricket team management with AI-powered payment verification, WhatsApp availability tracking, and smart squad builder. Manage your cricket team effortlessly.',
  keywords: [
    'cricket team management app',
    'cricket team app',
    'cricket squad manager',
    'whatsapp cricket notifications',
    'cricket payment tracking',
    'cricket team availability',
    'cricket match scheduling',
    'AI payment verification cricket',
  ],
  alternates: {
    canonical: `${siteConfig.url}/cricket-team-management`,
  },
  openGraph: {
    title: 'CricSmart Teams - AI-Powered Cricket Team Management',
    description: 'Free cricket team management with AI payment verification, WhatsApp automation, and smart squad building. No more spreadsheets.',
    url: `${siteConfig.url}/cricket-team-management`,
    type: 'website',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: 'CricSmart Teams' }],
  },
};

const mainFeatures = [
  {
    icon: Brain,
    title: 'AI Payment Processing',
    description: 'Upload payment screenshots and our AI automatically verifies amounts, identifies payers, and updates records. No more manual tracking of who paid what.',
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    highlights: ['Screenshot-based verification', 'Auto amount detection', 'Smart reconciliation'],
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Notifications',
    description: 'Send availability requests, match reminders, payment reminders, and team updates directly via WhatsApp. Players respond with a single tap.',
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    highlights: ['One-tap availability response', 'Automated reminders', 'Custom message templates'],
  },
  {
    icon: CalendarCheck,
    title: 'Automatic Team Availability',
    description: 'Send availability requests before every match. Track Yes/No/Tentative responses in real-time. Build your playing XI based on who is available.',
    gradient: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    highlights: ['Real-time tracking', 'Auto follow-ups', 'Smart XI suggestion'],
  },
  {
    icon: CreditCard,
    title: 'Payment Management',
    description: 'Track match fees, dues, and payments for your entire team. Know exactly who owes what. Split costs fairly across the squad.',
    gradient: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    highlights: ['Per-match fee tracking', 'Outstanding dues dashboard', 'Payment history'],
  },
  {
    icon: Users,
    title: 'Smart Squad Builder',
    description: 'Build balanced teams based on player roles, skill levels, and availability. Fair team selection for practice matches.',
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    highlights: ['Role-based selection', 'Skill balancing', 'Random fair teams'],
  },
  {
    icon: MapPin,
    title: 'Cricket Ground Discovery',
    description: 'Find cricket grounds near you. Read reviews, check amenities, view ratings, and discover the perfect venue for your next match.',
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    highlights: ['Reviews & ratings', 'Amenity details', 'Location mapping'],
  },
];

const additionalFeatures = [
  { icon: Smartphone, title: 'Mobile Friendly', description: 'Works perfectly on all devices. Manage your team on the go.' },
  { icon: BarChart3, title: 'Match Analytics', description: 'Track team performance, player stats, and match history.' },
  { icon: Bell, title: 'Smart Reminders', description: 'Automated reminders for matches, payments, and availability.' },
  { icon: Shield, title: 'Secure & Private', description: 'Enterprise-grade security. Your team data stays private.' },
];

export default function CricketTeamManagementPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'CricSmart Teams - AI-Powered Cricket Team Management',
    description: 'Free cricket team management with AI payment verification, WhatsApp automation, and smart squad building.',
    url: `${siteConfig.url}/cricket-team-management`,
    breadcrumb: [{ name: 'CricSmart Teams', url: `${siteConfig.url}/cricket-team-management` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />

      <div>
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'CricSmart Teams', href: '/cricket-team-management' }]} />
            <div className="text-center">
              {/* Product Logo Area - Ready for future logo */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                    CricSmart Teams
                  </h1>
                  <p className="text-emerald-400 font-medium text-lg">AI-Powered Team Management</p>
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Manage Your Cricket Team{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Like Never Before
                </span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                AI payment processing, WhatsApp notifications, automatic team availability, 
                and smart squad building — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="text-slate-400 text-sm">
                  Free for teams up to <span className="text-white font-bold">50 players</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            {mainFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`grid md:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'md:direction-rtl' : ''}`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-4 ${feature.iconColor}`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-8 flex items-center justify-center h-48 sm:h-64 opacity-20`}>
                    <feature.icon className="w-24 h-24 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">And Much More</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all text-center"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-8 lg:p-12">
              <h2 className="text-3xl font-black text-white mb-4">
                Ready to Manage Your Team Smarter?
              </h2>
              <p className="text-slate-300 mb-8">
                Free for teams up to 50 players. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl border border-white/10 transition-all"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
