// src/pages/Login.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  // Derive step directly from state rather than syncing via useEffect
  const step = maskedEmail ? 'otp' : 'pj';

  // Where user originally wanted to go before redirect to login
  const from = (location.state as LocationState)?.from?.pathname;

  // Redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const welcomeMessage = `Welcome back${user.fullName ? `, ${user.fullName}` : ''}!`;
      toast.success(welcomeMessage);
      
      // Determine default redirect path based on user role
      const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      const redirectPath = from || defaultPath;
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate, from]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Step 1 Submit: Request OTP
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
      
      // If the response includes a masked email, log it for debugging
      if (result?.email) {
        console.debug('OTP sent to:', result.email);
      }
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to send verification code.';
      toast.error(errorMessage);
    }
  }, [dispatch, pjNumber]);

  // Step 2 Submit: Verify OTP
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
      // Success will be handled by the useEffect redirect
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Verification failed. Please try again.';
      toast.error(errorMessage);
      // Clear OTP on failure so user can retry
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
      // Clear OTP to prevent confusion
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
    // Focus the PJ number input after reset
    setTimeout(() => {
      const pjInput = document.getElementById('pjNumber') as HTMLInputElement;
      if (pjInput) {
        pjInput.focus();
      }
    }, 0);
  }, [dispatch]);

  // Handle OTP input change with validation
  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 6) {
      setOtp(value);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
          <p className="text-sm text-slate-600 mt-1">
            {step === 'pj' 
              ? 'Enter your PJ Number to receive a verification code' 
              : `Verification code sent to ${maskedEmail || 'your email'}`}
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: PJ Number Form */}
        {step === 'pj' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="pjNumber" className="block text-sm font-medium text-slate-700 mb-1">
                PJ Number
              </label>
              <input
                id="pjNumber"
                type="text"
                required
                placeholder="e.g. PJ-12345"
                value={pjNumber}
                onChange={(e) => setPjNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 placeholder-slate-400"
                disabled={isLoading}
                autoFocus
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !pjNumber.trim()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Request Verification Code'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                Verification Code (OTP)
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={handleOtpChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg tracking-widest text-center font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 placeholder-slate-400"
                disabled={isLoading}
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="mt-1 text-xs text-slate-500">
                Enter the 6-digit code sent to {maskedEmail || 'your email'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify & Sign In'
              )}
            </button>

            {/* Back & Resending Controls */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleBackToPj}
                className="text-slate-500 hover:text-slate-800 font-medium underline transition-colors duration-150"
                disabled={isLoading}
              >
                ← Change PJ Number
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleResendOtp}
                className="text-emerald-600 hover:text-emerald-800 font-medium underline disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;