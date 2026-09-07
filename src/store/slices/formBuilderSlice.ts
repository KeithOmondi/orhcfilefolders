// store/slices/formBuilderSlice.ts

import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import axiosClient from "../../api/api";

// ============================================================
// TYPES - Google Forms Style
// ============================================================

export type QuestionType =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'multiple_choice_grid'
  | 'checkbox_grid'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file_upload'
  | 'section_header'
  | 'image'
  | 'video'
  | 'page_break';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  isCorrect?: boolean;
  imageUrl?: string;
  goToSection?: string;
}

export interface QuestionGridRow {
  id: string;
  label: string;
}

export interface QuestionGridColumn {
  id: string;
  label: string;
}

export interface ConditionalLogic {
  dependsOnQuestion: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: string | number | boolean | string[];
  showIfConditionMet: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
    customError?: string;
    fileTypes?: string[];
    maxFileSize?: number;
    maxFiles?: number;
  };
  options?: QuestionOption[];
  gridRows?: QuestionGridRow[];
  gridColumns?: QuestionGridColumn[];
  gridRowSelection?: 'single' | 'multiple';
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  imageUrl?: string;
  videoUrl?: string;
  helpText?: string;
  conditionalLogic?: ConditionalLogic;
  isQuizQuestion?: boolean;
  points?: number;
  shuffleOptions?: boolean;
  dataValidation?: {
    type: 'number' | 'text' | 'email' | 'url' | 'regex';
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
  type: 'section' | 'page';
  imageUrl?: string;
  videoUrl?: string;
  conditionalLogic?: ConditionalLogic;
}

export interface FormSettings {
  isPublished: boolean;
  isPublic: boolean;
  requireLogin: boolean;
  collectEmail: boolean;
  restrictToDomain?: string;
  allowEditing: boolean;
  limitResponses: boolean;
  maxResponses?: number;
  responseDeadline?: string;
  showProgressBar: 'top' | 'bottom' | 'none';
  showQuestionNumbers: boolean;
  confirmationMessage?: string;
  redirectUrl?: string;
  sendEmailConfirmation: boolean;
  emailConfirmationSubject?: string;
  emailConfirmationBody?: string;
  notificationEmails?: string[];
  isQuiz: boolean;
  showScoreImmediately?: boolean;
  showCorrectAnswers?: boolean;
  captcha: boolean;
  passwordProtection?: string;
  theme?: {
    headerColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
    textColor?: string;
    linkColor?: string;
  };
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  settings: FormSettings;
  status: 'draft' | 'published' | 'archived' | 'closed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
  responseCount: number;
  averageTimeToComplete?: number;
  tags?: string[];
  collaborators?: string[];
}

// ============================================================
// Response Types
// ============================================================

export interface GridResponse {
  [rowId: string]: string | string[];
}

export interface FileResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
}

export interface QuestionResponse {
  questionId: string;
  value: string | number | boolean | string[] | FileResponse[] | GridResponse;
  timestamp?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  pointsPossible?: number;
}

export interface SectionResponse {
  sectionId: string;
  responses: QuestionResponse[];
  startedAt?: string;
  completedAt?: string;
  timeSpent?: number;
}

export interface FormSubmission {
  id?: string;
  formId: string;
  formTitle: string;
  submissionId: string;
  respondentId?: string;
  respondentEmail?: string;
  respondentName?: string;
  isLoggedIn: boolean;
  sections: SectionResponse[];
  totalTimeSpent?: number;
  status: 'draft' | 'submitted' | 'edited' | 'deleted';
  submittedAt?: string;
  updatedAt: string;
  score?: number;
  maxScore?: number;
  passed?: boolean;
  gradedBy?: string;
  gradedAt?: string;
  feedback?: string;
  correctAnswers?: {
    [questionId: string]: string | number | boolean | string[];
  };
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
}

// ============================================================
// Create/Update Input Types
// ============================================================

export type CreateQuestionInput = Omit<Question, 'id' | 'options' | 'gridRows' | 'gridColumns'> & {
  options?: Omit<QuestionOption, 'id'> & { id?: string }[];
  gridRows?: Omit<QuestionGridRow, 'id'> & { id?: string }[];
  gridColumns?: Omit<QuestionGridColumn, 'id'> & { id?: string }[];
};

export interface CreateSectionInput {
  title: string;
  description?: string;
  questions: CreateQuestionInput[];
  order: number;
  type: 'section' | 'page';
  imageUrl?: string;
  videoUrl?: string;
  conditionalLogic?: ConditionalLogic;
}

export interface CreateFormInput {
  title: string;
  description?: string;
  sections: CreateSectionInput[];
  settings?: Partial<FormSettings>;
  template?: string;
}

export interface UpdateFormInput {
  title?: string;
  description?: string;
  sections?: CreateSectionInput[];
  settings?: Partial<FormSettings>;
  status?: 'draft' | 'published' | 'archived' | 'closed';
}

export interface SubmitFormResponseInput {
  respondentEmail?: string;
  respondentName?: string;
  sections: Omit<SectionResponse, 'sectionId'>[];
  status?: 'draft' | 'submitted';
}

// ============================================================
// Analytics Types
// ============================================================

export interface QuestionAnalytics {
  questionId: string;
  totalResponses: number;
  skippedResponses: number;
  averageValue?: number;
  responseDistribution?: {
    [value: string]: number;
  };
  averageTimeToAnswer?: number;
}

export interface FormAnalytics {
  formId: string;
  totalViews: number;
  totalStarts: number;
  totalSubmissions: number;
  completionRate: number;
  averageTime: number;
  dailyStats: {
    date: string;
    views: number;
    starts: number;
    submissions: number;
  }[];
  questionAnalytics: QuestionAnalytics[];
  countries: {
    [country: string]: number;
  };
}

export interface FormStatistics {
  totalSubmissions: number;
  draftCount: number;
  submittedCount: number;
  gradedCount: number;
  averageScore: number | null;
  submissionsByDate: Array<{ date: string; count: number }>;
}

// ============================================================
// Template Types
// ============================================================

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  thumbnailUrl?: string;
  sections: CreateSectionInput[];
  settings: Partial<FormSettings>;
  estimatedTime: number;
  popularity: number;
  isPremium: boolean;
}

// ============================================================
// API Response Types
// ============================================================

export interface FormsListResponse {
  forms: DynamicForm[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SubmissionsListResponse {
  submissions: FormSubmission[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ExportResponse {
  url: string;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  filename: string;
}

// ============================================================
// API Error Response Type
// ============================================================

interface ApiErrorResponse {
  message?: string;
  status?: string;
}

// ============================================================
// STATE
// ============================================================

interface FormBuilderState {
  forms: DynamicForm[];
  currentForm: DynamicForm | null;
  submissions: FormSubmission[];
  currentSubmission: FormSubmission | null;
  statistics: FormStatistics | null;
  analytics: FormAnalytics | null;
  templates: FormTemplate[];
  isLoading: boolean;
  isSubmitting: boolean;
  isReviewing: boolean;
  isExporting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: FormBuilderState = {
  forms: [],
  currentForm: null,
  submissions: [],
  currentSubmission: null,
  statistics: null,
  analytics: null,
  templates: [],
  isLoading: false,
  isSubmitting: false,
  isReviewing: false,
  isExporting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// ============================================================
// ASYNC THUNKS - Forms
// ============================================================

// Get all forms
export const getForms = createAsyncThunk<
  FormsListResponse,
  {
    status?: 'draft' | 'published' | 'archived' | 'closed';
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'responseCount';
    sortOrder?: 'asc' | 'desc';
  },
  { rejectValue: string }
>(
  "formBuilder/getForms",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string | number | boolean | string[]> = {};

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value) && value.length > 0) {
            cleanParams[key] = value.join(',');
          } else if (!Array.isArray(value)) {
            cleanParams[key] = value;
          }
        }
      });

      if (!cleanParams.page) cleanParams.page = 1;
      if (!cleanParams.limit) cleanParams.limit = 20;
      if (!cleanParams.sortBy) cleanParams.sortBy = "createdAt";
      if (!cleanParams.sortOrder) cleanParams.sortOrder = "desc";

      const response = await axiosClient.get("/forms", { params: cleanParams });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch forms:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch forms."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Get form by ID
export const getFormById = createAsyncThunk<
  { form: DynamicForm },
  string,
  { rejectValue: string }
>(
  "formBuilder/getFormById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/forms/${id}`);
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Create form
export const createForm = createAsyncThunk<
  { form: DynamicForm },
  CreateFormInput,
  { rejectValue: string }
>(
  "formBuilder/createForm",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/forms", payload);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to create form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to create form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Update form
export const updateForm = createAsyncThunk<
  { form: DynamicForm },
  { id: string; data: UpdateFormInput },
  { rejectValue: string }
>(
  "formBuilder/updateForm",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/forms/${id}`, data);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to update form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to update form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Delete form
export const deleteForm = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "formBuilder/deleteForm",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/forms/${id}`);
      return id;
    } catch (err: unknown) {
      console.error("❌ Failed to delete form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to delete form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Publish form
export const publishForm = createAsyncThunk<
  { form: DynamicForm },
  string,
  { rejectValue: string }
>(
  "formBuilder/publishForm",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/forms/${id}/publish`);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to publish form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to publish form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Unpublish form
export const unpublishForm = createAsyncThunk<
  { form: DynamicForm },
  string,
  { rejectValue: string }
>(
  "formBuilder/unpublishForm",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/forms/${id}/unpublish`);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to unpublish form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to unpublish form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Duplicate form
export const duplicateForm = createAsyncThunk<
  { form: DynamicForm },
  { formId: string; title?: string },
  { rejectValue: string }
>(
  "formBuilder/duplicateForm",
  async ({ formId, title }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/forms/${formId}/duplicate`, { title });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to duplicate form:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to duplicate form."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// ASYNC THUNKS - Sections
// ============================================================

// Add section
export const addSection = createAsyncThunk<
  { section: FormSection },
  { formId: string; data: CreateSectionInput },
  { rejectValue: string }
>(
  "formBuilder/addSection",
  async ({ formId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/forms/${formId}/sections`, data);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to add section:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to add section."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Delete section
export const deleteSection = createAsyncThunk<
  { sectionId: string },
  { formId: string; sectionId: string },
  { rejectValue: string }
>(
  "formBuilder/deleteSection",
  async ({ formId, sectionId }, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/forms/${formId}/sections/${sectionId}`);
      return { sectionId };
    } catch (err: unknown) {
      console.error("❌ Failed to delete section:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to delete section."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Reorder sections
export const reorderSections = createAsyncThunk<
  { form: DynamicForm },
  { formId: string; sectionOrders: Array<{ sectionId: string; order: number }> },
  { rejectValue: string }
>(
  "formBuilder/reorderSections",
  async ({ formId, sectionOrders }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/forms/${formId}/sections/reorder`, { sectionOrders });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to reorder sections:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to reorder sections."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// ASYNC THUNKS - Questions
// ============================================================

// Add question
export const addQuestion = createAsyncThunk<
  { question: Question },
  { formId: string; sectionId: string; data: CreateQuestionInput; position?: number },
  { rejectValue: string }
>(
  "formBuilder/addQuestion",
  async ({ formId, sectionId, data, position }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `/forms/${formId}/sections/${sectionId}/questions`,
        { question: data, position }
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to add question:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to add question."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Update question
export const updateQuestion = createAsyncThunk<
  { question: Question },
  { formId: string; sectionId: string; questionId: string; data: Partial<Question> },
  { rejectValue: string }
>(
  "formBuilder/updateQuestion",
  async ({ formId, sectionId, questionId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `/forms/${formId}/sections/${sectionId}/questions/${questionId}`,
        data
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to update question:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to update question."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Delete question
export const deleteQuestion = createAsyncThunk<
  { questionId: string },
  { formId: string; sectionId: string; questionId: string },
  { rejectValue: string }
>(
  "formBuilder/deleteQuestion",
  async ({ formId, sectionId, questionId }, { rejectWithValue }) => {
    try {
      await axiosClient.delete(
        `/forms/${formId}/sections/${sectionId}/questions/${questionId}`
      );
      return { questionId };
    } catch (err: unknown) {
      console.error("❌ Failed to delete question:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to delete question."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// ASYNC THUNKS - Submissions
// ============================================================

// Submit form response
export const submitFormResponse = createAsyncThunk<
  { submission: FormSubmission },
  { formId: string; data: SubmitFormResponseInput },
  { rejectValue: string }
>(
  "formBuilder/submitFormResponse",
  async ({ formId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/forms/${formId}/submit`, data);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to submit form response:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to submit form response."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Get form submissions
export const getFormSubmissions = createAsyncThunk<
  SubmissionsListResponse,
  {
    formId: string;
    respondentEmail?: string;
    respondentName?: string;
    status?: 'draft' | 'submitted' | 'edited' | 'deleted';
    fromDate?: string;
    toDate?: string;
    graded?: boolean;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  "formBuilder/getFormSubmissions",
  async ({ formId, ...params }, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string | number | boolean> = {};

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });

      if (!cleanParams.page) cleanParams.page = 1;
      if (!cleanParams.limit) cleanParams.limit = 20;

      const response = await axiosClient.get(
        `/forms/${formId}/submissions`,
        { params: cleanParams }
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch form submissions:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch form submissions."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Get my form submissions
export const getMyFormSubmissions = createAsyncThunk<
  SubmissionsListResponse,
  {
    formId?: string;
    status?: 'draft' | 'submitted' | 'edited' | 'deleted';
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  "formBuilder/getMyFormSubmissions",
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

      const response = await axiosClient.get(
        "/forms/my-submissions",
        { params: cleanParams }
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch your form submissions:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch your form submissions."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Get form submission by ID
export const getFormSubmissionById = createAsyncThunk<
  { submission: FormSubmission },
  string,
  { rejectValue: string }
>(
  "formBuilder/getFormSubmissionById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/forms/submissions/${id}`);
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch submission."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Review form submission
export const reviewFormSubmission = createAsyncThunk<
  { submission: FormSubmission },
  { id: string; feedback?: string; score?: number; passed?: boolean; questionScores?: Record<string, { isCorrect?: boolean; pointsAwarded?: number }> },
  { rejectValue: string }
>(
  "formBuilder/reviewFormSubmission",
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/forms/submissions/${id}/review`, data);
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to review form submission:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to review form submission."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Delete form submission
export const deleteFormSubmission = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "formBuilder/deleteFormSubmission",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/forms/submissions/${id}`);
      return id;
    } catch (err: unknown) {
      console.error("❌ Failed to delete form submission:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to delete form submission."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// ASYNC THUNKS - Statistics & Analytics
// ============================================================

// Get form statistics
export const getFormStatistics = createAsyncThunk<
  { stats: FormStatistics },
  string,
  { rejectValue: string }
>(
  "formBuilder/getFormStatistics",
  async (formId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/forms/statistics/${formId}`);
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch form statistics."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Get form analytics
export const getFormAnalytics = createAsyncThunk<
  { analytics: FormAnalytics },
  { formId: string; fromDate?: string; toDate?: string },
  { rejectValue: string }
>(
  "formBuilder/getFormAnalytics",
  async ({ formId, fromDate, toDate }, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await axiosClient.get(`/forms/analytics/${formId}`, { params });
      return response.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch form analytics."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Export submissions
export const exportSubmissions = createAsyncThunk<
  ExportResponse,
  {
    formId: string;
    format: 'csv' | 'excel' | 'pdf' | 'json';
    fromDate?: string;
    toDate?: string;
    status?: 'draft' | 'submitted' | 'edited' | 'deleted';
  },
  { rejectValue: string }
>(
  "formBuilder/exportSubmissions",
  async ({ formId, ...params }, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value);
        }
      });

      const response = await axiosClient.get(
        `/forms/${formId}/export`,
        { params: cleanParams }
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to export submissions:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to export submissions."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// ASYNC THUNKS - Templates
// ============================================================

// Get form templates
export const getFormTemplates = createAsyncThunk<
  { templates: FormTemplate[] },
  { category?: string; search?: string; limit?: number },
  { rejectValue: string }
>(
  "formBuilder/getFormTemplates",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams: Record<string, string | number> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });

      const response = await axiosClient.get("/forms/templates", { params: cleanParams });
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to fetch templates:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to fetch templates."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Create form from template
export const createFormFromTemplate = createAsyncThunk<
  { form: DynamicForm },
  { templateId: string; title?: string; settings?: Partial<FormSettings> },
  { rejectValue: string }
>(
  "formBuilder/createFormFromTemplate",
  async ({ templateId, title, settings }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(
        `/forms/templates/${templateId}`,
        { title, settings }
      );
      return response.data.data;
    } catch (err: unknown) {
      console.error("❌ Failed to create form from template:", err);
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        return rejectWithValue(
          err.response?.data?.message || "Failed to create form from template."
        );
      }
      return rejectWithValue("An unexpected error occurred.");
    }
  }
);

// ============================================================
// SLICE
// ============================================================

const formBuilderSlice = createSlice({
  name: "formBuilder",
  initialState,
  reducers: {
    clearCurrentForm: (state) => {
      state.currentForm = null;
    },
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
    clearStatistics: (state) => {
      state.statistics = null;
    },
    clearAnalytics: (state) => {
      state.analytics = null;
    },
    clearTemplates: (state) => {
      state.templates = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================================
      // getForms
      // ============================================================
      .addCase(getForms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getForms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms = action.payload.forms;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
      })
      .addCase(getForms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch forms";
      })

      // ============================================================
      // getFormById
      // ============================================================
      .addCase(getFormById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentForm = action.payload.form;
      })
      .addCase(getFormById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch form";
      })

      // ============================================================
      // createForm
      // ============================================================
      .addCase(createForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentForm = action.payload.form;
        state.forms.unshift(action.payload.form);
      })
      .addCase(createForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to create form";
      })

      // ============================================================
      // updateForm
      // ============================================================
      .addCase(updateForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentForm = action.payload.form;
        const index = state.forms.findIndex((f) => f.id === action.payload.form.id);
        if (index !== -1) {
          state.forms[index] = action.payload.form;
        }
      })
      .addCase(updateForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to update form";
      })

      // ============================================================
      // deleteForm
      // ============================================================
      .addCase(deleteForm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteForm.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms = state.forms.filter((f) => f.id !== action.payload);
        if (state.currentForm?.id === action.payload) {
          state.currentForm = null;
        }
      })
      .addCase(deleteForm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete form";
      })

      // ============================================================
      // publishForm
      // ============================================================
      .addCase(publishForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(publishForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentForm = action.payload.form;
        const index = state.forms.findIndex((f) => f.id === action.payload.form.id);
        if (index !== -1) {
          state.forms[index] = action.payload.form;
        }
      })
      .addCase(publishForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to publish form";
      })

      // ============================================================
      // unpublishForm
      // ============================================================
      .addCase(unpublishForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(unpublishForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentForm = action.payload.form;
        const index = state.forms.findIndex((f) => f.id === action.payload.form.id);
        if (index !== -1) {
          state.forms[index] = action.payload.form;
        }
      })
      .addCase(unpublishForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to unpublish form";
      })

      // ============================================================
      // duplicateForm
      // ============================================================
      .addCase(duplicateForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(duplicateForm.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.forms.unshift(action.payload.form);
      })
      .addCase(duplicateForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to duplicate form";
      })

      // ============================================================
      // addSection
      // ============================================================
      .addCase(addSection.fulfilled, (state, action) => {
        if (state.currentForm) {
          state.currentForm.sections.push(action.payload.section);
          // Update in forms list
          const index = state.forms.findIndex((f) => f.id === state.currentForm?.id);
          if (index !== -1) {
            state.forms[index] = { ...state.currentForm };
          }
        }
      })

      // ============================================================
      // deleteSection
      // ============================================================
      .addCase(deleteSection.fulfilled, (state, action) => {
        if (state.currentForm) {
          state.currentForm.sections = state.currentForm.sections.filter(
            (s) => s.id !== action.payload.sectionId
          );
          const index = state.forms.findIndex((f) => f.id === state.currentForm?.id);
          if (index !== -1) {
            state.forms[index] = { ...state.currentForm };
          }
        }
      })

      // ============================================================
      // reorderSections
      // ============================================================
      .addCase(reorderSections.fulfilled, (state, action) => {
        state.currentForm = action.payload.form;
        const index = state.forms.findIndex((f) => f.id === action.payload.form.id);
        if (index !== -1) {
          state.forms[index] = action.payload.form;
        }
      })

      // ============================================================
      // addQuestion
      // ============================================================
      .addCase(addQuestion.fulfilled, (state, action) => {
        if (state.currentForm) {
          for (const section of state.currentForm.sections) {
            const questionIndex = section.questions.findIndex(
              (q) => q.id === action.payload.question.id
            );
            if (questionIndex !== -1) {
              section.questions[questionIndex] = action.payload.question;
              break;
            }
            // If not found, it's a new question - add it
            if (!section.questions.some((q) => q.id === action.payload.question.id)) {
              // Find the section that should contain this question
              // For simplicity, we'll add it to the first section
              // In a real app, you'd track which section the question belongs to
              section.questions.push(action.payload.question);
              break;
            }
          }
          const index = state.forms.findIndex((f) => f.id === state.currentForm?.id);
          if (index !== -1) {
            state.forms[index] = { ...state.currentForm };
          }
        }
      })

      // ============================================================
      // updateQuestion
      // ============================================================
      .addCase(updateQuestion.fulfilled, (state, action) => {
        if (state.currentForm) {
          for (const section of state.currentForm.sections) {
            const index = section.questions.findIndex((q) => q.id === action.payload.question.id);
            if (index !== -1) {
              section.questions[index] = action.payload.question;
              break;
            }
          }
          const formIndex = state.forms.findIndex((f) => f.id === state.currentForm?.id);
          if (formIndex !== -1) {
            state.forms[formIndex] = { ...state.currentForm };
          }
        }
      })

      // ============================================================
      // deleteQuestion
      // ============================================================
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        if (state.currentForm) {
          for (const section of state.currentForm.sections) {
            section.questions = section.questions.filter(
              (q) => q.id !== action.payload.questionId
            );
          }
          const formIndex = state.forms.findIndex((f) => f.id === state.currentForm?.id);
          if (formIndex !== -1) {
            state.forms[formIndex] = { ...state.currentForm };
          }
        }
      })

      // ============================================================
      // submitFormResponse
      // ============================================================
      .addCase(submitFormResponse.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitFormResponse.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload.submission;
        state.submissions.unshift(action.payload.submission);
      })
      .addCase(submitFormResponse.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to submit form response";
      })

      // ============================================================
      // getFormSubmissions
      // ============================================================
      .addCase(getFormSubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormSubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = action.payload.submissions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
      })
      .addCase(getFormSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch form submissions";
      })

      // ============================================================
      // getMyFormSubmissions
      // ============================================================
      .addCase(getMyFormSubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyFormSubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = action.payload.submissions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
      })
      .addCase(getMyFormSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch your form submissions";
      })

      // ============================================================
      // getFormSubmissionById
      // ============================================================
      .addCase(getFormSubmissionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormSubmissionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubmission = action.payload.submission;
      })
      .addCase(getFormSubmissionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch form submission";
      })

      // ============================================================
      // reviewFormSubmission
      // ============================================================
      .addCase(reviewFormSubmission.pending, (state) => {
        state.isReviewing = true;
        state.error = null;
      })
      .addCase(reviewFormSubmission.fulfilled, (state, action) => {
        state.isReviewing = false;
        state.currentSubmission = action.payload.submission;
        const index = state.submissions.findIndex((s) => s.id === action.payload.submission.id);
        if (index !== -1) {
          state.submissions[index] = action.payload.submission;
        }
      })
      .addCase(reviewFormSubmission.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload || "Failed to review form submission";
      })

      // ============================================================
      // deleteFormSubmission
      // ============================================================
      .addCase(deleteFormSubmission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFormSubmission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.submissions = state.submissions.filter((s) => s.id !== action.payload);
        if (state.currentSubmission?.id === action.payload) {
          state.currentSubmission = null;
        }
      })
      .addCase(deleteFormSubmission.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete form submission";
      })

      // ============================================================
      // getFormStatistics
      // ============================================================
      .addCase(getFormStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.stats;
      })
      .addCase(getFormStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch form statistics";
      })

      // ============================================================
      // getFormAnalytics
      // ============================================================
      .addCase(getFormAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload.analytics;
      })
      .addCase(getFormAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch form analytics";
      })

      // ============================================================
      // exportSubmissions
      // ============================================================
      .addCase(exportSubmissions.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportSubmissions.fulfilled, (state) => {
        state.isExporting = false;
      })
      .addCase(exportSubmissions.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload || "Failed to export submissions";
      })

      // ============================================================
      // getFormTemplates
      // ============================================================
      .addCase(getFormTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFormTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload.templates;
      })
      .addCase(getFormTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch templates";
      })

      // ============================================================
      // createFormFromTemplate
      // ============================================================
      .addCase(createFormFromTemplate.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createFormFromTemplate.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.forms.unshift(action.payload.form);
        state.currentForm = action.payload.form;
      })
      .addCase(createFormFromTemplate.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to create form from template";
      });
  },
});

// ============================================================
// EXPORTS
// ============================================================

export const {
  clearCurrentForm,
  clearCurrentSubmission,
  clearError,
  resetPagination,
  setPage,
  setLimit,
  clearStatistics,
  clearAnalytics,
  clearTemplates,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;