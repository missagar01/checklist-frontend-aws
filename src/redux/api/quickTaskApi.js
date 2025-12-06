const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const jsonRequest = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
};


// =========================
// FETCH CHECKLIST (PAGINATED)
// =========================
export const fetchChecklistData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  dateRange = {}
) => {
  const payload = { page, pageSize, nameFilter };

  if (dateRange.startDate) payload.startDate = dateRange.startDate;
  if (dateRange.endDate) payload.endDate = dateRange.endDate;

  return jsonRequest("/tasks/checklist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// =========================
// FETCH DELEGATION
// =========================
export const fetchDelegationData = async (
  page = 0,
  pageSize = 50,
  nameFilter = "",
  dateRange = {}
) => {
  const payload = { page, pageSize, nameFilter };

  if (dateRange.startDate) payload.startDate = dateRange.startDate;
  if (dateRange.endDate) payload.endDate = dateRange.endDate;

  return jsonRequest("/tasks/delegation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// =========================
// DELETE CHECKLIST TASKS
// =========================
export const deleteChecklistTasksApi = async (tasks) => {
  return jsonRequest("/tasks/delete-checklist", {
    method: "POST",
    body: JSON.stringify({ tasks }),
  });
};

// =========================
// DELETE DELEGATION TASKS
// =========================
export const deleteDelegationTasksApi = async (taskIds) => {
  return jsonRequest("/tasks/delete-delegation", {
    method: "POST",
    body: JSON.stringify({ taskIds }),
  });
};

// =========================
// UPDATE CHECKLIST TASK
// =========================
export const updateChecklistTaskApi = async (updatedTask, originalTask) => {
  return jsonRequest("/tasks/update-checklist", {
    method: "POST",
    body: JSON.stringify({ updatedTask, originalTask }),
  });
};

// =========================
// FETCH USERS
// =========================
export const fetchUsersData = async () => {
  return jsonRequest("/tasks/users");
};
