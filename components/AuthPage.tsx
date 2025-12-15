

import React, { useState } from 'react';
import { Icons } from './Icons';
import { AuthService } from '../services/auth';
import { TermsModal } from './TermsModal';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (view === 'login') {
        await AuthService.login(email, password);
        onLoginSuccess();
      } else if (view === 'signup') {
        await AuthService.signup(name, email, password);
        onLoginSuccess();
      } else if (view === 'forgot') {
        await AuthService.recoverPassword(email);
        setSuccessMessage('If an account exists, a recovery email has been sent.');
        setIsLoading(false); // Stay on page to show message
        return;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      if (view !== 'forgot') setIsLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setError(null);
    setSuccessMessage(null);
    // Keep email filled if switching views, but clear password
    setPassword('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gray-50 dark:bg-[#050505]">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px] animate-pulse delay-700" />

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <span className="text-white font-bold text-3xl">O</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Omi Manager</h1>
          <p className="text-gray-500 dark:text-white/40 mt-2">Manage your digital memory.</p>
        </div>

        <div className="glass-panel p-8 rounded-[32px] bg-white/60 dark:bg-[#151519]/80 border border-white/40 dark:border-white/10 shadow-2xl backdrop-blur-xl">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {view === 'login' && 'Welcome back'}
              {view === 'signup' && 'Create an account'}
              {view === 'forgot' && 'Reset password'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {view === 'login' && 'Enter your credentials to access your account.'}
              {view === 'signup' && 'Join us to start organizing your conversations.'}
              {view === 'forgot' && 'Enter your email to receive a recovery link.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
              <Icons.Alert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-sm text-green-600 dark:text-green-400 animate-in slide-in-from-top-2">
              <Icons.CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {view === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider ml-1">Name</label>
                <div className="relative">
                  <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/30" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Icons.Inbox className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">Password</label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Icons.Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/30" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Icons.Sync className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {view === 'login' && 'Sign In'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'forgot' && 'Send Recovery Link'}
                  <Icons.ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          {view === 'login' && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <button onClick={() => switchView('signup')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Sign up
              </button>
            </p>
          )}
          {view === 'signup' && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <button onClick={() => switchView('login')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Log in
              </button>
            </p>
          )}
          {view === 'forgot' && (
            <button onClick={() => switchView('login')} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm flex items-center gap-2 mx-auto transition-colors">
              <Icons.ChevronRight className="w-4 h-4 rotate-180" />
              Back to Login
            </button>
          )}
        </div>

        {/* Footer - Terms of Service */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowTerms(true)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
};
