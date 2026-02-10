import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, Search, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateItemListSchema, generateWebPageSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Cricket Grounds Directory - Find Grounds Near You',
  description: 'Discover cricket grounds across India. Read reviews, check amenities, and find the perfect ground for your next match. Community-driven cricket ground directory.',
  keywords: [
    'cricket grounds near me',
    'cricket grounds india',
    'cricket ground booking',
    'cricket practice grounds',
    'cricket stadium',
    'find cricket ground',
  ],
  alternates: {
    canonical: `${siteConfig.url}/grounds`,
  },
  openGraph: {
    title: 'Cricket Grounds Directory - Find Grounds Near You | CricSmart',
    description: 'Discover and review cricket grounds across India. Find the perfect venue for your next match.',
    url: `${siteConfig.url}/grounds`,
    type: 'website',
  },
};

// Sample grounds data - In production, this would come from API
const sampleGrounds = [
  {
    id: '1',
    name: 'Wankhede Stadium',
    slug: 'wankhede-stadium-mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    rating: 4.8,
    reviewCount: 245,
    amenities: ['Floodlights', 'Practice Nets', 'Pavilion', 'Parking'],
    image: '/grounds/wankhede.jpg',
  },
  {
    id: '2',
    name: 'M. Chinnaswamy Stadium',
    slug: 'chinnaswamy-stadium-bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    rating: 4.7,
    reviewCount: 189,
    amenities: ['Floodlights', 'Practice Nets', 'Gym'],
    image: '/grounds/chinnaswamy.jpg',
  },
  {
    id: '3',
    name: 'Eden Gardens',
    slug: 'eden-gardens-kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    rating: 4.9,
    reviewCount: 312,
    amenities: ['Floodlights', 'Practice Nets', 'Museum', 'Pavilion'],
    image: '/grounds/eden.jpg',
  },
  {
    id: '4',
    name: 'Arun Jaitley Stadium',
    slug: 'arun-jaitley-stadium-delhi',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.6,
    reviewCount: 156,
    amenities: ['Floodlights', 'Practice Nets', 'Parking'],
    image: '/grounds/feroz-shah.jpg',
  },
  {
    id: '5',
    name: 'MA Chidambaram Stadium',
    slug: 'chepauk-stadium-chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    rating: 4.7,
    reviewCount: 201,
    amenities: ['Floodlights', 'Practice Nets', 'Pavilion'],
    image: '/grounds/chepauk.jpg',
  },
  {
    id: '6',
    name: 'Rajiv Gandhi Intl Stadium',
    slug: 'rajiv-gandhi-stadium-hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    rating: 4.5,
    reviewCount: 134,
    amenities: ['Floodlights', 'Practice Nets', 'Parking', 'Gym'],
    image: '/grounds/uppal.jpg',
  },
];

const popularCities = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
];

export default function GroundsPage() {
  // Generate ItemList schema
  const itemListSchema = generateItemListSchema(
    sampleGrounds.map((ground, index) => ({
      name: ground.name,
      url: `${siteConfig.url}/grounds/${ground.slug}`,
      position: index + 1,
    })),
    'Cricket Grounds Directory'
  );

  const webPageSchema = generateWebPageSchema({
    name: 'Cricket Grounds Directory - Find Grounds Near You',
    description: 'Discover cricket grounds across India. Read reviews, check amenities, and find the perfect ground for your next match.',
    url: `${siteConfig.url}/grounds`,
    breadcrumb: [{ name: 'Grounds', url: `${siteConfig.url}/grounds` }],
  });

  return (
    <>
      <SchemaScript schema={[itemListSchema, webPageSchema]} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs items={[{ name: 'Grounds', href: '/grounds' }]} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            <span>Cricket Grounds</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Cricket Grounds Directory
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover cricket grounds across India. Read reviews, check amenities, 
            and find the perfect venue for your next match.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grounds by name or city..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Popular Cities */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Popular Cities</h2>
          <div className="flex flex-wrap gap-3">
            {popularCities.map((city) => (
              <Link
                key={city}
                href={`/grounds?city=${city.toLowerCase()}`}
                className="px-4 py-2 bg-slate-800 border border-white/10 rounded-full text-slate-300 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>

        {/* Grounds Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sampleGrounds.map((ground) => (
            <Link
              key={ground.id}
              href={`/grounds/${ground.slug}`}
              className="card overflow-hidden hover:border-primary-500/50 transition-all duration-300 group"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-slate-600" />
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  {ground.name}
                </h3>
                <p className="text-slate-400 text-sm mb-3">
                  {ground.city}, {ground.state}
                </p>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-medium">{ground.rating}</span>
                  </div>
                  <span className="text-slate-500 text-sm">
                    ({ground.reviewCount} reviews)
                  </span>
                </div>
                
                {/* Amenities */}
                <div className="flex flex-wrap gap-2">
                  {ground.amenities.slice(0, 3).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {ground.amenities.length > 3 && (
                    <span className="px-2 py-1 text-slate-500 text-xs">
                      +{ground.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mb-16">
          <button className="btn-secondary">
            Load More Grounds
          </button>
        </div>

        {/* SEO Content */}
        <section className="card p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            About Cricket Grounds in India
          </h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              India has thousands of cricket grounds ranging from international stadiums 
              to local practice facilities. Our directory helps cricket enthusiasts 
              discover and review grounds in their area.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">
              Finding the Right Ground
            </h3>
            <p className="text-slate-300">
              When choosing a cricket ground, consider factors like:
            </p>
            <ul className="text-slate-300 space-y-2">
              <li><strong>Amenities:</strong> Floodlights for evening matches, practice nets for warm-ups</li>
              <li><strong>Surface:</strong> Grass pitch, turf wicket, or artificial surface</li>
              <li><strong>Location:</strong> Accessibility and parking availability</li>
              <li><strong>Facilities:</strong> Changing rooms, pavilion, refreshments</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">
              Community Reviews
            </h3>
            <p className="text-slate-300">
              Our reviews come from real cricket players and teams who have played 
              at these venues. Share your experience to help others find great grounds.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Know a Great Cricket Ground?
          </h2>
          <p className="text-slate-400 mb-6">
            Help fellow cricket enthusiasts by adding grounds and sharing reviews.
          </p>
          <Link href={siteConfig.appUrl} className="btn-primary inline-flex items-center gap-2">
            Add a Ground
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
