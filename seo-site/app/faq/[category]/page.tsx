import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';
import { faqCategories, getFAQsByCategory, getCategoryBySlug } from '@/lib/faq-data';

interface Props {
  params: Promise<{ category: string }>;
}

// Generate static params for all categories
export async function generateStaticParams() {
  return faqCategories.map((cat) => ({ category: cat.slug }));
}

// Generate metadata for each category
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const category = getCategoryBySlug(resolvedParams.category);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - Cricket FAQ`,
    description: `${category.description} Get answers to common questions about ${category.name.toLowerCase()}.`,
    keywords: [
      `cricket ${category.slug}`,
      `cricket ${category.slug} questions`,
      `cricket ${category.slug} faq`,
      'cricket faq',
      'cricket help',
    ],
    alternates: {
      canonical: `${siteConfig.url}/faq/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} - Cricket FAQ | CricSmart`,
      description: category.description,
      url: `${siteConfig.url}/faq/${category.slug}`,
      type: 'website',
    },
  };
}

export default async function FAQCategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const category = getCategoryBySlug(resolvedParams.category);
  
  if (!category) {
    notFound();
  }

  const categoryFAQs = getFAQsByCategory(category.slug);
  const faqSchema = generateFAQSchema(categoryFAQs);

  // Get other categories for navigation
  const otherCategories = faqCategories.filter((cat) => cat.slug !== category.slug);

  return (
    <>
      <SchemaScript schema={faqSchema} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'FAQ', href: '/faq' },
            { name: category.name, href: `/faq/${category.slug}` },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to FAQ
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {category.name}
              </h1>
              <p className="text-slate-400">{categoryFAQs.length} questions</p>
            </div>
          </div>
          <p className="text-slate-300">{category.description}</p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-12">
          {categoryFAQs.map((faq, index) => (
            <details
              key={faq.id}
              className="card p-5 group"
              open={index === 0}
            >
              <summary className="flex items-start justify-between cursor-pointer list-none">
                <h2 className="font-medium text-white group-open:text-primary-400 transition-colors pr-4 text-lg">
                  {faq.question}
                </h2>
                <span className="text-slate-400 group-open:rotate-180 transition-transform mt-1 flex-shrink-0">
                  ▼
                </span>
              </summary>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* Other Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Other Categories</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/faq/${cat.slug}`}
                className="card p-4 hover:border-primary-500/50 transition-colors group"
              >
                <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-slate-400 text-sm">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Related Links */}
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-4">
            Learn More About Cricket
          </h2>
          <p className="text-slate-400 mb-6">
            Explore our glossary and tools for more cricket resources.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/glossary" className="btn-primary inline-flex items-center gap-2">
              Cricket Glossary
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tools" className="btn-secondary inline-flex items-center gap-2">
              Cricket Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
