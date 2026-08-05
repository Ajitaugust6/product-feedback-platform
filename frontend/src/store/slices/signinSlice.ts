import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 1. Login Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', credentials);
    return response.data.data; // Returns { user, token }
  }
);

// 2. Register Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: { email: string; username: string; password: string }) => {
    const response = await axios.post('http://localhost:5000/api/v1/auth/register', credentials);
    return response.data.data; // Returns { user, token }
  }
);

// Safely boot up user from hard drive
const storedUser = localStorage.getItem('user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null, // Fix 1: Read user from storage
    token: localStorage.getItem('token') || null, 
    status: 'idle',
  },
  reducers: {
    // 3. Logout Action
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Fix 2: Clear user on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token); 
        localStorage.setItem('user', JSON.stringify(action.payload.user)); // Fix 3: Save user on login
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token); 
        localStorage.setItem('user', JSON.stringify(action.payload.user)); // Fix 4: Save user on register
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;