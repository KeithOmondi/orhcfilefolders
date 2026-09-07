// types/adminFormBuilder.types.ts

// ============================================
// Core Types for Dynamic Form Builder
// ============================================

export type FormFieldType = 'number' | 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'radio';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[]; // For select, radio
  defaultValue?: string | number | boolean;
  min?: number; // For number fields
  max?: number; // For number fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isActive: boolean;
}

// ============================================
// User Response Types
// ============================================

export interface FormResponseValue {
  fieldId: string;
  value: string | number | boolean | string[];
}

export interface FormSectionResponse {
  sectionId: string;
  values: FormResponseValue[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  station: string;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  responses: FormSectionResponse[];
  status: 'draft' | 'submitted';
  submittedAt?: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ============================================
// Example: Pending Processings to Court of Appeal
// ============================================

export const PENDING_PROCESSINGS_SCHEMA: Omit<FormSection, 'id'> = {
  title: 'Pending Processings to Court of Appeal',
  description: 'Enter the number of pending processings for each category',
  fields: [
    {
      id: 'criminal',
      type: 'number',
      label: 'Criminal',
      placeholder: 'Enter number',
      required: true,
      min: 0,
      validation: {
        min: 0,
        message: 'Number must be 0 or greater'
      }
    },
    {
      id: 'civil',
      type: 'number',
      label: 'Civil',
      placeholder: 'Enter number',
      required: true,
      min: 0,
      validation: {
        min: 0,
        message: 'Number must be 0 or greater'
      }
    },
    {
      id: 'family',
      type: 'number',
      label: 'Family',
      placeholder: 'Enter number',
      required: true,
      min: 0,
      validation: {
        min: 0,
        message: 'Number must be 0 or greater'
      }
    },
    {
      id: 'commercial',
      type: 'number',
      label: 'Commercial',
      placeholder: 'Enter number',
      required: true,
      min: 0,
      validation: {
        min: 0,
        message: 'Number must be 0 or greater'
      }
    }
  ],
  order: 1
};

// ============================================
// Admin Form Builder Types
// ============================================

export interface CreateFormInput {
  title: string;
  description?: string;
  sections: Omit<FormSection, 'id'>[];
}

export interface UpdateFormInput {
  title?: string;
  description?: string;
  sections?: Omit<FormSection, 'id'>[];
  status?: 'draft' | 'published' | 'archived';
  isActive?: boolean;
}

export interface AddSectionInput {
  title: string;
  description?: string;
  fields: Omit<FormField, 'id'>[];
  order?: number;
}

export interface AddFieldInput {
  sectionId: string;
  field: Omit<FormField, 'id'>;
}

export interface SubmitFormResponseInput {
  station: string;
  responses: FormSectionResponse[];
  status?: 'draft' | 'submitted';
}

// ============================================
// API Response Types
// ============================================

export interface FormResponse {
  form: DynamicForm;
  message?: string;
}

export interface FormSubmissionResponse {
  submission: FormSubmission;
  message?: string;
}

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

// ============================================
// Statistics Types
// ============================================

export interface FormStatistics {
  totalSubmissions: number;
  draftCount: number;
  submittedCount: number;
  stationCount: number;
  submissionsByStation: Array<{ station: string; count: number }>;
  submissionsByDate: Array<{ date: string; count: number }>;
}