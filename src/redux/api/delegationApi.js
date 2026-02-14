import axiosInstance from "./axiosInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

const API = ""; // axiosInstance baseURL is used

// SINGLE — send all tasks in one go
export const insertDelegationDoneAndUpdate = createAsyncThunk(
  "delegation/submit",
  async ({ selectedDataArray }, { rejectWithValue }) => {
    try {
      console.log('🚀 Sending delegation submission:', {
        itemCount: selectedDataArray.length,
        data: selectedDataArray
      });

      const { data } = await axiosInstance.post(`/delegation/submit`, {
        selectedData: selectedDataArray,
      });

      console.log('✅ Delegation submission successful:', data);
      return data;

    } catch (err) {
      console.error('❌ Delegation submission failed:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // Handle different types of errors
      if (err.code === 'ERR_NETWORK') {
        return rejectWithValue('Network error: Please check your internet connection and try again.');
      } else if (err.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout: The server took too long to respond.');
      } else {
        return rejectWithValue(err.response?.data || err.message);
      }
    }
  }
);

// FETCH PENDING
export const fetchDelegationDataSortByDate = async () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");
  const userAccess = localStorage.getItem("user_access");

  const { data } = await axiosInstance.get(`/delegation`, {
    params: { role, username, user_access: userAccess },
  });

  return data;
};

// FETCH DONE
export const fetchDelegation_DoneDataSortByDate = async () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");
  const userAccess = localStorage.getItem("user_access");

  const { data } = await axiosInstance.get(`/delegation-done`, {
    params: { role, username, user_access: userAccess },
  });

  return data;
};
