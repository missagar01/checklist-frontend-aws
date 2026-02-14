// loginSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { LoginCredentialsApi } from '../api/loginApi';

const getInitialUserData = () => {
  try {
    const persisted = localStorage.getItem('userData');
    if (persisted) return JSON.parse(persisted);
  } catch (e) {
    console.error("Error parsing userData from storage", e);
  }

  // Fallback for legacy keys if the main object is missing
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('user-name');
  if (token && userName) {
    return {
      token,
      user_name: userName,
      role: localStorage.getItem('role'),
      user_id: localStorage.getItem('user_id'),
      system_access: localStorage.getItem('system_access'),
    };
  }
  return null;
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (formData, thunkAPI) => {
    const response = await LoginCredentialsApi(formData);
    if (response.error) {
      return thunkAPI.rejectWithValue(response.error);
    }
    return response.data;
  }
);

const loginSlice = createSlice({
  name: 'userData',
  initialState: {
    userData: getInitialUserData(),
    token: localStorage.getItem('token') || null,
    error: null,
    loading: false,
    isLoggedIn: !!localStorage.getItem('token'),
  },
  reducers: {
    logout: (state) => {
      state.userData = null;
      state.token = null;
      state.isLoggedIn = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload;
        state.token = action.payload.token;
        state.isLoggedIn = true;
        // Persist userData for session restoration
        localStorage.setItem('userData', JSON.stringify(action.payload));
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isLoggedIn = false;
        state.token = null;
      });
  },
});

export default loginSlice.reducer;
