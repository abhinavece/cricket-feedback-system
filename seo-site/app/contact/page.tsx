import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Mail, 
  MapPin, 
  MessageSquare, 
  Instagram, 
  Globe, 
  ArrowRight, 
  Users,
  HelpCircle,
  Clock
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch with CricSmart',
  description: 'Contact the CricSmart team for support, feedback, or partnership inquiries. We are based in Noida, India and help cricket teams manage their matches, payments, and availability.',
  keywords: [
    'contact cricsmart',
    'cricsmart support',
    'cricket team management help',
    'cricsmart email',
  ],
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
  openGraph: {
    title: 'Contact Us | CricSmart',
    description: 'Get in touch with the CricSmart team for support, feedback, or partnerships.',
    url: `${siteConfig.url}/contact`,
    type: 'website',
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: 'Contact CricSmart' }],
  },
};

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us an email and we\'ll get back to you within 24 hours.',
    value: 'contact@cricsmart.in',
    href: 'mailto:contact@cricsmart.in',
    gradient: 'from-emerald-500 to-cyan-500',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    description: 'Chat with us on WhatsApp for quick support.',
    value: '+91 8087102325',
    href: 'https://wa.me/918087102325',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Instagram,
    title: 'Instagram',
    description: 'Follow us for updates, cricket tips, and community content.',
    value: '@_mavericks_xi',
    href: 'https://www.instagram.com/_mavericks_xi/',
    gradient: 'from-pink-500 to-purple-500',
  },
];

const quickLinks = [
  { icon: HelpCircle, title: 'FAQ', description: 'Find answers to common questions', href: '/faq' },
  { icon: Users, title: 'About Us', description: 'Learn about CricSmart and our mission', href: '/about' },
  { icon: Globe, title: 'Cricket Tools', description: 'Free calculators and tools', href: '/tools' },
];

export default function ContactPage() {
  const webPageSchema = generateWebPageSchema({
    name: 'Contact Us - Get in Touch with CricSmart',
    description: 'Contact the CricSmart team for support, feedback, or partnership inquiries.',
    url: `${siteConfig.url}/contact`,
    breadcrumb: [{ name: 'Contact', url: `${siteConfig.url}/contact` }],
  });

  return (
    <>
      <SchemaScript schema={webPageSchema} />

      <div>
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'Contact', href: '/contact' }]} />
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Get in Touch</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Contact Us
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Have questions, feedback, or need help? 
                We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-3 gap-6">
              {contactMethods.map((method) => (
                <a
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group text-center"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${method.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <method.icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {method.title}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">{method.description}</p>
                  <span className="text-emerald-400 text-sm font-medium">{method.value}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Location & Hours */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Our Location</h3>
                </div>
                <p className="text-slate-300">Noida, Uttar Pradesh</p>
                <p className="text-slate-300">India</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Response Time</h3>
                </div>
                <p className="text-slate-300">Email: Within 24 hours</p>
                <p className="text-slate-300">WhatsApp: Within a few hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Helpful Links</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition-all group flex items-start gap-3"
                >
                  <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                    <link.icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5 group-hover:text-emerald-400 transition-colors">{link.title}</h3>
                    <p className="text-xs text-slate-500">{link.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-8">
              <h2 className="text-2xl font-black text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-slate-300 mb-6">
                Join hundreds of cricket teams using CricSmart. Free to start.
              </p>
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
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
