// checkListApi.js
// const BASE_URL = "http://localhost:5050/api/checklist";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/checklist`;

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (page = 1) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const userAccess = localStorage.getItem("user_access") || "";
  const userAccess1 = localStorage.getItem("user_access1") || "";
  const departments = [userAccess, userAccess1].filter(Boolean).join(",");

  const response = await fetch(
    `${BASE_URL}/pending?page=${page}&username=${username}&role=${role}&departments=${encodeURIComponent(departments)}`
  );

  return await response.json();
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

  const response = await fetch(
    `${BASE_URL}/history?page=${page}&username=${username}&role=${role}&departments=${encodeURIComponent(departments)}`
  );

  return (await response.json()).data || [];
};


// =======================================================
// 3️⃣ Submit Checklist (AWS Backend)
// =======================================================
export const updateChecklistData = async (submissionData) => {
  try {
    const response = await fetch(`${BASE_URL}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Updating Checklist:", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ Submit Remark + User Status (AWS Backend)
// =======================================================
export const postChecklistUserStatusData = async (items) => {
  try {
    const response = await fetch(`${BASE_URL}/user-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error("Failed to submit user status");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error submitting checklist user status:", error);
    throw error;
  }
};

// =======================================================
// 5️⃣ Admin Status Update (AWS Backend)
// =======================================================
export const patchChecklistAdminStatus = async (items) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error("Failed to patch admin status");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error patching admin checklist status:", error);
    throw error;
  }
};

// =======================================================
// 6️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedItems),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Marking Admin Done:", error);
    return { error };
  }
};


// 7️⃣ HR MANAGER CONFIRM (AWS Backend)
// =======================================================
export const updateHrManagerChecklistData = async (items) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error("Failed to update HR admin roles");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error updating HR manager checklist:", error);
    throw error;
  }
};

// =======================================================
// 8️⃣ Fetch Checklist for HR Approval
// =======================================================
export const fetchChecklistForHrApproval = async (page = 1) => {
  const userAccess = localStorage.getItem("user_access") || "";
  const userAccess1 = localStorage.getItem("user_access1") || "";
  const departments = [userAccess, userAccess1].filter(Boolean).join(",");

  const response = await fetch(
    `${BASE_URL}/hr-manager?page=${page}&departments=${encodeURIComponent(departments)}`
  );

  if (!response.ok) {
    throw new Error("Failed fetching HR approval checklist");
  }

  const json = await response.json();

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
    const response = await fetch(`${BASE_URL}/departments`);
    if (!response.ok) throw new Error("Failed to fetch departments");
    return await response.json();
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
    const response = await fetch(`${BASE_URL}/doers`);
    if (!response.ok) throw new Error("Failed to fetch doers");
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching doers:", error);
    return [];
  }
};


