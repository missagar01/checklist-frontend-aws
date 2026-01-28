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
    doers = [],
  } = useSelector((state) => state.checkList || {});

  const [selectedItems, setSelectedItems] = useState(() => new Set());
  const [selectedDoer, setSelectedDoer] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");



  useEffect(() => {
    let page = 1;

    const loadAll = async () => {
      while (true) {
        const res = await dispatch(fetchHrChecklistData(page)).unwrap();
        if (!res || res.data.length === 0) break;
        if (res.data.length + (page - 1) * res.data.length >= res.totalCount) break;
        page++;
      }
    };

    loadAll();
    // dispatch(fetchChecklistDoers());
    // dispatch(fetchChecklistDoers());
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
        assignedTo: task?.assigned_to ?? "-",
        doerName: task?.name ?? "-",
        verify_access: task?.verify_access ?? null,
        status: task?.status ?? "-",
        userStatus:
          task?.["user_status-checklist"] ??
          task?.userStatusChecklist ??
          task?.user_status_checklist ??
          "-",
        date:
          (task?.task_start_date ??
            task?.planned_date ??
            task?.created_at ??
            task?.due_date ??
            "-").split("T")[0],
        remarks: task?.remark ?? task?.remarks ?? "-",
      };
    });
  }, [hrChecklist]);


  const doersFromRows = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map(r => r.doerName)
          .filter(name => name && name !== "-")
      )
    );
  }, [rows]);

  const departmentsFromRows = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map(r => r.department)
          .filter(dep => dep && dep !== "-")
      )
    ).sort((a, b) => a.localeCompare(b)); // ✅ sort here
  }, [rows]);




  console.table(rows.map(r => ({
    name: r.doerName,
    verify_access: r.verify_access
  })));


  const filteredRows = useMemo(() => {
    let data = rows;

    const verifyAccess = localStorage.getItem("verify_access");
    const loggedUser = localStorage.getItem("user-name");

    // ❌ Never show own tasks
    if (loggedUser) {
      data = data.filter(row => row.doerName !== loggedUser);
    }

    // 🧑‍💼 HOD → ONLY manager tasks
    if (verifyAccess === "hod") {
      data = data.filter(row => row.verify_access === "manager");
    }

    // 👨‍💼 Manager → block HOD tasks ONLY
    if (verifyAccess === "manager") {
      data = data.filter(row => row.verify_access !== "hod");
    }

    // Existing doer filter (unchanged)
    if (selectedDoer) {
      data = data.filter(row => row.doerName === selectedDoer);
    }

    // 🏢 Department dropdown filter
    if (selectedDepartment) {
      data = data.filter(
        row => row.department === selectedDepartment
      );
    }


    // 🏢 ADD: Department access filter (non-breaking)
    const loggedUserDept = localStorage.getItem("user_access");
    const verifyAccessDept = localStorage.getItem("verify_access_dept");

    if (loggedUserDept || verifyAccessDept) {
      const allowedDepts = new Set(
        [
          loggedUserDept,
          ...(verifyAccessDept
            ? verifyAccessDept.split(",").map(d => d.trim())
            : [])
        ]
          .filter(Boolean)
          .map(d => d.toUpperCase())
      );

      data = data.filter(row =>
        allowedDepts.has((row.department || "").toUpperCase())
      );
    }

    data.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db - da; // newest first
    });

    return data;
  }, [rows, selectedDoer, selectedDepartment]);


  const selectableRowIds = useMemo(() => {
    return filteredRows.filter((r) => r.taskId && r.taskId !== "-").map((r) => r.id);
  }, [filteredRows]);

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

  const handleConfirmSelected = useCallback(async () => {
    if (selectedItems.size === 0) {
      setFeedback({ type: "error", text: "Select at least one task before confirming." });
      return;
    }

    setFeedback(null);

    // ✅ ONLY taskId is sent
    const itemsToConfirm = rows
      .filter(row => selectedItems.has(row.id) && row.taskId && row.taskId !== "-")
      .map(row => ({
        taskId: row.taskId
      }));

    if (itemsToConfirm.length === 0) {
      setFeedback({ type: "error", text: "Selected rows do not contain valid task IDs." });
      return;
    }

    setIsConfirming(true);

    try {
      await dispatch(updateHrManagerChecklist(itemsToConfirm)).unwrap();

      setFeedback({
        type: "success",
        text: `✅ Confirmed ${itemsToConfirm.length} task(s)`
      });

      setSelectedItems(new Set());
      dispatch(fetchHrChecklistData());

    } catch (err) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to send confirmations."
      });
    } finally {
      setIsConfirming(false);
    }
  }, [dispatch, rows, selectedItems]);


  useEffect(() => {
    console.log("verify_access_dept:", localStorage.getItem("verify_access_dept"));
    console.log("departments sent:", localStorage.getItem("user_access"), localStorage.getItem("user_access1"));
    console.log("rows departments:", [...new Set(rows.map(r => r.department))]);
  }, [rows]);

  console.log("UI rows:", filteredRows.length);

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
            <select
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              value={selectedDoer}
              onChange={(e) => setSelectedDoer(e.target.value)}
            >
              <option value="">All Doers</option>
              {doersFromRows.map((doer) => (
                <option key={doer} value={doer}>
                  {doer}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departmentsFromRows.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>


            <button
              onClick={handleConfirmSelected}
              disabled={selectedItems.size === 0 || isConfirming}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Sending confirmation..." : "Confirm Selected"}
            </button>

            <span className="text-xs text-gray-500 font-medium">
              Total: {rows.length} |
            </span>

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
            <div className="overflow-hidden">
              <div ref={containerRef} className="max-h-[75vh] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="sticky top-0 z-10 px-3 py-2 text-left bg-gray-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filteredRows.length > 0 && areAllSelectableSelected}
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
                        Doer Name
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50 w-[280px] max-w-[280px]">
                        Description
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Department
                      </th>
                      <th className="sticky top-0 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Status
                      </th>


                      {/* <th className="sticky top-0 z-10 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        User Status Checklist
                      </th> */}
                      <th className="sticky top-0 z-10 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Date
                      </th>
                      <th className="sticky top-0 z-10 px-3 py-2 text-left font-medium tracking-wide text-blue-600 bg-gray-50">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                          {hrLoading
                            ? "Looking for checklist responses..."
                            : "No checklist entries found."}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, index) => (
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
                          <td className="px-3 py-3 text-gray-600">{row.doerName}</td>
                          <td className="px-3 py-3 text-gray-700">{row.description}</td>
                          <td className="px-3 py-3 text-gray-600">{row.department}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${String(row.status).toLowerCase() === "yes"
                                ? "bg-green-100 text-green-700"
                                : String(row.status).toLowerCase() === "no"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {row.status}
                            </span>
                          </td>
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
