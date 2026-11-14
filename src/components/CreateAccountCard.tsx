import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  ADMIN_REMOVED_PROFILE_NOTICE,
  EMAIL_CONFIRMATION_MESSAGE,
  UserAccount,
  evaluateSignUpOutcome,
  isAdminEmail,
  markExplicitLoginIntent,
  validateAccountInput,
  verifyAdminPin,
} from '../utils/tutorEngine';
import { supabase } from '../supabaseClient.js';

interface CreateAccountCardProps {
  currentUser: UserAccount | null;
  authMode?: 'signup' | 'signin';
  onAuthModeChange?: (mode: 'signup' | 'signin') => void;
  authGuardNotice?: string | null;
  onAuthenticated: (user: UserAccount) => void;
  onSignOut: () => void;
  onContinueToApp: () => void;
}

export const CreateAccountCard: React.FC<CreateAccountCardProps> = ({
  currentUser,
  authMode = 'signup',
  onAuthModeChange,
  authGuardNotice,
  onAuthenticated,
  onSignOut,
  onContinueToApp,
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>(authMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastErrorMsg, setToastErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(authMode);
  }, [authMode]);

  const redirectToHome = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // Ignore history API restrictions in sandboxed iframes
    }
    onContinueToApp();
  };

  const handleSwitchMode = (
    targetMode: 'signup' | 'signin',
    options?: { preserveInfo?: boolean; prefillEmail?: string }
  ) => {
    setMode(targetMode);
    onAuthModeChange?.(targetMode);
    setErrorMsg(null);
    setToastErrorMsg(null);
    if (!options?.preserveInfo) {
      setInfoMsg(null);
    }
    if (typeof options?.prefillEmail === 'string') {
      setEmail(options.prefillEmail);
    }
    try {
      window.history.replaceState(
        {},
        '',
        targetMode === 'signin' ? '/login' : '/signup'
      );
    } catch {
      // Ignore history API restrictions
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const validation = validateAccountInput(mode, fullName, email, password);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check your email and password.');
      return;
    }

    const trimmedEmail = email.trim();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        const outcome = evaluateSignUpOutcome(
          Boolean(data?.session),
          error?.message,
          trimmedEmail
        );

        if (outcome.errorMessage) {
          setErrorMsg(outcome.errorMessage);
          return;
        }

        // Do NOT auto-login after signUp: if Supabase created a session, sign out immediately
        if (outcome.shouldSignOutTempSession) {
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore signOut error
          }
        }

        // Pre-fill the email field, clear password/name, show success message, and redirect to Sign In page
        const successText = outcome.infoMessage || EMAIL_CONFIRMATION_MESSAGE;
        setFullName('');
        setPassword('');
        setEmail(outcome.prefilledEmail || trimmedEmail);
        setInfoMsg(successText);
        handleSwitchMode('signin', {
          preserveInfo: true,
          prefillEmail: outcome.prefilledEmail || trimmedEmail,
        });
        return;
      } else {
        markExplicitLoginIntent();
        if (isAdminEmail(trimmedEmail) && verifyAdminPin(password).valid) {
          const adminUser: UserAccount = {
            id: 'admin-drabirm4',
            fullName: 'drabirm4',
            email: 'drabirm4@gmail.com',
            provider: 'email',
            createdAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };
          onAuthenticated(adminUser);
          redirectToHome();
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        // Only redirect when a real session exists after login
        if (!data?.session || !data?.user) {
          setInfoMsg(EMAIL_CONFIRMATION_MESSAGE);
          return;
        }

        const signedInUser: UserAccount = {
          id: data.session.user.id,
          fullName:
            data.session.user.user_metadata?.full_name ||
            trimmedEmail.split('@')[0] ||
            'User',
          email: data.session.user.email || trimmedEmail,
          provider: 'email',
          createdAt: new Date(
            data.session.user.created_at || Date.now()
          ).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };

        onAuthenticated(signedInUser);
        redirectToHome();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to connect to Supabase Auth.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg(null);
    setToastErrorMsg(null);
    setInfoMsg(null);
    setIsGoogleLoading(true);
    try {
      markExplicitLoginIntent();
      // Allow React to paint the "Connecting to Google..." spinner before browser redirect begins
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setToastErrorMsg(error.message);
        setIsGoogleLoading(false);
        return;
      }
      // Keep "Connecting to Google..." spinner visible while redirecting;
      // fallback reset if navigation is blocked inside a sandboxed preview iframe
      window.setTimeout(() => {
        setIsGoogleLoading(false);
      }, 6000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(message);
      setToastErrorMsg(message);
      setIsGoogleLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    onSignOut();
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut network errors
    }
  };

  return (
    <section
      aria-label="Create Account and Authentication"
      className="min-h-[calc(100vh-130px)] w-full flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#E6ECFA] via-[#EEF1FA] to-[#E2E8F8] dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"
    >
      <div className="w-full max-w-[400px] rounded-[34px] bg-gradient-to-b from-white/95 to-[#F4F6FD]/95 dark:from-stone-900/95 dark:to-stone-900/90 p-8 sm:p-10 shadow-[0_24px_60px_-15px_rgba(91,55,242,0.16),0_8px_24px_-8px_rgba(15,23,42,0.06)] border border-white dark:border-stone-800 backdrop-blur-md">
        {/* Top Tutor Zone Brand Header */}
        <div className="flex flex-col items-center justify-center mb-5 gap-2.5">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-2 rounded-xl shadow-md shadow-emerald-600/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-900 dark:text-white">Tutor</span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Zone
              </span>
            </span>
          </div>
        </div>

        {currentUser ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authenticated Session</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome, {currentUser.fullName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
              {currentUser.email}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={redirectToHome}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-b from-[#633CFF] to-[#4E24E6] hover:from-[#5730F2] hover:to-[#421AD6] text-white font-semibold text-sm shadow-[0_10px_22px_-4px_rgba(84,41,232,0.45)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Go to Home Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full py-3.5 px-6 rounded-full bg-white dark:bg-stone-800 hover:bg-slate-50 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-200 font-semibold text-sm border border-slate-200/90 dark:border-stone-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white text-center leading-tight">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1.5 mb-7 font-medium">
              {mode === 'signup'
                ? 'Join Tutor Zone to connect with verified educators.'
                : 'Welcome back to your Tutor Zone account.'}
            </p>

            {authGuardNotice && !errorMsg && !infoMsg && (
              <div
                role="alert"
                className={`mb-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-left shadow-2xs border ${
                  authGuardNotice === ADMIN_REMOVED_PROFILE_NOTICE
                    ? 'bg-rose-50/95 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
                    : 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 text-[#5E3BEE] dark:text-indigo-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  {authGuardNotice}
                </p>
              </div>
            )}

            {infoMsg && (
              <div
                role="status"
                className="mb-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50/95 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-4 py-3 text-left shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {infoMsg}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {mode === 'signup' && (
                <label className="flex items-center bg-white dark:bg-stone-800/90 border border-slate-200/80 dark:border-stone-700 rounded-2xl px-4 py-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.02)] focus-within:border-[#5E3BEE] focus-within:ring-2 focus-within:ring-[#5E3BEE]/15 transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    aria-label="Full Name"
                    placeholder="e.g. Rahim Hosen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 focus:outline-none"
                  />
                </label>
              )}

              <label className="flex items-center bg-white dark:bg-stone-800/90 border border-slate-200/80 dark:border-stone-700 rounded-2xl px-4 py-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.02)] focus-within:border-[#5E3BEE] focus-within:ring-2 focus-within:ring-[#5E3BEE]/15 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type="email"
                  aria-label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex items-center bg-white dark:bg-stone-800/90 border border-slate-200/80 dark:border-stone-700 rounded-2xl px-4 py-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.02)] focus-within:border-[#5E3BEE] focus-within:ring-2 focus-within:ring-[#5E3BEE]/15 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type="password"
                  aria-label={
                    mode === 'signup' ? 'Create a password' : 'Password'
                  }
                  placeholder={
                    mode === 'signup'
                      ? 'Create a password'
                      : 'Enter your password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-stone-100 placeholder:text-slate-400 focus:outline-none"
                />
              </label>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-b from-[#633CFF] to-[#4E24E6] hover:from-[#5730F2] hover:to-[#421AD6] disabled:opacity-60 text-white font-semibold text-sm shadow-[0_10px_22px_-4px_rgba(84,41,232,0.45)] transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isLoading
                    ? 'Please wait...'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Toast / Error Alert Banner */}
            {(errorMsg || toastErrorMsg) && (
              <div
                role="alert"
                className="mt-3.5 flex items-start gap-2 rounded-2xl bg-rose-50/95 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 px-3.5 py-2.5 text-left shadow-2xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 leading-relaxed">
                  {toastErrorMsg || errorMsg}
                </p>
              </div>
            )}

            {/* OR Divider Badge */}
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full border-t border-slate-200/70 dark:border-stone-700" />
              <span className="absolute px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 text-[10px] font-bold tracking-wider text-slate-400 uppercase shadow-2xs border border-slate-100 dark:border-stone-700">
                OR
              </span>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleOAuth}
              className="w-full py-3.5 px-6 rounded-full bg-white dark:bg-stone-800 hover:bg-slate-50/90 dark:hover:bg-stone-700 disabled:opacity-70 text-slate-700 dark:text-stone-200 font-semibold text-sm border border-slate-200/80 dark:border-stone-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)] flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2
                    className="w-4 h-4 shrink-0 animate-spin text-[#5E3BEE] dark:text-indigo-400"
                    aria-hidden="true"
                  />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-2 3l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1l-3.3 2.6C4.8 19.9 8.1 22 12 22z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.1 7.4C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6L6.4 14z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8.1 2 4.8 4.1 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Footer Sign in / Create account link */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-7 font-medium">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signin')}
                    className="text-[#5E3BEE] dark:text-indigo-400 font-semibold underline underline-offset-4 hover:text-[#4621D5] cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="text-[#5E3BEE] dark:text-indigo-400 font-semibold underline underline-offset-4 hover:text-[#4621D5] cursor-pointer"
                  >
                    Create account
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
};
