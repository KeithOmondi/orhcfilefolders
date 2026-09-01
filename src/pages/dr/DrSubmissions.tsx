// DrSubmissions.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getMySubmissions,
  getSubmissionById,
  clearError,
  clearCurrentSubmission,
  setPage,
  setLimit,
  resetPagination,
  type StationRequirementSummary,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

// Type for fetch params
type FetchSubmissionsParams = {
  station?: string;
  page: number;
  limit: number;
  sortBy: 'updatedAt' | 'submittedAt' | 'station';
  sortOrder: 'asc' | 'desc';
};

const DrSubmissions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { submissions, currentSubmission, isLoading, error, pagination } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  // Local UI-only state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stationFilter, setStationFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // Fetch DR's own submissions using the DR-specific endpoint
  const fetchSubmissions = useCallback(() => {
    if (!accessToken || isInitializing) return;

    const params: FetchSubmissionsParams = {
      station: stationFilter || undefined,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };

    console.log('📤 Fetching DR submissions with params:', params);
    dispatch(getMySubmissions(params));
  }, [dispatch, stationFilter, pagination.page, pagination.limit, accessToken, isInitializing]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Clear error and current submission on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentSubmission());
    };
  }, [dispatch]);

  // Handle Edit Draft - navigate to the form with draft ID
  const handleEditDraft = (submission: StationRequirementSummary) => {
    if (!submission.id) {
      console.error('No submission ID found for editing');
      return;
    }
    // Navigate to the edit form with the draft ID
    navigate(`/dr/requirements/edit/${submission.id}`);
  };

  // View submission details
  const handleViewSubmission = async (submission: StationRequirementSummary) => {
    setViewError(null);
    let submissionId: string | undefined = submission.id;

    if (!submissionId) {
      const found = submissions.find((s) => s.station === submission.station);
      if (found?.id) {
        submissionId = found.id;
      }
    }

    if (!submissionId) {
      setViewError('Could not locate submission ID. Please refresh and try again.');
      return;
    }

    setIsLoadingDetails(true);
    setIsModalOpen(true);

    try {
      await dispatch(getSubmissionById(submissionId)).unwrap();
      setViewError(null);
    } catch (err: unknown) {
      console.error('Failed to load submission details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submission details. Please try again.';
      setViewError(errorMessage);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setViewError(null);
    dispatch(clearCurrentSubmission());
  };

  const handleApplyFilters = (): void => {
    setStationFilter(searchTerm.trim());
    dispatch(setPage(1));
  };

  const handleClearFilters = (): void => {
    setSearchTerm('');
    setStationFilter('');
    dispatch(resetPagination());
  };

  const handlePageChange = (newPage: number): void => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setPage(newPage));
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    dispatch(setLimit(Number(e.target.value)));
    dispatch(setPage(1));
  };

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

  // Get status badge
  const getStatusBadge = (status: string, reviewStatus?: string): React.ReactNode => {
    if (status === 'draft') {
      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Draft</span>;
    }
    if (status === 'submitted') {
      if (reviewStatus === 'approved') {
        return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Approved</span>;
      }
      if (reviewStatus === 'needs_revision') {
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Needs Revision</span>;
      }
      if (reviewStatus === 'pending' || !reviewStatus) {
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">Pending Review</span>;
      }
      return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">Submitted</span>;
    }
    return null;
  };

 

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Initializing workspace...</p>
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
          <p className="text-sm text-slate-600">Please log in to access your submissions.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-800 antialiased pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Main Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 sm:p-8 rounded-xl shadow-md mb-8 border-b-4 border-[#a3782e]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-[#c9b98a] text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#a3782e]"></span>
              Deputy Registrar Dashboard · My Submissions
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              My Station Submissions
            </h1>
            <p className="text-sm sm:text-base text-[#cdd6e0] max-w-2xl">
              View and track your station requirement submissions. Drafts can be edited, submitted submissions are read-only.
            </p>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="searchStation" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Search by Station Name
              </label>
              <div className="relative">
                <input
                  id="searchStation"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Headquarters, Kisumu..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleApplyFilters}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#12253d] text-white font-medium text-sm rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f]"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
              >
                Reset
              </button>
            </div>
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

        {/* Table Toolbar / Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 px-1">
          <div className="text-sm text-slate-600 font-medium">
            Showing <span className="text-slate-900 font-semibold">{pagination.total > 0 ? startIndex : 0}</span> to{' '}
            <span className="text-slate-900 font-semibold">{endIndex}</span> of{' '}
            <span className="text-slate-900 font-semibold">{pagination.total}</span> submissions
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="limitSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rows per page:
            </label>
            <select
              id="limitSelect"
              value={pagination.limit}
              onChange={handleLimitChange}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Submissions Container */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-sm text-slate-500">Fetching your submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                📋
              </div>
              <h3 className="text-base font-semibold text-slate-800">No submissions found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't created any station requirement submissions yet.
                Use the "New Submission" form to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5 w-16">#</th>
                      <th className="px-6 py-3.5">Station</th>
                      <th className="px-6 py-3.5 text-right">File Folders</th>
                      <th className="px-6 py-3.5 text-right">Registers</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Submitted At</th>
                      <th className="px-6 py-3.5 text-center w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-sm">
                    {submissions.map((submission: StationRequirementSummary, index: number) => {
                      const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                      const isDraft = submission.status === 'draft';

                      return (
                        <tr
                          key={submission.id || `${submission.station}-${submission.submittedAt}-${index}`}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{globalIndex}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-[#1e3a5f]">
                            {submission.station}
                          </td>
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
                            {getStatusBadge(submission.status, submission.reviewStatus)}
                          </td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {formatDate(submission.submittedAt || submission.updatedAt)}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {isDraft && (
                                <button
                                  onClick={() => handleEditDraft(submission)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-all"
                                >
                                  Edit Draft
                                </button>
                              )}
                              <button
                                onClick={() => handleViewSubmission(submission)}
                                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold text-[#1e3a5f] bg-[#1e3a5f]/5 hover:bg-[#1e3a5f] hover:text-white transition-all"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="bg-slate-50/80 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
                    <span className="font-semibold text-slate-800">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Aggregate Stats Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submissions</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{pagination.total}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              📊
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total File Folders</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {submissions.reduce((sum, s) => sum + s.fileFoldersTotal, 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#a3782e] flex items-center justify-center text-lg">
              📁
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registers</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {submissions.reduce((sum, s) => sum + s.registersTotal, 0).toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
              📖
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Deputy Registrar Registry System · Your submissions are tracked here
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 border-b-4 border-[#a3782e] flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">Submission Details</h2>
                  <p className="text-xs text-[#cdd6e0] mt-1 font-medium">
                    {currentSubmission?.station ? `Station: ${currentSubmission.station}` : 'Loading station context...'}
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
                {viewError ? (
                  <div className="text-center py-8 bg-white border border-slate-200 rounded-xl p-6">
                    <div className="text-rose-500 text-3xl mb-2">⚠️</div>
                    <p className="text-slate-800 font-medium">{viewError}</p>
                    <button
                      onClick={handleCloseModal}
                      className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white text-xs font-semibold rounded-lg hover:bg-[#12253d] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : isLoadingDetails ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-xs font-medium text-slate-500">Retrieving detail breakdown...</p>
                  </div>
                ) : currentSubmission ? (
                  <div className="space-y-6">
                    
                    {/* Metadata Header Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Station</p>
                        <p className="font-semibold text-slate-900 text-sm mt-0.5">{currentSubmission.station}</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                        <p className="mt-0.5">{getStatusBadge(currentSubmission.status, currentSubmission.reviewStatus)}</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted Date</p>
                        <p className="font-semibold text-slate-900 text-sm mt-0.5">{formatDate(currentSubmission.submittedAt)}</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted By</p>
                        <p className="font-semibold text-slate-900 text-sm mt-0.5 truncate">
                          {currentSubmission.submitterName || currentSubmission.submitterEmail || 'You'}
                        </p>
                      </div>
                    </div>

                    {/* File Folders Section */}
                    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          File Folders
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                          {currentSubmission.fileFolders.length} Item(s)
                        </span>
                      </div>

                      {currentSubmission.fileFolders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          No file folders requested in this submission.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                              <th className="px-5 py-3">Division</th>
                              <th className="px-5 py-3">Folder Description</th>
                              <th className="px-5 py-3 text-right">Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentSubmission.fileFolders.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3 text-slate-500 font-medium">{item.division}</td>
                                <td className="px-5 py-3 text-slate-800 font-semibold">{item.name}</td>
                                <td className="px-5 py-3 text-right font-bold text-slate-900">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Registers Section */}
                    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Registers
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                          {currentSubmission.registers.length} Item(s)
                        </span>
                      </div>

                      {currentSubmission.registers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          No registers requested in this submission.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                              <th className="px-5 py-3">Division</th>
                              <th className="px-5 py-3">Register Description</th>
                              <th className="px-5 py-3 text-right">Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentSubmission.registers.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3 text-slate-500 font-medium">{item.division}</td>
                                <td className="px-5 py-3 text-slate-800 font-semibold">{item.name}</td>
                                <td className="px-5 py-3 text-right font-bold text-slate-900">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Grand Total Highlight */}
                    <div className="bg-gradient-to-r from-[#12253d] to-[#1e3a5f] text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#c9b98a]">Grand Total Requested</p>
                        <p className="text-xs text-[#cdd6e0]">Combined file folders and registers</p>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {currentSubmission.fileFolders.reduce((sum, item) => sum + item.quantity, 0) +
                         currentSubmission.registers.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-[#1e3a5f] hover:bg-[#12253d] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Close Window
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrSubmissions;