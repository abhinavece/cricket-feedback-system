import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Database, 
  MessageSquare, 
  Lock, 
  Eye, 
  Trash2,
  Mail,
  RefreshCw,
  FileText
} from 'lucide-react';
import Footer from '../components/Footer';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = 'January 27, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 md:p-10 space-y-10">
            
            {/* Introduction */}
            <section>
              <p className="text-slate-300 leading-relaxed">
                Mavericks XI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our cricket 
                team management application and related services, including our WhatsApp integration for match 
                availability and team communications.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Information We Collect</h2>
              </div>
              
              <div className="space-y-4 text-slate-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Name and contact information (phone number, email address)</li>
                    <li>Google account information when you sign in using Google OAuth</li>
                    <li>Profile information (display name, profile picture)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Match & Team Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Match availability responses (yes, no, tentative)</li>
                    <li>Feedback and ratings submitted after matches</li>
                    <li>Team performance data and statistics</li>
                    <li>Payment information for match contributions</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Communication Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>WhatsApp messages sent to and from our official number</li>
                    <li>Message timestamps and delivery status</li>
                    <li>Your responses to availability requests via WhatsApp</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Technical Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Device information and browser type</li>
                    <li>IP address and general location data</li>
                    <li>Usage patterns and access times</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* WhatsApp Integration */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">WhatsApp Integration</h2>
              </div>
              
              <div className="space-y-4 text-slate-300 text-sm">
                <p>
                  Our application uses the WhatsApp Business API (provided by Meta) to facilitate team 
                  communications. When you interact with our WhatsApp number:
                </p>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Your phone number is used to identify you as a team member</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Messages you send (like "YES", "NO", "MAYBE") are processed to update your match availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>We send you match announcements, reminders, and squad confirmations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>Message history is stored to maintain conversation context and resolve disputes</span>
                    </li>
                  </ul>
                </div>
                
                <p>
                  WhatsApp and Meta may collect additional data as per their own privacy policies. We encourage 
                  you to review <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">WhatsApp's Privacy Policy</a>.
                </p>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">How We Use Your Information</h2>
              </div>
              
              <div className="space-y-3 text-slate-300 text-sm">
                <p>We use the collected information to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Manage team rosters and match availability</li>
                  <li>Send match announcements and reminders via WhatsApp</li>
                  <li>Track and display match feedback and statistics</li>
                  <li>Manage payment tracking for match contributions</li>
                  <li>Improve our application and user experience</li>
                  <li>Communicate important team updates</li>
                  <li>Resolve disputes and provide customer support</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Security</h2>
              </div>
              
              <div className="space-y-3 text-slate-300 text-sm">
                <p>
                  We implement appropriate technical and organizational security measures to protect your 
                  personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encrypted data transmission (HTTPS/TLS)</li>
                  <li>Secure authentication via Google OAuth</li>
                  <li>Role-based access controls within the application</li>
                  <li>Regular security updates and monitoring</li>
                  <li>Secure cloud infrastructure hosting</li>
                </ul>
                <p className="mt-4">
                  While we strive to protect your information, no method of electronic transmission or storage 
                  is 100% secure. We cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Sharing & Disclosure</h2>
              </div>
              
              <div className="space-y-3 text-slate-300 text-sm">
                <p>We may share your information in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-white">With Team Members:</strong> Your name and availability are visible to other team members for coordination</li>
                  <li><strong className="text-white">Service Providers:</strong> We use third-party services (hosting, WhatsApp API) that may process your data</li>
                  <li><strong className="text-white">Legal Requirements:</strong> If required by law or to protect our rights</li>
                </ul>
                <p className="mt-4">
                  We do <strong className="text-white">not</strong> sell your personal information to third parties.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Your Rights</h2>
              </div>
              
              <div className="space-y-3 text-slate-300 text-sm">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                  <li><strong className="text-white">Correction:</strong> Request correction of inaccurate data</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your data (subject to retention requirements)</li>
                  <li><strong className="text-white">Opt-out:</strong> Opt out of WhatsApp communications by messaging "STOP"</li>
                  <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent for data processing</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us using the information below.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Retention</h2>
              </div>
              
              <div className="space-y-3 text-slate-300 text-sm">
                <p>
                  We retain your personal information for as long as necessary to provide our services and 
                  fulfill the purposes outlined in this policy. Specifically:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Active player data: Retained while you are an active team member</li>
                  <li>Match and feedback data: Retained for historical records and statistics</li>
                  <li>WhatsApp message logs: Retained for up to 2 years</li>
                  <li>Account data: Deleted within 30 days of account deletion request</li>
                </ul>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Children's Privacy</h2>
              <p className="text-slate-300 text-sm">
                Our services are not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe your 
                child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Changes to This Policy</h2>
              <p className="text-slate-300 text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
                advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Us */}
            <section className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Contact Us</h2>
              </div>
              
              <div className="text-slate-300 text-sm space-y-2">
                <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
                <div className="mt-4 space-y-1">
                  <p><strong className="text-white">Mavericks XI Cricket Club</strong></p>
                  <p>Sector 45, Noida, Uttar Pradesh 201303, India</p>
                  <p>Email: <a href="mailto:singh09.abhinav@gmail.com" className="text-emerald-400 hover:underline">singh09.abhinav@gmail.com</a></p>
                  <p>Phone: <a href="tel:+918087102325" className="text-emerald-400 hover:underline">+91 80871 02325</a></p>
                </div>
              </div>
            </section>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
