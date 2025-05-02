// apiUtils.ts
import { fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { BaseQueryFn, FetchArgs, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/app/store';
import { setCredentials, logOut } from '@/features/auth/authSlice';

const baseUrl = import.meta.env.VITE_BASE_URL;

// Create the base query
export const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    // Get token from state
    const token = (getState() as RootState).auth.token;
    // If token exists, add it to the headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Response type for refresh token endpoint
interface RefreshResponse {
  status: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
}

// Create a custom base query with token refresh capability
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {}, 
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 Unauthorized response, try to refresh the token
  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    
    // Only try to refresh if we have a refresh token
    if (refreshToken) {
      // Try to get a new token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      // If we got a new token, update the auth state and retry the original query
      if (refreshResult.data) {
        const refreshData = refreshResult.data as RefreshResponse;
        
        // Store the new token
        api.dispatch(setCredentials({
          token: refreshData.data.access_token,
          refreshToken: refreshData.data.refresh_token,
          user: (api.getState() as RootState).auth.user, // Keep existing user data
        }));

        // Retry the original query with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // If refresh fails, log out
        api.dispatch(logOut());
      }
    } else {
      // No refresh token available, log out
      api.dispatch(logOut());
    }
  }
  
  return result;
};