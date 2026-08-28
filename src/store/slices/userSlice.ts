// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosClient from '../../api/api';

// ============================================================
// Types
// ============================================================
export interface User {
  id: string;
  pjNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  station: string;
  designation: string;
  role: 'admin' | 'dr';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  pjNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  station: string;
  designation: string;
  role: 'admin' | 'dr';
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  station?: string;
  designation?: string;
  role?: 'admin' | 'dr';
  isActive?: boolean;
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalDRs: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiErrorResponse {
  message?: string;
  status?: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  stats: UserStats | null;
  stations: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// Initial State
// ============================================================
const initialState: UserState = {
  users: [],
  currentUser: null,
  stats: null,
  stations: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// ============================================================
// Async Thunks
// ============================================================

// Get all users with pagination and filtering
export const getUsers = createAsyncThunk<
  UsersResponse,
  {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'dr';
    station?: string;
    isActive?: boolean;
  },
  { rejectValue: string }
>('users/getUsers', async (params, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/users', { params });
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch users.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get a single user by ID
export const getUserById = createAsyncThunk<
  { user: User },
  string,
  { rejectValue: string }
>('users/getUserById', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get(`/users/${id}`);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch user.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Create a new user
export const createUser = createAsyncThunk<
  { user: User },
  CreateUserInput,
  { rejectValue: string }
>('users/createUser', async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post('/users', payload);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create user.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Update a user
export const updateUser = createAsyncThunk<
  { user: User },
  { id: string; data: UpdateUserInput },
  { rejectValue: string }
>('users/updateUser', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosClient.put(`/users/${id}`, data);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update user.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Toggle user status (activate/deactivate)
export const toggleUserStatus = createAsyncThunk<
  { user: User },
  { id: string; isActive: boolean },
  { rejectValue: string }
>('users/toggleUserStatus', async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const response = await axiosClient.patch(`/users/${id}/status`, { isActive });
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update user status.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Delete a user
export const deleteUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('users/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/users/${id}`);
    return id;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete user.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get user statistics
export const getUserStats = createAsyncThunk<
  UserStats,
  void,
  { rejectValue: string }
>('users/getUserStats', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/users/stats');
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch user statistics.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get unique stations from users
export const getUserStations = createAsyncThunk<
  { stations: string[] },
  void,
  { rejectValue: string }
>('users/getUserStations', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/users/stations');
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch stations.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// ============================================================
// Slice
// ============================================================
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
      state.currentUser = null;
      state.stats = null;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================================
      // getUsers
      // ============================================================
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch users';
      })

      // ============================================================
      // getUserById
      // ============================================================
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.user;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user';
      })

      // ============================================================
      // createUser
      // ============================================================
      .addCase(createUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.users.unshift(action.payload.user);
        state.currentUser = action.payload.user;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Failed to create user';
      })

      // ============================================================
      // updateUser
      // ============================================================
      .addCase(updateUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.users.findIndex((u) => u.id === action.payload.user.id);
        if (index !== -1) {
          state.users[index] = action.payload.user;
        }
        state.currentUser = action.payload.user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Failed to update user';
      })

      // ============================================================
      // toggleUserStatus
      // ============================================================
      .addCase(toggleUserStatus.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.users.findIndex((u) => u.id === action.payload.user.id);
        if (index !== -1) {
          state.users[index] = action.payload.user;
        }
        state.currentUser = action.payload.user;
        
        // Update stats if they exist
        if (state.stats) {
          if (action.payload.user.isActive) {
            state.stats.activeUsers += 1;
            state.stats.inactiveUsers -= 1;
          } else {
            state.stats.activeUsers -= 1;
            state.stats.inactiveUsers += 1;
          }
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Failed to update user status';
      })

      // ============================================================
      // deleteUser
      // ============================================================
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
        // Update stats
        if (state.stats) {
          state.stats.totalUsers -= 1;
          const deletedUser = state.users.find((u) => u.id === action.payload);
          if (deletedUser) {
            if (deletedUser.role === 'admin') {
              state.stats.totalAdmins -= 1;
            } else {
              state.stats.totalDRs -= 1;
            }
            if (deletedUser.isActive) {
              state.stats.activeUsers -= 1;
            } else {
              state.stats.inactiveUsers -= 1;
            }
          }
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete user';
      })

      // ============================================================
      // getUserStats
      // ============================================================
      .addCase(getUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(getUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user statistics';
      })

      // ============================================================
      // getUserStations
      // ============================================================
      .addCase(getUserStations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserStations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stations = action.payload.stations;
      })
      .addCase(getUserStations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch stations';
      });
  },
});

// ============================================================
// Exports
// ============================================================
export const {
  clearCurrentUser,
  clearError,
  resetPagination,
  setPage,
  setLimit,
  clearUsers,
} = userSlice.actions;

export default userSlice.reducer;