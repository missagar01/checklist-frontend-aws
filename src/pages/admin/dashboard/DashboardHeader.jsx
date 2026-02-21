"use client"

import { useState, useEffect } from "react"
import { getTotalUsersCountApi } from "../../../redux/api/dashboardApi"

export default function DashboardHeader({
  dashboardType,
  setDashboardType,
  dashboardStaffFilter,
  setDashboardStaffFilter,
  availableStaff,
  userRole,
  username,
  departmentFilter,
  setDepartmentFilter,
  availableDepartments,
  isLoadingMore,
  onDateRangeChange // Add this prop to handle date range selection
}) {
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch total users count
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const count = await getTotalUsersCountApi()
        setTotalUsersCount(count)
      } catch (error) {
        console.error('Error fetching total users count:', error)
      }
    }

    fetchTotalUsers()
  }, [])

  // Apply date range filter
  const applyDateRange = () => {
    if (startDate && endDate && onDateRangeChange) {
      onDateRangeChange(startDate, endDate)
      setShowDateRangePicker(false)
    }
  }

  // Clear date range filter
  const clearDateRange = () => {
    setStartDate("")
    setEndDate("")
    if (onDateRangeChange) {
      onDateRangeChange(null, null)
    }
    setShowDateRangePicker(false)
  }

  // Get today's date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const sortedDepartments = Array.isArray(availableDepartments)
    ? [...availableDepartments]
      .filter(dept => dept != null && dept !== "")
      .sort((a, b) => (a || "").localeCompare(b || ""))
    : []

  const sortedStaff = Array.isArray(availableStaff)
    ? [...availableStaff]
      .filter(staff => staff != null && staff !== "")
      .sort((a, b) => (a || "").localeCompare(b || ""))
    : []


  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between lg:justify-start gap-4">
        {userRole === "admin" && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              {/* <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total System</span> */}
              <span className="text-xs font-bold text-gray-600">Active Users</span>
            </div>
            <div className="w-10 h-10 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-green-600 font-bold text-lg">
                {totalUsersCount}
              </span>
            </div>
          </div>
        )}

        {/* Short divider on desktop */}
        <div className="hidden lg:block h-8 w-px bg-gray-100 mx-2"></div>

        <div className="flex flex-col lg:hidden">
          {/* <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Configuration</span> */}
          <span className="text-xs font-bold text-gray-600">Filters & View</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:flex lg:items-center lg:gap-2">
        {/* Date Range Filter */}
        {userRole === "admin" && (
          <div className="relative col-span-2 md:col-span-1">
            <button
              onClick={() => setShowDateRangePicker(!showDateRangePicker)}
              className={`w-full lg:w-[160px] rounded-lg border p-2 text-left bg-white transition-all text-xs font-bold ${startDate && endDate
                ? "border-red-200 bg-red-50/30 text-[#c41e3a]"
                : "border-gray-200 text-gray-500 hover:border-[#c41e3a]/30"
                }`}
            >
              <div className="truncate">
                {startDate && endDate ? `${startDate} - ${endDate}` : "Date Range"}
              </div>
            </button>

            {showDateRangePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] p-4 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      {/* <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Select Range</h3> */}
                      {startDate && endDate && (
                        <button onClick={clearDateRange} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase">Clear</button>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">From</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={endDate || getTodayDate()}
                          className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">To</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={getTodayDate()}
                        className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a] outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyDateRange}
                    disabled={!startDate || !endDate}
                    className="w-full bg-[#c41e3a] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#a11830] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <select
          value={dashboardType}
          onChange={(e) => setDashboardType(e.target.value)}
          className="rounded-lg border border-gray-200 p-2 text-xs font-bold text-gray-600 focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a] outline-none bg-white hover:border-[#c41e3a]/30 transition-all"
        >
          <option value="checklist">Checklist View</option>
          <option value="delegation">Delegation View</option>
        </select>

        {/* Department Filter - Only show for checklist */}
        {dashboardType === "checklist" && userRole === "admin" && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className={`rounded-lg border p-2 text-xs font-bold transition-all outline-none bg-white ${departmentFilter !== 'all' ? "border-red-200 bg-red-50/30 text-[#c41e3a]" : "border-gray-200 text-gray-600 focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a]"
              }`}
          >
            <option value="all">All Departments</option>
            {sortedDepartments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}

        {/* Dashboard Staff Filter */}
        {userRole === "admin" ? (
          <select
            value={dashboardStaffFilter}
            onChange={(e) => setDashboardStaffFilter(e.target.value)}
            className={`rounded-lg border p-2 text-xs font-bold transition-all outline-none bg-white ${dashboardStaffFilter !== 'all' ? "border-red-200 bg-red-50/30 text-[#c41e3a]" : "border-gray-200 text-gray-600 focus:ring-1 focus:ring-red-100 focus:border-[#c41e3a]"
              }`}
          >
            <option value="all">All Staff Members</option>
            {sortedStaff.map((staffName) => (
              <option key={staffName} value={staffName}>{staffName}</option>
            ))}
          </select>
        ) : (
          <div className="rounded-lg border border-gray-200 p-2 bg-gray-50 text-gray-500 text-xs font-bold flex items-center px-3">
            {username || "Current User"}
          </div>
        )}
      </div>

      {/* Backdrop for date picker */}
      {showDateRangePicker && (
        <div className="fixed inset-0 z-[90]" onClick={() => setShowDateRangePicker(false)} />
      )}
    </div>
  )
}
