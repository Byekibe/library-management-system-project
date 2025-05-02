  // src/services/transactionApi.ts
  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
  import { Transaction, IssueBookRequest, ApiResponse } from '@/types/transactionType';

  const baseUrl = import.meta.env.VITE_BASE_URL;
  
  export const transactionApi = createApi({
    reducerPath: 'transactionApi',
    baseQuery: fetchBaseQuery({ baseUrl }),
    tagTypes: ['Transaction', 'MemberTransaction'],
    endpoints: (builder) => ({
      // Get all transactions
      getAllTransactions: builder.query<Transaction[], void>({
        query: () => '/transactions',
        transformResponse: (response: ApiResponse<Transaction[]>) => response.data || [],
        providesTags: (result) => 
          result
            ? [
                ...result.map(({ id }) => ({ type: 'Transaction' as const, id })),
                { type: 'Transaction', id: 'LIST' },
              ]
            : [{ type: 'Transaction', id: 'LIST' }],
      }),
      
      // Issue a book to a member
      issueBook: builder.mutation<{ message: string }, IssueBookRequest>({
        query: (request) => ({
          url: '/transactions/issue',
          method: 'POST',
          body: request,
        }),
        transformResponse: (response: ApiResponse<any>) => ({ 
          message: response.message || 'Book issued successfully' 
        }),
        invalidatesTags: [
          { type: 'Transaction', id: 'LIST' },
          { type: 'MemberTransaction', id: 'LIST' }
        ],
      }),
      
      // Return a book
      returnBook: builder.mutation<{ message: string }, number>({
        query: (transactionId) => ({
          url: `/transactions/return/${transactionId}`,
          method: 'POST',
        }),
        transformResponse: (response: ApiResponse<any>) => ({ 
          message: response.message || 'Book returned successfully' 
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Transaction', id },
          { type: 'Transaction', id: 'LIST' },
          { type: 'MemberTransaction', id: 'LIST' }
        ],
      }),
      
      // Get transactions by member ID
      getTransactionsByMember: builder.query<Transaction[], number>({
        query: (memberId) => `/transactions/member/${memberId}`,
        transformResponse: (response: ApiResponse<Transaction[]>) => response.data || [],
        providesTags: (result, _error, memberId) => [
          ...result ? result.map(({ id }) => ({ type: 'Transaction' as const, id })) : [],
          { type: 'MemberTransaction', id: memberId },
          { type: 'MemberTransaction', id: 'LIST' }
        ],
      }),
      
      // Get open transactions by member ID
      getOpenTransactionsByMember: builder.query<Transaction[], number>({
        query: (memberId) => `/transactions/open/member/${memberId}`,
        transformResponse: (response: ApiResponse<Transaction[]>) => response.data || [],
        providesTags: (result, _error, memberId) => [
          ...result ? result.map(({ id }) => ({ type: 'Transaction' as const, id })) : [],
          { type: 'MemberTransaction', id: memberId }
        ],
      }),
    }),
  });
  
  // Export hooks for usage in components
  export const {
    useGetAllTransactionsQuery,
    useIssueBookMutation,
    useReturnBookMutation,
    useGetTransactionsByMemberQuery,
    useGetOpenTransactionsByMemberQuery,
  } = transactionApi;