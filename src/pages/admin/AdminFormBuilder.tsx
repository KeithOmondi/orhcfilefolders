// pages/AdminFormBuilder.tsx

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  getForms,
  getFormById,
  createForm,
  deleteForm,
  publishForm,
  unpublishForm,
  duplicateForm,
  getFormSubmissions,
  getFormStatistics,
  getFormAnalytics,
  exportSubmissions,
  getFormTemplates,
  createFormFromTemplate,
  clearCurrentForm,
  clearError,
  setPage,
  type CreateFormInput,
} from '../../store/slices/formBuilderSlice';

// ============================================================
// Icons - react-icons
// ============================================================

import {
  BiPlus,
  BiTrash,
  BiEdit,
  BiCopy,
  BiShow,
  BiFile,
  BiSend,
  BiBarChart,
  BiChevronRight,
  BiLoader,
  BiSearch,
  BiX,
} from 'react-icons/bi';
import toast from 'react-hot-toast';

// ============================================================
// Types
// ============================================================

type ViewMode = 'list' | 'editor' | 'submissions' | 'analytics';

interface AdminFormBuilderProps {
  formId?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

const hasMorePages = (pagination: PaginationState): boolean =>
  pagination.page * pagination.limit < pagination.total;

// ============================================================
// Main Component
// ============================================================

export const AdminFormBuilder: React.FC<AdminFormBuilderProps> = ({ formId }) => {
  const dispatch = useAppDispatch();
  const {
    forms,
    currentForm,
    submissions,
    statistics,
    analytics,
    templates,
    isLoading,
    isSubmitting,
    error,
    pagination,
  } = useAppSelector((state) => state.formBuilder);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(formId || null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState<string | null>(null);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load forms on mount
  useEffect(() => {
    dispatch(getForms({ page: 1, limit: 20 }));
    dispatch(getFormTemplates({ limit: 10 }));
  }, [dispatch]);

  // Adjust local view state when the `formId` prop changes
  const [prevPropFormId, setPrevPropFormId] = useState<string | undefined>(formId);
  if (formId !== prevPropFormId) {
    setPrevPropFormId(formId);
    if (formId) {
      setSelectedFormId(formId);
      setViewMode('editor');
    }
  }

  // Fetch form when formId changes
  useEffect(() => {
    if (formId) {
      dispatch(getFormById(formId));
    }
  }, [formId, dispatch]);

  // Handle error toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) {
      toast.error('Form title is required');
      return;
    }

    const input: CreateFormInput = {
      title: newFormTitle.trim(),
      description: newFormDescription.trim() || undefined,
      sections: [
        {
          title: 'Section 1',
          description: 'Default section',
          questions: [
            {
              type: 'short_answer',
              title: 'Question 1',
              description: 'Enter your response',
              required: false,
            }
          ],
          order: 0,
          type: 'section',
        },
      ],
      settings: {
        isPublished: false,
        isPublic: false,
        requireLogin: false,
        collectEmail: false,
        allowEditing: true,
        showProgressBar: 'top',
        showQuestionNumbers: true,
        sendEmailConfirmation: false,
        limitResponses: false,
        isQuiz: false,
        captcha: false,
      },
    };

    try {
      const result = await dispatch(createForm(input)).unwrap();
      if (result.form) {
        toast.success(`Form "${result.form.title}" created successfully`);
        setIsCreateDialogOpen(false);
        setNewFormTitle('');
        setNewFormDescription('');
        setSelectedFormId(result.form.id);
        setViewMode('editor');
        dispatch(getFormById(result.form.id));
      }
    } catch (err) {
      console.error('Create form error:', err);
    }
  };

  const handleCreateFromTemplate = async (templateId: string, templateName: string) => {
    setIsTemplateLoading(templateId);
    try {
      const result = await dispatch(createFormFromTemplate({
        templateId,
        title: templateName,
      })).unwrap();

      if (result.form) {
        toast.success(`Form "${result.form.title}" created from template`);
        setSelectedFormId(result.form.id);
        setViewMode('editor');
        dispatch(getFormById(result.form.id));
      }
    } catch (err) {
      console.error('Create from template error:', err);
      toast.error('Failed to create form from template');
    } finally {
      setIsTemplateLoading(null);
    }
  };

  const handleSelectForm = (id: string) => {
    setSelectedFormId(id);
    setViewMode('editor');
    dispatch(getFormById(id));
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      await dispatch(deleteForm(id)).unwrap();
      toast.success('Form deleted successfully');
      if (selectedFormId === id) {
        setSelectedFormId(null);
        setViewMode('list');
      }
    } catch {
      toast.error('Failed to delete form');
    }
  };

  const handlePublishForm = async (id: string) => {
    try {
      await dispatch(publishForm(id)).unwrap();
      toast.success('Form published successfully');
    } catch {
      toast.error('Failed to publish form');
    }
  };

  const handleUnpublishForm = async (id: string) => {
    try {
      await dispatch(unpublishForm(id)).unwrap();
      toast.success('Form unpublished successfully');
    } catch {
      toast.error('Failed to unpublish form');
    }
  };

  const handleDuplicateForm = async (id: string) => {
    try {
      const result = await dispatch(duplicateForm({ formId: id })).unwrap();
      toast.success(`Form duplicated as "${result.form.title}"`);
    } catch {
      toast.error('Failed to duplicate form');
    }
  };

  const handleExportSubmissions = async (formId: string, format: 'csv' | 'excel' | 'pdf' | 'json') => {
    try {
      const result = await dispatch(exportSubmissions({ formId, format })).unwrap();
      toast.success(`Submissions exported as ${format.toUpperCase()}`);
      window.open(result.url, '_blank');
    } catch {
      toast.error('Failed to export submissions');
    }
  };

  const handleViewSubmissions = (id: string) => {
    setSelectedFormId(id);
    setViewMode('submissions');
    dispatch(getFormSubmissions({ formId: id, page: 1, limit: 20 }));
    dispatch(getFormStatistics(id));
  };

  const handleViewAnalytics = (id: string) => {
    setSelectedFormId(id);
    setViewMode('analytics');
    dispatch(getFormAnalytics({ formId: id }));
    dispatch(getFormStatistics(id));
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFormId(null);
    dispatch(clearCurrentForm());
  };

  // ============================================================
  // Render: Loading State
  // ============================================================

  if (isLoading && viewMode === 'list' && forms.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: List View
  // ============================================================

  if (viewMode === 'list') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Builder</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage dynamic forms</p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <BiPlus className="h-4 w-4 mr-2" />
            New Form
          </button>
        </div>

        {/* Create Form Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Form</h2>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <BiX className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Form Title *
                  </label>
                  <input
                    type="text"
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    placeholder="Enter form title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newFormDescription}
                    onChange={(e) => setNewFormDescription(e.target.value)}
                    placeholder="Enter form description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <BiLoader className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Form'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Templates</h3>
            <div className="flex gap-2 flex-wrap">
              {templates.slice(0, 5).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template.id, template.name)}
                  disabled={isTemplateLoading === template.id}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTemplateLoading === template.id ? (
                    <>
                      <BiLoader className="h-3 w-3 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <BiFile className="h-3 w-3 mr-2" />
                      {template.name}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Forms List */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No forms found. Create your first form!
                  </td>
                </tr>
              ) : (
                forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{form.title}</div>
                      {form.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {form.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        form.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : form.status === 'closed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {form.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {form.responseCount || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleSelectForm(form.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <BiEdit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleViewSubmissions(form.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Submissions"
                        >
                          <BiFile className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleViewAnalytics(form.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Analytics"
                        >
                          <BiBarChart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {form.status === 'published' ? (
                          <button
                            onClick={() => handleUnpublishForm(form.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Unpublish"
                          >
                            <BiShow className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishForm(form.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Publish"
                          >
                            <BiSend className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicateForm(form.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Duplicate"
                        >
                          <BiCopy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                          title="Delete"
                        >
                          <BiTrash className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  dispatch(setPage(pagination.page - 1));
                  dispatch(getForms({ page: pagination.page - 1, limit: pagination.limit }));
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={!hasMorePages(pagination)}
                onClick={() => {
                  dispatch(setPage(pagination.page + 1));
                  dispatch(getForms({ page: pagination.page + 1, limit: pagination.limit }));
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Render: Editor View
  // ============================================================

  if (viewMode === 'editor' && currentForm) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
            >
              <BiChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Forms
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentForm.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status:{' '}
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                currentForm.status === 'published'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {currentForm.status}
              </span>
              {currentForm.responseCount > 0 && ` • ${currentForm.responseCount} responses`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewSubmissions(currentForm.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <BiFile className="h-4 w-4 mr-2" />
              Submissions
            </button>
            <button
              onClick={() => handleViewAnalytics(currentForm.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <BiBarChart className="h-4 w-4 mr-2" />
              Analytics
            </button>
            {currentForm.status === 'published' ? (
              <button
                onClick={() => handleUnpublishForm(currentForm.id)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => handlePublishForm(currentForm.id)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <BiSend className="h-4 w-4 mr-2" />
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-4">
          {currentForm.sections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">{section.title}</h3>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <BiPlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors">
                    <BiTrash className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {section.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <p>No questions yet. Click "Add Question" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {section.questions.map((question) => (
                      <div key={question.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {question.type.replace('_', ' ')}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">{question.title}</span>
                              {question.required && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            {question.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {question.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                              <BiEdit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors">
                              <BiTrash className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center"
          >
            <BiPlus className="h-4 w-4 mr-2" />
            Add Section
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Submissions View
  // ============================================================

  if (viewMode === 'submissions' && selectedFormId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
            >
              <BiChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Forms
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Form: {currentForm?.title || selectedFormId}
            </p>
          </div>
          <div className="flex gap-2">
            {(['csv', 'excel', 'pdf', 'json'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handleExportSubmissions(selectedFormId, format)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors capitalize"
              >
                <BiFile className="h-4 w-4 mr-2" />
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Summary */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: statistics.totalSubmissions },
              { label: 'Submitted', value: statistics.submittedCount },
              { label: 'Drafts', value: statistics.draftCount },
              { label: 'Graded', value: statistics.gradedCount },
              { label: 'Avg Score', value: statistics.averageScore !== null ? statistics.averageScore.toFixed(1) : '-' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Submissions Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submission ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Respondent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No submissions yet
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                      {sub.submissionId}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {sub.respondentName || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {sub.respondentEmail || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        sub.status === 'submitted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {sub.score !== undefined ? (
                        <span className="font-medium">
                          {sub.score}{sub.maxScore ? `/${sub.maxScore}` : ''}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                        <BiShow className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  if (selectedFormId) {
                    dispatch(setPage(pagination.page - 1));
                    dispatch(getFormSubmissions({
                      formId: selectedFormId,
                      page: pagination.page - 1,
                      limit: pagination.limit,
                    }));
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                disabled={!hasMorePages(pagination)}
                onClick={() => {
                  if (selectedFormId) {
                    dispatch(setPage(pagination.page + 1));
                    dispatch(getFormSubmissions({
                      formId: selectedFormId,
                      page: pagination.page + 1,
                      limit: pagination.limit,
                    }));
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Render: Analytics View
  // ============================================================

  if (viewMode === 'analytics' && selectedFormId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={handleBackToList}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
            >
              <BiChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Forms
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Form: {currentForm?.title || selectedFormId}
            </p>
          </div>
          <button
            onClick={() => handleViewSubmissions(selectedFormId)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <BiFile className="h-4 w-4 mr-2" />
            View Submissions
          </button>
        </div>

        {/* Analytics Overview */}
        {analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Views', value: analytics.totalViews },
              { label: 'Starts', value: analytics.totalStarts },
              { label: 'Submissions', value: analytics.totalSubmissions },
              { label: 'Completion Rate', value: `${analytics.completionRate.toFixed(1)}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading analytics data...
          </div>
        )}

        {/* Daily Stats */}
        {analytics && analytics.dailyStats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Daily Activity (Last 30 Days)</h3>
            </div>
            <div className="p-4 space-y-2">
              {analytics.dailyStats.slice(0, 10).map((day) => {
                const maxSubmissions = Math.max(...analytics.dailyStats.map(d => d.submissions));
                return (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm w-24 text-gray-600 dark:text-gray-400">{day.date}</span>
                    <div className="flex-1 h-4 bg-blue-100 dark:bg-blue-900 rounded relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded transition-all duration-500"
                        style={{
                          width: `${maxSubmissions > 0 ? (day.submissions / maxSubmissions) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm min-w-[60px] text-right text-gray-600 dark:text-gray-400">
                      {day.submissions} submissions
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Analytics */}
        {analytics && analytics.questionAnalytics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Question Analytics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Skipped
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {analytics.questionAnalytics.map((q) => (
                    <tr key={q.questionId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{q.questionId}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{q.totalResponses}</td>
                      <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">{q.skippedResponses}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                        {q.averageValue !== undefined ? q.averageValue.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      Select a form to get started
    </div>
  );
};

export default AdminFormBuilder;