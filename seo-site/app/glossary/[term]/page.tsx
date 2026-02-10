import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Tag } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateDefinedTermSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import { 
  getTermBySlug, 
  glossaryTerms, 
  getCategoryDisplayName,
  getTermsByCategory,
  getAllTermSlugs 
} from '@/lib/glossary-data';

interface Props {
  params: Promise<{ term: string }>;
}

// Generate static params for all terms
export async function generateStaticParams() {
  return getAllTermSlugs().map((slug) => ({ term: slug }));
}

// Generate metadata for each term
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const term = getTermBySlug(resolvedParams.term);
  
  if (!term) {
    return {
      title: 'Term Not Found',
    };
  }

  return {
    title: `${term.term} - Cricket Term Definition & Meaning`,
    description: term.definition,
    keywords: [
      term.term.toLowerCase(),
      `what is ${term.term.toLowerCase()}`,
      `${term.term.toLowerCase()} meaning`,
      `${term.term.toLowerCase()} in cricket`,
      `${term.term.toLowerCase()} cricket definition`,
      'cricket terminology',
      'cricket glossary',
    ],
    alternates: {
      canonical: `${siteConfig.url}/glossary/${term.slug}`,
    },
    openGraph: {
      title: `${term.term} - What Does It Mean in Cricket?`,
      description: term.definition,
      url: `${siteConfig.url}/glossary/${term.slug}`,
      type: 'article',
    },
  };
}

export default async function TermPage({ params }: Props) {
  const resolvedParams = await params;
  const term = getTermBySlug(resolvedParams.term);
  
  if (!term) {
    notFound();
  }

  // Get related terms
  const relatedTerms = term.relatedTerms
    ?.map((relatedSlug) => {
      const normalized = relatedSlug.toLowerCase().replace(/\s+/g, '-');
      return glossaryTerms.find(
        (t) => t.slug === normalized || t.term.toLowerCase() === relatedSlug.toLowerCase()
      );
    })
    .filter(Boolean) || [];

  // Get other terms in same category
  const categoryTerms = getTermsByCategory(term.category)
    .filter((t) => t.slug !== term.slug)
    .slice(0, 6);

  // Get previous and next terms for navigation
  const currentIndex = glossaryTerms.findIndex((t) => t.slug === term.slug);
  const prevTerm = currentIndex > 0 ? glossaryTerms[currentIndex - 1] : null;
  const nextTerm = currentIndex < glossaryTerms.length - 1 ? glossaryTerms[currentIndex + 1] : null;

  // Generate schemas
  const definedTermSchema = generateDefinedTermSchema(term);
  
  // Generate FAQ schema for this term
  const faqSchema = generateFAQSchema([
    {
      id: `what-is-${term.slug}`,
      question: `What is ${term.term} in cricket?`,
      answer: term.definition,
      category: 'definition',
    },
    ...(term.example
      ? [
          {
            id: `example-${term.slug}`,
            question: `Can you give an example of ${term.term}?`,
            answer: term.example,
            category: 'example',
          },
        ]
      : []),
  ]);

  return (
    <>
      <SchemaScript schema={[definedTermSchema, faqSchema]} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Glossary', href: '/glossary' },
            { name: term.term, href: `/glossary/${term.slug}` },
          ]}
        />

        {/* Main Content */}
        <article className="card p-8 mb-8">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm">
              <Tag className="w-3 h-3" />
              {getCategoryDisplayName(term.category)}
            </span>
          </div>

          {/* Term Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {term.term}
          </h1>

          {/* Definition */}
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-slate-300 leading-relaxed">
              {term.definition}
            </p>

            {/* Example */}
            {term.example && (
              <div className="mt-6 p-4 bg-slate-800/50 border-l-4 border-primary-500 rounded-r-lg">
                <p className="text-sm text-slate-400 mb-1 font-medium">Example:</p>
                <p className="text-slate-300 italic">&quot;{term.example}&quot;</p>
              </div>
            )}
          </div>

          {/* FAQ Section for SEO */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white mb-2">
                  What is {term.term} in cricket?
                </h3>
                <p className="text-slate-400">{term.definition}</p>
              </div>
              {term.example && (
                <div>
                  <h3 className="font-medium text-white mb-2">
                    Can you give an example of {term.term}?
                  </h3>
                  <p className="text-slate-400">{term.example}</p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Related Terms */}
        {relatedTerms.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              Related Terms
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedTerms.map((related) => (
                related && (
                  <Link
                    key={related.slug}
                    href={`/glossary/${related.slug}`}
                    className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
                  >
                    {related.term}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}

        {/* More from Category */}
        {categoryTerms.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              More {getCategoryDisplayName(term.category)}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {categoryTerms.map((catTerm) => (
                <Link
                  key={catTerm.slug}
                  href={`/glossary/${catTerm.slug}`}
                  className="p-3 bg-slate-800/50 border border-white/10 rounded-lg hover:border-primary-500/50 transition-colors group"
                >
                  <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                    {catTerm.term}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-1">
                    {catTerm.definition}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevTerm ? (
            <Link
              href={`/glossary/${prevTerm.slug}`}
              className="flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{prevTerm.term}</span>
            </Link>
          ) : (
            <div />
          )}
          
          <Link
            href="/glossary"
            className="btn-secondary text-sm"
          >
            Back to Glossary
          </Link>
          
          {nextTerm ? (
            <Link
              href={`/glossary/${nextTerm.slug}`}
              className="flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors"
            >
              <span>{nextTerm.term}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Want to Learn More Cricket Terms?
          </h2>
          <p className="text-slate-400 mb-6">
            Explore our complete glossary with 100+ cricket terms explained.
          </p>
          <Link href="/glossary" className="btn-primary inline-flex items-center gap-2">
            Browse Full Glossary
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
