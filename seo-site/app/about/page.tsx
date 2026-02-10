'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  ArrowLeft,
  Brain,
  Sparkles,
  MessageSquare,
  CreditCard,
  Users,
  Zap,
  Target,
  Heart,
  Mail,
  MapPin,
  Instagram,
  Globe,
  CheckCircle2,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { siteConfig } from '@/lib/api';

const AboutPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Payments',
      description: 'Upload payment screenshots and let our AI automatically verify amounts and update records.',
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'WhatsApp Automation',
      description: 'Send availability requests, reminders, and updates directly via WhatsApp.',
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Squad Building',
      description: 'Real-time availability tracking helps you build the perfect playing XI.',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Payment Tracking',
      description: 'Track dues, split costs, and manage team finances effortlessly.',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Players', icon: <Users className="w-5 h-5" /> },
    { value: '1000+', label: 'Matches Managed', icon: <Target className="w-5 h-5" /> },
    { value: '50+', label: 'Cricket Grounds', icon: <MapPin className="w-5 h-5" /> },
    { value: '99%', label: 'Uptime', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const values = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Innovation',
      description: 'We use cutting-edge AI technology to solve real problems for cricket teams.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Reliability',
      description: 'Your data is secure and our platform is available when you need it most.',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Passion',
      description: 'Built by cricket lovers who understand the challenges of managing a local team.',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Simplicity',
      description: 'Complex problems deserve simple solutions. We make team management effortless.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <header ref={heroRef} className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          {/* Hero content */}
          <div className={`text-center max-w-3xl mx-auto py-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <span className="text-white font-black text-5xl">C</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">AI-Powered Cricket Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
              About{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CricSmart
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              The intelligent platform that transforms how local cricket teams manage matches, 
              track payments, and communicate with players.
            </p>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-16 space-y-24">
        {/* Our Story Section */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Heart className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 text-sm font-medium">Our Story</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
              Built by Cricket Enthusiasts,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                For Cricket Teams
              </span>
            </h2>

            <div className="space-y-4 text-slate-300">
              <p>
                CricSmart was born out of frustration. As passionate cricketers ourselves, we spent 
                countless hours manually tracking availability via WhatsApp, chasing payments after 
                every match, and struggling to coordinate 15+ players for weekend games.
              </p>
              <p>
                We knew there had to be a better way. So we combined our love for cricket with 
                modern AI technology to create a platform that actually solves these problems.
              </p>
              <p>
                Today, CricSmart helps hundreds of cricket teams across India manage their matches 
                effortlessly — from automated availability checks to AI-powered payment verification.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  {stat.icon}
                </div>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What We Do Section */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">What We Do</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Intelligent Features for{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Modern Teams
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to run your cricket team, powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all relative overflow-hidden"
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative">
                  <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-4 ${feature.iconColor} group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Values Section */}
        <section>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Our Values</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              What Drives Us
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={value.title}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/20">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-slate-400">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/10 rounded-3xl border border-emerald-500/20 overflow-hidden">
            <div className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left side - Contact info */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-medium">Get in Touch</span>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-4">
                    Questions or Feedback?
                  </h2>
                  <p className="text-slate-400 mb-8">
                    We&apos;d love to hear from you. Whether you have questions about CricSmart, 
                    need help getting started, or want to share feedback — reach out to us.
                  </p>

                  <div className="space-y-4">
                    <a 
                      href="mailto:support@cricsmart.in"
                      className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 transition-colors"
                    >
                      <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span>support@cricsmart.in</span>
                    </a>
                    
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span>Noida, Uttar Pradesh, India</span>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="flex gap-3 mt-8">
                    <a 
                      href="https://www.instagram.com/_mavericks_xi/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-11 h-11 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/20 transition-all"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://cricsmart.in" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-11 h-11 bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Right side - CTA */}
                <div className="text-center lg:text-left">
                  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Ready to Simplify Your Team Management?
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Join hundreds of cricket teams already using CricSmart
                    </p>

                    <div className="space-y-3 mb-6">
                      {['Free to use', 'No credit card required', 'Setup in 5 minutes'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {item}
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(siteConfig.appUrl)}&service=team`}
                      className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                    >
                      <Users className="w-5 h-5" />
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
