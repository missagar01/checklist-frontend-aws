import axiosInstance from "./axiosInstance";

// API functions
export const getMaintenanceTasksAPI = (page = 1, filters = {}) => {
  const params = { page, ...filters };
  return axiosInstance.get("maintenance/tasks", { params });
};

export const getPendingMaintenanceTasksAPI = (page = 1, userId = null) => {
  const params = { page, ...(userId && { userId }) };
  return axiosInstance.get("maintenance/tasks/pending", { params });
};

export const getCompletedMaintenanceTasksAPI = (page = 1, filters = {}) => {
  const role = localStorage.getItem("role");
  const user = localStorage.getItem("user-name");

  const params = {
    page,
    ...filters,
    ...(role === "user" ? { userId: user } : {})   // ✅ ADD THIS
  };

  return axiosInstance.get("maintenance/tasks/completed", { params });
};


export const updateMaintenanceTaskAPI = (taskId, updateData) => {
  const formData = new FormData();

  // Add all update data to formData
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && updateData[key] !== null) {
      formData.append(key, updateData[key]);
    }
  });

  return axiosInstance.put(`maintenance/tasks/${taskId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const updateMultipleMaintenanceTasksAPI = (tasks) => {
  return axiosInstance.put("maintenance/tasks/bulk/update", { tasks });
};

export const getUniqueMachineNamesAPI = () => {
  return axiosInstance.get("maintenance/machines/unique");
};

export const getUniqueMaintenanceDepartmentsAPI = () => {
  return axiosInstance.get("maintenance/departments/unique");
};



export const getMaintenanceStatisticsAPI = () => {
  return axiosInstance.get("maintenance/statistics");
};

export const getUniqueAssignedPersonnelAPI = () => {
  return axiosInstance.get("maintenance/personnel/unique");
};

export const getUniqueMaintenanceDoerNameAPI = () => {
  return axiosInstance.get("maintenance/doers/unique");
};

export default axiosInstance;