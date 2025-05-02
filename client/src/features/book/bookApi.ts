  // src/services/bookApi.ts
  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
  import { Book, CreateBookRequest, UpdateBookRequest, ApiResponse } from '@/types/bookTypes';

  const baseUrl = import.meta.env.VITE_BASE_URL;
  
  export const bookApi = createApi({
    reducerPath: 'bookApi',
    baseQuery: fetchBaseQuery({ baseUrl }),
    tagTypes: ['Book'],
    endpoints: (builder) => ({
      // Get all books
      getBooks: builder.query<Book[], void>({
        query: () => '/books',
        transformResponse: (response: ApiResponse<Book[]>) => response.data || [],
        providesTags: (result) => 
          result
            ? [
                ...result.map(({ id }) => ({ type: 'Book' as const, id })),
                { type: 'Book', id: 'LIST' },
              ]
            : [{ type: 'Book', id: 'LIST' }],
      }),
      
      // Get a single book by ID
      getBook: builder.query<Book, number>({
        query: (id) => `/books/${id}`,
        transformResponse: (response: ApiResponse<Book>) => response.data as Book,
        providesTags: (_result, _error, id) => [{ type: 'Book', id }],
      }),
      
      // Create a new book
      createBook: builder.mutation<Book, CreateBookRequest>({
        query: (book) => ({
          url: '/books',
          method: 'POST',
          body: book,
        }),
        transformResponse: (response: ApiResponse<Book>) => response.data as Book,
        invalidatesTags: [{ type: 'Book', id: 'LIST' }],
      }),
      
      // Update a book
      updateBook: builder.mutation<Book, { id: number; book: UpdateBookRequest }>({
        query: ({ id, book }) => ({
          url: `/books/${id}`,
          method: 'PUT',
          body: book,
        }),
        transformResponse: (response: ApiResponse<Book>) => response.data as Book,
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Book', id },
          { type: 'Book', id: 'LIST' }
        ],
      }),
      
      // Delete a book
      deleteBook: builder.mutation<void, number>({
        query: (id) => ({
          url: `/books/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Book', id },
          { type: 'Book', id: 'LIST' }
        ],
      }),
      
      // Search books
      searchBooks: builder.query<Book[], string>({
        query: (query) => `/books/search?q=${encodeURIComponent(query)}`,
        transformResponse: (response: ApiResponse<Book[]>) => response.data || [],
        providesTags: [{ type: 'Book', id: 'LIST' }],
      }),
    }),
  });
  
  // Export hooks for usage in components
  export const {
    useGetBooksQuery,
    useGetBookQuery,
    useCreateBookMutation,
    useUpdateBookMutation,
    useDeleteBookMutation,
    useSearchBooksQuery,
  } = bookApi;