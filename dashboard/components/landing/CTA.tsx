'use client';

import { ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-10">
            Ready to Start Monitoring Your App?
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard" className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register" className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 font-medium">
              Create Account
            </Link>
          </div>

          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-blue-100 mb-6 font-medium">Built for Modern Development Teams</p>
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {['Real-time Monitoring', 'Team Collaboration', 'API Key Management', 'Multi-tenant Support'].map((feature) => (
                <div key={feature} className="text-white text-sm lg:text-base font-medium bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
