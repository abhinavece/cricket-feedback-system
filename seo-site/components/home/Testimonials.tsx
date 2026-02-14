'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  team: string;
  location: string;
  avatar: string;
  content: string;
  rating: number;
  highlight: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'Team Captain',
    team: 'Delhi Warriors XI',
    location: 'Delhi',
    avatar: 'R',
    content: 'CricSmart has completely transformed how we manage our team. The WhatsApp integration alone saves me hours every week. No more chasing players for availability!',
    rating: 5,
    highlight: 'Saves hours every week'
  },
  {
    id: '2',
    name: 'Amit Sharma',
    role: 'Tournament Organizer',
    team: 'Noida Cricket League',
    location: 'Noida',
    avatar: 'A',
    content: 'We ran our 16-team tournament entirely on CricSmart. The payment tracking and live scoring features are game-changers. Professional setup at zero cost!',
    rating: 5,
    highlight: 'Professional tournament management'
  },
  {
    id: '3',
    name: 'Priya Patel',
    role: 'Team Manager',
    team: 'Bangalore Strikers',
    location: 'Bangalore',
    avatar: 'P',
    content: 'The AI payment verification is incredible. Just upload a screenshot and it automatically extracts all details. Our treasurer loves it!',
    rating: 5,
    highlight: 'AI payment verification'
  },
  {
    id: '4',
    name: 'Vikram Singh',
    role: 'League Administrator',
    team: 'Gurgaon Premier League',
    location: 'Gurgaon',
    avatar: 'V',
    content: 'The auction feature brought so much excitement to our league. Players felt like IPL stars! The real-time bidding experience is unmatched.',
    rating: 5,
    highlight: 'IPL-style auction experience'
  },
  {
    id: '5',
    name: 'Mohammed Ali',
    role: 'Team Captain',
    team: 'Hyderabad Thunder',
    location: 'Hyderabad',
    avatar: 'M',
    content: 'From match scheduling to payment collection, everything is so smooth now. The one-tap WhatsApp responses mean I get 95% reply rate!',
    rating: 5,
    highlight: '95% response rate'
  },
  {
    id: '6',
    name: 'Suresh Menon',
    role: 'Club Secretary',
    team: 'Chennai Cricket Club',
    location: 'Chennai',
    avatar: 'S',
    content: 'We\'ve tried many team management apps but CricSmart is the only one built specifically for Indian cricket teams. The UPI integration is perfect!',
    rating: 5,
    highlight: 'Built for Indian teams'
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; isActive: boolean }> = ({ testimonial, isActive }) => {
  return (
    <div 
      className={`flex-shrink-0 w-full md:w-[400px] p-6 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-500 ${
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'
      }`}
    >
      {/* Quote icon */}
      <Quote className="w-10 h-10 text-emerald-500/30 mb-4" />
      
      {/* Content */}
      <p className="text-slate-300 text-lg leading-relaxed mb-6">
        {testimonial.content}
      </p>

      {/* Highlight badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
        <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
        <span className="text-emerald-400 text-sm font-medium">{testimonial.highlight}</span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {testimonial.avatar}
        </div>
        <div>
          <div className="font-semibold text-white">{testimonial.name}</div>
          <div className="text-sm text-slate-400">{testimonial.role} • {testimonial.team}</div>
          <div className="text-xs text-slate-500">{testimonial.location}</div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mt-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeCard = container.children.item(currentIndex) as HTMLElement | null;
    if (!activeCard) return;

    // Calculate scroll position within the container only (don't scroll the page)
    const containerRect = container.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const scrollLeft = activeCard.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [currentIndex]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div 
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Loved by Teams</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            What Teams Are
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Saying About Us
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Join hundreds of cricket teams across India who trust CricSmart for their team management needs.
          </p>
        </div>

        {/* Stats */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          {[
            { value: '500+', label: 'Active Players' },
            { value: '50+', label: 'Teams' },
            { value: '100+', label: 'Matches Managed' },
            { value: '4.9★', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-slate-800/30 border border-white/5 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div 
          className={`relative transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Navigation Buttons */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/80 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/80 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-4 md:px-16"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="snap-center">
                <TestimonialCard 
                  testimonial={testimonial} 
                  isActive={index === currentIndex}
                />
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-emerald-500' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
