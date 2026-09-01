import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosClient from '../../api/api';

// --- CATEGORY DEFINITIONS ---
// Updated to match official case categories from the court document
export const CASE_CATEGORIES: Record<string, string[]> = {
  'Criminal': [
    'Murder',
    'Applications',
    'Appeals',
    'Court Martial',
    'Revisions',
    '2nd Appeals'
  ],
  'Anti-Corruption & Economic Crimes': [
    'Appeals',
    'Judicial Review',
    'Suit',
    'Revision',
    'Miscellaneous',
    'Petitions'
  ],
  'Commercial & Tax': [
    'Commercial Civil Matters',
    'Commercial Miscellaneous',
    'Insolvency Cause',
    'Insolvency Petition',
    'Income Tax Appeal',
    'Insolvency Notice',
    'Commercial Appeal',
    'Commercial Petitions',
    'Arbitration'
  ],
  'Admiralty': [
    'Admiralty'
  ],
  'Civil': [
    'High Court Civil',
    'High Court Civil Miscellaneous',
    'High Court Civil Appeals/Applications'
  ],
  'Family': [
    'Family Appeals',
    'Family Miscellaneous Applications',
    'Probate & Administration',
    'Divorce',
    'Adoption',
    'Matrimonial Properties'
  ],
  'Judicial Review': [
    'Judicial Review',
    'Judicial Review Miscellaneous'
  ],
  'Constitutional & Human Rights': [
    'Constitutional & Human Rights Petition',
    'Petition',
    'Miscellaneous Petition',
    'Election Appeal',
    'Miscellaneous Election Appeal',
    'Election Petition'
  ]
};

// --- CASE CODES ---
// Using unique keys with category prefix to avoid duplicates
export const CASE_CODES: Record<string, string> = {
  // Criminal
  'Criminal_Murder': 'HC.CR.C.',
  'Criminal_Applications': 'HC.MISC.CR.APPL',
  'Criminal_Appeals': 'HC.CR.A.',
  'Criminal_Court Martial': 'HCCMA',
  'Criminal_Revisions': 'HC.CR.REV',
  'Criminal_2nd Appeals': 'K.C.A',
  
  // Anti-Corruption & Economic Crimes
  'Anti-Corruption & Economic Crimes_Appeals': 'HCACECA',
  'Anti-Corruption & Economic Crimes_Judicial Review': 'HCACEC JR',
  'Anti-Corruption & Economic Crimes_Suit': 'HCACECS',
  'Anti-Corruption & Economic Crimes_Revision': 'HCACECR',
  'Anti-Corruption & Economic Crimes_Miscellaneous': 'HCACEMISC',
  'Anti-Corruption & Economic Crimes_Petitions': 'HCACEC PETITION',
  
  // Commercial & Tax
  'Commercial & Tax_Commercial Civil Matters': 'HCCOMM',
  'Commercial & Tax_Commercial Miscellaneous': 'HCCOMMMISC',
  'Commercial & Tax_Insolvency Cause': 'HCCOMMIC',
  'Commercial & Tax_Insolvency Petition': 'HCCOMMIP',
  'Commercial & Tax_Income Tax Appeal': 'HCCOMMITA',
  'Commercial & Tax_Insolvency Notice': 'HCCOMMIN',
  'Commercial & Tax_Commercial Appeal': 'HCCCOMMA',
  'Commercial & Tax_Commercial Petitions': 'HCCOMMPET',
  'Commercial & Tax_Arbitration': 'HCCOMMARB',
  
  // Admiralty
  'Admiralty_Admiralty': 'HCCOMMADMIR',
  
  // Civil
  'Civil_High Court Civil': 'HCCC',
  'Civil_High Court Civil Miscellaneous': 'HCCC Misc.',
  'Civil_High Court Civil Appeals/Applications': 'HCCA',
  
  // Family
  'Family_Family Appeals': 'HCFA',
  'Family_Family Miscellaneous Applications': 'HCFMISC',
  'Family_Probate & Administration': 'HCFP & A',
  'Family_Divorce': 'HCFDC',
  'Family_Adoption': 'HCFADOP',
  'Family_Matrimonial Properties': 'HCFOS',
  
  // Judicial Review
  'Judicial Review_Judicial Review': 'HCJR',
  'Judicial Review_Judicial Review Miscellaneous': 'HCJRMISC',
  
  // Constitutional & Human Rights
  'Constitutional & Human Rights_Constitutional & Human Rights Petition': 'CHR',
  'Constitutional & Human Rights_Petition': 'HCCHRPET',
  'Constitutional & Human Rights_Miscellaneous Petition': 'HCCCHRPETMISC',
  'Constitutional & Human Rights_Election Appeal': 'HCCHREPA',
  'Constitutional & Human Rights_Miscellaneous Election Appeal': 'HCCHRMEPA',
  'Constitutional & Human Rights_Election Petition': 'HCCHREP'
};

// --- CASE COLORS ---
// Using unique keys with category prefix to avoid duplicates
export const CASE_COLORS: Record<string, string> = {
  // Criminal
  'Criminal_Murder': 'Dark Purple',
  'Criminal_Applications': 'Light Yellow',
  'Criminal_Appeals': 'Red',
  'Criminal_Court Martial': 'Red',
  'Criminal_Revisions': 'Sky Blue',
  'Criminal_2nd Appeals': 'Dark Pink',
  
  // Anti-Corruption & Economic Crimes
  'Anti-Corruption & Economic Crimes_Appeals': 'Blue',
  'Anti-Corruption & Economic Crimes_Judicial Review': 'Dark Green',
  'Anti-Corruption & Economic Crimes_Suit': 'Maroon',
  'Anti-Corruption & Economic Crimes_Revision': 'Neon Green',
  'Anti-Corruption & Economic Crimes_Miscellaneous': 'Orange',
  'Anti-Corruption & Economic Crimes_Petitions': 'Red',
  
  // Commercial & Tax
  'Commercial & Tax_Commercial Civil Matters': 'Light Purple',
  'Commercial & Tax_Commercial Miscellaneous': 'Light Purple',
  'Commercial & Tax_Insolvency Cause': 'Light Purple',
  'Commercial & Tax_Insolvency Petition': 'Light Purple',
  'Commercial & Tax_Income Tax Appeal': 'Light Purple',
  'Commercial & Tax_Insolvency Notice': 'Light Purple',
  'Commercial & Tax_Commercial Appeal': 'Light Purple',
  'Commercial & Tax_Commercial Petitions': 'Light Purple',
  'Commercial & Tax_Arbitration': 'Light Purple',
  
  // Admiralty
  'Admiralty_Admiralty': 'Sky Blue',
  
  // Civil
  'Civil_High Court Civil': 'Orange',
  'Civil_High Court Civil Miscellaneous': 'Orange',
  'Civil_High Court Civil Appeals/Applications': 'Grey',
  
  // Family
  'Family_Family Appeals': 'Grey',
  'Family_Family Miscellaneous Applications': 'Yellow',
  'Family_Probate & Administration': 'Pink',
  'Family_Divorce': 'Purple',
  'Family_Adoption': 'Cream',
  'Family_Matrimonial Properties': 'Yellow',
  
  // Judicial Review
  'Judicial Review_Judicial Review': 'Dark Green',
  'Judicial Review_Judicial Review Miscellaneous': 'Dark Green',
  
  // Constitutional & Human Rights
  'Constitutional & Human Rights_Constitutional & Human Rights Petition': 'Light Green',
  'Constitutional & Human Rights_Petition': 'Light Green',
  'Constitutional & Human Rights_Miscellaneous Petition': 'Light Green',
  'Constitutional & Human Rights_Election Appeal': 'Light Green',
  'Constitutional & Human Rights_Miscellaneous Election Appeal': 'Light Green',
  'Constitutional & Human Rights_Election Petition': 'Light Green'
};

// --- HELPER FUNCTIONS ---
export const getCaseCode = (category: string, caseName: string): string | undefined => {
  const key = `${category}_${caseName}`;
  return CASE_CODES[key];
};

export const getCaseColor = (category: string, caseName: string): string | undefined => {
  const key = `${category}_${caseName}`;
  return CASE_COLORS[key];
};

export const getValidCategories = (): string[] => {
  return Object.keys(CASE_CATEGORIES);
};

export const getValidNamesForCategory = (category: string): string[] => {
  return CASE_CATEGORIES[category] || [];
};

export const getAllValidCases = (): { category: string; names: string[] }[] => {
  return Object.entries(CASE_CATEGORIES).map(([category, names]) => ({
    category,
    names,
  }));
};

// --- CASE LOOKUP FUNCTIONS ---
export const getCaseInfo = (category: string, caseName: string) => {
  const code = getCaseCode(category, caseName);
  const color = getCaseColor(category, caseName);
  return { code, color };
};

// Types matching backend structure
// NOTE: "quarter" removed everywhere below — a DR only picks a station.
export interface StationRequirementItem {
  division: string;
  name: string;
  quantity: number;
}

export interface StationRequirementSubmission {
  id?: string;
  station: string;
  fileFolders: StationRequirementItem[];
  registers: StationRequirementItem[];
  submittedAt: string;
  submittedBy?: string;
  submitterName?: string;
  submitterEmail?: string;
}

export interface StationRequirementSummary {
  id?: string;
  station: string;
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
  categories: { category: string; names: string[] }[];
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
  categories: getAllValidCases(),
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
    fileFolders: StationRequirementItem[];
    registers: StationRequirementItem[];
  },
  { rejectValue: string }
>('stationRequirements/createSubmission', async (payload, { rejectWithValue }) => {
  try {
    console.log('📤 Creating submission:', {
      station: payload.station,
      fileFoldersCount: payload.fileFolders.length,
      registersCount: payload.registers.length,
      fileFoldersTotal: payload.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
      registersTotal: payload.registers.reduce((sum, item) => sum + item.quantity, 0),
    });

    const response = await axiosClient.post('/station-requirements', payload);
    
    console.log('✅ Submission created:', {
      id: response.data.data.submission.id,
      station: response.data.data.submission.station,
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
  { station: string },
  { rejectValue: string }
>('stationRequirements/getSubmissionsByStation', async ({ station }, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get(`/station-requirements/station/${station}`);
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
    deriveStations: (state) => {
      if (state.submissions.length > 0) {
        const stations = [...new Set(state.submissions.map(s => s.station))].sort();
        
        if (stations.length > 0) {
          state.stations = stations;
        }
        
        console.log('🔄 Derived from submissions:', { stations });
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
          
          if (stations.length > 0 && state.stations.length === 0) {
            state.stations = stations;
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
          (s) => s.id === action.payload.submission.id
        );
        if (index !== -1) {
          state.submissions[index] = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
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
  deriveStations,
} = stationRequirementsSlice.actions;

export default stationRequirementsSlice.reducer;