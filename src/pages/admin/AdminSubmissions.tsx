import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSubmissions,
  getSubmissionById,
  clearError,
  type StationRequirementSummary,
  type StationRequirementSubmission,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

// Define the response type
interface SubmissionsResponse {
  submissions: StationRequirementSummary[];
  total: number;
  page: number;
  limit: number;
}

const AdminSubmissions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { submissions, isLoading, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  // Local state for filters
  const [filters, setFilters] = useState({
    station: '',
    quarter: '',
    page: 1,
    limit: 20,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<StationRequirementSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!accessToken || isInitializing) return;
    
    try {
      const result = await dispatch(getSubmissions({
        station: filters.station || undefined,
        quarter: filters.quarter || undefined,
        page: filters.page,
        limit: filters.limit,
      })).unwrap() as SubmissionsResponse;
      
      console.log('📊 Submissions fetched:', {
        count: result.submissions.length,
        firstSubmission: result.submissions[0],
        hasId: result.submissions[0]?.id ? '✅' : '❌',
      });
      
      return result;
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      return null;
    }
  }, [dispatch, filters.station, filters.quarter, filters.page, filters.limit, accessToken, isInitializing]);

  // Fetch submissions on mount and when filters change
  useEffect(() => {
    let isMounted = true;
    
    const loadSubmissions = async () => {
      const result = await fetchSubmissions();
      if (isMounted && result) {
        setTotalItems(result.total || 0);
      }
    };
    
    loadSubmissions();
    
    return () => {
      isMounted = false;
    };
  }, [fetchSubmissions]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle view submission details
  const handleViewSubmission = async (submission: StationRequirementSummary) => {
    console.log('🔍 View button clicked for submission:', submission);
    
    setViewError(null);
    
    let submissionId = submission.id;
    
    if (!submissionId) {
      console.log('⚠️ No ID found, searching by station+quarter...');
      const found = submissions.find(
        (s) => s.station === submission.station && s.quarter === submission.quarter
      );
      if (found && found.id) {
        submissionId = found.id;
        console.log('✅ Found ID by station+quarter:', submissionId);
      }
    }
    
    if (!submissionId) {
      console.error('❌ Could not find submission ID for:', submission);
      setViewError('Could not find submission ID. Please try refreshing the page.');
      return;
    }
    
    setIsLoadingDetails(true);
    setIsModalOpen(true);
    
    try {
      console.log('📤 Fetching submission details for ID:', submissionId);
      const result = await dispatch(getSubmissionById(submissionId)).unwrap();
      console.log('✅ Submission details received:', result);
      setSelectedSubmission(result.submission);
      setViewError(null);
    } catch (err) {
      console.error('❌ Failed to fetch submission details:', err);
      setSelectedSubmission(null);
      setViewError('Failed to load submission details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
    setViewError(null);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      station: searchTerm,
      quarter: selectedQuarter,
      page: 1,
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedQuarter('');
    setFilters({
      station: '',
      quarter: '',
      page: 1,
      limit: 20,
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(totalItems / filters.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  // Handle limit change
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      limit: Number(e.target.value),
      page: 1,
    });
  };

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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / filters.limit);
  const startIndex = (filters.page - 1) * filters.limit + 1;
  const endIndex = Math.min(filters.page * filters.limit, totalItems);

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Admin Dashboard · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            All Station Submissions
          </h1>
          <p className="text-sm text-[#cdd6e0]">
            View and manage all station requirements submissions across all locations.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="searchStation" className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Search by Station
              </label>
              <input
                id="searchStation"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. Headquarters, Kisumu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>
            <div>
              <label htmlFor="filterQuarter" className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Filter by Quarter
              </label>
              <select
                id="filterQuarter"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Quarters</option>
                <option value="Q1 FY2026/27">Q1 FY2026/27</option>
                <option value="Q2 FY2026/27">Q2 FY2026/27</option>
                <option value="Q3 FY2026/27">Q3 FY2026/27</option>
                <option value="Q4 FY2026/27">Q4 FY2026/27</option>
                <option value="Annual FY2026/27">Annual FY2026/27</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-6">
            ✗ {error}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {totalItems > 0 ? startIndex : 0} - {endIndex} of {totalItems} submissions
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="limitSelect" className="text-sm text-gray-600">
              Show:
            </label>
            <select
              id="limitSelect"
              value={filters.limit}
              onChange={handleLimitChange}
              className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        {isLoading ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600">No submissions found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or wait for stations to submit their requirements.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quarter
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Folders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registers
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission: StationRequirementSummary, index: number) => {
                    const globalIndex = (filters.page - 1) * filters.limit + index + 1;
                    const totalItemsForRow = submission.fileFoldersTotal + submission.registersTotal;

                    return (
                      <tr
                        key={`${submission.station}-${submission.submittedAt}-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {globalIndex}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {submission.station}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {submission.quarter}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {submission.fileFoldersTotal.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {submission.registersTotal.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                          {totalItemsForRow.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(submission.submittedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleViewSubmission(submission)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {filters.page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">Total Submissions</div>
            <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">File Folders Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {submissions.reduce((sum, s) => sum + s.fileFoldersTotal, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">Registers Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {submissions.reduce((sum, s) => sum + s.registersTotal, 0).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Showing submissions from all stations. Use filters to narrow down results.
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseModal}
          ></div>

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 rounded-t-lg border-b-4 border-[#a3782e]">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Submission Details</h2>
                    <p className="text-sm text-[#cdd6e0] mt-1">
                      {selectedSubmission?.station} · {selectedSubmission?.quarter}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-[#f3efe4] hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {viewError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 text-lg mb-2">⚠️</div>
                    <p className="text-gray-800">{viewError}</p>
                    <button
                      onClick={handleCloseModal}
                      className="mt-4 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#12253d] transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : isLoadingDetails ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading submission details...</p>
                  </div>
                ) : selectedSubmission ? (
                  <div className="space-y-6">
                    {/* Submission Info - Updated with submitter name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Station</p>
                        <p className="font-medium text-gray-900">{selectedSubmission.station}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Quarter</p>
                        <p className="font-medium text-gray-900">{selectedSubmission.quarter}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Submitted At</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedSubmission.submittedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Submitted By</p>
                        <p className="font-medium text-gray-900">
                          {selectedSubmission.submitterName || selectedSubmission.submitterEmail || 'Unknown User'}
                        </p>
                      </div>
                    </div>

                    {/* File Folders Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                        File Folders ({selectedSubmission.fileFolders.length} items)
                      </h3>
                      {selectedSubmission.fileFolders.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No file folders requested</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Division
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedSubmission.fileFolders.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-gray-600">{item.division}</td>
                                  <td className="px-4 py-2 text-gray-800">{item.name}</td>
                                  <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-semibold">
                                <td colSpan={2} className="px-4 py-2 text-right">Total:</td>
                                <td className="px-4 py-2 text-right">
                                  {selectedSubmission.fileFolders.reduce((sum, item) => sum + item.quantity, 0)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Registers Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                        Case Registers ({selectedSubmission.registers.length} items)
                      </h3>
                      {selectedSubmission.registers.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No registers requested</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Division
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedSubmission.registers.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-gray-600">{item.division}</td>
                                  <td className="px-4 py-2 text-gray-800">{item.name}</td>
                                  <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50 font-semibold">
                                <td colSpan={2} className="px-4 py-2 text-right">Total:</td>
                                <td className="px-4 py-2 text-right">
                                  {selectedSubmission.registers.reduce((sum, item) => sum + item.quantity, 0)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Summary Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#12253d] text-[#f3efe4] rounded-lg p-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#c9b98a]">File Folders Total</p>
                        <p className="text-2xl font-bold">
                          {selectedSubmission.fileFolders.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#c9b98a]">Registers Total</p>
                        <p className="text-2xl font-bold">
                          {selectedSubmission.registers.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#c9b98a]">Grand Total</p>
                        <p className="text-2xl font-bold">
                          {selectedSubmission.fileFolders.reduce((sum, item) => sum + item.quantity, 0) +
                           selectedSubmission.registers.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <p>Failed to load submission details.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors"
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

export default AdminSubmissions;