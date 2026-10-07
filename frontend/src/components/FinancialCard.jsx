import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Percent } from 'lucide-react';

const FinancialCard = ({ metrics = {} }) => {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const savingsRatePct = Math.round((metrics.savings_rate || 0) * 100);
  const expenseRatioPct = Math.round((metrics.expense_ratio || 0) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Monthly Income */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-emerald-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Income</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(metrics.monthly_income)}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center space-x-1">
          <span>Income stability:</span>
          <strong className="text-emerald-400 font-semibold">{Math.round((metrics.income_stability || 0) * 100)}%</strong>
        </p>
      </div>

      {/* Monthly Expenses */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-red-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Expenses</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(metrics.monthly_expenses)}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ArrowDownRight className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center space-x-1">
          <span>Expense ratio:</span>
          <strong className="text-red-400 font-semibold">{expenseRatioPct}%</strong>
        </p>
      </div>

      {/* Savings Rate */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-indigo-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Savings Rate</p>
            <h3 className="text-2xl font-bold text-indigo-300 mt-1">{savingsRatePct}%</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Percent className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {savingsRatePct >= 30 ? '🔥 Healthy savings buffer' : '⚠️ Low savings buffer'}
        </p>
      </div>

      {/* Average Balance */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-purple-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Balance</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{formatCurrency(metrics.average_balance)}</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center space-x-1">
          <span>Negative balances:</span>
          <strong className={metrics.negative_balance_count > 0 ? "text-red-400" : "text-emerald-400"}>
            {metrics.negative_balance_count || 0}
          </strong>
        </p>
      </div>
    </div>
  );
};

export default FinancialCard;
