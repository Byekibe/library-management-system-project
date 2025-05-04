  // src/services/memberApi.ts
  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
  import { Member, CreateMemberRequest, UpdateMemberRequest, MemberDebt, ApiResponse, RecordPaymentRequest, RecordPaymentResponse } from '@/types/memberTypes';

  const baseUrl = import.meta.env.VITE_BASE_URL;
  
  export const memberApi = createApi({
    reducerPath: 'memberApi',
    baseQuery: fetchBaseQuery({ baseUrl }),
    tagTypes: ['Member', 'MemberDebt'],
    endpoints: (builder) => ({
      // Get all members
      getMembers: builder.query<Member[], void>({
        query: () => '/members',
        transformResponse: (response: ApiResponse<Member[]>) => response.data || [],
        providesTags: (result) => 
          result
            ? [
                ...result.map(({ id }) => ({ type: 'Member' as const, id })),
                { type: 'Member', id: 'LIST' },
              ]
            : [{ type: 'Member', id: 'LIST' }],
      }),
      
      // Get a single member by ID
      getMember: builder.query<Member, number>({
        query: (id) => `/members/${id}`,
        transformResponse: (response: ApiResponse<Member>) => response.data as Member,
        providesTags: (_result, _error, id) => [{ type: 'Member', id }],
      }),
      
      // Create a new member
      createMember: builder.mutation<Member, CreateMemberRequest>({
        query: (member) => ({
          url: '/members',
          method: 'POST',
          body: member,
        }),
        transformResponse: (response: ApiResponse<Member>) => response.data as Member,
        invalidatesTags: [{ type: 'Member', id: 'LIST' }],
      }),
      
      // Update a member
      updateMember: builder.mutation<Member, { id: number; member: UpdateMemberRequest }>({
        query: ({ id, member }) => ({
          url: `/members/${id}`,
          method: 'PUT',
          body: member,
        }),
        transformResponse: (response: ApiResponse<Member>) => response.data as Member,
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Member', id },
          { type: 'Member', id: 'LIST' }
        ],
      }),
      
      // Delete a member
      deleteMember: builder.mutation<void, number>({
        query: (id) => ({
          url: `/members/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Member', id },
          { type: 'Member', id: 'LIST' }
        ],
      }),
      
      // Get member's outstanding debt
      getMemberDebt: builder.query<MemberDebt, number>({
        query: (id) => `/members/${id}/debt`,
        transformResponse: (response: ApiResponse<MemberDebt>) => response.data as MemberDebt,
        providesTags: (_result, _error, id) => [
          { type: 'Member', id },
          { type: 'MemberDebt', id }
        ],
      }),

          // --- New Mutation: recordPayment ---
      recordPayment: builder.mutation<RecordPaymentResponse, RecordPaymentRequest>({
        query: ({ memberId, amount }) => ({
          url: `/members/${memberId}/payment`, // Matches your Flask route URL
          method: 'POST', // Matches your Flask route method
          body: { amount: amount }, // Send the amount in the request body as JSON
          // headers: { 'Content-Type': 'application/json' }, // fetchBaseQuery sets this automatically
        }),
        // Define which tags to invalidate upon successful payment
        invalidatesTags: (_result, error, { memberId }) => {
          // Only invalidate if the mutation was successful (error is undefined)
          if (error) {
            return []; // Don't invalidate on error
          }
          return [
            { type: 'Member', id: memberId }, // Invalidate the specific member's data
            { type: 'MemberDebt', id: memberId }, // Invalidate the specific member's debt data
            { type: 'Member', id: 'LIST' }, // Optional: Invalidate the members list if it shows debt
            // Add other tags if necessary
          ];
        },
      }),

    }),
  });
  
  // Export hooks for usage in components
  export const {
    useGetMembersQuery,
    useGetMemberQuery,
    useCreateMemberMutation,
    useUpdateMemberMutation,
    useDeleteMemberMutation,
    useGetMemberDebtQuery,
    useRecordPaymentMutation,
  } = memberApi;