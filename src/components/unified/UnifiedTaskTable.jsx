import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { CheckCircle2, X, AlertTriangle } from "lucide-react";
import TaskRow, { TaskTableHeader, TaskTableEmpty } from "./TaskRow";
import TaskFilterBar from "./TaskFilterBar";
import TaskDrawer from "./TaskDrawer";
import { filterTasks, sortByDate, sortHousekeepingTasks } from "../../utils/taskNormalizer";

/**
 * UnifiedTaskTable - Main unified table component
 * Now with inline editing like maintenance-data-page.jsx
 * Supports scroll-based infinite loading like SalesDataPage
 * 
 * @param {array} tasks - Array of normalized tasks
 * @param {boolean} loading - Loading state
 * @param {function} onUpdateTask - Task update handler (for drawer)
 * @param {function} onBulkSubmit - Bulk submit handler
 * @param {string} userRole - Current user role
 * @param {string} username - Current username
 * @param {function} onLoadMore - Callback to load more data (infinite scroll)
 * @param {boolean} hasMore - Whether there's more data to load
 */
export default function UnifiedTaskTable({
    tasks = [],
    loading = false,
    onUpdateTask,
    onBulkSubmit,
    onHODConfirm,  // Handler for HOD confirm (housekeeping tasks)
    userRole = "admin",
    onLoadMore,  // Callback for scroll-based loading
    hasMore = false,  // Whether more data is available
    housekeepingDepartments = [],  // Departments from assign_task table

    // New: Specific lists for context-aware filtering
    checklistDepartments = [],
    checklistDoers = [],
    maintenanceDepartments = [],
    maintenanceDoers = [],

    onRefresh, // New: Callback to refresh data when system changes
    totalCount = 0, // Fallback total count
    currentPage = 1, // Fallback current page
    pendingTotals = {}, // NEW: Object mapping sourceSystem -> totalCount
    pendingPages = {},  // NEW: Object mapping sourceSystem -> currentPage
    onPageChange,  // NEW: Page change callback
    onStatusChange, // NEW: Status change callback
}) {
    // State
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [filters, setFilters] = useState({
        searchTerm: "",
        sourceSystem: "checklist",
        status: "Pending",  // Default to Pending - only show pending tasks
        priority: "",
        assignedTo: "",
        department: "",
        startDate: "",
        endDate: "",
    });

    // Compute active options based on selected source system
    const { departmentOptions, assignedToOptions } = useMemo(() => {
        if (filters.sourceSystem === 'checklist') {
            return {
                departmentOptions: checklistDepartments,
                assignedToOptions: checklistDoers
            };
        }
        if (filters.sourceSystem === 'maintenance') {
            return {
                departmentOptions: maintenanceDepartments,
                assignedToOptions: maintenanceDoers
            };
        }
        if (filters.sourceSystem === 'housekeeping') {
            return {
                departmentOptions: housekeepingDepartments,
                assignedToOptions: [] // No doer filter for housekeeping yet
            };
        }

        return {
            departmentOptions: [],
            assignedToOptions: []
        };
    }, [filters.sourceSystem, checklistDepartments, checklistDoers, maintenanceDepartments, maintenanceDoers, housekeepingDepartments]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Inline editing state - like maintenance page
    const [rowData, setRowData] = useState({});  // { taskId: { status, soundStatus, temperature, remarks } }
    const [uploadedImages, setUploadedImages] = useState({});  // { taskId: { file, previewUrl } }

    // Image Preview Modal State (for viewing uploaded images in table)
    const [previewImage, setPreviewImage] = useState(null);

    const tableContainerRef = useRef(null);

    // Auto-refresh when source system changes
    useEffect(() => {
        if (onRefresh && filters.sourceSystem) {
            onRefresh(filters.sourceSystem);
        }
    }, [filters.sourceSystem, onRefresh]);

    // ✅ Sync status with parent for totalCount calculation
    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(filters.status);
        }
    }, [filters.status, onStatusChange]);

    // Handle scroll for infinite loading - improved detection
    const handleScroll = useCallback(() => {
        if (loading || isFetchingMore || !hasMore || !onLoadMore || filters.status !== "Completed") return;

        let isNearBottom = false;

        // Check table container scroll first (primary method)
        if (tableContainerRef.current) {
            const container = tableContainerRef.current;
            const containerScrollTop = container.scrollTop;
            const containerScrollHeight = container.scrollHeight;
            const containerClientHeight = container.clientHeight;

            // Check if near bottom of container (within 300px)
            if (containerScrollTop + containerClientHeight >= containerScrollHeight - 300) {
                isNearBottom = true;
            }
        }

        // Also check window scroll as fallback (for mobile)
        if (!isNearBottom) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Check if near bottom of window (within 400px)
            if (scrollTop + windowHeight >= documentHeight - 400) {
                isNearBottom = true;
            }
        }

        if (isNearBottom) {
            setIsFetchingMore(true);
            onLoadMore();
            // Reset after a delay to prevent multiple rapid calls
            setTimeout(() => setIsFetchingMore(false), 2000);
        }
    }, [loading, isFetchingMore, hasMore, onLoadMore]);

    // Add scroll event listeners to both window and container
    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });

        const container = tableContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let filtered = filterTasks(tasks, filters);

        const normalizedRole = userRole?.toLowerCase();
        const loggedInUser = localStorage.getItem("user-name") || "";

        // 🔒 USER ROLE FILTER (ONLY checklist + maintenance)
        if (normalizedRole === "user") {
            filtered = filtered.filter(task => {

                if (task.sourceSystem === "housekeeping") return true;

                return (
                    task.assignedTo === loggedInUser ||
                    task.doerName === loggedInUser ||
                    task.doer_name === loggedInUser ||
                    task.originalData?.assigned_to === loggedInUser
                );
            });
        }

        // Deduplicate
        const seen = new Set();
        const deduplicated = filtered.filter(task => {
            const key = `${task.sourceSystem}-${task.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sorting
        if (filters.sourceSystem === "housekeeping") {
            return sortHousekeepingTasks(deduplicated);
        }

        return sortByDate(deduplicated, true);
    }, [tasks, filters, userRole]);

    // Check if showing only housekeeping tasks
    const normalizedRole = userRole?.toLowerCase();
    const isHousekeepingOnly = useMemo(() => {
        if (filters.sourceSystem === 'housekeeping') {
            return true;
        }
        // If no source filter and all tasks are housekeeping
        if (!filters.sourceSystem && filteredTasks.length > 0) {
            return filteredTasks.every(task => task.sourceSystem === 'housekeeping');
        }
        return false;
    }, [filters.sourceSystem, filteredTasks]);

    // Check if showing only maintenance tasks
    const isMaintenanceOnly = useMemo(() => {
        if (filters.sourceSystem === 'maintenance') {
            return true;
        }
        // If no source filter and all tasks are maintenance
        if (!filters.sourceSystem && filteredTasks.length > 0) {
            return filteredTasks.every(task => task.sourceSystem === 'maintenance');
        }
        return false;
    }, [filters.sourceSystem, filteredTasks]);

    // Use all filtered tasks for infinite scroll (no client-side pagination)
    const displayTasks = filteredTasks;

    // Check if all visible items are selected
    // For housekeeping tasks: Admin selects confirmed, User selects pending
    const isUserRole = normalizedRole === 'user';
    const isAdminRole = normalizedRole === 'admin';

    const selectableTasks = displayTasks.filter(task => {
        if (task.sourceSystem === 'housekeeping') {
            const isConfirmed = task.originalData?.attachment === "confirmed" || task.confirmedByHOD === "Confirmed" || task.confirmedByHOD === "confirmed";
            // Admin: select confirmed tasks, User: select pending tasks
            return isUserRole ? !isConfirmed : isConfirmed;
        }
        return true;
    });
    const isAllSelected = selectableTasks.length > 0 && selectableTasks.every(t => selectedItems.has(t.id));
    const isIndeterminate = selectableTasks.some(t => selectedItems.has(t.id)) && !isAllSelected;

    // Has active filters
    const hasFilters = useMemo(() => {
        return Object.values(filters).some(v => v);
    }, [filters]);

    // Handlers
    const handleSelectItem = useCallback((id, isChecked) => {
        setSelectedItems(prev => {
            const newSelected = new Set(prev);
            if (isChecked) {
                newSelected.add(id);

                // Auto-set status to 'Yes' for housekeeping tasks (Admin role)
                const task = displayTasks.find(t => t.id === id);
                const isAdmin = userRole?.toLowerCase() === 'admin';
                if (isAdmin && task?.sourceSystem === 'housekeeping') {
                    setRowData(prevData => ({
                        ...prevData,
                        [id]: {
                            ...prevData[id],
                            status: 'Yes'
                        }
                    }));
                }
            } else {
                newSelected.delete(id);
                // Clean up related data when unchecking
                setRowData(prevData => {
                    const newData = { ...prevData };
                    delete newData[id];
                    return newData;
                });
                setUploadedImages(prevImages => {
                    const newImages = { ...prevImages };
                    if (newImages[id]?.previewUrl) {
                        URL.revokeObjectURL(newImages[id].previewUrl);
                    }
                    delete newImages[id];
                    return newImages;
                });
            }
            return newSelected;
        });
    }, [displayTasks, userRole]);

    const handleSelectAll = useCallback((e) => {
        const isAdmin = userRole?.toLowerCase() === 'admin';
        const isUserRole = userRole?.toLowerCase() === 'user';

        if (e.target.checked) {
            // Select all visible tasks
            // For housekeeping: Admin selects confirmed, User selects pending
            const tasksToSelect = displayTasks.filter(task => {
                if (task.sourceSystem === 'housekeeping') {
                    const isConfirmed = task.originalData?.attachment === "confirmed" || task.confirmedByHOD === "Confirmed" || task.confirmedByHOD === "confirmed";
                    return isUserRole ? !isConfirmed : isConfirmed;
                }
                // For checklist: Admin cannot select/update them here
                if (task.sourceSystem === 'checklist' && !isUserRole) {
                    return false;
                }
                return true; // Select all other tasks
            });

            const allIds = tasksToSelect.map(task => task.id);
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                allIds.forEach(id => newSet.add(id));
                return newSet;
            });

            // Auto-set status for housekeeping tasks (Admin role)
            if (isAdmin) {
                const hkTasksToSelect = tasksToSelect.filter(t => t.sourceSystem === 'housekeeping');
                if (hkTasksToSelect.length > 0) {
                    setRowData(prevData => {
                        const newData = { ...prevData };
                        hkTasksToSelect.forEach(task => {
                            newData[task.id] = {
                                ...newData[task.id],
                                status: 'Yes'
                            };
                        });
                        return newData;
                    });
                }
            }
        } else {
            // Deselect all visible tasks
            const allIds = new Set(displayTasks.map(task => task.id));
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                allIds.forEach(id => newSet.delete(id));
                return newSet;
            });
            // Clean up row data for deselected items
            allIds.forEach(id => {
                setRowData(prevData => {
                    const newData = { ...prevData };
                    delete newData[id];
                    return newData;
                });
                if (uploadedImages[id]?.previewUrl) {
                    URL.revokeObjectURL(uploadedImages[id].previewUrl);
                }
            });
        }
    }, [displayTasks, uploadedImages, userRole]);

    // Handle inline row data changes
    const handleRowDataChange = useCallback((taskId, field, value) => {
        setRowData(prev => {
            const updated = {
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    [field]: value
                }
            };

            // If HOD confirm is selected, immediately call confirm API
            if (field === "hodConfirm" && value === "Confirmed") {
                const task = filteredTasks.find(t => t.id === taskId);
                if (task && task.sourceSystem === 'housekeeping' && onHODConfirm) {
                    // Use current rowData state (before update) for the confirm call
                    const currentRowData = prev[taskId] || {};
                    onHODConfirm(taskId, {
                        remark: currentRowData.remarks || "",
                        imageFile: uploadedImages[taskId]?.file || null,
                        doerName2: currentRowData.doerName2 || ""
                    }).catch(error => {
                        console.error('HOD confirm failed:', error);
                        // Revert the selection on error
                        setRowData(prevState => ({
                            ...prevState,
                            [taskId]: {
                                ...prevState[taskId],
                                [field]: ""
                            }
                        }));
                    });
                }
            }

            return updated;
        });
    }, [filteredTasks, uploadedImages, onHODConfirm]);

    // Handle image upload
    const handleImageUpload = useCallback((taskId, file) => {
        const previewUrl = URL.createObjectURL(file);
        setUploadedImages(prev => ({
            ...prev,
            [taskId]: { file, previewUrl }
        }));
    }, []);

    // View task in drawer
    const handleViewTask = useCallback((task) => {
        setSelectedTask(task);
        setDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedTask(null);
    }, []);

    const isRowValid = useCallback((taskId) => {
        const task = filteredTasks.find(t => t.id === taskId);
        const data = rowData[taskId] || {};
        const isAdmin = userRole?.toLowerCase() === 'admin';

        // ✅ HOUSEKEEPING: allow update if doer is selected
        // For Admin: status is auto-set to 'Yes', so always valid if housekeeping
        if (task?.sourceSystem === "housekeeping") {
            if (isAdmin) return true; // Housekeeping admin submission is now just a checkbox
            if (data.doerName2 && data.doerName2.trim()) {
                return true;
            }
        }

        // Default rule: status required
        if (!data.status) return false;

        if (
            String(data.status).toLowerCase() === "no" &&
            (!data.remarks || !data.remarks.trim())
        ) {
            return false;
        }

        return true;
    }, [filteredTasks, rowData]);


    const areSelectedTasksValid = useMemo(() => {
        if (selectedItems.size === 0) return false;

        return Array.from(selectedItems).every(id => isRowValid(id));
    }, [selectedItems, isRowValid]);


    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Main submit function - matches maintenance-data-page.jsx logic
    const handleBulkSubmit = useCallback(async () => {
        const selectedItemsArray = Array.from(selectedItems);

        if (selectedItemsArray.length === 0) {
            setErrorMessage("⚠️ Please select at least one task to submit");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }

        // Validate required fields
        // For user role with pending housekeeping tasks: remarks are required (confirmHousekeepingTask)
        // For admin role: status is required (submitHousekeepingTasks)
        const userRole = localStorage.getItem("role") || "";
        const isUserRole = userRole?.toLowerCase() === 'user';

        // ✅ CHECKLIST → STATUS REQUIRED FOR BOTH USER & ADMIN
        const checklistMissingStatus = selectedItemsArray.filter(id => {
            const task = filteredTasks.find(t => t.id === id);
            if (task?.sourceSystem !== "checklist") return false;

            const status = rowData[id]?.status;
            return !status || status === "";
        });

        if (checklistMissingStatus.length > 0) {
            setErrorMessage("⚠️ Please select status (Yes/No) for all selected checklist tasks");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }


        if (isUserRole) {
            // User role: validate remarks for pending housekeeping tasks
            const housekeepingTasks = selectedItemsArray.filter(id => {
                const task = filteredTasks.find(t => t.id === id);
                return task?.sourceSystem === 'housekeeping' &&
                    task?.originalData?.attachment !== "confirmed" &&
                    task?.confirmedByHOD !== "Confirmed" &&
                    task?.confirmedByHOD !== "confirmed";
            });

            const missingRemarks = housekeepingTasks.filter(id => {
                const remark = rowData[id]?.remarks;
                return !remark || remark.trim() === "";
            });

            if (missingRemarks.length > 0) {
                setErrorMessage("⚠️ Please enter remarks for all selected pending tasks");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }

            const checklistNoTasks = selectedItemsArray.filter(id => {
                const task = filteredTasks.find(t => t.id === id);
                const status = rowData[id]?.status;
                return task?.sourceSystem === 'checklist' && status === "No";
            });

            const missingChecklistRemarks = checklistNoTasks.filter(id => {
                const remark = rowData[id]?.remarks;
                return !remark || remark.trim() === "";
            });

            if (missingChecklistRemarks.length > 0) {
                setErrorMessage("⚠️ Please add remarks when setting a checklist task to 'No'");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }
        } else {
            // Admin role: validate status for all selected tasks
            const missingStatus = selectedItemsArray.filter(id => {
                const status = rowData[id]?.status;
                return !status || status === "";
            });

            if (missingStatus.length > 0) {
                setErrorMessage("⚠️ Please select status (Yes/No) for all selected tasks");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }
        }

        // ✅ MAINTENANCE → STATUS REQUIRED (Specific check for maintenance items)
        const maintenanceItems = selectedItemsArray.filter(id => {
            const task = filteredTasks.find(t => t.id === id);
            return task?.sourceSystem === 'maintenance';
        });

        if (maintenanceItems.length > 0) {
            // Check Task Status
            const missingMaintStatus = maintenanceItems.filter(id => {
                const status = rowData[id]?.status;
                return !status || status === "";
            });

            if (missingMaintStatus.length > 0) {
                setErrorMessage("⚠️ Please select Task Status for all selected maintenance tasks");
                setTimeout(() => setErrorMessage(""), 3000);
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Prepare submission data for each task
            const submissionData = await Promise.all(
                selectedItemsArray.map(async (id) => {
                    const task = filteredTasks.find(t => t.id === id);
                    const taskRowData = rowData[id] || {};
                    const imageData = uploadedImages[id];

                    let imageBase64 = null;
                    if (imageData?.file) {
                        try {
                            imageBase64 = await fileToBase64(imageData.file);
                        } catch {
                            // Error converting image
                        }
                    }

                    return {
                        taskId: id,
                        sourceSystem: task?.sourceSystem,
                        status: taskRowData.status,
                        soundStatus: taskRowData.soundStatus || "",
                        temperature: taskRowData.temperature || "",
                        remarks: taskRowData.remarks || "",
                        doerName2: taskRowData.doerName2 || "",  // Add doerName2 for housekeeping
                        image: imageBase64,
                        imageFile: imageData?.file || null,  // Add file object for confirmHousekeepingTask API
                        originalData: task?.originalData,
                    };
                })
            );

            // Call the bulk submit handler
            if (onBulkSubmit) {
                await onBulkSubmit(submissionData);
            }

            setSuccessMessage(`✅ Successfully updated ${selectedItemsArray.length} tasks!`);

            // Reset selections
            setSelectedItems(new Set());
            setRowData({});
            Object.values(uploadedImages).forEach(img => {
                if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
            });
            setUploadedImages({});

        } catch (error) {
            setErrorMessage(`❌ Failed to update tasks: ${error.message || error}`);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                setSuccessMessage("");
                setErrorMessage("");
            }, 3000);
        }
    }, [selectedItems, rowData, uploadedImages, filteredTasks, onBulkSubmit]);

    return (
        <div className="space-y-4">
            {/* Filter Bar - Simplified */}
            <TaskFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                housekeepingDepartments={housekeepingDepartments}
                departmentOptions={departmentOptions}
                assignedToOptions={assignedToOptions}
                userRole={userRole}
                onTaskAdded={() => onRefresh && onRefresh('checklist')}
            />

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm truncate">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="ml-2 flex-shrink-0">
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 hover:text-green-700" />
                    </button>
                </div>
            )}

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm truncate">{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage("")} className="ml-2 flex-shrink-0">
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 hover:text-red-700" />
                    </button>
                </div>
            )}

            {/* Table Card */}
            <div className="w-full rounded-lg border border-blue-200 shadow-md bg-white overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 px-2 sm:px-4 py-2 sm:py-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            {/* <h2 className="text-blue-700 font-medium text-xs sm:text-sm md:text-base truncate">
                                📋 All Tasks (Checklist + Maintenance + Housekeeping)
                            </h2> */}
                            <p className="text-blue-600 font-medium text-xs sm:text-sm mt-1">
                                Showing {displayTasks.length} of {totalCount || displayTasks.length} tasks
                            </p>
                        </div>

                        {/* Only show Update button for pending tasks (not history) */}
                        {filters.status !== "Completed" && (
                            <button
                                onClick={handleBulkSubmit}
                                disabled={selectedItems.size === 0 || isSubmitting || !areSelectedTasksValid}
                                className={`w-full sm:w-auto rounded-md py-1.5 sm:py-2 px-3 sm:px-4
                                        text-white text-xs sm:text-sm font-medium whitespace-nowrap
                                        ${selectedItems.size > 0 && areSelectedTasksValid
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-300 cursor-not-allowed"
                                    }`}                            >
                                {isSubmitting ? "⏳ Processing..." : `✅ Update Selected (${selectedItems.size})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Container */}
                <div
                    ref={tableContainerRef}
                    className="w-full overflow-x-auto overflow-y-auto"
                    style={{ maxHeight: 'calc(100vh - 150px)' }}
                    onScroll={filters.status === "Completed" ? handleScroll : undefined}
                >
                    {loading && displayTasks.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-blue-600 text-xs sm:text-sm">Loading tasks from all sources...</p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full divide-y divide-gray-200" style={{ width: '100%', tableLayout: 'auto' }}>
                                <TaskTableHeader
                                    onSelectAll={handleSelectAll}
                                    isAllSelected={isAllSelected}
                                    isIndeterminate={isIndeterminate}
                                    isHistoryMode={filters.status === "Completed"}
                                    isHousekeepingOnly={isHousekeepingOnly}
                                    isMaintenanceOnly={isMaintenanceOnly}
                                    userRole={userRole}
                                />
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {displayTasks.length > 0 ? (
                                        displayTasks.map((task, index) => {
                                            const activePage = pendingPages[task.sourceSystem] || 1;
                                            return (
                                                <TaskRow
                                                    key={`${task.sourceSystem}-${task.id}-${index}`}
                                                    task={task}
                                                    isSelected={selectedItems.has(task.id)}
                                                    onSelect={handleSelectItem}
                                                    onView={handleViewTask}
                                                    rowData={rowData[task.id] || {}}
                                                    onRowDataChange={handleRowDataChange}
                                                    uploadedImage={uploadedImages[task.id]}
                                                    onImageUpload={handleImageUpload}
                                                    isHistoryMode={filters.status === "Completed"}
                                                    isHousekeepingOnly={isHousekeepingOnly}
                                                    isMaintenanceOnly={isMaintenanceOnly}
                                                    seqNo={index + 1 + (filters.status === "Pending" ? (activePage - 1) * 50 : 0)}
                                                    userRole={userRole}
                                                    onImageClick={(imageUrl) => setPreviewImage(imageUrl)}
                                                />
                                            );
                                        })
                                    ) : (
                                        <TaskTableEmpty
                                            hasFilters={hasFilters}
                                            colSpan={isHousekeepingOnly ? (isUserRole ? 10 : 13) : (isUserRole ? 14 : 16)}
                                        />
                                    )}
                                </tbody>
                            </table>
                            {/* Loading indicator at bottom for infinite scroll */}
                            {filters.status === "Completed" && isFetchingMore && (
                                <div className="bg-white border-t border-gray-200 py-3">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                        <p className="text-blue-600 text-xs mt-2">Loading more tasks...</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - Modified for pagination */}
                {displayTasks.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 sticky bottom-0 z-10">
                        {(() => {
                            const activePage = pendingPages[filters.sourceSystem] || 1;
                            const activeTotal = pendingTotals[filters.sourceSystem] || 0;
                            const isPending = filters.status === "Pending";

                            return (
                                <div className="flex flex-col space-y-3">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                        {/* Task Count Info */}
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            <span className="font-medium">
                                                {isPending
                                                    ? `${Math.min((activePage - 1) * 50 + 1, activeTotal)} - ${Math.min(activePage * 50, activeTotal)} of ${activeTotal}`
                                                    : displayTasks.length
                                                }
                                            </span> tasks
                                            {filters.status === "Completed" && hasMore && <span className="text-blue-600 ml-1">• More available (scroll to load)</span>}
                                        </div>

                                        {/* Selection Info */}
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            {selectedItems.size > 0 && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md whitespace-nowrap">
                                                    ✓ {selectedItems.size} selected
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pagination Controls - Only for Pending tab */}
                                    {isPending && activeTotal > 50 && (
                                        <div className="flex flex-wrap justify-center items-center gap-3 border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onPageChange(activePage - 1, filters.sourceSystem)}
                                                    disabled={activePage === 1 || loading}
                                                    className="px-2 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Pre
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    {(() => {
                                                        const totalPages = Math.ceil(activeTotal / 50);
                                                        const pages = [];
                                                        const maxPagesToShow = 5;

                                                        if (totalPages <= maxPagesToShow) {
                                                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                                                        } else {
                                                            if (activePage <= 3) {
                                                                for (let i = 1; i <= 4; i++) pages.push(i);
                                                                pages.push('...');
                                                                pages.push(totalPages);
                                                            } else if (activePage >= totalPages - 2) {
                                                                pages.push(1);
                                                                pages.push('...');
                                                                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                                                            } else {
                                                                pages.push(1);
                                                                pages.push('...');
                                                                for (let i = activePage - 1; i <= activePage + 1; i++) pages.push(i);
                                                                pages.push('...');
                                                                pages.push(totalPages);
                                                            }
                                                        }

                                                        return pages.map((page, idx) => (
                                                            page === '...' ? (
                                                                <span key={`ellipsis-${idx}`} className="px-1 text-gray-500 text-xs">...</span>
                                                            ) : (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => onPageChange(page, filters.sourceSystem)}
                                                                    disabled={loading}
                                                                    className={`min-w-[28px] h-8 flex items-center justify-center rounded-md text-xs font-medium transition-all ${activePage === page
                                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                                        : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            )
                                                        ));
                                                    })()}
                                                </div>

                                                <button
                                                    onClick={() => onPageChange(activePage + 1, filters.sourceSystem)}
                                                    disabled={activePage >= Math.ceil(activeTotal / 50) || loading}
                                                    className="px-2 py-1.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>

                                            {/* Go to page jump */}
                                            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                                                <span className="text-xs text-gray-500">Go to</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={Math.ceil(activeTotal / 50)}
                                                    className="w-12 h-8 text-center border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const page = parseInt(e.target.value);
                                                            const totalPages = Math.ceil(activeTotal / 50);
                                                            if (page >= 1 && page <= totalPages) {
                                                                onPageChange(page, filters.sourceSystem);
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Pg"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Task Drawer - for viewing details */}
            <TaskDrawer
                task={selectedTask}
                isOpen={drawerOpen}
                onClose={handleCloseDrawer}
                onUpdate={onUpdateTask}
                userRole={userRole}
            />

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute top-0 right-0 sm:-top-12 sm:-right-12 p-2 text-white hover:text-gray-300 transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
