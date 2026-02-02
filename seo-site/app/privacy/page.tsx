import { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteConfig } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CricSmart Privacy Policy. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: `${siteConfig.url}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | CricSmart',
    description: 'Learn how CricSmart handles your privacy and data.',
    url: `${siteConfig.url}/privacy`,
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs items={[{ name: 'Privacy Policy', href: '/privacy' }]} />

      <div className="card p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Privacy Policy
        </h1>
        
        <p className="text-slate-400 mb-8">
          Last updated: {new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="text-slate-300">
              CricSmart (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed 
              to protecting your personal data. This privacy policy explains how we collect, 
              use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Personal Information</h3>
            <p className="text-slate-300">When you register for CricSmart, we may collect:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Name and email address (via Google OAuth)</li>
              <li>Phone number (optional, for WhatsApp integration)</li>
              <li>Profile picture (from Google account)</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Usage Information</h3>
            <p className="text-slate-300">We automatically collect:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Device information and browser type</li>
              <li>IP address and approximate location</li>
              <li>Pages visited and features used</li>
              <li>Time spent on the platform</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.3 Cricket-Related Data</h3>
            <p className="text-slate-300">When using our services:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Match schedules and team information</li>
              <li>Player availability responses</li>
              <li>Payment records for matches</li>
              <li>Ground reviews and ratings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="text-slate-300">We use collected information to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Provide and maintain our services</li>
              <li>Send match notifications and availability requests</li>
              <li>Process payment tracking and settlements</li>
              <li>Improve our platform based on usage patterns</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send important updates about our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. WhatsApp Integration</h2>
            <p className="text-slate-300">
              If you opt-in to WhatsApp notifications, we use the WhatsApp Business API to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Send match availability requests</li>
              <li>Deliver payment reminders</li>
              <li>Process your availability responses</li>
            </ul>
            <p className="text-slate-300 mt-2">
              Your phone number is only used for WhatsApp communication and is never sold or 
              shared with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p className="text-slate-300">
              Your data is stored securely on cloud servers with industry-standard encryption. 
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
            <p className="text-slate-300">We may share your information with:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li><strong>Team members:</strong> Other members of your cricket team can see 
              your name and availability status</li>
              <li><strong>Service providers:</strong> We use third-party services for hosting, 
              analytics, and communications</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="text-slate-300 mt-2">
              We never sell your personal information to advertisers or marketing companies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies and Analytics</h2>
            <p className="text-slate-300">
              We use cookies and similar technologies to enhance your experience. These help us:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our services</li>
              <li>Improve platform performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="text-slate-300">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of WhatsApp notifications</li>
              <li>Export your data</li>
            </ul>
            <p className="text-slate-300 mt-2">
              To exercise these rights, contact us at privacy@cricsmart.in
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-slate-300">
              CricSmart is not intended for children under 13. We do not knowingly collect 
              personal information from children. If you believe we have collected data from 
              a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p className="text-slate-300">
              We may update this privacy policy from time to time. We will notify you of any 
              significant changes by posting the new policy on this page and updating the 
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p className="text-slate-300">
              If you have questions about this privacy policy or our data practices, contact us at:
            </p>
            <ul className="list-none text-slate-300 space-y-1 mt-2">
              <li>Email: privacy@cricsmart.in</li>
              <li>Website: https://cricsmart.in/contact</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
