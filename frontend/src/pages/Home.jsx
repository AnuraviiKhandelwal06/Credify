import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import { ShieldCheck, Cpu, FileSpreadsheet, BarChart3, ArrowRight, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Intelligent Credit Risk & Financial Health Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Understand your financial health with <span className="text-gradient">AI-powered financial analysis.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Upload bank statements to instantly extract transaction patterns, evaluate financial stability metrics, predict credit risk categories, and receive your estimated Credify Score (300–850).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl glass-card hover:bg-slate-800 px-7 py-3.5 text-sm font-medium text-slate-300 transition-colors"
              >
                <span>Sign In</span>
              </Link>
            </div>

            <div className="pt-6 max-w-2xl mx-auto">
              <EducationalDisclaimer compact={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How Credify Works</h2>
            <p className="text-sm text-slate-400 mt-2">Comprehensive financial assessment from document upload to score generation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                1
              </div>
              <h3 className="font-semibold text-white">Upload Statement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Securely upload structured CSV or PDF bank statements for automated parsing.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                2
              </div>
              <h3 className="font-semibold text-white">Financial Extraction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extract transaction dates, descriptions, credits, debits, and running balance history.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                3
              </div>
              <h3 className="font-semibold text-white">Risk Assessment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluate income stability, savings rate, expense ratios, and account overdraft risk.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30">
                4
              </div>
              <h3 className="font-semibold text-white">Credify Score & Insights</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                View your estimated 300–850 Credify Score alongside visual financial charts and explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Capabilities Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Everything you need for financial clarity</h2>
            <p className="text-sm text-slate-400 mt-2">Data-driven analysis built for personal and educational financial analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Automatic Statement Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Effortlessly processes diversos bank statement layouts with robust column mapping for credits, debits, and balance trends.
              </p>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">ML Risk Category Modeling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Predicts financial risk profiles (Low, Medium, High) backed by quantitative probability distributions.
              </p>
            </div>

            <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Visual Insights & Trends</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore cash flow trends, income vs expense breakdowns, savings rates, and transaction histories in a clean dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">Credify Financial Analysis</span>
          </div>
          <p>© 2026 Credify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
