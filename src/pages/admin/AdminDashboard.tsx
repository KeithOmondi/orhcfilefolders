import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSubmissionTotals,
  getSubmissions,
  clearError,
  //type SubmissionTotals,
  type StationRequirementSummary,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { totals,  isLoading, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { accessToken, isInitializing, user } = useSelector((state: RootState) => state.auth);

  const [recentSubmissions, setRecentSubmissions] = useState<StationRequirementSummary[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isInitializing && accessToken) {
      dispatch(getSubmissionTotals());
      dispatch(getSubmissions({ page: 1, limit: 5 })).unwrap().then((result) => {
        setRecentSubmissions(result.submissions || []);
      });
    }
  }, [dispatch, accessToken, isInitializing]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Format date for display
  const formatDate = (dateString: string) => {
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

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
                Admin Dashboard · Ref RHC/DSCM/112
              </div>
              <h1 className="text-2xl font-semibold mb-2">
                Welcome back, {user?.fullName || user?.email || 'Admin'}!
              </h1>
              <p className="text-sm text-[#cdd6e0]">
                Overview of all station requirements submissions across the judiciary.
              </p>
            </div>
            <div className="text-right text-sm text-[#cdd6e0]">
              <p>{new Date().toLocaleDateString('en-KE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-6">
            ✗ {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Total Submissions</p>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totals?.totalSubmissions || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">File Folders</p>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totals?.totalFileFolders || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Case Registers</p>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totals?.totalRegisters || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Unique Stations</p>
                <p className="text-3xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totals?.uniqueStations || 0}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-full">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              <button 
                onClick={() => window.location.href = '/admin/submissions'}
                className="text-sm text-[#1e3a5f] hover:underline font-medium"
              >
                View All →
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading recent submissions...</p>
              </div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No submissions yet.</p>
                <p className="text-sm mt-1">Submissions will appear here once stations start submitting.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentSubmissions.map((submission, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{submission.station}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {submission.quarter}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {submission.fileFoldersTotal + submission.registersTotal}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatDate(submission.submittedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/admin/submissions'}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f5f0] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">View All Submissions</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button 
                onClick={() => window.location.href = '/dr/requirements'}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f5f0] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Submit New Requirements</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/reports'}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f5f0] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Generate Reports</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">System Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">All systems operational</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date().toLocaleTimeString('en-KE')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          © {new Date().getFullYear()} Judiciary Data Collection System · Ref RHC/DSCM/112
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;