import { HeroParallax } from "@/components/global/connect-parallax";
import NavBar from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { services } from "@/constants/landing-page";
import clsx from "clsx";
import { Check, Star, ArrowRight, MessageSquare, Calendar, Mail, Zap, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/contact-form";

export default async function Home() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative h-screen w-full bg-neutral-950 rounded-md !overflow-visible flex flex-col items-center justify-center antialiased">
        <div className="absolute inset-0 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/images/bookerbuddy-icon.png"
            width={175}
            height={50}
            alt="BookerBuddy Logo"
            className="mx-auto mb-5"
          />
          <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600 mb-6">
            Transform Your Business with AI-Powered Sales & CRM
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 mb-8 max-w-3xl mx-auto">
            Automate your sales process, engage customers 24/7, and close more deals with our intelligent chatbot and CRM solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#contact"
              className="px-8 py-4 text-xl rounded-full bg-white text-black hover:bg-neutral-200 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Contact Sales
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-neutral-400">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-neutral-400">AI Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-neutral-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">3x</div>
              <div className="text-neutral-400">Faster Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
            Everything You Need to Scale Your Business
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition-all duration-300">
              <MessageSquare className="w-12 h-12 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Chatbot</h3>
              <p className="text-neutral-400">Engage customers 24/7 with our intelligent chatbot that learns and improves over time.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition-all duration-300">
              <Calendar className="w-12 h-12 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Smart Scheduling</h3>
              <p className="text-neutral-400">Automate appointment booking and manage your calendar efficiently.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 transition-all duration-300">
              <Mail className="w-12 h-12 text-white mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Email Marketing</h3>
              <p className="text-neutral-400">Create targeted campaigns and track engagement with built-in analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatbot Feature Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Intelligent AI Chatbot
              </h2>
              <p className="text-xl text-neutral-400 mb-8">
                Our AI-powered chatbot understands context, learns from interactions, and provides personalized responses to your customers 24/7.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Natural Language Understanding</h4>
                    <p className="text-neutral-400">Advanced NLP capabilities for human-like conversations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">24/7 Customer Support</h4>
                    <p className="text-neutral-400">Always available to answer questions and provide assistance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Seamless Handoff</h4>
                    <p className="text-neutral-400">Smooth transition to human agents when needed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 relative" style={{ aspectRatio: '2618/1616' }}>
                <Image
                  src="/images/p1.png"
                  alt="AI Chatbot Interface"
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Booking Feature Section */}
      <section className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 relative" style={{ aspectRatio: '2598/1616' }}>
                <Image
                  src="/images/p2.png"
                  alt="Appointment Booking Interface"
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Smart Appointment Booking
              </h2>
              <p className="text-xl text-neutral-400 mb-8">
                Streamline your scheduling process with our intelligent booking system that adapts to your business needs.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Automated Scheduling</h4>
                    <p className="text-neutral-400">Let customers book appointments at their convenience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Calendar Integration</h4>
                    <p className="text-neutral-400">Syncs with your existing calendar systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Smart Reminders</h4>
                    <p className="text-neutral-400">Automated notifications to reduce no-shows</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Showcase */}
      <section className="py-12 bg-neutral-900">
        <HeroParallax services={services} />
      </section>

      {/* Contact Sales Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Get in Touch with Our Sales Team
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Contact us to learn more about how BookerBuddy can help your business grow.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-16">
            Trusted by Businesses Worldwide
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-neutral-300 mb-6 flex-grow">
                &quot;BookerBuddy completely transformed how I run my spa. I used to be exhausted juggling all the appointments and follow-ups. Now I finally have time to focus on what I love - actually connecting with my clients and growing my business.&quot;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-3 h-12 bg-purple-500 rounded-l-full"></div>
                <div>
                  <div className="font-medium text-white">Sarah Chen</div>
                  <div className="text-sm text-neutral-400">Owner, Rejuvenate Wellness Spa</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-neutral-300 mb-6 flex-grow">
                &quot;I was constantly missing potential clients because I couldn&apos;t respond fast enough. With BookerBuddy, I never miss an opportunity and finally feel like I can compete with the bigger agencies in town. It&apos;s been a game-changer for my confidence as a business owner.&quot;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-3 h-12 bg-purple-500 rounded-l-full"></div>
                <div>
                  <div className="font-medium text-white">Marcus Johnson</div>
                  <div className="text-sm text-neutral-400">Broker, Skyline Properties</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-neutral-300 mb-6 flex-grow">
                &quot;Our front desk staff was burning out from the endless phone calls and scheduling chaos. Since using BookerBuddy, I&apos;ve seen a complete change in our office atmosphere. Everyone is calmer, happier, and actually enjoys coming to work again.&quot;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-3 h-12 bg-purple-500 rounded-l-full"></div>
                <div>
                  <div className="font-medium text-white">Dr. Amelia Patel</div>
                  <div className="text-sm text-neutral-400">Director, Brightsmile Dental</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-12 rounded-3xl border border-purple-800/30">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
                Contact our sales team today to get a personalised demo and pricing tailored to your business needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#contact"
                  className="px-8 py-4 text-xl rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Contact Sales
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
