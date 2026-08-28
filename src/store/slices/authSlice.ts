import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosClient from '../../api/api';

// Define expected shape of backend error responses
interface ApiErrorResponse {
  message?: string;
  status?: string;
}

// Define types matching backend structure
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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  maskedEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // Fixed: Added missing initialization flag
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  maskedEmail: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true, // Starts true to check session on app mount
  error: null,
};

// --- ASYNC THUNKS ---

// Step 1: Request OTP
// Step 1: Request OTP
export const requestOtp = createAsyncThunk<
  { email: string },
  { pjNumber: string },
  { rejectValue: string }
>('auth/requestOtp', async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post('/auth/login/request-otp', payload);
    
    // Extract email from the message field
    // The message format is: "A login code has been sent to o***6@gmail.com"
    let email = '';
    
    // Try to extract from message
    if (response.data?.message) {
      const message = response.data.message;
      // Look for email pattern in the message
      const emailMatch = message.match(/sent to (.+)$/);
      if (emailMatch) {
        email = emailMatch[1].trim();
      }
    }
    
    // Fallback: check data fields (if they exist in other responses)
    if (!email) {
      email = response.data?.data?.email || 
              response.data?.email || 
              response.data?.maskedEmail ||
              response.data?.data?.maskedEmail;
    }

    if (!email) {
      console.warn('Backend response missing expected email property:', response.data);
      // Fallback with a generic message
      return { email: 'your registered email' };
    }

    return { email };
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to send verification code.'
      );
    }
    return rejectWithValue('An unexpected error occurred processing response.');
  }
});

// Step 2: Verify OTP
export const verifyOtp = createAsyncThunk<
  { user: User; accessToken: string; refreshToken?: string },
  { pjNumber: string; otp: string },
  { rejectValue: string }
>('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post('/auth/login/verify-otp', payload);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Invalid verification code.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Step 3: Refresh Access Token
export const refreshAccessToken = createAsyncThunk<
  { accessToken: string },
  void,
  { rejectValue: string }
>('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post('/auth/refresh');
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Session expired. Please log in again.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Step 4: Fetch Logged-in User Profile
export const fetchMe = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/auth/me');
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch user profile.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Step 5: Check Auth (App Session Initialization)
// In authSlice.ts
export const checkAuth = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>('auth/checkAuth', async (_, { dispatch, rejectWithValue }) => {
  try {
    // 1. Try to refresh access token
    const refreshResult = await dispatch(refreshAccessToken());
    
    // If refresh failed (e.g. no cookie/session), don't attempt to fetch user
    if (refreshAccessToken.rejected.match(refreshResult)) {
      return rejectWithValue('No active session');
    }

    // 2. Only fetch user profile if token refresh succeeded
    const user = await dispatch(fetchMe()).unwrap();
    return user;
  } catch {
    return rejectWithValue('Unauthenticated');
  }
});

// --- AUTH SLICE ---

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    clearMaskedEmail: (state) => {
      state.maskedEmail = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.maskedEmail = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- requestOtp ---
      .addCase(requestOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.maskedEmail = action.payload.email;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Something went wrong';
      })

      // --- verifyOtp ---
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.maskedEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Verification failed';
      })

      // --- refreshAccessToken ---
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // --- fetchMe ---
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })

      // --- checkAuth ---
      .addCase(checkAuth.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitializing = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      });
  },
});

export const { setAccessToken, clearMaskedEmail, clearError, logout } = authSlice.actions;
export default authSlice.reducer;