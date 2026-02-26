"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchStaffTasksDataApi, getStaffTasksCountApi } from "../../../redux/api/dashboardApi"

export default function StaffTasksTable({
  dashboardType,
  dashboardStaffFilter,
  departmentFilter,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [staffMembers, setStaffMembers] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalStaffCount, setTotalStaffCount] = useState(0)
  const [selectedMonthYear, setSelectedMonthYear] = useState("")
  const [monthYearOptions, setMonthYearOptions] = useState([])
  const itemsPerPage = 20

  // Generate month-year options (last 12 months + current month)
  const generateMonthYearOptions = useCallback(() => {
    const options = []
    const today = new Date()
    const currentMonth = today.getMonth() // 0-11
    const currentYear = today.getFullYear()

    // Add current month as default
    const currentMonthYear = `${today.toLocaleString('default', { month: 'long' })} ${currentYear}`

    // Generate options for only last month and current month
    for (let i = 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const monthName = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const monthYear = `${monthName} ${year}`

      options.push({
        value: `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        label: monthYear,
        isCurrent: i === 0 // Current month
      })
    }

    setMonthYearOptions(options)

    // Set default selection to current month
    if (options.length > 0 && !selectedMonthYear) {
      const currentOption = options.find(opt => opt.isCurrent)
      if (currentOption) {
        setSelectedMonthYear(currentOption.value)
      }
    }
  }, [selectedMonthYear])

  useEffect(() => {
    generateMonthYearOptions()
  }, [generateMonthYearOptions])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setStaffMembers([])
    setHasMoreData(true)
    setTotalStaffCount(0)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear])

  // Function to load staff data from server
  const loadStaffData = useCallback(async (page = 1, append = false) => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true)

      // Fetch staff data with their task summaries
      const data = await fetchStaffTasksDataApi(
        dashboardType,
        dashboardStaffFilter,
        page,
        itemsPerPage,
        selectedMonthYear, // Pass monthYear parameter
        departmentFilter // Pass departmentFilter
      )

      // Get total counts for both staff with tasks and total users
      if (page === 1) {
        const staffCount = await getStaffTasksCountApi(dashboardType, dashboardStaffFilter, departmentFilter);
        setTotalStaffCount(staffCount)
      }

      if (!data || data.length === 0) {
        setHasMoreData(false)
        if (!append) {
          setStaffMembers([])
        }
        setIsLoadingMore(false)
        return
      }

      // Filter data by selected month-year if specified
      let filteredData = data
      if (selectedMonthYear) {
        const [year, month] = selectedMonthYear.split('-').map(Number)
        filteredData = data.filter(staff => {
          // This is a placeholder - you'll need actual task dates for each staff
          // You might need to modify your API to accept month-year filter
          return true // Filter logic will go here
        })
      }

      if (append) {
        setStaffMembers(prev => [...prev, ...filteredData])
      } else {
        setStaffMembers(filteredData)
      }

      // Check if we have more data
      setHasMoreData(data.length === itemsPerPage)

    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [dashboardType, dashboardStaffFilter, departmentFilter, isLoadingMore, selectedMonthYear])

  // Initial load when component mounts or dependencies change
  useEffect(() => {
    loadStaffData(1, false)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear])

  // Function to load more data when scrolling
  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadStaffData(nextPage, true)
    }
  }

  // Handle scroll event for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreData || isLoadingMore) return

      const tableContainer = document.querySelector('.staff-table-container')
      if (!tableContainer) return

      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2

      if (isNearBottom) {
        loadMoreData()
      }
    }

    const tableContainer = document.querySelector('.staff-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [hasMoreData, isLoadingMore, currentPage])

  // Format on-time score with color coding
  const renderOnTimeScore = (score) => {
    let bgColor = "bg-red-100"
    let textColor = "text-red-800"

    if (score >= 80) {
      bgColor = "bg-green-100"
      textColor = "text-green-800"
    } else if (score >= 0) {
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
    }

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {score}%
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Show total count and active filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
        <div className="flex flex-col space-y-2">
          {/* Month-Year Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="monthYearFilter" className="text-sm font-medium text-gray-700">
              Filter by Month:
            </label>
            <select
              id="monthYearFilter"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Months</option>
              {monthYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.isCurrent && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          {totalStaffCount > 0 && (
            <div className="text-sm text-gray-600">
              Total Records: {totalStaffCount} | Showing: {staffMembers.length}
            </div>
          )}
        </div>

        {/* Show active filters */}
        <div className="flex flex-wrap gap-2">
          {dashboardStaffFilter !== "all" && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Staff: {dashboardStaffFilter}
            </span>
          )}
          {departmentFilter !== "all" && dashboardType === "checklist" && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              Dept Filter: {departmentFilter}
            </span>
          )}
          {selectedMonthYear && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              Month: {monthYearOptions.find(opt => opt.value === selectedMonthYear)?.label || selectedMonthYear}
            </span>
          )}
        </div>
      </div>

      {staffMembers.length === 0 && !isLoadingMore ? (
        <div className="text-center p-8 text-gray-500">
          <p>No staff data found for the selected filters.</p>
          {selectedMonthYear && (
            <p className="text-sm mt-2">Try selecting "All Months" to see more results.</p>
          )}
          {dashboardStaffFilter !== "all" && (
            <p className="text-sm mt-2">Try selecting "All Staff Members" to see more results.</p>
          )}
        </div>
      ) : (
        <div
          className="staff-table-container overflow-hidden rounded-lg border border-gray-100"
          style={{ maxHeight: "450px", overflowY: "auto" }}
        >
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#c41e3a] sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">#</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">Dept</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">Done</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-tight">On Time</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-tight">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {staffMembers.map((staff, index) => (
                  <tr key={`${staff.name}-${index}`} className="hover:bg-red-50/5 transition-colors border-l-2 border-transparent hover:border-[#c41e3a]">
                    <td className="px-3 py-2 text-[13px] font-bold text-gray-600">{index + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-[13px] font-bold text-gray-800">{staff.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{staff.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter">{staff.department || "N/A"}</div>
                    </td>
                    <td className="px-3 py-2 text-[13px] font-bold text-blue-600">{staff.totalTasks}</td>
                    <td className="px-3 py-2 text-[13px] font-bold text-emerald-600">{staff.completedTasks}</td>
                    <td className="px-3 py-2 text-[13px] font-bold text-gray-600">
                      {staff.doneOnTime || 0}
                      {staff.completedTasks > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1 font-medium">
                          ({Math.round((staff.doneOnTime / staff.completedTasks) * 100)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {renderOnTimeScore(staff.onTimeScore || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-2 bg-gray-50/50 p-2">
            {staffMembers.map((staff, index) => (
              <div key={`${staff.name}-${index}`} className="p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-[#c41e3a] transition-all active:scale-[0.98]">
                <div className="flex items-start gap-2 mb-2">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-[#c41e3a]/10 text-[#c41e3a] text-[10px] font-black rounded-md border border-[#c41e3a]/20">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-[14px] font-bold text-gray-800 leading-tight">{staff.name}</h4>
                      {renderOnTimeScore(staff.onTimeScore || 0)}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter mt-0.5">
                      {staff.department || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pl-7">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Total</span>
                    <span className="text-[12px] font-black text-blue-600">{staff.totalTasks}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Done</span>
                    <span className="text-[12px] font-black text-emerald-600">{staff.completedTasks}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">On Time</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[12px] font-black text-gray-700">{staff.doneOnTime || 0}</span>
                      {staff.completedTasks > 0 && (
                        <span className="text-[9px] text-gray-400 font-bold">
                          {Math.round((staff.doneOnTime / staff.completedTasks) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoadingMore && (
            <div className="text-center py-4 bg-gray-50/50">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-solid border-[#c41e3a] border-r-transparent"></div>
              <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase">Loading more...</p>
            </div>
          )}

          {!hasMoreData && staffMembers.length > 0 && (
            <div className="text-center py-4 text-[11px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50">
              End of list
            </div>
          )}
        </div>
      )}
    </div>
  )
}