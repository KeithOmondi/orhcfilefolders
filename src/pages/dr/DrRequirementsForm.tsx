import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSubmission,
  getUniqueStations,
  getUniqueQuarters,
  clearError,
  FILE_FOLDERS_CATEGORIES,
  REGISTERS_CATEGORIES,
  type StationRequirementItem,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

interface FormData {
  station: string;
  quarter: string;
}

interface FileFolderValues {
  [key: string]: number;
}

interface RegisterValues {
  [key: string]: number;
}

// Pure helper — no dependency on component state, safe to call during
// render (e.g. as a useState lazy initializer) rather than in an effect.
const buildInitialValues = (categories: Record<string, string[]>, prefix: string): FileFolderValues => {
  const initial: FileFolderValues = {};
  Object.values(categories).forEach((items) => {
    items.forEach((item) => {
      initial[`${prefix}_${item}`] = 0;
    });
  });
  return initial;
};

const RequirementsForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSubmitting, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { user, accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  // Get station from user or use empty string - calculated during render
  const userStation = user?.station || '';

  const [formData, setFormData] = useState<FormData>({
    station: userStation,
    quarter: 'Q1 FY2026/27',
  });

  // Lazy initializers run once, during the initial render, so there's no
  // need for an effect (and no "setState synchronously in effect" warning).
  const [fileFolderValues, setFileFolderValues] = useState<FileFolderValues>(
    () => buildInitialValues(FILE_FOLDERS_CATEGORIES, 'ff')
  );
  const [registerValues, setRegisterValues] = useState<RegisterValues>(
    () => buildInitialValues(REGISTERS_CATEGORIES, 'reg')
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load stations and quarters ONLY when auth is fully initialized and we have a token
  useEffect(() => {
    if (!isInitializing && accessToken) {
      dispatch(getUniqueStations());
      dispatch(getUniqueQuarters());
    }
  }, [dispatch, isInitializing, accessToken]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleFileFolderChange = (key: string, value: number): void => {
    setFileFolderValues((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleRegisterChange = (key: string, value: number): void => {
    setRegisterValues((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotal = (values: FileFolderValues | RegisterValues): number => {
    return Object.values(values).reduce((sum, val) => sum + val, 0);
  };

  const collectData = (): {
    station: string;
    quarter: string;
    fileFolders: StationRequirementItem[];
    registers: StationRequirementItem[];
  } => {
    const fileFolders: StationRequirementItem[] = [];
    const registers: StationRequirementItem[] = [];

    Object.entries(fileFolderValues).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const name = key.replace('ff_', '');
        let division = '';
        Object.entries(FILE_FOLDERS_CATEGORIES).forEach(([cat, items]) => {
          if (items.includes(name)) {
            division = cat;
          }
        });
        fileFolders.push({ division, name, quantity });
      }
    });

    Object.entries(registerValues).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const name = key.replace('reg_', '');
        let division = '';
        Object.entries(REGISTERS_CATEGORIES).forEach(([cat, items]) => {
          if (items.includes(name)) {
            division = cat;
          }
        });
        registers.push({ division, name, quantity });
      }
    });

    return {
      station: formData.station,
      quarter: formData.quarter,
      fileFolders,
      registers,
    };
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);
    setShowSuccess(false);

    if (!formData.station.trim()) {
      setErrorMessage('Please enter a station name.');
      return;
    }

    const data = collectData();
    if (data.fileFolders.length === 0 && data.registers.length === 0) {
      setErrorMessage('Enter at least one quantity greater than 0.');
      return;
    }

    // Log the complete submission data for debugging
    console.log('📤 Submitting station requirements:', {
      station: data.station,
      quarter: data.quarter,
      fileFolders: data.fileFolders,
      registers: data.registers,
      fileFoldersCount: data.fileFolders.length,
      registersCount: data.registers.length,
      totalFileFolders: data.fileFolders.reduce((sum, item) => sum + item.quantity, 0),
      totalRegisters: data.registers.reduce((sum, item) => sum + item.quantity, 0),
      timestamp: new Date().toISOString()
    });

    // Validate the data structure before sending
    if (!Array.isArray(data.fileFolders) || !Array.isArray(data.registers)) {
      setErrorMessage('Invalid data structure: fileFolders and registers must be arrays.');
      return;
    }

    try {
      // The payload is correctly structured with fileFolders and registers as arrays
      const result = await dispatch(createSubmission(data)).unwrap();
      console.log('✅ Submission successful:', result);
      
      setShowSuccess(true);
      // Reset quantities but keep station and quarter
      setFileFolderValues(buildInitialValues(FILE_FOLDERS_CATEGORIES, 'ff'));
      setRegisterValues(buildInitialValues(REGISTERS_CATEGORIES, 'reg'));
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save submission. Please try again.';
      console.error('❌ Submission error:', err);
      setErrorMessage(errorMsg);
    }
  };

  const renderCategorySection = (
    categories: Record<string, string[]>,
    values: FileFolderValues | RegisterValues,
    onChange: (key: string, value: number) => void,
    prefix: string,
    total: number
  ): React.ReactElement => {
    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([division, items]) => (
          <div key={division} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-amber-50 px-4 py-2 font-semibold text-sm text-gray-800">
              {division}
            </div>
            {items.map((item) => {
              const key = `${prefix}_${item}`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-3 border-t border-gray-100"
                >
                  <label htmlFor={key} className="flex-1 text-sm">
                    {item}
                    <span className="block text-xs text-gray-500">How many needed?</span>
                  </label>
                  <input
                    id={key}
                    type="number"
                    min="0"
                    step="1"
                    value={values[key] || 0}
                    onChange={(e) => onChange(key, parseInt(e.target.value, 10) || 0)}
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

  // Show loading state while auth is initializing
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

  // If not authenticated, show message (though ProtectedRoute should handle this)
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

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Data Collection · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            File Folders &amp; Case Registers — Station Requirement Form
          </h1>
          <p className="text-sm text-[#cdd6e0]">
            Each station fills in the quantities it needs. Submissions are saved and can be reviewed together once several stations have responded.
          </p>
        </div>

        {/* Station Info */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={!!user?.station}
            />
          </div>
          <div>
            <label htmlFor="quarter" className="block text-xs uppercase tracking-wider text-gray-600 mb-1">
              Quarter / period
            </label>
            <select
              id="quarter"
              name="quarter"
              value={formData.quarter}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Q1 FY2026/27">Q1 FY2026/27</option>
              <option value="Q2 FY2026/27">Q2 FY2026/27</option>
              <option value="Q3 FY2026/27">Q3 FY2026/27</option>
              <option value="Q4 FY2026/27">Q4 FY2026/27</option>
              <option value="Annual FY2026/27">Annual FY2026/27</option>
            </select>
          </div>
        </div>

        {/* File Folders Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
            <h2 className="text-lg font-semibold">File Folders Needed</h2>
            <span className="text-sm text-gray-600">{fileFoldersTotal} items</span>
          </div>
          {renderCategorySection(
            FILE_FOLDERS_CATEGORIES,
            fileFolderValues,
            handleFileFolderChange,
            'ff',
            fileFoldersTotal
          )}
        </div>

        {/* Registers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
            <h2 className="text-lg font-semibold">Case Registers Needed</h2>
            <span className="text-sm text-gray-600">{registersTotal} items</span>
          </div>
          {renderCategorySection(
            REGISTERS_CATEGORIES,
            registerValues,
            handleRegisterChange,
            'reg',
            registersTotal
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#1e3a5f] text-white font-semibold rounded-md hover:bg-[#12253d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : "Save this station's submission"}
          </button>
          {showSuccess && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-md text-sm">
              ✓ Submission saved successfully!
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

        <p className="text-xs text-gray-500 mt-4">
          Submissions save to shared storage, so once several stations fill this in, anyone opening this form can view every station's numbers via &quot;View all submissions.&quot; Data isn't sent anywhere outside this app.
        </p>
      </div>
    </div>
  );
};

export default RequirementsForm;