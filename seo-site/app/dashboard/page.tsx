'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Gavel,
  ChevronRight,
  Loader2,
  LogOut,
  Sparkles,
  ExternalLink,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import { siteConfig } from '@/lib/api';

interface UserData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ProductCounts {
  teams: number;
  tournaments: number;
  auctions: number;
  organizations: { _id: string; name: string; slug: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cricsmart.in';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [products, setProducts] = useState<ProductCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (!token || !storedUser) {
      router.replace('/auth/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.replace('/auth/login');
      return;
    }

    setLoading(false);

    // Fetch product counts
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProducts(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const productCards = [
    {
      key: 'team',
      title: 'Team Manager',
      description: 'Manage your cricket team — availability, payments, WhatsApp automation, match scheduling',
      icon: Users,
      gradient: 'from-emerald-500 to-cyan-500',
      bgGlow: 'bg-emerald-500/10',
      borderHover: 'hover:border-emerald-500/30',
      count: products?.teams ?? null,
      countLabel: 'teams',
      url: siteConfig.appUrl,
      ctaText: products && products.teams > 0 ? 'Open Dashboard' : 'Get Started',
    },
    {
      key: 'tournament',
      title: 'Tournament Hub',
      description: 'Organize tournaments — player registration, franchise management, analytics & reporting',
      icon: Trophy,
      gradient: 'from-violet-500 to-purple-500',
      bgGlow: 'bg-violet-500/10',
      borderHover: 'hover:border-violet-500/30',
      count: products?.tournaments ?? null,
      countLabel: 'tournaments',
      url: siteConfig.tournamentUrl,
      ctaText: products && products.tournaments > 0 ? 'Open Hub' : 'Get Started',
    },
    {
      key: 'auction',
      title: 'Cricket Auction',
      description: 'IPL-style player auctions — live bidding, team management, broadcast view, analytics',
      icon: Gavel,
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/10',
      borderHover: 'hover:border-amber-500/30',
      count: products?.auctions ?? null,
      countLabel: 'auctions',
      url: siteConfig.auctionUrl,
      ctaText: products && products.auctions > 0 ? 'Open Auctions' : 'Get Started',
    },
  ];

  return (
    <div className="min-h-[80vh] px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm ml-[52px]">
              Access all your CricSmart products from one place
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all self-start"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {productCards.map((product) => {
            const Icon = product.icon;
            return (
              <a
                key={product.key}
                href={product.url}
                className={`group relative bg-slate-900/60 backdrop-blur-sm border border-white/5 ${product.borderHover} rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${product.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title + Description */}
                <h2 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  {product.title}
                </h2>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {product.description}
                </p>

                {/* Count badge */}
                {productsLoading ? (
                  <div className="h-6 w-20 bg-slate-800/50 rounded-full animate-pulse mb-4" />
                ) : product.count !== null && product.count > 0 ? (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${product.gradient} bg-opacity-10 rounded-full mb-4`}
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <Sparkles className="w-3 h-3 text-white/70" />
                    <span className="text-xs font-medium text-white/80">
                      {product.count} {product.countLabel}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-slate-700/30 rounded-full mb-4">
                    <Plus className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">No {product.countLabel} yet</span>
                  </div>
                )}

                {/* CTA */}
                <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${product.gradient} bg-clip-text text-transparent`}>
                  {product.ctaText}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
