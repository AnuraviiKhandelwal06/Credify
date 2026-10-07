import React, { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const TransactionTable = ({ transactions = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.transaction_date || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'ALL' || t.transaction_type === filterType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Extracted Statement Transactions</h3>
          <p className="text-xs text-slate-400">Total {transactions.length} transactions processed by mapper</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description or date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer pr-8"
            >
              <option value="ALL">All Types</option>
              <option value="CREDIT">Credits Only</option>
              <option value="DEBIT">Debits Only</option>
            </select>
            <Filter className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {currentItems.length > 0 ? (
              currentItems.map((tx, idx) => {
                const isCredit = tx.transaction_type === 'CREDIT';
                return (
                  <tr key={tx.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{tx.transaction_date || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">{tx.description}</td>
                    <td className={`py-3 px-4 font-semibold font-mono text-right ${isCredit ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isCredit ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {isCredit ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-mono text-right font-medium ${tx.balance < 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {formatCurrency(tx.balance)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
