import axiosInstance from "./axiosInstance";

// Routes are relative to baseURL in axiosInstance
const BASE_URL = "/checklist";

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (page = 1) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const userAccess = localStorage.getItem("user_access") || "";
  const userAccess1 = localStorage.getItem("user_access1") || "";
  const departments = [userAccess, userAccess1].filter(Boolean).join(",");

  const response = await axiosInstance.get(
    `${BASE_URL}/pending?page=${page}&username=${username}&role=${role}&departments=${encodeURIComponent(departments)}`
  );

  return response.data;
};


// =======================================================
// 2️⃣ Fetch Checklist History (AWS Backend)
// =======================================================
export const fetchChechListDataForHistory = async (page = 1) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const userAccess = localStorage.getItem("user_access") || "";
  const userAccess1 = localStorage.getItem("user_access1") || "";
  const departments = [userAccess, userAccess1].filter(Boolean).join(",");

  const response = await axiosInstance.get(
    `${BASE_URL}/history?page=${page}&username=${username}&role=${role}&departments=${encodeURIComponent(departments)}`
  );

  return response.data.data || [];
};


// =======================================================
// 3️⃣ Submit Checklist (AWS Backend)
// =======================================================
export const updateChecklistData = async (submissionData) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/update`, submissionData);
    return response.data;
  } catch (error) {
    console.error("❌ Error Updating Checklist:", error);
    throw error.response?.data?.error || error.message;
  }
};

// =======================================================
// 4️⃣ Submit Remark + User Status (AWS Backend)
// =======================================================
export const postChecklistUserStatusData = async (items) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/user-status`, items);
    return response.data;
  } catch (error) {
    console.error("❌ Error submitting checklist user status:", error);
    throw error.response?.data?.error || error.message;
  }
};

// =======================================================
// 5️⃣ Admin Status Update (AWS Backend)
// =======================================================
export const patchChecklistAdminStatus = async (items) => {
  try {
    const response = await axiosInstance.patch(`${BASE_URL}/admin-status`, items);
    return response.data;
  } catch (error) {
    console.error("❌ Error patching admin checklist status:", error);
    throw error.response?.data?.error || error.message;
  }
};

// =======================================================
// 6️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/admin-done`, selectedItems);
    return response.data;
  } catch (error) {
    console.error("❌ Error Marking Admin Done:", error);
    return { error: error.response?.data?.error || error.message };
  }
};


// 7️⃣ HR MANAGER CONFIRM (AWS Backend)
// =======================================================
export const updateHrManagerChecklistData = async (items) => {
  try {
    const response = await axiosInstance.patch(`${BASE_URL}/admin-role`, items);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating HR admin roles:", error);
    throw error.response?.data?.error || error.message;
  }
};

// =======================================================
// 7.1️⃣ HR MANAGER REJECT (AWS Backend)
// =======================================================
export const rejectHrManagerChecklistData = async (items) => {
  try {
    const response = await axiosInstance.patch(`${BASE_URL}/reject-role`, items);
    return response.data;
  } catch (error) {
    console.error("❌ Error rejecting HR manager checklist:", error);
    throw error.response?.data?.error || error.message;
  }
};


// =======================================================
// 8️⃣ Fetch Checklist for HR Approval
// =======================================================
export const fetchChecklistForHrApproval = async (page = 1) => {
  // 🔒 Own department(s) – EXISTING LOGIC (unchanged)
  const userAccess = localStorage.getItem("user_access") || "";
  const userAccess1 = localStorage.getItem("user_access1") || "";

  // ➕ Additional allowed departments
  const verifyAccessDept = localStorage.getItem("verify_access_dept") || "";

  const departments = [
    userAccess,
    userAccess1,
    ...verifyAccessDept.split(",")
  ]
    .map(d => d.trim())
    .filter(Boolean)
    .join(",");

  const response = await axiosInstance.get(
    `${BASE_URL}/hr-manager?page=${page}&departments=${encodeURIComponent(departments)}`
  );

  const json = response.data;

  return {
    data: json.data || [],
    totalCount: json.totalCount ?? 0,
    page: json.page ?? page,
  };
};

// =======================================================
// 9️⃣ Fetch Unique Departments
// =======================================================
export const fetchChecklistDepartmentsAPI = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/departments`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    return [];
  }
};

// =======================================================
// 🔟 Fetch Unique Doers
// =======================================================
export const fetchChecklistDoersAPI = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/doers`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching doers:", error);
    return [];
  }
};
