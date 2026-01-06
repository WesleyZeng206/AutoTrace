'use client';

import { ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">AutoTrace</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <Link href="/login" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full">
              Open Source Telemetry Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Monitor Your App Performance in Real-Time
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Install our lightweight NPM package and instantly get powerful analytics on your dashboard. Track metrics, monitor errors, and optimize your application with ease.
            </p>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-emerald-400 p-4 rounded-lg font-mono shadow-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <span>npm install @wesleyzeng206/autotrace</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                View Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://github.com/WesleyZeng206/AutoTrace" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all">
                Documentation
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-300 to-indigo-300 rounded w-5/6"></div>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg p-4 h-24"></div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg p-4 h-24"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
