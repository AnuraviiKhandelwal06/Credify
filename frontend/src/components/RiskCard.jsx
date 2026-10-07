import React from 'react';
import { Activity, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const RiskCard = ({ probabilities = { Low: 0, Medium: 0, High: 0 } }) => {
  const lowPct = Math.round((probabilities.Low || 0) * 100);
  const medPct = Math.round((probabilities.Medium || 0) * 100);
  const highPct = Math.round((probabilities.High || 0) * 100);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Activity className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100">ML Risk Probabilities</h3>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">predict_proba()</span>
      </div>

      <div className="space-y-4">
        {/* Low Risk */}
        <div>
          <div className="flex justify-between items-center text-sm font-medium mb-1.5">
            <span className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Low Risk</span>
            </span>
            <span className="font-semibold text-emerald-300">{lowPct}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${lowPct}%` }}
            />
          </div>
        </div>

        {/* Medium Risk */}
        <div>
          <div className="flex justify-between items-center text-sm font-medium mb-1.5">
            <span className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Medium Risk</span>
            </span>
            <span className="font-semibold text-amber-300">{medPct}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${medPct}%` }}
            />
          </div>
        </div>

        {/* High Risk */}
        <div>
          <div className="flex justify-between items-center text-sm font-medium mb-1.5">
            <span className="flex items-center space-x-2 text-red-400">
              <ShieldAlert className="h-4 w-4" />
              <span>High Risk</span>
            </span>
            <span className="font-semibold text-red-300">{highPct}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${highPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCard;
