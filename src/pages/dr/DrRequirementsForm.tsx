import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createSubmission,
  getUniqueStations,
  clearError,
  CASE_CATEGORIES,
  getCaseCode,
  getCaseColor,
  type StationRequirementItem,
} from '../../store/slices/stationRequirementsSlice';
import type { AppDispatch, RootState } from '../../store/store';

interface FormData {
  station: string;
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
// (single source of truth — matches the official document exactly)
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

const RequirementsForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSubmitting, error } = useSelector(
    (state: RootState) => state.stationRequirements
  );
  const { user, accessToken, isInitializing } = useSelector((state: RootState) => state.auth);

  const userStation = user?.station || '';

  const [formData, setFormData] = useState<FormData>({
    station: userStation,
  });

  const [fileFolderValues, setFileFolderValues] = useState<CategoryValues>(buildInitialValues);

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && accessToken) {
      dispatch(getUniqueStations());
    }
  }, [dispatch, isInitializing, accessToken]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleFileFolderChange = (division: string, name: string, value: number): void => {
    setFileFolderValues((prev) => ({
      ...prev,
      [division]: { ...prev[division], [name]: Math.max(0, value) },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
  } => {
    return {
      station: formData.station,
      fileFolders: collectItems(fileFolderValues),
      registers: [], // Registers section removed from the form — folders cover both.
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
    if (data.fileFolders.length === 0) {
      setErrorMessage('Enter at least one quantity greater than 0.');
      return;
    }

    console.log('📤 Submitting station requirements:', {
      station: data.station,
      fileFolders: data.fileFolders,
    });

    try {
      const result = await dispatch(createSubmission(data)).unwrap();
      console.log('✅ Submission successful:', result);

      setShowSuccess(true);
      setFileFolderValues(buildInitialValues());
      setTimeout(() => setShowSuccess(false), 5000);
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
    total: number
  ): React.ReactElement => {
    return (
      <div className="space-y-4">
        {/* Column header, matching the source document's table */}
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

  return (
    <div className="min-h-screen bg-[#f7f5f0] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#12253d] to-[#1e3a5f] text-[#f3efe4] p-8 rounded-lg mb-8 border-b-4 border-[#a3782e]">
          <div className="text-xs uppercase tracking-widest text-[#c9b98a] mb-2">
            Data Collection · Ref RHC/DSCM/112
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            File Folders — Station Requirement Form
          </h1>
         
        </div>

        {/* Instructions */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 text-sm text-gray-700 space-y-3">
          <p>
            To facilitate effective planning and ensure adequate provision of registry supplies, we
            request Your Honours to indicate your station/sub-registry&rsquo;s <strong>ANNUAL</strong> requirements
            for file folders and registers.
          </p>
          <p>
            Kindly indicate the required quantity for each category of folders and registers, based on
            the number and nature of cases filed at your station/division/sub-registry.
          </p>
          <p>
            Please indicate &ldquo;0&rdquo; where a particular folder and/or register is not applicable to your
            station/division/sub-registry.
          </p>
          <p>
            For any clarifications, please reach out to Hon. Linda Mumassabba from our Office.
          </p>
          <p className="font-semibold">RHC</p>
        </div>

        {/* Station Info */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
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

        {/* File Folders Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
            <h2 className="text-lg font-semibold">File Folders Needed</h2>
            <span className="text-sm text-gray-600">{fileFoldersTotal} items</span>
          </div>
          {renderCategorySection(
            fileFolderValues,
            handleFileFolderChange,
            'ff',
            fileFoldersTotal
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


      </div>
    </div>
  );
};

export default RequirementsForm;