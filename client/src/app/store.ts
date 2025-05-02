import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '@/features/auth/authApi'
import authReducer from '@/features/auth/authSlice'
import { tokenApi } from '@/features/token/tokenApi'
import { setupListeners } from '@reduxjs/toolkit/query'
import { bookApi } from '@/features/book/bookApi'
import { memberApi } from '@/features/member/memberApi'
import { transactionApi } from '@/features/transaction/transactionApi'
// ...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tokenApi.reducerPath]: tokenApi.reducer,
    [bookApi.reducerPath]: bookApi.reducer,
    [memberApi.reducerPath]: memberApi.reducer,
    [transactionApi.reducerPath]: transactionApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      tokenApi.middleware,
      bookApi.middleware,
      memberApi.middleware,
      transactionApi.middleware
    ),
})

setupListeners(store.dispatch);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch