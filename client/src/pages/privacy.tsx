import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Shield, 
  ArrowLeft, 
  Lock, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Mail, 
  Database, 
  Eye, 
  CheckCircle2, 
  Server, 
  Globe,
  Terminal,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { audioEngine } from "@/lib/audio-engine";

export default function PrivacyPolicyPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    try {
      audioEngine.playTactileClick();
    } catch {
      // Audio engine optional
    }
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#020617] to-[#020617]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#020617]/90 backdrop-blur-md border-b border-cyan-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="border-cyan-500/30 bg-slate-900/80 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center gap-1.5 h-8 px-3 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN HOME</span>
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>//</span>
            <span className="text-slate-400">LEGAL COMPLIANCE DECK</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-[10px] sm:text-xs font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            ASCENSION PROTOCOL // VERIFIED
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-10">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 border-b border-slate-800 pb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-widest uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy & User Data Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white uppercase drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-slate-400">
            <span>Entity: <strong className="text-slate-200">Ascension Protocol</strong></span>
            <span>•</span>
            <span>Domain: <a href="https://ascensions.in" className="text-cyan-400 underline hover:text-cyan-300">https://ascensions.in</a></span>
            <span>•</span>
            <span>Effective Date: November 14, 2026</span>
            <span>•</span>
            <span>Contact: <a href="mailto:support@ascensions.in" className="text-cyan-400 hover:underline">support@ascensions.in</a></span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans pt-2">
            Ascension Protocol ("we", "our", "us", or the "Service") operates the web application located at{" "}
            <a href="https://ascensions.in" className="text-cyan-400 underline font-mono">https://ascensions.in</a>. 
            We are committed to absolute transparency regarding the collection, transmission, processing, and safeguarding of operator data. 
            This Privacy Policy governs your use of Ascension Protocol, our tactical performance toolsets, and any third-party developer integrations 
            including Google APIs and Meta Developer Platform conduits.
          </p>
        </motion.div>

        {/* Quick Summary Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Zero Data Brokering</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never sell, rent, or lease your personal information, telemetry, or third-party tokens to advertisers or data brokers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Google Limited Use</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google API data access complies strictly with Google API Services User Data Policy Limited Use requirements.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Trash2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Immediate Data Deletion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              You maintain sovereign ownership of your data with on-demand account wipeout and automated Meta deletion handling.
            </p>
          </div>
        </div>

        {/* Section 1: Identification & Scope */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">01.</span> Entity Identification & Scope
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              This policy applies to all users accessing Ascension Protocol via our production web application (<code className="text-cyan-300 px-1 py-0.5 bg-slate-900 rounded font-mono">https://ascensions.in</code>), 
              Progressive Web App (PWA) client, or API endpoints. 
            </p>
            <p>
              Ascension Protocol acts as the Data Controller for information submitted directly to our service. When third-party platform integrations are authorized, 
              we act as an authorized application operating solely on behalf of the registered user to facilitate user-requested automations and productivity analytics.
            </p>
          </div>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">02.</span> Categories of Data Collected
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>We collect and process the following categories of information to provide and maintain our execution system:</p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-mono font-bold text-cyan-300 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Account & Authentication Profile
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  When you register via local credentials or federated Google Sign-In, we collect your chosen username, email address, 
                  cryptographic password hash (for local accounts), user identifier (Firebase UID / User ID), and referral attribution code if used.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-mono font-bold text-cyan-300 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Performance & Gamification Telemetry
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Execution data including quest completions, daily habit streaks, focus sprint timers, Hunter Class archetype selection (e.g., Shadow Assassin, Iron Tank), 
                  equipment profiles (Bodyweight, Dumbbells, Commercial Gym), Mana Shield usage, level rank, and achievement milestones.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-mono font-bold text-cyan-300 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Device & Technical Telemetry
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Technical diagnostics including browser user-agent, operating system, network status, screen orientation, error telemetry, and anonymous aggregated web analytics 
                  via Google Analytics (<code className="text-cyan-300 px-1 py-0.5 bg-slate-900 rounded font-mono">G-0LC30PK0JL</code>) to debug client performance and optimize PWA caching.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Google API Services & OAuth Disclosure (MANDATORY GOOGLE COMPLIANCE) */}
        <section className="space-y-4 p-6 rounded-2xl bg-slate-900/70 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Developer Policy Compliance Deck</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">03.</span> Third-Party API Integrations: Google APIs & Limited Use
          </h2>
          
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              Ascension Protocol integrates with Google APIs to facilitate seamless, secure authentication (Google Sign-In) and optional content productivity conduits 
              (including YouTube Data API Services).
            </p>

            <div className="p-4 rounded-xl bg-[#020617] border border-cyan-500/30 font-mono text-xs sm:text-sm text-cyan-200 space-y-2">
              <p className="font-bold uppercase tracking-wider text-cyan-400">
                [ GOOGLE API SERVICES USER DATA POLICY STATEMENT ]
              </p>
              <p className="text-slate-300 font-sans leading-relaxed">
                Ascension Protocol's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Google API Services User Data Policy <ExternalLink className="w-3 h-3" />
                </a>, including the <strong>Limited Use</strong> requirements.
              </p>
            </div>

            <h3 className="font-mono font-bold text-white text-base pt-2">Specific Disclosures for Google Services:</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <strong>Google Sign-In / OAuth:</strong> We access your Google user ID, primary email address, and public profile picture exclusively to authenticate your identity, prevent duplicate accounts, and establish your operator profile. We never inspect your private Google Drive files, Gmail messages, or contacts.
              </li>
              <li>
                <strong>YouTube API Services:</strong> If you elect to connect YouTube channels for accountability logging or video publishing automations, tokens are used strictly to execute authorized video uploads, schedule public or unlisted status updates, and retrieve view metrics requested by you.
              </li>
              <li>
                <strong>No Generalized AI/ML Training:</strong> Information received via Google APIs is never used to develop, train, or fine-tune generalized artificial intelligence or machine learning models.
              </li>
              <li>
                <strong>Google Privacy Policy:</strong> For additional information on Google's privacy practices, please review the{" "}
                <a 
                  href="http://www.google.com/policies/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Google Privacy Policy
                </a>. Users can revoke Ascension Protocol's access at any time via the{" "}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Google Security Permissions Console
                </a>.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Meta Developer Platform Compliance (MANDATORY META POLICY) */}
        <section className="space-y-4 p-6 rounded-2xl bg-slate-900/70 border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.1)]">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Meta Platform Compliance Deck</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-purple-400">04.</span> Meta Developer Platform & Instagram Graph API
          </h2>

          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              Ascension Protocol supports integrations with the Meta Developer Platform (including Instagram Graph API and Facebook Login) for operators 
              who utilize our marketing automation, habit brag card broadcasting, and accountability publishing conduits.
            </p>

            <h3 className="font-mono font-bold text-white text-base pt-1">Meta Platform Data Disclosures:</h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <strong>Strict Purpose Limitation:</strong> User access tokens, account IDs, and media objects retrieved via Meta APIs are processed solely to publish user-initiated content, stories, or posts, and to display verified engagement metrics within your private Ascension Protocol command dashboard.
              </li>
              <li>
                <strong>No Data Transfers or Selling:</strong> Meta user data is strictly isolated. We do not sell, license, transfer, or distribute any user data obtained through Meta APIs to data brokers, advertising networks, or external syndicates.
              </li>
              <li>
                <strong>Token Security:</strong> Long-lived user access tokens are encrypted using industry-standard AES-256 encryption at rest and transmitted over secure TLS 1.3 channels.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Meta & Google User Data Deletion Instructions (CRITICAL FOR REVIEW) */}
        <section id="data-deletion" className="space-y-4 p-6 rounded-2xl bg-slate-900/90 border border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.1)]">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase tracking-wider">
            <Trash2 className="w-4 h-4" />
            <span>Sovereign Right to Erasure</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-rose-400">05.</span> User Data Retention & Deletion Instructions
          </h2>

          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              In accordance with Meta Platform Terms, Google API policies, and international privacy standards (GDPR/CCPA), 
              every operator holds an unconditional right to permanently expunge their account, credentials, and synced third-party tokens from our systems.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-[#020617] border border-slate-800">
                <h3 className="font-mono font-bold text-white text-sm mb-1">
                  Method A: Self-Service In-App Deletion
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Log into your operator account, navigate to <code className="text-cyan-300 font-mono">Profile &gt; Account Security</code>, 
                  and click <strong>"Delete Operator Profile"</strong>. This immediately purges your profile, streak records, quest logs, and stored API credentials from our database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#020617] border border-slate-800">
                <h3 className="font-mono font-bold text-white text-sm mb-1">
                  Method B: Manual Deletion Request via Email
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Transmit an email to <a href="mailto:support@ascensions.in" className="text-cyan-400 underline font-mono">support@ascensions.in</a> with 
                  the subject line <span className="text-slate-200 font-mono">"DATA DELETION REQUEST"</span>, specifying your registered username or email address. 
                  Our technical team will permanently expunge all records within thirty (30) calendar days and issue written cryptographic confirmation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#020617] border border-slate-800">
                <h3 className="font-mono font-bold text-white text-sm mb-1">
                  Method C: Meta / Facebook App Settings Deletion (Facebook Deletion Callback)
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  If you have connected your Meta or Instagram account and wish to revoke access:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-400 mt-2">
                  <li>Navigate to your Facebook/Instagram profile <strong>Settings & Privacy &gt; Settings</strong>.</li>
                  <li>Select <strong>Apps and Websites</strong> and locate <strong>Ascension Protocol</strong>.</li>
                  <li>Click <strong>Remove</strong>. You may also click "Send Request" to invoke our automated data deletion protocol.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Data Security & Storage Architecture */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">06.</span> Security Architecture & Storage
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              We implement military-grade administrative, technical, and physical safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li><strong>Transport Security:</strong> All communications between your browser, PWA client, and server infrastructure are encrypted via TLS 1.3 / HTTPS.</li>
              <li><strong>At-Rest Encryption:</strong> Database records, authentication tokens, and credentials are encrypted using AES-256.</li>
              <li><strong>Local-First Air-Gap Architecture:</strong> Focus timers and neuro-reconditioning audio are generated directly within your browser utilizing Web Audio API oscillators, ensuring private offline operation without sending live audio telemetry to our servers.</li>
              <li><strong>No Third-Party Tracker Injection:</strong> We do not inject invasive advertising pixels or fingerprinting scripts.</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">07.</span> Children's Privacy
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              Ascension Protocol is engineered for individuals aged 13 and older (or 16 in applicable European jurisdictions). 
              We do not knowingly solicit or collect personal information from children under the age of 13. If you become aware that a minor 
              has registered without parental consent, please contact <a href="mailto:support@ascensions.in" className="text-cyan-400 underline">support@ascensions.in</a> to initiate an immediate wipeout of the record.
            </p>
          </div>
        </section>

        {/* Section 8: Changes to this Policy */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">08.</span> Protocol Revisions & Updates
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              We reserve the right to amend this Privacy Policy to maintain parity with new features, evolving regulatory requirements, 
              and third-party API platform guidelines. Material modifications will be indicated via the "Effective Date" header and 
              in-app notification banners. Continued use of Ascension Protocol after updates constitutes acknowledgment of the revised policy.
            </p>
          </div>
        </section>

        {/* Section 9: Official Contact */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" /> Official Privacy & Data Protection Contact
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            For questions regarding this Privacy Policy, verification inquiries, or exercise of your statutory privacy rights, 
            direct your communication to our designated compliance contact:
          </p>
          <div className="p-3.5 rounded-lg bg-[#020617] border border-cyan-500/20 font-mono text-xs text-slate-300 space-y-1">
            <p><strong className="text-white">Entity:</strong> Ascension Protocol</p>
            <p><strong className="text-white">Primary Web Application:</strong> <a href="https://ascensions.in" className="text-cyan-400 underline">https://ascensions.in</a></p>
            <p><strong className="text-white">Email Contact:</strong> <a href="mailto:support@ascensions.in" className="text-cyan-400 underline">support@ascensions.in</a></p>
            <p><strong className="text-white">Security Desk:</strong> Available Monday – Saturday, 09:00 – 18:00 IST</p>
          </div>
        </section>

        {/* Footer Navigation Back */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            onClick={handleBack}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            RETURN TO ASCENSION PROTOCOL
          </Button>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <a href="/terms" onClick={(e) => { e.preventDefault(); setLocation("/terms"); }} className="hover:text-cyan-400 transition-colors">
              TERMS OF SERVICE
            </a>
            <span>•</span>
            <a href="/contact" onClick={(e) => { e.preventDefault(); setLocation("/contact"); }} className="hover:text-cyan-400 transition-colors">
              CONTACT DESK
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}

