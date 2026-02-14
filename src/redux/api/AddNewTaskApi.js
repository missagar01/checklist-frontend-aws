import axiosInstance from "./axiosInstance";

// Routes are relative to baseURL in axiosInstance
const BASE_URL = "";

export const addNewChecklistTaskApi = async (formData) => {
  try {
    const res = await axiosInstance.post(`${BASE_URL}/add-new-task`, formData);

    return { data: res.data }; // same return format
  } catch (err) {
    return {
      error: err.response?.data?.message || "Failed to add checklist task",
    };
  }
};
