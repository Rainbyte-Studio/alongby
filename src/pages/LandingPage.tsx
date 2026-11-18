import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowRight, CheckCircle2, ShieldCheck, Layers, Users, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup', role?: 'client' | 'professional') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Editorial Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 bg-linear-to-b from-white to-neutral-50/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-white text-xs font-medium text-neutral-800 mb-8 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            <span>Curated Managed Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif tracking-tight text-neutral-950 leading-[1.15] mb-6">
            Your project. <br className="hidden sm:inline" />
            The right professional.
          </h1>

          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Tell us what you need. Alongby finds a curated selection of vetted professionals carefully matched to your requirements. You choose who feels right.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onOpenAuth('signup', 'client')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start a Project
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenAuth('signup', 'professional')}
            >
              Join as a Professional
            </Button>
          </div>

          <p className="mt-4 text-xs text-neutral-400">
            No public bidding wars • 2–3 vetted recommendations • Staged milestone protection
          </p>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">
            The Alongby Process
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 tracking-tight">
            How curated matching works
          </h3>
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
            We replaced the noise of open directories with a human, managed workflow designed for clarity and trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col p-6 rounded-xl bg-white border border-neutral-200/80">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold mb-5 font-mono">
              01
            </div>
            <h4 className="text-base font-semibold text-neutral-900 mb-2">
              Define your brief
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Share your project scope, timeline, and indicative budget through a structured, guided brief.
            </p>
          </div>

          <div className="flex flex-col p-6 rounded-xl bg-white border border-neutral-200/80">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold mb-5 font-mono">
              02
            </div>
            <h4 className="text-base font-semibold text-neutral-900 mb-2">
              Curated shortlist
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We score verified professionals against your requirements and present 2–3 qualified candidates with custom quotes.
            </p>
          </div>

          <div className="flex flex-col p-6 rounded-xl bg-white border border-neutral-200/80">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold mb-5 font-mono">
              03
            </div>
            <h4 className="text-base font-semibold text-neutral-900 mb-2">
              Contract & Protection
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Select your match, agree on a structured proposal, and sign an immutable project contract with staged payment milestones.
            </p>
          </div>

          <div className="flex flex-col p-6 rounded-xl bg-white border border-neutral-200/80">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold mb-5 font-mono">
              04
            </div>
            <h4 className="text-base font-semibold text-neutral-900 mb-2">
              Phased Delivery
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Collaborate inside a dedicated workspace. Review milestone deliverables with clear approval triggers and managed payouts.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section id="principles" className="py-16 md:py-24 bg-neutral-50/70 border-t border-neutral-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">
              Product Principles
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 tracking-tight">
              A managed service, not a gig directory
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900 mb-2">
                Curated, Never Crowded
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                No browsing hundreds of unvetted profiles. We verify professional credentials, past project delivery, and live capacity before matching.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900 mb-2">
                Staged Commercial Protection
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Two clear phases: Deposit and Final Delivery. Funds are secured and only released upon your explicit milestone approval.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-neutral-900 mb-2">
                Zero Price Degradation
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We eliminate underbidding races. Professionals submit realistic, structured commercial proposals reflecting high-calibre craftsmanship.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to action footer banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-neutral-200/80 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-serif font-bold text-neutral-950 mb-4">
            Ready to bring your digital vision to life?
          </h3>
          <p className="text-sm text-neutral-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Begin with a straightforward brief. Receive a tailored shortlist of 2–3 vetted professionals ready to start.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onOpenAuth('signup', 'client')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start a Project with Alongby
          </Button>
        </div>
      </section>
    </div>
  );
};
