"use client"

import { Filter, ChevronDown, ChevronUp, Search, Clock, Calendar, XCircle } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { fetchDashboardDataApi, getDashboardDataCount } from "../../../redux/api/dashboardApi"

export default function TaskNavigationTabs({
  dashboardType,
  taskView,
  setTaskView,
  searchQuery,
  setSearchQuery,
  filterStaff,
  setFilterStaff,
  getFrequencyColor,
  dashboardStaffFilter,
  departmentFilter,
  stats
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [displayedTasks, setDisplayedTasks] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [itemsPerPage] = useState(50)

  const getCount = (val) => (val && typeof val === 'object' ? Number(val.count || 0) : Number(val || 0));

  useEffect(() => {
    setCurrentPage(1)
    setDisplayedTasks([])
    setHasMoreData(true)
    setTotalCount(0)
  }, [taskView, dashboardType, dashboardStaffFilter, departmentFilter])

  const loadTasksFromServer = useCallback(async (page = 1, append = false) => {
    if (isLoadingMore) return;
    try {
      setIsLoadingMore(true)
      const data = await fetchDashboardDataApi(
        dashboardType,
        dashboardStaffFilter,
        page,
        itemsPerPage,
        taskView,
        departmentFilter
      )

      if (page === 1) {
        const count = await getDashboardDataCount(dashboardType, dashboardStaffFilter, taskView, departmentFilter)
        setTotalCount(typeof count === 'object' ? count.count : count)
      }

      if (!data || data.length === 0) {
        setHasMoreData(false)
        if (!append) setDisplayedTasks([])
        setIsLoadingMore(false)
        return
      }

      const processedTasks = data.map((task) => {
        const taskStartDate = parseTaskStartDate(task.task_start_date)
        const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null
        let status = "pending"
        if (completionDate || task.status === 'Yes') status = "completed"
        else if (taskStartDate && isDateInPast(taskStartDate)) status = "overdue"

        return {
          id: task.task_id,
          title: task.task_description,
          assignedTo: task.name || "Unassigned",
          taskStartDate: formatDateToDDMMYYYY(taskStartDate),
          originalTaskStartDate: task.task_start_date,
          status,
          frequency: task.frequency || "one-time",
          rating: task.color_code_for || 0,
          department: task.department || "N/A",
        }
      })

      let filteredTasks = processedTasks.filter((task) => {
        if (searchQuery && searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim()
          return (
            (task.title && task.title.toLowerCase().includes(query)) ||
            (task.id && task.id.toString().includes(query)) ||
            (task.assignedTo && task.assignedTo.toLowerCase().includes(query))
          )
        }
        return true
      })

      if (append) setDisplayedTasks(prev => [...prev, ...filteredTasks])
      else setDisplayedTasks(filteredTasks)
      setHasMoreData(data.length === itemsPerPage)
    } catch (error) {
    } finally {
      setIsLoadingMore(false)
    }
  }, [dashboardType, dashboardStaffFilter, taskView, searchQuery, departmentFilter, isLoadingMore, itemsPerPage])

  const parseTaskStartDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null
    if (dateStr.includes("-") && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parsed = new Date(dateStr)
      return isNaN(parsed) ? null : parsed
    }
    if (dateStr.includes("/")) {
      const parts = dateStr.split(" ")
      const datePart = parts[0]
      const dateComponents = datePart.split("/")
      if (dateComponents.length !== 3) return null
      const [day, month, year] = dateComponents.map(Number)
      const date = new Date(year, month - 1, day)
      if (parts.length > 1) {
        const timePart = parts[1]
        const timeComponents = timePart.split(":")
        if (timeComponents.length >= 2) {
          const [hours, minutes, seconds] = timeComponents.map(Number)
          date.setHours(hours || 0, minutes || 0, seconds || 0)
        }
      }
      return isNaN(date) ? null : date
    }
    const parsed = new Date(dateStr)
    return isNaN(parsed) ? null : parsed
  }

  const formatDateToDDMMYYYY = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return ""
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const isDateInPast = (date) => {
    if (!date || !(date instanceof Date)) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  useEffect(() => {
    loadTasksFromServer(1, false)
  }, [taskView, dashboardType, dashboardStaffFilter, departmentFilter])

  useEffect(() => {
    if (currentPage === 1) loadTasksFromServer(1, false)
  }, [searchQuery])

  useEffect(() => {
    if (dashboardStaffFilter !== "all") setFilterStaff("all")
  }, [dashboardStaffFilter])

  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadTasksFromServer(nextPage, true)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreData || isLoadingMore) return
      const tableContainer = document.querySelector('.task-table-container')
      if (!tableContainer) return
      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      if (scrollHeight - scrollTop <= clientHeight * 1.5) loadMoreData()
    }
    const tableContainer = document.querySelector('.task-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [hasMoreData, isLoadingMore, currentPage])

  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab Navigation - Extremely Compact */}
      <div className="flex border-b border-gray-100">
        {[
          { id: "recent", label: dashboardType === "delegation" ? "Today" : "Recent", icon: Clock, color: "text-[#c41e3a]", count: stats?.pendingTasks },
          { id: "upcoming", label: dashboardType === "delegation" ? "Future" : "Upcoming", icon: Calendar, color: "text-indigo-500", count: stats?.upcomingTasks },
          { id: "notdone", label: "Not Done", icon: XCircle, color: "text-zinc-500", count: stats?.notDoneTasks }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTaskView(tab.id)}
            className={`flex-1 py-3 px-1 text-center transition-all border-b-2 font-bold text-xs ${taskView === tab.id
              ? `border-[#c41e3a] ${tab.color} bg-gray-50/50`
              : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/30"
              }`}
          >
            <span className="block">{tab.label}</span>
            <span className="text-[10px] opacity-70">({getCount(tab.count)})</span>
          </button>
        ))}
      </div>

      <div className="p-3">
        {/* Search & Filter Bar - Compact */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a] outline-none transition-all"
            />
          </div>
        </div>

        {/* Filter Content */}
        {isFilterExpanded && (
          <div className="mb-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex flex-wrap gap-1.5">
              <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 w-full tracking-wider">Applied</div>
              {dashboardStaffFilter !== "all" && (
                <span className="px-2 py-0.5 bg-white border border-red-100 text-[#c41e3a] rounded text-[9px] font-bold shadow-sm">
                  Staff: {dashboardStaffFilter}
                </span>
              )}
              {departmentFilter !== "all" && (
                <span className="px-2 py-0.5 bg-white border border-emerald-100 text-emerald-600 rounded text-[9px] font-bold shadow-sm">
                  Dept: {departmentFilter}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-white border border-blue-100 text-blue-600 rounded text-[9px] font-bold shadow-sm">
                  Query: {searchQuery}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table Section - Extremely Compact */}
        {displayedTasks.length === 0 && !isLoadingMore ? (
          <div className="text-center py-8 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Empty View</p>
          </div>
        ) : (
          <div className="task-table-container overflow-x-auto border border-gray-100 rounded-lg" style={{ maxHeight: "300px" }}>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#c41e3a] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">#</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Task</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">User</th>
                  {dashboardType === "checklist" && (
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Dept</th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">Start</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">Freq</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {displayedTasks.map((task, index) => (
                  <tr key={`${task.id}-${task.taskStartDate}`} className="hover:bg-red-50/10 transition-colors">
                    <td className="px-3 py-2 text-[13px] font-bold text-gray-600">{index + 1}</td>
                    <td className="px-3 py-2 text-[13px] font-bold text-gray-600">{task.id}</td>
                    <td className="px-3 py-2 text-[13px] text-gray-700 font-medium truncate max-w-[200px]">{task.title}</td>
                    <td className="px-3 py-2 text-[13px] text-gray-700 font-medium truncate max-w-[200px]">{task.assignedTo}</td>
                    {dashboardType === "checklist" && (
                      <td className="px-3 py-2 text-xs font-bold text-indigo-600">{task.department}</td>
                    )}
                    <td className="px-3 py-2 text-[13px] text-gray-600">{task.taskStartDate}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${getFrequencyColor(task.frequency)} text-white`}>
                        {task.frequency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoadingMore && (
              <div className="p-2 text-center">
                <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-[#c41e3a] border-r-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
