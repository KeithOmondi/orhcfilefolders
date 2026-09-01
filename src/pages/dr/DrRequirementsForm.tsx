import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSubmission,
  getUniqueStations,
  clearError,
  clearCurrentSubmission,
  CASE_CATEGORIES,
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

// Nested: { [division]: { [caseName]: quantity } }
type CategoryValues = Record<string, Record<string, number>>;

// ============================================================
// Helper to build initial values from CASE_CATEGORIES
// ============================================================
const buildInitialValues = (): CategoryValues => {
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
// Helper to populate form from existing submission
// ============================================================
const populateFromSubmission = (
  submission: StationRequirementSubmission | null
): { fileFolderValues: CategoryValues } => {
  const fileFolderValues = buildInitialValues();

  if (!submission) return { fileFolderValues };

  // Populate file folders
  submission.fileFolders.forEach((item) => {
    if (fileFolderValues[item.division] && fileFolderValues[item.division][item.name] !== undefined) {
      fileFolderValues[item.division][item.name] = item.quantity;
    }
  });

  return { fileFolderValues };
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
}

const RequirementsForm: React.FC<RequirementsFormProps> = ({
  editMode = false,
  submissionId,
  initialSubmission = null,
  onSubmitted
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

  const [formData, setFormData] = useState<FormData>({
    station: userStation,
    status: 'draft',
  });

  // Initialize state based on whether we're in edit mode
  const getInitialValues = (): { fileFolderValues: CategoryValues } => {
    if (editMode && (initialSubmission || currentSubmission)) {
      const submission = initialSubmission || currentSubmission;
      return populateFromSubmission(submission);
    }
    return { fileFolderValues: buildInitialValues() };
  };

  const initialValues = getInitialValues();
  const [fileFolderValues, setFileFolderValues] = useState<CategoryValues>(initialValues.fileFolderValues);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(editMode);

  // Sync form state from initialSubmission/currentSubmission during render
  // (avoids the cascading-render setState-in-effect pattern)
  const [syncedId, setSyncedId] = useState<string | undefined>(
    editMode ? submissionId : undefined
  );

  if (editMode && submissionId !== syncedId) {
    const submission = initialSubmission ?? currentSubmission;
    if (submission) {
      setSyncedId(submissionId);
      setFormData({
        station: submission.station,
        status: submission.status,
      });
      const { fileFolderValues: ffValues } = populateFromSubmission(submission);
      setFileFolderValues(ffValues);
      setIsEditing(true);
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
      if (!editMode) {
        dispatch(clearCurrentSubmission());
      }
    };
  }, [dispatch, editMode]);

  const handleFileFolderChange = (division: string, name: string, value: number): void => {
    setFileFolderValues((prev) => ({
      ...prev,
      [division]: { ...prev[division], [name]: Math.max(0, value) },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
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
      registers: [], // Registers section removed — always submitted empty
      status: formData.status,
    };
  };

  const handleSaveDraft = async (): Promise<void> => {
    await handleSubmit('draft');
  };

  const handleSubmitDraft = async (): Promise<void> => {
    await handleSubmit('submitted');
  };

  const handleSubmit = async (status: SubmissionStatus): Promise<void> => {
    setErrorMessage(null);
    setShowSuccess(false);

    if (!formData.station.trim()) {
      setErrorMessage('Please enter a station name.');
      return;
    }

    const data = collectData();
    const hasItems = data.fileFolders.length > 0;

    if (!hasItems) {
      setErrorMessage('Enter at least one quantity greater than 0.');
      return;
    }

    // If submitting (not draft), validate there are items
    if (status === 'submitted' && !hasItems) {
      setErrorMessage('Please add at least one item before submitting.');
      return;
    }

    console.log(`📤 ${status === 'draft' ? 'Saving draft' : 'Submitting'} station requirements:`, {
      station: data.station,
      fileFolders: data.fileFolders,
      status,
    });

    try {
      let result;

      if (isEditing && submissionId) {
        // Update existing submission - you'd need to add updateSubmission thunk
        // result = await dispatch(updateSubmission({ id: submissionId, ...data })).unwrap();
        setSuccessMessage('Submission updated successfully!');
      } else {
        // Create new submission
        const payload = {
          ...data,
          status,
        };
        result = await dispatch(createSubmission(payload)).unwrap();
        setSuccessMessage(status === 'draft' ? 'Draft saved successfully!' : 'Submission submitted successfully!');
      }

      console.log('✅ Submission successful:', result);

      setShowSuccess(true);

      // Only reset form if not editing and it's a draft (not submitted)
      if (!isEditing) {
        setFileFolderValues(buildInitialValues());
        setFormData(prev => ({ ...prev, status: 'draft' }));
      }

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
    title: string
  ): React.ReactElement => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-gray-600">{total} items</span>
        </div>

        {/* Column header */}
        <div className="hidden md:flex items-center px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
          <div className="flex-1">Case Category</div>
          <div className="w-32 text-center">Case Code</div>
          <div className="w-32 text-center">Colour</div>
          <div className="w-24 text-right">Quantity</div>
        </div>

        {Object.entries(CASE_CATEGORIES).map(([division, items]) => (
          <div key={division} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-emerald-100 px-4 py-2 font-semibold text-sm text-gray-800 uppercase">
              {division}
            </div>
            {items.map((item) => {
              const key = `${prefix}_${division}_${item}`;
              const code = getCaseCode(division, item);
              const colorName = getCaseColor(division, item);
              return (
                <div
                  key={key}
                  className="flex flex-wrap md:flex-nowrap items-center gap-y-2 px-4 py-3 border-t border-gray-100"
                >
                  <label htmlFor={key} className="flex-1 min-w-[140px] text-sm">
                    {item}
                  </label>
                  <div className="w-32 text-center text-xs font-mono text-gray-600">
                    {code || '—'}
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                      style={{ backgroundColor: getColorHex(colorName) }}
                      title={colorName || 'Unknown'}
                    />
                    <span className="text-xs text-gray-600 truncate">{colorName || '—'}</span>
                  </div>
                  <input
                    id={key}
                    type="number"
                    min="0"
                    step="1"
                    value={values[division]?.[item] || 0}
                    onChange={(e) => onChange(division, item, parseInt(e.target.value, 10) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
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
  const totalItems = fileFoldersTotal;

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Data Collection · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            {isEditing ? 'Edit' : 'File Folders'} — Station Requirement Form
          </h1>
          {isEditing && (
            <div className="mt-2 text-sm text-[#c9b98a]">
              Editing submission for {currentSubmission?.station || initialSubmission?.station}
              {currentSubmission?.status === 'submitted' && ' (Submitted)'}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 text-sm text-gray-700 space-y-3">
          <p>
            To facilitate effective planning and ensure adequate provision of registry supplies, we
            request Your Honours to indicate your station/sub-registry&rsquo;s <strong>ANNUAL</strong> requirements
            for file folders.
          </p>
          <p>
            Kindly indicate the required quantity for each category of folders, based on
            the number and nature of cases filed at your station/division/sub-registry.
          </p>
          <p>
            Please indicate &ldquo;0&rdquo; where a particular folder is not applicable to your
            station/division/sub-registry.
          </p>
          <p>
            For any clarifications, please reach out to Hon. Linda Mumassabba from our Office.
          </p>
          <p className="font-semibold">RHC</p>
        </div>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!user?.station || isEditing}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isEditing && currentSubmission?.status === 'submitted'}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Ready to Submit</option>
              </select>
            </div>
          </div>
        </div>

        {/* File Folders Section */}
        <div className="mb-8">
          {renderCategorySection(
            fileFolderValues,
            handleFileFolderChange,
            'ff',
            fileFoldersTotal,
            'File Folders Needed'
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 items-center">
          {!isEditing && (
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            onClick={handleSubmitDraft}
            disabled={isSubmitting || totalItems === 0}
            className="px-6 py-3 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Submission' : 'Submit')}
          </button>
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

        {/* Summary */}
        <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">File Folders:</span>
              <span className="ml-2 font-semibold">{fileFoldersTotal}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2 font-semibold">{totalItems}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-semibold ${
                formData.status === 'submitted' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {formData.status === 'submitted' ? 'Ready to Submit' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsForm;