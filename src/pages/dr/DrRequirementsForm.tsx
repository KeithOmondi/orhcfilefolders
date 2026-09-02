// DrRequirementsForm.tsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSubmission,
  updateSubmission,
  getSubmissionById,
  getUniqueStations,
  clearError,
  clearCurrentSubmission,
  CASE_CATEGORIES,
  CASE_REGISTERS,
  ADDITIONAL_REGISTERS,
  getCaseCode,
  getCaseColor,
  type StationRequirementItem,
  type SubmissionStatus,
  type StationRequirementSubmission,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

interface FormData {
  station: string;
  status: SubmissionStatus;
}

// ============================================================
// COLOUR NAME -> swatch hex, for the "Colour" column
// ============================================================
const COLOR_HEX: Record<string, string> = {
  'Dark Purple': '#5B2C6F',
  'Light Yellow': '#FFF6B7',
  'Red': '#E53935',
  'Sky Blue': '#87CEEB',
  'Dark Pink': '#C2185B',
  'Blue': '#1E88E5',
  'Dark Green': '#1B5E20',
  'Maroon': '#800000',
  'Neon Green': '#39FF14',
  'Orange': '#FB8C00',
  'Light Purple': '#D1C4E9',
  'Grey': '#9E9E9E',
  'Yellow': '#FFEB3B',
  'Pink': '#F48FB1',
  'Purple': '#8E24AA',
  'Cream': '#FFF3D6',
  'Light Green': '#C8E6C9',
};

const getColorHex = (colorName?: string): string => (colorName && COLOR_HEX[colorName]) || '#E5E7EB';

// Nested: { [division]: { [name]: quantity } }
type CategoryValues = Record<string, Record<string, number>>;

// ============================================================
// Helper to build initial values from CASE_CATEGORIES
// ============================================================
const buildInitialFileFolderValues = (): CategoryValues => {
  const initial: CategoryValues = {};
  Object.entries(CASE_CATEGORIES).forEach(([division, items]) => {
    initial[division] = {};
    items.forEach((item) => {
      initial[division][item] = 0;
    });
  });
  return initial;
};

// ============================================================
// Helper to build initial values for Registers
// ============================================================
const buildInitialRegisterValues = (): CategoryValues => {
  const initial: CategoryValues = {};
  
  // Add registers from CASE_REGISTERS
  Object.entries(CASE_REGISTERS).forEach(([division, items]) => {
    initial[division] = {};
    items.forEach((item) => {
      initial[division][item] = 0;
    });
  });
  
  // Add Additional registers
  initial['Additional'] = {};
  ADDITIONAL_REGISTERS.forEach((item) => {
    initial['Additional'][item] = 0;
  });
  
  return initial;
};

// ============================================================
// Helper to populate form from existing submission
// ============================================================
const populateFromSubmission = (
  submission: StationRequirementSubmission | null
): { fileFolderValues: CategoryValues; registerValues: CategoryValues } => {
  const fileFolderValues = buildInitialFileFolderValues();
  const registerValues = buildInitialRegisterValues();

  if (!submission) return { fileFolderValues, registerValues };

  // Populate file folders
  submission.fileFolders.forEach((item) => {
    if (fileFolderValues[item.division] && fileFolderValues[item.division][item.name] !== undefined) {
      fileFolderValues[item.division][item.name] = item.quantity;
    }
  });

  // Populate registers
  submission.registers.forEach((item) => {
    if (registerValues[item.division] && registerValues[item.division][item.name] !== undefined) {
      registerValues[item.division][item.name] = item.quantity;
    }
  });

  return { fileFolderValues, registerValues };
};

const calculateTotal = (values: CategoryValues): number => {
  return Object.values(values).reduce(
    (sum, items) => sum + Object.values(items).reduce((s, v) => s + v, 0),
    0
  );
};

const collectItems = (values: CategoryValues): StationRequirementItem[] => {
  const items: StationRequirementItem[] = [];
  Object.entries(values).forEach(([division, cases]) => {
    Object.entries(cases).forEach(([name, quantity]) => {
      if (quantity > 0) {
        items.push({ division, name, quantity });
      }
    });
  });
  return items;
};

interface RequirementsFormProps {
  editMode?: boolean;
  submissionId?: string;
  initialSubmission?: StationRequirementSubmission | null;
  onSubmitted?: () => void;
  // New prop for loading a draft by ID
  loadDraftId?: string;
  onDraftLoaded?: (submission: StationRequirementSubmission) => void;
}

const DrRequirementsForm: React.FC<RequirementsFormProps> = ({
  editMode = false,
  submissionId,
  initialSubmission = null,
  onSubmitted,
  loadDraftId,
  onDraftLoaded,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isSubmitting,
    error,
    currentSubmission,
  } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { user, accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  const userStation = user?.station || '';

  // Step management: 1 = File Folders, 2 = Registers
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<FormData>({
    station: userStation,
    status: 'draft',
  });

  // Initialize state based on whether we're in edit mode
  const getInitialValues = (): { fileFolderValues: CategoryValues; registerValues: CategoryValues } => {
    if (editMode && (initialSubmission || currentSubmission)) {
      const submission = initialSubmission || currentSubmission;
      return populateFromSubmission(submission);
    }
    return { 
      fileFolderValues: buildInitialFileFolderValues(),
      registerValues: buildInitialRegisterValues()
    };
  };

  const initialValues = getInitialValues();
  const [fileFolderValues, setFileFolderValues] = useState<CategoryValues>(initialValues.fileFolderValues);
  const [registerValues, setRegisterValues] = useState<CategoryValues>(initialValues.registerValues);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync form state from initialSubmission/currentSubmission during render
  const [syncedId, setSyncedId] = useState<string | undefined>(
    editMode ? submissionId : undefined
  );

  // Load draft when loadDraftId is provided
  useEffect(() => {
    if (loadDraftId && accessToken && !isInitializing) {
      const loadDraft = async () => {
        setIsLoadingDraft(true);
        setErrorMessage(null);
        try {
          const result = await dispatch(getSubmissionById(loadDraftId)).unwrap();
          const submission = result.submission;
          
          if (submission.status !== 'draft') {
            setErrorMessage('This submission has already been submitted and cannot be edited.');
            setIsSubmitted(true);
            setIsLoadingDraft(false);
            return;
          }

          // Populate form with draft data
          setFormData({
            station: submission.station,
            status: submission.status,
          });
          
          const { fileFolderValues: ffValues, registerValues: regValues } = populateFromSubmission(submission);
          setFileFolderValues(ffValues);
          setRegisterValues(regValues);
          setIsEditing(true);
          setSyncedId(loadDraftId);
          setIsSubmitted(false);
          
          if (onDraftLoaded) {
            onDraftLoaded(submission);
          }
          
          console.log('✅ Draft loaded successfully:', {
            id: submission.id,
            station: submission.station,
            fileFolders: submission.fileFolders.length,
            registers: submission.registers.length,
          });
        } catch (err) {
          console.error('❌ Failed to load draft:', err);
          setErrorMessage('Failed to load draft. Please try again.');
        } finally {
          setIsLoadingDraft(false);
        }
      };
      
      loadDraft();
    }
  }, [loadDraftId, accessToken, isInitializing, dispatch, onDraftLoaded]);

  if (editMode && submissionId !== syncedId && !loadDraftId) {
    const submission = initialSubmission ?? currentSubmission;
    if (submission) {
      setSyncedId(submissionId);
      setFormData({
        station: submission.station,
        status: submission.status,
      });
      const { fileFolderValues: ffValues, registerValues: regValues } = populateFromSubmission(submission);
      setFileFolderValues(ffValues);
      setRegisterValues(regValues);
      setIsEditing(true);
      if (submission.status === 'submitted') {
        setIsSubmitted(true);
      }
    }
  }

  useEffect(() => {
    if (!isInitializing && accessToken) {
      dispatch(getUniqueStations());
    }
  }, [dispatch, isInitializing, accessToken]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      if (!editMode && !loadDraftId) {
        dispatch(clearCurrentSubmission());
      }
    };
  }, [dispatch, editMode, loadDraftId]);

  const handleFileFolderChange = (division: string, name: string, value: number): void => {
    if (isSubmitted) return;
    setFileFolderValues((prev) => ({
      ...prev,
      [division]: { ...prev[division], [name]: Math.max(0, value) },
    }));
  };

  const handleRegisterChange = (division: string, name: string, value: number): void => {
    if (isSubmitted) return;
    setRegisterValues((prev) => ({
      ...prev,
      [division]: { ...prev[division], [name]: Math.max(0, value) },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    if (isSubmitted) return;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const collectData = (): {
    station: string;
    fileFolders: StationRequirementItem[];
    registers: StationRequirementItem[];
    status?: SubmissionStatus;
  } => {
    return {
      station: formData.station,
      fileFolders: collectItems(fileFolderValues),
      registers: collectItems(registerValues),
      status: formData.status,
    };
  };

  const handleNextStep = (): void => {
    if (isSubmitted) return;
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = (): void => {
    if (isSubmitted) return;
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confirmation dialog for submit
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSubmitDraft = async (): Promise<void> => {
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async (): Promise<void> => {
    setShowConfirmDialog(false);
    await handleSubmit('submitted');
  };

  const cancelSubmit = (): void => {
    setShowConfirmDialog(false);
  };

  const handleSubmit = async (status: SubmissionStatus): Promise<void> => {
    setErrorMessage(null);
    setShowSuccess(false);

    if (isSubmitted) {
      setErrorMessage('This submission has already been submitted and cannot be modified.');
      return;
    }

    if (!formData.station.trim()) {
      setErrorMessage('Please enter a station name.');
      return;
    }

    const data = collectData();
    const hasFileItems = data.fileFolders.length > 0;
    const hasRegisterItems = data.registers.length > 0;
    const hasItems = hasFileItems || hasRegisterItems;

    if (!hasItems) {
      setErrorMessage('Enter at least one quantity greater than 0 in either File Folders or Registers.');
      return;
    }

    if (status === 'submitted' && !hasItems) {
      setErrorMessage('Please add at least one item before submitting.');
      return;
    }

    console.log(`📤 Submitting station requirements:`, {
      station: data.station,
      fileFolders: data.fileFolders,
      registers: data.registers,
      status,
    });

    try {
      let result;

      // Check if we're editing an existing submission
      const existingId = submissionId || syncedId;
      
      if (isEditing && existingId) {
        // Update existing submission - id is guaranteed to be a string here
        const payload = {
          id: existingId,
          station: data.station,
          fileFolders: data.fileFolders,
          registers: data.registers,
          status,
        };
        result = await dispatch(updateSubmission(payload)).unwrap();
        setSuccessMessage('Submission submitted successfully!');
      } else {
        // Create new submission
        const payload = {
          station: data.station,
          fileFolders: data.fileFolders,
          registers: data.registers,
          status,
        };
        result = await dispatch(createSubmission(payload)).unwrap();
        setSuccessMessage('Submission submitted successfully!');
      }

      console.log('✅ Submission successful:', result);

      // Lock the form after successful submission
      setIsSubmitted(true);
      setShowSuccess(true);

      // Update form data status
      setFormData(prev => ({ ...prev, status: 'submitted' }));

      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage('');
      }, 5000);

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save submission. Please try again.';
      console.error('❌ Submission error:', err);
      setErrorMessage(errorMsg);
    }
  };

  const renderCategorySection = (
    values: CategoryValues,
    onChange: (division: string, name: string, value: number) => void,
    prefix: string,
    total: number,
    title: string,
    categories: Record<string, string[]>,
    showCodeAndColor: boolean = true
  ): React.ReactElement => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-gray-600">{total} items</span>
        </div>

        {/* Column header */}
        <div className="hidden md:flex items-center px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
          <div className="flex-1">Category</div>
          {showCodeAndColor && <div className="w-32 text-center">Case Code</div>}
          {showCodeAndColor && <div className="w-32 text-center">Colour</div>}
          <div className="w-24 text-right">Quantity</div>
        </div>

        {Object.entries(categories).map(([division, items]) => (
          <div key={division} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-100 px-4 py-2 font-semibold text-sm text-gray-800 uppercase">
              {division}
            </div>
            {items.map((item) => {
              const key = `${prefix}_${division}_${item}`;
              const code = showCodeAndColor ? getCaseCode(division, item) : undefined;
              const colorName = showCodeAndColor ? getCaseColor(division, item) : undefined;
              return (
                <div
                  key={key}
                  className="flex flex-wrap md:flex-nowrap items-center gap-y-2 px-4 py-3 border-t border-gray-100"
                >
                  <label htmlFor={key} className="flex-1 min-w-[140px] text-sm">
                    {item}
                  </label>
                  {showCodeAndColor && (
                    <div className="w-32 text-center text-xs font-mono text-gray-600">
                      {code || '—'}
                    </div>
                  )}
                  {showCodeAndColor && (
                    <div className="w-32 flex items-center justify-center gap-2">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                        style={{ backgroundColor: getColorHex(colorName) }}
                        title={colorName || 'Unknown'}
                      />
                      <span className="text-xs text-gray-600 truncate">{colorName || '—'}</span>
                    </div>
                  )}
                  <input
                    id={key}
                    type="number"
                    min="0"
                    step="1"
                    value={values[division]?.[item] || 0}
                    onChange={(e) => onChange(division, item, parseInt(e.target.value, 10) || 0)}
                    className={`w-24 px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="0"
                    disabled={isSubmitted}
                  />
                </div>
              );
            })}
          </div>
        ))}
        <div className="bg-gray-800 text-white rounded-lg p-4 flex justify-end">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-300">Total</div>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          </div>
        </div>
      </div>
    );
  };

  if (isInitializing || isLoadingDraft) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="mt-4 text-gray-600">{isLoadingDraft ? 'Loading draft...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  const fileFoldersTotal = calculateTotal(fileFolderValues);
  const registersTotal = calculateTotal(registerValues);
  const totalItems = fileFoldersTotal + registersTotal;

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Data Collection · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            {isSubmitted ? 'Submission Complete' : (isEditing ? 'Edit Draft' : 'Station Requirement Form')}
          </h1>
          {isEditing && !isSubmitted && (
            <div className="text-sm text-[#c9b98a] mb-2">
              Editing draft for {currentSubmission?.station || formData.station}
            </div>
          )}
          {isSubmitted && (
            <div className="text-sm text-green-300 mb-2">
              ✓ This submission has been successfully submitted and is now locked.
            </div>
          )}
          {!isSubmitted && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-[#c9b98a]">
                Step {currentStep} of 2: {currentStep === 1 ? 'File Folders' : 'Registers'}
              </span>
              <div className="flex gap-2">
                <div className={`w-3 h-3 rounded-full ${currentStep === 1 ? 'bg-[#a3782e]' : 'bg-gray-500'}`} />
                <div className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-[#a3782e]' : 'bg-gray-500'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Instructions - Hide when submitted */}
        {!isSubmitted && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 text-sm text-gray-700 space-y-3">
            <p>
              To facilitate effective planning and ensure adequate provision of registry supplies, we
              request Your Honours to indicate your station/sub-registry&rsquo;s <strong>ANNUAL</strong> requirements
              for file folders and case registers.
            </p>
            <p>
              Kindly indicate the required quantity for each category, based on
              the number and nature of cases filed at your station/division/sub-registry.
            </p>
            <p>
              Please indicate &ldquo;0&rdquo; where a particular item is not applicable to your
              station/division/sub-registry.
            </p>
            <p>
              For any clarifications, please reach out to Hon. Linda Mumassabba from our Office.
            </p>
            <p className="font-semibold">RHC</p>
          </div>
        )}

        {/* Station Info */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="station" className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Station name
              </label>
              <input
                id="station"
                name="station"
                type="text"
                value={formData.station}
                onChange={handleInputChange}
                placeholder="e.g. Kisumu Law Courts"
                className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmitted || !!user?.station || isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitted || !!user?.station || isEditing}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmitted || (isEditing && currentSubmission?.status === 'submitted') ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitted || (isEditing && currentSubmission?.status === 'submitted')}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Ready to Submit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 1: File Folders */}
        {currentStep === 1 && (
          <div className="mb-8">
            {renderCategorySection(
              fileFolderValues,
              handleFileFolderChange,
              'ff',
              fileFoldersTotal,
              'File Folders Needed',
              CASE_CATEGORIES,
              true // show code and color
            )}
          </div>
        )}

        {/* Step 2: Registers */}
        {currentStep === 2 && (
          <div className="mb-8">
            {renderCategorySection(
              registerValues,
              handleRegisterChange,
              'reg',
              registersTotal,
              'Case Registers Needed',
              { ...CASE_REGISTERS, Additional: ADDITIONAL_REGISTERS as unknown as string[] },
              false // don't show code and color for registers
            )}
          </div>
        )}

        {/* Navigation Buttons - Hide when submitted */}
        {!isSubmitted && (
          <div className="flex justify-between items-center mb-6">
            {currentStep === 2 && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition-colors"
              >
                ← Previous (File Folders)
              </button>
            )}
            {currentStep === 1 && (
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors ml-auto"
              >
                Next (Registers) →
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Submit Button - Only show if not submitted */}
          {!isSubmitted && (
            <button
              onClick={handleSubmitDraft}
              disabled={isSubmitting || totalItems === 0}
              className="px-6 py-3 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : (isEditing ? 'Submit Draft' : 'Submit')}
            </button>
          )}

          {/* Submitted status message */}
          {isSubmitted && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-3 rounded-md text-sm font-semibold">
              ✓ This form has been submitted and is locked
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-md text-sm">
              ✓ {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-md text-sm">
              ✗ {errorMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-2 rounded-md text-sm">
              ✗ {error}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submission</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit this form? <br />
                <span className="font-semibold text-red-600">The page will be locked immediately after submission.</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelSubmit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="px-4 py-2 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">File Folders:</span>
              <span className="ml-2 font-semibold">{fileFoldersTotal}</span>
            </div>
            <div>
              <span className="text-gray-600">Registers:</span>
              <span className="ml-2 font-semibold">{registersTotal}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2 font-semibold">{totalItems}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-semibold ${
                isSubmitted || formData.status === 'submitted' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {isSubmitted || formData.status === 'submitted' ? 'Submitted' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrRequirementsForm;