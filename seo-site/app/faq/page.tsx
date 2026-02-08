import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import { faqCategories, faqs, getFAQsByCategory } from '@/lib/faq-data';

export const metadata: Metadata = {
  title: 'Cricket FAQ - Common Questions Answered',
  description: 'Get answers to common cricket questions. Learn about cricket rules, scoring, formats, equipment, and more. Perfect for beginners and enthusiasts.',
  keywords: [
    'cricket faq',
    'cricket questions',
    'cricket rules explained',
    'how many players in cricket',
    'what is lbw',
    'cricket for beginners',
  ],
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  openGraph: {
    title: 'Cricket FAQ - Common Questions Answered | CricSmart',
    description: 'Answers to common cricket questions about rules, scoring, formats, and equipment.',
    url: `${siteConfig.url}/faq`,
    type: 'website',
  },
};

export default function FAQPage() {
  // Generate FAQ schema for all questions
  const allFAQSchema = generateFAQSchema(faqs);

  return (
    <>
      <SchemaScript schema={allFAQSchema} />
      
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={[{ name: 'FAQ', href: '/faq' }]} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Cricket FAQ
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Answers to common cricket questions. Perfect for beginners 
            and anyone looking to understand the game better.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {faqCategories.map((category) => {
            const categoryFAQs = getFAQsByCategory(category.slug);
            return (
              <Link
                key={category.id}
                href={`/faq/${category.slug}`}
                className="card p-6 hover:border-primary-500/50 transition-colors group"
              >
                <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h2>
                <p className="text-slate-400 text-sm mb-3">{category.description}</p>
                <span className="text-primary-400 text-sm flex items-center gap-1">
                  {categoryFAQs.length} questions
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Popular Questions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Questions</h2>
          <div className="space-y-4">
            {faqs.slice(0, 8).map((faq) => (
              <details
                key={faq.id}
                className="card p-4 group"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="font-medium text-white group-open:text-primary-400 transition-colors pr-4">
                    {faq.question}
                  </h3>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* All Questions by Category */}
        {faqCategories.map((category) => {
          const categoryFAQs = getFAQsByCategory(category.slug);
          return (
            <section key={category.id} className="mb-12" id={category.slug}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                <Link
                  href={`/faq/${category.slug}`}
                  className="text-primary-400 text-sm flex items-center gap-1 hover:underline"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {categoryFAQs.slice(0, 3).map((faq) => (
                  <details
                    key={faq.id}
                    className="card p-4 group"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="font-medium text-white group-open:text-primary-400 transition-colors pr-4">
                        {faq.question}
                      </h3>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <p className="mt-4 text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-slate-400 mb-6">
            Check out our comprehensive cricket glossary for more cricket terms 
            and definitions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/glossary" className="btn-primary inline-flex items-center gap-2">
              Browse Glossary
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tools" className="btn-secondary inline-flex items-center gap-2">
              Try Our Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
