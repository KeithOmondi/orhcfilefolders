// src/store/store.ts
import { configureStore, type UnknownAction } from '@reduxjs/toolkit';
import authReducer, { 
  refreshAccessToken, 
  logout, 
  setAccessToken,
  clearError,
  checkAuth 
} from './slices/authSlice';
import stationRequirementsReducer from './slices/stationRequirementsSlice';
import usersReducer from "./slices/userSlice"
import { injectStore } from '../api/api';

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    stationRequirements: stationRequirementsReducer,
    users: usersReducer
  },
  // Add middleware or other configurations if needed
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if they contain non-serializable data
        ignoredActions: ['auth/verifyOtp/fulfilled'],
      },
    }),
});

// ✅ Inject the store into the API client for axios interceptors
// This connects the axios interceptors to Redux for token management
injectStore({
  getState: store.getState,
  dispatch: (action: UnknownAction) => store.dispatch(action),
});

// ✅ Export types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ Optional: Create a typed hook for useDispatch
export type AppStore = typeof store;

// ✅ Export actions for convenience
export { 
  refreshAccessToken, 
  logout, 
  setAccessToken,
  clearError,
  checkAuth 
};