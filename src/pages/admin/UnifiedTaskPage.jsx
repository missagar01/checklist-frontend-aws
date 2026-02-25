"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import UnifiedTaskTable from "../../components/unified/UnifiedTaskTable"
import { useDispatch, useSelector } from "react-redux"
import { checklistData, checklistHistoryData, submitChecklistUserStatus, fetchChecklistDepartments, fetchChecklistDoers } from "../../redux/slice/checklistSlice"
import {
    fetchPendingMaintenanceTasks,
    fetchCompletedMaintenanceTasks,
    fetchUniqueMachineNames,
    fetchUniqueAssignedPersonnel,
    fetchMaintenanceDepartments,
    fetchMaintenanceDoers
} from "../../redux/slice/maintenanceSlice"
import { normalizeAllTasks, sortHousekeepingTasks } from "../../utils/taskNormalizer"
import { updateMultipleMaintenanceTasks } from "../../redux/slice/maintenanceSlice"
import {
    fetchHousekeepingPendingTasks,
    fetchHousekeepingHistoryTasks,
    submitHousekeepingTasks,
    confirmHousekeepingTask,
    fetchHousekeepingDepartments,
} from "../../redux/slice/housekeepingSlice"


/**
 * UnifiedTaskPage - Main page component for unified task management
 * Fetches and merges data from Checklist, Maintenance, and Housekeeping systems
 */



export default function UnifiedTaskPage() {
    // State
    const [userRole, setUserRole] = useState("")
    const [username, setUsername] = useState("")
    const [systemAccess, setSystemAccess] = useState([]) // New state for system access
    const [activeStatus, setActiveStatus] = useState("Pending") // NEW: Track status in parent

    const dispatch = useDispatch()

    // Redux selectors
    const checklistState = useSelector((state) => state.checkList)
    const maintenanceState = useSelector((state) => state.maintenance)
    const housekeepingState = useSelector((state) => state.housekeeping)

    // Destructure variables from redux state - ADD THIS SECTION
    const {
        checklist = [],
        history: checklistHistory = [],
        historyTotal: checklistHistoryTotal = 0,
        historyHasMore: checklistHistoryHasMore = false,
        historyCurrentPage: checklistHistoryCurrentPage = 1,
        loading: checklistLoading,
        hasMore: checklistHasMore = false,
        currentPage: checklistCurrentPage = 1,
        pendingTotal: checklistPendingTotal = 0,
        departments: checklistDepartments = [],
        doers: checklistDoers = [],
    } = checklistState || {}

    const {
        tasks: maintenanceTasks = [],
        history: maintenanceHistory = [],
        historyTotal: maintenanceHistoryTotal = 0,
        hasMoreHistory: maintenanceHistoryHasMore = false,
        currentPageHistory: maintenanceHistoryCurrentPage = 1,
        loading: maintenanceLoading,
        assignedPersonnel = [],
        departments: maintenanceDepartments = [], // New
        doers: maintenanceDoers = [],              // New
        currentPage: maintenanceCurrentPage = 1,
        pendingTotal: maintenancePendingTotal = 0,
        hasMore: maintenanceHasMore = false,
    } = maintenanceState || {}

    const {
        pendingTasks: housekeepingTasks = [],
        historyTasks: housekeepingHistory = [],
        historyTotal: housekeepingHistoryTotal = 0,
        loading: housekeepingLoading,
        error: housekeepingError,
        pendingPage: housekeepingPendingPage = 1,
        pendingTotal: housekeepingPendingTotal = 0,
        pendingHasMore: housekeepingPendingHasMore = false,
        historyPage: housekeepingHistoryPage = 1,
        historyHasMore: housekeepingHistoryHasMore = false,
        dashboardDepartments: housekeepingDepartments = [],
    } = housekeepingState || {}

    // Load user info
    useEffect(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")
        const access = (localStorage.getItem("system_access") || "")
            .split(',')
            .map(item => item.trim().toLowerCase())
            .filter(Boolean)

        setUserRole(role || "")
        setUsername(user || "")
        setSystemAccess(access)
    }, [])

    // Function to check if user has access to a system
    const hasSystemAccess = useCallback((system) => {
        if (systemAccess.length === 0) return true; // If no restriction, allow all
        return systemAccess.includes(system.toLowerCase());
    }, [systemAccess])

    // Update loadHousekeepingData function to respect system_access
    // Backend now uses query params for department filtering (no token required)
    const loadHousekeepingData = useCallback(async () => {
        // Check if user has housekeeping access
        if (!hasSystemAccess('housekeeping') && systemAccess.length > 0) {
            return
        }

        // Pass department filter from user_access1 in query params
        const filters = {}
        const role = localStorage.getItem("role")
        if (role?.toLowerCase() === "user") {
            // Use user_access1 for housekeeping, fallback to user_access
            const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
            const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
            const accessToUse = userAccess1 || userAccess
            if (accessToUse) {
                // Pass department as query param (comma-separated)
                filters.department = accessToUse
            }
        }
        await dispatch(fetchHousekeepingPendingTasks({ page: 1, filters })).unwrap()
    }, [hasSystemAccess, systemAccess, dispatch])

    // Load housekeeping history data
    // Backend now uses query params for department filtering (no token required)
    const loadHousekeepingHistoryData = useCallback(async () => {
        // Pass department filter from user_access1 in query params
        const filters = {}
        const role = localStorage.getItem("role")
        if (role?.toLowerCase() === "user") {
            // Use user_access1 for housekeeping, fallback to user_access
            const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
            const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
            const accessToUse = userAccess1 || userAccess
            if (accessToUse) {
                // Pass department as query param (comma-separated)
                filters.department = accessToUse
            }
        }
        await dispatch(fetchHousekeepingHistoryTasks({ page: 1, filters })).unwrap()
    }, [dispatch])

    // Combine loading states
    const isLoading = checklistLoading || maintenanceLoading || housekeepingLoading

    // Load all data sources (pending + history) based on system_access
    useEffect(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        // Load checklist data only if user has access
        if (hasSystemAccess('checklist') || systemAccess.length === 0) {
            dispatch(checklistData(1))
            dispatch(checklistHistoryData(1))
            dispatch(fetchChecklistDepartments())
            dispatch(fetchChecklistDoers())
        }

        // Load maintenance data only if user has access
        if (hasSystemAccess('maintenance') || systemAccess.length === 0) {
            dispatch(fetchPendingMaintenanceTasks({
                page: 1,
                userId: role === "user" ? user : null
            }))
            dispatch(fetchCompletedMaintenanceTasks({ page: 1, filters: {}, userId: role === "user" ? user : null }))
            dispatch(fetchUniqueMachineNames())
            dispatch(fetchUniqueAssignedPersonnel())
            dispatch(fetchMaintenanceDepartments()) // New
            dispatch(fetchMaintenanceDoers())       // New
        }

        // Load housekeeping data only if user has access
        if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
            loadHousekeepingData()
            loadHousekeepingHistoryData()
            dispatch(fetchHousekeepingDepartments())
        }
    }, [dispatch, hasSystemAccess, systemAccess, loadHousekeepingData, loadHousekeepingHistoryData])

    // Callback to load more checklist data (called on scroll)
    const loadMoreChecklistData = useCallback(() => {
        if (activeStatus === 'Completed') {
            if (checklistHistoryHasMore && !checklistLoading) {
                dispatch(checklistHistoryData(checklistHistoryCurrentPage + 1))
            }
        }
    }, [checklistHistoryHasMore, checklistLoading, checklistHistoryCurrentPage, activeStatus, dispatch])

    // Callback to load more housekeeping data (called on scroll)
    const loadMoreHousekeepingData = useCallback(async () => {
        if (activeStatus === 'Completed') {
            if (housekeepingHistoryHasMore && !housekeepingLoading) {
                dispatch(fetchHousekeepingHistoryTasks({ page: housekeepingHistoryPage + 1 }))
            }
        }
    }, [housekeepingHistoryHasMore, housekeepingHistoryPage, housekeepingLoading, activeStatus, dispatch])

    // Callback to load more maintenance data (called on scroll)
    const loadMoreMaintenanceData = useCallback(() => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        if (activeStatus === 'Completed') {
            if (maintenanceHistoryHasMore && !maintenanceLoading) {
                dispatch(fetchCompletedMaintenanceTasks({
                    page: maintenanceHistoryCurrentPage + 1,
                    filters: {},
                    userId: role === "user" ? user : null
                }))
            }
        }
    }, [maintenanceHistoryHasMore, maintenanceHistoryCurrentPage, maintenanceLoading, activeStatus, dispatch])

    // Normalize and merge all tasks - filter based on system_access
    const allTasks = useMemo(() => {
        // Filter checklist tasks based on access
        const checklistFiltered = hasSystemAccess('checklist') || systemAccess.length === 0
            ? (Array.isArray(checklist) ? checklist : [])
            : []

        const checklistHistoryFiltered = hasSystemAccess('checklist') || systemAccess.length === 0
            ? (Array.isArray(checklistHistory) ? checklistHistory : [])
            : []

        // Filter maintenance tasks based on access
        // Also filter out tasks that already have an actual_date (as per user request for pending screen)
        const maintenanceFiltered = hasSystemAccess('maintenance') || systemAccess.length === 0
            ? (Array.isArray(maintenanceTasks) ? maintenanceTasks : [])
            : []

        const maintenanceHistoryFiltered = hasSystemAccess('maintenance') || systemAccess.length === 0
            ? (Array.isArray(maintenanceHistory) ? maintenanceHistory : [])
            : []

        // Filter housekeeping tasks based on access and user_access departments
        let housekeepingFiltered = []
        let housekeepingHistoryFiltered = []

        if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
            const allHousekeepingTasks = Array.isArray(housekeepingTasks) ? housekeepingTasks : []
            const allHousekeepingHistory = Array.isArray(housekeepingHistory) ? housekeepingHistory : []

            // Get current role from localStorage (stable value)
            const currentRole = localStorage.getItem("role") || ""

            // For user role, filter by user_access1 departments (for housekeeping)
            if (currentRole?.toLowerCase() === "user") {
                // Use user_access1 for housekeeping, fallback to user_access
                const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
                const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
                const accessToUse = userAccess1 || userAccess

                if (accessToUse) {
                    // Parse departments (comma-separated)
                    const userDepartments = accessToUse.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)

                    // Filter tasks to only show those matching user's departments
                    // Match exact or normalized match (case-insensitive, space-normalized)
                    const normalizeDept = (dept) => dept.replace(/\s+/g, ' ').trim().toLowerCase()

                    housekeepingFiltered = allHousekeepingTasks.filter(task => {
                        const taskDept = normalizeDept(task.department || '')
                        if (!taskDept) return false
                        return userDepartments.some(userDept => {
                            const normalizedUserDept = normalizeDept(userDept)
                            // Exact match
                            if (taskDept === normalizedUserDept) return true
                            // Partial match - task department contains user department or vice versa
                            if (taskDept.includes(normalizedUserDept) || normalizedUserDept.includes(taskDept)) return true
                            return false
                        })
                    })

                    housekeepingHistoryFiltered = allHousekeepingHistory.filter(task => {
                        const taskDept = normalizeDept(task.department || '')
                        if (!taskDept) return false
                        return userDepartments.some(userDept => {
                            const normalizedUserDept = normalizeDept(userDept)
                            // Exact match
                            if (taskDept === normalizedUserDept) return true
                            // Partial match - task department contains user department or vice versa
                            if (taskDept.includes(normalizedUserDept) || normalizedUserDept.includes(taskDept)) return true
                            return false
                        })
                    })
                } else {
                    // No user_access1 or user_access, show nothing for user role
                    housekeepingFiltered = []
                    housekeepingHistoryFiltered = []
                }
            } else {
                // Admin role - show all housekeeping tasks
                housekeepingFiltered = allHousekeepingTasks
                housekeepingHistoryFiltered = allHousekeepingHistory
            }
        }

        // Combine pending tasks from all accessible sources
        const pendingTasks = normalizeAllTasks(
            checklistFiltered,
            maintenanceFiltered,
            housekeepingFiltered
        )

        // Combine history tasks from all accessible sources
        const historyTasks = normalizeAllTasks(
            checklistHistoryFiltered,
            maintenanceHistoryFiltered,
            housekeepingHistoryFiltered,
            true // isHistory flag
        )

        // Combine all tasks (pending + history)
        // Deduplicate: if a task appears in both pending and history, prefer history version
        const taskMap = new Map()

        // First add pending tasks
        pendingTasks.forEach(task => {
            const key = `${task.sourceSystem}-${task.id}`
            taskMap.set(key, task)
        })

        // Then add history tasks (will overwrite pending if duplicate)
        historyTasks.forEach(task => {
            const key = `${task.sourceSystem}-${task.id}`
            taskMap.set(key, task)
        })

        const allCombined = Array.from(taskMap.values())

        // Sort housekeeping tasks: confirmed first
        return sortHousekeepingTasks(allCombined)
    }, [
        checklist,
        checklistHistory,
        maintenanceTasks,
        maintenanceHistory,
        housekeepingTasks,
        housekeepingHistory,
        hasSystemAccess,
        systemAccess
    ])

    // Get unique assignees from all sources
    const allAssignees = useMemo(() => {
        const assigneesSet = new Set()

        // From maintenance
        assignedPersonnel.forEach(p => assigneesSet.add(p))
        maintenanceDoers.forEach(d => assigneesSet.add(d)) // New

        // From checklist (fetched from API)
        checklistDoers.forEach(d => assigneesSet.add(d))

        // From all tasks
        allTasks.forEach(task => {
            if (task.assignedTo && task.assignedTo !== '—') {
                assigneesSet.add(task.assignedTo)
            }
        })

        return Array.from(assigneesSet).filter(Boolean).sort()
    }, [allTasks, assignedPersonnel, checklistDoers, maintenanceDoers])

    // Get unique departments from all sources
    const allDepartments = useMemo(() => {
        const departmentsSet = new Set()

        // From checklist (fetched from API)
        checklistDepartments.forEach(d => departmentsSet.add(d))

        // From maintenance (fetched from API)
        maintenanceDepartments.forEach(d => departmentsSet.add(d)) // New

        allTasks.forEach(task => {
            if (task.department && task.department !== '—') {
                departmentsSet.add(task.department)
            }
        })

        return Array.from(departmentsSet).filter(Boolean).sort()
    }, [allTasks, checklistDepartments, maintenanceDepartments])

    // Handle HOD confirm for housekeeping tasks
    const handleHODConfirm = useCallback(async (taskId, { remark = "", imageFile = null, doerName2 = "" }) => {
        try {
            const payload = {
                taskId,
                remark,
                imageFile,
                doerName2,
            };

            // Only send hod if remark or image is present
            if (remark || imageFile) {
                payload.hod = username;
            }

            await dispatch(confirmHousekeepingTask(payload)).unwrap()

            // Refresh housekeeping data after confirm
            await loadHousekeepingData()
        } catch (error) {
            console.error('HOD confirm failed:', error)
            throw error
        }
    }, [dispatch, loadHousekeepingData])

    // Handle task update
    const handleUpdateTask = useCallback(async (updateData) => {
        const { taskId, sourceSystem, status, remarks, image, originalData } = updateData

        switch (sourceSystem) {

            case 'checklist': {
                const normalizedRole = userRole?.toLowerCase();
                if (normalizedRole === 'user') {
                    await dispatch(submitChecklistUserStatus([{
                        taskId,
                        remark: remarks || '',   // ✅ only remark
                        status: status,
                    }])).unwrap();
                    dispatch(checklistData(1))
                }
                break
            }

            case 'maintenance':
                await dispatch(updateMultipleMaintenanceTasks([{
                    taskId,
                    status,
                    remarks,
                    image: image ? await fileToBase64(image) : null,
                }])).unwrap()
                dispatch(fetchPendingMaintenanceTasks({
                    page: 1,
                    userId: userRole === "user" ? username : null
                }))
                break

            case 'housekeeping': {
                const payload = {
                    task_id: taskId,
                    status,
                    remark: remarks,
                    doer_name2: updateData.doerName2 || '',
                    attachment: originalData?.attachment,
                };

                // Only send hod if remark or specialized update (like image/attachment) is present
                if (remarks || updateData.imageFile || updateData.image) {
                    payload.hod = username;
                }

                await dispatch(submitHousekeepingTasks([payload])).unwrap();
                await loadHousekeepingData();
                break;
            }

            default:
                throw new Error(`Unknown source system: ${sourceSystem}`)
        }
    }, [dispatch, userRole, username, loadHousekeepingData])

    // Handle bulk submit - receives data from UnifiedTaskTable inline editing
    const handleBulkSubmit = useCallback(async (submissionData) => {
        // submissionData is array of: { taskId, sourceSystem, status, soundStatus, temperature, remarks, image, originalData }

        // Group tasks by source system
        const tasksBySource = {
            checklist: [],
            maintenance: [],
            housekeeping: [],
        }

        submissionData.forEach(task => {
            tasksBySource[task.sourceSystem]?.push(task)
        })

        const checklistPromise = (() => {
            if (tasksBySource.checklist.length === 0) {
                return Promise.resolve();
            }

            const normalizedRole = userRole?.toLowerCase();
            const isChecklistUser = normalizedRole === "user";

            if (isChecklistUser) {
                const payload = tasksBySource.checklist.map((t) => ({
                    taskId: t.taskId,
                    remark: t.remarks || "",   // ✅ only remark
                    status: t.status,
                }));
                return dispatch(submitChecklistUserStatus(payload)).unwrap();
            }


            return Promise.resolve();
        })();

        const results = await Promise.allSettled([
            checklistPromise,

            // Update maintenance tasks - with all fields
            tasksBySource.maintenance.length > 0
                ? dispatch(updateMultipleMaintenanceTasks(
                    tasksBySource.maintenance.map(t => ({
                        taskId: t.taskId,
                        status: t.status,
                        sound_status: t.soundStatus || '',
                        temperature_status: t.temperature || '',
                        remarks: t.remarks || '',
                        image: t.image,
                        actual_date: t.status === 'Yes'
                            ? new Date().toISOString().split('T')[0]
                            : null
                    }))
                )).unwrap()
                : Promise.resolve(),

            // Update housekeeping tasks
            // User role: use confirmHousekeepingTask for pending tasks
            // Admin role: use submitHousekeepingTasks for confirmed tasks
            tasksBySource.housekeeping.length > 0
                ? Promise.all(
                    tasksBySource.housekeeping.map(async (t) => {
                        // Check if task is pending using originalData from submission
                        const isPending = t.originalData?.attachment !== "confirmed" &&
                            t.originalData?.confirmedByHOD !== "Confirmed" &&
                            t.originalData?.confirmedByHOD !== "confirmed";

                        if (userRole?.toLowerCase() === 'user' && isPending) {
                            const payload = {
                                taskId: t.taskId,
                                remark: t.remarks || '',
                                imageFile: t.imageFile || null,
                                doerName2: t.doerName2 || '',
                            };

                            // Only send hod if remark or image is present
                            if (t.remarks || t.imageFile || t.image) {
                                payload.hod = username;
                            }

                            return dispatch(confirmHousekeepingTask(payload)).unwrap();
                        } else {
                            // Admin role: use submitHousekeepingTasks API for confirmed tasks
                            const payload = {
                                task_id: t.taskId,
                                status: t.status,
                                remark: t.remarks || '',
                                doer_name2: t.doerName2 || '',
                                attachment: t.originalData?.attachment,
                            };

                            // Only send hod if remark or image is present
                            if (t.remarks || t.image || t.imageFile) {
                                payload.hod = username;
                            }

                            return dispatch(submitHousekeepingTasks([payload])).unwrap();
                        }
                    })
                )
                : Promise.resolve(),
        ])

        // Refresh all data
        dispatch(checklistData(1))
        dispatch(fetchPendingMaintenanceTasks({
            page: 1,
            userId: userRole === "user" ? username : null
        }))
        await loadHousekeepingData()

        // Check for errors
        const errors = results.filter(r => r.status === 'rejected')
        if (errors.length > 0) {
            throw new Error(`${errors.length} update(s) failed`)
        }
    }, [dispatch, userRole, username, loadHousekeepingData])

    // File to base64 helper
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = (error) => reject(error)
        })
    }

    // Handle page change for pagination
    const handlePageChange = useCallback(async (page, sourceSystem) => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        switch (sourceSystem) {
            case 'checklist':
                dispatch(checklistData({ page, replace: true }))
                break;
            case 'maintenance':
                dispatch(fetchPendingMaintenanceTasks({
                    page,
                    userId: role === "user" ? user : null,
                    replace: true
                }))
                break;
            case 'housekeeping': {
                const filters = {}
                if (role?.toLowerCase() === "user") {
                    const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
                    const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
                    const accessToUse = userAccess1 || userAccess
                    if (accessToUse) filters.department = accessToUse
                }
                dispatch(fetchHousekeepingPendingTasks({ page, filters, replace: true }))
                break;
            }
            default:
                break;
        }
    }, [dispatch])

    // Handle refresh based on system
    const handleRefresh = useCallback((system) => {
        const role = localStorage.getItem("role")
        const user = localStorage.getItem("user-name")

        switch (system) {
            case 'checklist':
                if (hasSystemAccess('checklist') || systemAccess.length === 0) {
                    dispatch(checklistData({ page: 1, replace: true }))
                    dispatch(fetchChecklistDepartments())
                    dispatch(fetchChecklistDoers())
                }
                break;
            case 'maintenance':
                if (hasSystemAccess('maintenance') || systemAccess.length === 0) {
                    dispatch(fetchPendingMaintenanceTasks({
                        page: 1,
                        userId: role === "user" ? user : null,
                        replace: true
                    }))
                    dispatch(fetchMaintenanceDepartments())
                    dispatch(fetchMaintenanceDoers())
                }
                break;
            case 'housekeeping':
                if (hasSystemAccess('housekeeping') || systemAccess.length === 0) {
                    const filters = {}
                    if (role?.toLowerCase() === "user") {
                        const userAccess1 = localStorage.getItem("user_access1") || localStorage.getItem("userAccess1") || ""
                        const userAccess = localStorage.getItem("user_access") || localStorage.getItem("userAccess") || ""
                        const accessToUse = userAccess1 || userAccess
                        if (accessToUse) filters.department = accessToUse
                    }
                    dispatch(fetchHousekeepingPendingTasks({ page: 1, filters, replace: true }))
                    dispatch(fetchHousekeepingDepartments())
                }
                break;
            default:
                break;
        }
    }, [dispatch, hasSystemAccess, systemAccess, username])

    return (
        <AdminLayout>
            <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-0">
                {/* Header
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-blue-700">
                        Unified Task Management
                    </h1>
                </div>
                 */}

                {/* Error Display */}
                {housekeepingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-2 sm:px-4 py-2 sm:py-3 rounded-md text-xs sm:text-sm">
                        Housekeeping data error: {housekeepingError}
                    </div>
                )}

                {/* Unified Task Table */}
                <UnifiedTaskTable
                    tasks={allTasks}
                    loading={isLoading}
                    onUpdateTask={handleUpdateTask}
                    onBulkSubmit={handleBulkSubmit}
                    onHODConfirm={handleHODConfirm}

                    // Pass specific lists instead of merged ones
                    checklistDepartments={checklistDepartments}
                    checklistDoers={checklistDoers}
                    maintenanceDepartments={maintenanceDepartments}
                    maintenanceDoers={maintenanceDoers}

                    housekeepingDepartments={housekeepingDepartments}
                    userRole={userRole}
                    onLoadMore={() => {
                        loadMoreChecklistData()
                        loadMoreHousekeepingData()
                        loadMoreMaintenanceData()
                    }}
                    hasMore={
                        activeStatus === 'Completed' &&
                        (checklistHistoryHasMore || maintenanceHistoryHasMore || housekeepingHistoryHasMore)
                    }
                    totalCount={(() => {
                        // Return total count based on source system for Pending
                        if (activeStatus === 'Completed') return 0; // Pagination not used for history

                        // We need to know which system is selected in the table's filter
                        // This info is inside UnifiedTaskTable. We'll pass all totals
                        // and UnifiedTaskTable can decide, OR we use the fact that it's often 
                        // filtered by source system.

                        // Since UnifiedTaskPage doesn't know the table's internal filter state easily,
                        // we can pass a combined total or update UnifiedTaskTable to handle multiple totals.
                        // Actually, looking at UnifiedTaskTable, it has a filters.sourceSystem state.

                        // Let's pass the totals as an object and have the table select the right one.
                        // Wait, I already added totalCount as a number prop to UnifiedTaskTable.

                        // Let's pass all totals and current pages and let the table handle it, 
                        // but wait, I can just pass the total based on what I HAVE here.

                        // Actually, I'll pass a single totalCount and currentPage and update them 
                        // when the status/source changes in the table.
                        return activeStatus === 'Pending' ? Math.max(checklistPendingTotal, maintenancePendingTotal, housekeepingPendingTotal) : 0;
                    })()}
                    // Better approach: pass an object of counts
                    pendingTotals={{
                        checklist: checklistPendingTotal,
                        maintenance: maintenancePendingTotal,
                        housekeeping: housekeepingPendingTotal
                    }}
                    pendingPages={{
                        checklist: checklistCurrentPage,
                        maintenance: maintenanceCurrentPage,
                        housekeeping: housekeepingPendingPage
                    }}
                    onPageChange={handlePageChange}
                    checklistHistoryTotal={Number(checklistHistoryTotal)}
                    maintenanceHistoryTotal={Number(maintenanceHistoryTotal)}
                    housekeepingHistoryTotal={Number(housekeepingHistoryTotal)}
                    onRefresh={handleRefresh}
                    onStatusChange={setActiveStatus} // NEW: Sync status
                />
            </div>
        </AdminLayout>
    )
}
