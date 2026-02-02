import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Users, 
  Target, 
  Heart, 
  ArrowRight, 
  Brain,
  MessageSquare,
  CreditCard,
  Zap,
  CheckCircle2
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'About CricSmart - AI Cricket Team Management',
  description: 'CricSmart is an AI-powered cricket team management platform. Learn about our mission to help amateur cricket teams organize better matches.',
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
  openGraph: {
    title: 'About CricSmart - AI Cricket Team Management',
    description: 'Learn about CricSmart and our mission to revolutionize amateur cricket.',
    url: `${siteConfig.url}/about`,
    type: 'website',
  },
};

const coreFeatures = [
  {
    icon: Brain,
    title: 'AI Payment Verification',
    description: 'Upload payment screenshots and our AI automatically verifies who has paid.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Automation',
    description: 'Players respond to availability directly via WhatsApp. No app download needed.',
  },
  {
    icon: CreditCard,
    title: 'Smart Payment Tracking',
    description: 'Track who paid, who owes, and send automated reminders.',
  },
  {
    icon: Zap,
    title: 'Instant Squad Building',
    description: 'See available players in real-time and build your squad with one click.',
  },
];

const stats = [
  { value: '500+', label: 'Active Players' },
  { value: '50+', label: 'Cricket Grounds' },
  { value: '1000+', label: 'Matches Managed' },
  { value: '₹10L+', label: 'Payments Tracked' },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'About', href: '/about' }]} />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Our Story</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
              About <span className="text-gradient">CricSmart</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              We&apos;re on a mission to simplify cricket team management 
              so you can focus on what matters - playing cricket.
            </p>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-slate-900" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">The Problem We Solve</h2>
            </div>
            
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Every weekend cricket organizer knows the pain: endless WhatsApp messages 
                asking &ldquo;Who&apos;s playing Saturday?&rdquo;, tracking down payment screenshots, 
                manually counting who paid and who didn&apos;t, and last-minute dropouts 
                throwing everything into chaos.
              </p>
              <p>
                <span className="text-emerald-400 font-medium">CricSmart was built to solve exactly this.</span> We&apos;re 
                a team of cricket enthusiasts and engineers who got tired of spreadsheets and 
                WhatsApp chaos. So we built the tool we wished existed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            What Makes CricSmart Different
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {coreFeatures.map((feature) => (
              <div key={feature.title} className="card p-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-slate-950" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              CricSmart in Numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-gradient mb-1">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Our Values</h2>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🏏</div>
                <h3 className="font-semibold text-white mb-1">Cricket First</h3>
                <p className="text-slate-400 text-sm">
                  Every feature is designed with cricket in mind.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🤝</div>
                <h3 className="font-semibold text-white mb-1">Community Driven</h3>
                <p className="text-slate-400 text-sm">
                  Built by cricketers, for cricketers.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🆓</div>
                <h3 className="font-semibold text-white mb-1">Free Forever</h3>
                <p className="text-slate-400 text-sm">
                  Core features always free for all teams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-slate-900" />
        
        {/* Gradient orb */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            Ready to Try CricSmart?
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {['Free Forever', 'No Credit Card', 'Setup in 5 Minutes'].map((benefit) => (
              <span key={benefit} className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {benefit}
              </span>
            ))}
          </div>

          <Link 
            href={siteConfig.appUrl} 
            className="btn-primary inline-flex"
          >
            <Users className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
