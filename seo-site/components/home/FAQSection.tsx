'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Is CricSmart really free to use?',
    answer: 'Yes! CricSmart is completely free for teams with up to 50 players. No credit card required, no hidden fees. Larger teams and advanced features may require a premium plan in the future, but the core functionality remains free.'
  },
  {
    question: 'How does the AI payment verification work?',
    answer: 'Simply upload a screenshot of your UPI payment, and our AI-powered OCR technology automatically extracts the transaction ID, amount, and date. It then verifies and updates the player\'s payment record — no manual data entry needed.'
  },
  {
    question: 'Do my players need to download an app?',
    answer: 'No! That\'s the beauty of CricSmart. Players receive match notifications and availability requests via WhatsApp. They can respond with a single tap without downloading anything. Only team admins need to access the dashboard.'
  },
  {
    question: 'Can I manage multiple teams?',
    answer: 'Absolutely! You can create and manage multiple teams under a single account. Each team has its own set of players, matches, and payment records completely separated.'
  },
  {
    question: 'How do player auctions work?',
    answer: 'CricSmart offers IPL-style live player auctions. Admins create a player pool, set budgets for each team, and run real-time bidding sessions. Teams can bid, spectators can watch, and all transactions are tracked automatically.'
  },
  {
    question: 'Is my team data secure?',
    answer: 'Yes, security is our top priority. All data is encrypted, stored securely on cloud infrastructure, and never shared with third parties. Your player information and payment records remain completely private.'
  },
  {
    question: 'Can I run tournaments with CricSmart?',
    answer: 'Yes! CricSmart has a dedicated tournament management system. Create tournaments, manage team registrations, generate fixtures automatically, track scores live, and manage prize money distribution — all in one place.'
  },
  {
    question: 'Does CricSmart work on mobile?',
    answer: 'CricSmart is fully responsive and works beautifully on all devices. Whether you\'re on a desktop, tablet, or smartphone, you get the complete experience. There\'s also a dedicated mobile app coming soon!'
  },
];

const FAQItem: React.FC<{ faq: FAQ; index: number; isOpen: boolean; onToggle: () => void }> = ({ 
  faq, 
  index, 
  isOpen, 
  onToggle 
}) => {
  return (
    <div 
      className="border-b border-white/10 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-white font-medium pr-8 group-hover:text-emerald-400 transition-colors">
          {faq.question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-slate-400 leading-relaxed pr-8">
          {faq.answer}
        </p>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={sectionRef} id="faq" className="py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div 
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Got Questions?</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Everything you need to know about CricSmart. Can&apos;t find the answer? Contact our team.
          </p>
        </div>

        {/* FAQ List */}
        <div 
          className={`bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* More Questions CTA */}
        <div 
          className={`text-center mt-10 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <p className="text-slate-400 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/faq"
              className="group inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View All FAQs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="hidden sm:inline text-slate-600">•</span>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Contact Support
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
