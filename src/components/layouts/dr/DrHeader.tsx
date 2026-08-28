import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';

interface DrHeaderProps {
  onToggleSidebar: () => void;
}

export const DrHeader: React.FC<DrHeaderProps> = ({ onToggleSidebar }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 px-4 md:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-lg">Judiciary DR Portal</span>
          {user?.station && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              {user.station}
            </span>
          )}
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-3 focus:outline-none group p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                {user?.fullName || 'Deputy Registrar'}
              </span>
              <span className="text-xs text-slate-500">{user?.pjNumber || 'DR Officer'}</span>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 rounded">
                    {user?.designation || 'Deputy Registrar'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DrHeader;