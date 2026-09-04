import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import axiosClient from "../../api/api";

// --- CATEGORY DEFINITIONS ---
export const CASE_CATEGORIES: Record<string, string[]> = {
  Criminal: [
    "Murder",
    "Applications",
    "Appeals",
    "Court Martial",
    "Revisions",
    "2nd Appeals",
  ],
  "Anti-Corruption & Economic Crimes": [
    "Appeals",
    "Judicial Review",
    "Suit",
    "Revision",
    "Miscellaneous",
    "Petitions",
  ],
  "Commercial & Tax": [
    "Commercial Civil Matters",
    "Commercial Miscellaneous",
    "Insolvency Cause",
    "Insolvency Petition",
    "Income Tax Appeal",
    "Insolvency Notice",
    "Commercial Appeal",
    "Commercial Petitions",
    "Arbitration",
  ],
  Admiralty: ["Admiralty"],
  Civil: [
    "High Court Civil",
    "High Court Civil Miscellaneous",
    "High Court Civil Appeals/Applications",
  ],
  Family: [
    "Family Appeals",
    "Family Miscellaneous Applications",
    "Probate & Administration",
    "Divorce",
    "Adoption",
    "Matrimonial Properties",
  ],
  "Judicial Review": ["Judicial Review", "Judicial Review Miscellaneous"],
  "Constitutional & Human Rights": [
    "Constitutional & Human Rights Petition",
    "Petition",
    "Miscellaneous Petition",
    "Election Appeal",
    "Miscellaneous Election Appeal",
    "Election Petition",
  ],
};

// --- REGISTER CATEGORY DEFINITIONS ---
export const CASE_REGISTERS: Record<string, string[]> = {
  Criminal: [
    "Criminal Application/Murder Case Register",
    "Criminal Miscellaneous Application Case Register",
    "Criminal Revision Case Register",
    "Criminal Appeal Case Register",
  ],
  "Anti-Corruption & Economic Crimes": [
    "Anti-Corruption and Economic Crimes Suits Case Register",
    "Anti-Corruption and Economic Crimes Petition Case Register",
    "Anti-Corruption and Economic Crimes Appeals Case Register",
    "Anti-Corruption and Economic Crimes Revision Case Register",
    "Anti-Corruption and Economic Crimes Miscellaneous Case Register",
  ],
  Civil: [
    "Civil Case Register",
    "Civil Appeals Case Register",
    "Miscellaneous Civil Application Case Register",
  ],
  "Commercial & Tax": [
    "Commercial Suits Case Register",
    "Commercial Miscellaneous Case Register",
    "Commercial Appeal Case Register",
    "Income Tax Appeals Case Register",
    "Insolvency Notices Case Register",
    "Insolvency Case Register",
    "Insolvency Petition Case Register",
    "Arbitration Case Register",
    "Admiralty Case Register",
  ],
  "Constitutional & Human Rights": [
    "Constitutional & Human Rights Petition Case Register",
    "Constitutional & Human Rights Miscellaneous Case Register",
  ],
  "Judicial Review": [
    "Judicial Review Case Register",
    "Judicial Review Miscellaneous Application Case Register",
  ],
  Family: [
    "Family Civil Case Register",
    "Probate and Administration Case Register",
    "Matrimonial Properties Case Register",
    "Adoption Case Register",
    "Family Appeals Case Register",
    "Family Miscellaneous Case Register",
    "Divorce Case Register",
  ],
};

// --- ADDITIONAL REGISTERS ---
export const ADDITIONAL_REGISTERS = [
  "File Movement Register",
  "Accession Register",
  "Missing File Register",
  "Exhibit Register",
  "Court Assistants Exhibit Register",
  "Certified Urgent Applications Tracking Register",
  "Injunction Register",
  "Tracking Register for High Court Appeal Pending Due to Lack of Lower Court Record",
  "Tracking Registers for Appeals to Court of Appeal",
] as const;

// --- CASE CODES ---
export const CASE_CODES: Record<string, string> = {
  Criminal_Murder: "HC.CR.C.",
  Criminal_Applications: "HC.MISC.CR.APPL",
  Criminal_Appeals: "HC.CR.A.",
  "Criminal_Court Martial": "HCCMA",
  Criminal_Revisions: "HC.CR.REV",
  "Criminal_2nd Appeals": "K.C.A",
  "Anti-Corruption & Economic Crimes_Appeals": "HCACECA",
  "Anti-Corruption & Economic Crimes_Judicial Review": "HCACEC JR",
  "Anti-Corruption & Economic Crimes_Suit": "HCACECS",
  "Anti-Corruption & Economic Crimes_Revision": "HCACECR",
  "Anti-Corruption & Economic Crimes_Miscellaneous": "HCACEMISC",
  "Anti-Corruption & Economic Crimes_Petitions": "HCACEC PETITION",
  "Commercial & Tax_Commercial Civil Matters": "HCCOMM",
  "Commercial & Tax_Commercial Miscellaneous": "HCCOMMMISC",
  "Commercial & Tax_Insolvency Cause": "HCCOMMIC",
  "Commercial & Tax_Insolvency Petition": "HCCOMMIP",
  "Commercial & Tax_Income Tax Appeal": "HCCOMMITA",
  "Commercial & Tax_Insolvency Notice": "HCCOMMIN",
  "Commercial & Tax_Commercial Appeal": "HCCCOMMA",
  "Commercial & Tax_Commercial Petitions": "HCCOMMPET",
  "Commercial & Tax_Arbitration": "HCCOMMARB",
  Admiralty_Admiralty: "HCCOMMADMIR",
  "Civil_High Court Civil": "HCCC",
  "Civil_High Court Civil Miscellaneous": "HCCC Misc.",
  "Civil_High Court Civil Appeals/Applications": "HCCA",
  "Family_Family Appeals": "HCFA",
  "Family_Family Miscellaneous Applications": "HCFMISC",
  "Family_Probate & Administration": "HCFP & A",
  Family_Divorce: "HCFDC",
  Family_Adoption: "HCFADOP",
  "Family_Matrimonial Properties": "HCFOS",
  "Judicial Review_Judicial Review": "HCJR",
  "Judicial Review_Judicial Review Miscellaneous": "HCJRMISC",
  "Constitutional & Human Rights_Constitutional & Human Rights Petition": "CHR",
  "Constitutional & Human Rights_Petition": "HCCHRPET",
  "Constitutional & Human Rights_Miscellaneous Petition": "HCCCHRPETMISC",
  "Constitutional & Human Rights_Election Appeal": "HCCHREPA",
  "Constitutional & Human Rights_Miscellaneous Election Appeal": "HCCHRMEPA",
  "Constitutional & Human Rights_Election Petition": "HCCHREP",
};

// --- CASE COLORS ---
export const CASE_COLORS: Record<string, string> = {
  Criminal_Murder: "Dark Purple",
  Criminal_Applications: "Light Yellow",
  Criminal_Appeals: "Red",
  "Criminal_Court Martial": "Red",
  Criminal_Revisions: "Sky Blue",
  "Criminal_2nd Appeals": "Dark Pink",
  "Anti-Corruption & Economic Crimes_Appeals": "Blue",
  "Anti-Corruption & Economic Crimes_Judicial Review": "Dark Green",
  "Anti-Corruption & Economic Crimes_Suit": "Maroon",
  "Anti-Corruption & Economic Crimes_Revision": "Neon Green",
  "Anti-Corruption & Economic Crimes_Miscellaneous": "Orange",
  "Anti-Corruption & Economic Crimes_Petitions": "Lime Green",
  "Commercial & Tax_Commercial Civil Matters": "Light Purple",
  "Commercial & Tax_Commercial Miscellaneous": "Light Purple",
  "Commercial & Tax_Insolvency Cause": "Light Purple",
  "Commercial & Tax_Insolvency Petition": "Light Purple",
  "Commercial & Tax_Income Tax Appeal": "Light Purple",
  "Commercial & Tax_Insolvency Notice": "Light Purple",
  "Commercial & Tax_Commercial Appeal": "Light Purple",
  "Commercial & Tax_Commercial Petitions": "Light Purple",
  "Commercial & Tax_Arbitration": "Light Purple",
  Admiralty_Admiralty: "Sky Blue",
  "Civil_High Court Civil": "Orange",
  "Civil_High Court Civil Miscellaneous": "Orange",
  "Civil_High Court Civil Appeals/Applications": "Grey",
  "Family_Family Appeals": "Grey",
  "Family_Family Miscellaneous Applications": "Yellow",
  "Family_Probate & Administration": "Pink",
  Family_Divorce: "Purple",
  Family_Adoption: "Cream",
  "Family_Matrimonial Properties": "Yellow",
  "Judicial Review_Judicial Review": "Dark Green",
  "Judicial Review_Judicial Review Miscellaneous": "Dark Green",
  "Constitutional & Human Rights_Constitutional & Human Rights Petition": "Light Green",
  "Constitutional & Human Rights_Petition": "Light Green",
  "Constitutional & Human Rights_Miscellaneous Petition": "Light Green",
  "Constitutional & Human Rights_Election Appeal": "Light Green",
  "Constitutional & Human Rights_Miscellaneous Election Appeal": "Light Green",
  "Constitutional & Human Rights_Election Petition": "Light Green",
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

export const getValidRegisterCategories = (): string[] => {
  return [...Object.keys(CASE_REGISTERS), "Additional"];
};

export const getValidRegisterNamesForCategory = (category: string): string[] => {
  if (category === "Additional") {
    return [...ADDITIONAL_REGISTERS];
  }
  return CASE_REGISTERS[category] || [];
};

export const getAllValidRegisters = (): { category: string; names: string[] }[] => {
  const result: { category: string; names: string[] }[] = [];
  for (const category of Object.keys(CASE_REGISTERS)) {
    result.push({
      category,
      names: CASE_REGISTERS[category],
    });
  }
  result.push({
    category: "Additional",
    names: [...ADDITIONAL_REGISTERS],
  });
  return result;
};

export const getAllRegistersFlat = (): { category: string; name: string }[] => {
  const result: { category: string; name: string }[] = [];
  for (const category of Object.keys(CASE_REGISTERS)) {
    for (const name of CASE_REGISTERS[category]) {
      result.push({ category, name });
    }
  }
  for (const name of ADDITIONAL_REGISTERS) {
    result.push({ category: "Additional", name });
  }
  return result;
};

export const getCaseInfo = (category: string, caseName: string) => {
  const code = getCaseCode(category, caseName);
  const color = getCaseColor(category, caseName);
  return { code, color };
};

// --- TYPES ---
export interface StationRequirementItem {
  division: string;
  name: string;
  quantity: number;
}

export type SubmissionStatus = "draft" | "submitted";
export type ReviewStatus = "pending" | "approved" | "needs_revision";

export interface StationRequirementSubmission {
  id?: string;
  station: string;
  fileFolders: StationRequirementItem[];
  registers: StationRequirementItem[];
  status: SubmissionStatus;
  submittedAt?: string;
  updatedAt: string;
  submittedBy?: string;
  submitterName?: string;
  submitterEmail?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  emailError?: string;
  adminReviewed?: boolean;
  adminReviewedAt?: string;
  adminReviewedBy?: string;
  adminNotes?: string;
  reviewStatus?: ReviewStatus;
}

export interface StationRequirementSummary {
  id?: string;
  station: string;
  fileFoldersTotal: number;
  registersTotal: number;
  status: SubmissionStatus;
  submittedAt?: string;
  updatedAt: string;
  submitterName?: string;
  reviewStatus?: ReviewStatus;
}

export interface SubmissionTotals {
  totalSubmissions: number;
  totalFileFolders: number;
  totalRegisters: number;
  uniqueStations: number;
  draftsCount: number;
  submittedCount: number;
}

// Simplified report types - only Submitted vs Not Submitted
export type ReportFormat = "pdf" | "docx";

export interface DownloadReportParams {
  format?: ReportFormat;
  fromDate?: string;
  toDate?: string;
  status?: string; // 'submitted' | 'not_submitted' | ''
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
  registerCategories: { category: string; names: string[] }[];
  registers: { category: string; name: string }[];
  report: StationReport | null;
  dashboardStats: AdminDashboardStats | null;
  reviewQueue: AdminReviewQueue | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isReviewing: boolean;
  isDownloading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Keep existing interfaces for backwards compatibility
export interface StationReport {
  totalStations: number;
  stationsByStatus: Record<string, number>;
  stations: Array<{
    station: string;
    status: string;
    lastUpdatedAt?: string;
    submittedAt?: string;
    submittedBy?: string;
    submitterName?: string;
    draftExists: boolean;
    hasSubmitted: boolean;
    progress: {
      fileFoldersComplete: boolean;
      registersComplete: boolean;
      percentageComplete: number;
    };
  }>;
  summary: {
    completed: number;
    pending: number;
    notStarted: number;
    total: number;
    completionRate: number;
  };
}

export interface AdminDashboardStats {
  totalStations: number;
  submissionsToday: number;
  pendingReviews: number;
  draftsCount: number;
  submittedCount: number;
  notStartedCount: number;
  completionRate: number;
  recentActivity: Array<{
    id: string;
    station: string;
    action: "submitted" | "approved" | "updated" | "created" | "reviewed" | "rejected";
    timestamp: string;
    user: string;
    details?: string;
  }>;
}

export interface AdminReviewQueue {
  pending: StationRequirementSubmission[];
  approved: StationRequirementSubmission[];
  needsRevision: StationRequirementSubmission[];
  total: number;
}

const initialState: StationRequirementsState = {
  submissions: [],
  currentSubmission: null,
  totals: null,
  stations: [],
  categories: getAllValidCases(),
  registerCategories: getAllValidRegisters(),
  registers: getAllRegistersFlat(),
  report: null,
  dashboardStats: null,
  reviewQueue: null,
  isLoading: false,
  isSubmitting: false,
  isReviewing: false,
  isDownloading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// --- ASYNC THUNKS ---
export const createSubmission = createAsyncThunk<
  { submission: StationRequirementSubmission },
  {
    station: string;
    fileFolders: StationRequirementItem[];
    registers: StationRequirementItem[];
    status?: SubmissionStatus;
  },
  { rejectValue: string }
>(
  "stationRequirements/createSubmission",
  async (payload, { rejectWithValue }) => {
    try {
      const status = payload.status || "draft";
      console.log(`📤 Creating ${status} submission:`, {
        station: payload.station,
        fileFoldersCount: payload.fileFolders.length,
        registersCount: payload.registers.length,
        status,
      });

      const response = await axiosClient.post("/station-requirements", payload);
      console.log("✅ Submission created:", {
        id: response.data.data.submission.id,
        station: response.data.data.submission.station,
        status: response.data.data.submission.status,
      });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to create submission:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to create submission.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const submitDraft = createAsyncThunk<
  { submission: StationRequirementSubmission },
  { id: string; sendEmail?: boolean },
  { rejectValue: string }
>(
  "stationRequirements/submitDraft",
  async ({ id, sendEmail = true }, { rejectWithValue }) => {
    try {
      console.log("📤 Submitting draft:", { id, sendEmail });
      const response = await axiosClient.post(`/station-requirements/${id}/submit`, { sendEmail });
      console.log("✅ Draft submitted:", {
        id: response.data.data.submission.id,
        station: response.data.data.submission.station,
        submittedAt: response.data.data.submission.submittedAt,
      });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to submit draft:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to submit draft.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const adminReviewSubmission = createAsyncThunk<
  { submission: StationRequirementSubmission },
  {
    id: string;
    reviewStatus: ReviewStatus;
    adminNotes?: string;
    sendNotification?: boolean;
  },
  { rejectValue: string }
>(
  "stationRequirements/adminReviewSubmission",
  async ({ id, reviewStatus, adminNotes, sendNotification = true }, { rejectWithValue }) => {
    try {
      console.log("📤 Reviewing submission:", { id, reviewStatus, adminNotes, sendNotification });
      const response = await axiosClient.post(`/station-requirements/${id}/review`, {
        reviewStatus,
        adminNotes,
        sendNotification,
      });
      console.log("✅ Submission reviewed:", {
        id: response.data.data.submission.id,
        station: response.data.data.submission.station,
        reviewStatus: response.data.data.submission.reviewStatus,
      });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to review submission:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to review submission.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const getSubmissions = createAsyncThunk<
  {
    submissions: StationRequirementSummary[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  },
  {
    station?: string;
    status?: SubmissionStatus;
    reviewStatus?: ReviewStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    sortBy?: "updatedAt" | "submittedAt" | "station";
    sortOrder?: "asc" | "desc";
    adminView?: boolean;
  },
  { rejectValue: string }
>(
  "stationRequirements/getSubmissions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string | number | boolean> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
      if (!cleanParams.page) cleanParams.page = 1;
      if (!cleanParams.limit) cleanParams.limit = 20;
      if (!cleanParams.sortBy) cleanParams.sortBy = "updatedAt";
      if (!cleanParams.sortOrder) cleanParams.sortOrder = "desc";

      console.log("📤 Fetching submissions with params:", cleanParams);
      const response = await axiosClient.get("/station-requirements", { params: cleanParams });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch submissions:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch submissions.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const getStationReport = createAsyncThunk<
  { report: StationReport },
  { status?: string; fromDate?: string; toDate?: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  "stationRequirements/getStationReport",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/station-requirements/report", { params });
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch station report.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const getAdminDashboard = createAsyncThunk<
  { stats: AdminDashboardStats },
  void,
  { rejectValue: string }
>("stationRequirements/getAdminDashboard", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get("/station-requirements/dashboard");
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch dashboard stats.");
    }
    return rejectWithValue("An unexpected error occurred.");
  }
});

export const getReviewQueue = createAsyncThunk<
  { queue: AdminReviewQueue },
  void,
  { rejectValue: string }
>("stationRequirements/getReviewQueue", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get("/station-requirements/review-queue");
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch review queue.");
    }
    return rejectWithValue("An unexpected error occurred.");
  }
});

export const getSubmissionById = createAsyncThunk<
  { submission: StationRequirementSubmission },
  string,
  { rejectValue: string }
>("stationRequirements/getSubmissionById", async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get(`/station-requirements/${id}`);
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch submission.");
    }
    return rejectWithValue("An unexpected error occurred.");
  }
});

export const updateSubmission = createAsyncThunk<
  { submission: StationRequirementSubmission },
  {
    id: string;
    station?: string;
    fileFolders?: StationRequirementItem[];
    registers?: StationRequirementItem[];
    status?: SubmissionStatus;
    reviewStatus?: ReviewStatus;
    adminNotes?: string;
  },
  { rejectValue: string }
>(
  "stationRequirements/updateSubmission",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/station-requirements/${id}`, payload);
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to update submission.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const deleteSubmission = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("stationRequirements/deleteSubmission", async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/station-requirements/${id}`);
    return id;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete submission.");
    }
    return rejectWithValue("An unexpected error occurred.");
  }
});

export const getSubmissionTotals = createAsyncThunk<
  SubmissionTotals,
  void,
  { rejectValue: string }
>("stationRequirements/getSubmissionTotals", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get("/station-requirements/totals");
    return response.data.data;
  } catch (err: unknown) {
    if (axios.isAxiosError<ApiErrorResponse>(err)) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch totals.");
    }
    return rejectWithValue("An unexpected error occurred.");
  }
});

export const getUniqueStations = createAsyncThunk<
  { stations: string[] },
  void,
  { rejectValue: string }
>(
  "stationRequirements/getUniqueStations",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await axiosClient.get("/station-requirements/stations");
      if (response.data?.data?.stations && Array.isArray(response.data.data.stations)) {
        return { stations: response.data.data.stations };
      }
      const state = getState() as { stationRequirements: StationRequirementsState };
      const submissions = state.stationRequirements.submissions;
      if (submissions.length > 0) {
        const stations = [...new Set(submissions.map((s) => s.station))].sort();
        return { stations };
      }
      return { stations: [] };
    } catch (err: unknown) {
      try {
        const state = getState() as { stationRequirements: StationRequirementsState };
        const submissions = state.stationRequirements.submissions;
        if (submissions.length > 0) {
          const stations = [...new Set(submissions.map((s) => s.station))].sort();
          return { stations };
        }
      } catch (deriveError) {
        console.warn("Could not derive stations from state:", deriveError);
      }
      if (axios.isAxiosError(err) && (err.response?.status === 400 || err.response?.status === 404)) {
        console.warn("⚠️ Stations endpoint not available, returning empty array");
        return { stations: [] };
      }
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch stations.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

export const getRegisterCategories = createAsyncThunk<
  { categories: { category: string; names: string[] }[] },
  void,
  { rejectValue: string }
>("stationRequirements/getRegisterCategories", async () => {
  try {
    console.log("📤 Fetching register categories from backend");
    const response = await axiosClient.get("/station-requirements/register-categories");
    return response.data.data;
  } catch {
    console.warn("⚠️ Failed to fetch register categories from backend, using local data");
    return { categories: getAllValidRegisters() };
  }
});

export const getRegisters = createAsyncThunk<
  {
    categories: { category: string; names: string[] }[];
    registers: { category: string; name: string }[];
  },
  void,
  { rejectValue: string }
>("stationRequirements/getRegisters", async () => {
  try {
    console.log("📤 Fetching registers from backend");
    const response = await axiosClient.get("/station-requirements/registers");
    return response.data.data;
  } catch {
    console.warn("⚠️ Failed to fetch registers from backend, using local data");
    return {
      categories: getAllValidRegisters(),
      registers: getAllRegistersFlat(),
    };
  }
});

export const getMySubmissions = createAsyncThunk<
  {
    submissions: StationRequirementSummary[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  },
  {
    station?: string;
    status?: SubmissionStatus;
    reviewStatus?: ReviewStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    sortBy?: "updatedAt" | "submittedAt" | "station";
    sortOrder?: "asc" | "desc";
  },
  { rejectValue: string }
>(
  "stationRequirements/getMySubmissions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string | number | boolean> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
      if (!cleanParams.page) cleanParams.page = 1;
      if (!cleanParams.limit) cleanParams.limit = 20;
      if (!cleanParams.sortBy) cleanParams.sortBy = "updatedAt";
      if (!cleanParams.sortOrder) cleanParams.sortOrder = "desc";

      console.log("📤 Fetching my submissions with params:", cleanParams);
      const response = await axiosClient.get("/station-requirements/my-submissions", { params: cleanParams });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch your submissions:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch your submissions.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

// --- DOWNLOAD REPORT ---
export const downloadReport = createAsyncThunk<
  Blob,
  DownloadReportParams,
  { rejectValue: string }
>(
  "stationRequirements/downloadReport",
  async (params, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string> = {};
      if (params.format) cleanParams.format = params.format;
      if (params.fromDate) cleanParams.fromDate = params.fromDate;
      if (params.toDate) cleanParams.toDate = params.toDate;
      if (params.status) cleanParams.status = params.status;

      console.log("📤 Downloading report with params:", cleanParams);

      const response = await axiosClient.get("/station-requirements/download-report", {
        params: cleanParams,
        responseType: "blob",
      });

      console.log("✅ Report downloaded successfully");
      return response.data;
    } catch (err: unknown) {
      console.error("❌ Failed to download report:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(err.response?.data?.message || "Failed to download report.");
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  },
);

// --- SLICE ---
const stationRequirementsSlice = createSlice({
  name: "stationRequirements",
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
        const stations = [...new Set(state.submissions.map((s) => s.station))].sort();
        if (stations.length > 0) {
          state.stations = stations;
        }
      }
    },
    clearReport: (state) => {
      state.report = null;
    },
    clearDashboard: (state) => {
      state.dashboardStats = null;
      state.reviewQueue = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSubmission.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        if (state.submissions) {
          const summary: StationRequirementSummary = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
            registersTotal: action.payload.submission.registers.reduce((sum, item) => sum + item.quantity, 0),
            status: action.payload.submission.status,
            updatedAt: action.payload.submission.updatedAt,
            submittedAt: action.payload.submission.submittedAt,
            submitterName: action.payload.submission.submitterName,
            reviewStatus: action.payload.submission.reviewStatus,
          };
          state.submissions.unshift(summary);
        }
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to create submission";
      })
      .addCase(getMySubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMySubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = action.payload.submissions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
        if (state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map((s) => s.station))].sort();
          if (stations.length > 0 && state.stations.length === 0) {
            state.stations = stations;
          }
        }
      })
      .addCase(getMySubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch your submissions";
      })
      .addCase(submitDraft.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitDraft.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        const index = state.submissions.findIndex((s) => s.id === action.payload.submission.id);
        if (index !== -1) {
          state.submissions[index] = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
            registersTotal: action.payload.submission.registers.reduce((sum, item) => sum + item.quantity, 0),
            status: action.payload.submission.status,
            updatedAt: action.payload.submission.updatedAt,
            submittedAt: action.payload.submission.submittedAt,
            submitterName: action.payload.submission.submitterName,
            reviewStatus: action.payload.submission.reviewStatus,
          };
        }
      })
      .addCase(submitDraft.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to submit draft";
      })
      .addCase(adminReviewSubmission.pending, (state) => {
        state.isReviewing = true;
        state.error = null;
      })
      .addCase(adminReviewSubmission.fulfilled, (state, action) => {
        state.isReviewing = false;
        state.currentSubmission = action.payload.submission;
        const index = state.submissions.findIndex((s) => s.id === action.payload.submission.id);
        if (index !== -1) {
          state.submissions[index] = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
            registersTotal: action.payload.submission.registers.reduce((sum, item) => sum + item.quantity, 0),
            status: action.payload.submission.status,
            updatedAt: action.payload.submission.updatedAt,
            submittedAt: action.payload.submission.submittedAt,
            submitterName: action.payload.submission.submitterName,
            reviewStatus: action.payload.submission.reviewStatus,
          };
        }
      })
      .addCase(adminReviewSubmission.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload || "Failed to review submission";
      })
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
          const stations = [...new Set(state.submissions.map((s) => s.station))].sort();
          if (stations.length > 0 && state.stations.length === 0) {
            state.stations = stations;
          }
        }
      })
      .addCase(getSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch submissions";
      })
      .addCase(getStationReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStationReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.report = action.payload.report;
      })
      .addCase(getStationReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch station report";
      })
      .addCase(getAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload.stats;
      })
      .addCase(getAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch dashboard stats";
      })
      .addCase(getReviewQueue.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getReviewQueue.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviewQueue = action.payload.queue;
      })
      .addCase(getReviewQueue.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch review queue";
      })
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
        state.error = action.payload || "Failed to fetch submission";
      })
      .addCase(updateSubmission.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        const index = state.submissions.findIndex((s) => s.id === action.payload.submission.id);
        if (index !== -1) {
          state.submissions[index] = {
            id: action.payload.submission.id,
            station: action.payload.submission.station,
            fileFoldersTotal: action.payload.submission.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
            registersTotal: action.payload.submission.registers.reduce((sum, item) => sum + item.quantity, 0),
            status: action.payload.submission.status,
            updatedAt: action.payload.submission.updatedAt,
            submittedAt: action.payload.submission.submittedAt,
            submitterName: action.payload.submission.submitterName,
            reviewStatus: action.payload.submission.reviewStatus,
          };
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to update submission";
      })
      .addCase(deleteSubmission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = state.submissions.filter((sub) => sub.id !== action.payload);
        if (state.currentSubmission?.id === action.payload) {
          state.currentSubmission = null;
        }
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete submission";
      })
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
        state.error = action.payload || "Failed to fetch totals";
      })
      .addCase(getUniqueStations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUniqueStations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stations = action.payload.stations;
        if (state.stations.length === 0 && state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map((s) => s.station))].sort();
          if (stations.length > 0) {
            state.stations = stations;
          }
        }
      })
      .addCase(getUniqueStations.rejected, (state, action) => {
        state.isLoading = false;
        if (!action.payload?.includes("400") && !action.payload?.includes("404")) {
          state.error = action.payload || "Failed to fetch stations";
        }
        if (state.submissions.length > 0) {
          const stations = [...new Set(state.submissions.map((s) => s.station))].sort();
          if (stations.length > 0) {
            state.stations = stations;
          }
        }
      })
      .addCase(getRegisterCategories.fulfilled, (state, action) => {
        state.registerCategories = action.payload.categories;
      })
      .addCase(getRegisterCategories.rejected, (state) => {
        state.registerCategories = getAllValidRegisters();
      })
      .addCase(getRegisters.fulfilled, (state, action) => {
        state.registerCategories = action.payload.categories;
        state.registers = action.payload.registers;
      })
      .addCase(getRegisters.rejected, (state) => {
        state.registerCategories = getAllValidRegisters();
        state.registers = getAllRegistersFlat();
      })
      .addCase(downloadReport.pending, (state) => {
        state.isDownloading = true;
        state.error = null;
      })
      .addCase(downloadReport.fulfilled, (state) => {
        state.isDownloading = false;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.isDownloading = false;
        state.error = action.payload || "Failed to download report";
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
  clearReport,
  clearDashboard,
} = stationRequirementsSlice.actions;

export default stationRequirementsSlice.reducer;