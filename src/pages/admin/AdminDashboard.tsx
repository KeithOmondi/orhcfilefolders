// AdminDashboard.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSubmissionTotals,
  getSubmissions,
  getAdminDashboard,
  getStationReport,
  clearError,
  type StationRequirementSummary,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

// Shape of an entry in report.stations — used by both the main table and the modal
interface StationStatus {
  station: string;
  submitterName?: string;
  status?: string;
  progress?: {
    fileFoldersComplete?: boolean;
    registersComplete?: boolean;
  };
  lastUpdatedAt?: string;
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { totals, isLoading, error, dashboardStats, report } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { accessToken, isInitializing, user } = useSelector((state: RootState) => state.auth);

  const [recentSubmissions, setRecentSubmissions] = useState<StationRequirementSummary[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const hasFetched = useRef(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStations, setModalStations] = useState<StationStatus[]>([]);

  // Fetch dashboard data - using a ref to prevent multiple calls
  useEffect(() => {
    if (hasFetched.current || isInitializing || !accessToken) {
      return;
    }

    hasFetched.current = true;

    // Fetch totals and dashboard stats
    dispatch(getSubmissionTotals());
    dispatch(getAdminDashboard());
    dispatch(getStationReport({}));

    // Fetch recent submissions
    dispatch(getSubmissions({
      page: 1,
      limit: 5,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      adminView: true,
    })).unwrap()
      .then((result) => {
        setRecentSubmissions(result.submissions || []);
        setIsLoadingSubmissions(false);
      })
      .catch((err) => {
        console.error('Failed to fetch recent submissions:', err);
        setIsLoadingSubmissions(false);
      });
  }, [dispatch, accessToken, isInitializing]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
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

  // Get status badge color for submission status
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'needs_revision':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'pending_review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status display text
  const getStatusText = (status?: string): string => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'needs_revision':
        return 'Needs Revision';
      case 'draft':
        return 'Draft';
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'pending_review':
        return 'Pending Review';
      default:
        return 'Unknown';
    }
  };

  // Handle card click to open modal
  const handleCardClick = (statusType: string, title: string) => {
    if (!report?.stations) return;

    let filteredStations: StationStatus[];

    switch (statusType) {
      case 'not_started':
        filteredStations = report.stations.filter(s => s.status === 'not_started');
        break;
      case 'in_progress':
        filteredStations = report.stations.filter(s => s.status === 'in_progress');
        break;
      case 'submitted':
        filteredStations = report.stations.filter(
          s => s.status === 'submitted' ||
               s.status === 'pending_review' ||
               s.status === 'approved' ||
               s.status === 'needs_revision'
        );
        break;
      default:
        filteredStations = [];
    }

    setModalTitle(title);
    setModalStations(filteredStations);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStations([]);
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

  // Calculate summary stats
  const totalSubmissions = totals?.totalSubmissions || 0;
  const totalFileFolders = totals?.totalFileFolders || 0;
  const totalRegisters = totals?.totalRegisters || 0;
  const pendingReviews = dashboardStats?.pendingReviews || 0;
  const draftsCount = totals?.draftsCount || 0;
  const submittedCount = totals?.submittedCount || 0;
  const submissionsToday = dashboardStats?.submissionsToday || 0;

  // Station status breakdown from report
  const stationsByStatus = report?.stationsByStatus || {};
  const totalStations = report?.totalStations || 0;
  const notStartedCount = stationsByStatus['not_started'] || 0;

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

        {/* Station Status Cards - Only 2 Cards: Total Stations and Not Started */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Total Stations */}
          <div className="bg-gradient-to-br from-[#12253d] to-[#1e3a5f] text-white rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#c9b98a]">Total Stations</p>
                <p className="text-3xl font-bold mt-1">{totalStations}</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-full">
                <svg className="w-6 h-6 text-[#c9b98a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Not Started - Clickable */}
          <div
            onClick={() => handleCardClick('not_started', 'Not Started Stations')}
            className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-gray-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Not Started</p>
                <p className="text-3xl font-bold text-gray-400 mt-1">{notStartedCount}</p>
              </div>
              <div className="bg-gray-100 p-2.5 rounded-full">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {totalStations > 0 ? Math.round((notStartedCount / totalStations) * 100) : 0}% of total
            </div>
            {notStartedCount > 0 && (
              <div className="mt-2 text-xs text-blue-600 hover:underline">
                Click to view details →
              </div>
            )}
          </div>
        </div>

        {/* Submission Stats Cards - 4 Cards (omitted: In Progress, Submitted, Pending Reviews, Needs Revision) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Submissions */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totalSubmissions}
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded-full">
                <svg className="w-4 h-4 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {submittedCount} submitted · {draftsCount} drafts
            </div>
          </div>

          {/* Card 2: File Folders */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">File Folders</p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totalFileFolders.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50 p-2 rounded-full">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Registers */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Case Registers</p>
                <p className="text-2xl font-bold text-[#1e3a5f] mt-1">
                  {isLoading ? '...' : totalRegisters.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded-full">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 4: Today's Submissions */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Today's Submissions</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {isLoading ? '...' : submissionsToday}
                </p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-full">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions & Quick Actions */}
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

            {isLoadingSubmissions ? (
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">File Folders</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Registers</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentSubmissions.map((submission, index) => (
                      <tr key={submission.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{submission.station}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {submission.fileFoldersTotal}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {submission.registersTotal}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatDate(submission.updatedAt)}
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
                onClick={() => window.location.href = '/admin/review-queue'}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f5f0] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Review Queue</span>
                {pendingReviews > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingReviews}
                  </span>
                )}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f7f5f0] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Manage Users</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

        {/* Station Status Table */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Station Submission Status</h2>
            <span className="text-xs text-gray-500">{report?.totalStations || 0} total stations</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading station status...</p>
            </div>
          ) : !report?.stations || report.stations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No station data available.</p>
              <p className="text-sm mt-1">Station data will appear once DRs are assigned to stations and submissions are made.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned DR</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">File Folders</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Registers</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.stations.map((station, index) => (
                    <tr key={station.station || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{station.station}</td>
                      <td className="px-4 py-3 text-gray-600">{station.submitterName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                          {getStatusText(station.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {station.progress?.fileFoldersComplete ? (
                          <span className="text-green-600 font-semibold">✅</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {station.progress?.registersComplete ? (
                          <span className="text-green-600 font-semibold">✅</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(station.lastUpdatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          © {new Date().getFullYear()} Judiciary Data Collection System · Ref RHC/DSCM/112
        </p>
      </div>

      {/* Modal - Only for Not Started */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 border-b-4 border-[#a3782e] flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalTitle}
                  </h2>
                  <p className="text-xs text-[#cdd6e0] mt-1 font-medium">
                    {modalStations.length} station{modalStations.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {modalStations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-slate-600">No stations found in this category.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned DR</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {modalStations.map((station, index) => (
                          <tr key={station.station || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{station.station}</td>
                            <td className="px-4 py-3 text-gray-600">{station.submitterName || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                                {getStatusText(station.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDate(station.lastUpdatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Total: {modalStations.length} station{modalStations.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-[#1e3a5f] hover:bg-[#12253d] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;