import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Search, Trophy, Target } from 'lucide-react';
import { getDomainType, getHomepageUrl, getAppUrl } from '../utils/domain';

const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const domainType = getDomainType();
  
  // Determine where to link back to
  const homeLink = domainType === 'homepage' ? '/' : '/app';
  const homeLinkText = domainType === 'homepage' ? 'Go to Homepage' : 'Go to Dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Cricket pitch lines */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] border-2 border-emerald-500/10 rounded-full rotate-12" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[150px] border-2 border-emerald-500/5 rounded-full -rotate-6" />
        
        {/* Floating cricket balls */}
        <div className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-32 left-40 w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg w-full text-center">
        {/* 404 Display with cricket theme */}
        <div className="relative mb-8">
          {/* Large 404 */}
          <div className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-800 leading-none select-none">
            404
          </div>
          
          {/* Cricket stumps overlay */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-end gap-2">
            {/* Three stumps */}
            <div className="w-2 h-24 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm shadow-lg" />
            <div className="w-2 h-28 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm shadow-lg" />
            <div className="w-2 h-24 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm shadow-lg" />
            {/* Bails */}
            <div className="absolute -top-1 left-0 w-4 h-1.5 bg-amber-300 rounded-full transform -rotate-12 shadow" />
            <div className="absolute -top-1 right-0 w-4 h-1.5 bg-amber-300 rounded-full transform rotate-12 shadow" />
          </div>

          {/* Flying ball animation */}
          <div className="absolute top-8 right-4 sm:right-12 animate-pulse">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg shadow-red-500/30 relative">
              <div className="absolute inset-1 border border-dashed border-white/30 rounded-full" />
            </div>
            {/* Motion trail */}
            <div className="absolute top-1/2 -left-8 w-8 h-0.5 bg-gradient-to-r from-transparent to-red-500/50 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Message */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Bowled Out!</h1>
          </div>
          
          <p className="text-slate-400 mb-2">
            Looks like this delivery went wide of the stumps.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Attempted URL */}
          <div className="bg-slate-800/50 rounded-xl p-3 mb-6 border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Search className="w-4 h-4" />
              <span className="truncate font-mono">{location.pathname}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={homeLink}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Home className="w-5 h-5" />
              {homeLinkText}
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-medium rounded-xl transition-all border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>

        {/* Fun cricket fact */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 rounded-full border border-white/5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-500 text-sm">
              Even the best batsmen get out sometimes!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
