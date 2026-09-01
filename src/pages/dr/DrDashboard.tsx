import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSubmissions,
  type StationRequirementSummary,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

const statusStyles: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  submitted: 'bg-green-50 text-green-700 border-green-300',
};

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DrDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { submissions, isLoading, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { user, accessToken, isInitializing } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (!isInitializing && accessToken && user?.station) {
      dispatch(getSubmissions({ station: user.station, limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' }));
    }
  }, [dispatch, isInitializing, accessToken, user?.station]);

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

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <p className="text-gray-600">Please log in to access this page.</p>
      </div>
    );
  }

  const renderRow = (sub: StationRequirementSummary): React.ReactElement => {
    const badgeClass = statusStyles[sub.status] || statusStyles.draft;
    return (
      <div
        key={sub.id}
        className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-5 py-4"
      >
        <div>
          <div className="font-semibold text-gray-800">{sub.station}</div>
          <div className="text-xs text-gray-500 mt-1">
            {sub.fileFoldersTotal} file folders · updated {formatDate(sub.updatedAt)}
            {sub.status === 'submitted' && sub.submittedAt && ` · submitted ${formatDate(sub.submittedAt)}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold uppercase tracking-wide border rounded-full px-3 py-1 ${badgeClass}`}>
            {sub.status === 'submitted' ? 'Submitted' : 'Draft'}
          </span>
          <Link
            to={`/dr/requirements/edit/${sub.id}`}
            className="text-sm font-semibold text-[#1e3a5f] hover:underline"
          >
            {sub.status === 'submitted' ? 'View / Edit' : 'Continue editing'}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Data Collection · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold">Station Requirements</h1>
          {user?.station && (
            <p className="mt-1 text-sm text-[#c9b98a]">{user.station}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm mb-6">
            ✗ {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
          </div>
        ) : submissions.length > 0 ? (
          <div className="space-y-3">{submissions.map(renderRow)}</div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't started a submission yet.</p>
            <Link
              to="/dr/requirements/new"
              className="inline-block px-6 py-3 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors"
            >
              Start Requirement Form
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrDashboard;