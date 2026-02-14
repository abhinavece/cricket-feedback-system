import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  Gavel, 
  ArrowRight, 
  CheckCircle2,
  Brain,
  MessageSquare,
  CreditCard,
  Monitor,
  ArrowLeftRight,
  Calendar,
  Sparkles
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'CricSmart Products - Team Management, Tournaments & Auctions',
  description: 'Comprehensive cricket management solutions. AI team management with WhatsApp, tournament organization, and IPL-style player auctions. Free for small teams.',
  keywords: [
    'cricket management software',
    'cricket team app',
    'cricket tournament software',
    'cricket auction platform',
    'cricket league management',
  ],
  alternates: {
    canonical: `${siteConfig.url}/products`,
  },
  openGraph: {
    title: 'CricSmart Products - Complete Cricket Management Suite',
    description: 'AI team management, tournament organization, and IPL-style player auctions. Everything your cricket league needs.',
    url: `${siteConfig.url}/products`,
    type: 'website',
  },
};

const products = [
  {
    slug: 'cricket-team-management',
    name: 'CricSmart Teams',
    tagline: 'AI-Powered Team Management',
    description: 'Manage your cricket team with AI payment verification, WhatsApp notifications, automatic availability tracking, and smart squad building.',
    icon: Users,
    gradient: 'from-emerald-500 to-cyan-500',
    bgGlow: 'bg-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/40',
    highlights: [
      { icon: Brain, text: 'AI payment verification from screenshots' },
      { icon: MessageSquare, text: 'WhatsApp availability & reminders' },
      { icon: CreditCard, text: 'Payment tracking & dues management' },
    ],
    pricing: 'Free for teams up to 50 players',
    ctaText: 'Get Started Free',
    ctaHref: `/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`,
  },
  {
    slug: 'cricket-tournament-management',
    name: 'CricSmart Tournament',
    tagline: 'Pro Tournament Organization',
    description: 'Run cricket tournaments like a pro. Team registration portal, automated followups, payment tracking, brackets, and leaderboards.',
    icon: Trophy,
    gradient: 'from-violet-500 to-purple-500',
    bgGlow: 'bg-violet-500/20',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/40',
    highlights: [
      { icon: Calendar, text: 'Team registration & scheduling' },
      { icon: MessageSquare, text: 'Automated team followups' },
      { icon: CreditCard, text: 'Payment & balance tracking' },
    ],
    pricing: '₹999 per tournament',
    ctaText: 'Start a Tournament',
    ctaHref: `/auth/login?redirect=${encodeURIComponent(siteConfig.tournamentUrl)}&service=tournament`,
  },
  {
    slug: 'cricket-player-auction',
    name: 'CricSmart Auction',
    tagline: 'IPL-Style Live Bidding',
    description: 'Professional player auctions with real-time bidding, broadcast view for streaming, post-auction trading window, and comprehensive analytics.',
    icon: Gavel,
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderHover: 'hover:border-amber-500/40',
    highlights: [
      { icon: Monitor, text: 'Real-time live bidding (WebSocket)' },
      { icon: ArrowLeftRight, text: '48-hour post-auction trading' },
      { icon: Monitor, text: 'Broadcast view for YouTube/OBS' },
    ],
    pricing: 'Free for auctions under 5 teams',
    ctaText: 'Start an Auction',
    ctaHref: '/auth/login?redirect=https%3A%2F%2Fauction.cricsmart.in&service=auction',
  },
];

export default function ProductsPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'CricSmart Products - Complete Cricket Management Suite',
    description: 'AI team management, tournament organization, and IPL-style player auctions.',
    url: `${siteConfig.url}/products`,
    breadcrumb: [{ name: 'Products', url: `${siteConfig.url}/products` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />

      <div>
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'Products', href: '/products' }]} />
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">CricSmart Products</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Everything Your{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
                  Cricket League
                </span>{' '}
                Needs
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Three powerful products that work together seamlessly. 
                Manage teams, run tournaments, and host auctions — all in one platform.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div
                  key={product.slug}
                  className={`relative bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 ${product.borderHover} transition-all group`}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 ${product.bgGlow} opacity-0 group-hover:opacity-100 rounded-3xl blur-xl transition-opacity duration-500 -z-10`} />

                  {/* Icon */}
                  <div className={`w-16 h-16 ${product.iconBg} rounded-2xl flex items-center justify-center mb-6 ${product.iconColor}`}>
                    <product.icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-black text-white mb-1">
                    {product.name}
                  </h2>
                  <p className={`text-sm font-medium bg-gradient-to-r ${product.gradient} bg-clip-text text-transparent mb-4`}>
                    {product.tagline}
                  </p>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-3 mb-6">
                    {product.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        {h.text}
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="text-sm text-slate-500 mb-6">
                    {product.pricing}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-3">
                    <Link
                      href={product.ctaHref}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${product.gradient} text-white font-bold rounded-xl transition-all shadow-lg`}
                    >
                      {product.ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/${product.slug}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Note */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              All Products Work Together
            </h2>
            <p className="text-slate-400 mb-8">
              Create teams in CricSmart Teams, then use them in tournaments and auctions. 
              Player data, squad lists, and payment history carry across all products.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View Pricing Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
