import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalysisHistoryApi, getAnalysisByIdApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreGauge from '../components/ScoreGauge';
import FinancialCard from '../components/FinancialCard';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import { UploadCloud, History, ArrowRight, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const historyRes = await getAnalysisHistoryApi();
        setHistory(historyRes.data);

        if (historyRes.data && historyRes.data.length > 0) {
          const latestId = historyRes.data[0].id;
          const detailRes = await getAnalysisByIdApi(latestId);
          setLatestAnalysis(detailRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome & Upload Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Welcome back, {user?.name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Financial Health Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Upload bank statements (CSV/PDF) to extract transactions and evaluate credit risk with automated ML analytics.
            </p>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
          >
            <UploadCloud className="h-5 w-5" />
            <span>Upload New Statement</span>
          </Link>
        </div>
      </div>

      <EducationalDisclaimer />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : latestAnalysis ? (
        <div className="space-y-8">
          {/* Latest Score Card + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Latest Credify Score</span>
              </div>

              <div className="pt-6">
                <ScoreGauge
                  score={latestAnalysis.credit_score}
                  riskCategory={latestAnalysis.risk_category}
                />
              </div>

              <Link
                to={`/analysis/${latestAnalysis.id}`}
                className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>View Full Analysis Report</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400 uppercase">Document Statement</span>
                    <h3 className="font-semibold text-slate-100 flex items-center space-x-2 mt-0.5">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span>{latestAnalysis.file_name}</span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Analyzed on {new Date(latestAnalysis.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <strong className="text-indigo-300 block mb-1">Score Explanation:</strong>
                  {latestAnalysis.score_explanation}
                </p>
              </div>

              <FinancialCard metrics={latestAnalysis.financial_metrics} />
            </div>
          </div>

          {/* Recent Analyses List */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-slate-100 flex items-center space-x-2">
                <History className="h-5 w-5 text-indigo-400" />
                <span>Recent Analyses ({history.length})</span>
              </h3>
              <Link to="/history" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>View All History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/80">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{item.file_name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">{item.credit_score}</span>
                      <span className={`block text-[10px] font-semibold ${
                        item.risk_category === 'Low' ? 'text-emerald-400' : (item.risk_category === 'Medium' ? 'text-amber-400' : 'text-rose-400')
                      }`}>
                        {item.risk_category.toUpperCase()} RISK
                      </span>
                    </div>

                    <Link
                      to={`/analysis/${item.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No financial analysis yet.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Upload your first statement to generate your Credify Score.
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all"
            >
              <span>Upload Statement Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
