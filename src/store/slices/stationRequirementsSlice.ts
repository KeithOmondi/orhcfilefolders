import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosClient from '../../api/api';

// --- CATEGORY DEFINITIONS ---
export const FILE_FOLDERS_CATEGORIES: Record<string, string[]> = {
  'Civil Division': [
    'Civil Case Files',
    'Civil Suit Folders',
    'Miscellaneous Civil Folders',
  ],
  'Criminal Division': [
    'Criminal Case Files',
    'Traffic Case Folders',
  ],
  'Family Division': [
    'Family Case Files',
    'Succession Folders',
  ],
};

export const REGISTERS_CATEGORIES: Record<string, string[]> = {
  'Civil Division': [
    'Civil Cause List Register',
    'Civil Case Diary',
  ],
  'Criminal Division': [
    'Criminal Cause List Register',
    'Bail Register',
  ],
  'Family Division': [
    'Family Cause List Register',
  ],
};

// Types matching backend structure
export interface StationRequirementItem {
  division: string;
  name: string;
  quantity: number;
}

// ✅ UPDATED: Added submitterName and submitterEmail
export interface StationRequirementSubmission {
  id?: string;
  station: string;
  quarter: string;
  fileFolders: StationRequirementItem[];
  registers: StationRequirementItem[];
  submittedAt: string;
  submittedBy?: string;
  submitterName?: string; // ✅ Added
  submitterEmail?: string; // ✅ Added
}

export interface StationRequirementSummary {
  id?: string;
  station: string;
  quarter: string;
  fileFoldersTotal: number;
  registersTotal: number;
  submittedAt: string;
}

export interface SubmissionTotals {
  totalSubmissions: number;
  totalFileFolders: number;
  totalRegisters: number;
  uniqueStations: number;
}

interface ApiErrorResponse {
  message?: string;
  status?: string;
}

interface StationRequirementsState {
  submissions: StationRequirementSummary[];
  currentSubmission: StationRequirementSubmission | null;
  totals: SubmissionTotals | null;
  stations: string[];
  quarters: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: StationRequirementsState = {
  submissions: [],
  currentSubmission: null,
  totals: null,
  stations: [],
  quarters: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// --- ASYNC THUNKS ---

// Create a new submission
export const createSubmission = createAsyncThunk<
  { submission: StationRequirementSubmission },
  {
    station: string;
    quarter: string;
    fileFolders: StationRequirementItem[];
    registers: StationRequirementItem[];
  },
  { rejectValue: string }
>('stationRequirements/createSubmission', async (payload, { rejectWithValue }) => {
  try {
    console.log('📤 Creating submission:', {
      station: payload.station,
      quarter: payload.quarter,
      fileFoldersCount: payload.fileFolders.length,
      registersCount: payload.registers.length,
      fileFoldersTotal: payload.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
      registersTotal: payload.registers.reduce((sum, item) => sum + item.quantity, 0),
    });

    const response = await axiosClient.post('/station-requirements', payload);
    
    console.log('✅ Submission created:', {
      id: response.data.data.submission.id,
      station: response.data.data.submission.station,
      quarter: response.data.data.submission.quarter,
    });
    
    return response.data.data;
  } catch (err: unknown) {
    console.error('❌ Failed to create submission:', err);
    
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      console.error('📋 Server error response:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data,
      });
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create submission.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get all submissions with filtering and pagination
export const getSubmissions = createAsyncThunk<
  {
    submissions: StationRequirementSummary[];
    total: number;
    page: number;
    limit: number;
  },
  {
    station?: string;
    quarter?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>('stationRequirements/getSubmissions', async (params, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/station-requirements', { params });
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch submissions.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get a single submission by ID
export const getSubmissionById = createAsyncThunk<
  { submission: StationRequirementSubmission },
  string,
  { rejectValue: string }
>('stationRequirements/getSubmissionById', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get(`/station-requirements/${id}`);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch submission.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get submissions by station
export const getSubmissionsByStation = createAsyncThunk<
  { submissions: StationRequirementSubmission[] },
  { station: string; quarter?: string },
  { rejectValue: string }
>('stationRequirements/getSubmissionsByStation', async ({ station, quarter }, { rejectWithValue }) => {
  try {
    const params = quarter ? { quarter } : {};
    const response = await axiosClient.get(`/station-requirements/station/${station}`, { params });
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch station submissions.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Update a submission
export const updateSubmission = createAsyncThunk<
  { submission: StationRequirementSubmission },
  {
    id: string;
    station?: string;
    quarter?: string;
    fileFolders?: StationRequirementItem[];
    registers?: StationRequirementItem[];
  },
  { rejectValue: string }
>('stationRequirements/updateSubmission', async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const response = await axiosClient.put(`/station-requirements/${id}`, payload);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update submission.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Delete a submission
export const deleteSubmission = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('stationRequirements/deleteSubmission', async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/station-requirements/${id}`);
    return id;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete submission.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get submission totals
export const getSubmissionTotals = createAsyncThunk<
  SubmissionTotals,
  void,
  { rejectValue: string }
>('stationRequirements/getSubmissionTotals', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get('/station-requirements/totals');
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch totals.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get unique stations
export const getUniqueStations = createAsyncThunk<
  { stations: string[] },
  void,
  { rejectValue: string }
>('stationRequirements/getUniqueStations', async (_, { rejectWithValue, getState }) => {
  try {
    const response = await axiosClient.get('/station-requirements/stations');
    
    if (response.data?.data?.stations && Array.isArray(response.data.data.stations)) {
      return { stations: response.data.data.stations };
    }
    
    const state = getState() as { stationRequirements: StationRequirementsState };
    const submissions = state.stationRequirements.submissions;
    
    if (submissions.length > 0) {
      const stations = [...new Set(submissions.map(s => s.station))].sort();
      console.log('📊 Derived stations from submissions:', stations);
      return { stations };
    }
    
    return { stations: [] };
  } catch (err: unknown) {
    try {
      const state = getState() as { stationRequirements: StationRequirementsState };
      const submissions = state.stationRequirements.submissions;
      
      if (submissions.length > 0) {
        const stations = [...new Set(submissions.map(s => s.station))].sort();
        console.log('📊 Derived stations from submissions (API failed):', stations);
        return { stations };
      }
    } catch (deriveError) {
      console.warn('Could not derive stations from state:', deriveError);
    }
    
    if (axios.isAxiosError(err) && (err.response?.status === 400 || err.response?.status === 404)) {
      console.warn('⚠️ Stations endpoint not available, returning empty array');
      return { stations: [] };
    }
    
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch stations.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// Get unique quarters
export const getUniqueQuarters = createAsyncThunk<
  { quarters: string[] },
  void,
  { rejectValue: string }
>('stationRequirements/getUniqueQuarters', async (_, { rejectWithValue, getState }) => {
  try {
    const response = await axiosClient.get('/station-requirements/quarters');
    
    if (response.data?.data?.quarters && Array.isArray(response.data.data.quarters)) {
      return { quarters: response.data.data.quarters };
    }
    
    const state = getState() as { stationRequirements: StationRequirementsState };
    const submissions = state.stationRequirements.submissions;
    
    if (submissions.length > 0) {
      const quarters = [...new Set(submissions.map(s => s.quarter))].sort();
      console.log('📊 Derived quarters from submissions:', quarters);
      return { quarters };
    }
    
    return { quarters: [] };
  } catch (err: unknown) {
    try {
      const state = getState() as { stationRequirements: StationRequirementsState };
      const submissions = state.stationRequirements.submissions;
      
      if (submissions.length > 0) {
        const quarters = [...new Set(submissions.map(s => s.quarter))].sort();
        console.log('📊 Derived quarters from submissions (API failed):', quarters);
        return { quarters };
      }
    } catch (deriveError) {
      console.warn('Could not derive quarters from state:', deriveError);
    }
    
    if (axios.isAxiosError(err) && (err.response?.status === 400 || err.response?.status === 404)) {
      console.warn('⚠️ Quarters endpoint not available, returning empty array');
      return { quarters: [] };
    }
    
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch quarters.'
      );
    }
    return rejectWithValue('An unexpected error occurred.');
  }
});

// --- SLICE ---

const stationRequirementsSlice = createSlice({
  name: 'stationRequirements',
  initialState,
  reducers: {
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
      };
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
    },
    setStations: (state, action: PayloadAction<string[]>) => {
      state.stations = action.payload;
    },
    setQuarters: (state, action: PayloadAction<string[]>) => {
      state.quarters = action.payload;
    },
    deriveStationsAndQuarters: (state) => {
      if (state.submissions.length > 0) {
        const stations = [...new Set(state.submissions.map(s => s.station))].sort();
        const quarters = [...new Set(state.submissions.map(s => s.quarter))].sort();
        
        if (stations.length > 0) {
          state.stations = stations;
        }
        if (quarters.length > 0) {
          state.quarters = quarters;
        }
        
        console.log('🔄 Derived from submissions:', { stations, quarters });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- createSubmission ---
      .addCase(createSubmission.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        if (state.submissions) {
          state.submissions.unshift({
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            quarter: action.payload.submission.quarter,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            registersTotal: action.payload.submission.registers.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            submittedAt: action.payload.submission.submittedAt,
          });
        }
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Failed to create submission';
      })

      // --- getSubmissions ---
      .addCase(getSubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = action.payload.submissions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
        
        if (state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map(s => s.station))].sort();
          const quarters = [...new Set(state.submissions.map(s => s.quarter))].sort();
          
          if (stations.length > 0 && state.stations.length === 0) {
            state.stations = stations;
          }
          if (quarters.length > 0 && state.quarters.length === 0) {
            state.quarters = quarters;
          }
        }
      })
      .addCase(getSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch submissions';
      })

      // --- getSubmissionById ---
      .addCase(getSubmissionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSubmissionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubmission = action.payload.submission;
      })
      .addCase(getSubmissionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch submission';
      })

      // --- getSubmissionsByStation ---
      .addCase(getSubmissionsByStation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSubmissionsByStation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = action.payload.submissions.map((sub) => ({
          id: sub.id,
          station: sub.station,
          quarter: sub.quarter,
          fileFoldersTotal: sub.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
          registersTotal: sub.registers.reduce((sum, item) => sum + item.quantity, 0),
          submittedAt: sub.submittedAt,
        }));
      })
      .addCase(getSubmissionsByStation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch station submissions';
      })

      // --- updateSubmission ---
      .addCase(updateSubmission.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        const index = state.submissions.findIndex(
          (s) => s.station === action.payload.submission.station &&
                 s.quarter === action.payload.submission.quarter
        );
        if (index !== -1) {
          state.submissions[index] = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            quarter: action.payload.submission.quarter,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            registersTotal: action.payload.submission.registers.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            submittedAt: action.payload.submission.submittedAt,
          };
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || 'Failed to update submission';
      })

      // --- deleteSubmission ---
      .addCase(deleteSubmission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = state.submissions.filter(
          (sub) => sub.id !== action.payload
        );
        if (state.currentSubmission?.id === action.payload) {
          state.currentSubmission = null;
        }
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete submission';
      })

      // --- getSubmissionTotals ---
      .addCase(getSubmissionTotals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSubmissionTotals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.totals = action.payload;
      })
      .addCase(getSubmissionTotals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch totals';
      })

      // --- getUniqueStations ---
      .addCase(getUniqueStations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUniqueStations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stations = action.payload.stations;
        
        if (state.stations.length === 0 && state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map(s => s.station))].sort();
          if (stations.length > 0) {
            state.stations = stations;
            console.log('📊 Auto-derived stations from submissions:', stations);
          }
        }
      })
      .addCase(getUniqueStations.rejected, (state, action) => {
        state.isLoading = false;
        if (!action.payload?.includes('400') && !action.payload?.includes('404')) {
          state.error = action.payload || 'Failed to fetch stations';
        }
        if (state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map(s => s.station))].sort();
          if (stations.length > 0) {
            state.stations = stations;
            console.log('📊 Auto-derived stations from submissions (after rejection):', stations);
          }
        }
      })

      // --- getUniqueQuarters ---
      .addCase(getUniqueQuarters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUniqueQuarters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quarters = action.payload.quarters;
        
        if (state.quarters.length === 0 && state.submissions.length > 0) {
          const quarters = [...new Set(state.submissions.map(s => s.quarter))].sort();
          if (quarters.length > 0) {
            state.quarters = quarters;
            console.log('📊 Auto-derived quarters from submissions:', quarters);
          }
        }
      })
      .addCase(getUniqueQuarters.rejected, (state, action) => {
        state.isLoading = false;
        if (!action.payload?.includes('400') && !action.payload?.includes('404')) {
          state.error = action.payload || 'Failed to fetch quarters';
        }
        if (state.submissions.length > 0) {
          const quarters = [...new Set(state.submissions.map(s => s.quarter))].sort();
          if (quarters.length > 0) {
            state.quarters = quarters;
            console.log('📊 Auto-derived quarters from submissions (after rejection):', quarters);
          }
        }
      });
  },
});

export const {
  clearCurrentSubmission,
  clearError,
  resetPagination,
  setPage,
  setLimit,
  setStations,
  setQuarters,
  deriveStationsAndQuarters,
} = stationRequirementsSlice.actions;

export default stationRequirementsSlice.reducer;