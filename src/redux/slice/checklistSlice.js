import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchChechListDataForHistory,
  fetchChechListDataSortByDate,
  fetchChecklistForHrApproval,
  postChecklistAdminDoneAPI,
  updateChecklistData,
  updateHrManagerChecklistData,
  rejectHrManagerChecklistData,
  postChecklistUserStatusData,
  patchChecklistAdminStatus,
  fetchChecklistDepartmentsAPI,
  fetchChecklistDoersAPI
} from "../api/checkListApi";


// ============================================================
// 1️⃣ FETCH PENDING CHECKLIST
// ============================================================
export const checklistData = createAsyncThunk(
  "fetch/checklist",
  async (page = 1) => {
    const { data, totalCount } = await fetchChechListDataSortByDate(page);
    return { data, totalCount, page };
  }
);


// ============================================================
// 2️⃣ FETCH HISTORY CHECKLIST
// ============================================================
export const checklistHistoryData = createAsyncThunk(
  "fetch/history",
  async (page = 1) => {
    const response = await fetchChechListDataForHistory(page);
    return {
      data: response.data || [],
      totalCount: response.totalCount || 0,
      page
    };
  }
);


// ============================================================
// 3️⃣ UPDATE CHECKLIST (USER SUBMISSION)
// ============================================================
export const updateChecklist = createAsyncThunk(
  "update/checklist",
  async (submissionData) => {
    const updated = await updateChecklistData(submissionData);
    return updated;  // returns only message
  }
);

export const submitChecklistUserStatus = createAsyncThunk(
  "update/checklist/user-status",
  async (items) => {
    const response = await postChecklistUserStatusData(items);
    return response;
  }
);

export const patchChecklistAdminStatusAction = createAsyncThunk(
  "update/checklist/admin-status",
  async (items) => {
    const response = await patchChecklistAdminStatus(items);
    return response;
  }
);

export const updateHrManagerChecklist = createAsyncThunk(
  "update/checklist/hr-manager",
  async (items) => {
    const response = await updateHrManagerChecklistData(items);
    return response;
  }
);

export const rejectHrManagerChecklist = createAsyncThunk(
  "reject/checklist/hr-manager",
  async (items) => {
    const response = await rejectHrManagerChecklistData(items);
    return response;
  }
);


export const fetchHrChecklistData = createAsyncThunk(
  "fetch/hr-checklist",
  async (page = 1) => {
    const { data, totalCount, page: responsePage } = await fetchChecklistForHrApproval(page);
    return {
      data,
      totalCount,
      page: responsePage ?? page,
    };
  }
);


// ============================================================
// 4️⃣ ADMIN DONE
// ============================================================
export const checklistAdminDone = createAsyncThunk(
  "insert/admin_done",
  async (items) => {
    const admin_done = await postChecklistAdminDoneAPI(items);
    return admin_done;
  }
);


// ============================================================
// 6️⃣ FETCH DEPARTMENTS & DOERS
// ============================================================
export const fetchChecklistDepartments = createAsyncThunk(
  "fetch/checklist-departments",
  async () => {
    const response = await fetchChecklistDepartmentsAPI();
    return response;
  }
);

export const fetchChecklistDoers = createAsyncThunk(
  "fetch/checklist-doers",
  async () => {
    const response = await fetchChecklistDoersAPI();
    return response;
  }
);


// ============================================================
// 5️⃣ SLICE
// ============================================================
const checkListSlice = createSlice({
  name: "checklist",
  initialState: {
    checklist: [],
    history: [],
    hrChecklist: [],
    departments: [], // Store unique departments
    doers: [],       // Store unique doers

    loading: false,
    hrLoading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
    historyTotal: 0,
    historyHasMore: true,
    historyCurrentPage: 1,
    hrHasMore: true,
    hrCurrentPage: 1,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // -----------------------------
      // FETCH PENDING CHECKLIST
      // -----------------------------
      .addCase(checklistData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistData.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.page === 1) {
          state.checklist = action.payload.data;
        } else {
          state.checklist = [...state.checklist, ...action.payload.data];
        }

        state.currentPage = action.payload.page;

        // Determine pagination
        state.hasMore = state.checklist.length < action.payload.totalCount;
      })

      .addCase(checklistData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching checklist";
      })



      // -----------------------------
      // FETCH HISTORY
      // -----------------------------
      .addCase(checklistHistoryData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistHistoryData.fulfilled, (state, action) => {
        state.loading = false;
        const { data, totalCount, page } = action.payload;

        if (page === 1) {
          state.history = data;
        } else {
          state.history = [...state.history, ...data];
        }

        state.historyCurrentPage = page;
        state.historyTotal = parseInt(totalCount, 10) || 0;
        state.historyHasMore = state.history.length < (parseInt(totalCount, 10) || 0);
      })

      .addCase(checklistHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching history";
      })



      // -----------------------------
      // UPDATE CHECKLIST (USER SUBMIT)
      // -----------------------------
      .addCase(updateChecklist.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateChecklist.fulfilled, (state) => {
        state.loading = false;
        // No need to update state.checklist – backend already saved
      })

      .addCase(updateChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed updating checklist";
      })

      // -----------------------------
      // SUBMIT REMARK / USER STATUS
      // -----------------------------
      .addCase(submitChecklistUserStatus.pending, (state) => {
        state.loading = true;
      })

      .addCase(submitChecklistUserStatus.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(submitChecklistUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed submitting user status";
      })

      // -----------------------------
      // ADMIN STATUS (PATCH)
      // -----------------------------
      .addCase(patchChecklistAdminStatusAction.pending, (state) => {
        state.loading = true;
      })

      .addCase(patchChecklistAdminStatusAction.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(patchChecklistAdminStatusAction.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error?.message || "Failed updating admin checklist status";
      })

      // -----------------------------
      // HR MANAGER CONFIRM
      // -----------------------------
      .addCase(updateHrManagerChecklist.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateHrManagerChecklist.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(updateHrManagerChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed updating HR roles";
      })
      .addCase(rejectHrManagerChecklist.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectHrManagerChecklist.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectHrManagerChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to reject HR tasks";
      })


      // -----------------------------
      // FETCH HR CHECKLIST
      // -----------------------------
      .addCase(fetchHrChecklistData.pending, (state) => {
        state.hrLoading = true;
      })

      .addCase(fetchHrChecklistData.fulfilled, (state, action) => {
        state.hrLoading = false;
        if (action.payload.page === 1) {
          state.hrChecklist = action.payload.data;
        } else {
          state.hrChecklist = [...state.hrChecklist, ...action.payload.data];
        }
        state.hrCurrentPage = action.payload.page;
        state.hrHasMore = state.hrChecklist.length < action.payload.totalCount;
      })

      .addCase(fetchHrChecklistData.rejected, (state, action) => {
        state.hrLoading = false;
        state.error = action.error?.message || "Failed fetching HR checklist";
      })


      // -----------------------------
      // ADMIN DONE
      // -----------------------------
      .addCase(checklistAdminDone.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistAdminDone.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(checklistAdminDone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Admin update failed";
      })

      // -----------------------------
      // FETCH DEPARTMENTS
      // -----------------------------
      .addCase(fetchChecklistDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })

      // -----------------------------
      // FETCH DOERS
      // -----------------------------
      .addCase(fetchChecklistDoers.fulfilled, (state, action) => {
        state.doers = action.payload;
      });
  },
});

export default checkListSlice.reducer;
