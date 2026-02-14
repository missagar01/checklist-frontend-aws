// loginSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { LoginCredentialsApi } from '../api/loginApi';

// Helper to sync individual keys for backward compatibility with layouts/API
const syncLegacyKeys = (data) => {
  if (!data) return;
  const keys = {
    'user-name': data.user_name || data.username || "",
    'user_id': data.id || data.user_id || "",
    'role': data.role || "",
    'email_id': data.email_id || data.email || "",
    'token': data.token || "",
    'user_access': data.user_access || "",
    'userAccess': data.user_access || "",
    'user_access1': data.user_access1 || "",
    'userAccess1': data.user_access1 || "",
    'page_access': data.page_access || "",
    'system_access': data.system_access || "",
  };
  Object.entries(keys).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });
};

const getInitialUserData = () => {
  try {
    const persisted = localStorage.getItem('userData');
    if (persisted) {
      const data = JSON.parse(persisted);
      syncLegacyKeys(data); // Ensure individual keys are back in sync
      return data;
    }
  } catch (e) {
    console.error("Error parsing userData from storage", e);
  }

  // Fallback for legacy keys if the main object is missing
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('user-name');
  if (token && userName) {
    const data = {
      token,
      user_name: userName,
      role: localStorage.getItem('role'),
      user_id: localStorage.getItem('user_id'),
      system_access: localStorage.getItem('system_access'),
    };
    // If we have legacy keys, we should probably set the main userData once
    localStorage.setItem('userData', JSON.stringify(data));
    return data;
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
      localStorage.removeItem('user-pass');
      localStorage.removeItem('user_pass');
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
        // Persist both centralized object and individual keys
        localStorage.setItem('userData', JSON.stringify(action.payload));
        syncLegacyKeys(action.payload);
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
