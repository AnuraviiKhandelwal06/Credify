import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Upload, LogOut, User, BarChart2 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Credify</span>
            <span className="ml-2 rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">Financial Analytics</span>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <Link
              to="/upload"
              className="hidden sm:flex items-center space-x-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Statement</span>
            </Link>

            <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
              <Link to="/profile" className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-semibold border border-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
