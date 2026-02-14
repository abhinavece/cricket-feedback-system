import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight, Brain, Users } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateItemListSchema, generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import { glossaryTerms, getAllCategories, getCategoryDisplayName, getTermsByCategory } from '@/lib/glossary-data';

export const metadata: Metadata = {
  title: 'Cricket Glossary - 100+ Cricket Terms Explained',
  description: 'Comprehensive cricket glossary with 100+ terms explained. Learn what yorker, googly, LBW, powerplay, and other cricket terms mean. Perfect for beginners and enthusiasts.',
  keywords: [
    'cricket glossary',
    'cricket terms',
    'cricket dictionary',
    'what is yorker',
    'what is googly',
    'cricket terminology',
    'cricket words meaning',
    'cricket definitions',
  ],
  alternates: {
    canonical: `${siteConfig.url}/glossary`,
  },
  openGraph: {
    title: 'Cricket Glossary - 100+ Cricket Terms Explained | CricSmart',
    description: 'Learn cricket terminology with our comprehensive glossary. 100+ terms from yorker to googly, all explained in simple language.',
    url: `${siteConfig.url}/glossary`,
    type: 'website',
  },
};

export default function GlossaryPage() {
  const categories = getAllCategories();
  
  const itemListSchema = generateItemListSchema(
    glossaryTerms.slice(0, 50).map((term, index) => ({
      name: term.term,
      url: `${siteConfig.url}/glossary/${term.slug}`,
      position: index + 1,
    })),
    'Cricket Glossary - Cricket Terms A-Z'
  );

  const webPageSchema = generateWebPageSchema({
    name: 'Cricket Glossary - 100+ Cricket Terms Explained',
    description: 'Comprehensive cricket glossary with 100+ terms explained. Learn what yorker, googly, LBW, powerplay, and other cricket terms mean.',
    url: `${siteConfig.url}/glossary`,
    breadcrumb: [{ name: 'Glossary', url: `${siteConfig.url}/glossary` }],
  });

  // Group terms alphabetically
  const alphabeticalTerms = glossaryTerms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(term);
    return acc;
  }, {} as Record<string, typeof glossaryTerms>);

  const alphabet = Object.keys(alphabeticalTerms).sort();

  return (
    <>
      <SchemaScript schema={[itemListSchema, webPageSchema]} />
      
      <div>
        {/* Header */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900" />
          
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <Breadcrumbs items={[{ name: 'Glossary', href: '/glossary' }]} />

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium">{glossaryTerms.length}+ Terms</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Cricket Glossary
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                The complete dictionary of cricket terms. From batting to bowling, 
                fielding to match formats.
              </p>
            </div>
          </div>
        </section>

        {/* Alphabet Navigation */}
        <section className="py-6 relative sticky top-16 sm:top-20 z-20">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md border-b border-white/5" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-1.5">
              {alphabet.map((letter) => (
                <a
                  key={letter}
                  href={`#${letter}`}
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors text-sm font-medium"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 relative">
          <div className="absolute inset-0 bg-slate-900" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => {
                const terms = getTermsByCategory(category);
                return (
                  <a
                    key={category}
                    href={`#category-${category}`}
                    className="card p-4 hover:border-emerald-500/30 transition-colors group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm">
                      {getCategoryDisplayName(category)}
                    </h3>
                    <p className="text-slate-500 text-xs">{terms.length} terms</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Alphabetical Listing */}
        <section className="py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="space-y-12">
              {alphabet.map((letter) => (
                <div key={letter} id={letter}>
                  <h2 className="text-3xl font-black text-gradient mb-6 pb-2 border-b border-white/10">
                    {letter}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alphabeticalTerms[letter].map((term) => (
                      <Link
                        key={term.slug}
                        href={`/glossary/${term.slug}`}
                        className="card p-4 hover:border-emerald-500/30 transition-colors group"
                      >
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors mb-1">
                          {term.term}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {term.definition}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
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
                Organize Your Cricket Team
              </h2>
              <p className="text-slate-400 mb-6">
                CricSmart helps cricket teams manage matches, track availability, 
                and handle payments with AI-powered features.
              </p>
              <Link href={siteConfig.appUrl} className="btn-primary inline-flex">
                <Users className="w-5 h-5" />
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
