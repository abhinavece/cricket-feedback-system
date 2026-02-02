import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Calculator, 
  Users, 
  Coins, 
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  ArrowRight,
  Brain
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateItemListSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Free Cricket Tools - Calculators, Team Picker & More',
  description: 'Free online cricket tools: Run rate calculator, DLS calculator, team picker, virtual toss, and more. No signup required. Perfect for cricket enthusiasts and team managers.',
  keywords: [
    'cricket calculator',
    'run rate calculator',
    'dls calculator',
    'cricket team picker',
    'cricket toss online',
    'net run rate calculator',
    'cricket score calculator',
    'free cricket tools',
  ],
  alternates: {
    canonical: `${siteConfig.url}/tools`,
  },
  openGraph: {
    title: 'Free Cricket Tools - Calculators & Team Picker | CricSmart',
    description: 'Powerful free cricket tools. Calculate run rates, use DLS method, pick fair teams, and more.',
    url: `${siteConfig.url}/tools`,
    type: 'website',
  },
};

const tools = [
  {
    name: 'Run Rate Calculator',
    description: 'Calculate current run rate, required run rate, and projected scores.',
    href: '/tools/run-rate',
    icon: Calculator,
    popular: true,
  },
  {
    name: 'DLS Calculator',
    description: 'Calculate revised targets using the Duckworth-Lewis-Stern method.',
    href: '/tools/dls',
    icon: TrendingUp,
    popular: true,
  },
  {
    name: 'Team Picker',
    description: 'Randomly generate fair cricket teams from a pool of players.',
    href: '/tools/team-picker',
    icon: Users,
    popular: true,
  },
  {
    name: 'Virtual Toss',
    description: 'Online cricket toss simulator. Fair coin flip for match decisions.',
    href: '/tools/toss',
    icon: Coins,
    popular: true,
  },
  {
    name: 'Target Calculator',
    description: 'Calculate the target score needed to win.',
    href: '/tools/target',
    icon: Target,
    popular: false,
  },
  {
    name: 'Net Run Rate Calculator',
    description: 'Calculate NRR for tournament standings.',
    href: '/tools/nrr',
    icon: BarChart3,
    popular: false,
  },
  {
    name: 'Strike Rate Calculator',
    description: 'Calculate batting and bowling strike rates.',
    href: '/tools/strike-rate',
    icon: Zap,
    popular: false,
  },
  {
    name: 'Overs Converter',
    description: 'Convert overs to balls and balls to overs.',
    href: '/tools/overs',
    icon: Clock,
    popular: false,
  },
];

export default function ToolsPage() {
  const itemListSchema = generateItemListSchema(
    tools.map((tool, index) => ({
      name: tool.name,
      url: `${siteConfig.url}${tool.href}`,
      position: index + 1,
    })),
    'Free Cricket Tools'
  );

  const popularTools = tools.filter((t) => t.popular);
  const otherTools = tools.filter((t) => !t.popular);

  return (
    <>
      <SchemaScript schema={itemListSchema} />
      
      <div className="pt-20">
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'Tools', href: '/tools' }]} />

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Free Tools</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Cricket Tools
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Powerful calculators and tools for cricket. 
                All free, no signup required.
              </p>
            </div>
          </div>
        </section>

        {/* Popular Tools */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-slate-900" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6">Most Popular</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {popularTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="card p-6 group hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">{tool.description}</p>
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                    Use Tool
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Other Tools */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6">More Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="card p-5 group hover:border-emerald-500/30 transition-all"
                >
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-cyan-500 transition-all">
                    <tool.icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors text-sm">
                    {tool.name}
                  </h3>
                  <p className="text-slate-500 text-xs">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-slate-950" />
          
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="card p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Need Full Team Management?
              </h2>
              <p className="text-slate-400 mb-6">
                CricSmart offers complete team management with AI-powered features, 
                WhatsApp automation, and payment tracking.
              </p>
              <Link href={siteConfig.appUrl} className="btn-primary inline-flex">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
