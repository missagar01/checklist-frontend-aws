// API BASE URL
// const API_BASE = "http://localhost:5050/api";
// const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/tasks`;
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;


// =========================
// FETCH CHECKLIST (PAGINATED)
// =========================
export const fetchChecklistData = async (page = 0, pageSize = 50, nameFilter = "") => {
  const res = await fetch(`${API_BASE}/tasks/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, pageSize, nameFilter }),
  });

  return res.json();
};

// =========================
// FETCH DELEGATION
// =========================
export const fetchDelegationData = async (page = 0, pageSize = 50, nameFilter = "") => {
  const res = await fetch(`${API_BASE}/tasks/delegation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, pageSize, nameFilter }),
  });

  return res.json();
};

// =========================
// DELETE CHECKLIST TASKS
// =========================
export const deleteChecklistTasksApi = async (tasks) => {
  const res = await fetch(`${API_BASE}/tasks/delete-checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks }),
  });

  return res.json();
};

// =========================
// DELETE DELEGATION TASKS
// =========================
export const deleteDelegationTasksApi = async (taskIds) => {
  const res = await fetch(`${API_BASE}/tasks/delete-delegation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds }),
  });

  return res.json();
};

// =========================
// UPDATE CHECKLIST TASK
// =========================
export const updateChecklistTaskApi = async (updatedTask, originalTask) => {
  try {
    const res = await fetch(`${API_BASE}/tasks/update-checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updatedTask, originalTask }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating checklist task:", error);
    throw error; // Re-throw to let Redux handle it
  }
};

// =========================
// FETCH USERS
// =========================
export const fetchUsersData = async () => {
  const res = await fetch(`${API_BASE}/tasks/users`);
  return res.json();
};
