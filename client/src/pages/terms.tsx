import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  FileText, 
  ArrowLeft, 
  ShieldAlert, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  HeartPulse, 
  Cpu, 
  Lock, 
  Mail,
  Zap,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { audioEngine } from "@/lib/audio-engine";

export default function TermsOfServicePage() {
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
            <span className="text-slate-400">OPERATOR COMPLIANCE CHARTER</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-[10px] sm:text-xs font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            ASCENSION PROTOCOL // TERMS
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
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Framework & Terms of Service</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white uppercase drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            Terms of Service
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-slate-400">
            <span>Service: <strong className="text-slate-200">Ascension Protocol</strong></span>
            <span>•</span>
            <span>Domain: <a href="https://ascensions.in" className="text-cyan-400 underline hover:text-cyan-300">https://ascensions.in</a></span>
            <span>•</span>
            <span>Effective Date: November 14, 2026</span>
            <span>•</span>
            <span>Contact: <a href="mailto:support@ascensions.in" className="text-cyan-400 hover:underline">support@ascensions.in</a></span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans pt-2">
            Welcome to Ascension Protocol (<a href="https://ascensions.in" className="text-cyan-400 underline font-mono">https://ascensions.in</a>). 
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("Operator", "User", or "You") and Ascension Protocol 
            ("we", "us", or "our"). By creating an account, launching the web console, installing the Progressive Web Application, or utilizing our tactical 
            productivity and automation conduits, you acknowledge and agree to comply with these Terms.
          </p>
        </motion.div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Execution Sovereignty</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for authentic personal discipline, calibrated habit reinforcement, and deliberate productivity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Physical Safety First</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fitness quests are motivational guides. Always prioritize safe form, progressive adaptation, and professional medical guidance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Globe className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-mono font-bold text-white uppercase mb-1">Compliant Conduits</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All third-party integrations (Google, YouTube, Meta) operate strictly within official platform terms and developer policies.
            </p>
          </div>
        </div>

        {/* Section 1: Acceptance & Eligibility */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">01.</span> Acceptance of Terms & Eligibility
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              By accessing <code className="text-cyan-300 px-1 py-0.5 bg-slate-900 rounded font-mono">https://ascensions.in</code> or registering an account, 
              you certify that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li>You are at least 13 years of age (or the minimum legal age required in your jurisdiction, such as 16 in the European Economic Area).</li>
              <li>You possess the legal authority to enter into these binding Terms.</li>
              <li>If participating in bilateral financial peer covenants, escrow stakes, or performance court pools, you are at least 18 years of age.</li>
              <li>You have not previously been banned or restricted from Ascension Protocol for malicious activities or terms violations.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Account Registration & Security */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">02.</span> Operator Account & Security Responsibility
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              You may access Ascension Protocol via guest sandbox mode, registered username/password credentials, or federated authentication (Google Sign-In). 
              You agree to provide true, accurate, and current information during calibration.
            </p>
            <p>
              You are solely responsible for maintaining the confidentiality of your session credentials and password. Any actions executed through your 
              authenticated operator profile are deemed to have been executed by you. If you suspect unauthorized access, you must notify 
              our security desk immediately at <a href="mailto:support@ascensions.in" className="text-cyan-400 underline font-mono">support@ascensions.in</a>.
            </p>
          </div>
        </section>

        {/* Section 3: Acceptable Use Policy */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">03.</span> Acceptable Use Policy
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              Ascension Protocol is an elite execution ecosystem. To preserve integrity, fair competition, and platform security, 
              the following actions are strictly prohibited:
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white">Anti-Cheat & Leaderboard Integrity:</strong> You shall not use automated scripts, bots, macro recorders, 
                  or modified clients to falsely simulate quest completion, spoof workout metrics, or manipulate global leaderboard rankings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white">Reverse Engineering:</strong> You shall not decompile, reverse engineer, extract, or scrape our proprietary 
                  neuro-acoustic synthesizers, 40Hz binaural algorithms, or server source code.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white">Citadel & Social Decorum:</strong> You shall not transmit hateful, defamatory, pornographic, harassing, 
                  or illegal messages across Global Chat, Gang enclaves, or squad pact channels.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white">Abuse of Automation Conduits:</strong> You shall not utilize Ascension Protocol's marketing automations 
                  to distribute spam, violate third-party platform API terms, or publish unauthorized copyright-infringing media.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Physical Fitness & Health Disclaimer (ESSENTIAL FOR FITNESS APPS) */}
        <section className="space-y-4 p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.08)]">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Health & Physical Exercise Medical Advisory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-amber-400">04.</span> Physical Activity, Exercise & Wellness Disclaimer
          </h2>

          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p className="font-bold text-amber-200">
              PLEASE READ THIS SECTION CAREFULLY BEFORE INITIATING PHYSICAL QUESTS OR CALIBRATION DRILLS.
            </p>
            <p>
              Ascension Protocol provides physical performance challenges (e.g., push-ups, pull-ups, squats, sprints, and progressive overload sequences) 
              as educational, motivational gamification elements. <strong>Ascension Protocol is not a licensed medical healthcare provider, physician, 
              or clinical physical therapist.</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <strong>Medical Clearance:</strong> You must consult a qualified physician or healthcare provider prior to undertaking any new exercise routine, 
                particularly if you have pre-existing cardiovascular conditions, joint injuries, respiratory illnesses, or other physical constraints.
              </li>
              <li>
                <strong>Assumption of Personal Risk:</strong> Physical exercise carries inherent risk of injury. By participating in quests, you expressly 
                and voluntarily assume all risks of personal injury, illness, or physical harm. Ascension Protocol, its founders, and contributors 
                expressly disclaim any liability for injuries or damages arising from physical activities undertaken in connection with the Service.
              </li>
              <li>
                <strong>Anti-Burnout & Rest Day Protocol:</strong> Our "Mana Shield" and "Rest Day Protocol" features are intentionally engineered to prevent overtraining. 
                Operators are urged to honor rest days, hydrate, and discontinue any movement causing sharp, unnatural pain.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Third-Party Developer Platforms & Marketing Automations */}
        <section className="space-y-4 p-6 rounded-2xl bg-slate-900/70 border border-cyan-500/40">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>External API Integrations Deck</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">05.</span> Third-Party Services: Google, YouTube & Meta Platforms
          </h2>

          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              Ascension Protocol offers optional conduits that interface with external platforms, including Google APIs, YouTube Data API Services, 
              and Meta Developer Platform (Instagram Graph API). When you authorize these integrations, you agree that:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                You will comply with the{" "}
                <a 
                  href="https://policies.google.com/terms" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Google Terms of Service <ExternalLink className="w-3 h-3" />
                </a> and the{" "}
                <a 
                  href="https://www.youtube.com/t/terms" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  YouTube Terms of Service <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                You will comply with the{" "}
                <a 
                  href="https://www.facebook.com/terms.php" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Meta Terms of Service <ExternalLink className="w-3 h-3" />
                </a> and Meta Platform Terms.
              </li>
              <li>
                You hold all necessary intellectual property rights, licenses, and releases for any video, graphic, or copy scheduled or published 
                through Ascension Protocol to third-party accounts.
              </li>
              <li>
                Ascension Protocol is not liable for account suspensions, shadowbans, rate limits, or removals enacted by external platform moderators 
                on your third-party channels.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6: Intellectual Property Rights */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">06.</span> Intellectual Property Rights
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              <strong>Ascension Protocol IP:</strong> All software source code, client builds, interactive UI designs, visual rank badges, 
              brand names ("Ascension Protocol", "Air-Gap Focus", "Performance Court"), and procedural Web Audio synthesizers are the proprietary intellectual property 
              of Ascension Protocol and protected by international copyright, trademark, and trade secret laws.
            </p>
            <p>
              <strong>Operator Content:</strong> You retain full ownership of all habit descriptions, personal notes, profile avatars, and media files 
              you transmit to Ascension Protocol. You grant Ascension Protocol a non-exclusive, worldwide, royalty-free license to store, process, 
              and display such content solely to provide the services requested by you.
            </p>
          </div>
        </section>

        {/* Section 7: Gamified Currency & Squad Covenants */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">07.</span> In-App Currency & Gamification Economy
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              In-app Hunter Coins, XP points, rank badges, and Mana Shields are virtual items with no real-world cash equivalent or monetary redemption value. 
              Virtual items cannot be redeemed for fiat currency, transferred outside the platform, or sold. We reserve the right to balance virtual currency 
              costs to preserve system equilibrium.
            </p>
            <p>
              Bilateral squad pacts and weekly performance covenants entered into between operators are social accountability agreements. 
              Operators are expected to honor commitments with integrity.
            </p>
          </div>
        </section>

        {/* Section 8: Disclaimer of Warranties */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">08.</span> Disclaimer of Warranties
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p className="uppercase text-xs font-mono text-slate-400">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
            </p>
            <p>
              ASCENSION PROTOCOL EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. 
              WE DO NOT WARRANT THAT ACCESS TO THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM HARMFUL COMPONENTS.
            </p>
          </div>
        </section>

        {/* Section 9: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">09.</span> Limitation of Liability
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, IN NO EVENT SHALL ASCENSION PROTOCOL, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS 
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA LOSS, PHYSICAL INJURY, 
              DEVICE MALFUNCTION, OR BUSINESS INTERRUPTION) ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY 
              OF SUCH DAMAGES.
            </p>
            <p>
              IN JURISDICTIONS THAT DO NOT PERMIT THE EXCLUSION OR LIMITATION OF LIABILITY FOR CERTAIN DAMAGES, OUR LIABILITY SHALL BE LIMITED TO THE GREATEST 
              EXTENT PERMITTED BY LAW OR THE TOTAL AMOUNT PAID BY YOU TO ASCENSION PROTOCOL IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, WHICHEVER IS LESS.
            </p>
          </div>
        </section>

        {/* Section 10: Termination & Suspension */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">10.</span> Termination & Account Cancellation
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              You may terminate your account at any time via Profile &gt; Account Security or by submitting an email to{" "}
              <a href="mailto:support@ascensions.in" className="text-cyan-400 underline font-mono">support@ascensions.in</a>. 
            </p>
            <p>
              We reserve the right to suspend, terminate, or restrict your access immediately, without prior notice, if you breach these Terms, 
              engage in fraudulent or leaderboard cheating activity, or compromise platform security.
            </p>
          </div>
        </section>

        {/* Section 11: Governing Law & Jurisdiction */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">11.</span> Governing Law & Dispute Resolution
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              These Terms and any dispute arising out of or related to Ascension Protocol shall be governed by and construed in accordance with 
              the laws of India, without regard to its conflict of law principles. You agree that any legal action or proceeding shall be brought 
              exclusively in courts of competent jurisdiction located in Tamil Nadu, India.
            </p>
          </div>
        </section>

        {/* Section 12: Modifications to Terms */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">12.</span> Modifications to Terms
          </h2>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            <p>
              We reserve the right to revise these Terms periodically. When changes occur, we will update the "Effective Date" at the top of this document. 
              Your continued access or use of Ascension Protocol after modifications take effect constitutes your binding acceptance of the updated Terms.
            </p>
          </div>
        </section>

        {/* Section 13: Official Contact */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" /> Official Operator Support & Legal Desk
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            For inquiries regarding these Terms of Service or official notices, please direct correspondence to:
          </p>
          <div className="p-3.5 rounded-lg bg-[#020617] border border-cyan-500/20 font-mono text-xs text-slate-300 space-y-1">
            <p><strong className="text-white">Entity:</strong> Ascension Protocol</p>
            <p><strong className="text-white">Primary Web Application:</strong> <a href="https://ascensions.in" className="text-cyan-400 underline">https://ascensions.in</a></p>
            <p><strong className="text-white">Email Contact:</strong> <a href="mailto:support@ascensions.in" className="text-cyan-400 underline">support@ascensions.in</a></p>
            <p><strong className="text-white">Support Availability:</strong> Monday – Saturday, 09:00 – 18:00 IST</p>
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
            <a href="/privacy" onClick={(e) => { e.preventDefault(); setLocation("/privacy"); }} className="hover:text-cyan-400 transition-colors">
              PRIVACY POLICY
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

