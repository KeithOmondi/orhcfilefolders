// DrDashboard.tsx

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMySubmissions,
  clearError,
  type StationRequirementSummary,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

const DrDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { submissions, isLoading, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { user, accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  // Calculate stats using useMemo - Simplified: Only Draft and Submitted
  const stats = useMemo(() => {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        draftsCount: 0,
        submittedCount: 0,
        totalFileFolders: 0,
        totalRegisters: 0,
      };
    }

    const draftCount = submissions.filter((s) => s.status === 'draft').length;
    const submittedCount = submissions.filter((s) => s.status === 'submitted').length;

    const totalFileFolders = submissions.reduce((sum, s) => sum + s.fileFoldersTotal, 0);
    const totalRegisters = submissions.reduce((sum, s) => sum + s.registersTotal, 0);

    return {
      totalSubmissions: submissions.length,
      draftsCount: draftCount,
      submittedCount: submittedCount,
      totalFileFolders,
      totalRegisters,
    };
  }, [submissions]);

  useEffect(() => {
    if (accessToken && !isInitializing) {
      dispatch(getMySubmissions({ page: 1, limit: 100 }));
    }
  }, [dispatch, accessToken, isInitializing]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Simplified status badge - only Draft and Submitted
  const getStatusBadge = (status: string): React.ReactNode => {
    if (status === 'draft') {
      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Draft</span>;
    }
    if (status === 'submitted') {
      return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Submitted</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">Unknown</span>;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-semibold">
            !
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  // Get recent submissions (last 5)
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800 antialiased pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 sm:p-8 rounded-xl shadow-md mb-8 border-b-4 border-[#a3782e]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[#c9b98a] text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#a3782e]"></span>
              Deputy Registrar Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome, {user?.fullName || 'Deputy Registrar'}
            </h1>
            <p className="text-sm sm:text-base text-[#cdd6e0] max-w-2xl">
              Overview of your station requirement submissions. Track your drafts and submitted forms.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <span className="font-bold">⚠️</span>
            <div className="text-sm">{error}</div>
            <button
              onClick={() => dispatch(clearError())}
              className="ml-auto text-rose-600 hover:text-rose-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Grid - Three Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Total File Folders */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total File Folders</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalFileFolders}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#a3782e] flex items-center justify-center text-lg">
                📁
              </div>
            </div>
          </div>

          {/* Card 2: Total Registers */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registers</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalRegisters}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                📖
              </div>
            </div>
          </div>

          {/* Card 3: Total Submissions with Status */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalSubmissions}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                📋
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Status:</span>
              {stats.draftsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  {stats.draftsCount} Draft{stats.draftsCount > 1 ? 's' : ''}
                </span>
              )}
              {stats.submittedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                  {stats.submittedCount} Submitted
                </span>
              )}
              {stats.totalSubmissions === 0 && (
                <span className="text-xs text-slate-400">No submissions</span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Submissions</h2>
            <span className="text-xs text-slate-500">{stats.totalSubmissions} total</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500">Loading submissions...</p>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                📋
              </div>
              <h3 className="text-base font-semibold text-slate-800">No submissions yet</h3>
              <p className="text-sm text-slate-500 mt-1">Start by creating your first station requirement submission.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Station</th>
                    <th className="px-6 py-3 text-right">File Folders</th>
                    <th className="px-6 py-3 text-right">Registers</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-sm">
                  {recentSubmissions.map((submission: StationRequirementSummary) => (
                    <tr key={submission.id || submission.station} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{submission.station}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                          {submission.fileFoldersTotal.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                          {submission.registersTotal.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {formatDate(submission.submittedAt || submission.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Deputy Registrar Dashboard · Last updated {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default DrDashboard;