import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnalysisByIdApi } from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import RiskCard from '../components/RiskCard';
import FinancialCard from '../components/FinancialCard';
import TransactionTable from '../components/TransactionTable';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { ShieldCheck, FileText, ArrowLeft, BarChart3, TrendingUp, Info } from 'lucide-react';

const Analysis = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await getAnalysisByIdApi(id);
        setAnalysis(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Analysis report not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-rose-400">Analysis Not Found</h3>
        <p className="text-xs text-slate-400">{error || "The requested credit analysis record could not be loaded."}</p>
        <Link to="/dashboard" className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Prepare chart data defensively from transactions
  const transactions = Array.isArray(analysis?.transactions) ? analysis.transactions : [];
  
  // Group transactions by month for Income vs Expense chart
  const monthlyDataMap = {};
  transactions.forEach((tx) => {
    const rawDate = tx && tx.transaction_date ? String(tx.transaction_date).trim() : '';
    let monthKey = 'Current';
    if (rawDate) {
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          monthKey = `${parts[1]}/${parts[2]}`;
        } else if (parts.length === 2) {
          monthKey = `${parts[0]}/${parts[1]}`;
        } else {
          monthKey = rawDate.substring(0, 7);
        }
      } else if (rawDate.includes('-')) {
        monthKey = rawDate.substring(0, 7);
      } else {
        monthKey = rawDate.substring(0, 7);
      }
    }

    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { month: monthKey, income: 0, expenses: 0 };
    }
    const amt = Number(tx?.amount) || 0;
    if (tx?.transaction_type === 'CREDIT') {
      monthlyDataMap[monthKey].income += amt;
    } else {
      monthlyDataMap[monthKey].expenses += amt;
    }
  });

  const monthlyChartData = Object.values(monthlyDataMap).map(d => ({
    month: d.month,
    Income: Math.round(Number(d.income) || 0),
    Expenses: Math.round(Number(d.expenses) || 0)
  }));

  // Balance Trend line chart data
  const balanceTrendData = transactions.map((tx, idx) => {
    const rawDate = tx && tx.transaction_date ? String(tx.transaction_date).trim() : '';
    let nameKey = `Tx ${idx + 1}`;
    if (rawDate) {
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length >= 2) nameKey = `${parts[0]}/${parts[1]}`;
      } else {
        nameKey = rawDate.substring(5) || rawDate;
      }
    }
    const bal = Number(tx?.balance) || 0;
    return {
      name: nameKey,
      Balance: Math.round(bal)
    };
  });

  const metrics = analysis?.financial_metrics || {};
  const riskProbs = analysis?.risk_probabilities || { Low: 0, Medium: 0, High: 0 };
  const formattedDate = analysis?.created_at 
    ? (() => { try { return new Date(analysis.created_at).toLocaleString(); } catch(e) { return String(analysis.created_at); } })()
    : new Date().toLocaleString();

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 font-semibold mb-1 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            <span>Credit Risk Analysis Report</span>
          </h1>
          <p className="text-xs text-slate-400">Document: {analysis?.file_name || "Bank Statement"}</p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Generated on {formattedDate}
        </div>
      </div>

      <EducationalDisclaimer />

      {/* Main Score & Risk Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Credify Score</span>
          </div>

          <div className="pt-6">
            <ScoreGauge
              score={Number(analysis?.credit_score) || 300}
              riskCategory={analysis?.risk_category || "Low"}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <RiskCard probabilities={riskProbs} />
          <FinancialCard metrics={metrics} />
        </div>
      </div>

      {/* ML Feature Analysis & Score Explanation */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Info className="h-5 w-5 text-indigo-400" />
          <span>ML Feature Analysis & Score Explanation</span>
        </h3>

        <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          {analysis?.score_explanation || "No score explanation available."}
        </p>

        {/* Feature Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Income Stability</span>
            <span className="text-sm font-bold text-emerald-400">
              {Math.round((metrics.income_stability || 0) * 100)}%
            </span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expense Ratio</span>
            <span className="text-sm font-bold text-amber-400">
              {Math.round((metrics.expense_ratio || 0) * 100)}%
            </span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Large Transactions</span>
            <span className="text-sm font-bold text-purple-400">
              {metrics.large_transaction_count || 0}
            </span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Negative Balances</span>
            <span className={metrics.negative_balance_count > 0 ? "text-sm font-bold text-rose-400" : "text-sm font-bold text-emerald-400"}>
              {metrics.negative_balance_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Monthly Income vs Expenses</h3>
          </div>

          <div className="h-64 w-full">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No monthly chart data available
              </div>
            )}
          </div>
        </div>

        {/* Balance Trend Chart */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Account Balance Trend</h3>
          </div>

          <div className="h-64 w-full">
            {balanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="Balance" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No balance trend data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <TransactionTable transactions={transactions} />
    </div>
  );
};

export default Analysis;

