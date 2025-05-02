// authHooks.ts
// import { useSelector } from 'react-redux';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser, selectIsAuthenticated, selectToken } from './authSlice';
import { useLoginMutation, useLogoutMutation, useRegisterMutation, LoginRequest, RegisterRequest } from '@/features/auth/authApi';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from './authSlice';
import { AppDispatch } from '@/app/store';
// import { useAppDispatch } from '@/app/hooks';
import { User, ApiResponse, AuthResponse } from '@/types/authTypes';

// Hook to get current authenticated user
export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return {
    user,
    token,
    isAuthenticated,
  };
};

// Hook for user registration
export const useRegister = () => {
  const [registerUser, result] = useRegisterMutation();
  const dispatch = useDispatch<AppDispatch>();

  const register = async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await registerUser(userData).unwrap();
      
      if (response.status === 'success' && response.data) {
        // Store the credentials in Redux
        dispatch(setCredentials({
          user: response.data.user,
          token: response.data.access_token,
          refreshToken: response.data.refresh_token,
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  return { register, ...result };
};

// Hook for user login
export const useLogin = () => {
  const [loginUser, result] = useLoginMutation();
  const dispatch = useDispatch<AppDispatch>();

  const login = async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await loginUser(credentials).unwrap();
      
      if (response.status === 'success' && response.data) {
        // Store the credentials in Redux
        dispatch(setCredentials({
          user: response.data.user,
          token: response.data.access_token,
          refreshToken: response.data.refresh_token,
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  return { login, ...result };
};

// Hook for user logout
export const useLogout = () => {
  const [logoutUser, result] = useLogoutMutation();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useAuth();

  const logout = async (): Promise<void> => {
    if (token) {
      try {
        // Call the API to invalidate the token on the server
        await logoutUser().unwrap();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Always clear local state, even if the API call fails
    dispatch({ type: 'auth/logOut' });
  };

  return { logout, ...result };
};

// Auto-login hook
export const useAutoLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token } = useAuth();
  
  useEffect(() => {
    // Check if we have auth data in localStorage but not in Redux
    if (!isAuthenticated) {
      try {
        const authData = localStorage.getItem('auth');
        if (authData) {
          const parsedData = JSON.parse(authData) as {
            token: string;
            refreshToken: string;
            user: User;
          };
          
          if (parsedData.token && parsedData.user) {
            dispatch(setCredentials({
              token: parsedData.token,
              refreshToken: parsedData.refreshToken,
              user: parsedData.user
            }));
          }
        }
      } catch (error) {
        console.error('Auto-login error:', error);
      }
    }
  }, [dispatch, isAuthenticated]);
  
  return { isAuthenticated, token };
};