import Link from 'next/link';
import { Gavel, ExternalLink } from 'lucide-react';
import { siteConfig } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">CricSmart</div>
                <div className="text-[9px] text-amber-400 tracking-wider uppercase">Auctions</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              IPL-style cricket player auctions. Real-time bidding, smart management, and spectator mode.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2.5">
              <li><Link href="/explore" className="text-sm text-slate-400 hover:text-amber-400 transition-colors">Explore Auctions</Link></li>
              <li><Link href="/admin" className="text-sm text-slate-400 hover:text-amber-400 transition-colors">Create Auction</Link></li>
            </ul>
          </div>

          {/* CricSmart */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">CricSmart</h3>
            <ul className="space-y-2.5">
              <li>
                <a href={siteConfig.seoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                  Home <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href={siteConfig.appUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                  Team Management <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li><a href={`${siteConfig.seoUrl}/privacy`} className="text-sm text-slate-400 hover:text-amber-400 transition-colors">Privacy</a></li>
              <li><a href={`${siteConfig.seoUrl}/terms`} className="text-sm text-slate-400 hover:text-amber-400 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} CricSmart. All rights reserved.</p>
          <p className="text-xs text-slate-600">Powered by CricSmart AI</p>
        </div>
      </div>
    </footer>
  );
}
