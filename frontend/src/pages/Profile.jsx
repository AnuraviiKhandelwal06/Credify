import React from 'react';
import { useAuth } from '../context/AuthContext';
import EducationalDisclaimer from '../components/EducationalDisclaimer';
import { User, Mail, Calendar, ShieldCheck, LogOut, Lock } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
          <User className="h-6 w-6 text-indigo-400" />
          <span>My Account</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">Account settings and user profile overview</p>
      </div>

      <EducationalDisclaimer />

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-500/25">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-xs text-indigo-400 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center space-x-1.5">
              <Mail className="h-3.5 w-3.5 text-indigo-400" />
              <span>Email Address</span>
            </span>
            <p className="text-sm font-medium text-slate-200">{user?.email}</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Member Since</span>
            </span>
            <p className="text-sm font-medium text-slate-200">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>Account Security</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account is secured with JWT authentication and encrypted password storage. Financial statements and analyses are strictly isolated to your registered user account.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-5 py-2.5 text-xs font-semibold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
