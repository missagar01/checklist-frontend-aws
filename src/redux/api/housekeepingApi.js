import axiosInstance from "./axiosInstance";

// API functions for housekeeping
// All routes are relative to VITE_API_BASE_URL defined in axiosInstance

// Assign Task - Generate task
export const assignHousekeepingTaskAPI = (taskData) => {
  return axiosInstance.post("/housekeeping-dashboard/assigntask/generate", taskData, {
    timeout: 0, // No timeout - wait indefinitely
  });
};

// Get Locations
export const getHousekeepingLocationsAPI = () => {
  return axiosInstance.get("/housekeeping-dashboard/locations");
};

// Get User Departments - using settings/users endpoint which returns users with departments
export const getHousekeepingUserDepartmentsAPI = () => {
  return axiosInstance.get("/settings/users");
};

// Create Location
export const createHousekeepingLocationAPI = (payload) => {
  if (!payload) {
    throw new Error('Location payload required');
  }
  return axiosInstance.post("/housekeeping-dashboard/locations", payload);
};

// Get Pending Tasks
export const getHousekeepingPendingTasksAPI = (page = 1, filters = {}) => {
  const params = { page, limit: filters.limit || 100, ...filters };
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/pending", { params });
};

// Get History Tasks
export const getHousekeepingHistoryTasksAPI = (page = 1, filters = {}) => {
  const params = { page, limit: filters.limit || 100, ...filters };
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/history", { params });
};

// Confirm Task (single)
export const confirmHousekeepingTaskAPI = (taskId, remark = "", imageFile = null, doerName2 = "") => {
  const formData = new FormData();

  if (remark) formData.append("remark", remark);
  if (doerName2) formData.append("doer_name2", doerName2);
  formData.append("attachment", "confirmed");

  if (imageFile instanceof File) {
    formData.append("image", imageFile);
  } else if (typeof imageFile === "string" && imageFile) {
    formData.append("image", imageFile);
  }

  return axiosInstance.post(
    `/housekeeping-dashboard/assigntask/generate/${taskId}/confirm`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

// Submit Tasks (bulk - for admin)
export const submitHousekeepingTasksAPI = async (tasks = []) => {
  const updatePromises = tasks.map((task) => {
    const formData = new FormData();

    if (task.status) formData.append("status", task.status);
    if (task.remark) formData.append("remark", task.remark);
    if (task.attachment) formData.append("attachment", task.attachment);
    if (task.doer_name2) formData.append("doer_name2", task.doer_name2);

    if (task.status === "Yes") {
      formData.append("submission_date", new Date().toISOString());
    }

    if (task.image_file instanceof File) {
      formData.append("image", task.image_file);
    } else if (task.image_url) {
      formData.append("image", task.image_url);
    }

    return axiosInstance.patch(
      `/housekeeping-dashboard/assigntask/generate/${task.task_id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    ).then(response => response.data);
  });

  const results = await Promise.allSettled(updatePromises);

  const successful = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failed = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);

  return { successful, failed };
};

// Update Task
export const updateHousekeepingTaskAPI = (taskId, updateData) => {
  const formData = new FormData();

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== "") {
      formData.append(key, updateData[key]);
    }
  });

  return axiosInstance.patch(
    `/housekeeping-dashboard/assigntask/generate/${taskId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

// Get Given By options (from settings)
export const getHousekeepingGivenByAPI = () => {
  return axiosInstance.get("/settings/given-by");
};

// Dashboard APIs
export const getHousekeepingDashboardSummaryAPI = (options = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/dashboard/summary", {
    params: {
      ...options
    }
  });
};

export const getHousekeepingDepartmentsAPI = () => {
  return axiosInstance.get("/housekeeping-dashboard/dashboard/departments");
};

// Task APIs for dashboard
const todayISO = () => new Date().toISOString().split("T")[0];

export const getHousekeepingTodayTasksAPI = (options = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/today", {
    params: {
      limit: 100,
      page: 1,
      ...options,
    }
  });
};

export const getHousekeepingTomorrowTasksAPI = (options = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/tomorrow", {
    params: {
      limit: 100,
      page: 1,
      ...options,
    }
  });
};

export const getHousekeepingOverdueTasksAPI = (options = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/overdue", {
    params: {
      endDate: todayISO(),
      limit: 100,
      page: 1,
      ...options,
    }
  });
};

export const getHousekeepingTodayCountAPI = (filters = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/today/count", {
    params: filters
  });
};

export const getHousekeepingTomorrowCountAPI = (filters = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/tomorrow/count", {
    params: filters
  });
};

export const getHousekeepingOverdueCountAPI = (filters = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/overdue/count", {
    params: filters
  });
};

export const getHousekeepingNotDoneCountAPI = (filters = {}) => {
  return axiosInstance.get("/housekeeping-dashboard/assigntask/generate/not-done/count", {
    params: filters
  });
};

export const getHousekeepingTaskCountsAPI = async (filters = {}) => {
  const [recentData, upcomingData, overdueData, notDoneData] = await Promise.all([
    getHousekeepingTodayCountAPI(filters),
    getHousekeepingTomorrowCountAPI(filters),
    getHousekeepingOverdueCountAPI(filters),
    getHousekeepingNotDoneCountAPI(filters),
  ]);

  return {
    recent: recentData.data?.count || 0,
    upcoming: upcomingData.data?.count || 0,
    overdue: overdueData.data?.count || 0,
    notdone: notDoneData.data?.count || 0,
  };
};

export const getHousekeepingTasksWithFiltersAPI = (taskType, page = 1, limit = 50, filters = {}) => {
  let endpoint = "/housekeeping-dashboard/assigntask/generate";
  if (taskType === "overdue") endpoint = "/housekeeping-dashboard/assigntask/generate/overdue";
  else if (taskType === "recent") endpoint = "/housekeeping-dashboard/assigntask/generate/today";
  else if (taskType === "upcoming") endpoint = "/housekeeping-dashboard/assigntask/generate/tomorrow";
  else if (taskType === "notdone") endpoint = "/housekeeping-dashboard/assigntask/generate/not-done";

  return axiosInstance.get(endpoint, {
    params: {
      page,
      limit,
      ...filters,
    }
  });
};

export default axiosInstance;
