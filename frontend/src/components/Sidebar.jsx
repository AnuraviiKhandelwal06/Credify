import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, History, User, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload Statement', path: '/upload', icon: UploadCloud },
    { label: 'Analysis History', path: '/history', icon: History },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 rounded-2xl glass-card p-4 space-y-6">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>AI Financial Analysis</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Estimates financial risk & Credify Score (300-850) based on statement metrics.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
