"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../components/layout/AdminLayout";
import {
  fetchHrChecklistData,
  updateHrManagerChecklist,
} from "../../redux/slice/checklistSlice";

export default function HrManager() {
  const dispatch = useDispatch();

  const {
    hrChecklist = [],
    hrLoading = false,
    error,
    hrHasMore = false,
    hrCurrentPage = 1,
  } = useSelector((state) => state.checkList || {});

  const [selectedItems, setSelectedItems] = useState(() => new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [rowStatuses, setRowStatuses] = useState({});

  const handleStatusChange = useCallback((id, newStatus) => {
    setRowStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
    // Auto-select the row when status is changed
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    dispatch(fetchHrChecklistData(1));
  }, [dispatch]);

  const rows = useMemo(() => {
    if (!Array.isArray(hrChecklist)) return [];
    return hrChecklist.map((task, index) => {
      const taskId = task?.task_id ?? task?._id ?? "-";
      const identifier = task?.task_id ?? task?._id ?? `task-row-${index}`;

      return {
        id: identifier,
        taskId,
        description: task?.task_description ?? "-",
        department: task?.department ?? "-",
        assignedTo: task?.name ?? task?.assigned_to ?? "-",
        status: task?.status ?? "-",
        userStatus:
          task?.["user_status-checklist"] ??
          task?.userStatusChecklist ??
          task?.user_status_checklist ??
          "-",
        date:
          task?.task_start_date ??
          task?.planned_date ??
          task?.created_at ??
          task?.due_date ??
          "-",
        remarks: task?.remark ?? task?.remarks ?? "-",
      };
    });
  }, [hrChecklist]);

  const selectableRowIds = useMemo(() => {
    return rows.filter((r) => r.taskId && r.taskId !== "-").map((r) => r.id);
  }, [rows]);

  const areAllSelectableSelected = useMemo(() => {
    return (
      selectableRowIds.length > 0 &&
      selectableRowIds.every((id) => selectedItems.has(id))
    );
  }, [selectableRowIds, selectedItems]);

  const handleToggleRow = useCallback((id) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked) => {
      if (!checked) {
        setSelectedItems(new Set());
        return;
      }
      setSelectedItems(new Set(selectableRowIds));
    },
    [selectableRowIds]
  );

  const containerRef = useRef(null);

  const loadMoreHrChecklist = useCallback(() => {
    if (!hrHasMore || hrLoading) return;
    dispatch(fetchHrChecklistData(hrCurrentPage + 1));
  }, [dispatch, hrCurrentPage, hrHasMore, hrLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop - container.clientHeight < 180) {
        loadMoreHrChecklist();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadMoreHrChecklist]);

  const handleConfirmSelected = useCallback(async () => {
    if (selectedItems.size === 0) {
      setFeedback({ type: "error", text: "Select at least one task before confirming." });
      return;
    }

    setFeedback(null);

    const itemsToConfirm = rows
      .filter((row) => selectedItems.has(row.id) && row.taskId && row.taskId !== "-")
      .map((row) => ({
        taskId: row.taskId,
        admin_done: "Confirmed",
        status: rowStatuses[row.id] || (row.status !== "-" ? row.status : "Yes"),
      }));

    if (itemsToConfirm.length === 0) {
      setFeedback({ type: "error", text: "Selected rows do not contain valid task IDs." });
      return;
    }

    setIsConfirming(true);

    try {
      await dispatch(updateHrManagerChecklist(itemsToConfirm)).unwrap();
      setFeedback({ type: "success", text: `✅ Confirmed ${itemsToConfirm.length} task(s)` });
      setSelectedItems(new Set());
      setRowStatuses({});
      dispatch(fetchHrChecklistData(1));
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Failed to send confirmations." });
    } finally {
      setIsConfirming(false);
    }
  }, [dispatch, rows, selectedItems, rowStatuses]);

  return (
    <AdminLayout>
      <div className="space-y-4 p-3 sm:p-4 md:p-5">
        <div className="rounded-xl border border-blue-100 bg-white/80 p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-blue-700">Checklist Approval</h1>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            Checklist load failed: {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConfirmSelected}
              disabled={selectedItems.size === 0 || isConfirming}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Sending confirmation..." : "Confirm Selected"}
            </button>

            {selectedItems.size > 0 && (
              <span className="text-xs text-gray-500">
                {selectedItems.size} task{selectedItems.size > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-xs font-medium ${feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
                }`}
            >
              {feedback.text}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
          {hrLoading && rows.length === 0 ? (
            <div className="flex items-center justify-center p-10 text-xs text-blue-600">
              Loading checklist responses...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div ref={containerRef} className="max-h-[56vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="sticky top-0 px-3 py-2 text-left bg-gray-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={rows.length > 0 && areAllSelectableSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          aria-label="Select all checklist items"
                        />
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        #
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Task ID
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Description
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Department
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Assigned To
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Status
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        User Status Checklist
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Date
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                          {hrLoading
                            ? "Looking for checklist responses..."
                            : "No checklist entries found."}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-blue-50/60">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedItems.has(row.id)}
                              onChange={() => handleToggleRow(row.id)}
                            />
                          </td>
                          <td className="px-3 py-3 text-gray-600">{index + 1}</td>
                          <td className="px-3 py-3 font-semibold text-blue-700">{row.taskId}</td>
                          <td className="px-3 py-3 text-gray-700">{row.description}</td>
                          <td className="px-3 py-3 text-gray-600">{row.department}</td>
                          <td className="px-3 py-3 text-gray-600">{row.assignedTo}</td>
                          <td className="px-3 py-3 text-gray-600">
                            <select
                              className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                              value={rowStatuses[row.id] || (row.status !== "-" ? row.status : "")}
                              onChange={(e) => handleStatusChange(row.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </td>
                          <td className="px-3 py-3 text-gray-600">{row.userStatus}</td>
                          <td className="px-3 py-3 text-gray-600">{row.date}</td>
                          <td className="px-3 py-3 text-gray-600">{row.remarks}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
