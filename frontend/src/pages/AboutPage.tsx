import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  Trophy, 
  Calendar, 
  Mail, 
  Phone,
  ArrowLeft,
  Instagram,
  Globe,
  Target,
  Heart,
  Zap
} from 'lucide-react';
import Footer from '../components/Footer';

// Placeholder team members - can be replaced with actual data later
const TEAM_MEMBERS = [
  { name: 'Captain', role: 'Captain & All-rounder', initials: 'CP' },
  { name: 'Vice Captain', role: 'Vice Captain & Batsman', initials: 'VC' },
  { name: 'Player 1', role: 'Opening Batsman', initials: 'P1' },
  { name: 'Player 2', role: 'Middle Order', initials: 'P2' },
  { name: 'Player 3', role: 'Wicket Keeper', initials: 'P3' },
  { name: 'Player 4', role: 'Fast Bowler', initials: 'P4' },
  { name: 'Player 5', role: 'Spin Bowler', initials: 'P5' },
  { name: 'Player 6', role: 'All-rounder', initials: 'P6' },
];

const TEAM_STATS = [
  { label: 'Matches Played', value: '100+', icon: Calendar },
  { label: 'Team Members', value: '25+', icon: Users },
  { label: 'Victories', value: '60+', icon: Trophy },
];

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <span className="text-3xl font-black text-white">M</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Mavericks XI</h1>
              <p className="text-emerald-400 font-medium mt-1">Cricket Club • Est. 2024</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* About Section */}
        <section>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-400" />
                </div>
                Our Story
              </h2>
              <div className="space-y-4 text-slate-300">
                <p>
                  Mavericks XI is a passionate cricket team based in Noida, bringing together cricket enthusiasts 
                  who share a love for the game. Founded in 2024, we've grown from a group of friends playing 
                  weekend matches to a competitive team participating in local tournaments.
                </p>
                <p>
                  Our philosophy is simple: play hard, play fair, and have fun. We believe cricket is more than 
                  just a sport—it's about building friendships, staying fit, and creating memories that last 
                  a lifetime.
                </p>
                <p>
                  Whether it's a friendly weekend match or a competitive tournament, Mavericks XI brings 
                  energy, sportsmanship, and a winning attitude to every game.
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              {TEAM_STATS.map((stat) => (
                <div 
                  key={stat.label}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            Our Values
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Sportsmanship',
                description: 'We play fair, respect opponents, and uphold the spirit of cricket in every match.',
                icon: Trophy,
                color: 'emerald'
              },
              {
                title: 'Team Spirit',
                description: 'Together we win, together we learn. Every player is valued and supported.',
                icon: Users,
                color: 'teal'
              },
              {
                title: 'Passion',
                description: 'Cricket is our passion. We bring energy and enthusiasm to every game we play.',
                icon: Zap,
                color: 'amber'
              }
            ].map((value) => (
              <div 
                key={value.title}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all"
              >
                <div className={`w-12 h-12 bg-${value.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                  <value.icon className={`w-6 h-6 text-${value.color}-400`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Members Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            Meet the Team
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {TEAM_MEMBERS.map((member, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-lg font-bold text-emerald-400">{member.initials}</span>
                </div>
                <h3 className="font-bold text-white text-sm">{member.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-slate-500 text-sm mt-6 italic">
            Player profiles coming soon...
          </p>
        </section>

        {/* Location & Contact Section */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Location */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Our Location
            </h3>
            <div className="space-y-3">
              <p className="text-slate-300">
                Sector 45<br />
                Noida, Uttar Pradesh<br />
                201303, India
              </p>
              <p className="text-slate-400 text-sm">
                We primarily play at various cricket grounds across Noida and Greater Noida.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Get in Touch
            </h3>
            <div className="space-y-3">
              <a 
                href="mailto:singh09.abhinav@gmail.com" 
                className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                singh09.abhinav@gmail.com
              </a>
              <a 
                href="tel:+918087102325" 
                className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +91 80871 02325
              </a>
              <div className="flex gap-3 pt-2">
                <a 
                  href="https://www.instagram.com/_mavericks_xi/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/20 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://mavericks11.duckdns.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-3xl p-8 border border-emerald-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Want to Join the Team?</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              We're always looking for passionate cricketers. Reach out to us if you'd like to be part of Mavericks XI!
            </p>
            <a
              href="mailto:singh09.abhinav@gmail.com?subject=Interested in Joining Mavericks XI"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
