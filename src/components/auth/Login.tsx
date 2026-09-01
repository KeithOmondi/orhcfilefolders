// src/pages/Login.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Lock, 
  User, 
  CheckCircle2 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMaskedEmail, requestOtp, verifyOtp } from '../../store/slices/authSlice';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user, maskedEmail, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  const [pjNumber, setPjNumber] = useState('');
  const [otp, setOtp] = useState('');

  // Step state
  const step = maskedEmail ? 'otp' : 'pj';
  const from = (location.state as LocationState)?.from?.pathname;

  // Redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const welcomeMessage = `Welcome back${user.fullName ? `, ${user.fullName}` : ''}!`;
      toast.success(welcomeMessage);
      
      const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      const redirectPath = from || defaultPath;
      
      const timer = setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate, from]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Step 1: Request OTP
  const handleRequestOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pjNumber.trim()) {
      toast.error('Please enter your PJ Number');
      return;
    }
    
    dispatch(clearError());

    try {
      const result = await dispatch(requestOtp({ pjNumber: pjNumber.trim() })).unwrap();
      toast.success('Verification code sent successfully!');
      
      if (result?.email) {
        console.debug('OTP sent to:', result.email);
      }
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to send verification code.';
      toast.error(errorMessage);
    }
  }, [dispatch, pjNumber]);

  // Step 2: Verify OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    
    if (otp.length < 4) {
      toast.error('Verification code must be at least 4 digits');
      return;
    }
    
    dispatch(clearError());

    try {
      await dispatch(verifyOtp({ pjNumber: pjNumber.trim(), otp: otp.trim() })).unwrap();
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Verification failed. Please try again.';
      toast.error(errorMessage);
      setOtp('');
    }
  }, [dispatch, pjNumber, otp]);

  // Resend OTP Code
  const handleResendOtp = useCallback(async () => {
    if (!pjNumber.trim()) {
      toast.error('PJ Number not found');
      return;
    }
    
    dispatch(clearError());
    
    try {
      await dispatch(requestOtp({ pjNumber: pjNumber.trim() })).unwrap();
      toast.success('A new verification code has been sent!');
      setOtp('');
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to resend code.';
      toast.error(errorMessage);
    }
  }, [dispatch, pjNumber]);

  // Reset back to Step 1
  const handleBackToPj = useCallback(() => {
    dispatch(clearError());
    dispatch(clearMaskedEmail());
    setOtp('');
    setTimeout(() => {
      const pjInput = document.getElementById('pjNumber') as HTMLInputElement;
      if (pjInput) {
        pjInput.focus();
      }
    }, 50);
  }, [dispatch]);

  // Handle OTP input change
  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-8 sm:p-10 transition-all">
        
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
            step === 'pj' 
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20' 
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
            1. Identity
          </span>
          <div className={`w-8 h-[2px] transition-colors ${step === 'otp' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
            step === 'otp' 
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${step === 'otp' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
            2. Verification
          </span>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 shadow-inner ring-1 ring-emerald-500/10">
            {step === 'pj' ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-slate-900">
            {step === 'pj' ? 'Sign in to Portal' : 'Security Check'}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {step === 'pj' 
              ? 'Enter your assigned PJ Number to proceed' 
              : 'Enter the verification code sent to your registered address'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200/80 text-red-700 text-sm flex items-start space-x-3 shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* STEP 1: PJ Number Form */}
        {step === 'pj' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label htmlFor="pjNumber" className="block font-serif text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                PJ Number
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="pjNumber"
                  type="text"
                  required
                  placeholder="e.g. 12345"
                  value={pjNumber}
                  onChange={(e) => setPjNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all"
                  disabled={isLoading}
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !pjNumber.trim()}
              className="w-full py-3 font-serif px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-emerald-600/10 transition-all duration-150 flex items-center justify-center space-x-2 group cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              {/* Masked Email Pill Notice */}
              <div className="mb-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                <span className="truncate">Sent to <strong className="font-semibold">{maskedEmail || 'your email'}</strong></span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
              </div>

              <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 text-center">
                6-Digit Verification Code
              </label>
              
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={handleOtpChange}
                className="w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl tracking-[0.35em] text-center font-bold text-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 placeholder-slate-300 transition-all"
                disabled={isLoading}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-emerald-600/10 transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
              ) : (
                <span>Verify & Sign In</span>
              )}
            </button>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-medium">
              <button
                type="button"
                onClick={handleBackToPj}
                className="text-slate-500 hover:text-slate-800 transition-colors duration-150 flex items-center space-x-1 py-1 cursor-pointer"
                disabled={isLoading}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change PJ</span>
              </button>
              
              <button
                type="button"
                disabled={isLoading}
                onClick={handleResendOtp}
                className="text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 transition-colors duration-150 flex items-center space-x-1 py-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;