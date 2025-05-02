// authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState } from '@/types/authTypes';
import { RootState } from '@/app/store';

interface SetCredentialsPayload {
  user?: User | null;
  token: string;
  refreshToken: string;
}

// Load initial state from localStorage if available
const loadAuthState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading auth state:', err);
    return {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
};

// Save auth state to localStorage
const saveAuthState = (state: AuthState): void => {
  try {
    const serializedState = JSON.stringify({
      user: state.user,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
    });
    localStorage.setItem('auth', serializedState);
  } catch (err) {
    console.error('Error saving auth state:', err);
  }
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user !== undefined ? user : state.user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = Boolean(token);
      saveAuthState(state);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      saveAuthState(state);
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, updateUser, logOut } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState): User | null => state.auth.user;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;
export const selectToken = (state: RootState): string | null => state.auth.token;