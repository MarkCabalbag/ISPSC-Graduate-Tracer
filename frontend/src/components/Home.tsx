/**
 * =============================================================================
 * Home.tsx: public landing page of the Graduate Tracer System
 * =============================================================================
 *
 * PURPOSE
 * -------
 * First page alumni see. It explains the tracer study and sends them to the
 * survey. It has no props and makes no API calls.
 *
 * SECTIONS (top to bottom)
 * ------------------------
 *   1. Navigation          Site navigation bar.
 *   2. Hero                Title, welcome text, "Take Tracer Survey" button and
 *                          an "Explore Impact" link that scrolls to #impact.
 *   3. Key metrics (#impact)  Three highlight numbers (see METRICS).
 *   4. Feature grid        Three reasons to take part (see FEATURES).
 *   5. Call to action      Second "Start Your Tracer Survey" button.
 *   6. Footer              Logo, system name and copyright (current year).
 *
 * SURVEY FLOW
 * -----------
 *   Both survey buttons open the <ProceedToForm /> modal (state:
 *   `isProceedtoForm`). The modal shows the purpose and data privacy notice.
 *   When the user ticks the checkbox and presses Proceed, they are sent to
 *   "/form". To change the texts or the route, edit ./modal/ProceedToForm.
 *
 * HOW TO CHANGE THE CONTENT
 * -------------------------
 *   - Metrics and feature cards are plain data: edit METRICS / FEATURES below.
 *   - The metric values ("5,000+", "80%", "50+") are written by hand. They are
 *     not loaded from the database, so update them when the real numbers change.
 *
 * REQUIREMENTS
 * ------------
 *   - Must be rendered inside a react-router <Router> (the modal navigates).
 *   - <Toaster /> is mounted here, because the modal shows an error toast when
 *     the user has not agreed yet. Do not mount a second one in the same page.
 *   - Assets: ../assets/ispsc.png, ../assets/ispsc_campus_hero.jpg
 *   - Tailwind theme color `primary`.
 *
 * DEPENDENCIES
 * ------------
 *   react, framer-motion, react-hot-toast, lucide-react,
 *   ./Navigation, ./modal/ProceedToForm, ./ui/button
 *
 * @returns The full page as one <div>.
 * =============================================================================
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  Award,
  Briefcase,
  GraduationCap,
  Users,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import ispscLogo from "../assets/ispsc.png";
import campusHero from "../assets/ispsc_campus_hero.jpg";
import Navigation from "./Navigation";
import ProceedToForm from "./modal/ProceedToForm";
import { Button } from "./ui/button";

/* -----------------------------------------------------------------------------
 * Content
 * ---------------------------------------------------------------------------*/

type Metric = { icon: LucideIcon; value: string; label: string };

/** Numbers shown in the "Key Metrics" bar. Written by hand, not from the API. */
const METRICS: Metric[] = [
  { icon: Users, value: "5,000+", label: "Traced Graduates" },
  { icon: Briefcase, value: "80%", label: "Employment Rate" },
  { icon: Award, value: "50+", label: "Partner Industries" },
];

type Feature = { icon: LucideIcon; title: string; description: string };

/** Cards shown in "Why Your Participation Matters". */
const FEATURES: Feature[] = [
  {
    icon: GraduationCap,
    title: "Share Your Story",
    description:
      "Let your career trajectory and professional milestones inspire future generations of ISPSC scholars.",
  },
  {
    icon: Users,
    title: "Stay Connected",
    description:
      "Build robust professional networks, reconnect with batchmates, and discover exclusive alumni mentoring opportunities.",
  },
  {
    icon: ShieldCheck,
    title: "Shape ISPSC's Future",
    description:
      "Provide valuable feedback on industry relevance, ensuring our programs remain at the cutting edge of education.",
  },
];

/* -----------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------------*/

const Home = () => {
  const [isProceedtoForm, setProceedtoForm] = useState(false);

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-primary/20">
      <Navigation />
      <Toaster />

      {/* Hero Section with Cinematic Background */}
      <section className="relative overflow-hidden bg-neutral-900 text-white py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <img
            src={campusHero}
            alt="ISPSC Campus Graduation"
            className="w-full h-full object-cover opacity-30 scale-105 transform transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-amber-300 mb-6 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              Official Institutional Tracer Platform
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Ilocos Sur Polytechnic State College
            </h1>
            <p className="text-xl md:text-2xl font-light text-neutral-300 mb-8 max-w-2xl mx-auto">
              Stay Connected. Track Your Journey. Shape the Future.
            </p>

            <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
              Welcome back, ISPSC Alumni! Whether you're advancing in your
              career, pursuing higher studies, or pioneering new ventures, your
              success story helps us shape the next generation of leaders.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setProceedtoForm(true)}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 rounded-xl shadow-lg flex items-center gap-2 group text-base"
              >
                Take Tracer Survey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <a href="#impact">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold px-8 py-6 rounded-xl backdrop-blur-sm text-base"
                >
                  Explore Impact
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics Bar */}
      <section
        id="impact"
        className="border-b border-neutral-100 bg-neutral-50 py-12"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {METRICS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="bg-white p-8 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center gap-6"
              >
                <div className="p-4 bg-primary/10 rounded-xl text-primary">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900 tabular-nums">
                    {value}
                  </div>
                  <div className="text-sm font-medium text-neutral-500 mt-1">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Alumni Community Portal
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
            Why Your Participation Matters
          </h3>
          <p className="text-neutral-600 mt-4 text-base">
            Your insights directly drive curriculum enhancements, career
            placement opportunities, and institutional accreditation.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-neutral-50/50 p-8 rounded-2xl border border-neutral-200/80 hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-semibold text-neutral-900 mb-3">
                {title}
              </h4>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-primary py-20 text-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
            Ready to Share Your Journey?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 text-base">
            Take 5 minutes to complete the Graduate Tracer Survey and help us
            empower the next wave of graduates.
          </p>
          <Button
            onClick={() => setProceedtoForm(true)}
            size="lg"
            className="bg-white text-primary hover:bg-neutral-100 font-semibold px-8 py-6 rounded-xl text-base shadow-xl"
          >
            Start Your Tracer Survey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={ispscLogo}
              alt="ISPSC"
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-semibold text-white">
              Ilocos Sur Polytechnic State College — Graduate Tracer System
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            © {new Date().getFullYear()} ISPSC. All rights reserved. Data
            Privacy Act of 2012 compliant.
          </div>
        </div>
      </footer>

      {isProceedtoForm && (
        <ProceedToForm
          isOpen={isProceedtoForm}
          handleIsOpen={setProceedtoForm}
        />
      )}
    </div>
  );
};

export default Home;