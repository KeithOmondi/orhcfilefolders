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

// Shape of an entry in report.stations
interface StationStatus {
  station: string;
  submitterName?: string;
  status?: string;
  progress?: {
    fileFoldersComplete?: boolean;
    registersComplete?: boolean;
  };
  lastUpdatedAt?: string;
  hasSubmitted?: boolean; // Add this to track if station has submitted
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

  useEffect(() => {
    if (hasFetched.current || isInitializing || !accessToken) {
      return;
    }

    hasFetched.current = true;

    dispatch(getSubmissionTotals());
    dispatch(getAdminDashboard());
    dispatch(getStationReport({}));

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

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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

  // Simplified status colors - only Submitted and Not Submitted
  const getStatusColor = (status?: string): string => {
    if (status === 'submitted' || status === 'approved') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status?: string): string => {
    if (status === 'submitted' || status === 'approved') {
      return 'Submitted';
    }
    return 'Not Submitted';
  };

  const handleCardClick = (statusType: string, title: string) => {
    if (!report?.stations) return;

    let filteredStations: StationStatus[];

    if (statusType === 'submitted') {
      filteredStations = report.stations.filter(
        s => s.status === 'submitted' || s.status === 'approved'
      );
    } else {
      // Not Submitted includes: not_started, in_progress, pending_review, needs_revision, draft
      filteredStations = report.stations.filter(
        s => s.status !== 'submitted' && s.status !== 'approved'
      );
    }

    setModalTitle(title);
    setModalStations(filteredStations);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStations([]);
  };

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
  const draftsCount = totals?.draftsCount || 0;
  const submittedCount = totals?.submittedCount || 0;
  const submissionsToday = dashboardStats?.submissionsToday || 0;

  // Calculate station status from report
  const totalStations = report?.totalStations || 0;
  const stationList = report?.stations || [];
  
  // Count stations that have submitted (status === 'submitted' or 'approved')
  const submittedStations = stationList.filter(
    s => s.status === 'submitted' || s.status === 'approved'
  ).length;
  
  // Not submitted = total stations - submitted stations
  const notSubmittedStations = totalStations - submittedStations;

  // Debug logging to verify counts
  console.log('📊 Dashboard stats:', {
    totalStations,
    submittedStations,
    notSubmittedStations,
    stationListLength: stationList.length,
    stationStatuses: stationList.map(s => ({ station: s.station, status: s.status })),
  });

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

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-6">
            ✗ {error}
          </div>
        )}

        {/* Station Status Cards - Submitted vs Not Submitted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Submitted - Clickable */}
          <div
            onClick={() => handleCardClick('submitted', 'Submitted Stations')}
            className="bg-gradient-to-br from-[#12253d] to-[#1e3a5f] text-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#c9b98a]">Submitted</p>
                <p className="text-3xl font-bold mt-1">{submittedStations}</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-full">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#c9b98a]">
              {totalStations > 0 ? Math.round((submittedStations / totalStations) * 100) : 0}% of total
            </div>
            {submittedStations > 0 && (
              <div className="mt-2 text-xs text-emerald-300 hover:underline">
                Click to view details →
              </div>
            )}
          </div>

          {/* Card 2: Not Submitted - Clickable */}
          <div
            onClick={() => handleCardClick('not_submitted', 'Not Submitted Stations')}
            className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-gray-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Not Submitted</p>
                <p className="text-3xl font-bold text-gray-400 mt-1">{notSubmittedStations}</p>
              </div>
              <div className="bg-gray-100 p-2.5 rounded-full">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {totalStations > 0 ? Math.round((notSubmittedStations / totalStations) * 100) : 0}% of total
            </div>
            {notSubmittedStations > 0 && (
              <div className="mt-2 text-xs text-blue-600 hover:underline">
                Click to view details →
              </div>
            )}
          </div>
        </div>

        {/* Submission Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <p className="text-xs text-gray-500 mt-6 text-center">
          © {new Date().getFullYear()} Judiciary Data Collection System · Ref RHC/DSCM/112
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">

              <div className="bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 border-b-4 border-[#a3782e] flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
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