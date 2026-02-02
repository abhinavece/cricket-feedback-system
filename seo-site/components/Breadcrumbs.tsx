import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import SchemaScript from './SchemaScript';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Add home as first item
  const allItems = [{ name: 'Home', href: '/' }, ...items];
  
  // Generate schema data
  const schemaItems = allItems.map((item) => ({
    name: item.name,
    url: `${siteConfig.url}${item.href}`,
  }));

  return (
    <>
      <SchemaScript schema={generateBreadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
          {allItems.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-slate-600" />
              )}
              {index === allItems.length - 1 ? (
                <span className="text-slate-300 font-medium">{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home className="w-3.5 h-3.5" />}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
