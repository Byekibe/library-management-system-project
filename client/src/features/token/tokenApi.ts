// tokenApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/utils/utils';
import { ApiResponse, TokenInfo } from '@/types/authTypes';

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Token'],
  endpoints: (builder) => ({
    // Get all active tokens for a user
    getActiveTokens: builder.query<TokenInfo[], void>({
      query: () => '/tokens/active',
      transformResponse: (response: ApiResponse<TokenInfo[]>) => response.data!,
      providesTags: ['Token'],
    }),
    
    // Revoke specific token by ID
    revokeToken: builder.mutation<ApiResponse<null>, string>({
      query: (tokenId) => ({
        url: `/tokens/${tokenId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['Token'],
    }),
    
    // Revoke all tokens except current
    revokeAllTokens: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/tokens/revoke-all',
        method: 'POST',
      }),
      invalidatesTags: ['Token'],
    }),
  }),
});

export const {
  useGetActiveTokensQuery,
  useRevokeTokenMutation,
  useRevokeAllTokensMutation,
} = tokenApi;