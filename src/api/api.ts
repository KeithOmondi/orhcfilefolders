// src/api/api.ts
import axios, { 
  type AxiosRequestConfig, 
  type InternalAxiosRequestConfig,
  //type AxiosError,
  type AxiosResponse
} from 'axios';
import type { UnknownAction } from '@reduxjs/toolkit';

// A strict structural interface for the slice fields we care about reading dynamically
interface SharedStoreStructure {
  getState: () => {
    auth: {
      accessToken: string | null;
    };
  };
  dispatch: (action: UnknownAction) => UnknownAction;
}

let storeRef: SharedStoreStructure | null = null;

export const injectStore = (store: SharedStoreStructure): void => {
  storeRef = store;
};

// Types for the store actions - these will be imported from the slice
export interface AuthActions {
  refreshAccessToken: () => Promise<unknown>;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

// Optional: If you need a combined setup function
export const setupApiWithStore = (
  store: SharedStoreStructure,
  authActions?: AuthActions
): void => {
  injectStore(store);
  // If auth actions are provided, store them for use in interceptors
  if (authActions) {
    // You can store these globally if needed
    (window as Window & { __authActions?: AuthActions }).__authActions = authActions;
  }
};

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Constants for better maintainability
const MAX_RETRY_ATTEMPTS = 1;
const REFRESH_TOKEN_ENDPOINT = '/auth/refresh-token';
const PUBLIC_ROUTE_PATTERN = '/public/';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

/* ============================================================
   1. REQUEST INTERCEPTOR
============================================================ */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip adding auth token for public routes
    if (config.url?.includes(PUBLIC_ROUTE_PATTERN)) {
      return config;
    }

    const accessToken = storeRef?.getState().auth.accessToken;
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

/* ============================================================
   2. RESPONSE INTERCEPTOR (AUTOMATIC TOKEN REFRESH)
============================================================ */
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    // Type guard for AxiosError
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If no config, reject immediately
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip token refresh for:
    // 1. Public routes (they don't need auth)
    // 2. Refresh token requests (to avoid infinite loops)
    const isPublicRoute = originalRequest.url?.includes(PUBLIC_ROUTE_PATTERN);
    const isRefreshRequest = originalRequest.url?.includes(REFRESH_TOKEN_ENDPOINT);

    if (isPublicRoute || isRefreshRequest) {
      return Promise.reject(error);
    }

    // Initialize retry count if not set
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }

    // Only handle 401 errors and limit retry attempts
    if (
      error.response?.status === 401 && 
      originalRequest._retryCount < MAX_RETRY_ATTEMPTS
    ) {
      originalRequest._retryCount += 1;
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post(
          `${axiosClient.defaults.baseURL}${REFRESH_TOKEN_ENDPOINT}`,
          {},
          { 
            withCredentials: true, 
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          }
        );

        // Validate refresh response structure
        const accessToken = refreshResponse.data?.data?.accessToken || 
                           refreshResponse.data?.accessToken;

        if (!accessToken) {
          throw new Error('Invalid refresh response: missing access token');
        }

        // Update the stored token
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/setAccessToken',
            payload: accessToken
          } as UnknownAction);
        }

        // Update the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Retry the original request
        return axiosClient(originalRequest as InternalAxiosRequestConfig);
      } catch (refreshError: unknown) {
        // If refresh fails due to network error, try once more
        if (axios.isAxiosError(refreshError) && !refreshError.response) {
          try {
            const retryRefresh = await axios.post(
              `${axiosClient.defaults.baseURL}${REFRESH_TOKEN_ENDPOINT}`,
              {},
              { 
                withCredentials: true, 
                timeout: 10000,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
              }
            );

            const accessToken = retryRefresh.data?.data?.accessToken || 
                               retryRefresh.data?.accessToken;

            if (accessToken) {
              if (storeRef) {
                storeRef.dispatch({
                  type: 'auth/setAccessToken',
                  payload: accessToken
                } as UnknownAction);
              }
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return axiosClient(originalRequest as InternalAxiosRequestConfig);
            }
          } catch (finalRefreshError: unknown) {
            // Refresh failed - clear auth state
            if (storeRef) {
              storeRef.dispatch({
                type: 'auth/logout'
              } as UnknownAction);
            }
            return Promise.reject(finalRefreshError);
          }
        }

        // Refresh failed - clear auth state and reject
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/logout'
          } as UnknownAction);
        }
        
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // For 401 errors with no retry attempts left
    if (error.response?.status === 401 && originalRequest._retryCount >= MAX_RETRY_ATTEMPTS) {
      if (storeRef) {
        storeRef.dispatch({
          type: 'auth/logout'
        } as UnknownAction);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;