import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalysisHistoryApi } from '../services/api';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import { History as HistoryIcon, FileText, ChevronRight, Search, Calendar, ShieldCheck } from 'lucide-react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getAnalysisHistoryApi();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) =>
    (item.file_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.risk_category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <HistoryIcon className="h-6 w-6 text-indigo-400" />
            <span>Analysis History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">View and review all past statement analysis reports</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <EducationalDisclaimer />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="divide-y divide-slate-800">
            {filteredHistory.map((item) => {
              let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
              if (item.risk_category === 'Medium') {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
              } else if (item.risk_category === 'High') {
                badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
              }

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">{item.file_name}</h4>
                      <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Total Volume</p>
                      <p className="text-xs font-semibold text-slate-200">
                        {formatCurrency(item.total_income)} / {formatCurrency(item.total_expense)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white">{item.credit_score}</span>
                      <span className={`block px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                        {item.risk_category.toUpperCase()} RISK
                      </span>
                    </div>

                    <Link
                      to={`/analysis/${item.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors"
                    >
                      <span>Report</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <HistoryIcon className="h-10 w-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold">No analysis history found.</p>
        </div>
      )}
    </div>
  );
};

export default History;
