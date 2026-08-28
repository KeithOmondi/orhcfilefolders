import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  clearError,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from '../../store/slices/userSlice';
import type { AppDispatch, RootState } from '../../store/store';

// Modal types
type ModalMode = 'create' | 'edit' | 'view' | null;

// Filter type
interface UserFilters {
  page: number;
  limit: number;
  search: string;
  role?: 'admin' | 'dr';
  isActive?: boolean;
}

const AdminUsers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error, pagination, stats } = useSelector(
    (state: RootState) => state.users
  );
  const { accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  // Local state
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    search: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserInput>({
    pjNumber: '',
    fullName: '',
    email: '',
    phone: '',
    station: '',
    designation: '',
    role: 'dr',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch users on mount and when filters change
  useEffect(() => {
    if (!isInitializing && accessToken) {
      const queryParams: {
        page?: number;
        limit?: number;
        search?: string;
        role?: 'admin' | 'dr';
        isActive?: boolean;
      } = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.role) queryParams.role = filters.role;
      if (filters.isActive !== undefined) queryParams.isActive = filters.isActive;

      dispatch(getUsers(queryParams));
      dispatch(getUserStats());
    }
  }, [dispatch, accessToken, isInitializing, filters]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
    setFilters({
      page: 1,
      limit: 20,
      search: '',
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
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

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value);
    setFilters({
      ...filters,
      isActive: value === '' ? undefined : value === 'active',
      page: 1,
    });
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedRole(value);
    setFilters({
      ...filters,
      role: value === '' ? undefined : (value as 'admin' | 'dr'),
      page: 1,
    });
  };

  // Open modal for create
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      pjNumber: '',
      fullName: '',
      email: '',
      phone: '',
      station: '',
      designation: '',
      role: 'dr',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      pjNumber: user.pjNumber,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      station: user.station,
      designation: user.designation,
      role: user.role,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for view
  const handleOpenViewModal = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setSelectedUser(null);
    setFormError(null);
  };

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Handle form submit for create/edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        await dispatch(createUser(formData)).unwrap();
        // Refresh user list
        dispatch(getUsers({
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          role: filters.role,
          isActive: filters.isActive,
        }));
        handleCloseModal();
      } else if (modalMode === 'edit' && selectedUser) {
        const updateData: UpdateUserInput = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          station: formData.station,
          designation: formData.designation,
          role: formData.role,
        };
        await dispatch(updateUser({ id: selectedUser.id, data: updateData })).unwrap();
        // Refresh user list
        dispatch(getUsers({
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          role: filters.role,
          isActive: filters.isActive,
        }));
        handleCloseModal();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user. Please try again.';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    if (window.confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`)) {
      try {
        await dispatch(toggleUserStatus({ id, isActive })).unwrap();
        dispatch(getUsers({
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          role: filters.role,
          isActive: filters.isActive,
        }));
        dispatch(getUserStats());
      } catch (err) {
        console.error('Failed to toggle user status:', err);
      }
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        dispatch(getUsers({
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          role: filters.role,
          isActive: filters.isActive,
        }));
        dispatch(getUserStats());
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
                Admin Dashboard · User Management
              </div>
              <h1 className="text-2xl font-semibold mb-2">User Management</h1>
              <p className="text-sm text-[#cdd6e0]">
                Manage all system users, their roles, and account status.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#a3782e] text-white rounded-md hover:bg-[#8a6524] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{stats?.totalAdmins || 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">DRs</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{stats?.totalDRs || 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">Active / Inactive</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">
              {stats?.activeUsers || 0} / {stats?.inactiveUsers || 0}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-6">
            ✗ {error}
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, PJ, or Email..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#12253d] transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="dr">DR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
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

        {/* Users Table */}
        {isLoading ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600">No users found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or create a new user.
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PJ Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user: User, index: number) => {
                    const globalIndex = (filters.page - 1) * filters.limit + index + 1;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">{globalIndex}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {user.pjNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.station}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.designation}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(user.id, !user.isActive)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              user.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenViewModal(user)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 text-center">
          Showing {users.length} users. Use filters to narrow down results.
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-6 rounded-t-lg border-b-4 border-[#a3782e]">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {modalMode === 'create' && 'Add New User'}
                      {modalMode === 'edit' && 'Edit User'}
                      {modalMode === 'view' && 'User Details'}
                    </h2>
                    {modalMode === 'view' && selectedUser && (
                      <p className="text-sm text-[#cdd6e0] mt-1">{selectedUser.fullName}</p>
                    )}
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
                {/* View Mode */}
                {modalMode === 'view' && selectedUser && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{selectedUser.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">PJ Number</p>
                        <p className="font-medium text-gray-900">{selectedUser.pjNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{selectedUser.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Station</p>
                        <p className="font-medium text-gray-900">{selectedUser.station}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Designation</p>
                        <p className="font-medium text-gray-900">{selectedUser.designation}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Role</p>
                        <p className="font-medium text-gray-900">{selectedUser.role.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedUser.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Created: {formatDate(selectedUser.createdAt)}</p>
                      <p>Last Updated: {formatDate(selectedUser.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {/* Create/Edit Mode */}
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {formError && (
                      <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md">
                        ✗ {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          PJ Number *
                        </label>
                        <input
                          type="text"
                          name="pjNumber"
                          value={formData.pjNumber}
                          onChange={handleFormChange}
                          disabled={modalMode === 'edit'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Station *
                        </label>
                        <input
                          type="text"
                          name="station"
                          value={formData.station}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Designation *
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                          Role *
                        </label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="dr">DR</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Update User'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;