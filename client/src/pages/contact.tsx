import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  MessageSquare, Send, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, Shield, Sparkles, HelpCircle, 
  ExternalLink, Copy, Check, Clock, UserCheck
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Technical Support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const instagramHandle = "ascension.protocol_";
  const instagramUrl = "https://www.instagram.com/ascension.protocol_/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide your email address and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message. Please message us on Instagram @ascension.protocol_.");
      }

      setIsSubmitted(true);
      toast({
        title: "Inquiry Transmitted",
        description: "Your message has reached the Ascension Protocol support desk.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message || "Could not transmit inquiry. Please reach out via Instagram @ascension.protocol_.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-cyan-900/10 blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Ascension Protocol</span>
              <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 hidden sm:inline-block">Support Desk</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setLocation("/about")}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              About
            </button>
            <button
              onClick={() => setLocation("/download")}
              className="hidden md:inline-flex items-center text-xs text-slate-300 hover:text-cyan-400 transition-colors px-3 py-1.5"
            >
              App Download
            </button>
            <Button
              onClick={() => setLocation("/login")}
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs px-3.5 h-9 rounded-lg"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setLocation("/account-selection")}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 h-9 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md mb-6">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              Operator Support & Official Channels
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Connect With the Team <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300">
              On Instagram or Direct Desk.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Have questions about your hunter rank calibration, technical support, bug reports, or feature ideas? Reach out directly to our official Instagram channel or submit an inquiry below.
          </p>
        </div>

        {/* Quick Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          
          {/* Official Instagram Card */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-gradient-to-br from-[#090d16] to-[#12081d] border border-pink-500/30 hover:border-pink-500/60 transition-all group flex flex-col justify-between shadow-lg hover:shadow-pink-500/10"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform shadow-md">
                <FaInstagram className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                Official Instagram <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct message our team on Instagram for rapid assistance, feature updates, and community progress.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-pink-400">
              <span className="font-mono">@{instagramHandle}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Direct Support Desk Card */}
          <div className="p-6 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Direct Web Inquiry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit an inquiry directly through our secure platform for technical logs, account help, and feedback.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Form available below</span>
            </div>
          </div>

          {/* Response Window Card */}
          <div className="p-6 rounded-2xl bg-[#090d16] border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Active Support Window</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All inquiries and Instagram DMs are answered promptly by our technical operators within 24 hours.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Desk active 7 days a week</span>
            </div>
          </div>

        </div>

        {/* Contact Form & Deletion Request Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          
          {/* Submission Form */}
          <div className="lg:col-span-7">
            <Card className="bg-[#090d16] border-slate-800 backdrop-blur-xl shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Send an Inquiry</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Transmit an inquiry directly to the system administrators
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isSubmitted ? (
                  <div className="p-6 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Inquiry Transmitted Successfully</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Thank you for contacting Ascension Protocol. A confirmation and response will be routed to your email address or Instagram profile promptly.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 mt-2"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Your Name (Optional)</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Hunter Solo"
                          className="bg-slate-950 border-slate-800 text-white text-sm h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          Email Address <span className="text-cyan-400">*</span>
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="bg-slate-950 border-slate-800 text-white text-sm h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Topic / Category</label>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white text-sm h-11 rounded-xl px-3.5 focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="Technical Support">Technical Support & Bug Report</option>
                        <option value="Account & Login">Account Access & Authentication</option>
                        <option value="Data Deletion Request">Data Deletion / Privacy Request</option>
                        <option value="Hunter Calibration">Hunter Rank & Quest Calibration</option>
                        <option value="Feature Proposal">Feature Proposal & Feedback</option>
                        <option value="Business Partnership">Business & Partnership Inquiry</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Message Details <span className="text-cyan-400">*</span>
                      </label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your question, issue, or feedback in detail..."
                        rows={5}
                        required
                        className="bg-slate-950 border-slate-800 text-white text-sm rounded-xl resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm h-12 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Transmitting Message...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Transmit Inquiry</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Info & FAQ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* User Data Deletion Policy Box (Google OAuth & Meta Compliance) */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2.5 mb-2.5 text-cyan-400">
                <Shield className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">User Data Deletion Protocol</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                In compliance with Google OAuth and Meta Developer Platform policies, users can request the permanent removal of their account, biometrics, quest history, and linked OAuth tokens at any time.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simply select <span className="text-white font-medium">"Data Deletion Request"</span> in the form or send a DM to our official Instagram <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">@{instagramHandle}</a> with your registered email identifier. Deletion is executed within 72 hours.
              </p>
            </div>

            {/* Quick FAQ Highlights */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Frequently Asked Questions</span>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-white">How do I download the mobile app?</h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visit <button onClick={() => setLocation("/download")} className="text-cyan-400 hover:underline">/download</button> or tap "Add to Home Screen" in your browser.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-white">What happens if I miss a quest?</h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your streak is protected if you have an active Mana Shield or invoke a Rest Day Protocol.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-white">Is Ascension Protocol free to use?</h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yes, core attribute calibration, daily quests, and local habit logging are completely free.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-900/80 bg-[#020617] px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-3">
          <button onClick={() => setLocation("/")} className="hover:text-cyan-400 transition-colors">Home</button>
          <span>•</span>
          <button onClick={() => setLocation("/about")} className="hover:text-cyan-400 transition-colors">About</button>
          <span>•</span>
          <button onClick={() => setLocation("/download")} className="hover:text-cyan-400 transition-colors">App Download</button>
          <span>•</span>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">Instagram</a>
          <span>•</span>
          <button onClick={() => setLocation("/privacy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</button>
          <span>•</span>
          <button onClick={() => setLocation("/terms")} className="hover:text-cyan-400 transition-colors">Terms of Service</button>
        </div>
        <p className="text-slate-600">© {new Date().getFullYear()} Ascension Protocol. All rights reserved.</p>
      </footer>
    </div>
  );
}
