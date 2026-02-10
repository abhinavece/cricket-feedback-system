import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, Clock, Car, Wifi, Zap, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaScript from '@/components/SchemaScript';
import { generateGroundSchema, generateFAQSchema } from '@/lib/schema';
import { siteConfig } from '@/lib/api';

interface Props {
  params: Promise<{ slug: string }>;
}

// Sample ground data - In production, fetch from API
const sampleGround = {
  _id: '1',
  name: 'Wankhede Stadium',
  slug: 'wankhede-stadium-mumbai',
  location: 'Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  address: 'D Road, Churchgate, Mumbai, Maharashtra 400020',
  coordinates: {
    lat: 18.9388,
    lng: 72.8258,
  },
  amenities: ['Floodlights', 'Practice Nets', 'Pavilion', 'Parking', 'Canteen', 'Changing Rooms'],
  description: 'Wankhede Stadium is a premier cricket stadium in Mumbai, Maharashtra, India. It has a seating capacity of 33,000 and is home to the Mumbai Indians IPL team. The stadium has hosted numerous international matches including the 2011 Cricket World Cup Final.',
  images: ['/grounds/wankhede-1.jpg', '/grounds/wankhede-2.jpg'],
  averageRating: 4.8,
  reviewCount: 245,
  isPublic: true,
  createdAt: '2024-01-15',
  updatedAt: '2024-06-20',
};

const sampleReviews = [
  {
    _id: 'r1',
    groundId: '1',
    userId: 'u1',
    reviewerName: 'Rahul S.',
    rating: 5,
    comment: 'Amazing stadium with excellent facilities. The pitch is well-maintained and the floodlights are top-notch for evening matches.',
    createdAt: '2024-05-15',
  },
  {
    _id: 'r2',
    groundId: '1',
    userId: 'u2',
    reviewerName: 'Priya M.',
    rating: 4,
    comment: 'Great atmosphere for cricket. Parking can be challenging on match days but overall a fantastic venue.',
    createdAt: '2024-04-22',
  },
  {
    _id: 'r3',
    groundId: '1',
    userId: 'u3',
    reviewerName: 'Amit K.',
    rating: 5,
    comment: 'One of the best cricket stadiums in India. The practice nets are excellent for warm-ups.',
    createdAt: '2024-03-10',
  },
];

// For static generation - In production, fetch from API
export async function generateStaticParams() {
  return [
    { slug: 'wankhede-stadium-mumbai' },
    { slug: 'chinnaswamy-stadium-bangalore' },
    { slug: 'eden-gardens-kolkata' },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  // In production, fetch ground data by slug
  const ground = sampleGround;

  return {
    title: `${ground.name} - Cricket Ground in ${ground.city}`,
    description: `${ground.name} is a cricket ground in ${ground.city}, ${ground.state}. ${ground.description.slice(0, 150)}...`,
    keywords: [
      ground.name.toLowerCase(),
      `cricket ground ${ground.city.toLowerCase()}`,
      `${ground.city.toLowerCase()} cricket stadium`,
      'cricket ground near me',
      `${ground.city.toLowerCase()} cricket`,
    ],
    alternates: {
      canonical: `${siteConfig.url}/grounds/${ground.slug}`,
    },
    openGraph: {
      title: `${ground.name} - Cricket Ground | CricSmart`,
      description: ground.description.slice(0, 200),
      url: `${siteConfig.url}/grounds/${ground.slug}`,
      type: 'website',
    },
  };
}

export default async function GroundDetailPage({ params }: Props) {
  const resolvedParams = await params;
  // In production, fetch ground data by slug
  const ground = sampleGround;
  const reviews = sampleReviews;

  // Generate schemas
  const groundSchema = generateGroundSchema(ground, reviews);
  const faqSchema = generateFAQSchema([
    {
      id: 'location',
      question: `Where is ${ground.name} located?`,
      answer: `${ground.name} is located at ${ground.address}. It is in ${ground.city}, ${ground.state}.`,
      category: 'location',
    },
    {
      id: 'amenities',
      question: `What amenities does ${ground.name} have?`,
      answer: `${ground.name} offers: ${ground.amenities.join(', ')}.`,
      category: 'amenities',
    },
  ]);

  const amenityIcons: Record<string, React.ReactNode> = {
    'Floodlights': <Zap className="w-4 h-4" />,
    'Parking': <Car className="w-4 h-4" />,
    'Practice Nets': <Users className="w-4 h-4" />,
    'WiFi': <Wifi className="w-4 h-4" />,
  };

  return (
    <>
      <SchemaScript schema={[groundSchema, faqSchema]} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs
          items={[
            { name: 'Grounds', href: '/grounds' },
            { name: ground.name, href: `/grounds/${ground.slug}` },
          ]}
        />

        {/* Back Link */}
        <Link
          href="/grounds"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-primary-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grounds
        </Link>

        {/* Header */}
        <div className="card p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {ground.name}
              </h1>
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{ground.city}, {ground.state}</span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 font-bold">{ground.averageRating}</span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    {ground.reviewCount} reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href={siteConfig.appUrl}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </Link>
              <Link
                href={siteConfig.appUrl}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                Write Review
              </Link>
            </div>
          </div>
        </div>

        {/* Image Gallery Placeholder */}
        <div className="card overflow-hidden mb-8">
          <div className="h-64 sm:h-80 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">Ground Image</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">About</h2>
          <p className="text-slate-300 leading-relaxed">
            {ground.description}
          </p>
        </div>

        {/* Amenities */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Amenities</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ground.amenities.map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400">
                  {amenityIcons[amenity] || <Zap className="w-4 h-4" />}
                </div>
                <span className="text-slate-300">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Location</h2>
          <p className="text-slate-300 mb-4">{ground.address}</p>
          
          {/* Map Placeholder */}
          <div className="h-48 bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Map View</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="card p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Reviews</h2>
            <Link
              href={siteConfig.appUrl}
              className="text-primary-400 text-sm hover:underline"
            >
              Write a Review
            </Link>
          </div>

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 font-medium">
                      {review.reviewerName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-white">{review.reviewerName}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-500 text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-300">{review.comment}</p>
              </div>
            ))}
          </div>

          <Link
            href={siteConfig.appUrl}
            className="block text-center mt-6 text-primary-400 hover:underline"
          >
            View all {ground.reviewCount} reviews
          </Link>
        </div>

        {/* FAQ */}
        <div className="card p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-white mb-2">Where is {ground.name} located?</h3>
              <p className="text-slate-400">{ground.address}</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">What amenities does {ground.name} have?</h3>
              <p className="text-slate-400">{ground.amenities.join(', ')}.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">How do I book {ground.name}?</h3>
              <p className="text-slate-400">
                You can book this ground through CricSmart or contact the venue directly.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Planning a Match at {ground.name}?
          </h2>
          <p className="text-slate-400 mb-6">
            Use CricSmart to organize your match, track player availability, and manage your team.
          </p>
          <Link href={siteConfig.appUrl} className="btn-primary inline-flex items-center gap-2">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
