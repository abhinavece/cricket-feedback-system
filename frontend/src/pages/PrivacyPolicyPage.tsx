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
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';
import Footer from '../components/Footer';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = 'January 29, 2026';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 md:p-10 space-y-10">
            
            {/* Introduction */}
            <section>
              <p className="text-slate-300 leading-relaxed">
                CricSmart ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                AI-powered cricket team management platform and related services, including our WhatsApp 
                integration for match availability and team communications.
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
                  <h3 className="font-semibold text-white mb-2">AI Processing Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Payment screenshots uploaded for AI verification</li>
                    <li>Extracted payment amounts and transaction IDs</li>
                    <li>OCR-processed text from uploaded images</li>
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

            {/* AI Features */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">AI-Powered Features</h2>
              </div>
              
              <div className="space-y-4 text-slate-300 text-sm">
                <p>
                  CricSmart uses artificial intelligence to enhance your experience. Here's how we use AI:
                </p>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-violet-500/20">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-1">•</span>
                      <span><strong className="text-white">Payment Verification:</strong> AI analyzes uploaded payment screenshots to extract amounts and verify transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-1">•</span>
                      <span><strong className="text-white">OCR Processing:</strong> Optical character recognition extracts text from images for payment tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-1">•</span>
                      <span><strong className="text-white">Smart Notifications:</strong> AI determines optimal timing for availability reminders</span>
                    </li>
                  </ul>
                </div>
                
                <p>
                  All AI processing is done securely on our servers. We do not share your images or data 
                  with third-party AI services without your consent.
                </p>
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
                  Our platform uses the WhatsApp Business API (provided by Meta) to facilitate team 
                  communications. When you interact with our WhatsApp number:
                </p>
                
                <div className="bg-slate-900/50 rounded-xl p-4 border border-green-500/20">
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
                  <li>Process payment screenshots using AI verification</li>
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
                  <li>Secure cloud infrastructure hosting on Oracle Cloud</li>
                  <li>AI processing on isolated, secure servers</li>
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
                  <li>Payment screenshots: Deleted after verification, metadata retained</li>
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
            <section className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-6 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Contact Us</h2>
              </div>
              
              <div className="text-slate-300 text-sm space-y-2">
                <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
                <div className="mt-4 space-y-1">
                  <p><strong className="text-white">CricSmart</strong></p>
                  <p>Noida, Uttar Pradesh, India</p>
                  <p>Email: <a href="mailto:support@cricsmart.in" className="text-emerald-400 hover:underline">support@cricsmart.in</a></p>
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
