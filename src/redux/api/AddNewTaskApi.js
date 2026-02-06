import axios from "axios";

// Dynamic Base URL
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const addNewChecklistTaskApi = async (formData) => {
  try {
    const res = await axios.post(`${BASE_URL}/add-new-task`, formData);

    return { data: res.data }; // same return format
  } catch (err) {
    return {
      error: err.response?.data?.message || "Failed to add checklist task",
    };
  }
};
